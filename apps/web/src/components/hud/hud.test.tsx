import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { BBoxFrame } from './BBoxFrame';
import { HudPanel } from './HudPanel';
import { ScanLine } from './ScanLine';
import { StatBar } from './StatBar';
import { useReducedMotion } from './useReducedMotion';

type Listener = (e: { matches: boolean }) => void;

/** Installs a controllable `window.matchMedia`; returns a setter that fires `change` listeners. */
function mockMatchMedia(initial: boolean) {
  const state = { matches: initial };
  const listeners = new Set<Listener>();
  window.matchMedia = ((media: string) => ({
    media,
    get matches() {
      return state.matches;
    },
    onchange: null,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    addListener: (l: Listener) => listeners.add(l),
    removeListener: (l: Listener) => listeners.delete(l),
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
  return (next: boolean) => {
    state.matches = next;
    listeners.forEach((l) => l({ matches: next }));
  };
}

afterEach(() => {
  // jsdom has no matchMedia by default; restore that.
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('useReducedMotion', () => {
  test('is false when matchMedia is missing (jsdom/SSR-safe)', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  test('reflects the media query and reacts to change events', () => {
    const set = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => set(true));
    expect(result.current).toBe(true);
    act(() => set(false));
    expect(result.current).toBe(false);
  });
});

describe('BBoxFrame', () => {
  test('BBoxFrame shows label and confidence', () => {
    render(<BBoxFrame label="CLASS: AI Engineer" confidence={0.93}>x</BBoxFrame>);
    expect(screen.getByText('CLASS: AI Engineer · conf 0.93')).toBeInTheDocument();
    expect(screen.getByText('x')).toBeInTheDocument();
  });

  test('without confidence shows only the label', () => {
    render(<BBoxFrame label="TARGET">x</BBoxFrame>);
    expect(screen.getByText('TARGET')).toBeInTheDocument();
    expect(screen.queryByText(/conf/)).toBeNull();
  });

  test('draws 4 decorative corner brackets', () => {
    const { container } = render(<BBoxFrame label="L">x</BBoxFrame>);
    expect(container.querySelectorAll('[data-slot="corner"][aria-hidden="true"]')).toHaveLength(4);
  });
});

describe('ScanLine', () => {
  test('ScanLine hidden under reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(<ScanLine active />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when inactive', () => {
    mockMatchMedia(false);
    const { container } = render(<ScanLine active={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders a decorative line when motion is allowed', () => {
    mockMatchMedia(false);
    const { container } = render(<ScanLine active />);
    const line = container.firstElementChild;
    expect(line).not.toBeNull();
    expect(line).toHaveAttribute('aria-hidden', 'true');
  });

  test('disappears when reduced motion is switched on', () => {
    const set = mockMatchMedia(false);
    const { container } = render(<ScanLine active />);
    expect(container).not.toBeEmptyDOMElement();
    act(() => set(true));
    expect(container).toBeEmptyDOMElement();
  });
});

describe('StatBar', () => {
  test('StatBar exposes meter semantics', () => {
    render(<StatBar name="Python" level={4} />);
    const meter = screen.getByRole('meter', { name: 'Python' });
    expect(meter).toHaveAttribute('aria-valuenow', '4');
    expect(meter).toHaveAttribute('aria-valuemin', '1');
    expect(meter).toHaveAttribute('aria-valuemax', '5');
  });
});

describe('HudPanel', () => {
  test('renders children with the given tone', () => {
    render(<HudPanel tone="amber">inside</HudPanel>);
    expect(screen.getByText('inside').closest('[data-tone]')).toHaveAttribute('data-tone', 'amber');
  });
});
