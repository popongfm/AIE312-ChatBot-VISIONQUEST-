import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mockMatchMedia } from '../../test/setup';
import { DecodeText } from './DecodeText';
import { drawFx } from './fx';
import { Reveal } from './Reveal';
import { ScrollProgress } from './ScrollProgress';

/** A controllable IntersectionObserver: `enter()` reports every observed element as on screen. */
function mockIntersectionObserver() {
  const callbacks: IntersectionObserverCallback[] = [];
  class FakeObserver {
    constructor(cb: IntersectionObserverCallback) { callbacks.push(cb); }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return {
    enter: () => callbacks.forEach((cb) => cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)),
  };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  mockMatchMedia(false);
});

test('Reveal shows its content at once where the browser cannot tell what is on screen', () => {
  render(<Reveal>เนื้อหา</Reveal>);
  expect(screen.getByText('เนื้อหา').closest('[data-reveal]')).toHaveAttribute('data-revealed');
});

test('Reveal waits until it scrolls into view', () => {
  const io = mockIntersectionObserver();
  render(<Reveal>เนื้อหา</Reveal>);
  const box = screen.getByText('เนื้อหา').closest('[data-reveal]')!;
  expect(box).not.toHaveAttribute('data-revealed');
  act(() => io.enter());
  expect(box).toHaveAttribute('data-revealed');
});

test('Reveal never hides content under reduced motion', () => {
  mockMatchMedia(true);
  mockIntersectionObserver();
  render(<Reveal>เนื้อหา</Reveal>);
  expect(screen.getByText('เนื้อหา').closest('[data-reveal]')).toHaveAttribute('data-revealed');
});

test('DecodeText keeps the real text for screen readers while the visible copy scrambles, then settles on it', () => {
  const io = mockIntersectionObserver();
  render(<h2><DecodeText text="สมาชิก" /></h2>);
  const heading = screen.getByRole('heading', { name: 'สมาชิก' });
  const visible = heading.querySelector('[aria-hidden="true"]')!;
  act(() => io.enter());
  act(() => { vi.advanceTimersByTime(60); });
  expect(visible.textContent).not.toBe('สมาชิก');
  expect(visible.textContent).toMatch(/[01]/);
  expect(screen.getByRole('heading', { name: 'สมาชิก' })).toBe(heading);
  act(() => { vi.advanceTimersByTime(3000); });
  expect(visible.textContent).toBe('สมาชิก');
});

test('DecodeText is plain text under reduced motion and without IntersectionObserver', () => {
  mockMatchMedia(true);
  const { container, unmount } = render(<DecodeText text="ผลงาน" />);
  act(() => { vi.advanceTimersByTime(100); });
  expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe('ผลงาน');
  unmount();
  mockMatchMedia(false);
  const again = render(<DecodeText text="ผลงาน" />);
  act(() => { vi.advanceTimersByTime(100); });
  expect(again.container.querySelector('[aria-hidden="true"]')!.textContent).toBe('ผลงาน');
});

test('ScrollProgress grows with how far the page has been scrolled', () => {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  const { container } = render(<ScrollProgress />);
  const bar = container.firstElementChild as HTMLElement;
  expect(bar).toHaveAttribute('aria-hidden', 'true');
  expect(bar.style.transform).toBe('scaleX(0)');
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 1000 });
  act(() => { window.dispatchEvent(new Event('scroll')); });
  expect(bar.style.transform).toBe('scaleX(0.5)');
});

test('the star field and the sphere follow the pointer without breaking', () => {
  let bad = 0;
  let calls = 0;
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, prop: string) => {
      if (prop.startsWith('create')) return () => ({ addColorStop() {} });
      if (prop in target) return target[prop];
      return (...args: unknown[]) => { calls++; if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) bad++; };
    },
    set: (target, prop: string, value) => { target[prop] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  for (const kind of ['stars', 'sphere'] as const) {
    const state: Record<string, unknown> = {};
    for (const [t, pointer] of [[0, undefined], [0.5, [0.2, -0.4]], [9, [1, 1]], [30, [-3, 7]]] as const) {
      state.pointer = pointer;
      drawFx(kind, ctx, 800, 600, t, state);
    }
    drawFx(kind, ctx, 320, 2000, 1, state);
  }
  expect(calls).toBeGreaterThan(500);
  expect(bad).toBe(0);
});
