import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Contact, MemberProject, MemberSkill, SkillCategory, Team, TeamProject } from '@vq/shared';
import type { Pool } from 'pg';

/** <repo>/seed — resolves the same from src/db (dev, tests) and dist/db (build). */
export const SEED_DIR = fileURLToPath(new URL('../../../../seed/', import.meta.url));

const SKILL_CATEGORIES: readonly SkillCategory[] = ['frontend', 'backend', 'ai', 'data', 'design', 'other'];
const SLUG = /^[a-z0-9-]+$/;

export type SeedMemberProject = Omit<MemberProject, 'isTeamProject'>;
export interface SeedMember {
  slug: string; name: string; nickname: string | null; role: string; bio: string | null;
  avatarUrl: string | null; sortOrder: number; skills: MemberSkill[]; projects: SeedMemberProject[];
}
export type SeedTeamProject = Omit<TeamProject, 'members'> & { members: { slug: string; contribution: string | null }[] };
export interface SeedData { team: Team; contacts: Contact[]; teamProjects: SeedTeamProject[]; members: SeedMember[] }

/** Thrown for any problem in the seed files; the message names the file and field. */
export class SeedError extends Error {}

type Obj = Record<string, unknown>;

/** Small typed readers: each checks one field and reports exactly where a mistake is. */
function reader(file: string) {
  const fail = (at: string, msg: string): never => {
    throw new SeedError(`${file}: ${at} ${msg}`);
  };
  const obj = (v: unknown, at: string): Obj =>
    typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : fail(at, 'must be an object');
  const str = (o: Obj, k: string, at: string): string => {
    const v = o[k];
    return typeof v === 'string' && v.trim() ? v.trim() : fail(`${at}.${k}`, 'must be a non-empty string');
  };
  const optStr = (o: Obj, k: string, at: string): string | null => {
    const v = o[k];
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string') return fail(`${at}.${k}`, 'must be a string or null');
    return v.trim() || null;
  };
  const list = (o: Obj, k: string, at: string): unknown[] => {
    const v = o[k];
    if (v === undefined) return [];
    return Array.isArray(v) ? v : fail(`${at}.${k}`, 'must be an array');
  };
  const strList = (o: Obj, k: string, at: string): string[] =>
    list(o, k, at).map((v, i) => (typeof v === 'string' && v.trim() ? v.trim() : fail(`${at}.${k}[${i}]`, 'must be a non-empty string')));
  const int = (o: Obj, k: string, at: string, min: number, max: number): number => {
    const v = o[k];
    return Number.isInteger(v) && (v as number) >= min && (v as number) <= max
      ? (v as number)
      : fail(`${at}.${k}`, `must be a whole number from ${min} to ${max}`);
  };
  return { fail, obj, str, optStr, list, strList, int };
}

async function readJson(path: string, file: string): Promise<unknown> {
  const text = await readFile(path, 'utf8');
  try {
    return JSON.parse(text.replace(/^\uFEFF/, '')); // Windows editors sometimes add a BOM
  } catch (e) {
    throw new SeedError(`${file}: not valid JSON (${(e as Error).message})`);
  }
}

function parseMember(raw: unknown, file: string): SeedMember {
  const r = reader(file);
  const m = r.obj(raw, '');
  const slug = r.str(m, 'slug', '');
  if (!SLUG.test(slug)) r.fail('.slug', 'must use only a-z, 0-9 and -');
  if (`${slug}.json` !== file.split('/').pop()) r.fail('.slug', `must match the file name (expected ${slug}.json)`);
  return {
    slug,
    name: r.str(m, 'name', ''),
    nickname: r.optStr(m, 'nickname', ''),
    role: r.str(m, 'role', ''),
    bio: r.optStr(m, 'bio', ''),
    avatarUrl: r.optStr(m, 'avatarUrl', ''),
    sortOrder: r.int(m, 'sortOrder', '', 0, 1000),
    skills: r.list(m, 'skills', '').map((v, i) => {
      const at = `.skills[${i}]`;
      const s = r.obj(v, at);
      const category = r.str(s, 'category', at) as SkillCategory;
      if (!SKILL_CATEGORIES.includes(category)) r.fail(`${at}.category`, `must be one of ${SKILL_CATEGORIES.join(', ')}`);
      return { name: r.str(s, 'name', at), category, level: r.int(s, 'level', at, 1, 5) };
    }),
    projects: r.list(m, 'projects', '').map((v, i) => {
      const at = `.projects[${i}]`;
      const p = r.obj(v, at);
      return {
        title: r.str(p, 'title', at), summary: r.str(p, 'summary', at), tech: r.strList(p, 'tech', at),
        repoUrl: r.optStr(p, 'repoUrl', at), demoUrl: r.optStr(p, 'demoUrl', at), imageUrl: r.optStr(p, 'imageUrl', at),
        contribution: r.optStr(p, 'contribution', at),
      };
    }),
  };
}

function parseTeam(raw: unknown, file: string): Omit<SeedData, 'members'> {
  const r = reader(file);
  const t = r.obj(raw, '');
  return {
    team: {
      name: r.str(t, 'name', ''), tagline: r.optStr(t, 'tagline', ''),
      concept: r.optStr(t, 'concept', ''), highlights: r.strList(t, 'highlights', ''),
    },
    contacts: r.list(t, 'contacts', '').map((v, i) => {
      const at = `.contacts[${i}]`;
      const c = r.obj(v, at);
      return { type: r.str(c, 'type', at), label: r.str(c, 'label', at), url: r.str(c, 'url', at) };
    }),
    teamProjects: r.list(t, 'projects', '').map((v, i) => {
      const at = `.projects[${i}]`;
      const p = r.obj(v, at);
      return {
        title: r.str(p, 'title', at), summary: r.str(p, 'summary', at), tech: r.strList(p, 'tech', at),
        repoUrl: r.optStr(p, 'repoUrl', at), demoUrl: r.optStr(p, 'demoUrl', at), imageUrl: r.optStr(p, 'imageUrl', at),
        members: r.list(p, 'members', at).map((mv, j) => {
          const mat = `${at}.members[${j}]`;
          const pm = r.obj(mv, mat);
          return { slug: r.str(pm, 'slug', mat), contribution: r.optStr(pm, 'contribution', mat) };
        }),
      };
    }),
  };
}

/**
 * Reads seed/team.json and every seed/members/*.json (files starting with _ are templates and skipped).
 * Validates everything before anything touches the database.
 */
export async function readSeed(dir: string = SEED_DIR): Promise<SeedData> {
  const teamData = parseTeam(await readJson(join(dir, 'team.json'), 'team.json'), 'team.json');

  const memberDir = join(dir, 'members');
  const files = (await readdir(memberDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort();
  const members: SeedMember[] = [];
  for (const f of files) {
    const file = `members/${f}`;
    members.push(parseMember(await readJson(join(memberDir, f), file), file));
  }
  members.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));

  const slugs = new Set(members.map((m) => m.slug));
  teamData.teamProjects.forEach((p, i) =>
    p.members.forEach((pm, j) => {
      if (!slugs.has(pm.slug)) {
        throw new SeedError(`team.json: .projects[${i}].members[${j}].slug "${pm.slug}" has no seed/members/${pm.slug}.json`);
      }
    }));
  return { ...teamData, members };
}

/**
 * Replaces all portfolio data with `data` in one transaction: running it again gives the same result,
 * and a failure leaves the old data in place. Chat tables (conversations, messages) are never touched.
 */
export async function applySeed(pool: Pool, data: SeedData): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE team, contacts, members, member_skills, member_projects,
      team_projects, team_project_members RESTART IDENTITY`);

    const { team } = data;
    await client.query('INSERT INTO team (name, tagline, concept, highlights) VALUES ($1, $2, $3, $4)',
      [team.name, team.tagline, team.concept, team.highlights]);

    for (const [i, c] of data.contacts.entries()) {
      await client.query('INSERT INTO contacts (type, label, url, sort_order) VALUES ($1, $2, $3, $4)',
        [c.type, c.label, c.url, i]);
    }

    const memberIds = new Map<string, number>();
    for (const m of data.members) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO members (slug, name, nickname, role, bio, avatar_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [m.slug, m.name, m.nickname, m.role, m.bio, m.avatarUrl, m.sortOrder]);
      const memberId = rows[0].id;
      memberIds.set(m.slug, memberId);
      for (const [i, s] of m.skills.entries()) {
        await client.query(
          'INSERT INTO member_skills (member_id, name, category, level, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [memberId, s.name, s.category, s.level, i]);
      }
      for (const [i, p] of m.projects.entries()) {
        await client.query(
          `INSERT INTO member_projects (member_id, title, summary, tech, repo_url, demo_url, image_url, contribution, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [memberId, p.title, p.summary, p.tech, p.repoUrl, p.demoUrl, p.imageUrl, p.contribution, i]);
      }
    }

    for (const [i, p] of data.teamProjects.entries()) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO team_projects (title, summary, tech, repo_url, demo_url, image_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [p.title, p.summary, p.tech, p.repoUrl, p.demoUrl, p.imageUrl, i]);
      for (const pm of p.members) {
        await client.query(
          'INSERT INTO team_project_members (team_project_id, member_id, contribution) VALUES ($1, $2, $3)',
          [rows[0].id, memberIds.get(pm.slug), pm.contribution]);
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
