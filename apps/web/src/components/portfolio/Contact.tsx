import type { Contact as ContactLink } from '@vq/shared';
import { DecodeText } from '../hud/DecodeText';

export function Contact({ contacts }: { contacts: ContactLink[] }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="flex scroll-mt-24 flex-wrap gap-x-16 gap-y-6 py-16 sm:py-[72px]">
      <h2 id="contact-title" className="flex-[1_1_280px] text-[clamp(1.75rem,4vw,2.5rem)] font-semibold"><DecodeText text="ติดต่อทีม" /></h2>
      <div className="flex min-w-0 flex-[2_1_420px] flex-col">
        {contacts.length === 0 ? <p className="text-haze">ยังไม่มีช่องทางติดต่อ</p> : contacts.map((c) => (
          <a key={c.url} href={c.url} className="flex min-h-11 items-center font-mono text-[17px] underline-offset-4 [overflow-wrap:anywhere]">{c.label}</a>
        ))}
      </div>
    </section>
  );
}
