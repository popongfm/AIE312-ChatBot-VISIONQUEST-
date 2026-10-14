import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { displayName, type Member } from '@vq/shared';

const SkillRadar = lazy(() => import('./SkillRadar'));

export function askHref(nickname: string): string {
  return `/chat?ask=${encodeURIComponent(`${nickname} ทำโปรเจกต์อะไรบ้าง และถนัดอะไร`)}`;
}

function SkillList({ member }: { member: Member }) {
  return (
    <ul className="mt-2 space-y-1">
      {member.skills.map((s) => (
        <li key={s.name} className="break-words">{s.name} <span className="font-mono tabular-nums text-ink-muted">({s.level}/5)</span></li>
      ))}
    </ul>
  );
}

export function MemberDetail({ member, id }: { member: Member; id: string }) {
  const nick = displayName(member);
  return (
    <div id={id} role="region" aria-label={`รายละเอียด ${nick}`} className="min-w-0 border-l-2 border-scan bg-panel p-4 sm:p-6">
      <h4 className="text-xl font-semibold leading-snug text-ink">ทักษะ</h4>
      {member.skills.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">ยังไม่มีข้อมูลทักษะ</p>
      ) : member.skills.length < 3 ? (
        <SkillList member={member} />
      ) : (
        <Suspense fallback={<p className="mt-2 text-sm text-ink-muted">กำลังโหลดกราฟ…</p>}>
          <SkillRadar skills={member.skills} />
        </Suspense>
      )}
      <h4 className="mt-8 text-xl font-semibold leading-snug text-ink">ผลงานส่วนตัว</h4>
      {member.projects.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">ยังไม่มีผลงาน</p>
      ) : (
        <ul className="mt-3 space-y-5">
          {member.projects.map((p) => (
            <li key={p.title} className="min-w-0 border-l-2 border-quest pl-4">
              <p className="break-words font-semibold text-ink">{p.title}</p>
              <p className="max-w-[68ch] break-words text-ink-muted">{p.summary}</p>
              {p.tech.length > 0 ? <TechList tech={p.tech} /> : null}
              {p.contribution ? <p className="max-w-[68ch] break-words text-sm text-ink">{p.contribution}</p> : null}
              <ProjectLinks repoUrl={p.repoUrl} demoUrl={p.demoUrl} />
            </li>
          ))}
        </ul>
      )}
      <Link to={askHref(nick)} className="mt-8 inline-flex min-h-11 max-w-full items-center break-words border border-quest bg-quest/10 px-4 font-semibold text-quest transition-[background-color,color] motion-reduce:transition-none hover:bg-quest hover:text-void">
        ถาม Oracle เกี่ยวกับ {nick}
      </Link>
    </div>
  );
}

export function ProjectLinks({ repoUrl, demoUrl }: { repoUrl: string | null; demoUrl: string | null }) {
  if (!repoUrl && !demoUrl) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-5 text-sm">
      {repoUrl ? <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center break-all text-scan underline decoration-scan/40 underline-offset-4 transition-[text-decoration-color] motion-reduce:transition-none hover:decoration-scan">Repo</a> : null}
      {demoUrl ? <a href={demoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center break-all text-scan underline decoration-scan/40 underline-offset-4 transition-[text-decoration-color] motion-reduce:transition-none hover:decoration-scan">Demo</a> : null}
    </p>
  );
}

/** Project tech stack as a plain inline list (data, sans so Thai renders). */
export function TechList({ tech }: { tech: string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {tech.map((t) => (
        <li key={t} translate="no" className="max-w-full bg-line/60 px-2 py-0.5 text-xs text-ink [overflow-wrap:anywhere]">
          {t}
        </li>
      ))}
    </ul>
  );
}
