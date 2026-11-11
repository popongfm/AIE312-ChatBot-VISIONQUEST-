import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { migrate } from './migrate';
import { applySeed, readSeed, SeedError } from './seed';

const team = {
  name: 'Test Team', tagline: 't', concept: null, highlights: ['h1'],
  contacts: [{ type: 'github', label: 'GitHub', url: 'https://github.com/x' }],
  projects: [{ title: 'P', summary: 's', tech: ['TS'], members: [{ slug: 'ann', contribution: 'api' }] }],
};
const ann = {
  slug: 'ann', name: 'แอน ทดสอบ', nickname: 'Ann', role: 'Backend', bio: null, avatarUrl: null, sortOrder: 2,
  skills: [{ name: 'SQL', category: 'data', level: 4 }],
  projects: [{ title: 'Mine', summary: 's', tech: [], contribution: 'all' }],
};
const bob = { ...ann, slug: 'bob', name: 'Bob', nickname: null, sortOrder: 1, skills: [], projects: [] };

/** Writes a seed folder into a temp dir and returns its path. */
async function seedDir(files: Record<string, unknown>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'vq-seed-'));
  await mkdir(join(dir, 'members'));
  for (const [name, body] of Object.entries(files)) {
    await writeFile(join(dir, name), typeof body === 'string' ? body : JSON.stringify(body));
  }
  return dir;
}

describe('readSeed', () => {
  test('the real seed/ folder in the repo is valid', async () => {
    const data = await readSeed();
    expect(data.team.name).toBeTruthy();
  });

  test('reads team and members, sorted by sortOrder, skipping _template files', async () => {
    const dir = await seedDir({ 'team.json': team, 'members/ann.json': ann, 'members/bob.json': bob, 'members/_template.json': '{' });
    const data = await readSeed(dir);
    expect(data.members.map((m) => m.slug)).toEqual(['bob', 'ann']);
    expect(data.contacts).toEqual(team.contacts);
    expect(data.teamProjects[0]).toMatchObject({ repoUrl: null, members: [{ slug: 'ann', contribution: 'api' }] });
    expect(data.members[1].projects[0]).toEqual({
      title: 'Mine', summary: 's', tech: [], repoUrl: null, demoUrl: null, imageUrl: null, contribution: 'all',
    });
  });

  test('works with no member files yet', async () => {
    const dir = await seedDir({ 'team.json': { ...team, projects: [] } });
    expect((await readSeed(dir)).members).toEqual([]);
  });

  test.each([
    ['bad JSON', '{ "slug": ', 'members/ann.json: not valid JSON'],
    ['slug not matching file name', { ...ann, slug: 'anna' }, 'must match the file name'],
    ['unknown skill category', { ...ann, skills: [{ name: 'X', category: 'magic', level: 3 }] }, '.skills[0].category must be one of'],
    ['skill level out of range', { ...ann, skills: [{ name: 'X', category: 'ai', level: 6 }] }, '.skills[0].level must be a whole number from 1 to 5'],
    ['missing name', { ...ann, name: '' }, '.name must be a non-empty string'],
  ])('rejects %s with the file and field in the message', async (_label, body, message) => {
    const dir = await seedDir({ 'team.json': team, 'members/ann.json': body });
    const err = await readSeed(dir).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SeedError);
    expect((err as Error).message).toContain(message);
  });

  test('rejects a team project member with no member file', async () => {
    const dir = await seedDir({ 'team.json': team });
    await expect(readSeed(dir)).rejects.toThrow('"ann" has no seed/members/ann.json');
  });
});

describe.skipIf(!hasTestDb)('applySeed', () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = await freshTestPool();
    await migrate(pool);
  });
  afterAll(async () => {
    await pool?.end();
  });

  const counts = async () => {
    const { rows } = await pool.query<Record<string, number>>(`SELECT
      (SELECT count(*)::int FROM team) AS team, (SELECT count(*)::int FROM contacts) AS contacts,
      (SELECT count(*)::int FROM members) AS members, (SELECT count(*)::int FROM member_skills) AS skills,
      (SELECT count(*)::int FROM member_projects) AS projects, (SELECT count(*)::int FROM team_projects) AS team_projects,
      (SELECT count(*)::int FROM team_project_members) AS links, (SELECT count(*)::int FROM conversations) AS conversations`);
    return rows[0];
  };

  test('loads everything, running twice gives the same result, chat data untouched', async () => {
    await pool.query(`INSERT INTO conversations (client_id, title) VALUES ('c1', 'keep me')`);
    const data = await readSeed(await seedDir({ 'team.json': team, 'members/ann.json': ann, 'members/bob.json': bob }));
    const expected = { team: 1, contacts: 1, members: 2, skills: 1, projects: 1, team_projects: 1, links: 1, conversations: 1 };

    await applySeed(pool, data);
    expect(await counts()).toEqual(expected);
    await applySeed(pool, data);
    expect(await counts()).toEqual(expected);

    const { rows } = await pool.query(
      `SELECT m.slug, tpm.contribution FROM team_project_members tpm JOIN members m ON m.id = tpm.member_id`);
    expect(rows).toEqual([{ slug: 'ann', contribution: 'api' }]);
  });

  test('the real seed/ folder loads into the database', async () => {
    const data = await readSeed();
    await applySeed(pool, data);
    expect((await counts()).members).toBe(data.members.length);
  });
});
