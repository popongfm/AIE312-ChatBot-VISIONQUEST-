import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { freshTestPool, hasTestDb } from '../../test/helpers/db';
import { migrate } from '../db/migrate';
import {
  addMessage, createConversation, deleteConversation, getConversation, listConversations, listMessages, recentMessages,
} from './chatRepo';

describe.skipIf(!hasTestDb)('chatRepo', () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = await freshTestPool();
    await migrate(pool);
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM conversations');
  });
  afterAll(async () => {
    await pool?.end();
  });

  test('each visitor sees only their own conversations, newest first', async () => {
    const older = await createConversation(pool, 'client-a', 'older');
    await pool.query(`UPDATE conversations SET created_at = now() - interval '1 hour' WHERE id = $1`, [older.id]);
    const newer = await createConversation(pool, 'client-a', 'newer');
    await createConversation(pool, 'client-b', 'not mine');

    expect((await listConversations(pool, 'client-a')).map((c) => c.title)).toEqual(['newer', 'older']);
    expect(newer).toMatchObject({ title: 'newer' });
    expect(new Date(newer.createdAt).toISOString()).toBe(newer.createdAt);
    expect(await getConversation(pool, 'client-b', newer.id)).toBeNull();
    expect(await getConversation(pool, 'client-a', newer.id)).toEqual(newer);
  });

  test('messages keep their order, role and cited members', async () => {
    const c = await createConversation(pool, 'client-a', 't');
    const q = await addMessage(pool, c.id, { role: 'user', content: 'ใครทำ backend' });
    const a = await addMessage(pool, c.id, { role: 'model', content: 'Natdanai', citedMembers: ['natdanai'] });

    expect(q).toMatchObject({ role: 'user', content: 'ใครทำ backend', citedMembers: [] });
    expect(a.citedMembers).toEqual(['natdanai']);
    expect(await listMessages(pool, c.id)).toEqual([q, a]);
  });

  test('recentMessages returns the last N, oldest first', async () => {
    const c = await createConversation(pool, 'client-a', 't');
    for (let i = 1; i <= 5; i++) await addMessage(pool, c.id, { role: i % 2 ? 'user' : 'model', content: `m${i}` });
    expect((await recentMessages(pool, c.id, 3)).map((m) => m.content)).toEqual(['m3', 'm4', 'm5']);
  });

  test('only the owner can delete, and messages go with the conversation', async () => {
    const c = await createConversation(pool, 'client-a', 't');
    await addMessage(pool, c.id, { role: 'user', content: 'hi' });

    expect(await deleteConversation(pool, 'client-b', c.id)).toBe(false);
    expect(await deleteConversation(pool, 'client-a', c.id)).toBe(true);
    expect(await listMessages(pool, c.id)).toEqual([]);
    expect(await deleteConversation(pool, 'client-a', c.id)).toBe(false);
  });
});
