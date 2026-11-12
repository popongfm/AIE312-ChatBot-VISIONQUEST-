import { displayName, type Member } from '@vq/shared';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StatBar } from '../hud/StatBar';

/** Chat link that asks Oracle about one member. ChatPage sends the `ask` question once and removes it from the URL. */
export function askHref(nickname: string): string {
  return `/chat?ask=${encodeURIComponent(`${nickname} ทำโปรเจกต์อะไรบ้าง และถนัดอะไร`)}`;
}

export function MemberDetail({ member, onClose }: { member: Member; onClose(): void }) {
  const name = displayName(member);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden'; // the page behind must not scroll
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.(); // back to the card that opened this
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="glow-signal relative flex max-h-[92dvh] w-full max-w-2xl flex-col gap-7 overflow-y-auto rounded-[2px] border border-signal bg-deck p-6 sm:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div aria-hidden="true" className="hud-label mb-1">Member file</div>
            <h3 id="member-detail-title" className="glow-text text-3xl font-semibold [overflow-wrap:anywhere]">{name}</h3>
            <p className="text-haze">{member.role}</p>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} className="min-h-11 flex-none px-3 font-display font-semibold text-ghost underline underline-offset-4 hover:text-signal">ปิด</button>
        </div>

        <p className={member.bio ? '' : 'text-haze'}>{member.bio ?? 'ยังไม่มีข้อมูลแนะนำตัว'}</p>

        <section className="flex flex-col gap-4" aria-label="ทักษะ">
          <h4 className="text-xl font-semibold">ทักษะ</h4>
          {member.skills.length === 0 ? <p className="text-haze">ยังไม่มีข้อมูลทักษะ</p> : (
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {member.skills.map((s) => <StatBar key={s.name} name={s.name} level={s.level} />)}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4" aria-label="ผลงาน">
          <h4 className="text-xl font-semibold">ผลงาน</h4>
          {member.projects.length === 0 ? <p className="text-haze">ยังไม่มีข้อมูลผลงาน</p> : (
            <ul className="flex flex-col gap-5">
              {member.projects.map((p) => (
                <li key={p.title} className="flex flex-col gap-1.5 border-l border-grid pl-4">
                  <h5 className="text-lg font-semibold">{p.title}</h5>
                  <p className="text-[15px] text-haze">{p.summary}</p>
                  {p.contribution && <p className="text-[15px]">บทบาท: {p.contribution}</p>}
                  {p.tech.length > 0 && <p className="font-mono text-sm text-signal">{p.tech.join(' / ')}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link to={askHref(name)} className="btn-primary min-h-12 self-start px-6 py-2 text-[17px]">
          ถาม Oracle เกี่ยวกับ {name}
        </Link>
      </div>
    </div>
  );
}
