import type { Team } from '@vq/shared';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BBoxFrame } from '../hud/BBoxFrame';
import { SPHERE_LINKS, SPHERE_NODES } from '../hud/fx';
import { FxCanvas } from '../hud/FxCanvas';
import { Corners } from '../hud/marks';
import { ScanLine } from '../hud/ScanLine';
import { useReducedMotion } from '../hud/useReducedMotion';

/** What /api/health said. 'checking' until it answers. */
export type Health = 'checking' | { api: boolean; db: boolean };

const SAMPLE_QUESTIONS = ['ทีมนี้ทำอะไรมาบ้าง', 'ใครถนัดงาน AI ที่สุด', 'ผลงานกลุ่มมีอะไร'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Types the sample questions into the input's placeholder, one character at a time. Writes to the DOM directly: no re-render per character. */
function useTypedPlaceholder(enabled: boolean) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let q = 0, i = 0, hold = 0;
    const timer = setInterval(() => {
      const text = SAMPLE_QUESTIONS[q];
      if (i < text.length) el.placeholder = text.slice(0, ++i);
      else if (hold < 16) hold++;
      else { hold = 0; i = 0; q = (q + 1) % SAMPLE_QUESTIONS.length; }
    }, 90);
    return () => { clearInterval(timer); el.placeholder = SAMPLE_QUESTIONS[0]; };
  }, [enabled]);
  return ref;
}

/** Time since the page opened, written into a HUD label once a second. */
function useSessionClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      if (ref.current) ref.current.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return ref;
}

function StatusLine({ state, children }: { state: 'ok' | 'down' | 'checking'; children: string }) {
  const dot = state === 'ok' ? 'bg-signal vq-pulse' : state === 'down' ? 'bg-fault' : 'bg-haze vq-pulse';
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className={`h-2 w-2 flex-none ${dot}`} />
      {children}
    </span>
  );
}

export function Hero({ team, memberCount, health }: { team: Team; memberCount: number; health: Health }) {
  const [question, setQuestion] = useState('');
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const input = useTypedPlaceholder(!reduced);
  const clock = useSessionClock();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ask = question.trim();
    navigate(ask ? `/chat?ask=${encodeURIComponent(ask)}` : '/chat');
  }

  const api = health === 'checking' ? 'checking' : health.api ? 'ok' : 'down';
  const db = health === 'checking' ? 'checking' : health.db ? 'ok' : 'down';

  return (
    <header
      id="top"
      className="relative isolate flex flex-col gap-10 overflow-hidden bg-[linear-gradient(100deg,#0B2B52_0%,#0E1230_46%,#3A1257_100%)] px-5 pt-14 pb-9 sm:px-8"
    >
      <FxCanvas kind="stream" className="absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="hud-scanlines pointer-events-none absolute inset-0 -z-10" />
      <Corners />
      <div aria-hidden="true" className="hud-label absolute top-4 left-11">VQ-01 // Portfolio node</div>
      <div aria-hidden="true" className="hud-label absolute top-4 right-11 hidden sm:block">Session <span ref={clock}>00:00:00</span></div>

      <div className="flex flex-wrap items-center gap-x-12 gap-y-10">
        <div
          role="status"
          aria-label="สถานะระบบ"
          className="order-3 flex flex-[0_1_210px] flex-col gap-3.5 lg:order-1 rounded-[2px] border border-signal bg-void/85 p-4 font-mono text-sm shadow-[0_0_24px_rgba(88,224,232,0.25),inset_0_0_24px_rgba(88,224,232,0.08)]"
        >
          <span aria-hidden="true" className="hud-label border-b border-grid pb-2.5">System status</span>
          <StatusLine state={api}>{api === 'ok' ? 'API พร้อมใช้งาน' : api === 'down' ? 'API ไม่ตอบ' : 'กำลังตรวจ API'}</StatusLine>
          <StatusLine state={db}>{db === 'ok' ? 'ฐานข้อมูลพร้อมใช้งาน' : db === 'down' ? 'ฐานข้อมูลไม่ตอบ' : 'กำลังตรวจฐานข้อมูล'}</StatusLine>
        </div>

        <div className="order-2 flex min-w-0 flex-[2_1_300px] justify-center">
          <div className="relative w-full max-w-[560px] overflow-hidden">
            <ScanLine active />
            <FxCanvas kind="sphere" label="ทรงกลมโครงข่ายข้อมูลของทีม หมุนช้า ๆ มีวงโคจรและเป้าเล็งล้อมรอบ" className="h-[340px] w-full sm:h-[520px]" />
            <div aria-hidden="true" className="hud-label absolute top-3 left-0 border-b border-signal pr-4 pb-1.5">Nodes {SPHERE_NODES}</div>
            <div aria-hidden="true" className="hud-label absolute top-3 right-0 border-b border-signal pb-1.5 pl-4">Links {SPHERE_LINKS}</div>
            <div aria-hidden="true" className="hud-label absolute bottom-3 left-0 border-t border-violet pt-1.5 pr-4 !text-[#C9B5FF]">Members {pad(memberCount)}</div>
            <div aria-hidden="true" className={`hud-label absolute right-0 bottom-3 border-t pt-1.5 pl-4 ${api === 'down' ? 'border-fault !text-fault' : 'border-stone !text-stone'}`}>
              {api === 'ok' ? 'API online' : api === 'down' ? 'API offline' : 'API check'}
            </div>
          </div>
        </div>

        <div className="order-1 flex min-w-0 flex-[3_1_380px] flex-col gap-7 lg:order-3">
          <BBoxFrame label="Team // AIE312">
            <h1 className="vq-glitch glow-text text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.15] font-bold tracking-tight break-words">{team.name}</h1>
          </BBoxFrame>
          {team.tagline && (
            <p className="font-display text-[clamp(1.375rem,3vw,2.25rem)] leading-[1.3] font-semibold text-balance text-violet">
              <span aria-hidden="true" className="mr-[0.4em] inline-block h-[0.4em] w-[0.4em] rounded-full bg-pulse align-[0.12em]" />
              {team.tagline}
            </p>
          )}
          <form onSubmit={onSubmit} className="flex max-w-[560px] flex-wrap gap-3">
            <label htmlFor="hero-ask" className="sr-only">คำถามถึง Oracle</label>
            <div className="glow-signal flex h-[60px] min-w-0 flex-[999_1_240px] items-center gap-3 rounded-[2px] border border-signal bg-void px-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal">
              <span aria-hidden="true" className="font-mono text-xl text-stone">›</span>
              <input
                ref={input}
                id="hero-ask"
                type="text"
                value={question}
                maxLength={2000}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={SAMPLE_QUESTIONS[0]}
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-[17px] text-ghost outline-none placeholder:text-haze"
              />
            </div>
            <button type="submit" className="h-[60px] flex-[1_1_140px] rounded-[2px] bg-ghost px-6 whitespace-nowrap font-display text-lg font-semibold text-void hover:bg-signal">ส่งคำถาม</button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-3">
        <a href="#team" className="flex min-h-14 items-center border-l-[3px] border-ghost bg-void/80 pr-5 pl-5 font-display text-lg font-semibold text-ghost no-underline hover:text-signal">อ่านแนวคิดทีม</a>
        <Link to="/chat" className="flex min-h-14 items-center border-r-[3px] border-ghost bg-void/80 pr-5 pl-5 font-display text-lg font-semibold text-ghost no-underline hover:text-signal">คุยกับ Oracle</Link>
      </div>
    </header>
  );
}
