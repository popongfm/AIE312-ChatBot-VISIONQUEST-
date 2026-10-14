import { createApp } from './app';
import { loadConfig } from './config';
import { createPool } from './db/pool';
import type { ChatModel } from './services/gemini';
import { createPortfolioCache, getPortfolio } from './services/portfolioRepo';

const config = loadConfig(process.env);
const pool = createPool(config.databaseUrl);
// An idle Neon connection drop must not crash the process.
pool.on('error', (err) => console.error('pg pool error', err));

// Stub until Task 7 wires the real Gemini model.
const model: ChatModel = {
  // eslint-disable-next-line require-yield
  async *stream() {
    throw new Error('Gemini model not wired yet');
  },
};

const portfolio = createPortfolioCache(() => getPortfolio(pool));
const app = createApp({ pool, model, config, portfolio });

app.listen(config.port, () => {
  console.log(`VISIONQUEST API ${config.version} listening on :${config.port}`);
});
