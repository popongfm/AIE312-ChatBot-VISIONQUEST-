import type { RequestHandler, Response } from 'express';
import { HttpError } from './errors';

/** The web app makes a random id once, keeps it in localStorage, and sends it on every chat request. */
const CLIENT_ID = /^[A-Za-z0-9-]{8,64}$/;

/** Requires the X-Client-Id header, so each visitor only ever sees their own conversations (no login needed). */
export const requireClientId: RequestHandler = (req, res, next) => {
  const id = req.get('X-Client-Id');
  if (!id || !CLIENT_ID.test(id)) {
    throw new HttpError(400, 'BAD_CLIENT_ID', 'ต้องส่ง header X-Client-Id (ตัวอักษร a-z A-Z 0-9 และ - ยาว 8–64 ตัว)');
  }
  res.locals.clientId = id;
  next();
};

/** The visitor id set by requireClientId. */
export const clientIdOf = (res: Response): string => res.locals.clientId as string;
