import type { Role } from '@vq/shared';

export type HistoryTurn = { role: Role; text: string };

/**
 * Gemini needs alternating turns that start and end with `user`.
 * `prior` is oldest-first (caller passes at most 10).
 */
export function buildHistory(prior: { role: Role; content: string }[], newContent: string): HistoryTurn[] {
  const turns = [...prior.map((m) => ({ role: m.role, text: m.content })), { role: 'user' as const, text: newContent }];
  while (turns.length && turns[0].role === 'model') turns.shift();
  const out: HistoryTurn[] = [];
  for (const t of turns) {
    const last = out.at(-1);
    if (last && last.role === t.role) last.text = `${last.text}\n\n${t.text}`;
    else out.push({ ...t });
  }
  return out;
}
