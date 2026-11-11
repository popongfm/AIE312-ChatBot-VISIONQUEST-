// `npm run seed -w @vq/api` — validates <repo>/seed and loads it into DATABASE_URL (run migrate first).
import { loadConfig } from '../config';
import { createPool } from './pool';
import { applySeed, readSeed } from './seed';

try {
  process.loadEnvFile(); // apps/api/.env when running locally
} catch {
  // No .env file: CI and Render provide real environment variables instead.
}

const data = await readSeed(); // fails here, before connecting, if a seed file is wrong
const pool = createPool(loadConfig().databaseUrl);
try {
  await applySeed(pool, data);
  console.log(`seeded team "${data.team.name}", ${data.members.length} members: ${data.members.map((m) => m.slug).join(', ')}`);
} finally {
  await pool.end();
}
