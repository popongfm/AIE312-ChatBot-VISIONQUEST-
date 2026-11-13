import { useEffect, useLayoutEffect, useRef } from 'react';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

const graphemes = (text: string): string[] =>
  typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
    : Array.from(text);

const bit = () => (Math.random() < 0.5 ? '0' : '1');
const scramble = (chars: string[], solved: number) =>
  chars.map((ch, i) => (i < solved || ch === ' ' ? ch : bit())).join('');

/**
 * Text that "decodes" from binary when it scrolls into view.
 * Screen readers always get the real text; only the visible copy scrambles.
 */
export function DecodeText({ text }: { text: string }) {
  const visible = useRef<HTMLSpanElement>(null);
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const animated = !reduced && typeof IntersectionObserver === 'function';

  // Before the first paint: start as binary, so the real text never flashes before it decodes.
  useLayoutEffect(() => {
    if (visible.current) visible.current.textContent = animated && !inView ? scramble(graphemes(text), 0) : text;
    // Only the starting state: the effect below owns the text once the element is in view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animated]);

  useEffect(() => {
    const el = visible.current;
    if (!el || !animated || !inView) return;
    const chars = graphemes(text);
    const perChar = Math.max(1, Math.min(3, Math.round(36 / chars.length))); // whole text settles in about a second
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const solved = Math.floor(frame / perChar);
      el.textContent = solved >= chars.length ? text : scramble(chars, solved);
      if (solved >= chars.length) clearInterval(timer);
    }, 30);
    return () => { clearInterval(timer); el.textContent = text; };
  }, [text, animated, inView]);

  return (
    <span ref={ref}>
      <span ref={visible} aria-hidden="true">{text}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
