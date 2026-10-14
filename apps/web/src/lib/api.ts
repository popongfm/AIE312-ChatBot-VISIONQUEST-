import type { ApiErrorBody, ChatStreamEvent, Conversation, Message, Portfolio } from '@vq/shared';
import { getClientId } from './clientId';
import { createSseParser } from './sse';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function toError(res: Response): Promise<ApiRequestError> {
  try {
    const body = (await res.json()) as Partial<ApiErrorBody>;
    if (body?.error?.code && body.error.message) {
      return new ApiRequestError(res.status, body.error.code, body.error.message);
    }
  } catch {
    // fall through
  }
  return new ApiRequestError(res.status, `HTTP_${res.status}`, `HTTP ${res.status}`);
}

function clientHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'X-Client-Id': getClientId(), ...extra };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, init);
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export const api = {
  getHealth: () => request<{ ok: boolean; version: string }>('/health'),
  getPortfolio: () => request<Portfolio>('/portfolio'),
  listConversations: () => request<Conversation[]>('/conversations', { headers: clientHeaders() }),
  createConversation: () =>
    request<Conversation>('/conversations', { method: 'POST', headers: clientHeaders() }),
  getMessages: (id: string) =>
    request<Message[]>(`/conversations/${encodeURIComponent(id)}/messages`, {
      headers: clientHeaders(),
    }),

  async sendMessage(
    id: string,
    content: string,
    onEvent: (e: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<{ completed: boolean }> {
    const res = await fetch(`${BASE_URL}/api/conversations/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      headers: clientHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content }),
      signal,
    });
    if (!res.ok) throw await toError(res);
    if (!res.body) return { completed: false };

    let completed = false;
    const parser = createSseParser((e) => {
      if (e.type === 'done' || e.type === 'error') completed = true;
      onEvent(e);
    });
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
