import { Link } from 'react-router';
import type { Team } from '@vq/shared';
import { BBoxFrame } from '../hud/BBoxFrame';
import { ScanLine } from '../hud/ScanLine';

/** The one bold moment: a camera-feed panel where a single scan sweep locks a detection box onto the team name. */
export function Hero({ team }: { team: Team }) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="vq-feed vq-lock relative overflow-hidden border-b border-line px-4 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-24"
    >
      <ScanLine active sweeps={1} />
      <BBoxFrame label="TARGET: TEAM" confidence={0.99} className="relative w-fit">
        <h1
          id="hero-title"
          translate="no"
          className="break-words px-2 py-1 text-[clamp(2.4rem,11vw,6rem)] font-semibold leading-tight text-ink"
        >
          {team.name}
        </h1>
      </BBoxFrame>
      {team.tagline ? (
        <p className="relative mt-8 max-w-[38ch] break-words text-xl leading-normal text-pretty text-ink sm:text-[1.5625rem]">
          {team.tagline}
        </p>
      ) : null}
      <Link
        to="/chat"
        className="relative mt-10 inline-flex min-h-12 items-center border border-quest bg-quest px-6 text-base font-semibold text-void transition-[background-color,border-color] motion-reduce:transition-none hover:border-[#ffc933] hover:bg-[#ffc933]"
      >
        คุยกับ Oracle
      </Link>
    </section>
  );
}
