import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { mickie } from '../../test/fixtures';
import { MessageBubble } from './MessageBubble';

test('user and AI bubbles are visually separated', () => {
  render(<MessageBubble message={{ key: '1', role: 'user', content: 'hi', citedMembers: [] }} members={[]} />);
  const user = screen.getByText('hi').closest('[data-role]')!;
  expect(user).toHaveAttribute('data-role', 'user');
  expect(user.className).toMatch(/justify-end/);

  render(<MessageBubble message={{ key: '2', role: 'model', content: 'hello', citedMembers: [] }} members={[]} />);
  const model = screen.getByText('hello').closest('[data-role]')!;
  expect(model).toHaveAttribute('data-role', 'model');
  expect(model.className).toMatch(/justify-start/);
});

test('AI raw HTML renders as text', () => { // Review Focus #5
  const { container } = render(
    <MessageBubble message={{ key: '2', role: 'model', content: '<img src=x onerror=alert(1)><script>x</script>', citedMembers: [] }} members={[]} />,
  );
  expect(container.querySelector('img, script')).toBeNull();
});

test('long unbroken token wraps', () => { // Review Focus #5
  render(<MessageBubble message={{ key: '3', role: 'model', content: 'a'.repeat(300), citedMembers: [] }} members={[]} />);
  expect(screen.getByTestId('bubble-content').className).toMatch(/overflow-wrap:anywhere/);
});

test('AI markdown is rendered and cited members appear as chips', () => {
  render(<MessageBubble message={{ key: '4', role: 'model', content: '**เด่น** เรื่อง AI', citedMembers: ['mickie'] }} members={[mickie]} />);
  expect(screen.getByText('เด่น').tagName).toBe('STRONG');
  expect(screen.getByRole('link', { name: /Mickie/ })).toBeInTheDocument();
});

test('an error message is announced as an alert', () => {
  render(<MessageBubble message={{ key: '5', role: 'error', content: 'การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง', citedMembers: [] }} members={[]} />);
  expect(screen.getByRole('alert')).toHaveTextContent('การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง');
});
