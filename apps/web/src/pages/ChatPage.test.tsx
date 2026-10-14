import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ChatStreamEvent, Member, Portfolio } from '@vq/shared';
import { api } from '../lib/api';
import { ChatPage } from './ChatPage';

vi.mock('../lib/api', async () => (await import('../test/mockApi')).mockApiModule());

const m = vi.mocked(api);
type OnEvent = (e: ChatStreamEvent) => void;

const mickie = { slug: 'mickie', name: 'สมชาย', nickname: 'Mickie' } as Member;
const nok = { slug: 'nok', name: 'นก ใจดี', nickname: null } as Member;
const portfolio = { members: [mickie, nok] } as Portfolio;

function LocationProbe() {
  const l = useLocation();
  return <div data-testid="location">{l.pathname + l.search}</div>;
}

function renderChat(entry = '/chat', strict = false) {
  const tree = (
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/chat"
          element={
            <>
              <ChatPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function answerWith(text: string, cited: string[] = []) {
  m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
    on({ type: 'token', text });
    on({ type: 'done', messageId: 1, citedMembers: cited });
    return { completed: true };
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  m.getPortfolio.mockResolvedValue(portfolio);
  m.listConversations.mockResolvedValue([]);
  m.getMessages.mockResolvedValue([]);
  m.createConversation.mockResolvedValue({ id: 'c1', title: 'New', createdAt: 'x' });
});

describe('ChatPage', () => {
  test('?ask is sent once and removed from URL', async () => {
    answerWith('ok');
    renderChat('/chat?ask=ทีมนี้ถนัดอะไร', true);
    await waitFor(() => expect(m.sendMessage).toHaveBeenCalledTimes(1));
    expect(m.sendMessage.mock.calls[0]?.[1]).toBe('ทีมนี้ถนัดอะไร');
    await screen.findByText('ok');
    expect(m.createConversation).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location').textContent).toBe('/chat');
    expect(m.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('shows suggested questions for an empty conversation and sends on click', async () => {
    answerWith('ตอบ');
    renderChat();
    await screen.findByRole('button', { name: 'ทีมนี้ถนัดอะไร' });
    expect(screen.getByRole('button', { name: 'แนะนำสมาชิกแต่ละคน' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mickie ทำโปรเจกต์อะไรบ้าง' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'นก ใจดี ทำโปรเจกต์อะไรบ้าง' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ทีมนี้ถนัดอะไร' }));
    await screen.findByText('ตอบ');
    expect(m.sendMessage.mock.calls[0]?.[1]).toBe('ทีมนี้ถนัดอะไร');
    expect(screen.queryByRole('button', { name: 'แนะนำสมาชิกแต่ละคน' })).toBeNull();
  });

  test('still works when the portfolio fails to load', async () => {
    m.getPortfolio.mockRejectedValue(new Error('down'));
    renderChat();
    expect(await screen.findByRole('button', { name: 'ทีมนี้ถนัดอะไร' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ทำโปรเจกต์อะไรบ้าง/ })).toBeNull();
  });

  test('auto-selects the most recent conversation and shows history with citations', async () => {
    m.listConversations.mockResolvedValue([
      { id: 'b', title: 'ล่าสุด', createdAt: 'x' },
      { id: 'a', title: 'เก่า', createdAt: 'x' },
    ]);
    m.getMessages.mockResolvedValue([
      { id: 1, role: 'user', content: 'คำถามเดิม', citedMembers: [], createdAt: 'x' },
      { id: 2, role: 'model', content: 'คำตอบเดิม', citedMembers: ['mickie'], createdAt: 'x' },
    ]);
    renderChat();
    await screen.findByText('คำตอบเดิม');
    expect(m.getMessages).toHaveBeenCalledWith('b');
    expect(screen.getByRole('button', { name: 'ล่าสุด' })).toHaveAttribute('aria-current', 'true');
    expect(await screen.findByRole('link', { name: /Mickie/ })).toHaveAttribute('href', '/#member-mickie');
  });

  test('sidebar: new quest button and mobile toggle', async () => {
    renderChat();
    const toggle = await screen.findByRole('button', { name: /บทสนทนา/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'เควสต์ใหม่' })).toBeInTheDocument();
  });

  test('Enter sends, Shift+Enter does not', async () => {
    answerWith('ตอบ');
    renderChat();
    const box = await screen.findByRole('textbox', { name: /ข้อความ/ });
    await userEvent.type(box, 'บรรทัด1{Shift>}{Enter}{/Shift}บรรทัด2');
    expect(m.sendMessage).not.toHaveBeenCalled();
    expect(box).toHaveValue('บรรทัด1\nบรรทัด2');
    await userEvent.type(box, '{Enter}');
    await waitFor(() => expect(m.sendMessage).toHaveBeenCalledTimes(1));
    expect(m.sendMessage.mock.calls[0]?.[1]).toBe('บรรทัด1\nบรรทัด2');
    await waitFor(() => expect(box).toHaveValue(''));
  });

  test('Enter during IME composition does not send', async () => {
    renderChat();
    const box = await screen.findByRole('textbox', { name: /ข้อความ/ });
    await userEvent.type(box, 'ไทย');
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true });
    box.dispatchEvent(ev);
    expect(m.sendMessage).not.toHaveBeenCalled();
  });

  test('send button is disabled when empty and while busy; caption shown', async () => {
    m.sendMessage.mockImplementation(() => new Promise(() => {}));
    renderChat();
    const send = await screen.findByRole('button', { name: 'ส่ง' });
    expect(send).toBeDisabled();
    expect(screen.getByText('บทสนทนาถูกบันทึกเพื่อพัฒนาระบบ')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: /ข้อความ/ }), 'hello');
    expect(send).toBeEnabled();
    await userEvent.click(send);
    await screen.findByText('analyzing…');
    expect(screen.getByRole('button', { name: 'ส่ง' })).toBeDisabled();
  });

  test('streams partial text with an aria-hidden cursor', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'token', text: 'ครึ่งๆ' });
      return new Promise(() => {});
    });
    const { container } = renderChat();
    await userEvent.type(await screen.findByRole('textbox', { name: /ข้อความ/ }), 'hi{Enter}');
    await screen.findByText('ครึ่งๆ');
    expect(container.querySelector('[aria-hidden="true"].animate-pulse, [data-slot="cursor"][aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByText('analyzing…')).toBeNull();
  });

  test('message list is a polite live region', async () => {
    renderChat();
    await screen.findByRole('log');
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });

  test('error message offers resend that re-sends the previous user message', async () => {
    m.sendMessage.mockRejectedValueOnce(new TypeError('offline'));
    renderChat();
    await userEvent.type(await screen.findByRole('textbox', { name: /ข้อความ/ }), 'คำถาม{Enter}');
    await screen.findByText('การเชื่อมต่อขาดหาย ลองส่งใหม่อีกครั้ง');
    answerWith('สำเร็จ');
    await userEvent.click(screen.getByRole('button', { name: 'ส่งใหม่' }));
    await screen.findByText('สำเร็จ');
    expect(m.sendMessage).toHaveBeenCalledTimes(2);
    expect(m.sendMessage.mock.calls[1]?.[1]).toBe('คำถาม');
  });

  test('RATE_LIMITED and AI_ERROR events render fixed Thai copy in the chat', async () => {
    m.sendMessage.mockImplementation(async (_i, _c, on: OnEvent) => {
      on({ type: 'error', code: 'AI_ERROR', message: 'x' });
      return { completed: true };
    });
    renderChat();
    await userEvent.type(await screen.findByRole('textbox', { name: /ข้อความ/ }), 'q{Enter}');
    expect(await screen.findByText('Oracle ขัดข้อง ลองใหม่อีกครั้ง')).toBeInTheDocument();
  });
});
