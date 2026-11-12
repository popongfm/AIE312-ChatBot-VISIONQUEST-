import { displayName, type Member } from '@vq/shared';

export function suggestedQuestions(members: Member[]): string[] {
  return ['ทีมนี้ถนัดอะไร', 'แนะนำสมาชิกแต่ละคน', ...members.map((m) => `${displayName(m)} ทำโปรเจกต์อะไรบ้าง`)];
}

export function SuggestedQuestions({ members, onPick }: { members: Member[]; onPick(question: string): void }) {
  return (
    <section className="flex flex-col gap-4 rounded-[2px] border border-dashed border-grid p-5 sm:p-8" aria-labelledby="suggested-title">
      <h2 id="suggested-title" className="text-2xl font-semibold">เริ่มจากคำถามเหล่านี้</h2>
      <div className="flex flex-wrap gap-3">
        {suggestedQuestions(members).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="min-h-11 rounded-[2px] border border-grid bg-deck px-4 py-2 text-left hover:border-signal hover:text-signal"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
