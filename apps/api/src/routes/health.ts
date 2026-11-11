import express from 'express';
import type { AppDeps } from '../app';

/** GET /api/health — used by Render and the deploy smoke test to know the API and its database are up. */
export function healthRouter({ pool }: AppDeps) {
  const router = express.Router();
  router.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'ok' });
    } catch (e) {
      console.error('health: database unreachable:', (e as Error).message);
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });
  return router;
}
