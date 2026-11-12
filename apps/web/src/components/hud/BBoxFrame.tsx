import type { ReactNode } from 'react';

const CORNERS = [
  'top-0 left-0 border-t-2 border-l-2',
  'top-0 right-0 border-t-2 border-r-2',
  'bottom-0 left-0 border-b-2 border-l-2',
  'bottom-0 right-0 border-b-2 border-r-2',
];

/** Four corner brackets around the children, like a detection box, with a small HUD label above. */
export function BBoxFrame({ label, confidence, className = '', children }: { label: string; confidence?: number; className?: string; children: ReactNode }) {
  const text = confidence === undefined ? label : `${label} · conf ${confidence.toFixed(2)}`;
  return (
    <div className={`relative ${className}`}>
      <div className="hud-label mb-2">{text}</div>
      <div className="relative p-3">
        {CORNERS.map((c) => <span key={c} aria-hidden="true" className={`pointer-events-none absolute h-4 w-4 border-signal ${c}`} />)}
        {children}
      </div>
    </div>
  );
}
