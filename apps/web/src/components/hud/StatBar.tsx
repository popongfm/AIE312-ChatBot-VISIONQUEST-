import { useId } from 'react';

/** A skill level from 1 to 5, drawn as five segments. */
export function StatBar({ name, level }: { name: string; level: number }) {
  const id = useId();
  const value = Math.min(5, Math.max(1, Math.round(level)));
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={id} className="truncate text-sm">{name}</span>
      <div role="meter" aria-labelledby={id} aria-valuemin={1} aria-valuemax={5} aria-valuenow={value} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-1.5 flex-1 ${n <= value ? 'bg-signal shadow-[0_0_8px_rgba(88,224,232,0.6)]' : 'bg-grid'}`} />
        ))}
      </div>
    </div>
  );
}
