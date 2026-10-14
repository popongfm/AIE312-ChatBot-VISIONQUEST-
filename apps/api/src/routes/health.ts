import { Router } from 'express';
import type { Config } from '../config';

export function healthRouter(config: Config): Router {
  const r = Router();
  r.get('/health', (_req, res) => {
    res.json({ ok: true, version: config.version });
  });
  return r;
}
