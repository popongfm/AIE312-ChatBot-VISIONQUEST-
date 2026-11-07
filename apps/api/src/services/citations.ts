import type { Member } from '@vq/shared';

type CitableMember = Pick<Member, 'slug' | 'name' | 'nickname' | 'sortOrder'>;

const THAI = /[฀-๿]/;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function mentions(text: string, lowerText: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  // Thai has no spaces between words, so a word boundary is meaningless: match as a substring.
  if (THAI.test(t)) return text.includes(t);
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegex(t.toLowerCase())}(?![A-Za-z0-9])`).test(lowerText);
}

/** Slugs of members mentioned in `text`, unique, ordered by sortOrder. */
export function detectCitations(text: string, members: CitableMember[]): string[] {
  const lowerText = text.toLowerCase();
  return [...members]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((m) => [m.name, m.nickname, m.slug].some((term) => term != null && mentions(text, lowerText, term)))
    .map((m) => m.slug);
}
