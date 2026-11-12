import { displayName, type Member } from '@vq/shared';

/** Links from an answer to the member cards it talked about. Slugs the portfolio does not know are skipped. */
export function CitationChips({ slugs, members }: { slugs: string[]; members: Member[] }) {
  const cited = slugs.map((slug) => members.find((m) => m.slug === slug)).filter((m): m is Member => Boolean(m));
  if (cited.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="สมาชิกที่คำตอบนี้อ้างถึง">
      {cited.map((m) => (
        <li key={m.slug}>
          <a
            href={`/#member-${m.slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-[2px] border border-signal bg-void px-3 font-mono text-sm no-underline"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
            {displayName(m)}
          </a>
        </li>
      ))}
    </ul>
  );
}
