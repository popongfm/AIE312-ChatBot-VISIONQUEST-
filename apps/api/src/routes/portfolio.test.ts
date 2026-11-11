import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { fakeChatModel } from '../../test/helpers/app';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { createApp } from '../app';
import { migrate } from '../db/migrate';
import { applySeed, type SeedData } from '../db/seed';

const seed: SeedData = {
  team: { name: 'Test Team', tagline: 't', concept: null, highlights: ['h1'] },
  contacts: [{ type: 'github', label: 'GitHub', url: 'https://github.com/x' }],
  teamProjects: [{
    title: 'P', summary: 'team s', tech: ['TS'], repoUrl: 'https://r', demoUrl: null, imageUrl: null,
    members: [{ slug: 'ann', contribution: 'api' }],
  }],
  members: [
    {
      slug: 'ann', name: 'แอน ทดสอบ', nickname: 'Ann', role: 'Backend', bio: 'สวัสดี', avatarUrl: '/avatars/ann.jpg', sortOrder: 2,
      skills: [{ name: 'SQL', category: 'data', level: 4 }],
      projects: [{ title: 'Mine', summary: 's', tech: [], repoUrl: null, demoUrl: null, imageUrl: null, contribution: 'all' }],
    },
    { slug: 'bob', name: 'Bob', nickname: null, role: 'Frontend', bio: null, avatarUrl: null, sortOrder: 1, skills: [], projects: [] },
  ],
};

describe.skipIf(!hasTestDb)('GET /api/portfolio', () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = await freshTestPool();
    await migrate(pool);
  });
  afterAll(async () => {
    await pool?.end();
  });
  const get = () => request(createApp({ pool, chatModel: fakeChatModel })).get('/api/portfolio');

  test('503 NOT_SEEDED before any seed is loaded', async () => {
    const res = await get();
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_SEEDED');
  });

  test('returns the whole portfolio in the @vq/shared Portfolio shape', async () => {
    await applySeed(pool, seed);
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      team: { name: 'Test Team', tagline: 't', concept: null, highlights: ['h1'] },
      contacts: [{ type: 'github', label: 'GitHub', url: 'https://github.com/x' }],
      members: [
        { slug: 'bob', name: 'Bob', nickname: null, role: 'Frontend', bio: null, avatarUrl: null, sortOrder: 1, skills: [], projects: [] },
        {
          slug: 'ann', name: 'แอน ทดสอบ', nickname: 'Ann', role: 'Backend', bio: 'สวัสดี', avatarUrl: '/avatars/ann.jpg', sortOrder: 2,
          skills: [{ name: 'SQL', category: 'data', level: 4 }],
          projects: [
            { title: 'P', summary: 'team s', tech: ['TS'], repoUrl: 'https://r', demoUrl: null, imageUrl: null, isTeamProject: true, contribution: 'api' },
            { title: 'Mine', summary: 's', tech: [], repoUrl: null, demoUrl: null, imageUrl: null, isTeamProject: false, contribution: 'all' },
          ],
        },
      ],
      teamProjects: [{
        title: 'P', summary: 'team s', tech: ['TS'], repoUrl: 'https://r', demoUrl: null, imageUrl: null,
        members: [{ slug: 'ann', name: 'แอน ทดสอบ', nickname: 'Ann', contribution: 'api' }],
      }],
    });
  });
});
