import { expect, test } from 'vitest';
import { makeTitle } from './title';

test('title cuts at grapheme boundary', () => {
  const t = makeTitle('น้ำ'.repeat(50));
  expect(t.endsWith('…')).toBe(true);
  expect([...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(t.slice(0, -1))]).toHaveLength(40);
});
test('short title unchanged', () => expect(makeTitle('  ทีมนี้ถนัดอะไร  ')).toBe('ทีมนี้ถนัดอะไร'));
test('whitespace collapsed', () => expect(makeTitle('a \n\t b')).toBe('a b'));
