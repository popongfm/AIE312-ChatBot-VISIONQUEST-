import { displayName, type Member } from '@vq/shared';
import { BBoxFrame } from '../hud/BBoxFrame';
import { StatBar } from '../hud/StatBar';

const graphemes = (text: string): string[] =>
  typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
    : Array.from(text);

/** Two characters that stand in for a profile photo (the site uses none). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const picked = words.length >= 2 ? [graphemes(words[0])[0], graphemes(words[1])[0]] : graphemes(words[0]).slice(0, 2);
  return picked.join('').toUpperCase();
}

export const topSkills = (member: Member, count = 3) =>
  [...member.skills].sort((a, b) => b.level - a.level).slice(0, count);

export function MemberCard({ member, onOpen }: { member: Member; onOpen(): void }) {
  const name = displayName(member);
  const skills = topSkills(member);
  return (
    <article className="chamfer flex h-full min-w-0 flex-col gap-5 border-t-2 border-signal bg-deck/90 p-5 sm:p-6">
      <BBoxFrame label={`CLASS: ${member.role}`}>
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="grid h-14 w-14 flex-none place-items-center bg-void font-display text-[22px] font-bold text-signal">{initials(name)}</div>
          <h3 className="min-w-0 text-2xl font-semibold [overflow-wrap:anywhere]">{name}</h3>
        </div>
      </BBoxFrame>
      {skills.length > 0 ? (
        <div className="flex flex-col gap-3" role="group" aria-label={`ทักษะเด่นของ ${name}`}>
          {skills.map((s) => <StatBar key={s.name} name={s.name} level={s.level} />)}
        </div>
      ) : (
        <p className="text-sm text-haze">ยังไม่มีข้อมูลทักษะ</p>
      )}
      <button type="button" onClick={onOpen} aria-label={`ดูรายละเอียดของ ${name}`} className="mt-auto min-h-11 self-start text-signal underline underline-offset-4 hover:text-ghost">
        ดูรายละเอียด
      </button>
    </article>
  );
}
