import { CHAT_ERROR_COPY, type ChatStreamEvent, type Conversation, type Message } from '@vq/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, api } from '../lib/api';

export type UiMessage = { key: string; role: 'user' | 'model' | 'error'; content: string; citedMembers: string[] };

export const TOO_FAST_COPY = 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่';
export const CONNECTION_LOST_COPY = 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง';

const fromApi = (m: Message): UiMessage => ({ key: `m${m.id}`, role: m.role, content: m.content, citedMembers: m.citedMembers });

export interface Chat {
  conversations: Conversation[];
  activeId: string | null;
  messages: UiMessage[];
  /** null: nothing is streaming. '': waiting for the first token. Otherwise the answer so far. */
  streamingText: string | null;
  busy: boolean;
  select(id: string): Promise<void>;
  /** Clears the screen for a new conversation. It is saved once its first message is sent. */
  newConversation(): void;
  remove(id: string): Promise<void>;
  send(content: string): Promise<void>;
}

export function useChat(): Chat {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Refs hold the latest values for async code that outlives a render.
  const activeIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const nextKey = useRef(0);
  const localKey = () => `local${nextKey.current++}`;

  const setActive = (id: string | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  };

  useEffect(() => {
    let cancelled = false;
    api.listConversations().then(
      (list) => { if (!cancelled) setConversations(list); },
      () => { /* The list is a convenience: chatting still works without it. */ },
    );
    return () => { cancelled = true; };
  }, []);

  const select = useCallback(async (id: string) => {
    if (busyRef.current) return;
    setActive(id);
    setMessages([]);
    try {
      const loaded = await api.getMessages(id);
      if (activeIdRef.current === id) setMessages(loaded.map(fromApi));
    } catch {
      if (activeIdRef.current === id) {
        setMessages([{ key: localKey(), role: 'error', content: 'โหลดบทสนทนานี้ไม่สำเร็จ ลองเลือกอีกครั้ง', citedMembers: [] }]);
      }
    }
  }, []);

  const newConversation = useCallback(() => {
    if (busyRef.current) return;
    setActive(null);
    setMessages([]);
  }, []);

  const remove = useCallback(async (id: string) => {
    if (busyRef.current) return;
    try {
      await api.deleteConversation(id);
    } catch (e) {
      // Already gone on the server is the outcome the visitor wanted; anything else keeps the item.
      if (!(e instanceof ApiRequestError && e.status === 404)) return;
    }
    setConversations((list) => list.filter((c) => c.id !== id));
    if (activeIdRef.current === id) {
      setActive(null);
      setMessages([]);
    }
  }, []);

  const send = useCallback(async (raw: string) => {
    const content = raw.trim();
    if (!content || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStreamingText('');
    setMessages((list) => [...list, { key: localKey(), role: 'user', content, citedMembers: [] }]);

    let text = '';
    const add = (message: Omit<UiMessage, 'key'>) => setMessages((list) => [...list, { key: localKey(), ...message }]);
    const fail = (copy: string) => {
      // Keep what was already on screen: the API saves a partial answer too, so a reload shows the same thing.
      if (text.trim()) add({ role: 'model', content: text, citedMembers: [] });
      text = '';
      add({ role: 'error', content: copy, citedMembers: [] });
    };

    try {
      let id = activeIdRef.current;
      if (!id) {
        const created = await api.createConversation(content);
        id = created.id;
        setActive(id);
        setConversations((list) => [created, ...list.filter((c) => c.id !== created.id)]);
      }
      const onEvent = (e: ChatStreamEvent) => {
        if (e.type === 'token') {
          text += e.text;
          setStreamingText(text);
        } else if (e.type === 'done') {
          add({ role: 'model', content: text, citedMembers: e.citedMembers });
          text = '';
        } else {
          fail(CHAT_ERROR_COPY[e.code] ?? CHAT_ERROR_COPY.AI_ERROR);
        }
      };
      const { completed } = await api.sendMessage(id, content, onEvent);
      if (!completed) fail(CONNECTION_LOST_COPY);
    } catch (e) {
      fail(e instanceof ApiRequestError && e.status === 429 ? TOO_FAST_COPY : CONNECTION_LOST_COPY);
    } finally {
      setStreamingText(null);
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  return { conversations, activeId, messages, streamingText, busy, select, newConversation, remove, send };
}
