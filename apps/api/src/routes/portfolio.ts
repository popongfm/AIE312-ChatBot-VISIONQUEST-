import express from 'express';
import type { AppDeps } from '../app';
import { HttpError } from '../middleware/errors';
import { getPortfolio } from '../services/portfolioRepo';

/** GET /api/portfolio — the whole Portfolio (team, contacts, members, team projects) for the web page. */
export function portfolioRouter({ pool }: AppDeps) {
  const router = express.Router();
  router.get('/portfolio', async (_req, res) => {
    const portfolio = await getPortfolio(pool);
    if (!portfolio) {
      throw new HttpError(503, 'NOT_SEEDED', 'ยังไม่มีข้อมูล Portfolio ในฐานข้อมูล ต้องรัน npm run seed ก่อน');
    }
    res.json(portfolio);
  });
  return router;
}
