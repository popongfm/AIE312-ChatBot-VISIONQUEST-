import type { Member } from '@vq/shared';
import Markdown from 'react-markdown';
import type { UiMessage } from '../../hooks/useChat';
import { HudPanel } from '../hud/HudPanel';
import { AiMark } from '../hud/marks';
import { CitationChips } from './CitationChips';

const WRAP = 'min-w-0 break-words [overflow-wrap:anywhere]';

/** `streaming`: this answer is still arriving, so it shows a cursor and the AI mark keeps moving. */
export function MessageBubble({ message, members, streaming = false }: { message: UiMessage; members: Member[]; streaming?: boolean }) {
  if (message.role === 'user') {
    return (
      <div data-role="user" className="flex justify-end">
        <HudPanel tone="cyan" className="max-w-[85%] min-w-0 px-4 py-3">
          <div data-testid="bubble-content" className={`whitespace-pre-wrap ${WRAP}`}>{message.content}</div>
        </HudPanel>
      </div>
    );
  }
  if (message.role === 'error') {
    return (
      <div data-role="error" className="flex justify-start">
        <div role="alert" data-testid="bubble-content" className={`max-w-[92%] rounded-[2px] border border-fault px-4 py-3 ${WRAP}`}>
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div data-role="model" className="flex justify-start">
      <HudPanel tone="amber" className="flex max-w-[92%] min-w-0 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 font-mono text-sm text-stone">
          <AiMark active={streaming} />
          <span>{streaming ? 'vq › กำลังตอบ' : 'vq › ตอบจากข้อมูล portfolio'}</span>
        </div>
        {/* No rehype-raw: any HTML in the answer is shown as text, never inserted into the page. */}
        <div data-testid="bubble-content" className={`vq-markdown ${WRAP}`}>
          <Markdown>{message.content}</Markdown>
          {streaming && <span aria-hidden="true" className="vq-blink ml-1 inline-block h-[18px] w-[9px] bg-stone align-[-3px]" />}
        </div>
        <CitationChips slugs={message.citedMembers} members={members} />
      </HudPanel>
    </div>
  );
}
