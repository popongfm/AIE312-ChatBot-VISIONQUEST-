import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

export function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const id = useId();
  const canSend = !busy && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <form
      className="border-t border-scan/20 bg-panel/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        พิมพ์ข้อความถึง Oracle
      </label>
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 items-start border border-scan/35 bg-void transition-[border-color,box-shadow] motion-reduce:transition-none focus-within:border-scan focus-within:shadow-[0_0_18px_-6px_var(--color-scan)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-scan">
          <span aria-hidden="true" className="select-none py-2 pl-3 font-mono text-scan">
            &gt;
          </span>
          <textarea
            id={id}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            className="min-w-0 flex-1 resize-none bg-transparent p-2 text-ink caret-scan focus-visible:shadow-none focus-visible:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!canSend}
          className="min-h-11 min-w-16 border border-scan bg-scan px-4 font-semibold text-void shadow-[0_0_18px_-6px_var(--color-scan)] transition-[background-color,opacity] motion-reduce:transition-none hover:bg-[#67e8f9] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-scan"
        >
          ส่ง
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">บทสนทนาถูกบันทึกเพื่อพัฒนาระบบ</p>
    </form>
  );
}
