import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { mickie } from '../../test/fixtures';
import { CitationChips } from './CitationChips';

test('citation chips link to member anchors', () => {
  render(<CitationChips slugs={['mickie', 'ghost']} members={[mickie]} />);
  expect(screen.getByRole('link', { name: /Mickie/ })).toHaveAttribute('href', '/#member-mickie');
  expect(screen.getAllByRole('link')).toHaveLength(1);
});

test('no chips, no list', () => {
  const { container } = render(<CitationChips slugs={['ghost']} members={[mickie]} />);
  expect(container).toBeEmptyDOMElement();
});
