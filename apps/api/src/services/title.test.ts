import { describe, expect, test } from 'vitest';
import { makeTitle } from './title.js';

const seg = new Intl.Segmenter('th', { granularity: 'grapheme' });
const count = (s: string) => [...seg.segment(s)].length;

describe('makeTitle', () => {
  test('title cuts at grapheme boundary', () => {
    const t = makeTitle('น้ำ'.repeat(60));
    expect(t.endsWith('…')).toBe(true);
    expect(count(t.slice(0, -1))).toBe(40);
  });
  test('short title unchanged', () => expect(makeTitle('  ทีมนี้ถนัดอะไร  ')).toBe('ทีมนี้ถนัดอะไร'));
  test('exactly 40 graphemes unchanged', () => expect(makeTitle('a'.repeat(40))).toBe('a'.repeat(40)));
  test('41 graphemes cut with ellipsis', () => expect(makeTitle('a'.repeat(41))).toBe('a'.repeat(40) + '…'));
  test('whitespace and newlines collapsed', () => expect(makeTitle(' a \n\n  b\tc ')).toBe('a b c'));
});
