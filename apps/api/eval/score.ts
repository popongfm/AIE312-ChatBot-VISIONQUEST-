import { readFile } from 'node:fs/promises';
import type { ChatStreamEvent } from '@vq/shared';

export type EvalQuestion = {
  id: string;
  scope: 'team' | 'member' | 'refusal';
  /** For scope "member": whose question it is (2 per member). */
  member?: string;
  question: string;
  /** Pass if any of these appears in the answer (case-insensitive). Every term must come from seed/. */
  expectAny?: string[];
  /** Pass if the answer refuses ("ไม่มีข้อมูล" / "don't have"). */
  expectRefusal?: true;
};

const REFUSALS = ['ไม่มีข้อมูล', "don't have"];

export function scoreAnswer(q: EvalQuestion, answer: string): boolean {
  const a = answer.toLowerCase();
  if (q.expectRefusal) return REFUSALS.some((r) => a.includes(r.toLowerCase()));
  return (q.expectAny ?? []).some((t) => a.includes(t.toLowerCase()));
}

export async function loadQuestions(): Promise<EvalQuestion[]> {
  return JSON.parse(await readFile(new URL('./questions.json', import.meta.url), 'utf8')) as EvalQuestion[];
}

type StreamEnd = Exclude<ChatStreamEvent, { type: 'token' }>;

/** Reads a chat SSE response: all `token` text joined, plus the final `done` / `error` event. */
export async function readSse(body: ReadableStream<Uint8Array>): Promise<{ text: string; end: StreamEnd | null }> {
  const decoder = new TextDecoder();
  let buf = '';
  let text = '';
  let end: StreamEnd | null = null;
  for await (const chunk of body) {
    buf += decoder.decode(chunk, { stream: true });
    for (let i = buf.indexOf('\n\n'); i >= 0; i = buf.indexOf('\n\n')) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const type = /^event: (.*)$/m.exec(block)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? '{}') as Record<string, unknown>;
      if (type === 'token') text += String(data.text ?? '');
      else end = { type, ...data } as StreamEnd;
    }
  }
  return { text, end };
}
