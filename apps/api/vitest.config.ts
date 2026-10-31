import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds for Playwright tests
    hookTimeout: 30000,
  },
});
