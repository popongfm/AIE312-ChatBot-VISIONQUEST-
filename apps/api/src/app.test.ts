import type { Pool } from 'pg';
import request from 'supertest';
import { expect, test } from 'vitest';
import { fakeChatModel } from '../test/helpers/app';
import { createApp } from './app';

/** A pool that never connects: health can be tested without a database. */
const fakePool = (up: boolean) =>
  ({
    query: async () => {
      if (!up) throw new Error('connection refused');
      return { rows: [] };
    },
  }) as unknown as Pool;

const app = (up = true) => createApp({ pool: fakePool(up), chatModel: fakeChatModel });

test('GET /api/health is ok when the database answers', async () => {
  const res = await request(app()).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok', db: 'ok' });
});

test('GET /api/health is 503 when the database is down', async () => {
  const res = await request(app(false)).get('/api/health');
  expect(res.status).toBe(503);
  expect(res.body).toEqual({ status: 'error', db: 'down' });
});

test('unknown /api path is a JSON 404', async () => {
  const res = await request(app()).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('NOT_FOUND');
});

test('broken JSON body is a JSON 400', async () => {
  const res = await request(app()).post('/api/health').set('Content-Type', 'application/json').send('{"a":');
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ error: { code: 'BAD_JSON', message: 'รูปแบบ JSON ไม่ถูกต้อง' } });
});

test('does not advertise Express in headers', async () => {
  const res = await request(app()).get('/api/health');
  expect(res.headers['x-powered-by']).toBeUndefined();
});
