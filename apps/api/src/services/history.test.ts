import { describe, expect, test } from 'vitest';
import { buildHistory } from './history.js';

describe('buildHistory', () => {
  test('leading model turns dropped, adjacent users merged, ends with user', () => {
    expect(
      buildHistory([{ role: 'model', content: 'x' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }], 'c'),
    ).toEqual([{ role: 'user', text: 'a\n\nb\n\nc' }]);
    expect(buildHistory([{ role: 'user', content: 'a' }, { role: 'model', content: 'r' }], 'c')).toEqual([
      { role: 'user', text: 'a' },
      { role: 'model', text: 'r' },
      { role: 'user', text: 'c' },
    ]);
  });
  test('empty prior gives just the new message', () =>
    expect(buildHistory([], 'hi')).toEqual([{ role: 'user', text: 'hi' }]));
  test('only model turns prior gives just the new message', () =>
    expect(buildHistory([{ role: 'model', content: 'x' }], 'hi')).toEqual([{ role: 'user', text: 'hi' }]));
  test('does not mutate input', () => {
    const prior = [{ role: 'model' as const, content: 'x' }, { role: 'user' as const, content: 'a' }];
    const copy = structuredClone(prior);
    buildHistory(prior, 'c');
    expect(prior).toEqual(copy);
  });
});
