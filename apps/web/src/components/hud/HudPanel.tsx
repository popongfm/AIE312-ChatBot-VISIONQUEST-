import type { ReactNode } from 'react';

const TONE = {
  cyan: 'border-signal bg-signal/[0.07] shadow-[0_0_18px_rgba(88,224,232,0.25)] rounded-[2px] border',
  amber: 'chamfer border-t-2 border-stone bg-deck',
};

/** The two message surfaces: cyan for what the visitor wrote, amber for what the AI answered. */
export function HudPanel({ tone, className = '', children }: { tone: 'cyan' | 'amber'; className?: string; children: ReactNode }) {
  return <div data-tone={tone} className={`${TONE[tone]} ${className}`}>{children}</div>;
}
