import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  workers: 1, // Chrome extension contexts can't run in parallel
  use: {
    headless: false, // Extensions require headed mode
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        // Chrome extension loading is handled per-test via fixtures
      },
    },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
});
