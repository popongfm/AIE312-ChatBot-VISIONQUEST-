import express from 'express';
import type { Pool } from 'pg';
import { errorHandler, notFound } from './middleware/errors';
import { healthRouter } from './routes/health';
import { portfolioRouter } from './routes/portfolio';
import type { ChatModel } from './services/gemini';

/** Everything the app talks to from outside. Tests pass a test database and a fake ChatModel. */
export interface AppDeps {
  pool: Pool;
  chatModel: ChatModel;
}

/** Builds the Express app without starting it, so tests can call it directly. server.ts starts it. */
export function createApp(deps: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.use('/api', healthRouter(deps));
  app.use('/api', portfolioRouter(deps));

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
