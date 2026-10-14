import path from 'node:path';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import type { Member } from '@vq/shared';
import { createApp } from '../app';
import { applySeed, loadSeed } from '../db/seed';
import { resetDb } from '../../test/helpers/db';
import { testPool } from '../../test/helpers/db';
import { deps } from '../../test/helpers/deps';

const pool = testPool();
const fixtureDir = path.resolve(__dirname, '../../test/fixtures/seed');
const app = createApp(deps(pool));

beforeEach(async () => {
  await resetDb(pool);
  await applySeed(pool, await loadSeed(fixtureDir));
});
afterAll(() => pool.end());

describe('GET /api/portfolio', () => {
  test('portfolio returns seeded data', async () => {
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(res.body.team.name).toBe('Fixture Team');
    expect(res.body.members.map((m: Member) => m.slug)).toEqual(['mickie', 'art']);
    expect(res.body.members[0].skills[0]).toEqual({
      name: expect.any(String),
      category: expect.any(String),
      level: 5,
    });
    expect(res.body.teamProjects[0].members.length).toBeGreaterThan(0);
  });

  test('unseeded DB → 503 NOT_SEEDED', async () => {
    await resetDb(pool);
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_SEEDED');
  });
});
