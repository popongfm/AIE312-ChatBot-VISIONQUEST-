import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile(); // apps/api/.env, for TEST_DATABASE_URL when running locally
} catch {
  // No .env file (CI): environment variables come from the workflow.
}

export default defineConfig({
  test: {
    // Database tests share one test database, so test files must not run at the same time.
    fileParallelism: false,
  },
});
