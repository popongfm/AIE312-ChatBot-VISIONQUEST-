import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { loadSeed } from '../src/db/seed';
import questions from './questions.json';
import { scoreAnswer, type EvalQuestion } from './score';

const REAL_SEED = fileURLToPath(new URL('../../../seed', import.meta.url));

describe('scoreAnswer', () => {
  test('expectAny matches case-insensitively', () =>
    expect(
      scoreAnswer({ id: 'q', scope: 'member', question: '', expectAny: ['YOLO'] }, 'ใช้ yolo-seg'),
    ).toBe(true));

  test('expectAny fails when no term is present', () =>
    expect(
      scoreAnswer({ id: 'q', scope: 'team', question: '', expectAny: ['React', 'Gemini'] }, 'ไม่ทราบ'),
    ).toBe(false));

  test('refusal requires the phrase', () => {
    const q = { id: 'r', scope: 'refusal', question: '', expectRefusal: true } as const;
    expect(scoreAnswer(q, 'ขออภัย ไม่มีข้อมูลเรื่องนี้')).toBe(true);
    expect(scoreAnswer(q, "Sorry, I Don't Have that")).toBe(true);
    expect(scoreAnswer(q, 'Sorry, I don’t have that')).toBe(true);
    expect(scoreAnswer(q, 'เงินเดือน 30,000 บาท')).toBe(false);
  });

  test('a question with no expectation never passes', () =>
    expect(scoreAnswer({ id: 'x', scope: 'team', question: '' }, 'anything')).toBe(false));
});

describe('questions.json', () => {
  const qs = questions as EvalQuestion[];

  test('has 4 team, 6 member (2 per member), 2 refusal', async () => {
    expect(qs).toHaveLength(12);
    expect(qs.filter((q) => q.scope === 'team')).toHaveLength(4);
    expect(qs.filter((q) => q.scope === 'refusal')).toHaveLength(2);
    const members = qs.filter((q) => q.scope === 'member');
    expect(members).toHaveLength(6);

    const seed = await loadSeed(REAL_SEED);
    for (const m of seed.members) {
      expect(members.filter((q) => q.member === m.slug), m.slug).toHaveLength(2);
    }
    for (const q of members) expect(seed.members.map((m) => m.slug)).toContain(q.member);
  });

  test('ids are unique and each question has an expectation', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.scope === 'refusal' ? q.expectRefusal === true : (q.expectAny?.length ?? 0) > 0, q.id).toBe(true);
    }
  });
});
