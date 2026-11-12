import type { ApiErrorBody, ChatStreamEvent, Conversation, Message, Portfolio } from '@vq/shared';
import { getClientId } from './clientId';
import { createSseParser } from './sse';

/** Empty in production and in `npm run dev`: the API is on the same origin (or behind the Vite proxy). */
const BASE: string = import.meta.env.VITE_API_URL ?? '';

export interface Health { status: string; db: string; version?: string }

/** A response the API answered with an error status. `code` is the API's error code, e.g. NOT_SEEDED. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function errorFrom(res: Response): Promise<ApiRequestError> {
  try {
    const body = (await res.json()) as Partial<ApiErrorBody>;
    if (body.error?.code) return new ApiRequestError(res.status, body.error.code, body.error.message ?? '');
  } catch {
    // Not JSON (a proxy error page, for example): fall through to a generic error.
  }
  return new ApiRequestError(res.status, `HTTP_${res.status}`, `คำขอไม่สำเร็จ (${res.status})`);
}

interface Options { method?: string; body?: unknown; withClientId?: boolean; signal?: AbortSignal }

async function request(path: string, { method = 'GET', body, withClientId = false, signal }: Options = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (withClientId) headers['X-Client-Id'] = getClientId();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await errorFrom(res);
  return res;
}

const getJson = async <T>(path: string, options?: Options): Promise<T> => (await request(path, options)).json() as Promise<T>;

export const api = {
  getHealth: () => getJson<Health>('/api/health'),
  getPortfolio: () => getJson<Portfolio>('/api/portfolio'),
  listConversations: () => getJson<Conversation[]>('/api/conversations', { withClientId: true }),
  /** The API names a conversation after its first message, so one is created only when there is something to send. */
  createConversation: (firstMessage: string) =>
    getJson<Conversation>('/api/conversations', { method: 'POST', body: { firstMessage }, withClientId: true }),
  getMessages: (id: string) => getJson<Message[]>(`/api/conversations/${id}/messages`, { withClientId: true }),
  deleteConversation: async (id: string): Promise<void> => {
    await request(`/api/conversations/${id}`, { method: 'DELETE', withClientId: true });
  },
  /**
   * Sends a question and calls `onEvent` for each piece of the streamed answer.
   * `completed` is true only when the stream finished properly with a `done` or `error` event.
   */
  async sendMessage(
    id: string,
    content: string,
    onEvent: (e: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<{ completed: boolean }> {
    const res = await request(`/api/conversations/${id}/messages`, { method: 'POST', body: { content }, withClientId: true, signal });
    let completed = false;
    const parser = createSseParser((e) => {
      if (e.type === 'done' || e.type === 'error') completed = true;
      onEvent(e);
    });
    if (!res.body) return { completed };
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    parser.push(decoder.decode());
    return { completed };
  },
};
