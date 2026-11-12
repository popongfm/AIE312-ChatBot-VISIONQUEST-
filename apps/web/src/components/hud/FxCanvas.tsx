import { useEffect, useRef } from 'react';
import { drawFx, type FxKind, type FxState } from './fx';
import { useReducedMotion } from './useReducedMotion';

/**
 * One animated scene on a canvas that fills its box. With a `label` it is announced as an image;
 * without one it is decoration. Under reduced motion it draws a single still frame.
 */
export function FxCanvas({ kind, label, className = '' }: { kind: FxKind; label?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const state: FxState = {};
    const start = performance.now();
    let raf = 0;
    let visible = true;

    const paint = (now: number) => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
        if (el.width !== pw || el.height !== ph) { el.width = pw; el.height = ph; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawFx(kind, ctx, w, h, reduced ? 3 : (now - start) / 1000, state);
      }
    };
    const frame = (now: number) => {
      if (visible) paint(now);
      raf = requestAnimationFrame(frame);
    };

    // Nothing is drawn while the canvas is off screen.
    const observer = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
      : null;
    observer?.observe(el);

    if (reduced) {
      paint(start);
      const onResize = () => paint(start);
      window.addEventListener('resize', onResize);
      return () => { window.removeEventListener('resize', onResize); observer?.disconnect(); };
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer?.disconnect(); };
  }, [kind, reduced]);

  return label
    ? <canvas ref={ref} role="img" aria-label={label} className={`block ${className}`} />
    : <canvas ref={ref} aria-hidden="true" className={`pointer-events-none block ${className}`} />;
}
