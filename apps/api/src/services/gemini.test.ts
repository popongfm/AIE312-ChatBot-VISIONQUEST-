import { expect, test } from 'vitest';
import { AiError, AiRateLimitError, createGeminiModel, type GenerateStream } from './gemini';

type Step = string[] | Error | { failAfter: string[]; error: Error };
const status = (s: number) => Object.assign(new Error(`HTTP ${s}`), { status: s });

/** Fake generate: each call consumes the next scripted step. */
function fake(calls: Parameters<GenerateStream>[0][], steps: Step[]): GenerateStream {
  return async (req) => {
    calls.push(req);
    const step = steps.shift()!;
    if (step instanceof Error) throw step;
    const chunks = Array.isArray(step) ? step : step.failAfter;
    return (async function* () {
      for (const text of chunks) yield { text };
      if (!Array.isArray(step)) throw step.error;
    })();
  };
}
async function collect(it: AsyncIterable<string>) { const out: string[] = []; for await (const s of it) out.push(s); return out; }
const args = { systemInstruction: 'S', history: [{ role: 'user' as const, text: 'hi' }] };

test('maps history to gemini contents and yields text', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [['สวัส', 'ดี']]) });
  expect(await collect(m.stream(args))).toEqual(['สวัส', 'ดี']);
  expect(calls[0]).toMatchObject({ model: 'main', contents: [{ role: 'user', parts: [{ text: 'hi' }] }], config: { systemInstruction: 'S' } });
});
test('empty text chunks are skipped', async () => {
  const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake([], [['', 'a', '']]) });
  expect(await collect(m.stream(args))).toEqual(['a']);
});
test('429 on main → uses fallback', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake(calls, [status(429), ['ok']]) });
  expect(await collect(m.stream(args))).toEqual(['ok']);
  expect(calls.map((c) => c.model)).toEqual(['main', 'lite']);
});
test('429 thrown mid-iteration before first chunk also falls back', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake(calls, [{ failAfter: [''], error: status(429) }, ['ok']]) });
  expect(await collect(m.stream(args))).toEqual(['ok']);
  expect(calls).toHaveLength(2);
});
test('429 on both → AiRateLimitError', async () => {
  const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake([], [status(429), status(429)]) });
  await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiRateLimitError);
});
test('429 without fallback → AiRateLimitError, one call', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [status(429)]) });
  await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiRateLimitError);
  expect(calls).toHaveLength(1);
});
test('500 → AiError, no fallback', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake(calls, [status(500)]) });
  await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiError);
  expect(calls).toHaveLength(1);
});
test('429 after first chunk → AiError, no fallback', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const m = createGeminiModel({ model: 'main', fallbackModel: 'lite', generate: fake(calls, [{ failAfter: ['half'], error: status(429) }]) });
  await expect(collect(m.stream(args))).rejects.toBeInstanceOf(AiError);
  expect(calls).toHaveLength(1);
});
test('abort signal is passed through to the SDK config', async () => {
  const calls: Parameters<GenerateStream>[0][] = [];
  const ac = new AbortController();
  const m = createGeminiModel({ model: 'main', fallbackModel: null, generate: fake(calls, [['x']]) });
  await collect(m.stream({ ...args, signal: ac.signal }));
  expect(calls[0].config.abortSignal).toBe(ac.signal);
});
