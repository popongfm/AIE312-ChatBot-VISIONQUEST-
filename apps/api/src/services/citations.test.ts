import { expect, test } from 'vitest';
import { detectCitations } from './citations';

const ms = [
  { slug: 'mickie', name: 'สมชาย ใจดี', nickname: 'Mickie', sortOrder: 1 },
  { slug: 'art', name: 'อาทิตย์ แสงทอง', nickname: 'Art', sortOrder: 2 },
];
test('english nickname, case-insensitive, whole word', () => expect(detectCitations('ask MICKIE about it', ms)).toEqual(['mickie']));
test('Art does not match artificial', () => expect(detectCitations('artificial intelligence', ms)).toEqual([]));
test('thai full name glued to surrounding thai words still matches', () =>
  expect(detectCitations('คุณอาทิตย์ แสงทองทำส่วนนี้', ms)).toEqual(['art']));
test('thai nickname inside a run of thai text matches', () =>
  expect(detectCitations('ถามมิกกี้ได้เลย', [{ slug: 'mk', name: 'X', nickname: 'มิกกี้', sortOrder: 1 }])).toEqual(['mk']));
test('unique and sorted by sortOrder', () => expect(detectCitations('Art และ Mickie และ Art', ms)).toEqual(['mickie', 'art']));
test('regex metacharacters in names are escaped', () =>
  expect(detectCitations('C++ rocks', [{ slug: 'c', name: 'C++', nickname: null, sortOrder: 1 }])).toEqual(['c']));
