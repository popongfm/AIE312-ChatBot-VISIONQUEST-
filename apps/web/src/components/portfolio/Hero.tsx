import { Link } from 'react-router';
import type { Team } from '@vq/shared';
import { BBoxFrame } from '../hud/BBoxFrame';
import { ScanLine } from '../hud/ScanLine';

export function Hero({ team }: { team: Team }) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-scan/20 px-4 pb-14 pt-10 sm:pb-20 sm:pt-16"
    >
      <ScanLine active sweeps={2} />
      <p aria-hidden="true" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        <span className="inline-block h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_var(--color-danger)]" />
        LIVE FEED · CAM-01 · AIE312
      </p>
      <BBoxFrame label="TARGET: TEAM" confidence={0.99} className="mt-6">
        <h1
          id="hero-title"
          translate="no"
          className="break-words px-1 text-[clamp(2.4rem,11vw,5.5rem)] font-semibold leading-tight text-ink [text-shadow:0_0_24px_rgb(34_211_238/0.35)]"
        >
          {team.name}
        </h1>
      </BBoxFrame>
      {team.tagline ? (
        <p className="mt-5 max-w-prose break-words text-lg text-pretty text-ink sm:text-xl">{team.tagline}</p>
      ) : null}
      <Link
        to="/chat"
        className="mt-8 inline-flex min-h-11 items-center gap-3 border border-quest bg-quest px-5 font-semibold text-void shadow-[0_0_24px_-6px_var(--color-quest)] transition-[background-color,box-shadow] motion-reduce:transition-none hover:bg-[#ffc933] hover:shadow-[0_0_32px_-4px_var(--color-quest)]"
      >
        <span aria-hidden="true" className="font-mono text-xs">▶</span>
        คุยกับ Oracle
      </Link>
    </section>
  );
}
