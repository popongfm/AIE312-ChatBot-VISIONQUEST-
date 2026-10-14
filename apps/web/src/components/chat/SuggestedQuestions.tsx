import { displayName } from '@vq/shared';
import type { Member } from '@vq/shared';

export function SuggestedQuestions({ members, onPick }: { members: Member[]; onPick: (q: string) => void }) {
  const questions = [
    'ทีมนี้ถนัดอะไร',
    'แนะนำสมาชิกแต่ละคน',
    ...members.map((m) => `${displayName(m)} ทำโปรเจกต์อะไรบ้าง`),
  ];
  return (
    <ul className="flex flex-wrap gap-2 p-3">
      {questions.map((q) => (
        <li key={q} className="min-w-0 max-w-full">
          <button type="button" onClick={() => onPick(q)} className="max-w-full rounded border px-3 py-1 text-left text-sm break-words">
            {q}
          </button>
        </li>
      ))}
    </ul>
  );
}
