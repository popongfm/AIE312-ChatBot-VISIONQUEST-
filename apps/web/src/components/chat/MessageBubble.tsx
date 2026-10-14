import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { Member } from '@vq/shared';
import type { UiMessage } from '../../hooks/useChat';
import { CitationChips } from './CitationChips';

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

const CONTENT_WRAP = 'min-w-0 max-w-full break-words [overflow-wrap:anywhere]';

type Props = {
  message: UiMessage;
  members: Member[];
  onResend?: () => void;
  resendDisabled?: boolean;
};

export function MessageBubble({ message, members, onResend, resendDisabled }: Props) {
  const { role, content, citedMembers } = message;
  const align = role === 'user' ? 'justify-end' : 'justify-start';

  return (
    <div data-role={role} className={`flex min-w-0 max-w-full ${align}`}>
      <div className="min-w-0 max-w-[85%] rounded border p-3">
        {role === 'model' ? (
          <div data-slot="content" className={`${CONTENT_WRAP} space-y-2`}>
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div data-slot="content" className={`${CONTENT_WRAP} whitespace-pre-wrap`}>
            {content}
          </div>
        )}
        {role === 'model' ? <CitationChips slugs={citedMembers} members={members} /> : null}
        {role === 'error' && onResend ? (
          <button type="button" onClick={onResend} disabled={resendDisabled} className="mt-2 rounded border px-2 py-1 text-sm disabled:opacity-50">
            ส่งใหม่
          </button>
        ) : null}
      </div>
    </div>
  );
}
