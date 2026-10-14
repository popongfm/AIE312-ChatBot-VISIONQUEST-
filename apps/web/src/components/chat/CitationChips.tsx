import { displayName } from '@vq/shared';
import type { Member } from '@vq/shared';

export function CitationChips({ slugs, members }: { slugs: string[]; members: Member[] }) {
  const known = slugs.flatMap((slug) => {
    const member = members.find((m) => m.slug === slug);
    return member ? [member] : [];
  });
  if (known.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {known.map((m) => (
        <li key={m.slug}>
          <a href={`/#member-${m.slug}`} className="inline-block rounded-full border px-2 py-0.5 text-sm">
            📎 {displayName(m)}
          </a>
        </li>
      ))}
    </ul>
  );
}
