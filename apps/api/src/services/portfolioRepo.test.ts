import path from 'node:path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Portfolio } from '@vq/shared';
import { applySeed, loadSeed } from '../db/seed';
import { resetDb, testPool } from '../../test/helpers/db';
import { createPortfolioCache, getPortfolio } from './portfolioRepo';

const pool = testPool();
const fixtureDir = path.resolve(__dirname, '../../test/fixtures/seed');

beforeEach(async () => {
  await resetDb(pool);
  await applySeed(pool, await loadSeed(fixtureDir));
});
afterAll(() => pool.end());

describe('getPortfolio', () => {
  test('returns null when there is no team row', async () => {
    await resetDb(pool);
    expect(await getPortfolio(pool)).toBeNull();
  });

  test('maps team, contacts and arrays', async () => {
    const p = (await getPortfolio(pool))!;
    expect(p.team).toEqual({ name: 'VISIONQUEST', tagline: 'Fixture tagline', concept: null, highlights: ['h1', 'h2'] });
    expect(p.contacts.map((c) => c.type)).toEqual(['email', 'github']);
    expect(p.teamProjects[0]!.tech).toEqual(['React', 'Express']);
  });

  test('members ordered by sort_order, skills by level desc', async () => {
    const p = (await getPortfolio(pool))!;
    expect(p.members.map((m) => m.slug)).toEqual(['mickie', 'art']);
    const levels = p.members[0]!.skills.map((s) => s.level);
    expect(levels).toEqual([...levels].sort((a, b) => b - a));
    expect(levels[0]).toBe(5);
  });

  test('member projects include personal and team projects with isTeamProject', async () => {
    const mickie = (await getPortfolio(pool))!.members[0]!;
    const byTitle = Object.fromEntries(mickie.projects.map((pr) => [pr.title, pr]));
    expect(byTitle['Mickie Personal Project']).toMatchObject({ isTeamProject: false, contribution: 'Everything' });
    expect(byTitle['Fixture Team Project']).toMatchObject({ isTeamProject: true, contribution: 'Built the AI part' });
  });

  test('teamProjects lists only team projects with ordered members', async () => {
    const tps = (await getPortfolio(pool))!.teamProjects;
    expect(tps.map((t) => t.title)).toEqual(['Fixture Team Project']);
    expect(tps[0]!.members.map((m) => m.slug)).toEqual(['mickie', 'art']);
    expect(tps[0]!.members[1]).toEqual({ slug: 'art', name: expect.any(String), nickname: 'Art', contribution: 'Built the UI' });
  });
});

describe('createPortfolioCache', () => {
  const value = { team: { name: 'T' } } as unknown as Portfolio;

  test('serves cached value within ttl and reloads after', async () => {
    let t = 1000;
    const load = vi.fn(async () => value);
    const cache = createPortfolioCache(load, 60_000, () => t);
    await cache.get();
    t += 59_999;
    await cache.get();
    expect(load).toHaveBeenCalledTimes(1);
    t += 2;
    await cache.get();
    expect(load).toHaveBeenCalledTimes(2);
  });

  test('does not cache null', async () => {
    const load = vi.fn(async () => null);
    const cache = createPortfolioCache(load, 60_000, () => 0);
    expect(await cache.get()).toBeNull();
    await cache.get();
    expect(load).toHaveBeenCalledTimes(2);
  });

  test('clear() forces reload', async () => {
    const load = vi.fn(async () => value);
    const cache = createPortfolioCache(load, 60_000, () => 0);
    await cache.get();
    cache.clear();
    await cache.get();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
