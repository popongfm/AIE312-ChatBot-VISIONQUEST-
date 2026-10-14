import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { Member } from '@vq/shared';
import { MessageBubble } from './MessageBubble';

const mickie = { slug: 'mickie', name: 'สมชาย', nickname: 'Mickie' } as Member;

describe('MessageBubble', () => {
  test('user and AI bubbles are visually separated', () => {
    const { rerender } = render(
      <MessageBubble message={{ key: '1', role: 'user', content: 'hi', citedMembers: [] }} members={[]} />,
    );
    const user = screen.getByText('hi').closest('[data-role]')!;
    expect(user).toHaveAttribute('data-role', 'user');
    expect(user.className).toMatch(/justify-end/);
    rerender(
      <MessageBubble message={{ key: '2', role: 'model', content: 'yo', citedMembers: [] }} members={[]} />,
    );
    const ai = screen.getByText('yo').closest('[data-role]')!;
    expect(ai).toHaveAttribute('data-role', 'model');
    expect(ai.className).toMatch(/justify-start/);
  });

  test('error bubble is left-aligned', () => {
    render(<MessageBubble message={{ key: '3', role: 'error', content: 'พัง', citedMembers: [] }} members={[]} />);
    const el = screen.getByText('พัง').closest('[data-role]')!;
    expect(el).toHaveAttribute('data-role', 'error');
    expect(el.className).toMatch(/justify-start/);
  });

  test('AI raw HTML renders as text, not elements', () => {
    const { container } = render(
      <MessageBubble
        message={{ key: '4', role: 'model', content: '<img src=x onerror=alert(1)><script>x</script>', citedMembers: [] }}
        members={[]}
      />,
    );
    expect(container.querySelector('img, script')).toBeNull();
  });

  test('AI markdown renders and links open in a new tab', () => {
    render(
      <MessageBubble
        message={{ key: '5', role: 'model', content: '**bold** [site](https://example.com)', citedMembers: [] }}
        members={[]}
      />,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    const link = screen.getByRole('link', { name: 'site' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  test('user content is plain text (no markdown)', () => {
    const { container } = render(
      <MessageBubble message={{ key: '6', role: 'user', content: '**not bold**', citedMembers: [] }} members={[]} />,
    );
    expect(container.querySelector('strong')).toBeNull();
    expect(screen.getByText('**not bold**')).toBeInTheDocument();
  });

  test('long unbroken token wraps', () => {
    const long = 'x'.repeat(300);
    for (const role of ['user', 'model', 'error'] as const) {
      const { container, unmount } = render(
        <MessageBubble message={{ key: role, role, content: long, citedMembers: [] }} members={[]} />,
      );
      const content = container.querySelector('[data-slot="content"]')!;
      expect(content.className).toMatch(/break-words/);
      expect(content.className).toMatch(/overflow-wrap/);
      expect(content.className).toMatch(/min-w-0/);
      unmount();
    }
  });

  test('model message shows citation chips', () => {
    render(
      <MessageBubble
        message={{ key: '7', role: 'model', content: 'a', citedMembers: ['mickie'] }}
        members={[mickie]}
      />,
    );
    expect(screen.getByRole('link', { name: /Mickie/ })).toBeInTheDocument();
  });

  test('error bubble resend button calls onResend and respects disabled', async () => {
    const onResend = vi.fn();
    const msg = { key: '8', role: 'error' as const, content: 'พัง', citedMembers: [] };
    const { rerender } = render(<MessageBubble message={msg} members={[]} onResend={onResend} />);
    await userEvent.click(screen.getByRole('button', { name: 'ส่งใหม่' }));
    expect(onResend).toHaveBeenCalledTimes(1);
    rerender(<MessageBubble message={msg} members={[]} onResend={onResend} resendDisabled />);
    expect(screen.getByRole('button', { name: 'ส่งใหม่' })).toBeDisabled();
  });

  test('markdown images are not rendered; alt text remains', () => {
    const { container } = render(
      <MessageBubble message={{ key: '9', role: 'model', content: '![alt](https://x.test/p.png)', citedMembers: [] }} members={[]} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('alt')).toBeInTheDocument();
  });
});
