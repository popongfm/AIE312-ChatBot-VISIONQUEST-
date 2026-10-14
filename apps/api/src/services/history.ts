import type { Role } from '@vq/shared';

export type HistoryTurn = { role: Role; text: string };

export function buildHistory(prior: { role: Role; content: string }[], newContent: string): HistoryTurn[] {
  const turns: HistoryTurn[] = [
    ...prior.map((p) => ({ role: p.role, text: p.content })),
    { role: 'user', text: newContent },
  ];
  const start = turns.findIndex((t) => t.role === 'user');
  const out: HistoryTurn[] = [];
  for (const t of turns.slice(start)) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.text += `\n\n${t.text}`;
    else out.push({ ...t });
  }
  return out;
}
