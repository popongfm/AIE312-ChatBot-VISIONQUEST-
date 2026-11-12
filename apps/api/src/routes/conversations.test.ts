import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { fakeChatModel } from '../../test/helpers/app';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { createApp } from '../app';
import { migrate } from '../db/migrate';
import { addMessage } from '../services/chatRepo';

const ME = 'client-me-123';
const OTHER = 'client-other-456';

describe.skipIf(!hasTestDb)('/api/conversations', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  beforeAll(async () => {
    pool = await freshTestPool();
    await migrate(pool);
    app = createApp({ pool, chatModel: fakeChatModel });
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM conversations');
  });
  afterAll(async () => {
    await pool?.end();
  });

  const create = (firstMessage: unknown, client = ME) =>
    request(app).post('/api/conversations').set('X-Client-Id', client).send({ firstMessage });

  test.each([
    ['missing', undefined],
    ['too short', 'abc'],
    ['bad characters', 'hello world!!'],
  ])('X-Client-Id %s → 400 BAD_CLIENT_ID', async (_label, header) => {
    const req = request(app).get('/api/conversations');
    const res = await (header ? req.set('X-Client-Id', header) : req);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_CLIENT_ID');
  });

  test('POST creates a conversation titled from the first message, and GET lists it', async () => {
    const res = await create('  ทีมนี้ถนัดอะไร  ');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'ทีมนี้ถนัดอะไร' });
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);

    const list = await request(app).get('/api/conversations').set('X-Client-Id', ME);
    expect(list.status).toBe(200);
    expect(list.body).toEqual([res.body]);
    const others = await request(app).get('/api/conversations').set('X-Client-Id', OTHER);
    expect(others.body).toEqual([]);
  });

  test.each([
    ['missing', undefined],
    ['blank', '   '],
    ['not text', 42],
    ['too long', 'ก'.repeat(2001)],
  ])('POST with firstMessage %s → 400 BAD_REQUEST', async (_label, firstMessage) => {
    const res = await create(firstMessage);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('the length limit applies after trimming, so padding around a short message is fine', async () => {
    const res = await create(`  ${'ก'.repeat(2000)}${' '.repeat(50)}`);
    expect(res.status).toBe(201);
  });

  test('GET messages returns the conversation oldest first', async () => {
    const { body: c } = await create('hi');
    await addMessage(pool, c.id, { role: 'user', content: 'hi' });
    await addMessage(pool, c.id, { role: 'model', content: 'hello', citedMembers: ['ann'] });

    const res = await request(app).get(`/api/conversations/${c.id}/messages`).set('X-Client-Id', ME);
    expect(res.status).toBe(200);
    expect(res.body.map((m: { role: string; content: string; citedMembers: string[] }) => [m.role, m.content, m.citedMembers]))
      .toEqual([['user', 'hi', []], ['model', 'hello', ['ann']]]);
  });

  test("another visitor's conversation, a missing id and a malformed id are all 404", async () => {
    const { body: c } = await create('hi');
    for (const [id, client] of [[c.id, OTHER], ['00000000-0000-0000-0000-000000000000', ME], ['not-a-uuid', ME]]) {
      const res = await request(app).get(`/api/conversations/${id}/messages`).set('X-Client-Id', client);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  test('DELETE removes it for the owner only', async () => {
    const { body: c } = await create('hi');
    expect((await request(app).delete(`/api/conversations/${c.id}`).set('X-Client-Id', OTHER)).status).toBe(404);
    expect((await request(app).delete(`/api/conversations/${c.id}`).set('X-Client-Id', ME)).status).toBe(204);
    expect((await request(app).get(`/api/conversations/${c.id}/messages`).set('X-Client-Id', ME)).status).toBe(404);
    expect((await request(app).delete(`/api/conversations/${c.id}`).set('X-Client-Id', ME)).status).toBe(404);
  });
});
