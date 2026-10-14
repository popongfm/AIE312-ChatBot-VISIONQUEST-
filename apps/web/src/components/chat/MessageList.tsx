import { useEffect, useRef } from 'react';
import type { Member } from '@vq/shared';
import type { UiMessage } from '../../hooks/useChat';
import { HudPanel } from '../hud/HudPanel';
import { ScanLine } from '../hud/ScanLine';
import { MessageBubble } from './MessageBubble';
import { OracleGlyph } from './OracleGlyph';

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
      aria-busy={busy || streamingText !== null}
      aria-label="ข้อความในบทสนทนา"
      className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-5"
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
        <div className="flex min-w-0 max-w-full justify-start gap-2">
          <OracleGlyph />
          <HudPanel tone="cyan" className="overflow-hidden px-3.5 py-3">
            <span className="relative font-mono text-sm text-scan">analyzing…</span>
            <ScanLine active />
          </HudPanel>
        </div>
      ) : null}
      {streamingText ? (
        <div data-role="model" className="flex min-w-0 max-w-full justify-start gap-2">
          <OracleGlyph />
          <HudPanel tone="cyan" className="max-w-[85%] px-3.5 py-3">
            <div data-slot="content" className="min-w-0 max-w-full whitespace-pre-wrap break-words text-ink [overflow-wrap:anywhere]">
              {streamingText}
              <span data-slot="cursor" aria-hidden="true" className="ml-0.5 inline-block text-scan motion-safe:animate-pulse">
                ▍
              </span>
            </div>
          </HudPanel>
        </div>
      ) : null}
    </div>
  );
}
