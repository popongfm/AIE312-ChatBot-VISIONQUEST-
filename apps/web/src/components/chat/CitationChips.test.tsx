import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { Member } from '@vq/shared';
import { CitationChips } from './CitationChips';

const mickie = { slug: 'mickie', name: 'สมชาย', nickname: 'Mickie' } as Member;
const noNick = { slug: 'nok', name: 'นก ใจดี', nickname: null } as Member;

test('citation chips link to member anchors and skip unknown slugs', () => {
  render(<CitationChips slugs={['mickie', 'ghost']} members={[mickie]} />);
  expect(screen.getByRole('link', { name: /Mickie/ })).toHaveAttribute('href', '/#member-mickie');
  expect(screen.getAllByRole('link')).toHaveLength(1);
});

test('falls back to full name when no nickname', () => {
  render(<CitationChips slugs={['nok']} members={[noNick]} />);
  expect(screen.getByRole('link', { name: /นก ใจดี/ })).toBeInTheDocument();
});

test('renders nothing when no slug is known', () => {
  const { container } = render(<CitationChips slugs={['ghost']} members={[mickie]} />);
  expect(container).toBeEmptyDOMElement();
});
