import pg from 'pg';
import { runMigrations } from '../../src/db/migrate';
import { createPool } from '../../src/db/pool';

const DEFAULT_TEST_URL = 'postgres://postgres:postgres@localhost:5432/visionquest_test';

export function testPool(): pg.Pool {
  return createPool(process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_URL);
}

/** Migrates, then empties every table except schema_migrations. */
export async function resetDb(pool: pg.Pool): Promise<void> {
  await runMigrations(pool);
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'`,
  );
  if (rows.length === 0) return;
  const list = rows.map((r) => `"${r.tablename}"`).join(', ');
  await pool.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}
