import { CHAT_ERROR_COPY, type ChatErrorCode, type ChatStreamEvent, type Conversation } from '@vq/shared';
import express, { type Response } from 'express';
import type { Pool } from 'pg';
import type { AppDeps } from '../app';
import { clientIdOf, requireClientId } from '../middleware/clientId';
import { HttpError } from '../middleware/errors';
import { createMessageLimiters } from '../middleware/rateLimit';
import {
  addMessage, createConversation, deleteConversation, getConversation, listConversations, listMessages, recentMessages,
} from '../services/chatRepo';
import { detectCitations } from '../services/citations';
import { AiRateLimitError } from '../services/gemini';
import { buildHistory } from '../services/history';
import { createPortfolioCache } from '../services/portfolioCache';
import { getPortfolio } from '../services/portfolioRepo';
import { buildSystemInstruction } from '../services/promptBuilder';
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
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new HttpError(400, 'BAD_REQUEST', `ต้องส่ง ${field} เป็นข้อความที่ไม่ว่าง`);
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, 'BAD_REQUEST', `${field} ยาวได้ไม่เกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`);
  }
  return text;
}

/** /api/conversations — every route needs the X-Client-Id header. */
/** How many earlier messages go to Gemini as history (spec: the 10 most recent). */
const HISTORY_LIMIT = 10;

/** One Server-Sent Event: `event: <type>` then the rest of the object as JSON. */
function sendEvent(res: Response, event: ChatStreamEvent): void {
  const { type, ...data } = event;
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

const errorEvent = (code: ChatErrorCode): ChatStreamEvent => ({ type: 'error', code, message: CHAT_ERROR_COPY[code] });

export function conversationsRouter({ pool, chatModel }: AppDeps) {
  const router = express.Router();
  router.use(requireClientId);
  const portfolio = createPortfolioCache(() => getPortfolio(pool));

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

  /**
   * POST /api/conversations/:id/messages { content } — saves the question, then streams Oracle's answer as
   * Server-Sent Events: `token` (a piece of text) … then `done` { messageId, citedMembers } or `error` { code, message }.
   * Problems found before streaming starts (bad input, not yours, too many requests) are normal JSON errors.
   */
  router.post<{ id: string }>('/:id/messages', ...createMessageLimiters(), async (req, res) => {
    const content = messageText((req.body as { content?: unknown } | undefined)?.content, 'content');
    const conversation = await ownConversation(pool, res, req.params.id);

    // History is read before saving the new question; buildHistory() appends it as the last user turn.
    const prior = await recentMessages(pool, conversation.id, HISTORY_LIMIT);
    await addMessage(pool, conversation.id, { role: 'user', content });

    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // tell proxies not to hold the stream back
    });
    res.flushHeaders();

    // The visitor closed the tab or lost connection: stop paying for Gemini tokens nobody will read.
    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });

    let answer = '';
    try {
      const data = await portfolio.get();
      if (!data) throw new Error('portfolio is not seeded: run `npm run seed -w @vq/api`');

      const stream = chatModel.stream({
        systemInstruction: buildSystemInstruction(data),
        history: buildHistory(prior, content),
        signal: abort.signal,
      });
      for await (const text of stream) {
        answer += text;
        sendEvent(res, { type: 'token', text });
      }
      if (!answer.trim()) throw new Error('Gemini returned an empty answer');

      const citedMembers = detectCitations(answer, data.members);
      const saved = await addMessage(pool, conversation.id, { role: 'model', content: answer, citedMembers });
      sendEvent(res, { type: 'done', messageId: saved.id, citedMembers });
    } catch (e) {
      if (abort.signal.aborted) {
        // Nobody is listening any more; keep what they already saw so the conversation reads the same on reload.
        if (answer.trim()) {
          const data = await portfolio.get().catch(() => null);
          await addMessage(pool, conversation.id, {
            role: 'model', content: answer, citedMembers: data ? detectCitations(answer, data.members) : [],
          }).catch((err: unknown) => console.error('saving a partial answer failed:', err));
        }
        return;
      }
      if (e instanceof AiRateLimitError) {
        sendEvent(res, errorEvent('RATE_LIMITED'));
      } else {
        console.error('chat failed:', e);
        sendEvent(res, errorEvent('AI_ERROR'));
      }
    } finally {
      res.end();
    }
  });

  return router;
}
