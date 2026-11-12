import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { mockMatchMedia } from '../../test/setup';
import { BBoxFrame } from './BBoxFrame';
import { drawFx, type FxKind, SPHERE_LINKS, SPHERE_NODES } from './fx';
import { FxCanvas } from './FxCanvas';
import { HudPanel } from './HudPanel';
import { ScanLine } from './ScanLine';
import { StatBar } from './StatBar';
import { useReducedMotion } from './useReducedMotion';

afterEach(() => { mockMatchMedia(false); });

test('BBoxFrame shows label and confidence', () => {
  render(<BBoxFrame label="CLASS: AI Engineer" confidence={0.93}>x</BBoxFrame>);
  expect(screen.getByText('CLASS: AI Engineer · conf 0.93')).toBeInTheDocument();
  expect(screen.getByText('x')).toBeInTheDocument();
});

test('BBoxFrame without confidence shows the label alone', () => {
  render(<BBoxFrame label="CLASS: Backend">x</BBoxFrame>);
  expect(screen.getByText('CLASS: Backend')).toBeInTheDocument();
});

test('ScanLine hidden under reduced motion', () => {
  mockMatchMedia(true);
  const { container } = render(<ScanLine active />);
  expect(container).toBeEmptyDOMElement();
});

test('ScanLine renders a decorative line only while active', () => {
  const { container, rerender } = render(<ScanLine active />);
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  rerender(<ScanLine active={false} />);
  expect(container).toBeEmptyDOMElement();
});

test('StatBar exposes meter semantics', () => {
  render(<StatBar name="Python" level={4} />);
  const meter = screen.getByRole('meter', { name: 'Python' });
  expect(meter).toHaveAttribute('aria-valuenow', '4');
  expect(meter).toHaveAttribute('aria-valuemin', '1');
  expect(meter).toHaveAttribute('aria-valuemax', '5');
});

test('StatBar keeps an out-of-range level inside 1–5', () => {
  render(<><StatBar name="Low" level={0} /><StatBar name="High" level={9} /></>);
  expect(screen.getByRole('meter', { name: 'Low' })).toHaveAttribute('aria-valuenow', '1');
  expect(screen.getByRole('meter', { name: 'High' })).toHaveAttribute('aria-valuenow', '5');
});

test('HudPanel marks its tone', () => {
  render(<HudPanel tone="amber">answer</HudPanel>);
  expect(screen.getByText('answer').closest('[data-tone]')).toHaveAttribute('data-tone', 'amber');
});

test('useReducedMotion follows the system setting as it changes', () => {
  const flip = mockMatchMedia(false);
  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(false);
  act(() => flip(true));
  expect(result.current).toBe(true);
});

test('FxCanvas is decorative unless it is given a label', () => {
  const { container, rerender } = render(<FxCanvas kind="mesh" />);
  expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  rerender(<FxCanvas kind="sphere" label="ทรงกลมโครงข่ายข้อมูลของทีม" />);
  expect(screen.getByRole('img', { name: 'ทรงกลมโครงข่ายข้อมูลของทีม' })).toBeInTheDocument();
});

test('every scene draws with finite coordinates at any size and time', () => {
  let calls = 0;
  let bad = 0;
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, prop: string) => {
      if (prop.startsWith('create')) return () => ({ addColorStop() {} });
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls++;
        if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) bad++;
      };
    },
    set: (target, prop: string, value) => { target[prop] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  for (const kind of ['sphere', 'mesh', 'stream', 'core'] as FxKind[]) {
    for (const [w, h] of [[1200, 600], [360, 300], [40, 40]]) {
      const state = {};
      // -0.02: the first animation frame can carry a timestamp from just before the canvas mounted
      for (const t of [-0.02, 0, 1.7, 40, 999.3]) drawFx(kind, ctx, w, h, t, state);
    }
  }
  expect(calls).toBeGreaterThan(1000);
  expect(bad).toBe(0);
});

test('the sphere reports the real number of nodes and links it draws', () => {
  expect(SPHERE_NODES).toBe(120);
  expect(SPHERE_LINKS).toBeGreaterThan(SPHERE_NODES);
});
