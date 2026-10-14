import { useEffect, useRef } from 'react';
import type { Member } from '@vq/shared';
import type { UiMessage } from '../../hooks/useChat';
import { MessageBubble } from './MessageBubble';

type Props = {
  messages: UiMessage[];
  members: Member[];
  streamingText: string | null;
  busy: boolean;
  onResend: (content: string) => void;
};

export function MessageList({ messages, members, streamingText, busy, onResend }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight; // instant: no animated scrolling, so reduced motion is respected
  }, [messages, streamingText, busy]);

  return (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-label="ข้อความในบทสนทนา"
      className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3"
    >
      {messages.map((message, i) => {
        const prev = messages[i - 1];
        const resendFrom = message.role === 'error' && prev?.role === 'user' ? prev.content : null;
        return (
          <MessageBubble
            key={message.key}
            message={message}
            members={members}
            onResend={resendFrom !== null ? () => onResend(resendFrom) : undefined}
            resendDisabled={busy}
          />
        );
      })}
      {busy && streamingText === '' ? (
        <div className="min-w-0 max-w-full text-sm opacity-70">analyzing…</div>
      ) : null}
      {streamingText ? (
        <div data-role="model" className="flex min-w-0 max-w-full justify-start">
          <div className="min-w-0 max-w-[85%] rounded border p-3">
            <div data-slot="content" className="min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {streamingText}
              <span data-slot="cursor" aria-hidden="true" className="ml-0.5 inline-block motion-safe:animate-pulse">
                ▍
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
