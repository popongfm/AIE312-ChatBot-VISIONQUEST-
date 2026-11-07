const MAX_GRAPHEMES = 40;
const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });

/** First 40 graphemes of the message (Thai-safe), with … when cut. */
export function makeTitle(content: string): string {
  const clean = content.trim().replace(/\s+/g, ' ');
  const graphemes = [...segmenter.segment(clean)].map((s) => s.segment);
  return graphemes.length <= MAX_GRAPHEMES ? clean : `${graphemes.slice(0, MAX_GRAPHEMES).join('')}…`;
}
