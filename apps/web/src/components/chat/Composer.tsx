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
      className="border-t p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        พิมพ์ข้อความถึง Oracle
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          className="min-w-0 flex-1 resize-none rounded border p-2"
        />
        <button type="submit" disabled={!canSend} className="rounded border px-3 py-2 disabled:opacity-50">
          ส่ง
        </button>
      </div>
      <p className="mt-1 text-xs opacity-70">บทสนทนาถูกบันทึกเพื่อพัฒนาระบบ</p>
    </form>
  );
}
