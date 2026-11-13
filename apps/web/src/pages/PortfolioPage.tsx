import type { Member } from '@vq/shared';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DecodeText } from '../components/hud/DecodeText';
import { FxCanvas } from '../components/hud/FxCanvas';
import { Logo } from '../components/hud/marks';
import { Reveal } from '../components/hud/Reveal';
import { ScrollProgress } from '../components/hud/ScrollProgress';
import { Concept } from '../components/portfolio/Concept';
import { Contact } from '../components/portfolio/Contact';
import { type Health, Hero } from '../components/portfolio/Hero';
import { MemberDetail } from '../components/portfolio/MemberDetail';
import { Party } from '../components/portfolio/Party';
import { QuestLog } from '../components/portfolio/QuestLog';
import { usePortfolio } from '../hooks/usePortfolio';
import { ApiRequestError, api } from '../lib/api';

function errorCopy(error: Error): string {
  if (error instanceof ApiRequestError && error.code === 'NOT_SEEDED') {
    return 'ยังไม่มีข้อมูล Portfolio ในฐานข้อมูล ให้ผู้ดูแลรันคำสั่ง seed แล้วโหลดอีกครั้ง';
  }
  return 'โหลดข้อมูล Portfolio ไม่สำเร็จ ตรวจการเชื่อมต่อแล้วโหลดอีกครั้ง';
}

const NAV_LINK = 'flex min-h-11 items-center text-ghost no-underline hover:text-signal';

export function PortfolioPage() {
  const { data, error, loading, retry } = usePortfolio();
  const [open, setOpen] = useState<Member | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const [health, setHealth] = useState<Health>('checking');
  const { hash } = useLocation();

  // Render's free plan sleeps when idle: this wakes the API while the visitor reads, before they open the chat.
  // The answer also feeds the status panel.
  useEffect(() => {
    let cancelled = false;
    api.getHealth().then(
      (h) => { if (!cancelled) setHealth({ api: true, db: h.db === 'ok' }); },
      // An error status means the API answered but the database did not; anything else means no answer at all.
      (e: unknown) => { if (!cancelled) setHealth({ api: e instanceof ApiRequestError, db: false }); },
    );
    return () => { cancelled = true; };
  }, []);

  // A citation chip in chat links to /#member-<slug>: scroll there once the cards exist.
  useEffect(() => {
    if (!data || !hash.startsWith('#')) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.({ block: 'center' });
  }, [data, hash]);

  const tech = data ? [...new Set(data.teamProjects.flatMap((p) => p.tech))] : [];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-4 sm:px-6">
      <FxCanvas kind="stars" className="fixed inset-0 -z-10 h-dvh w-full" />
      <ScrollProgress />
      <nav aria-label="เมนูหลัก" className="z-40 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 md:sticky md:top-0 md:bg-void/75 md:backdrop-blur-md">
        <Link to="/" aria-label="VISIONQUEST หน้าแรก" className="glow-text flex min-h-11 items-center gap-3 font-display text-[22px] font-bold text-ghost no-underline">
          <Logo />
          <span aria-hidden="true">VISIONQUEST</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <a href="#team" className={NAV_LINK}>ทีม</a>
          <a href="#members" className={NAV_LINK}>สมาชิก</a>
          <a href="#work" className={NAV_LINK}>ผลงาน</a>
          <a href="#contact" className={NAV_LINK}>ติดต่อ</a>
          <Link to="/chat" className="btn-primary h-12 px-6 text-[17px]">คุยกับ Vision</Link>
        </div>
      </nav>

      {loading && <p role="status" className="py-24 font-mono text-haze">กำลังโหลดข้อมูลทีม</p>}

      {error && (
        <div className="flex flex-col items-start gap-5 py-24">
          <p role="alert" className="max-w-[60ch] rounded-[2px] border border-fault px-5 py-4">{errorCopy(error)}</p>
          <button type="button" onClick={retry} className="btn-secondary h-12 px-6">โหลดอีกครั้ง</button>
        </div>
      )}

      {data && (
        <>
          <Hero team={data.team} memberCount={data.members.length} health={health} />

          {tech.length > 0 && (
            <div className="overflow-hidden border-b border-grid py-[18px]" aria-label="เทคโนโลยีที่ทีมใช้">
              {/* The list is doubled so the loop has no seam; the copy is hidden from screen readers. */}
              <ul className="vq-ticker flex w-max font-display text-xl font-semibold whitespace-nowrap text-haze">
                {[...tech, ...tech].map((t, i) => <li key={`${t}-${i}`} aria-hidden={i >= tech.length} className="mr-14">{t}</li>)}
              </ul>
            </div>
          )}

          <Reveal><Concept team={data.team} /></Reveal>
          <Party members={data.members} onOpen={setOpen} />
          <Reveal><QuestLog projects={data.teamProjects} /></Reveal>

          <Reveal>
          <section aria-labelledby="ask-title" className="flex flex-wrap items-center gap-x-16 gap-y-8 border border-grid bg-ink px-5 py-12 sm:px-8 sm:py-14">
            <FxCanvas kind="core" label="แกน AI โฮโลแกรม คลื่นเสียงวงกลมขยับตามจังหวะ" className="h-[320px] min-w-0 flex-[1_1_300px] sm:h-[420px]" />
            <div className="flex min-w-0 flex-[1_1_340px] flex-col items-start gap-5">
              <h2 id="ask-title" className="text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.2] font-bold text-balance"><DecodeText text="ให้ Vision เล่าเรื่องทีมให้ฟัง" /></h2>
              <p className="max-w-[46ch] text-lg text-haze">ถามได้ทั้งเรื่องของทีมและของสมาชิกแต่ละคน ทุกคำตอบมาจากข้อมูลในหน้านี้ และบอกว่าอ้างถึงใคร</p>
              <Link to="/chat" className="btn-secondary h-14 px-7 text-lg">คุยกับ Vision</Link>
            </div>
          </section>
          </Reveal>

          <Reveal><Contact contacts={data.contacts} /></Reveal>
          <footer className="border-t border-grid pt-6 pb-10 text-sm text-haze">โปรเจกต์ปลายภาควิชา AIE312 มหาวิทยาลัยกรุงเทพ</footer>
        </>
      )}

      {open && <MemberDetail member={open} onClose={close} />}
    </div>
  );
}
