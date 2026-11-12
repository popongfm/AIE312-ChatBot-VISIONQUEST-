import type { Member } from '@vq/shared';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Composer } from '../components/chat/Composer';
import { MessageList } from '../components/chat/MessageList';
import { Sidebar } from '../components/chat/Sidebar';
import { SuggestedQuestions } from '../components/chat/SuggestedQuestions';
import { FxCanvas } from '../components/hud/FxCanvas';
import { useChat } from '../hooks/useChat';
import { api } from '../lib/api';

export function ChatPage() {
  const chat = useChat();
  const { send } = chat;
  const [members, setMembers] = useState<Member[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Member names for citation chips and suggested questions. Chat still works if this fails.
  useEffect(() => {
    let cancelled = false;
    api.getPortfolio().then(
      (p) => { if (!cancelled) setMembers(p.members); },
      () => {},
    );
    return () => { cancelled = true; };
  }, []);

  // A link like /chat?ask=… (from a member card) asks that question once. The param is removed right away,
  // so refreshing the page does not ask again.
  const asked = useRef(false);
  const ask = searchParams.get('ask');
  useEffect(() => {
    if (!ask || asked.current) return;
    asked.current = true;
    setSearchParams({}, { replace: true });
    void send(ask);
  }, [ask, send, setSearchParams]);

  const empty = chat.messages.length === 0 && !chat.busy;
  const title = chat.conversations.find((c) => c.id === chat.activeId)?.title ?? 'คุยกับ Oracle';

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeId}
        onSelect={(id) => void chat.select(id)}
        onNew={chat.newConversation}
        onDelete={(id) => void chat.remove(id)}
      />
      <main className="flex min-w-0 flex-1 flex-col lg:min-h-dvh">
        <header className="flex flex-col gap-1 border-b border-grid px-4 py-4 sm:px-8 sm:py-5">
          <div aria-hidden="true" className="hud-label">Model Gemini // Source Portfolio</div>
          <h1 className="glow-text truncate text-2xl font-semibold">{title}</h1>
        </header>
        <div className="mx-auto flex w-full max-w-[840px] flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
          {empty && (
            <>
              <FxCanvas kind="core" className="mx-auto h-56 w-full max-w-sm" />
              <SuggestedQuestions members={members} onPick={(q) => void send(q)} />
            </>
          )}
          <MessageList messages={chat.messages} streamingText={chat.streamingText} members={members} />
        </div>
        <div className="sticky bottom-0 border-t border-grid bg-void">
          <div className="mx-auto w-full max-w-[840px] px-4 pt-4 pb-5 sm:px-8">
            <Composer disabled={chat.busy} onSend={(content) => void send(content)} />
          </div>
        </div>
      </main>
    </div>
  );
}
