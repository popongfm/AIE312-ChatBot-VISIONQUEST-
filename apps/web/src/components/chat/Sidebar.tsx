import type { Conversation } from '@vq/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../hud/marks';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect(id: string): void;
  onNew(): void;
  onDelete(id: string): void;
}

/** Desktop: a column on the left. Phone: a top bar, with the conversation list behind the "บทสนทนา" toggle. */
export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  // Deleting cannot be undone, so the first click only arms the button; the second click deletes.
  const [confirming, setConfirming] = useState<string | null>(null);
  const pick = (action: () => void) => () => { action(); setOpen(false); };

  return (
    <aside className="flex min-w-0 flex-col gap-4 border-b border-grid p-4 lg:sticky lg:top-0 lg:h-dvh lg:gap-5 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" aria-label="VISIONQUEST หน้าแรก" className="glow-text flex min-h-11 min-w-0 items-center gap-3 font-display text-xl font-bold text-ghost no-underline">
          <Logo size={36} />
          <span aria-hidden="true" className="truncate">VISIONQUEST</span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="conversation-panel"
          onClick={() => setOpen((v) => !v)}
          className="min-h-11 flex-none rounded-[2px] border border-grid px-3 font-display font-semibold text-ghost lg:hidden"
        >
          บทสนทนา
        </button>
      </div>

      <div id="conversation-panel" className={`${open ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-5 lg:flex`}>
        <button type="button" onClick={pick(onNew)} className="btn-secondary h-12 justify-start px-5 text-left">เควสต์ใหม่</button>
        <nav aria-label="บทสนทนาที่ผ่านมา" className="flex flex-col gap-1">
          <h2 className="mb-1 font-sans text-sm font-normal text-haze">บทสนทนาที่ผ่านมา</h2>
          {conversations.length === 0 && <p className="text-sm text-haze">ยังไม่มีบทสนทนา ถามคำถามแรกได้เลย</p>}
          <ul className="flex flex-col gap-1">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className={`flex items-stretch rounded-[2px] ${active ? 'bg-deck' : ''}`}>
                  <button
                    type="button"
                    onClick={pick(() => onSelect(c.id))}
                    aria-current={active ? 'true' : undefined}
                    className={`min-h-11 min-w-0 flex-1 truncate px-3 text-left text-[15px] hover:text-signal ${active ? 'text-ghost' : 'text-haze'}`}
                  >
                    {c.title}
                  </button>
                  {confirming === c.id ? (
                    <button
                      type="button"
                      onClick={() => { setConfirming(null); onDelete(c.id); }}
                      onBlur={() => setConfirming(null)}
                      aria-label={`ยืนยันลบบทสนทนา ${c.title}`}
                      className="min-h-11 flex-none px-3 text-sm font-semibold text-fault"
                    >
                      ยืนยันลบ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(c.id)}
                      aria-label={`ลบบทสนทนา ${c.title}`}
                      className="grid min-h-11 w-11 flex-none place-items-center text-haze hover:text-fault"
                    >
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <Link to="/" className="mt-auto flex min-h-11 items-center text-[15px]">กลับไปหน้า Portfolio</Link>
      </div>
    </aside>
  );
}
