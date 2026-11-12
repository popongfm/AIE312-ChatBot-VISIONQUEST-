import type { Member } from '@vq/shared';
import { useEffect, useRef } from 'react';
import type { UiMessage } from '../../hooks/useChat';
import { HudPanel } from '../hud/HudPanel';
import { AiMark } from '../hud/marks';
import { ScanLine } from '../hud/ScanLine';
import { MessageBubble } from './MessageBubble';

interface Props { messages: UiMessage[]; streamingText: string | null; members: Member[] }

export function MessageList({ messages, streamingText, members }: Props) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, streamingText]);

  return (
    <div aria-live="polite" className="flex flex-col gap-6">
      {messages.map((m) => <MessageBubble key={m.key} message={m} members={members} />)}
      {streamingText === '' && (
        <div data-role="pending" className="flex justify-start">
          <HudPanel tone="amber" className="relative flex items-center gap-2 overflow-hidden p-4 font-mono text-sm text-stone sm:p-5">
            <ScanLine active />
            <AiMark active />
            <span>analyzing…</span>
          </HudPanel>
        </div>
      )}
      {streamingText && (
        <MessageBubble streaming message={{ key: 'streaming', role: 'model', content: streamingText, citedMembers: [] }} members={members} />
      )}
      <div ref={end} />
    </div>
  );
}
