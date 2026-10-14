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
    <div aria-busy="true" aria-label="กำลังโหลด" className="mx-auto max-w-5xl space-y-4 p-4">
      <p aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.2em] text-scan">SCANNING…</p>
      <div className="h-12 w-2/3 border border-scan/20 bg-scan/10 motion-safe:animate-pulse" />
      <div className="h-6 w-1/2 border border-scan/20 bg-scan/10 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 border border-scan/20 bg-panel/80 motion-safe:animate-pulse" />
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
      <div role="alert" className="mx-4 mt-10 max-w-xl border border-danger/60 bg-danger/10 p-5 sm:mx-auto">
        <p aria-hidden="true" className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-danger">SYSTEM ⚠ LINK LOST</p>
        <p className="break-words text-ink">{e.message}</p>
        {e instanceof ApiRequestError ? <p className="font-mono text-sm text-ink-muted">({e.code})</p> : null}
        <button type="button" onClick={retry} className="mt-4 min-h-11 border border-danger px-4 font-semibold text-danger transition-colors motion-reduce:transition-none hover:bg-danger hover:text-void">ลองใหม่</button>
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
