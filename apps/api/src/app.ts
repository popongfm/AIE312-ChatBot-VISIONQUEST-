import { join } from 'node:path';
import express from 'express';
import type { Pool } from 'pg';
import { errorHandler, notFound } from './middleware/errors';
import { conversationsRouter } from './routes/conversations';
import { healthRouter } from './routes/health';
import { portfolioRouter } from './routes/portfolio';
import type { ChatModel } from './services/gemini';

/** Everything the app talks to from outside. Tests pass a test database and a fake ChatModel. */
export interface AppDeps {
  pool: Pool;
  chatModel: ChatModel;
  /** Built web app to serve on every non-/api path (production). Leave out to serve the API only. */
  webDir?: string | null;
  /** Deployed git commit, reported by /api/health. */
  version?: string | null;
}

/** Builds the Express app without starting it, so tests can call it directly. server.ts starts it. */
export function createApp(deps: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  // Render (and Cloudflare in front of it) is one proxy hop away: use the visitor's IP for the per-IP rate limit.
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.use('/api', healthRouter(deps));
  app.use('/api', portfolioRouter(deps));
  app.use('/api/conversations', conversationsRouter(deps));

  app.use('/api', notFound);

  if (deps.webDir) {
    const webDir = deps.webDir;
    app.use(express.static(webDir, { index: 'index.html' }));
    // The web app has its own routes (/portfolio, /chat/:id): any other page URL gets index.html and React takes over.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(join(webDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
