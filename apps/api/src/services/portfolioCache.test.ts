import type { Portfolio } from '@vq/shared';
import { expect, test, vi } from 'vitest';
import { createPortfolioCache } from './portfolioCache';

const portfolio = { team: { name: 'VQ' } } as Portfolio;

test('serves the cached value within the TTL and reloads after it', async () => {
  let t = 0;
  const load = vi.fn(async () => portfolio);
  const cache = createPortfolioCache(load, 60_000, () => t);
  expect(await cache.get()).toBe(portfolio);
  t = 59_999;
  await cache.get();
  expect(load).toHaveBeenCalledTimes(1);
  t = 60_000;
  await cache.get();
  expect(load).toHaveBeenCalledTimes(2);
});

test('does not cache null (not seeded yet), so seeding shows up on the next message', async () => {
  const load = vi.fn<() => Promise<Portfolio | null>>().mockResolvedValueOnce(null).mockResolvedValueOnce(portfolio);
  const cache = createPortfolioCache(load, 60_000, () => 0);
  expect(await cache.get()).toBeNull();
  expect(await cache.get()).toBe(portfolio);
});

test('clear() forces a reload', async () => {
  const load = vi.fn(async () => portfolio);
  const cache = createPortfolioCache(load, 60_000, () => 0);
  await cache.get();
  cache.clear();
  await cache.get();
  expect(load).toHaveBeenCalledTimes(2);
});
