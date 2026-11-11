import type { Pool } from 'pg';
import { createPool } from '../../src/db/pool';

const url = process.env.TEST_DATABASE_URL?.trim();

/** DB tests are skipped when TEST_DATABASE_URL is not set, so `npm test` still passes without docker. CI always sets it. */
export const hasTestDb = Boolean(url);

/**
 * A pool on an empty test database: every table is dropped first.
 * Refuses any database whose name does not end in _test, so a wrong URL can never wipe real data.
 */
export async function freshTestPool(): Promise<Pool> {
  if (!url) throw new Error('TEST_DATABASE_URL is not set');
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(`Refusing to wipe "${dbName}": test database name must end with _test`);
  }
  const pool = createPool(url);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  return pool;
}
