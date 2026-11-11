import type { ChatModel } from '../../src/services/gemini';

/** Stand-in for Gemini in tests: always answers "ok" and never touches the network. */
export const fakeChatModel: ChatModel = {
  async *stream() {
    yield 'ok';
  },
};
