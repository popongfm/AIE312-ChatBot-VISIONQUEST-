import { displayName, type TeamProject } from '@vq/shared';
import { ProjectLinks, TechList } from './MemberDetail';
import { SectionHeading } from './SectionHeading';

/** Team projects as log entries (not cards): amber rule = an achievement the party completed. */
export function QuestLog({ projects }: { projects: TeamProject[] }) {
  return (
    <section id="quests" aria-labelledby="quests-title" className="px-4 py-16 sm:px-8 sm:py-20">
      <SectionHeading id="quests-title">ผลงานทีม</SectionHeading>
      <ul className="mt-8 space-y-12">
        {projects.map((p) => (
          <li key={p.title} className="min-w-0 border-l-2 border-quest pl-4 sm:pl-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="border border-quest bg-quest/10 px-1.5 font-mono text-xs font-semibold leading-5 text-quest">
                COMPLETED
              </span>
              <h3 className="min-w-0 break-words text-xl font-semibold leading-snug text-balance text-ink">{p.title}</h3>
            </div>
            <p className="mt-2 max-w-[68ch] break-words text-pretty text-ink-muted">{p.summary}</p>
            {p.members.length > 0 ? (
              <ul className="mt-4 max-w-[68ch] space-y-1">
                {p.members.map((m) => (
                  <li key={m.slug} className="break-words">
                    <span className="font-semibold text-quest">{displayName(m)}</span>
                    <span className="text-ink-muted">{m.contribution ? ` — ${m.contribution}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {p.tech.length > 0 ? <TechList tech={p.tech} /> : null}
            <ProjectLinks repoUrl={p.repoUrl} demoUrl={p.demoUrl} />
          </li>
        ))}
      </ul>
    </section>
  );
}
