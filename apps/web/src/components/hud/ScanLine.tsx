import { useReducedMotion } from './useReducedMotion';

type Props = {
  active: boolean;
  /** Number of sweeps; omit for an endless loop (only for short-lived states like "analyzing…"). */
  sweeps?: number;
};

/** Decorative sweeping scan band. Parent must be `relative overflow-hidden`. Off under reduced motion. */
export function ScanLine({ active, sweeps }: Props) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;
  return (
    <span
      aria-hidden="true"
      className="vq-scanline pointer-events-none absolute inset-0 motion-safe:animate-scan"
      style={sweeps === undefined ? undefined : { animationIterationCount: sweeps }}
    />
  );
}
