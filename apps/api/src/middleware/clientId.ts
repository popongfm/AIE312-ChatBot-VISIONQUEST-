import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from './errors';

const clientIdSchema = z.string().uuid();

/** Reads ONLY the X-Client-Id header; never query or body. */
export const requireClientId: RequestHandler = (req, res, next) => {
  const parsed = clientIdSchema.safeParse(req.get('X-Client-Id'));
  if (!parsed.success) throw new HttpError(400, 'BAD_CLIENT_ID', 'X-Client-Id header must be a UUID');
  res.locals.clientId = parsed.data;
  next();
};
