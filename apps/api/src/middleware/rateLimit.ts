import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

const handler: RequestHandler = (_req, res) => {
  res.status(429).json({
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่",
    },
  });
};

/** Fresh limiter instances (own stores) per call, so each createApp is isolated. */
export function createMessageLimiters(): RequestHandler[] {
  return [
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      // requireClientId has already validated the header as a UUID (not an IP).
      keyGenerator: (req) => req.get("X-Client-Id")!,
      validate: { keyGeneratorIpFallback: false },
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler,
    }),
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler,
    }),
  ];
}
