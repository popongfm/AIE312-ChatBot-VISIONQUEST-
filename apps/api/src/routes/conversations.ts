import { Router } from 'express';
import type { AppDeps } from '../app';
import { requireClientId } from '../middleware/clientId';
import { HttpError } from '../middleware/errors';
import { createConversation, getOwnedConversation, listConversations, listMessages } from '../services/chatRepo';

export function conversationsRouter(deps: Pick<AppDeps, 'pool'>): Router {
  const r = Router();
  r.use('/conversations', requireClientId);

  r.post('/conversations', async (_req, res) => {
    res.status(201).json(await createConversation(deps.pool, res.locals.clientId as string));
  });

  r.get('/conversations', async (_req, res) => {
    res.json(await listConversations(deps.pool, res.locals.clientId as string));
  });

  r.get('/conversations/:id/messages', async (req, res) => {
    const conv = await getOwnedConversation(deps.pool, req.params.id, res.locals.clientId as string);
    if (!conv) throw new HttpError(404, 'NOT_FOUND', 'Conversation not found');
    res.json(await listMessages(deps.pool, conv.id));
  });

  return r;
}
