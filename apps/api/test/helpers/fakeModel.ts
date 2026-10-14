import type { ChatModel } from '../../src/services/gemini';
import type { HistoryTurn } from '../../src/services/history';

export type FakeCall = { systemInstruction: string; history: HistoryTurn[] };

/** Each stream() call replays the whole script; an Error entry is thrown when reached. */
export function fakeModel(script: (string | Error)[]): ChatModel & { calls: FakeCall[] } {
  const calls: FakeCall[] = [];
  return {
    calls,
    async *stream({ systemInstruction, history }) {
      calls.push({ systemInstruction, history });
      for (const item of script) {
        if (item instanceof Error) throw item;
        yield item;
      }
    },
  };
}
