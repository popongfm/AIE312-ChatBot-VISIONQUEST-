import type { ReactNode } from 'react';
import { useInView } from './useInView';

/** Fades and slides its children in the first time they scroll into view. `delay` (ms) staggers siblings. */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-reveal="" data-revealed={inView ? '' : undefined} style={delay ? { transitionDelay: `${delay}ms` } : undefined} className={className}>
      {children}
    </div>
  );
}
