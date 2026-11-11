import type { Conversation, Message, Role } from '@vq/shared';
import type { Pool } from 'pg';

type ConversationRow = { id: string; title: string; created_at: Date };
type MessageRow = { id: number; role: Role; content: string; cited_members: string[]; created_at: Date };

const toConversation = (r: ConversationRow): Conversation => ({
  id: r.id, title: r.title, createdAt: r.created_at.toISOString(),
});
const toMessage = (r: MessageRow): Message => ({
  id: r.id, role: r.role, content: r.content, citedMembers: r.cited_members, createdAt: r.created_at.toISOString(),
});
const MESSAGE_COLUMNS = 'id, role, content, cited_members, created_at';

/** A visitor's conversations, newest first. */
export async function listConversations(pool: Pool, clientId: string, limit = 50): Promise<Conversation[]> {
  const { rows } = await pool.query<ConversationRow>(
    'SELECT id, title, created_at FROM conversations WHERE client_id = $1 ORDER BY created_at DESC, id LIMIT $2',
    [clientId, limit]);
  return rows.map(toConversation);
}

export async function createConversation(pool: Pool, clientId: string, title: string): Promise<Conversation> {
  const { rows } = await pool.query<ConversationRow>(
    'INSERT INTO conversations (client_id, title) VALUES ($1, $2) RETURNING id, title, created_at',
    [clientId, title]);
  return toConversation(rows[0]);
}

/** The conversation only if it belongs to this visitor; another visitor's id gives null, same as a missing one. */
export async function getConversation(pool: Pool, clientId: string, id: string): Promise<Conversation | null> {
  const { rows } = await pool.query<ConversationRow>(
    'SELECT id, title, created_at FROM conversations WHERE id = $1 AND client_id = $2', [id, clientId]);
  return rows[0] ? toConversation(rows[0]) : null;
}

/** Deletes the conversation and (by ON DELETE CASCADE) its messages. False if it is not this visitor's. */
export async function deleteConversation(pool: Pool, clientId: string, id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM conversations WHERE id = $1 AND client_id = $2', [id, clientId]);
  return (rowCount ?? 0) > 0;
}

/** Every message of a conversation, oldest first. */
export async function listMessages(pool: Pool, conversationId: string): Promise<Message[]> {
  const { rows } = await pool.query<MessageRow>(
    `SELECT ${MESSAGE_COLUMNS} FROM messages WHERE conversation_id = $1 ORDER BY id`, [conversationId]);
  return rows.map(toMessage);
}

/** The last `limit` messages, oldest first: the history sent to Gemini (see services/history.ts). */
export async function recentMessages(pool: Pool, conversationId: string, limit = 10): Promise<Message[]> {
  const { rows } = await pool.query<MessageRow>(
    `SELECT * FROM (
       SELECT ${MESSAGE_COLUMNS} FROM messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2
     ) latest ORDER BY id`, [conversationId, limit]);
  return rows.map(toMessage);
}

export async function addMessage(
  pool: Pool,
  conversationId: string,
  msg: { role: Role; content: string; citedMembers?: string[] },
): Promise<Message> {
  const { rows } = await pool.query<MessageRow>(
    `INSERT INTO messages (conversation_id, role, content, cited_members) VALUES ($1, $2, $3, $4)
     RETURNING ${MESSAGE_COLUMNS}`,
    [conversationId, msg.role, msg.content, msg.citedMembers ?? []]);
  return toMessage(rows[0]);
}
