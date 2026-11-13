import type { Team } from '@vq/shared';
import { DecodeText } from '../hud/DecodeText';

export function Concept({ team }: { team: Team }) {
  return (
    <section id="team" aria-labelledby="concept-title" className="flex scroll-mt-24 flex-wrap gap-x-16 gap-y-6 py-16 sm:py-[72px]">
      <h2 id="concept-title" className="flex-[1_1_280px] text-[clamp(1.75rem,4vw,2.5rem)] font-semibold"><DecodeText text="แนวคิดของทีม" /></h2>
      <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-5">
        <p className="max-w-[62ch] text-lg">{team.concept ?? 'ยังไม่มีข้อมูลแนวคิดของทีม'}</p>
        {team.highlights.length > 0 && (
          <ul className="flex max-w-[62ch] flex-col gap-3 text-haze">
            {team.highlights.map((h) => (
              <li key={h} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 flex-none bg-signal" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
