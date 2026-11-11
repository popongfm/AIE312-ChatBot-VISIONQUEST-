import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { migrate } from './migrate';

const tableNames = async (pool: Pool) =>
  (await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
  )).rows.map((r) => r.table_name);

describe.skipIf(!hasTestDb)('migrate', () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = await freshTestPool();
  });
  afterAll(async () => {
    await pool?.end();
  });

  test('first run applies 001_init.sql and creates every table', async () => {
    expect(await migrate(pool)).toContain('001_init.sql');
    expect(await tableNames(pool)).toEqual(expect.arrayContaining([
      'schema_migrations', 'team', 'contacts', 'members', 'member_skills', 'member_projects',
      'team_projects', 'team_project_members', 'conversations', 'messages',
    ]));
  });

  test('second run applies nothing', async () => {
    expect(await migrate(pool)).toEqual([]);
  });

  test('a failing migration is rolled back and not recorded', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vq-migrations-'));
    await writeFile(join(dir, '900_bad.sql'), 'CREATE TABLE half_done (id int); SELECT * FROM no_such_table;');
    await expect(migrate(pool, dir)).rejects.toThrow('Migration 900_bad.sql failed');
    expect(await tableNames(pool)).not.toContain('half_done');
    const { rowCount } = await pool.query(`SELECT 1 FROM schema_migrations WHERE name = '900_bad.sql'`);
    expect(rowCount).toBe(0);
  });

  test('message role must be user or model, and deleting a conversation deletes its messages', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO conversations (client_id, title) VALUES ('c1', 't') RETURNING id`,
    );
    const id = rows[0].id;
    await expect(pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'admin', 'x')`, [id],
    )).rejects.toThrow();
    await pool.query(`INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', 'hi')`, [id]);
    await pool.query('DELETE FROM conversations WHERE id = $1', [id]);
    const left = await pool.query('SELECT 1 FROM messages WHERE conversation_id = $1', [id]);
    expect(left.rowCount).toBe(0);
  });
});
