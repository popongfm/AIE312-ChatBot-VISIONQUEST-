import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type pg from 'pg';
import type { Portfolio } from '@vq/shared';
import type { Config } from './config';
import { errorHandler, notFound } from './middleware/errors';
import { conversationsRouter } from './routes/conversations';
import { healthRouter } from './routes/health';
import { portfolioRouter } from './routes/portfolio';
import type { ChatModel } from './services/gemini';

export interface AppDeps {
  pool: pg.Pool;
  model: ChatModel;
  config: Config;
  portfolio: { get(): Promise<Portfolio | null> };
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: [deps.config.webOrigin, 'http://localhost:5173'] }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', healthRouter(deps.config), portfolioRouter(deps), conversationsRouter(deps));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
