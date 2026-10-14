const MAX_GRAPHEMES = 40;
const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });

export function makeTitle(content: string): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  const graphemes = [...segmenter.segment(clean)];
  if (graphemes.length <= MAX_GRAPHEMES) return clean;
  return graphemes.slice(0, MAX_GRAPHEMES).map((g) => g.segment).join('') + '…';
}
