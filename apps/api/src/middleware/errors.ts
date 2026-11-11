import type { ApiErrorBody } from '@vq/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Throw this from a route to answer with a specific status and error code. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const body = (code: string, message: string): ApiErrorBody => ({ error: { code, message } });

/** Any /api path that no router handled. */
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json(body('NOT_FOUND', `ไม่พบ ${req.method} ${req.originalUrl}`));
};

/** Turns every error into the same JSON shape (ApiErrorBody) so the web app has one format to read. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err); // a streamed response already started; let Express close it
  if (err instanceof HttpError) {
    res.status(err.status).json(body(err.code, err.message));
    return;
  }
  const type = (err as { type?: string }).type;
  if (type === 'entity.parse.failed') {
    res.status(400).json(body('BAD_JSON', 'รูปแบบ JSON ไม่ถูกต้อง'));
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json(body('TOO_LARGE', 'ข้อมูลที่ส่งมาใหญ่เกินไป'));
    return;
  }
  console.error(err);
  res.status(500).json(body('INTERNAL', 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'));
};
