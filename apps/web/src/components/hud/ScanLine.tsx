import { useReducedMotion } from './useReducedMotion';

/** A thin line sweeping down its positioned parent. Purely decorative, so it is not drawn at all under reduced motion. */
export function ScanLine({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;
  return <span aria-hidden="true" className="vq-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-signal opacity-60" />;
}
