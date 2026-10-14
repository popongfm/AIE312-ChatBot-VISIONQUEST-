import { GoogleGenAI } from '@google/genai';
import type { Role } from '@vq/shared';
import type { HistoryTurn } from './history.js';

export interface ChatModel {
  stream(args: { systemInstruction: string; history: HistoryTurn[]; signal?: AbortSignal }): AsyncIterable<string>;
}

export class AiRateLimitError extends Error {
  override name = 'AiRateLimitError';
  constructor(message = 'AI rate limit exceeded', options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, AiRateLimitError.prototype);
  }
}

export class AiError extends Error {
  override name = 'AiError';
  constructor(message = 'AI request failed', options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, AiError.prototype);
  }
}

export type GenerateStream = (req: {
  model: string;
  contents: { role: Role; parts: { text: string }[] }[];
  config: { systemInstruction: string; abortSignal?: AbortSignal };
}) => Promise<AsyncIterable<{ text?: string }>>;

const isRateLimit = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { status?: unknown }).status === 429;

export function createGeminiModel(opts: {
  model: string;
  fallbackModel: string | null;
  generate: GenerateStream;
}): ChatModel {
  return {
    async *stream({ systemInstruction, history, signal }) {
      const contents = history.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
      const models = opts.fallbackModel ? [opts.model, opts.fallbackModel] : [opts.model];

      for (let i = 0; i < models.length; i++) {
        let yielded = false;
        try {
          const chunks = await opts.generate({
            model: models[i]!,
            contents,
            config: { systemInstruction, abortSignal: signal },
          });
          for await (const chunk of chunks) {
            if (!chunk.text) continue;
            yielded = true;
            yield chunk.text;
          }
          return;
        } catch (err) {
          if (signal?.aborted) throw err;
          if (isRateLimit(err) && !yielded) {
            if (i + 1 < models.length) continue;
            throw new AiRateLimitError(undefined, { cause: err });
          }
          throw new AiError(undefined, { cause: err });
        }
      }
    },
  };
}

export function genaiGenerate(apiKey: string): GenerateStream {
  const ai = new GoogleGenAI({ apiKey });
  return (req) => ai.models.generateContentStream(req);
}
