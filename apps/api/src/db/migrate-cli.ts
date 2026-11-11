// `npm run migrate -w @vq/api` — applies pending migrations to DATABASE_URL.
import { loadConfig } from '../config';
import { migrate } from './migrate';
import { createPool } from './pool';

try {
  process.loadEnvFile(); // apps/api/.env when running locally
} catch {
  // No .env file: CI and Render provide real environment variables instead.
}

const pool = createPool(loadConfig().databaseUrl);
try {
  const applied = await migrate(pool);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'database is up to date');
} finally {
  await pool.end();
}
