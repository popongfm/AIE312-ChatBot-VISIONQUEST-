import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { mickie } from '../../test/fixtures';
import { initials, MemberCard } from './MemberCard';
import { askHref } from './MemberDetail';

test('incomplete member renders with an initials monogram and no broken image', () => { // Review Focus #3
  render(<MemberCard member={{ ...mickie, avatarUrl: null, bio: null, skills: [], projects: [] }} onOpen={() => {}} />);
  expect(screen.getByText('MI')).toBeInTheDocument();
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Mickie' })).toBeInTheDocument();
  expect(screen.getByText('ยังไม่มีข้อมูลทักษะ')).toBeInTheDocument();
});

test('shows role and the three strongest skills, and opens the detail', async () => {
  const onOpen = vi.fn();
  render(<MemberCard member={mickie} onOpen={onOpen} />);
  expect(screen.getByText('CLASS: Lead · AI')).toBeInTheDocument();
  expect(screen.getByRole('meter', { name: 'Python' })).toHaveAttribute('aria-valuenow', '4');
  expect(screen.getByRole('meter', { name: 'PostgreSQL' })).toHaveAttribute('aria-valuenow', '3');
  expect(screen.getByRole('meter', { name: 'Docker' })).toHaveAttribute('aria-valuenow', '2');
  expect(screen.queryByText('React')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'ดูรายละเอียดของ Mickie' }));
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test('initials: two words give two letters, one word gives its first two, Thai keeps whole characters', () => {
  expect(initials('Popong Faimoon')).toBe('PF');
  expect(initials('Mickie')).toBe('MI');
  expect(initials('น้ำ ใส')).toBe('น้ำใ');
  expect(initials('')).toBe('?');
});

test('ask link encodes nickname question', () => {
  expect(askHref('Mickie')).toBe('/chat?ask=' + encodeURIComponent('Mickie ทำโปรเจกต์อะไรบ้าง และถนัดอะไร'));
});
