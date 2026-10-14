import { displayName } from '@vq/shared';
import type { Member } from '@vq/shared';

export function SuggestedQuestions({ members, onPick }: { members: Member[]; onPick: (q: string) => void }) {
  const questions = [
    'ทีมนี้ถนัดอะไร',
    'แนะนำสมาชิกแต่ละคน',
    ...members.map((m) => `${displayName(m)} ทำโปรเจกต์อะไรบ้าง`),
  ];
  return (
    <div className="min-w-0 px-3 pb-1 pt-2 sm:px-5">
      <ul className="flex flex-wrap gap-2 py-3">
        {questions.map((q) => (
          <li key={q} className="min-w-0 max-w-full">
            <button
              type="button"
              onClick={() => onPick(q)}
              className="min-h-10 max-w-full break-words border border-quest/40 px-3 py-1.5 text-left text-sm text-ink [overflow-wrap:anywhere] transition-[background-color,border-color,color] motion-reduce:transition-none hover:border-quest hover:bg-quest/10 hover:text-quest"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
