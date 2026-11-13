import { useEffect, useRef } from 'react';

/** A thin line across the top of the window that fills as the page is scrolled. Decoration only. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const done = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${Math.round(done * 1e4) / 1e4})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ transform: 'scaleX(0)' }}
      className="pointer-events-none fixed top-0 left-0 z-50 h-[2px] w-full origin-left bg-signal shadow-[0_0_12px_rgba(88,224,232,0.9)]"
    />
  );
}
