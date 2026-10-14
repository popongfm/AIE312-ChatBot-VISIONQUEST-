import type { ReactNode } from 'react';

/** Section title with a decorative mono HUD index above it (the index is hidden from assistive tech). */
export function SectionHeading({ id, index, code, children }: { id: string; index: string; code: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p aria-hidden="true" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-scan">
        <span>{index}</span>
        <span className="h-px w-8 bg-scan/50" />
        <span translate="no">{code}</span>
      </p>
      <h2 id={id} className="break-words text-2xl font-semibold text-balance text-ink sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}
