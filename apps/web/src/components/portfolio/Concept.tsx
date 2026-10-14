import type { Team } from '@vq/shared';

export function Concept({ team }: { team: Team }) {
  if (!team.concept && team.highlights.length === 0) return null;
  return (
    <section id="concept" aria-labelledby="concept-title" className="px-4 py-8">
      <h2 id="concept-title" className="text-2xl font-semibold">แนวคิด</h2>
      {team.concept ? <p className="mt-2 break-words">{team.concept}</p> : null}
      {team.highlights.length > 0 ? (
        <ul className="mt-4 list-disc pl-6">
          {team.highlights.map((h) => (
            <li key={h} className="break-words">{h}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
