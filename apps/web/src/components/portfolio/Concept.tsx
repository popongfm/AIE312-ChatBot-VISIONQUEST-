import type { Team } from '@vq/shared';
import { SectionHeading } from './SectionHeading';

export function Concept({ team }: { team: Team }) {
  if (!team.concept && team.highlights.length === 0) return null;
  return (
    <section id="concept" aria-labelledby="concept-title" className="px-4 py-12">
      <SectionHeading id="concept-title" index="01" code="MISSION BRIEF">แนวคิด</SectionHeading>
      {team.concept ? <p className="mt-4 max-w-prose break-words text-pretty text-ink">{team.concept}</p> : null}
      {team.highlights.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {team.highlights.map((h) => (
            <li key={h} className="flex min-w-0 gap-3 border-l-2 border-scan/60 bg-panel/60 px-4 py-3">
              <span aria-hidden="true" className="font-mono text-scan">◆</span>
              <span className="min-w-0 break-words">{h}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
