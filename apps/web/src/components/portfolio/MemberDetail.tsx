import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { displayName, type Member } from '@vq/shared';

const SkillRadar = lazy(() => import('./SkillRadar'));

export function askHref(nickname: string): string {
  return `/chat?ask=${encodeURIComponent(`${nickname} ทำโปรเจกต์อะไรบ้าง และถนัดอะไร`)}`;
}

function SkillList({ member }: { member: Member }) {
  return (
    <ul className="mt-2 space-y-1 font-mono text-sm">
      {member.skills.map((s) => (
        <li key={s.name} className="break-words"><span aria-hidden="true" className="text-scan">▸ </span>{s.name} ({s.level}/5)</li>
      ))}
    </ul>
  );
}

export function MemberDetail({ member, id }: { member: Member; id: string }) {
  const nick = displayName(member);
  return (
    <div id={id} role="region" aria-label={`รายละเอียด ${nick}`} className="min-w-0 border border-scan/40 bg-panel/90 p-4 shadow-[0_0_32px_-16px_var(--color-scan)] sm:p-6">
      <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-scan">ทักษะ</h4>
      {member.skills.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">ยังไม่มีข้อมูลทักษะ</p>
      ) : member.skills.length < 3 ? (
        <SkillList member={member} />
      ) : (
        <Suspense fallback={<p className="mt-2 text-sm text-ink-muted">กำลังโหลดกราฟ…</p>}>
          <SkillRadar skills={member.skills} />
        </Suspense>
      )}
      <h4 className="mt-6 font-mono text-sm font-semibold uppercase tracking-wider text-scan">ผลงานส่วนตัว</h4>
      {member.projects.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">ยังไม่มีผลงาน</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {member.projects.map((p) => (
            <li key={p.title} className="min-w-0 border-l-2 border-quest/60 bg-void/50 py-2 pl-3 pr-2">
              <p className="break-words font-semibold text-ink">{p.title}</p>
              <p className="break-words text-sm text-ink-muted">{p.summary}</p>
              {p.tech.length > 0 ? <p className="break-words font-mono text-xs text-scan">{p.tech.join(' · ')}</p> : null}
              {p.contribution ? <p className="break-words text-sm text-ink">{p.contribution}</p> : null}
              <ProjectLinks repoUrl={p.repoUrl} demoUrl={p.demoUrl} />
            </li>
          ))}
        </ul>
      )}
      <Link to={askHref(nick)} className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 break-words border border-quest bg-quest/10 px-4 font-semibold text-quest transition-colors motion-reduce:transition-none hover:bg-quest hover:text-void">
        ถาม Oracle เกี่ยวกับ {nick}
      </Link>
    </div>
  );
}

export function ProjectLinks({ repoUrl, demoUrl }: { repoUrl: string | null; demoUrl: string | null }) {
  if (!repoUrl && !demoUrl) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm">
      {repoUrl ? <a href={repoUrl} target="_blank" rel="noreferrer" className="break-all text-scan underline decoration-scan/40 underline-offset-4 hover:decoration-scan">Repo</a> : null}
      {demoUrl ? <a href={demoUrl} target="_blank" rel="noreferrer" className="break-all text-scan underline decoration-scan/40 underline-offset-4 hover:decoration-scan">Demo</a> : null}
    </p>
  );
}
