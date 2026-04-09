import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXTENSION_PATH = path.resolve(__dirname, '..', 'dist');

/**
 * Custom Playwright fixtures that launch Chrome with the Nazori extension loaded.
 *
 * - `context`  — a persistent BrowserContext with the extension active
 * - `extensionId` — the runtime ID assigned to the loaded extension
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-search-engine-choice-screen',
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // In MV3, the service worker URL contains the extension ID.
    // Wait for the service worker to be registered.
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const url = serviceWorker.url();
    // URL format: chrome-extension://<id>/background/index.js
    const id = url.split('/')[2];
    await use(id);
  },
});

export const expect = test.expect;
