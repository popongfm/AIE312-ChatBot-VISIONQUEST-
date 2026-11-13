import type { Member } from '@vq/shared';
import { DecodeText } from '../hud/DecodeText';
import { FxCanvas } from '../hud/FxCanvas';
import { Reveal } from '../hud/Reveal';
import { MemberCard } from './MemberCard';

export function Party({ members, onOpen }: { members: Member[]; onOpen(member: Member): void }) {
  return (
    <section id="members" aria-labelledby="party-title" className="relative isolate flex scroll-mt-24 flex-col gap-8 overflow-hidden border-t border-grid pt-16 pb-24 sm:pt-[72px]">
      <FxCanvas kind="mesh" className="absolute inset-0 -z-10 h-full w-full opacity-70" />
      <h2 id="party-title" className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold"><DecodeText text="สมาชิก" /></h2>
      {members.length === 0 ? <p className="text-haze">ยังไม่มีข้อมูลสมาชิก</p> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => (
            <div key={m.slug} id={`member-${m.slug}`} className="card-hud scroll-mt-24">
              <Reveal delay={i * 120} className="h-full">
                <MemberCard member={m} onOpen={() => onOpen(m)} />
              </Reveal>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
