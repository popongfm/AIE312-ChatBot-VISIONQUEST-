import { Link } from 'react-router';
import type { Team } from '@vq/shared';

export function Hero({ team }: { team: Team }) {
  return (
    <section id="hero" aria-labelledby="hero-title" className="px-4 py-12">
      <h1 id="hero-title" className="break-words text-4xl font-bold">{team.name}</h1>
      {team.tagline ? <p className="mt-2 break-words text-lg">{team.tagline}</p> : null}
      <Link to="/chat" className="mt-6 inline-block rounded border px-4 py-2">คุยกับ Oracle</Link>
    </section>
  );
}
