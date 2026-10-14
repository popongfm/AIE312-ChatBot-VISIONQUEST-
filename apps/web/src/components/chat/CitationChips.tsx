import { displayName } from '@vq/shared';
import type { Member } from '@vq/shared';

export function CitationChips({ slugs, members }: { slugs: string[]; members: Member[] }) {
  const known = slugs.flatMap((slug) => {
    const member = members.find((m) => m.slug === slug);
    return member ? [member] : [];
  });
  if (known.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2 border-t border-scan/15 pt-3">
      {known.map((m) => (
        <li key={m.slug} className="min-w-0 max-w-full">
          <a
            href={`/#member-${m.slug}`}
            className="inline-flex min-h-10 max-w-full items-center break-words border border-scan/40 bg-scan/5 px-2.5 font-sans text-sm text-scan transition-colors motion-reduce:transition-none hover:border-scan hover:bg-scan/15 sm:min-h-8"
          >
            📎 {displayName(m)}
          </a>
        </li>
      ))}
    </ul>
  );
}
