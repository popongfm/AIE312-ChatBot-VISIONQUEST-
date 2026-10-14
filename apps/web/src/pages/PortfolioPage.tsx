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
    <div role="status" aria-busy="true" aria-label="กำลังโหลด" className="mx-auto max-w-5xl space-y-4 px-4 py-14 sm:px-8">
      <div className="h-16 w-2/3 bg-panel" />
      <div className="h-6 w-1/2 bg-panel" />
      <div className="grid grid-cols-1 gap-8 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[4/5] bg-panel" />
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
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [data, hash]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    const e = error ?? new Error('ไม่สามารถโหลดข้อมูลได้');
    return (
      <div role="alert" className="mx-4 mt-10 max-w-xl border-l-2 border-danger bg-danger/10 p-5 sm:mx-auto">
        <p className="break-words text-ink">{e.message}</p>
        {e instanceof ApiRequestError ? <p className="font-mono text-sm text-ink-muted">({e.code})</p> : null}
        <button type="button" onClick={retry} className="mt-4 min-h-11 border border-danger px-4 font-semibold text-danger transition-[background-color,color] motion-reduce:transition-none hover:bg-danger hover:text-void">ลองใหม่</button>
      </div>
    );
  }
  return (
    <main className="mx-auto min-w-0 max-w-5xl">
      <Hero team={data.team} />
      <Concept team={data.team} />
      <Party members={data.members} />
      <QuestLog projects={data.teamProjects} />
      <Contact contacts={data.contacts} />
    </main>
  );
}
