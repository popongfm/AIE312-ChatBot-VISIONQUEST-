import type { ReactNode } from 'react';

const TONES = {
  cyan: { box: 'border-scan/35 shadow-[0_0_28px_-14px_var(--color-scan)]', tick: 'border-scan' },
  amber: { box: 'border-quest/45 shadow-[0_0_28px_-14px_var(--color-quest)]', tick: 'border-quest' },
} as const;

type Props = { tone: 'cyan' | 'amber'; children: ReactNode; className?: string };

/** Translucent HUD panel with tone-coloured border and two corner ticks. */
export function HudPanel({ tone, children, className = '' }: Props) {
  const t = TONES[tone];
  return (
    <div data-tone={tone} className={`relative min-w-0 border bg-panel/85 ${t.box} ${className}`}>
      <span aria-hidden="true" className={`pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l-2 border-t-2 ${t.tick}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b-2 border-r-2 ${t.tick}`} />
      {children}
    </div>
  );
}
