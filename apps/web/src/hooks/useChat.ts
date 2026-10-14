import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_ERROR_COPY } from '@vq/shared';
import type { ChatStreamEvent, Conversation } from '@vq/shared';
import { api, ApiRequestError } from '../lib/api';

export type UiMessage = {
  key: string;
  role: 'user' | 'model' | 'error';
  content: string;
  citedMembers: string[];
};

const COPY_RATE_FAST = 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่';
const COPY_CONNECTION_LOST = 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const localKey = useRef(0);
  const selectToken = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const nextKey = () => `l-${++localKey.current}`;

  const activate = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  // Initial list. Merge so a conversation created before the response lands is not lost.
  useEffect(() => {
    let cancelled = false;
    api
      .listConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations((prev) => [...prev.filter((p) => !list.some((c) => c.id === p.id)), ...list]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setListLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Abort any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const select = useCallback(
    async (id: string) => {
      if (busyRef.current) return;
      const token = ++selectToken.current;
      activate(id);
      setMessages([]);
      setLoadingMessages(true);
      try {
        const list = await api.getMessages(id);
        if (token !== selectToken.current) return;
        setMessages(
          list.map((m) => ({
            key: `m-${m.id}`,
            role: m.role,
            content: m.content,
            citedMembers: m.citedMembers,
          })),
        );
      } catch {
        if (token === selectToken.current) {
          setMessages([{ key: nextKey(), role: 'error', content: COPY_CONNECTION_LOST, citedMembers: [] }]);
        }
      } finally {
        if (token === selectToken.current) setLoadingMessages(false);
      }
    },
    [activate],
  );

  const newConversation = useCallback(async () => {
    const created = await api.createConversation();
    selectToken.current++;
    setLoadingMessages(false);
    setConversations((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    activate(created.id);
    setMessages([]);
    return created.id;
  }, [activate]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      selectToken.current++; // discard any pending history load so it cannot wipe this exchange
      setLoadingMessages(false);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const pushError = (message: string) =>
        setMessages((prev) => [...prev, { key: nextKey(), role: 'error', content: message, citedMembers: [] }]);

      try {
        const id = activeIdRef.current ?? (await newConversation());
        setMessages((prev) => [...prev, { key: nextKey(), role: 'user', content: text, citedMembers: [] }]);
        setStreamingText('');

        let acc = '';
        let succeeded = false;
        const onEvent = (e: ChatStreamEvent) => {
          if (e.type === 'token') {
            acc += e.text;
            setStreamingText((prev) => (prev ?? '') + e.text);
          } else if (e.type === 'done') {
            const final = acc;
            succeeded = true;
            setMessages((prev) => [
              ...prev,
              { key: nextKey(), role: 'model', content: final, citedMembers: e.citedMembers },
            ]);
            setStreamingText(null);
          } else {
            pushError(CHAT_ERROR_COPY[e.code]);
            setStreamingText(null);
          }
        };

        const { completed } = await api.sendMessage(id, text, onEvent, ctrl.signal);
        if (!completed && !ctrl.signal.aborted) pushError(COPY_CONNECTION_LOST);
        if (succeeded && !ctrl.signal.aborted) {
          // title is set server-side after the first message
          api
            .listConversations()
            .then((list) => {
              if (!ctrl.signal.aborted) setConversations(list);
            })
            .catch(() => {});
        }
      } catch (err) {
        if (!ctrl.signal.aborted) {
          pushError(err instanceof ApiRequestError && err.status === 429 ? COPY_RATE_FAST : COPY_CONNECTION_LOST);
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
        setStreamingText(null);
      }
    },
    [newConversation],
  );

  return { conversations, listLoaded, activeId, messages, streamingText, busy, loadingMessages, select, newConversation, send };
}
