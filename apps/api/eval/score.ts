export type EvalQuestion = {
  id: string;
  scope: 'team' | 'member' | 'refusal';
  question: string;
  /** Slug of the member a `member`-scope question targets. */
  member?: string;
  expectAny?: string[];
  expectRefusal?: true;
};

const REFUSAL_PHRASES = ['ไม่มีข้อมูล', "don't have"];

/** True when the answer satisfies the question's expectation (malformed questions never pass). */
export function scoreAnswer(q: EvalQuestion, answer: string): boolean {
  const text = answer.toLowerCase().replaceAll('’', "'");
  if (q.expectRefusal) return REFUSAL_PHRASES.some((p) => text.includes(p));
  if (q.expectAny?.length) return q.expectAny.some((t) => text.includes(t.toLowerCase()));
  return false;
}
