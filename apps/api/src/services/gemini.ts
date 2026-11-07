import { GoogleGenAI } from '@google/genai';
import type { Role } from '@vq/shared';
import type { HistoryTurn } from './history';

export interface ChatModel {
  stream(args: { systemInstruction: string; history: HistoryTurn[]; signal?: AbortSignal }): AsyncIterable<string>;
}

/** Gemini returned 429 on every model we tried (free-tier quota). */
export class AiRateLimitError extends Error {}
/** Any other model failure, including errors after streaming started. */
export class AiError extends Error {}

export type GenerateStream = (req: {
  model: string;
  contents: { role: Role; parts: { text: string }[] }[];
  config: { systemInstruction: string; abortSignal?: AbortSignal };
}) => Promise<AsyncIterable<{ text?: string }>>;

const isRateLimit = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { status?: unknown }).status === 429;

export function createGeminiModel(opts: { model: string; fallbackModel: string | null; generate: GenerateStream }): ChatModel {
  const models = opts.fallbackModel ? [opts.model, opts.fallbackModel] : [opts.model];
  return {
    async *stream({ systemInstruction, history, signal }) {
      const contents = history.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
      for (let i = 0; i < models.length; i++) {
        let started = false;
        try {
          const chunks = await opts.generate({
            model: models[i],
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
          // Only a 429 before any text reached the user may be retried; otherwise the answer would be stitched from two models.
          if (!started && isRateLimit(e)) {
            if (i < models.length - 1) continue;
            throw new AiRateLimitError(`Gemini rate limited (${models.join(' → ')})`, { cause: e });
          }
          throw new AiError(`Gemini failed on ${models[i]}`, { cause: e });
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
