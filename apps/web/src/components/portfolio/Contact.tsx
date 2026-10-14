import type { Contact as ContactItem } from '@vq/shared';
import { SectionHeading } from './SectionHeading';

export function Contact({ contacts }: { contacts: ContactItem[] }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="px-4 pb-16 pt-12">
      <SectionHeading id="contact-title" index="04" code="COMMS CHANNEL">ติดต่อ</SectionHeading>
      <ul className="mt-6 flex flex-wrap gap-3">
        {contacts.map((c) => {
          const mail = c.url.startsWith('mailto:');
          return (
            <li key={c.url} className="min-w-0 max-w-full">
              <a
                href={c.url}
                {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })}
                className="inline-flex min-h-11 max-w-full items-center break-all border border-scan/40 bg-panel/70 px-4 text-scan transition-colors motion-reduce:transition-none hover:border-scan hover:bg-scan/10"
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
