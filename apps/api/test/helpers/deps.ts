import type pg from 'pg';
import type { Config } from '../../src/config';
import type { AppDeps } from '../../src/app';
import { getPortfolio } from '../../src/services/portfolioRepo';

export const testConfig = (over: Partial<Config> = {}): Config => ({
  databaseUrl: 'postgres://unused',
  geminiApiKey: 'k',
  geminiModel: 'm',
  geminiFallbackModel: null,
  webOrigin: 'https://vq.vercel.app',
  port: 3000,
  version: 'test',
  ...over,
});

export function deps(pool: pg.Pool, config: Partial<Config> = {}): AppDeps {
  return {
    pool,
    config: testConfig(config),
    model: {
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new Error('model not used');
      },
    },
    portfolio: { get: () => getPortfolio(pool) },
  };
}
