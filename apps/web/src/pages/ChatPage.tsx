import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Member } from '@vq/shared';
import { api } from '../lib/api';
import { useChat } from '../hooks/useChat';
import { Composer } from '../components/chat/Composer';
import { MessageList } from '../components/chat/MessageList';
import { Sidebar } from '../components/chat/Sidebar';
import { SuggestedQuestions } from '../components/chat/SuggestedQuestions';

const SIDEBAR_ID = 'conversation-sidebar';
const NO_MEMBERS: Member[] = [];

export function ChatPage() {
  const { conversations, listLoaded, activeId, messages, streamingText, busy, select, newConversation, send } =
    useChat();
  const [members, setMembers] = useState<Member[]>(NO_MEMBERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const askHandled = useRef(false);
  const autoSelected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getPortfolio()
      .then((p) => {
        if (!cancelled) setMembers(p.members);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ?ask= : new conversation + send, exactly once (guard survives StrictMode double effects).
  useEffect(() => {
    const ask = searchParams.get('ask');
    if (!ask || askHandled.current) return;
    askHandled.current = true;
    setSearchParams({}, { replace: true });
    void (async () => {
      await newConversation();
      await send(ask);
    })();
  }, [searchParams, setSearchParams, newConversation, send]);

  // Without ?ask=, show the most recent conversation once the list has loaded.
  useEffect(() => {
    if (!listLoaded || autoSelected.current) return;
    autoSelected.current = true;
    const first = conversations[0];
    if (askHandled.current || activeId || !first) return;
    void select(first.id);
  }, [listLoaded, conversations, activeId, select]);

  const handleSelect = (id: string) => {
    setSidebarOpen(false);
    void select(id);
  };
  const handleNew = () => {
    setSidebarOpen(false);
    void newConversation();
  };

  return (
    <div className="flex h-dvh min-w-0 flex-col md:flex-row">
      <button
        type="button"
        className="border-b px-3 py-2 text-left md:hidden"
        aria-expanded={sidebarOpen}
        aria-controls={SIDEBAR_ID}
        onClick={() => setSidebarOpen((v) => !v)}
      >
        บทสนทนา
      </button>
      <Sidebar
        id={SIDEBAR_ID}
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        disabled={busy}
        onSelect={handleSelect}
        onNew={handleNew}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MessageList
          messages={messages}
          members={members}
          streamingText={streamingText}
          busy={busy}
          onResend={(content) => void send(content)}
        />
        {messages.length === 0 && !busy ? (
          <SuggestedQuestions members={members} onPick={(q) => void send(q)} />
        ) : null}
        <Composer busy={busy} onSend={(t) => void send(t)} />
      </main>
    </div>
  );
}
