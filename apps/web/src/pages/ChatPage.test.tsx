import type { ChatStreamEvent } from '@vq/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { api } from '../lib/api';
import { portfolio } from '../test/fixtures';
import { ChatPage } from './ChatPage';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    api: {
      getHealth: vi.fn(), getPortfolio: vi.fn(), listConversations: vi.fn(), createConversation: vi.fn(),
      getMessages: vi.fn(), deleteConversation: vi.fn(), sendMessage: vi.fn(),
    },
  };
});
const mocked = vi.mocked(api);
type OnEvent = (e: ChatStreamEvent) => void;

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}
function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/chat" element={<><ChatPage /><LocationProbe /></>} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocked.listConversations.mockResolvedValue([]);
  mocked.getPortfolio.mockResolvedValue(portfolio);
  mocked.createConversation.mockResolvedValue({ id: 'c1', title: 't', createdAt: '' });
  mocked.sendMessage.mockImplementation(async (_i: string, _c: string, on: OnEvent) => {
    on({ type: 'token', text: 'ทีมเราถนัด AI' });
    on({ type: 'done', messageId: 1, citedMembers: ['mickie'] });
    return { completed: true };
  });
});

test('?ask is sent once and removed from URL', async () => { // Review Focus #1
  renderAt('/chat?ask=' + encodeURIComponent('ทีมนี้ถนัดอะไร'));
  await waitFor(() => expect(mocked.sendMessage).toHaveBeenCalledTimes(1));
  expect(mocked.sendMessage.mock.calls[0][1]).toBe('ทีมนี้ถนัดอะไร');
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/chat'));
  expect(await screen.findByText('ทีมเราถนัด AI')).toBeInTheDocument();
  expect(mocked.sendMessage).toHaveBeenCalledTimes(1);
});

test('empty chat offers suggested questions, one per member; picking one sends it', async () => {
  renderAt('/chat');
  expect(await screen.findByRole('button', { name: 'ทีมนี้ถนัดอะไร' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'แนะนำสมาชิกแต่ละคน' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mickie ทำโปรเจกต์อะไรบ้าง' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Nat Example ทำโปรเจกต์อะไรบ้าง' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'แนะนำสมาชิกแต่ละคน' }));
  await waitFor(() => expect(mocked.sendMessage.mock.calls[0][1]).toBe('แนะนำสมาชิกแต่ละคน'));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'ทีมนี้ถนัดอะไร' })).toBeNull());
  expect(await screen.findByRole('link', { name: /Mickie/ })).toHaveAttribute('href', '/#member-mickie');
});

test('Enter sends, Shift+Enter adds a newline, and the caption is shown', async () => {
  renderAt('/chat');
  const box = await screen.findByRole('textbox', { name: 'คำถามถึง Oracle' });
  await userEvent.type(box, 'บรรทัดหนึ่ง{Shift>}{Enter}{/Shift}บรรทัดสอง');
  expect(mocked.sendMessage).not.toHaveBeenCalled();
  expect(box).toHaveValue('บรรทัดหนึ่ง\nบรรทัดสอง');
  await userEvent.type(box, '{Enter}');
  await waitFor(() => expect(mocked.sendMessage.mock.calls[0][1]).toBe('บรรทัดหนึ่ง\nบรรทัดสอง'));
  await waitFor(() => expect(box).toHaveValue(''));
  expect(screen.getByText('บทสนทนาถูกบันทึกเพื่อพัฒนาระบบ')).toBeInTheDocument();
});

test('shows analyzing… and locks the composer until the first token arrives', async () => {
  let release: () => void = () => {};
  mocked.sendMessage.mockImplementation(async (_i: string, _c: string, on: OnEvent) => {
    await new Promise<void>((resolve) => { release = resolve; });
    on({ type: 'done', messageId: 1, citedMembers: [] });
    return { completed: true };
  });
  renderAt('/chat');
  const box = await screen.findByRole('textbox', { name: 'คำถามถึง Oracle' });
  await userEvent.type(box, 'hi{Enter}');
  expect(await screen.findByText('analyzing…')).toBeInTheDocument();
  expect(box).toBeDisabled();
  release();
  await waitFor(() => expect(box).not.toBeDisabled());
  expect(screen.queryByText('analyzing…')).toBeNull();
});

test('the sidebar lists conversations, opens one, and starts a new quest', async () => {
  mocked.listConversations.mockResolvedValue([{ id: 'c7', title: 'เรื่องเก่า', createdAt: '' }]);
  mocked.getMessages.mockResolvedValue([{ id: 1, role: 'user', content: 'คำถามเก่า', citedMembers: [], createdAt: '' }]);
  renderAt('/chat');
  await userEvent.click(await screen.findByRole('button', { name: 'เรื่องเก่า' }));
  expect(await screen.findByText('คำถามเก่า')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'เควสต์ใหม่' }));
  await waitFor(() => expect(screen.queryByText('คำถามเก่า')).toBeNull());
});

test('on small screens the conversation list sits behind a toggle', async () => {
  renderAt('/chat');
  const toggle = await screen.findByRole('button', { name: 'บทสนทนา' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('deleting a conversation needs a second, confirming click', async () => {
  mocked.listConversations.mockResolvedValue([{ id: 'c7', title: 'เรื่องเก่า', createdAt: '' }]);
  mocked.deleteConversation.mockResolvedValue(undefined);
  renderAt('/chat');
  await userEvent.click(await screen.findByRole('button', { name: 'ลบบทสนทนา เรื่องเก่า' }));
  expect(mocked.deleteConversation).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'ยืนยันลบบทสนทนา เรื่องเก่า' }));
  expect(mocked.deleteConversation).toHaveBeenCalledWith('c7');
  await waitFor(() => expect(screen.queryByRole('button', { name: 'เรื่องเก่า' })).toBeNull());
});
