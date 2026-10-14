import { displayName, type TeamProject } from '@vq/shared';
import { ProjectLinks } from './MemberDetail';

export function QuestLog({ projects }: { projects: TeamProject[] }) {
  return (
    <section id="quests" aria-labelledby="quests-title" className="px-4 py-8">
      <h2 id="quests-title" className="text-2xl font-semibold">ผลงานทีม</h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.title} className="min-w-0 rounded border p-4">
            <h3 className="break-words text-lg font-semibold">{p.title}</h3>
            <p className="break-words">{p.summary}</p>
            {p.tech.length > 0 ? <p className="break-words text-sm">{p.tech.join(' · ')}</p> : null}
            {p.members.length > 0 ? (
              <ul className="mt-2 text-sm">
                {p.members.map((m) => (
                  <li key={m.slug} className="break-words">
                    {displayName(m)}
                    {m.contribution ? ` — ${m.contribution}` : ''}
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
