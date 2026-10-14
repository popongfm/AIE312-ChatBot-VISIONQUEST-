import type pg from 'pg';
import type {
  Contact,
  Member,
  MemberProject,
  MemberSkill,
  Portfolio,
  SkillCategory,
  TeamProject,
} from '@vq/shared';

interface MemberRow { id: number; slug: string; name: string; nickname: string | null; role: string; bio: string | null; avatar_url: string | null; sort_order: number }
interface SkillRow { member_id: number; name: string; category: SkillCategory; level: number }
interface ProjectRow {
  project_id: number; member_id: number; title: string; summary: string; tech: string[];
  repo_url: string | null; demo_url: string | null; image_url: string | null;
  is_team_project: boolean; contribution: string | null;
}

export async function getPortfolio(pool: pg.Pool): Promise<Portfolio | null> {
  const [team, contacts] = await Promise.all([
    pool.query<{ name: string; tagline: string | null; concept: string | null; highlights: string[] }>(
      'SELECT name, tagline, concept, highlights FROM team ORDER BY id LIMIT 1',
    ),
    pool.query<Contact>('SELECT type, label, url FROM team_contacts ORDER BY id'),
  ]);
  const teamRow = team.rows[0];
  if (!teamRow) return null;

  const members = await pool.query<MemberRow>(
    `SELECT id, slug, name, nickname, role, bio, avatar_url, sort_order
       FROM members ORDER BY sort_order, slug`,
  );
  const skills = await pool.query<SkillRow>(
    `SELECT ms.member_id, s.name, s.category, ms.level
       FROM member_skills ms JOIN skills s ON s.id = ms.skill_id
      ORDER BY ms.level DESC, s.name`,
  );
  // One row per (project, member); ordered so team project members follow member order.
  const projects = await pool.query<ProjectRow>(
    `SELECT p.id AS project_id, pm.member_id, p.title, p.summary, p.tech, p.repo_url, p.demo_url,
            p.image_url, p.is_team_project, pm.contribution
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       JOIN members m ON m.id = pm.member_id
      ORDER BY p.is_team_project, p.title, m.sort_order, m.slug`,
  );

  const skillsByMember = new Map<number, MemberSkill[]>();
  for (const s of skills.rows) {
    const list = skillsByMember.get(s.member_id) ?? [];
    list.push({ name: s.name, category: s.category, level: s.level });
    skillsByMember.set(s.member_id, list);
  }

  const projectsByMember = new Map<number, MemberProject[]>();
  const teamProjects = new Map<number, TeamProject>();
  const memberById = new Map(members.rows.map((m) => [m.id, m]));
  for (const r of projects.rows) {
    const list = projectsByMember.get(r.member_id) ?? [];
    list.push({
      title: r.title, summary: r.summary, tech: r.tech,
      repoUrl: r.repo_url, demoUrl: r.demo_url, imageUrl: r.image_url,
      isTeamProject: r.is_team_project, contribution: r.contribution,
    });
    projectsByMember.set(r.member_id, list);

    if (r.is_team_project) {
      let tp = teamProjects.get(r.project_id);
      if (!tp) {
        tp = {
          title: r.title, summary: r.summary, tech: r.tech,
          repoUrl: r.repo_url, demoUrl: r.demo_url, imageUrl: r.image_url, members: [],
        };
        teamProjects.set(r.project_id, tp);
      }
      const m = memberById.get(r.member_id)!;
      tp.members.push({ slug: m.slug, name: m.name, nickname: m.nickname, contribution: r.contribution });
    }
  }

  return {
    team: teamRow,
    contacts: contacts.rows,
    members: members.rows.map(
      (m): Member => ({
        slug: m.slug, name: m.name, nickname: m.nickname, role: m.role, bio: m.bio,
        avatarUrl: m.avatar_url, sortOrder: m.sort_order,
        skills: skillsByMember.get(m.id) ?? [],
        projects: projectsByMember.get(m.id) ?? [],
      }),
    ),
    teamProjects: [...teamProjects.values()],
  };
}

export function createPortfolioCache(
  load: () => Promise<Portfolio | null>,
  ttlMs = 60_000,
  now: () => number = Date.now,
): { get(): Promise<Portfolio | null>; clear(): void } {
  let value: Portfolio | null = null;
  let expiresAt = 0;
  return {
    async get() {
      if (value && now() < expiresAt) return value;
      const loaded = await load();
      if (loaded) {
        value = loaded;
        expiresAt = now() + ttlMs;
      }
      return loaded;
    },
    clear() {
      value = null;
      expiresAt = 0;
    },
  };
}
