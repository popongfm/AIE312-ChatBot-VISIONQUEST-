import type { Team } from '@vq/shared';
import { SectionHeading } from './SectionHeading';

export function Concept({ team }: { team: Team }) {
  if (!team.concept && team.highlights.length === 0) return null;
  return (
    <section id="concept" aria-labelledby="concept-title" className="px-4 py-16 sm:px-8 sm:py-20">
      <SectionHeading id="concept-title">แนวคิด</SectionHeading>
      {team.concept ? (
        <p className="mt-5 max-w-[68ch] break-words text-pretty text-ink">{team.concept}</p>
      ) : null}
      {team.highlights.length > 0 ? (
        <ul className="mt-6 max-w-[68ch] list-disc space-y-2 pl-5 text-ink marker:text-ink-muted">
          {team.highlights.map((h) => (
            <li key={h} className="min-w-0 break-words pl-1">
              {h}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
