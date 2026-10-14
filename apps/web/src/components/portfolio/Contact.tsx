import type { Contact as ContactItem } from '@vq/shared';
import { SectionHeading } from './SectionHeading';

export function Contact({ contacts }: { contacts: ContactItem[] }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="px-4 pb-20 pt-16 sm:px-8 sm:pt-20">
      <SectionHeading id="contact-title">ติดต่อ</SectionHeading>
      <ul className="mt-5 flex flex-col items-start gap-1">
        {contacts.map((c) => {
          const mail = c.url.startsWith('mailto:');
          return (
            <li key={c.url} className="min-w-0 max-w-full">
              <a
                href={c.url}
                {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })}
                className="inline-flex min-h-11 max-w-full items-center text-lg text-ink underline decoration-ink-muted/60 underline-offset-[6px] [overflow-wrap:anywhere] transition-[color,text-decoration-color] motion-reduce:transition-none hover:text-scan hover:decoration-scan"
              >
                {c.label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
