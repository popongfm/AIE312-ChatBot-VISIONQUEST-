import type { Member, MemberProject, Portfolio, SkillCategory, TeamProject } from '@vq/shared';
import type { Pool, PoolClient } from 'pg';

type ProjectRow = {
  title: string; summary: string; tech: string[];
  repo_url: string | null; demo_url: string | null; image_url: string | null;
};
type LinkRow = {
  team_project_id: number; member_id: number; contribution: string | null;
  slug: string; name: string; nickname: string | null;
};

const projectFields = (p: ProjectRow) => ({
  title: p.title, summary: p.summary, tech: p.tech,
  repoUrl: p.repo_url, demoUrl: p.demo_url, imageUrl: p.image_url,
});

/**
 * Everything the Portfolio page and the AI prompt need, in the shape of @vq/shared's Portfolio.
 * Returns null when the database has not been seeded yet (no team row).
 * Each member's projects list their team projects first (isTeamProject: true), then personal ones.
 */
export async function getPortfolio(pool: Pool): Promise<Portfolio | null> {
  // One read-only snapshot on one connection: if `npm run seed` replaces the data mid-request,
  // all seven queries still see the same version (ids from before and after a reseed never get mixed).
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const result = await readPortfolio(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

/** One query at a time: a single client can't run queries concurrently (pg 9 drops support for queuing them). */
async function readPortfolio(db: PoolClient): Promise<Portfolio | null> {
  const team = await db.query<{ name: string; tagline: string | null; concept: string | null; highlights: string[] }>(
    'SELECT name, tagline, concept, highlights FROM team WHERE id = 1');
  const contacts = await db.query<{ type: string; label: string; url: string }>(
    'SELECT type, label, url FROM contacts ORDER BY sort_order, id');
  const members = await db.query<{
    id: number; slug: string; name: string; nickname: string | null; role: string;
    bio: string | null; avatar_url: string | null; sort_order: number;
  }>('SELECT id, slug, name, nickname, role, bio, avatar_url, sort_order FROM members ORDER BY sort_order, slug');
  const skills = await db.query<{ member_id: number; name: string; category: SkillCategory; level: number }>(
    'SELECT member_id, name, category, level FROM member_skills ORDER BY member_id, sort_order, id');
  const personal = await db.query<ProjectRow & { member_id: number; contribution: string | null }>(
    `SELECT member_id, title, summary, tech, repo_url, demo_url, image_url, contribution
     FROM member_projects ORDER BY member_id, sort_order, id`);
  const teamProjects = await db.query<ProjectRow & { id: number }>(
    'SELECT id, title, summary, tech, repo_url, demo_url, image_url FROM team_projects ORDER BY sort_order, id');
  const links = await db.query<LinkRow>(
    `SELECT tpm.team_project_id, tpm.member_id, tpm.contribution, m.slug, m.name, m.nickname
     FROM team_project_members tpm JOIN members m ON m.id = tpm.member_id
     ORDER BY m.sort_order, m.slug`);

  const t = team.rows[0];
  if (!t) return null;

  const outTeamProjects: TeamProject[] = teamProjects.rows.map((p) => ({
    ...projectFields(p),
    members: links.rows
      .filter((l) => l.team_project_id === p.id)
      .map((l) => ({ slug: l.slug, name: l.name, nickname: l.nickname, contribution: l.contribution })),
  }));

  const outMembers: Member[] = members.rows.map((m) => {
    const teamOnes: MemberProject[] = teamProjects.rows.flatMap((p) => {
      const link = links.rows.find((l) => l.team_project_id === p.id && l.member_id === m.id);
      return link ? [{ ...projectFields(p), isTeamProject: true, contribution: link.contribution }] : [];
    });
    const personalOnes: MemberProject[] = personal.rows
      .filter((p) => p.member_id === m.id)
      .map((p) => ({ ...projectFields(p), isTeamProject: false, contribution: p.contribution }));
    return {
      slug: m.slug, name: m.name, nickname: m.nickname, role: m.role, bio: m.bio,
      avatarUrl: m.avatar_url, sortOrder: m.sort_order,
      skills: skills.rows
        .filter((s) => s.member_id === m.id)
        .map((s) => ({ name: s.name, category: s.category, level: s.level })),
      projects: [...teamOnes, ...personalOnes],
    };
  });

  return {
    team: { name: t.name, tagline: t.tagline, concept: t.concept, highlights: t.highlights },
    contacts: contacts.rows.map((c) => ({ type: c.type, label: c.label, url: c.url })),
    members: outMembers,
    teamProjects: outTeamProjects,
  };
}
