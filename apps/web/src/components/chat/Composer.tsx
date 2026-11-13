import { type FormEvent, type KeyboardEvent, useState } from 'react';

/** Same limit as the API (MAX_MESSAGE_LENGTH). */
const MAX_LENGTH = 2000;

export function Composer({ disabled, onSend }: { disabled: boolean; onSend(content: string): void }) {
  const [value, setValue] = useState('');

  function submit() {
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue('');
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter that confirms Thai/Japanese input-method text must not send the message.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="composer" className="sr-only">คำถามถึง Vision</label>
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="glow-signal flex min-w-0 flex-[999_1_220px] items-start gap-3 rounded-[2px] border border-signal bg-deck px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal">
          <span aria-hidden="true" className="pt-[13px] font-mono text-lg text-stone">›</span>
          <textarea
            id="composer"
            rows={1}
            value={value}
            maxLength={MAX_LENGTH}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ถามเรื่องทีม สมาชิก หรือผลงาน"
            className="field-sizing-content max-h-40 min-h-14 min-w-0 flex-1 resize-none bg-transparent py-[14px] font-mono text-base text-ghost outline-none placeholder:text-haze disabled:opacity-60"
          />
        </div>
        <button type="submit" disabled={disabled || !value.trim()} className="btn-primary h-14 flex-[1_1_96px] px-7 text-[17px]">
          {disabled ? 'กำลังตอบ' : 'ส่ง'}
        </button>
      </div>
      <p className="text-sm text-haze">บทสนทนาถูกบันทึกเพื่อพัฒนาระบบ</p>
    </form>
  );
}
