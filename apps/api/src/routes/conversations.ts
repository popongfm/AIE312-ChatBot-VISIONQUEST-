import type { Conversation } from '@vq/shared';
import express, { type Response } from 'express';
import type { Pool } from 'pg';
import type { AppDeps } from '../app';
import { clientIdOf, requireClientId } from '../middleware/clientId';
import { HttpError } from '../middleware/errors';
import {
  createConversation, deleteConversation, getConversation, listConversations, listMessages,
} from '../services/chatRepo';
import { makeTitle } from '../services/title';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 2000;

const notFound = () => new HttpError(404, 'NOT_FOUND', 'ไม่พบบทสนทนานี้');

/** The visitor's own conversation, or a 404 (also for malformed ids and other visitors' conversations). */
export async function ownConversation(pool: Pool, res: Response, id: string): Promise<Conversation> {
  const conversation = UUID.test(id) ? await getConversation(pool, clientIdOf(res), id) : null;
  if (!conversation) throw notFound();
  return conversation;
}

/** A user message from the request body: a non-empty string up to MAX_MESSAGE_LENGTH characters. */
export function messageText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'BAD_REQUEST', `ต้องส่ง ${field} เป็นข้อความที่ไม่ว่าง`);
  }
  if (value.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, 'BAD_REQUEST', `${field} ยาวได้ไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`);
  }
  return value.trim();
}

/** /api/conversations — every route needs the X-Client-Id header. */
export function conversationsRouter({ pool }: AppDeps) {
  const router = express.Router();
  router.use(requireClientId);

  /** GET /api/conversations — this visitor's conversations, newest first. */
  router.get('/', async (_req, res) => {
    res.json(await listConversations(pool, clientIdOf(res)));
  });

  /** POST /api/conversations { firstMessage } — titled from the first message; the message itself is sent next. */
  router.post('/', async (req, res) => {
    const first = messageText((req.body as { firstMessage?: unknown } | undefined)?.firstMessage, 'firstMessage');
    res.status(201).json(await createConversation(pool, clientIdOf(res), makeTitle(first)));
  });

  /** GET /api/conversations/:id/messages — the whole conversation, oldest first. */
  router.get('/:id/messages', async (req, res) => {
    const conversation = await ownConversation(pool, res, req.params.id);
    res.json(await listMessages(pool, conversation.id));
  });

  /** DELETE /api/conversations/:id — removes the conversation and its messages. */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!UUID.test(id) || !(await deleteConversation(pool, clientIdOf(res), id))) throw notFound();
    res.status(204).end();
  });

  // Task 9 (Lead): POST /:id/messages streams the AI reply (SSE). Use ownConversation(), messageText(),
  // recentMessages() + buildHistory() for the prompt, and addMessage() for the user and model messages.

  return router;
}
