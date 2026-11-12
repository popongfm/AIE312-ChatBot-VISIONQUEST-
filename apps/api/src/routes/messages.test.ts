import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeModel } from '../../test/helpers/fakeModel';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { parseSseText } from '../../test/helpers/sse';
import { createApp } from '../app';
import { migrate } from '../db/migrate';
import { applySeed, type SeedData } from '../db/seed';
import type { ChatModel } from '../services/gemini';
import { AiError, AiRateLimitError } from '../services/gemini';

const A = 'client-a-1234';
const B = 'client-b-5678';

const seed: SeedData = {
  team: { name: 'VISIONQUEST', tagline: null, concept: null, highlights: [] },
  contacts: [],
  teamProjects: [],
  members: [
    { slug: 'mickie', name: 'สมชาย ใจดี', nickname: 'Mickie', role: 'AI', bio: null, avatarUrl: null, sortOrder: 1,
      skills: [{ name: 'Python', category: 'ai', level: 4 }], projects: [] },
    { slug: 'art', name: 'อาทิตย์ แสงทอง', nickname: 'Art', role: 'Web', bio: null, avatarUrl: null, sortOrder: 2,
      skills: [], projects: [] },
  ],
};

describe.skipIf(!hasTestDb)('POST /api/conversations/:id/messages', () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = await freshTestPool();
    await migrate(pool);
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM conversations');
    await applySeed(pool, seed);
  });
  afterAll(async () => {
    await pool?.end();
  });

  /** A new app per test: fresh rate limiters and portfolio cache. */
  const appWith = (model: ChatModel) => createApp({ pool, chatModel: model });
  const newConversation = async (app: ReturnType<typeof appWith>, client = A, firstMessage = 'ใครทำ AI') =>
    (await request(app).post('/api/conversations').set('X-Client-Id', client).send({ firstMessage })).body.id as string;
  const send = (app: ReturnType<typeof appWith>, client: string, id: string, content: unknown) =>
    request(app).post(`/api/conversations/${id}/messages`).set('X-Client-Id', client).send({ content });
  const rows = async () =>
    (await pool.query<{ role: string; content: string; cited_members: string[] }>(
      'SELECT role, content, cited_members FROM messages ORDER BY id')).rows;

  test('streams tokens then done, and saves both messages with citations', async () => {
    const app = appWith(fakeModel(['ถาม ', 'Mickie ', 'ได้เลย']));
    const id = await newConversation(app);
    const res = await send(app, A, id, 'ใครทำ AI');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/event-stream/);
    expect(res.headers['cache-control']).toBe('no-cache, no-transform');
    expect(res.headers['x-accel-buffering']).toBe('no');
    const events = parseSseText(res.text);
    expect(events.filter((e) => e.type === 'token').map((e) => (e as { text: string }).text).join('')).toBe('ถาม Mickie ได้เลย');
    const done = events.at(-1);
    expect(done).toMatchObject({ type: 'done', citedMembers: ['mickie'] });

    expect(await rows()).toEqual([
      { role: 'user', content: 'ใครทำ AI', cited_members: [] },
      { role: 'model', content: 'ถาม Mickie ได้เลย', cited_members: ['mickie'] },
    ]);
    const saved = await request(app).get(`/api/conversations/${id}/messages`).set('X-Client-Id', A);
    expect(saved.body.at(-1).id).toBe((done as { messageId: number }).messageId);
  });

  test('the model gets the portfolio as its system instruction and the question as the last turn', async () => {
    const model = fakeModel(['ok']);
    const app = appWith(model);
    await send(app, A, await newConversation(app), '  ใครทำ AI  ');
    expect(model.calls[0].systemInstruction).toContain('<portfolio>');
    expect(model.calls[0].systemInstruction).toContain('### Mickie (slug: mickie) — AI');
    expect(model.calls[0].history).toEqual([{ role: 'user', text: 'ใครทำ AI' }]);
    expect(model.calls[0].signal).toBeInstanceOf(AbortSignal);
  });

  test('a second message sends the earlier turns as history', async () => {
    const model = fakeModel(['คำตอบ']);
    const app = appWith(model);
    const id = await newConversation(app);
    await send(app, A, id, 'คำถาม 1');
    await send(app, A, id, 'คำถาม 2');
    expect(model.calls[1].history).toEqual([
      { role: 'user', text: 'คำถาม 1' },
      { role: 'model', text: 'คำตอบ' },
      { role: 'user', text: 'คำถาม 2' },
    ]);
  });

  test('Gemini out of quota → RATE_LIMITED event with the fixed Thai copy; user message kept, no model row', async () => {
    const app = appWith(fakeModel([new AiRateLimitError('quota')]));
    const res = await send(app, A, await newConversation(app), 'hi');
    expect(parseSseText(res.text).at(-1)).toEqual({ type: 'error', code: 'RATE_LIMITED', message: 'AI คิวเต็ม ลองใหม่ในอีกสักครู่' });
    expect((await rows()).map((r) => r.role)).toEqual(['user']);
  });

  test('any other model failure, even after some text, → AI_ERROR; nothing half-written is saved', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = appWith(fakeModel(['ครึ่ง', new AiError('boom')]));
    const res = await send(app, A, await newConversation(app), 'hi');
    expect(parseSseText(res.text).at(-1)).toEqual({ type: 'error', code: 'AI_ERROR', message: 'Oracle ขัดข้อง ลองใหม่อีกครั้ง' });
    expect((await rows()).map((r) => r.role)).toEqual(['user']);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('an empty answer from the model is an AI_ERROR, not a blank message', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = appWith(fakeModel([]));
    const res = await send(app, A, await newConversation(app), 'hi');
    expect(parseSseText(res.text).at(-1)).toMatchObject({ type: 'error', code: 'AI_ERROR' });
    expect((await rows()).map((r) => r.role)).toEqual(['user']);
    log.mockRestore();
  });

  test('database not seeded → AI_ERROR event instead of a crash; user message kept', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await pool.query('TRUNCATE team');
    const model = fakeModel(['never']);
    const app = appWith(model);
    const res = await send(app, A, await newConversation(app), 'hi');
    expect(parseSseText(res.text).at(-1)).toMatchObject({ type: 'error', code: 'AI_ERROR' });
    expect(model.calls).toHaveLength(0);
    expect((await rows()).map((r) => r.role)).toEqual(['user']);
    log.mockRestore();
  });

  test.each([
    ['blank', '   '],
    ['not text', 42],
    ['too long', 'ก'.repeat(2001)],
  ])('%s content → 400 JSON, nothing saved, model not called', async (_label, content) => {
    const model = fakeModel(['x']);
    const app = appWith(model);
    const res = await send(app, A, await newConversation(app), content);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(await rows()).toEqual([]);
    expect(model.calls).toHaveLength(0);
  });

  test("another visitor's conversation, a missing id and a malformed id are all 404", async () => {
    const app = appWith(fakeModel(['x']));
    const id = await newConversation(app, A);
    for (const [cid, client] of [[id, B], ['00000000-0000-0000-0000-000000000000', A], ['nope', A]]) {
      const res = await send(app, client, cid, 'hi');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
    expect(await rows()).toEqual([]);
  });

  test('missing X-Client-Id → 400', async () => {
    const app = appWith(fakeModel(['x']));
    const id = await newConversation(app);
    const res = await request(app).post(`/api/conversations/${id}/messages`).send({ content: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_CLIENT_ID');
  });

  test('the 11th message in a minute from one visitor → 429 JSON; another visitor is unaffected', async () => {
    const app = appWith(fakeModel(['ok']));
    const id = await newConversation(app, A);
    for (let i = 0; i < 10; i++) expect((await send(app, A, id, `q${i}`)).status).toBe(200);
    const res = await send(app, A, id, 'q10');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: { code: 'TOO_MANY_REQUESTS', message: 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่' } });
    expect((await send(app, B, await newConversation(app, B), 'hi')).status).toBe(200);
  });

  test('visitor hangs up mid-answer → the model is aborted and the partial answer is still saved', async () => {
    const model = fakeModel(['ครึ่ง', 'WAIT_FOR_ABORT']);
    const app = appWith(model);
    const id = await newConversation(app);
    const server = app.listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      await new Promise<void>((resolve, reject) => {
        const req = httpRequest({
          port, method: 'POST', path: `/api/conversations/${id}/messages`,
          headers: { 'Content-Type': 'application/json', 'X-Client-Id': A },
        }, (res) => {
          res.on('data', (chunk: Buffer) => {
            if (chunk.toString().includes('ครึ่ง')) { req.destroy(); resolve(); }
          });
        });
        req.on('error', (e) => (e.message.includes('socket hang up') ? undefined : reject(e)));
        req.end(JSON.stringify({ content: 'hi' }));
      });
      await vi.waitFor(async () => {
        expect(await rows()).toEqual([
          { role: 'user', content: 'hi', cited_members: [] },
          { role: 'model', content: 'ครึ่ง', cited_members: [] },
        ]);
      }, { timeout: 3000 });
      expect(model.calls[0].signal?.aborted).toBe(true);
    } finally {
      server.close();
    }
  });
});
