import { defineConfig, devices } from '@playwright/test';

const chromeArgs = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      // App tests against a server with auth disabled (DEMO_MODE, no APP_SECRET).
      name: 'chromium',
      testIgnore: '**/auth-gate.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        permissions: ['microphone'],
        launchOptions: { args: chromeArgs },
      },
    },
    {
      // Auth-gate tests against a second server with APP_SECRET set.
      name: 'auth',
      testMatch: '**/auth-gate.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3100',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: { DEMO_MODE: '1' },
    },
    {
      command: 'npm run start',
      url: 'http://localhost:3100',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: { DEMO_MODE: '1', APP_SECRET: 'playwright-secret', PORT: '3100' },
    },
  ],
});
