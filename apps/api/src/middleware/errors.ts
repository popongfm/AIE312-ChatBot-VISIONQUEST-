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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return send(res, err.status, err.code, err.message);
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') return send(res, 400, 'BAD_JSON', 'Request body is not valid JSON');
  if (type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  console.error('unhandled error', err);
  return send(res, 500, 'INTERNAL', 'Internal server error');
};
