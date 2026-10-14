import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { insertMessage } from '../services/chatRepo';
import { resetDb, testPool } from '../../test/helpers/db';
import { deps } from '../../test/helpers/deps';

const pool = testPool();
const app = createApp(deps(pool));
const A = randomUUID();
const B = randomUUID();

beforeEach(() => resetDb(pool));
afterAll(() => pool.end());

describe('conversations API', () => {
  test('create + list scoped to client, newest first', async () => {
    const first = await request(app).post('/api/conversations').set('X-Client-Id', A).expect(201);
    expect(first.body).toEqual({ id: expect.any(String), title: 'แชตใหม่', createdAt: expect.any(String) });
    const second = await request(app).post('/api/conversations').set('X-Client-Id', A).expect(201);
    await request(app).post('/api/conversations').set('X-Client-Id', B).expect(201);
    const res = await request(app).get('/api/conversations').set('X-Client-Id', A).expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((c: { id: string }) => c.id)).toEqual([second.body.id, first.body.id]);
  });

  test('missing or bad X-Client-Id → 400 BAD_CLIENT_ID', async () => {
    const missing = await request(app).get('/api/conversations').expect(400);
    expect(missing.body.error.code).toBe('BAD_CLIENT_ID');
    await request(app).get('/api/conversations').set('X-Client-Id', 'nope').expect(400);
    await request(app).post('/api/conversations').expect(400);
    await request(app).get(`/api/conversations/${randomUUID()}/messages`).expect(400);
  });

  test('other client or non-uuid id → identical 404', async () => {
    const { body } = await request(app).post('/api/conversations').set('X-Client-Id', A);
    const other = await request(app).get(`/api/conversations/${body.id}/messages`).set('X-Client-Id', B).expect(404);
    const missing = await request(app)
      .get(`/api/conversations/${randomUUID()}/messages`)
      .set('X-Client-Id', B)
      .expect(404);
    const bad = await request(app).get('/api/conversations/123/messages').set('X-Client-Id', A).expect(404);
    expect(other.body).toEqual(missing.body);
    expect(bad.body.error.code).toBe('NOT_FOUND');
  });

  test('clientId in query string is not accepted', async () => {
    await request(app).get(`/api/conversations?clientId=${A}`).expect(400);
  });

  test('messages returned oldest first with mapped fields', async () => {
    const { body } = await request(app).post('/api/conversations').set('X-Client-Id', A);
    await insertMessage(pool, { conversationId: body.id, role: 'user', content: 'hi' });
    await insertMessage(pool, { conversationId: body.id, role: 'model', content: 'yo', citedMembers: ['mickie'] });
    const res = await request(app).get(`/api/conversations/${body.id}/messages`).set('X-Client-Id', A).expect(200);
    expect(res.body).toEqual([
      { id: 1, role: 'user', content: 'hi', citedMembers: [], createdAt: expect.any(String) },
      { id: 2, role: 'model', content: 'yo', citedMembers: ['mickie'], createdAt: expect.any(String) },
    ]);
  });

  test('malformed URI in path param → 400 BAD_REQUEST, not logged as unhandled', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await request(app).get('/api/conversations/%E0/messages').set('X-Client-Id', A).expect(400);
      expect(res.body).toEqual({ error: { code: 'BAD_REQUEST', message: 'Bad request' } });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
