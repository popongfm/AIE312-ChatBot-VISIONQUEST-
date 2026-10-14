import { displayName, type TeamProject } from '@vq/shared';
import { ProjectLinks } from './MemberDetail';
import { SectionHeading } from './SectionHeading';

export function QuestLog({ projects }: { projects: TeamProject[] }) {
  return (
    <section id="quests" aria-labelledby="quests-title" className="px-4 py-12">
      <SectionHeading id="quests-title" index="03" code="QUEST LOG">ผลงานทีม</SectionHeading>
      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {projects.map((p) => (
          <li
            key={p.title}
            className="relative flex min-w-0 flex-col gap-3 border border-quest/30 border-l-4 border-l-quest bg-panel/80 p-4 shadow-[0_0_32px_-20px_var(--color-quest)]"
          >
            <span className="self-start border border-quest bg-quest/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.2em] text-quest">
              COMPLETED
            </span>
            <h3 className="break-words text-lg font-semibold text-balance text-ink">{p.title}</h3>
            <p className="break-words text-pretty text-ink-muted">{p.summary}</p>
            {p.tech.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <li key={t} translate="no" className="max-w-full break-all border border-scan/30 px-2 py-0.5 text-xs text-scan">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
            {p.members.length > 0 ? (
              <ul className="space-y-1 border-t border-line pt-3 text-sm">
                {p.members.map((m) => (
                  <li key={m.slug} className="break-words">
                    <span aria-hidden="true" className="font-mono text-quest">▸ </span>
                    <span className="font-semibold text-ink">{displayName(m)}</span>
                    <span className="text-ink-muted">{m.contribution ? ` — ${m.contribution}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ProjectLinks repoUrl={p.repoUrl} demoUrl={p.demoUrl} />
          </li>
        ))}
      </ul>
    </section>
  );
}
