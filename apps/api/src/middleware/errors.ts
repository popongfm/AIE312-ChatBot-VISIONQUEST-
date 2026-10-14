import type { ErrorRequestHandler, RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const send = (res: Parameters<ErrorRequestHandler>[2], status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

export const notFound: RequestHandler = (_req, res) => {
  send(res, 404, 'NOT_FOUND', 'Route not found');
};

// Express identifies error handlers by their 4-argument arity.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return send(res, err.status, err.code, err.message);
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') return send(res, 400, 'BAD_JSON', 'Request body is not valid JSON');
  if (type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  const e = err as { status?: unknown; statusCode?: unknown } | null;
  const status = typeof e?.status === 'number' ? e.status : e?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) return send(res, status, 'BAD_REQUEST', 'Bad request');
  console.error('unhandled error', err);
  return send(res, 500, 'INTERNAL', 'Internal server error');
};
