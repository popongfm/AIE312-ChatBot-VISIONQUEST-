import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ChatStreamEvent } from '@vq/shared';
import { api, ApiRequestError } from '../lib/api';
import { useChat } from './useChat';

vi.mock('../lib/api', async () => (await import('../test/mockApi')).mockApiModule());

const m = vi.mocked(api);
type OnEvent = (e: ChatStreamEvent) => void;

beforeEach(() => {
  vi.resetAllMocks();
  m.listConversations.mockResolvedValue([]);
  m.createConversation.mockResolvedValue({ id: 'c1', title: 'New', createdAt: '2026-10-14' });
});

async function setup() {
  const hook = renderHook(() => useChat());
  await waitFor(() => expect(hook.result.current.listLoaded).toBe(true));
  return hook;
}

describe('useChat', () => {
  test('loads conversations on mount without selecting', async () => {
    m.listConversations.mockResolvedValue([{ id: 'a', title: 'A', createdAt: 'x' }]);
    const { result } = await setup();
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeId).toBeNull();
  });

  test('select loads messages', async () => {
    m.getMessages.mockResolvedValue([
      { id: 1, role: 'user', content: 'q', citedMembers: [], createdAt: 'x' },
      { id: 2, role: 'model', content: 'a', citedMembers: ['mickie'], createdAt: 'x' },
    ]);
    const { result } = await setup();
    await act(() => result.current.select('c9'));
    expect(result.current.activeId).toBe('c9');
    expect(result.current.messages.map((x) => x.key)).toEqual(['m-1', 'm-2']);
    expect(result.current.messages[1]?.citedMembers).toEqual(['mickie']);
  });

  test('send creates a conversation, streams tokens, and stores the model message', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'token', text: 'สวัส' });
      on({ type: 'token', text: 'ดี' });
      on({ type: 'done', messageId: 5, citedMembers: ['mickie'] });
      return { completed: true };
    });
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    expect(m.createConversation).toHaveBeenCalledTimes(1);
    expect(m.sendMessage.mock.calls[0]?.[0]).toBe('c1');
    expect(result.current.activeId).toBe('c1');
    expect(result.current.messages.map((x) => [x.role, x.content])).toEqual([
      ['user', 'hi'],
      ['model', 'สวัสดี'],
    ]);
    expect(result.current.messages[1]?.citedMembers).toEqual(['mickie']);
    expect(result.current.streamingText).toBeNull();
    expect(result.current.busy).toBe(false);
    expect(m.listConversations).toHaveBeenCalledTimes(2); // refreshed after first message
  });

  test('streamingText accumulates while busy', async () => {
    let finish!: () => void;
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'token', text: 'ab' });
      await new Promise<void>((r) => (finish = r));
      return { completed: true };
    });
    const { result } = await setup();
    let p!: Promise<void>;
    act(() => {
      p = result.current.send('hi');
    });
    await waitFor(() => expect(result.current.streamingText).toBe('ab'));
    expect(result.current.busy).toBe(true);
    await act(async () => {
      finish();
      await p;
    });
    expect(result.current.busy).toBe(false);
  });

  test('ignores empty input and sends while busy', async () => {
    m.sendMessage.mockImplementation(() => new Promise(() => {}));
    const { result } = await setup();
    await act(() => result.current.send('   '));
    expect(m.sendMessage).not.toHaveBeenCalled();
    act(() => {
      void result.current.send('one');
    });
    await waitFor(() => expect(m.sendMessage).toHaveBeenCalledTimes(1));
    await act(() => result.current.send('two'));
    expect(m.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('stream without done shows connection-lost message and unlocks input', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'token', text: 'ครึ่ง' });
      return { completed: false };
    });
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    const last = result.current.messages.at(-1);
    expect(last).toMatchObject({ role: 'error', content: 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง' });
    expect(result.current.busy).toBe(false);
    expect(result.current.streamingText).toBeNull();
  });

  test('thrown network error shows connection-lost message', async () => {
    m.sendMessage.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    expect(result.current.messages.at(-1)?.content).toBe('การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง');
    expect(result.current.busy).toBe(false);
  });

  test('RATE_LIMITED event shows fixed Thai copy', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'error', code: 'RATE_LIMITED', message: 'ignored' });
      return { completed: true };
    });
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    expect(result.current.messages.at(-1)).toMatchObject({
      role: 'error',
      content: 'AI คิวเต็ม ลองใหม่ในอีกสักครู่',
    });
  });

  test('AI_ERROR event shows fixed Thai copy', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'error', code: 'AI_ERROR', message: 'ignored' });
      return { completed: true };
    });
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    expect(result.current.messages.at(-1)?.content).toBe('Oracle ขัดข้อง ลองใหม่อีกครั้ง');
  });

  test('HTTP 429 shows too-frequent copy', async () => {
    m.sendMessage.mockRejectedValue(new ApiRequestError(429, 'RATE_LIMITED', 'slow down'));
    const { result } = await setup();
    await act(() => result.current.send('hi'));
    expect(result.current.messages.at(-1)).toMatchObject({
      role: 'error',
      content: 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่',
    });
    expect(result.current.busy).toBe(false);
  });

  test('newConversation prepends, activates and clears messages', async () => {
    m.listConversations.mockResolvedValue([{ id: 'a', title: 'A', createdAt: 'x' }]);
    const { result } = await setup();
    let id = '';
    await act(async () => {
      id = await result.current.newConversation();
    });
    expect(id).toBe('c1');
    expect(result.current.conversations.map((c) => c.id)).toEqual(['c1', 'a']);
    expect(result.current.activeId).toBe('c1');
    expect(result.current.messages).toEqual([]);
  });

  test('aborts the in-flight request on unmount', async () => {
    let signal: AbortSignal | undefined;
    m.sendMessage.mockImplementation((_i, _c, _on, s) => {
      signal = s;
      return new Promise(() => {});
    });
    const { result, unmount } = await setup();
    act(() => {
      void result.current.send('hi');
    });
    await waitFor(() => expect(signal).toBeDefined());
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
