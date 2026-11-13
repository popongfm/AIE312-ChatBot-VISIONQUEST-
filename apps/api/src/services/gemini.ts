import { GoogleGenAI } from '@google/genai';
import type { Role } from '@vq/shared';
import type { HistoryTurn } from './history';

export interface ChatModel {
  /**
   * `onRestart` is called when a transient failure hits after text was already yielded and the answer is
   * about to be generated again from the start: the caller must drop what it has so far. Without it,
   * a mid-stream failure is final (two half-answers are never stitched together).
   */
  stream(args: {
    systemInstruction: string; history: HistoryTurn[]; signal?: AbortSignal; onRestart?: () => void;
  }): AsyncIterable<string>;
}

/** Gemini returned 429 on every attempt (free-tier quota). */
export class AiRateLimitError extends Error {}
/** Any other model failure, including errors after streaming started. */
export class AiError extends Error {}

export type GenerateStream = (req: {
  model: string;
  contents: { role: Role; parts: { text: string }[] }[];
  config: { systemInstruction: string; abortSignal?: AbortSignal };
}) => Promise<AsyncIterable<{ text?: string }>>;

const statusOf = (e: unknown): unknown => (typeof e === 'object' && e !== null ? (e as { status?: unknown }).status : undefined);
const isRateLimit = (e: unknown) => statusOf(e) === 429;
/** Quota (429) or Google-side overload/outage (500, 503 "model is experiencing high demand", 504): worth another try. */
const isTransient = (e: unknown) => [429, 500, 503, 504].includes(statusOf(e) as number);

const defaultSleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });

export function createGeminiModel(opts: {
  model: string;
  fallbackModel: string | null;
  generate: GenerateStream;
  /** Wait before attempt n (n ≥ 1). Defaults to 0.8s, 2s, ... */
  backoffMs?: number[];
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}): ChatModel {
  // main → fallback → main again; with no fallback: main three times.
  const attempts = opts.fallbackModel ? [opts.model, opts.fallbackModel, opts.model] : [opts.model, opts.model, opts.model];
  const backoff = opts.backoffMs ?? [0, 800, 2000];
  const sleep = opts.sleep ?? defaultSleep;
  return {
    async *stream({ systemInstruction, history, signal, onRestart }) {
      const contents = history.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
      for (let i = 0; i < attempts.length; i++) {
        if (i > 0) {
          await sleep(backoff[i] ?? backoff[backoff.length - 1], signal);
          if (signal?.aborted) throw new AiError('aborted');
        }
        let started = false;
        try {
          const chunks = await opts.generate({
            model: attempts[i],
            contents,
            config: { systemInstruction, ...(signal ? { abortSignal: signal } : {}) },
          });
          for await (const chunk of chunks) {
            if (!chunk.text) continue;
            started = true;
            yield chunk.text;
          }
          return;
        } catch (e) {
          const last = i === attempts.length - 1;
          const canRetry = isTransient(e) && !signal?.aborted && (!started || onRestart !== undefined);
          if (canRetry && !last) {
            console.warn(`Gemini ${attempts[i]} failed (status ${String(statusOf(e))}${started ? ', mid-stream' : ''}); retrying with ${attempts[i + 1]}`);
            if (started) onRestart!();
            continue;
          }
          if (!started && isRateLimit(e)) {
            throw new AiRateLimitError(`Gemini rate limited (${attempts.slice(0, i + 1).join(' → ')})`, { cause: e });
          }
          throw new AiError(`Gemini failed on ${attempts[i]}`, { cause: e });
        }
      }
    },
  };
}

/** Real SDK call. Kept separate so tests never touch the network. */
export function genaiGenerate(apiKey: string): GenerateStream {
  const ai = new GoogleGenAI({ apiKey });
  return (req) => ai.models.generateContentStream(req);
}
