import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { type EvalQuestion, loadQuestions, readSse, scoreAnswer } from './score';

test('expectAny matches case-insensitively', () =>
  expect(scoreAnswer({ id: 'q', scope: 'member', question: '', expectAny: ['YOLO'] }, 'ใช้ yolo-seg')).toBe(true));

test('expectAny fails when no term appears', () =>
  expect(scoreAnswer({ id: 'q', scope: 'member', question: '', expectAny: ['Power BI'] }, 'ใช้ Tableau')).toBe(false));

test('refusal requires the phrase', () => {
  const q = { id: 'r', scope: 'refusal', question: '', expectRefusal: true } as const;
  expect(scoreAnswer(q, 'ขออภัย ไม่มีข้อมูลเรื่องนี้')).toBe(true);
  expect(scoreAnswer(q, "Sorry, I DON'T HAVE that information")).toBe(true);
  expect(scoreAnswer(q, 'เงินเดือน 30,000 บาท')).toBe(false);
});

describe('questions.json', () => {
  let qs: EvalQuestion[];
  test('loads', async () => {
    qs = await loadQuestions();
  });

  test('has 4 team, 6 member (2 per member), 2 refusal', () => {
    const count = (f: (q: EvalQuestion) => boolean) => qs.filter(f).length;
    expect(qs).toHaveLength(12);
    expect(count((q) => q.scope === 'team')).toBe(4);
    expect(count((q) => q.scope === 'refusal')).toBe(2);
    for (const slug of ['popong', 'natdanai', 'banthita']) {
      expect(count((q) => q.scope === 'member' && q.member === slug)).toBe(2);
    }
  });

  test('ids are unique, and every question can actually be scored', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.question.trim()).not.toBe('');
      if (q.scope === 'refusal') expect(q.expectRefusal).toBe(true);
      else expect(q.expectAny?.length).toBeGreaterThan(0);
    }
  });

  test('every expected term really is in the seed data, so a pass means the answer came from the portfolio', async () => {
    const files = ['team.json', 'members/popong.json', 'members/natdanai.json', 'members/banthita.json'];
    const seedText = (await Promise.all(files.map((f) => readFile(new URL(`../../../seed/${f}`, import.meta.url), 'utf8'))))
      .join('\n').toLowerCase();
    for (const q of qs) for (const term of q.expectAny ?? []) expect(seedText, `${q.id}: "${term}"`).toContain(term.toLowerCase());
  });
});

test('readSse joins tokens and reports the final event', async () => {
  const body = new Blob([
    'event: token\ndata: {"text":"สวัส"}\n\n',
    'event: token\ndata: {"text":"ดี"}\n\nevent: done\ndata: {"messageId":1,"citedMembers":[]}\n\n',
  ]).stream();
  expect(await readSse(body)).toEqual({ text: 'สวัสดี', end: { type: 'done', messageId: 1, citedMembers: [] } });
});

test('readSse surfaces an error event', async () => {
  const body = new Blob(['event: error\ndata: {"code":"AI_ERROR","message":"x"}\n\n']).stream();
  expect((await readSse(body)).end).toEqual({ type: 'error', code: 'AI_ERROR', message: 'x' });
});
