import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { api, ApiRequestError } from '../lib/api';
import { usePortfolio } from '../hooks/usePortfolio';
import { Hero } from '../components/portfolio/Hero';
import { Concept } from '../components/portfolio/Concept';
import { Party } from '../components/portfolio/Party';
import { QuestLog } from '../components/portfolio/QuestLog';
import { Contact } from '../components/portfolio/Contact';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลด" className="space-y-4 p-4">
      <div className="h-10 w-2/3 rounded bg-neutral-300 motion-safe:animate-pulse" />
      <div className="h-6 w-1/2 rounded bg-neutral-300 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded bg-neutral-300 motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PortfolioPage() {
  const { data, error, loading, retry } = usePortfolio();
  const { hash } = useLocation();

  useEffect(() => {
    api.getHealth().catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || !/^#member-.+/.test(hash)) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [data, hash]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    const e = error ?? new Error('ไม่สามารถโหลดข้อมูลได้');
    return (
      <div role="alert" className="p-4">
        <p className="break-words">{e.message}</p>
        {e instanceof ApiRequestError ? <p className="text-sm">({e.code})</p> : null}
        <button type="button" onClick={retry} className="mt-3 rounded border px-3 py-1">ลองใหม่</button>
      </div>
    );
  }
  return (
    <main className="mx-auto max-w-5xl">
      <Hero team={data.team} />
      <Concept team={data.team} />
      <Party members={data.members} />
      <QuestLog projects={data.teamProjects} />
      <Contact contacts={data.contacts} />
    </main>
  );
}
