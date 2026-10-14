import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Member, Portfolio } from '@vq/shared';
import { api, ApiRequestError } from '../lib/api';
import { askHref } from '../components/portfolio/MemberDetail';
import { PortfolioPage } from './PortfolioPage';

vi.mock('../lib/api', async () => (await import('../test/mockApi')).mockApiModule());
vi.mock('../components/portfolio/SkillRadar', () => ({ default: () => <div>radar</div> }));

const m = vi.mocked(api);

const mickie: Member = {
  slug: 'mickie', name: 'สมชาย', nickname: 'Mickie', role: 'AI Engineer', bio: 'ชอบ AI',
  avatarUrl: null, sortOrder: 1,
  skills: [{ name: 'Python', category: 'ai', level: 5 }],
  projects: [{ title: 'MyProj', summary: 's', tech: ['TS'], repoUrl: null, demoUrl: null, imageUrl: null, isTeamProject: false, contribution: 'ทำทุกอย่าง' }],
};
const nok: Member = { ...mickie, slug: 'nok', name: 'นก', nickname: null, sortOrder: 2, skills: [], projects: [] };

const portfolio: Portfolio = {
  team: { name: 'VISIONQUEST', tagline: 'เควสต์แห่งวิชั่น', concept: 'แนวคิดทีม', highlights: ['จุดเด่น 1', 'จุดเด่น 2'] },
  contacts: [
    { type: 'github', label: 'GitHub ทีม', url: 'https://github.com/x' },
    { type: 'email', label: 'อีเมลทีม', url: 'mailto:a@b.co' },
  ],
  members: [mickie, nok],
  teamProjects: [{
    title: 'ProjectX', summary: 'sum', tech: ['React'], repoUrl: 'https://github.com/x/p', demoUrl: null, imageUrl: null,
    members: [{ slug: 'mickie', name: 'สมชาย', nickname: 'Mickie', contribution: 'หน้าเว็บ' }],
  }],
};

function renderPage() {
  return render(<MemoryRouter><PortfolioPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  m.getPortfolio.mockResolvedValue(portfolio);
  m.getHealth.mockResolvedValue({ ok: true, version: '1' });
});

describe('PortfolioPage', () => {
  test('renders team, all members with anchors, team projects, contacts', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
    for (const mem of portfolio.members) expect(document.getElementById(`member-${mem.slug}`)).not.toBeNull();
    expect(screen.getByText('ProjectX')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub ทีม' })).toHaveAttribute('href', 'https://github.com/x');
    expect(screen.getByRole('link', { name: 'GitHub ทีม' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'อีเมลทีม' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'คุยกับ Oracle' })).toHaveAttribute('href', '/chat');
  });

  test('pings health on mount', async () => {
    renderPage();
    await screen.findByText('VISIONQUEST');
    expect(m.getHealth).toHaveBeenCalledTimes(1);
  });

  test('health failure is ignored', async () => {
    m.getHealth.mockRejectedValue(new Error('down'));
    renderPage();
    expect(await screen.findByText('VISIONQUEST')).toBeInTheDocument();
  });

  test('ask link encodes nickname question', () => {
    expect(askHref('Mickie')).toBe('/chat?ask=' + encodeURIComponent('Mickie ทำโปรเจกต์อะไรบ้าง และถนัดอะไร'));
  });

  test('NOT_SEEDED error shows retry', async () => {
    m.getPortfolio
      .mockRejectedValueOnce(new ApiRequestError(503, 'NOT_SEEDED', 'ยังไม่มีข้อมูล'))
      .mockResolvedValueOnce(portfolio);
    renderPage();
    expect(await screen.findByText(/ยังไม่มีข้อมูล/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
    expect(m.getPortfolio).toHaveBeenCalledTimes(2);
  });

  test('clicking a member opens detail with the ask link; only one open at a time', async () => {
    renderPage();
    await screen.findByText('VISIONQUEST');
    await userEvent.click(screen.getAllByRole('button', { name: /ดูรายละเอียด/ })[0]);
    const link = screen.getByRole('link', { name: 'ถาม Oracle เกี่ยวกับ Mickie' });
    expect(link).toHaveAttribute('href', askHref('Mickie'));
    expect(screen.getByText('MyProj')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /ดูรายละเอียด/ })[1]);
    expect(screen.queryByRole('link', { name: 'ถาม Oracle เกี่ยวกับ Mickie' })).toBeNull();
    expect(screen.getByRole('link', { name: 'ถาม Oracle เกี่ยวกับ นก' })).toBeInTheDocument();
  });

  test('Concept skips null concept', async () => {
    m.getPortfolio.mockResolvedValue({ ...portfolio, team: { ...portfolio.team, concept: null, highlights: [] } });
    renderPage();
    await screen.findByText('VISIONQUEST');
    expect(screen.queryByText('แนวคิดทีม')).toBeNull();
    expect(screen.queryByRole('heading', { name: /แนวคิด/ })).toBeNull();
  });

  test('scrolls to #member-<slug> after load', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<MemoryRouter initialEntries={['/#member-nok']}><PortfolioPage /></MemoryRouter>);
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
    expect(scroll.mock.instances[0]).toBe(document.getElementById('member-nok'));
  });

  test('malformed hash does not crash the page', async () => {
    render(<MemoryRouter initialEntries={['/#member-%E0']}><PortfolioPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 1, name: 'VISIONQUEST' })).toBeInTheDocument();
  });
});
