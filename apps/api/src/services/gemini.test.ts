import { describe, expect, test } from 'vitest';
import { AiError, AiRateLimitError, createGeminiModel, type GenerateStream } from './gemini.js';

type Call = Parameters<GenerateStream>[0];
type Step = (string | undefined)[] | { throwBefore: unknown } | { chunks: (string | undefined)[]; throwAfter: unknown };

const rateLimit = () => Object.assign(new Error('quota'), { status: 429 });

function fake(calls: Call[], steps: Step[]): GenerateStream {
  return async (req) => {
    calls.push(req);
    const step = steps[calls.length - 1]!;
    if ('throwBefore' in step) throw step.throwBefore;
    const chunks = Array.isArray(step) ? step : step.chunks;
    const after = Array.isArray(step) ? undefined : step.throwAfter;
    return (async function* () {
      for (const text of chunks) yield { text };
      if (after) throw after;
    })();
  };
}

async function collect(it: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const c of it) out.push(c);
  return out;
}

const args = { systemInstruction: 'S', history: [{ role: 'user' as const, text: 'hi' }] };

describe('createGeminiModel', () => {
  test('maps history to gemini contents and yields text', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [['สวัส', 'ดี']]) });
    expect(await collect(m.stream(args))).toEqual(['สวัส', 'ดี']);
    expect(calls[0]).toMatchObject({
      model: 'main',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      config: { systemInstruction: 'S' },
    });
  });

  test('429 on main → uses fallback', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({
      model: 'main',
      fallbackModel: 'lite',
      generate: fake(calls, [{ throwBefore: rateLimit() }, ['ok']]),
    });
    expect(await collect(m.stream(args))).toEqual(['ok']);
    expect(calls.map((c) => c.model)).toEqual(['main', 'lite']);
  });

  test('429 while iterating before first text → uses fallback', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({
      model: 'main',
      fallbackModel: 'lite',
      generate: fake(calls, [{ chunks: ['', undefined], throwAfter: rateLimit() }, ['ok']]),
    });
    expect(await collect(m.stream(args))).toEqual(['ok']);
    expect(calls.map((c) => c.model)).toEqual(['main', 'lite']);
  });

  test('429 on both → AiRateLimitError', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({
      model: 'main',
      fallbackModel: 'lite',
      generate: fake(calls, [{ throwBefore: rateLimit() }, { throwBefore: rateLimit() }]),
    });
    await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiRateLimitError);
    expect(calls).toHaveLength(2);
  });

  test('429 without fallback → AiRateLimitError, one call', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [{ throwBefore: rateLimit() }]) });
    await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiRateLimitError);
    expect(calls).toHaveLength(1);
  });

  test('500 → AiError with cause, no fallback', async () => {
    const calls: Call[] = [];
    const boom = Object.assign(new Error('boom'), { status: 500 });
    const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake(calls, [{ throwBefore: boom }]) });
    const err = await collect(m.stream(args)).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err).not.toBeInstanceOf(AiRateLimitError);
    expect(err.name).toBe('AiError');
    expect(err.cause).toBe(boom);
    expect(calls).toHaveLength(1);
  });

  test('429 after first chunk → AiError, no fallback call', async () => {
    const calls: Call[] = [];
    const m = createGeminiModel({
      model: 'main',
      fallbackModel: 'lite',
      generate: fake(calls, [{ chunks: ['a'], throwAfter: rateLimit() }, ['never']]),
    });
    const got: string[] = [];
    const err = await (async () => {
      try {
        for await (const c of m.stream(args)) got.push(c);
      } catch (e) {
        return e;
      }
    })();
    expect(got).toEqual(['a']);
    expect(err).toBeInstanceOf(AiError);
    expect(err).not.toBeInstanceOf(AiRateLimitError);
    expect(calls).toHaveLength(1);
  });

  test('empty and undefined chunks are skipped', async () => {
    const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake([], [['', 'a', undefined, 'b']]) });
    expect(await collect(m.stream(args))).toEqual(['a', 'b']);
  });

  test('aborted signal → original error rethrown unwrapped', async () => {
    const ac = new AbortController();
    const abortErr = new Error('aborted');
    const generate: GenerateStream = async () => {
      ac.abort();
      throw abortErr;
    };
    const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate });
    await expect(collect(m.stream({ ...args, signal: ac.signal }))).rejects.toBe(abortErr);
  });

  test('passes abortSignal through to generate config', async () => {
    const calls: Call[] = [];
    const ac = new AbortController();
    const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [['x']]) });
    await collect(m.stream({ ...args, signal: ac.signal }));
    expect(calls[0].config.abortSignal).toBe(ac.signal);
  });
});
