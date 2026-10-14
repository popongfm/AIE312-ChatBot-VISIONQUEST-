import type { Contact as ContactItem } from '@vq/shared';

export function Contact({ contacts }: { contacts: ContactItem[] }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="px-4 py-8">
      <h2 id="contact-title" className="text-2xl font-semibold">ติดต่อ</h2>
      <ul className="mt-4 space-y-2">
        {contacts.map((c) => {
          const mail = c.url.startsWith('mailto:');
          return (
            <li key={c.url} className="min-w-0">
              <a
                href={c.url}
                {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })}
                className="break-all underline"
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
