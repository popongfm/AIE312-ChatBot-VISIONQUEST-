import type { Portfolio } from '@vq/shared';

/**
 * Keeps the portfolio for `ttlMs` so each chat message doesn't re-read seven tables.
 * `null` (database not seeded) is never cached, so seeding takes effect on the next message.
 * After a reseed, chat answers can lag the data by at most `ttlMs` (default 60 s).
 */
export function createPortfolioCache(
  load: () => Promise<Portfolio | null>,
  ttlMs = 60_000,
  now: () => number = Date.now,
) {
  let value: Portfolio | null = null;
  let loadedAt = 0;
  return {
    async get(): Promise<Portfolio | null> {
      if (value && now() - loadedAt < ttlMs) return value;
      const fresh = await load();
      if (fresh) {
        value = fresh;
        loadedAt = now();
      }
      return fresh;
    },
    clear() {
      value = null;
    },
  };
}
