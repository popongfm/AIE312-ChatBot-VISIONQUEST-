import type pg from 'pg';
import { z } from 'zod';
import type { Conversation, Message, Role } from '@vq/shared';

export const DEFAULT_TITLE = 'แชตใหม่';

const uuid = z.string().uuid();

type ConversationRow = { id: string; title: string; created_at: Date };
type MessageRow = { id: string; role: Role; content: string; cited_members: string[]; created_at: Date };

const toConversation = (r: ConversationRow): Conversation => ({
  id: r.id,
  title: r.title,
  createdAt: r.created_at.toISOString(),
});

const toMessage = (r: MessageRow): Message => ({
  id: Number(r.id),
  role: r.role,
  content: r.content,
  citedMembers: r.cited_members,
  createdAt: r.created_at.toISOString(),
});

export async function createConversation(pool: pg.Pool, clientId: string): Promise<Conversation> {
  const { rows } = await pool.query<ConversationRow>(
    'INSERT INTO conversations (client_id, title) VALUES ($1, $2) RETURNING id, title, created_at',
    [clientId, DEFAULT_TITLE],
  );
  return toConversation(rows[0]!);
}

export async function listConversations(pool: pg.Pool, clientId: string): Promise<Conversation[]> {
  const { rows } = await pool.query<ConversationRow>(
    'SELECT id, title, created_at FROM conversations WHERE client_id = $1 ORDER BY created_at DESC, id',
    [clientId],
  );
  return rows.map(toConversation);
}

export async function getOwnedConversation(
  pool: pg.Pool,
  id: string,
  clientId: string,
): Promise<Conversation | null> {
  if (!uuid.safeParse(id).success) return null;
  const { rows } = await pool.query<ConversationRow>(
    'SELECT id, title, created_at FROM conversations WHERE id = $1 AND client_id = $2',
    [id, clientId],
  );
  return rows[0] ? toConversation(rows[0]) : null;
}

export async function listMessages(pool: pg.Pool, conversationId: string): Promise<Message[]> {
  const { rows } = await pool.query<MessageRow>(
    'SELECT id, role, content, cited_members, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at, id',
    [conversationId],
  );
  return rows.map(toMessage);
}

export async function recentMessages(
  pool: pg.Pool,
  conversationId: string,
  limit: number,
): Promise<{ role: Role; content: string }[]> {
  const { rows } = await pool.query<{ role: Role; content: string }>(
    'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2',
    [conversationId, limit],
  );
  return rows.reverse();
}

export async function insertMessage(
  pool: pg.Pool,
  m: { conversationId: string; role: Role; content: string; citedMembers?: string[] },
): Promise<Message> {
  const { rows } = await pool.query<MessageRow>(
    `INSERT INTO messages (conversation_id, role, content, cited_members)
     VALUES ($1, $2, $3, $4) RETURNING id, role, content, cited_members, created_at`,
    [m.conversationId, m.role, m.content, m.citedMembers ?? []],
  );
  return toMessage(rows[0]!);
}

export async function setTitleIfDefault(pool: pg.Pool, id: string, title: string): Promise<void> {
  await pool.query('UPDATE conversations SET title = $2 WHERE id = $1 AND title = $3', [id, title, DEFAULT_TITLE]);
}
