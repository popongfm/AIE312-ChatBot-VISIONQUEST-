import { displayName, type TeamProject } from '@vq/shared';
import { DecodeText } from '../hud/DecodeText';

export function QuestLog({ projects }: { projects: TeamProject[] }) {
  return (
    <section id="work" aria-labelledby="quest-title" className="flex scroll-mt-24 flex-col gap-6 border-t border-grid py-16 sm:py-[72px]">
      <h2 id="quest-title" className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold"><DecodeText text="ผลงานที่ทำร่วมกัน" /></h2>
      {projects.length === 0 ? <p className="text-haze">ยังไม่มีข้อมูลผลงานของทีม</p> : (
        <ul className="flex flex-col">
          {projects.map((p) => (
            <li key={p.title} className="flex flex-col gap-5 border-b border-grid py-7 first:pt-2">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <h3 className="flex-[1_1_260px] text-2xl font-semibold">{p.title}</h3>
                <p className="min-w-0 flex-[2_1_360px] text-haze">{p.summary}</p>
              </div>
              {p.tech.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="เทคโนโลยีที่ใช้">
                  {p.tech.map((t) => <li key={t} className="rounded-[2px] border border-grid px-3 py-1 text-sm">{t}</li>)}
                </ul>
              )}
              {p.members.length > 0 && (
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                  {p.members.map((m) => (
                    <div key={m.slug} className="contents">
                      <dt className="font-display font-semibold"><a href={`#member-${m.slug}`} className="inline-flex min-h-11 items-center sm:min-h-0">{displayName(m)}</a></dt>
                      <dd className="text-[15px] text-haze">{m.contribution ?? 'ยังไม่ได้ระบุบทบาท'}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(p.repoUrl || p.demoUrl) && (
                <div className="flex flex-wrap gap-x-6">
                  {p.repoUrl && <a href={p.repoUrl} className="flex min-h-11 items-center underline-offset-4">ดูโค้ดของ {p.title}</a>}
                  {p.demoUrl && <a href={p.demoUrl} className="flex min-h-11 items-center underline-offset-4">เปิดเดโมของ {p.title}</a>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
