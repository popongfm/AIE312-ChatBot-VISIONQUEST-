import type { ApiErrorBody } from '@vq/shared';
import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

const TOO_MANY: ApiErrorBody = {
  error: { code: 'TOO_MANY_REQUESTS', message: 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่' },
};

const common = {
  windowMs: 60_000,
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  handler: ((_req, res) => {
    res.status(429).json(TOO_MANY);
  }) as RequestHandler,
};

/**
 * Limits for sending chat messages (each one costs a Gemini call): 10 a minute per visitor
 * (X-Client-Id, already validated by requireClientId) and 60 a minute per IP address.
 * New instances on every call, so each app (and each test) starts with empty counters.
 */
export function createMessageLimiters(): RequestHandler[] {
  return [
    rateLimit({ ...common, limit: 10, keyGenerator: (req) => `client:${req.get('X-Client-Id')}` }),
    rateLimit({ ...common, limit: 60 }),
  ];
}
