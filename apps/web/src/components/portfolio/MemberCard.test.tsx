import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { Member } from '@vq/shared';
import { MemberCard } from './MemberCard';

const mickie: Member = {
  slug: 'mickie', name: 'สมชาย', nickname: 'Mickie', role: 'AI Engineer', bio: 'ชอบ AI',
  avatarUrl: 'https://x/a.png', sortOrder: 1, skills: [], projects: [],
};

describe('MemberCard', () => {
  test('incomplete member renders with placeholder avatar', () => {
    render(<MemberCard member={{ ...mickie, avatarUrl: null, bio: null, skills: [], projects: [] }} onOpen={() => {}} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/avatars/placeholder.svg');
  });

  test('falls back to placeholder when the image fails to load', () => {
    render(<MemberCard member={{ ...mickie, avatarUrl: 'TODO: /avatars/mickie.png' }} onOpen={() => {}} />);
    const img = screen.getByRole('img', { name: 'Mickie' });
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/avatars/placeholder.svg');
  });

  test('shows name, role, bio and button calls onOpen', async () => {
    const onOpen = vi.fn();
    render(<MemberCard member={mickie} onOpen={onOpen} expanded={false} />);
    expect(screen.getByText('AI Engineer')).toBeInTheDocument();
    expect(screen.getByText('ชอบ AI')).toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
