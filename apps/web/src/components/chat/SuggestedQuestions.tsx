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
      <p aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.2em] text-quest">
        AVAILABLE QUESTS
      </p>
      <ul className="flex flex-wrap gap-2 py-3">
        {questions.map((q) => (
          <li key={q} className="min-w-0 max-w-full">
            <button
              type="button"
              onClick={() => onPick(q)}
              className="min-h-10 max-w-full break-words border border-scan/35 bg-panel/80 px-3 py-1.5 text-left text-sm text-ink transition-colors motion-reduce:transition-none hover:border-scan hover:bg-scan/10 hover:text-scan"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
