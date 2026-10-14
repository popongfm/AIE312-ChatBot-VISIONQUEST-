import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // DB tests share one database, so files must not run in parallel.
    fileParallelism: false,
  },
});
