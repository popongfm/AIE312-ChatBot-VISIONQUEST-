import { vi } from 'vitest';

/** Factory for `vi.mock('../lib/api', ...)`: mocks `api`, keeps the real `ApiRequestError`. */
export async function mockApiModule() {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: {
      getHealth: vi.fn(),
      getPortfolio: vi.fn(),
      listConversations: vi.fn(),
      createConversation: vi.fn(),
      getMessages: vi.fn(),
      sendMessage: vi.fn(),
    },
  };
}
