import { useState } from 'react';
import { displayName, type Member } from '@vq/shared';
import { BBoxFrame } from '../hud/BBoxFrame';
import { StatBar } from '../hud/StatBar';

export const AVATAR_PLACEHOLDER = '/avatars/placeholder.svg';

interface Props {
  member: Member;
  onOpen: () => void;
  expanded?: boolean;
  controlsId?: string;
}

export function MemberCard({ member, onOpen, expanded = false, controlsId }: Props) {
  const nick = displayName(member);
  const [failed, setFailed] = useState(false);
  const src = failed ? AVATAR_PLACEHOLDER : (member.avatarUrl ?? AVATAR_PLACEHOLDER);
  const confidence = Math.min(0.99, 0.9 + member.sortOrder * 0.03);
  const topSkills = member.skills.slice(0, 3);
  return (
    <article className="relative flex h-full min-w-0 flex-col border border-scan/25 bg-panel/80 p-4 shadow-[inset_0_1px_0_rgb(34_211_238/0.08)]">
      <p aria-hidden="true" className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        <span>CHARACTER SHEET</span>
        <span className="tabular-nums">P-{String(member.sortOrder).padStart(2, '0')}</span>
      </p>
      <BBoxFrame label={`CLASS: ${member.role}`} confidence={confidence}>
        <img
          src={src}
          alt={nick}
          width={96}
          height={96}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-44 w-full bg-void object-cover object-top"
        />
      </BBoxFrame>
      <h3 className="mt-3 break-words text-xl font-semibold text-ink">{nick}</h3>
      <p className="break-words text-sm font-semibold text-quest">{member.role}</p>
      {member.bio ? <p className="mt-2 break-words text-sm text-pretty text-ink-muted">{member.bio}</p> : null}
      {topSkills.length > 0 ? (
        <div className="mt-4 space-y-1.5 border-t border-line pt-3">
          {topSkills.map((s) => (
            <StatBar key={s.name} name={s.name} level={s.level} />
          ))}
        </div>
      ) : null}
      <div aria-hidden="true" className="min-h-4 flex-1" />
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-label={`ดูรายละเอียด ${nick}`}
        className="min-h-11 w-full border border-scan/50 px-3 font-sans text-sm font-semibold text-scan transition-colors motion-reduce:transition-none hover:bg-scan/10 aria-expanded:bg-scan aria-expanded:text-void"
      >
        ดูรายละเอียด
      </button>
    </article>
  );
}
