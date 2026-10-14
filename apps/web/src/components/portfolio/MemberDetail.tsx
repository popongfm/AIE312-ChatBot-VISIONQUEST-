import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { displayName, type Member } from '@vq/shared';

const SkillRadar = lazy(() => import('./SkillRadar'));

export function askHref(nickname: string): string {
  return `/chat?ask=${encodeURIComponent(`${nickname} ทำโปรเจกต์อะไรบ้าง และถนัดอะไร`)}`;
}

function SkillList({ member }: { member: Member }) {
  return (
    <ul className="list-disc pl-6">
      {member.skills.map((s) => (
        <li key={s.name}>{s.name} ({s.level}/5)</li>
      ))}
    </ul>
  );
}

export function MemberDetail({ member, id }: { member: Member; id: string }) {
  const nick = displayName(member);
  return (
    <div id={id} role="region" aria-label={`รายละเอียด ${nick}`} className="min-w-0 rounded border p-4">
      <h4 className="font-semibold">ทักษะ</h4>
      {member.skills.length === 0 ? (
        <p className="text-sm">ยังไม่มีข้อมูลทักษะ</p>
      ) : member.skills.length < 3 ? (
        <SkillList member={member} />
      ) : (
        <Suspense fallback={<p className="text-sm">กำลังโหลดกราฟ…</p>}>
          <SkillRadar skills={member.skills} />
        </Suspense>
      )}
      <h4 className="mt-4 font-semibold">ผลงานส่วนตัว</h4>
      {member.projects.length === 0 ? (
        <p className="text-sm">ยังไม่มีผลงาน</p>
      ) : (
        <ul className="space-y-3">
          {member.projects.map((p) => (
            <li key={p.title} className="min-w-0">
              <p className="break-words font-medium">{p.title}</p>
              <p className="break-words text-sm">{p.summary}</p>
              {p.tech.length > 0 ? <p className="break-words text-sm">{p.tech.join(' · ')}</p> : null}
              {p.contribution ? <p className="break-words text-sm">{p.contribution}</p> : null}
              <ProjectLinks repoUrl={p.repoUrl} demoUrl={p.demoUrl} />
            </li>
          ))}
        </ul>
      )}
      <Link to={askHref(nick)} className="mt-4 inline-block rounded border px-3 py-1">
        ถาม Oracle เกี่ยวกับ {nick}
      </Link>
    </div>
  );
}

export function ProjectLinks({ repoUrl, demoUrl }: { repoUrl: string | null; demoUrl: string | null }) {
  if (!repoUrl && !demoUrl) return null;
  return (
    <p className="space-x-3 text-sm">
      {repoUrl ? <a href={repoUrl} target="_blank" rel="noreferrer" className="break-all underline">Repo</a> : null}
      {demoUrl ? <a href={demoUrl} target="_blank" rel="noreferrer" className="break-all underline">Demo</a> : null}
    </p>
  );
}
