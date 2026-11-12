import type { HistoryTurn } from '../../src/services/history';
import type { ChatModel } from '../../src/services/gemini';

/** What the route passed to the model on each call. */
export type ModelCall = { systemInstruction: string; history: HistoryTurn[]; signal?: AbortSignal };

/**
 * A scripted ChatModel: yields the strings in order and throws when it reaches an Error.
 * `'WAIT_FOR_ABORT'` pauses until the request's AbortSignal fires (to test a client hanging up mid-answer).
 */
export function fakeModel(script: (string | Error | 'WAIT_FOR_ABORT')[]): ChatModel & { calls: ModelCall[] } {
  const calls: ModelCall[] = [];
  return {
    calls,
    async *stream(args) {
      calls.push(args);
      for (const step of script) {
        if (step instanceof Error) throw step;
        if (step === 'WAIT_FOR_ABORT') {
          await new Promise<void>((resolve) => {
            if (args.signal?.aborted) resolve();
            args.signal?.addEventListener('abort', () => resolve(), { once: true });
          });
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }
        yield step;
      }
    },
  };
}
