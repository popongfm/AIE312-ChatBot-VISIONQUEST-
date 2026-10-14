import { describe, expect, test } from 'vitest';
import { detectCitations } from './citations.js';

const ms = [
  { slug: 'mickie', name: 'สมชาย ใจดี', nickname: 'Mickie', sortOrder: 1 },
  { slug: 'art', name: 'อาทิตย์ แสงทอง', nickname: 'Art', sortOrder: 2 },
];

describe('detectCitations', () => {
  test('english nickname, case-insensitive, whole word', () =>
    expect(detectCitations('ask MICKIE about it', ms)).toEqual(['mickie']));
  test('Art does not match artificial', () =>
    expect(detectCitations('artificial intelligence', ms)).toEqual([]));
  test('thai full name glued to surrounding thai words still matches', () =>
    expect(detectCitations('คุณอาทิตย์ แสงทองทำส่วนนี้', ms)).toEqual(['art']));
  test('thai nickname inside a run of thai text matches', () =>
    expect(
      detectCitations('ถามมิกกี้ได้เลย', [{ slug: 'mk', name: 'X', nickname: 'มิกกี้', sortOrder: 1 }]),
    ).toEqual(['mk']));
  test('unique and sorted by sortOrder', () =>
    expect(detectCitations('Art และ Mickie และ Art', ms)).toEqual(['mickie', 'art']));
  test('slug matches', () => expect(detectCitations('see mickie', [{ slug: 'mickie', name: 'ก', nickname: null, sortOrder: 1 }])).toEqual(['mickie']));
  test('no names in text gives empty list', () => expect(detectCitations('hello world', ms)).toEqual([]));
  test('regex special characters in a term are escaped', () => {
    const m = [{ slug: 'cpp', name: 'Chris', nickname: 'C++', sortOrder: 1 }];
    expect(detectCitations('I like C++ a lot', m)).toEqual(['cpp']);
    expect(detectCitations('I like CCC', m)).toEqual([]);
  });
});
