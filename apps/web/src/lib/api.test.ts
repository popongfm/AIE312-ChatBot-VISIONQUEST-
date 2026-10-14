import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ChatStreamEvent } from '@vq/shared';
import { api, ApiRequestError } from './api';
import { __resetClientIdForTests, getClientId } from './clientId';

function sseResponse(chunks: string[], status = 200): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
  return new Response(body, { status, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('api', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    localStorage.clear();
    __resetClientIdForTests();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sendMessage reports completed=false when stream ends without done', async () => {
    fetchMock.mockResolvedValue(sseResponse(['event: token\ndata: {"text":"hi"}\n\n']));
    const events: ChatStreamEvent[] = [];
    const r = await api.sendMessage('c1', 'hello', (e) => events.push(e));
    expect(r).toEqual({ completed: false });
    expect(events).toEqual([{ type: 'token', text: 'hi' }]);
  });

  test('sendMessage completed=true on done and forwards events', async () => {
    fetchMock.mockResolvedValue(
      sseResponse([
        'event: token\ndata: {"text":"a"}\n\nevent: do',
        'ne\ndata: {"messageId":1,"citedMembers":[]}\n\n',
      ]),
    );
    const events: ChatStreamEvent[] = [];
    const r = await api.sendMessage('c1', 'hello', (e) => events.push(e));
    expect(r).toEqual({ completed: true });
    expect(events).toHaveLength(2);
  });

  test('sendMessage sends X-Client-Id and throws ApiRequestError on 429', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'TOO_MANY_REQUESTS', message: 'slow down' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const err = await api.sendMessage('c1', 'hello', () => {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err).toMatchObject({ status: 429, code: 'TOO_MANY_REQUESTS', message: 'slow down' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/conversations/c1/messages');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ content: 'hello' }));
    expect(init.headers).toMatchObject({
      'X-Client-Id': getClientId(),
      'Content-Type': 'application/json',
    });
  });

  test('non-OK response without JSON body gives HTTP_<status>', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 502 }));
    await expect(api.getPortfolio()).rejects.toMatchObject({ status: 502, code: 'HTTP_502' });
  });

  test('conversation calls send X-Client-Id; portfolio does not need it', async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    await api.listConversations();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'X-Client-Id': getClientId() });
  });

  test('abort propagates AbortError', async () => {
    const ac = new AbortController();
    fetchMock.mockImplementation((_u: string, init: RequestInit) =>
      Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError', signal: init.signal })),
    );
    ac.abort();
    await expect(api.sendMessage('c1', 'x', () => {}, ac.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
