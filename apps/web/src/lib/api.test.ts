import type { ChatStreamEvent } from '@vq/shared';
import { afterEach, expect, test, vi } from 'vitest';
import { ApiRequestError, api } from './api';
import { getClientId } from './clientId';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(enc.encode(chunk));
      c.close();
    },
  });
}
const sse = (...chunks: string[]) => new Response(streamOf(...chunks), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

test('sendMessage streams events and reports completed=true after done', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => sse('event: token\ndata: {"text":"สวัส', 'ดี"}\n\nevent: done\ndata: {"messageId":3,"citedMembers":[]}\n\n')));
  const got: ChatStreamEvent[] = [];
  const result = await api.sendMessage('c1', 'hi', (e) => got.push(e));
  expect(result).toEqual({ completed: true });
  expect(got).toEqual([{ type: 'token', text: 'สวัสดี' }, { type: 'done', messageId: 3, citedMembers: [] }]);
});

test('sendMessage reports completed=false when stream ends without done', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => sse('event: token\ndata: {"text":"ครึ่ง"}\n\n')));
  const got: ChatStreamEvent[] = [];
  expect(await api.sendMessage('c1', 'hi', (e) => got.push(e))).toEqual({ completed: false });
  expect(got).toEqual([{ type: 'token', text: 'ครึ่ง' }]);
});

test('sendMessage sends X-Client-Id and throws ApiRequestError on 429', async () => {
  const fetchMock = vi.fn(async () => json(429, { error: { code: 'TOO_MANY_REQUESTS', message: 'ช้าลงหน่อย' } }));
  vi.stubGlobal('fetch', fetchMock);
  const err = await api.sendMessage('c1', 'hi', () => {}).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiRequestError);
  expect(err).toMatchObject({ status: 429, code: 'TOO_MANY_REQUESTS', message: 'ช้าลงหน่อย' });
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('/api/conversations/c1/messages');
  expect(init.method).toBe('POST');
  expect(new Headers(init.headers).get('X-Client-Id')).toBe(getClientId());
  expect(JSON.parse(init.body as string)).toEqual({ content: 'hi' });
});

test('createConversation posts the first message', async () => {
  const fetchMock = vi.fn(async () => json(201, { id: 'c9', title: 'สวัสดี', createdAt: '2026-11-13T00:00:00Z' }));
  vi.stubGlobal('fetch', fetchMock);
  expect(await api.createConversation('สวัสดี')).toMatchObject({ id: 'c9', title: 'สวัสดี' });
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('/api/conversations');
  expect(JSON.parse(init.body as string)).toEqual({ firstMessage: 'สวัสดี' });
});

test('getPortfolio needs no client id; a non-JSON failure still becomes ApiRequestError', async () => {
  const fetchMock = vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 }));
  vi.stubGlobal('fetch', fetchMock);
  const err = await api.getPortfolio().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiRequestError);
  expect(err).toMatchObject({ status: 502, code: 'HTTP_502' });
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit | undefined];
  expect(new Headers(init?.headers).has('X-Client-Id')).toBe(false);
});

test('deleteConversation resolves on 204', async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(api.deleteConversation('c1')).resolves.toBeUndefined();
  expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].method).toBe('DELETE');
});
