import type { ChatStreamEvent, Conversation } from '@vq/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ApiRequestError, api } from '../lib/api';
import { useChat } from './useChat';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    api: {
      getHealth: vi.fn(), getPortfolio: vi.fn(), listConversations: vi.fn(), createConversation: vi.fn(),
      getMessages: vi.fn(), deleteConversation: vi.fn(), sendMessage: vi.fn(),
    },
  };
});
const mocked = vi.mocked(api);
type OnEvent = (e: ChatStreamEvent) => void;
const conv = (id: string, title = 'แชต'): Conversation => ({ id, title, createdAt: '2026-11-13T00:00:00Z' });

beforeEach(() => {
  vi.resetAllMocks();
  mocked.listConversations.mockResolvedValue([]);
  mocked.createConversation.mockResolvedValue(conv('c1', 'ทีมนี้ถนัดอะไร'));
});

async function ready() {
  const hook = renderHook(() => useChat());
  await waitFor(() => expect(mocked.listConversations).toHaveBeenCalled());
  return hook;
}

test('first send creates the conversation from that message, then streams the answer into a model message', async () => {
  mocked.sendMessage.mockImplementation(async (_id: string, _c: string, on: OnEvent) => {
    on({ type: 'token', text: 'ทีมเรา' });
    on({ type: 'token', text: 'ถนัด AI' });
    on({ type: 'done', messageId: 9, citedMembers: ['mickie'] });
    return { completed: true };
  });
  const { result } = await ready();
  await act(() => result.current.send('  ทีมนี้ถนัดอะไร  '));

  expect(mocked.createConversation).toHaveBeenCalledWith('ทีมนี้ถนัดอะไร');
  expect(mocked.sendMessage.mock.calls[0].slice(0, 2)).toEqual(['c1', 'ทีมนี้ถนัดอะไร']);
  expect(result.current.activeId).toBe('c1');
  expect(result.current.conversations.map((c) => c.id)).toEqual(['c1']);
  expect(result.current.messages.map((m) => [m.role, m.content, m.citedMembers])).toEqual([
    ['user', 'ทีมนี้ถนัดอะไร', []],
    ['model', 'ทีมเราถนัด AI', ['mickie']],
  ]);
  expect(result.current.streamingText).toBeNull();
  expect(result.current.busy).toBe(false);
});

test('stream without done shows connection-lost message and unlocks input', async () => { // Review Focus #2
  mocked.sendMessage.mockImplementation(async (_i: string, _c: string, on: OnEvent) => {
    on({ type: 'token', text: 'ครึ่ง' });
    return { completed: false };
  });
  const { result } = await ready();
  await act(() => result.current.send('hi'));
  expect(result.current.messages.at(-1)).toMatchObject({ role: 'error', content: 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง' });
  expect(result.current.messages.some((m) => m.role === 'model' && m.content === 'ครึ่ง')).toBe(true);
  expect(result.current.streamingText).toBeNull();
  expect(result.current.busy).toBe(false);
});

test('a network failure while sending shows the connection-lost message', async () => {
  mocked.sendMessage.mockRejectedValue(new TypeError('Failed to fetch'));
  const { result } = await ready();
  await act(() => result.current.send('hi'));
  expect(result.current.messages.at(-1)).toMatchObject({ role: 'error', content: 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง' });
  expect(result.current.busy).toBe(false);
});

test('RATE_LIMITED event shows fixed Thai copy', async () => {
  mocked.sendMessage.mockImplementation(async (_i: string, _c: string, on: OnEvent) => {
    on({ type: 'error', code: 'RATE_LIMITED', message: 'whatever the server says' });
    return { completed: true };
  });
  const { result } = await ready();
  await act(() => result.current.send('hi'));
  expect(result.current.messages.at(-1)).toMatchObject({ role: 'error', content: 'AI คิวเต็ม ลองใหม่ในอีกสักครู่' });
  expect(result.current.busy).toBe(false);
});

test('HTTP 429 shows the slow-down copy', async () => {
  mocked.sendMessage.mockRejectedValue(new ApiRequestError(429, 'TOO_MANY_REQUESTS', 'x'));
  const { result } = await ready();
  await act(() => result.current.send('hi'));
  expect(result.current.messages.at(-1)).toMatchObject({ role: 'error', content: 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่' });
  expect(result.current.busy).toBe(false);
});

test('select loads that conversation; a second send reuses it', async () => {
  mocked.listConversations.mockResolvedValue([conv('c7', 'เก่า')]);
  mocked.getMessages.mockResolvedValue([
    { id: 1, role: 'user', content: 'ถาม', citedMembers: [], createdAt: '' },
    { id: 2, role: 'model', content: 'ตอบ', citedMembers: ['mickie'], createdAt: '' },
  ]);
  mocked.sendMessage.mockResolvedValue({ completed: true });
  const { result } = await ready();
  await act(() => result.current.select('c7'));
  expect(result.current.messages.map((m) => m.content)).toEqual(['ถาม', 'ตอบ']);
  await act(() => result.current.send('ต่อ'));
  expect(mocked.createConversation).not.toHaveBeenCalled();
  expect(mocked.sendMessage.mock.calls[0][0]).toBe('c7');
});

test('newConversation clears the screen without calling the API; remove deletes and clears the active one', async () => {
  mocked.listConversations.mockResolvedValue([conv('c7')]);
  mocked.getMessages.mockResolvedValue([{ id: 1, role: 'user', content: 'ถาม', citedMembers: [], createdAt: '' }]);
  mocked.deleteConversation.mockResolvedValue(undefined);
  const { result } = await ready();
  await act(() => result.current.select('c7'));
  act(() => result.current.newConversation());
  expect(result.current.activeId).toBeNull();
  expect(result.current.messages).toEqual([]);
  expect(mocked.createConversation).not.toHaveBeenCalled();

  await act(() => result.current.select('c7'));
  await act(() => result.current.remove('c7'));
  expect(mocked.deleteConversation).toHaveBeenCalledWith('c7');
  expect(result.current.conversations).toEqual([]);
  expect(result.current.activeId).toBeNull();
});

test('empty input and sends while busy are ignored', async () => {
  let finish: (v: { completed: boolean }) => void = () => {};
  mocked.sendMessage.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const { result } = await ready();
  await act(() => result.current.send('   '));
  expect(mocked.sendMessage).not.toHaveBeenCalled();

  let first: Promise<void> = Promise.resolve();
  act(() => { first = result.current.send('หนึ่ง'); });
  await waitFor(() => expect(mocked.sendMessage).toHaveBeenCalledTimes(1));
  expect(result.current.busy).toBe(true);
  await act(() => result.current.send('สอง'));
  expect(mocked.sendMessage).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ completed: true }); await first; });
});
