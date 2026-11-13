import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * True once the element has scrolled into view (and stays true).
 * It is true from the start when motion is reduced or the browser has no IntersectionObserver,
 * so entrance effects can never leave content hidden.
 */
export function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const supported = typeof IntersectionObserver === 'function';
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !supported || reduced || seen) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [supported, reduced, seen]);

  return [ref, seen || reduced || !supported];
}
