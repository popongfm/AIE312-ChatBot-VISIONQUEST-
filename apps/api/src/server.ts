// `npm run dev -w @vq/api` (or `npm start` / the Docker image) — starts the API on PORT (default 3000).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app';
import { type Config, loadConfig } from './config';
import { createPool } from './db/pool';
import { AiError, type ChatModel, createGeminiModel, genaiGenerate } from './services/gemini';

try {
  process.loadEnvFile(); // apps/api/.env when running locally
} catch {
  // No .env file: Render provides real environment variables instead.
}

/** Real Gemini when configured; otherwise every chat answers with AI_ERROR, and /health and /portfolio still work. */
function chatModelFrom(config: Config): ChatModel {
  if (config.geminiApiKey && config.geminiModel) {
    return createGeminiModel({
      model: config.geminiModel,
      fallbackModel: config.geminiFallbackModel,
      generate: genaiGenerate(config.geminiApiKey),
    });
  }
  console.warn('GEMINI_API_KEY or GEMINI_MODEL is not set: chat is disabled');
  const fail = () => Promise.reject(new AiError('Gemini is not configured'));
  return { stream: () => ({ [Symbol.asyncIterator]: () => ({ next: fail }) }) };
}

/** WEB_DIR is only used when it holds a built web app; until the web app is built (Task 10) the image serves the API alone. */
function webDirFrom(config: Config): string | null {
  if (!config.webDir) return null;
  if (existsSync(join(config.webDir, 'index.html'))) return config.webDir;
  console.warn(`WEB_DIR ${config.webDir} has no index.html: serving the API only`);
  return null;
}

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const app = createApp({ pool, chatModel: chatModelFrom(config), webDir: webDirFrom(config), version: config.version });

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

// Render sends SIGTERM before replacing the instance: finish open requests, then close database connections.
const shutdown = () => server.close(() => void pool.end());
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
