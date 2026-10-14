import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { resetDb, testPool } from '../../test/helpers/db';
import { runMigrations } from './migrate';

const pool = testPool();
afterAll(() => pool.end());

describe('migrations', () => {
  test('migrations are idempotent', async () => {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    expect(await runMigrations(pool)).toEqual(['001_init.sql']);
    expect(await runMigrations(pool)).toEqual([]);
    const { rows } = await pool.query(`SELECT to_regclass('public.messages') AS t`);
    expect(rows[0].t).toBe('messages');
  });

  describe('schema', () => {
    beforeAll(() => resetDb(pool));

    test('member_skills.level must be 1..5', async () => {
      const m = await pool.query(
        `INSERT INTO members (slug, name, role) VALUES ('a', 'A', 'dev') RETURNING id`,
      );
      const s = await pool.query(
        `INSERT INTO skills (name, category) VALUES ('ts', 'frontend') RETURNING id`,
      );
      const insert = (level: number) =>
        pool.query(`INSERT INTO member_skills (member_id, skill_id, level) VALUES ($1, $2, $3)`, [
          m.rows[0].id,
          s.rows[0].id,
          level,
        ]);
      await expect(insert(6)).rejects.toMatchObject({ code: '23514' });
      await expect(insert(0)).rejects.toMatchObject({ code: '23514' });
      await expect(insert(5)).resolves.toBeDefined();
    });

    test('messages.role is limited to user/model and cascades on conversation delete', async () => {
      const c = await pool.query(
        `INSERT INTO conversations (client_id, title) VALUES (gen_random_uuid(), 't') RETURNING id`,
      );
      const id = c.rows[0].id;
      await expect(
        pool.query(`INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'bot', 'x')`, [id]),
      ).rejects.toMatchObject({ code: '23514' });
      await pool.query(`INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', 'x')`, [id]);
      await pool.query(`DELETE FROM conversations WHERE id = $1`, [id]);
      const { rows } = await pool.query(`SELECT count(*)::int AS n FROM messages`);
      expect(rows[0].n).toBe(0);
    });

    test('resetDb truncates data but keeps schema_migrations', async () => {
      await resetDb(pool);
      const members = await pool.query(`SELECT count(*)::int AS n FROM members`);
      expect(members.rows[0].n).toBe(0);
      const applied = await pool.query(`SELECT filename FROM schema_migrations`);
      expect(applied.rows).toEqual([{ filename: '001_init.sql' }]);
    });
  });
});
