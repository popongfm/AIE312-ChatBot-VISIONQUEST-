import type { ReactNode } from 'react';

const CORNERS = [
  'left-0 top-0 origin-top-left border-l-2 border-t-2',
  'right-0 top-0 origin-top-right border-r-2 border-t-2',
  'bottom-0 left-0 origin-bottom-left border-b-2 border-l-2',
  'bottom-0 right-0 origin-bottom-right border-b-2 border-r-2',
];

type Props = {
  label: string;
  confidence?: number;
  children: ReactNode;
  className?: string;
};

/** Computer-vision style detection box: 4 corner brackets plus a mono class/confidence tag. */
export function BBoxFrame({ label, confidence, children, className = '' }: Props) {
  const text = confidence === undefined ? label : `${label} · conf ${confidence.toFixed(2)}`;
  return (
    <div className={`flex min-w-0 max-w-full flex-col items-start ${className}`}>
      <span
        aria-hidden="true"
        translate="no"
        className="max-w-full truncate bg-scan px-1.5 py-px font-mono text-[11px] font-semibold uppercase leading-4 tracking-wider text-void"
      >
        {text}
      </span>
      <div className="relative w-full min-w-0 p-2">
        {CORNERS.map((pos) => (
          <span
            key={pos}
            data-slot="corner"
            aria-hidden="true"
            className={`pointer-events-none absolute h-4 w-4 border-scan motion-safe:animate-detect ${pos}`}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
