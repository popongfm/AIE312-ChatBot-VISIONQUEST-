import { useState } from 'react';
import { displayName, type Member } from '@vq/shared';

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
  return (
    <article className="min-w-0 rounded border p-4">
      <img
        src={src}
        alt={nick}
        width={96}
        height={96}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-24 w-24 rounded object-cover"
      />
      <h3 className="mt-3 break-words text-lg font-semibold">{nick}</h3>
      <p className="break-words text-sm">{member.role}</p>
      {member.bio ? <p className="mt-2 break-words text-sm">{member.bio}</p> : null}
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-label={`ดูรายละเอียด ${nick}`}
        className="mt-3 rounded border px-3 py-1"
      >
        ดูรายละเอียด
      </button>
    </article>
  );
}
