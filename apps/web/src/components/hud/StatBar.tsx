const SEGMENTS = [1, 2, 3, 4, 5];

/** Game-style segmented skill bar exposed to assistive tech as a 1–5 meter. */
export function StatBar({ name, level }: { name: string; level: number }) {
  return (
    <div
      role="meter"
      aria-label={name}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={level}
      aria-valuetext={`${level}/5`}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs"
    >
      <span data-slot="name" className="truncate font-sans text-sm text-ink-muted">{name}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {SEGMENTS.map((n) => (
          <span
            key={n}
            className={`h-2.5 w-3.5 -skew-x-12 ${n <= level ? 'bg-scan' : 'bg-line'}`}
          />
        ))}
      </span>
      <span className="w-7 text-right font-mono tabular-nums text-ink" aria-hidden="true">
        {level}/5
      </span>
    </div>
  );
}
