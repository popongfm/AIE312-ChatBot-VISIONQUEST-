import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { ApiRequestError, api } from '../lib/api';
import { portfolio } from '../test/fixtures';
import { PortfolioPage } from './PortfolioPage';

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

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}
function renderAt(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/chat" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocked.getPortfolio.mockResolvedValue(portfolio);
  mocked.getHealth.mockResolvedValue({ status: 'ok', db: 'ok', version: 'abc' });
});

test('renders team, all members with anchors, team projects, contacts', async () => {
  renderAt();
  expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
  expect(screen.getByText(portfolio.team.concept!)).toBeInTheDocument();
  expect(screen.getByText(portfolio.team.highlights[0])).toBeInTheDocument();
  for (const m of portfolio.members) expect(document.getElementById(`member-${m.slug}`)).not.toBeNull();
  expect(screen.getByRole('heading', { name: portfolio.teamProjects[0].title })).toBeInTheDocument();
  expect(screen.getByText('ทำส่วน AI')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: portfolio.contacts[0].label })).toHaveAttribute('href', portfolio.contacts[0].url);
  expect(screen.getAllByRole('link', { name: 'คุยกับ Oracle' })[0]).toHaveAttribute('href', '/chat');
});

test('pings health on mount', async () => {
  renderAt();
  await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' });
  expect(mocked.getHealth).toHaveBeenCalledTimes(1);
});

test('a failed health ping does not break the page', async () => {
  mocked.getHealth.mockRejectedValue(new Error('down'));
  renderAt();
  expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
});

test('NOT_SEEDED error shows retry', async () => { // Review Focus #4
  mocked.getPortfolio.mockRejectedValueOnce(new ApiRequestError(503, 'NOT_SEEDED', 'x')).mockResolvedValueOnce(portfolio);
  renderAt();
  expect(await screen.findByRole('alert')).toHaveTextContent('ยังไม่มีข้อมูล Portfolio ในฐานข้อมูล');
  await userEvent.click(screen.getByRole('button', { name: 'โหลดอีกครั้ง' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
});

test('opening a member shows bio, skills, projects and an ask link; Escape closes it', async () => {
  renderAt();
  await userEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียดของ Mickie' }));
  const dialog = screen.getByRole('dialog', { name: 'Mickie' });
  expect(within(dialog).getByText('ทำ AI และ CI/CD')).toBeInTheDocument();
  expect(within(dialog).getByRole('meter', { name: 'React' })).toHaveAttribute('aria-valuenow', '1');
  expect(within(dialog).getByText('Blood Cell Detection')).toBeInTheDocument();
  expect(within(dialog).getByRole('link', { name: 'ถาม Oracle เกี่ยวกับ Mickie' })).toHaveAttribute(
    'href', '/chat?ask=' + encodeURIComponent('Mickie ทำโปรเจกต์อะไรบ้าง และถนัดอะไร'),
  );
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('a member with nothing filled in still opens, and says so', async () => { // Review Focus #3
  renderAt();
  await userEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียดของ Nat Example' }));
  const dialog = screen.getByRole('dialog', { name: 'Nat Example' });
  expect(within(dialog).getByText('ยังไม่มีข้อมูลแนะนำตัว')).toBeInTheDocument();
  expect(within(dialog).getByText('ยังไม่มีข้อมูลผลงาน')).toBeInTheDocument();
});

test('a #member-… link scrolls to that card after loading', async () => {
  const scrolled: string[] = [];
  Element.prototype.scrollIntoView = function (this: Element) { scrolled.push(this.id); };
  renderAt('/#member-nat');
  await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' });
  await waitFor(() => expect(scrolled).toContain('member-nat'));
});

test('the hero question box opens chat with that question', async () => {
  renderAt();
  const box = await screen.findByRole('textbox', { name: 'คำถามถึง Oracle' });
  await userEvent.type(box, 'ทีมนี้ถนัดอะไร{Enter}');
  expect(screen.getByTestId('location').textContent).toBe('/chat?ask=' + encodeURIComponent('ทีมนี้ถนัดอะไร'));
});

test('the status panel reports what /api/health answered', async () => {
  renderAt();
  const status = await screen.findByRole('status', { name: 'สถานะระบบ' });
  await waitFor(() => expect(status).toHaveTextContent('API พร้อมใช้งาน'));
  expect(status).toHaveTextContent('ฐานข้อมูลพร้อมใช้งาน');
});

test('the status panel says so when the API does not answer', async () => {
  mocked.getHealth.mockRejectedValue(new Error('down'));
  renderAt();
  const status = await screen.findByRole('status', { name: 'สถานะระบบ' });
  await waitFor(() => expect(status).toHaveTextContent('API ไม่ตอบ'));
});
