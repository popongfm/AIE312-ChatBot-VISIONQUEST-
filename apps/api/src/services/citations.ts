import type { Member } from '@vq/shared';

type CitableMember = Pick<Member, 'slug' | 'name' | 'nickname' | 'sortOrder'>;

const THAI = /[฀-๿]/;
const SPECIAL = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (s: string): string => s.replace(SPECIAL, '\\$&');

function termMatches(text: string, term: string): boolean {
  if (THAI.test(term)) return text.includes(term);
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, 'i').test(text);
}

export function detectCitations(text: string, members: CitableMember[]): string[] {
  const hits: { slug: string; sortOrder: number; index: number }[] = [];
  members.forEach((m, index) => {
    const terms = [m.name, m.nickname, m.slug].filter((t): t is string => !!t);
    if (terms.some((t) => termMatches(text, t))) hits.push({ slug: m.slug, sortOrder: m.sortOrder, index });
  });
  hits.sort((a, b) => a.sortOrder - b.sortOrder || a.index - b.index);
  return [...new Set(hits.map((h) => h.slug))];
}
