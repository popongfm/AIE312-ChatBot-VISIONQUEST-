import { Router } from 'express';
import type { AppDeps } from '../app';
import { HttpError } from '../middleware/errors';

export function portfolioRouter(deps: Pick<AppDeps, 'portfolio'>): Router {
  const r = Router();
  r.get('/portfolio', async (_req, res) => {
    const portfolio = await deps.portfolio.get();
    if (!portfolio) throw new HttpError(503, 'NOT_SEEDED', 'Portfolio data has not been seeded yet');
    res.json(portfolio);
  });
  return r;
}
