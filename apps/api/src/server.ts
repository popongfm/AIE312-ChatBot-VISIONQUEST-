import { createApp } from './app';
import { loadConfig } from './config';
import { createPool } from './db/pool';
import { createGeminiModel, genaiGenerate } from './services/gemini';
import { createPortfolioCache, getPortfolio } from './services/portfolioRepo';

const config = loadConfig(process.env);
const pool = createPool(config.databaseUrl);
// An idle Neon connection drop must not crash the process.
pool.on('error', (err) => console.error('pg pool error', err));

const model = createGeminiModel({
  model: config.geminiModel,
  fallbackModel: config.geminiFallbackModel,
  generate: genaiGenerate(config.geminiApiKey),
});

const portfolio = createPortfolioCache(() => getPortfolio(pool));
const app = createApp({ pool, model, config, portfolio });

const server = app.listen(config.port, () => {
  console.log(`VISIONQUEST API ${config.version} listening on :${config.port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(() => {
    pool
      .end()
      .catch((err: unknown) => console.error('pool close failed', err))
      .finally(() => process.exit(0));
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
