import { expect, test } from 'vitest';
import { buildHistory } from './history';

test('leading model turns dropped, adjacent users merged, ends with user', () => {
  expect(buildHistory([{ role: 'model', content: 'x' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }], 'c'))
    .toEqual([{ role: 'user', text: 'a\n\nb\n\nc' }]);
  expect(buildHistory([{ role: 'user', content: 'a' }, { role: 'model', content: 'r' }], 'c'))
    .toEqual([{ role: 'user', text: 'a' }, { role: 'model', text: 'r' }, { role: 'user', text: 'c' }]);
});
test('empty history gives a single user turn', () =>
  expect(buildHistory([], 'hi')).toEqual([{ role: 'user', text: 'hi' }]));
