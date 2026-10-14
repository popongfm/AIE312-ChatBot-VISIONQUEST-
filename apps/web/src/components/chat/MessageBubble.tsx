import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { Member } from '@vq/shared';
import type { UiMessage } from '../../hooks/useChat';
import { HudPanel } from '../hud/HudPanel';
import { CitationChips } from './CitationChips';
import { OracleGlyph } from './OracleGlyph';

const markdownComponents: Components = {
  // Never load model-supplied remote images (tracking-pixel risk); keep the alt text.
  img: ({ alt }) => <span>{alt}</span>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

const CONTENT_WRAP = 'min-w-0 max-w-full break-words [overflow-wrap:anywhere]';

/** Markdown typography for Oracle answers (Tailwind preflight resets lists/code). */
export const MARKDOWN_STYLES = [
  '[&_a]:text-scan [&_a]:underline [&_a]:decoration-scan/50 [&_a]:underline-offset-4 [&_a:hover]:decoration-scan',
  '[&_strong]:font-semibold [&_strong]:text-ink',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-scan',
  '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
  '[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-quest',
  '[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-line [&_pre]:bg-void [&_pre]:p-3',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-scan/50 [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted',
].join(' ');

type Props = {
  message: UiMessage;
  members: Member[];
  onResend?: () => void;
  resendDisabled?: boolean;
};

export function MessageBubble({ message, members, onResend, resendDisabled }: Props) {
  const { role, content, citedMembers } = message;
  const align = role === 'user' ? 'justify-end' : 'justify-start';

  if (role === 'model') {
    return (
      <div data-role={role} className={`flex min-w-0 max-w-full gap-2 ${align}`}>
        <OracleGlyph />
        <HudPanel tone="cyan" className="max-w-[85%] px-3.5 py-3">
          <div data-slot="content" className={`${CONTENT_WRAP} space-y-2 text-ink ${MARKDOWN_STYLES}`}>
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
          <CitationChips slugs={citedMembers} members={members} />
        </HudPanel>
      </div>
    );
  }

  if (role === 'error') {
    return (
      <div data-role={role} className={`flex min-w-0 max-w-full ${align}`}>
        <div className="min-w-0 max-w-[85%] border-l-2 border-danger bg-danger/10 px-3.5 py-3">
          <div data-slot="content" className={`${CONTENT_WRAP} whitespace-pre-wrap text-ink`}>
            {content}
          </div>
          {onResend ? (
            <button
              type="button"
              onClick={onResend}
              disabled={resendDisabled}
              className="mt-3 min-h-10 border border-danger px-4 text-sm font-semibold text-danger transition-[background-color,color] motion-reduce:transition-none hover:bg-danger hover:text-void disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-danger"
            >
              ส่งใหม่
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div data-role={role} className={`flex min-w-0 max-w-full ${align}`}>
      <div className="min-w-0 max-w-[85%] border-r-2 border-quest bg-quest/10 px-3.5 py-2.5">
        <div data-slot="content" className={`${CONTENT_WRAP} whitespace-pre-wrap text-ink`}>
          {content}
        </div>
      </div>
    </div>
  );
}
