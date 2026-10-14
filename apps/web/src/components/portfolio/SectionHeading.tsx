import type { ReactNode } from 'react';

/** Plain section title — sections are not a sequence, so no numbered eyebrow. */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="min-w-0 break-words text-[1.5625rem] font-semibold leading-snug text-balance text-ink sm:text-[1.9375rem]">
      {children}
    </h2>
  );
}
