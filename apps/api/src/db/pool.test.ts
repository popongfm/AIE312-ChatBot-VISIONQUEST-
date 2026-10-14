import { afterAll, describe, expect, test } from 'vitest';
import { testPool } from '../../test/helpers/db';
import { createPool, migrationUrlFrom, sslConfigFor } from './pool';

describe('sslConfigFor', () => {
  test('ssl only for sslmode=require', () => {
    expect(sslConfigFor('postgres://u:p@ep-x.neon.tech/db?sslmode=require')).toEqual({
      rejectUnauthorized: true,
    });
    expect(sslConfigFor('postgres://postgres:postgres@localhost:5432/visionquest_test')).toBe(
      false,
    );
  });
});

describe('migrationUrlFrom', () => {
  test('prefers the direct (unpooled) Neon URL', () => {
    expect(
      migrationUrlFrom({ DATABASE_URL: 'postgres://pooled', DATABASE_URL_UNPOOLED: 'postgres://direct' }),
    ).toBe('postgres://direct');
  });

  test('falls back to DATABASE_URL, then undefined', () => {
    expect(migrationUrlFrom({ DATABASE_URL: 'postgres://pooled', DATABASE_URL_UNPOOLED: '' })).toBe(
      'postgres://pooled',
    );
    expect(migrationUrlFrom({})).toBeUndefined();
  });
});

describe('createPool', () => {
  const pool = createPool(
    process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/visionquest_test',
  );
  afterAll(() => pool.end());

  test('connects and runs a query', async () => {
    const { rows } = await pool.query('SELECT 1 AS n');
    expect(rows[0].n).toBe(1);
  });

  test('testPool helper returns a usable pool', async () => {
    const p = testPool();
    try {
      const { rows } = await p.query('SELECT 2 AS n');
      expect(rows[0].n).toBe(2);
    } finally {
      await p.end();
    }
  });
});
