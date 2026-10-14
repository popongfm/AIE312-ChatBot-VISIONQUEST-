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
    <article className="flex h-full min-w-0 flex-col">
      <BBoxFrame label={`CLASS: ${member.role}`} confidence={confidence}>
        <img
          src={src}
          alt={nick}
          width={320}
          height={400}
          loading="lazy"
          onError={() => setFailed(true)}
          className="aspect-[4/5] h-auto w-full bg-panel object-cover object-top"
        />
      </BBoxFrame>
      <h3 className="mt-4 break-words text-xl font-semibold leading-snug text-ink">{nick}</h3>
      <p className="break-words text-sm font-semibold text-quest">{member.role}</p>
      {member.bio ? <p className="mt-2 max-w-[68ch] break-words text-pretty text-ink-muted">{member.bio}</p> : null}
      {topSkills.length > 0 ? (
        <div className="mt-5 space-y-2">
          {topSkills.map((s) => (
            <StatBar key={s.name} name={s.name} level={s.level} />
          ))}
        </div>
      ) : null}
      <div aria-hidden="true" className="min-h-5 flex-1" />
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-label={`ดูรายละเอียด ${nick}`}
        className="min-h-11 w-full border border-line px-3 font-sans text-sm font-semibold text-ink transition-[background-color,border-color,color] motion-reduce:transition-none hover:border-scan hover:text-scan aria-expanded:border-scan aria-expanded:bg-scan/10 aria-expanded:text-scan"
      >
        ดูรายละเอียด
      </button>
    </article>
  );
}
