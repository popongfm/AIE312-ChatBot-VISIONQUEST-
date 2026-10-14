import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import {
  createConversation,
  getOwnedConversation,
  insertMessage,
  listMessages,
  recentMessages,
  setTitleIfDefault,
} from './chatRepo';
import { resetDb, testPool } from '../../test/helpers/db';

const pool = testPool();
const client = randomUUID();

beforeEach(() => resetDb(pool));
afterAll(() => pool.end());

describe('chatRepo', () => {
  test('insertMessage stores citedMembers and returns numeric id', async () => {
    const c = await createConversation(pool, client);
    const m = await insertMessage(pool, { conversationId: c.id, role: 'model', content: 'x', citedMembers: ['a', 'b'] });
    expect(typeof m.id).toBe('number');
    expect(m.citedMembers).toEqual(['a', 'b']);
    expect(new Date(m.createdAt).toISOString()).toBe(m.createdAt);
    const d = await insertMessage(pool, { conversationId: c.id, role: 'user', content: 'y' });
    expect(d.citedMembers).toEqual([]);
  });

  test('listMessages is oldest first', async () => {
    const c = await createConversation(pool, client);
    for (const t of ['1', '2', '3']) await insertMessage(pool, { conversationId: c.id, role: 'user', content: t });
    expect((await listMessages(pool, c.id)).map((m) => m.content)).toEqual(['1', '2', '3']);
  });

  test('recentMessages returns the latest N, oldest first', async () => {
    const c = await createConversation(pool, client);
    for (const t of ['1', '2', '3', '4']) await insertMessage(pool, { conversationId: c.id, role: 'user', content: t });
    expect(await recentMessages(pool, c.id, 2)).toEqual([
      { role: 'user', content: '3' },
      { role: 'user', content: '4' },
    ]);
  });

  test('setTitleIfDefault only applies once', async () => {
    const c = await createConversation(pool, client);
    await setTitleIfDefault(pool, c.id, 'first');
    await setTitleIfDefault(pool, c.id, 'second');
    expect((await getOwnedConversation(pool, c.id, client))?.title).toBe('first');
  });

  test('getOwnedConversation rejects non-uuid and foreign owner', async () => {
    const c = await createConversation(pool, client);
    expect(await getOwnedConversation(pool, 'abc', client)).toBeNull();
    expect(await getOwnedConversation(pool, c.id, randomUUID())).toBeNull();
    expect(await getOwnedConversation(pool, c.id, client)).toEqual(c);
  });
});
