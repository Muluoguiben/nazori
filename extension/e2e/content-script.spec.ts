import { test, expect } from './fixtures';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, type Server } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Content scripts only inject on http/https URLs (per manifest <all_urls>).
 * We spin up a tiny local HTTP server to serve test pages.
 */
let server: Server;
let baseURL: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Test Page</title></head>
      <body>
        <p id="source" style="padding: 50px; font-size: 18px; line-height: 2; user-select: text;">
          This is a test paragraph for translation testing purposes.
        </p>
        <div id="outside" style="padding: 50px; margin-top: 300px;">
          Click here to close the bubble.
        </div>
        <p id="whitespace" style="padding: 50px;">&nbsp;   &nbsp;</p>
      </body>
      </html>
    `);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseURL = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

test.afterAll(async () => {
  server?.close();
});

/** Select text inside an element using mouse drag */
async function selectText(page: import('@playwright/test').Page, selector: string) {
  const el = page.locator(selector);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Could not find bounding box for ${selector}`);

  // Use triple-click to select all text in the paragraph — most reliable
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { clickCount: 3 });
}

test.describe('Content Script', () => {
  test.describe('Bubble UI', () => {
    test('shows translation bubble on text selection', async ({ context }) => {
      const page = await context.newPage();
      await page.goto(baseURL);

      // Wait for content script to initialize
      await page.waitForTimeout(1000);

      // Select text
      await selectText(page, '#source');

      // Wait for the bubble shadow host to appear
      const host = page.locator('#nazori-translation-host');
      await expect(host).toBeAttached({ timeout: 5000 });

      await page.close();
    });

    test('bubble closes on Escape key', async ({ context }) => {
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.waitForTimeout(1000);

      // Select text to trigger bubble
      await selectText(page, '#source');

      const host = page.locator('#nazori-translation-host');
      await expect(host).toBeAttached({ timeout: 5000 });

      // Press Escape
      await page.keyboard.press('Escape');

      // Bubble should be removed
      await expect(host).not.toBeAttached({ timeout: 3000 });

      await page.close();
    });

    test('bubble closes on click outside', async ({ context }) => {
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.waitForTimeout(1000);

      // Select text
      await selectText(page, '#source');

      const host = page.locator('#nazori-translation-host');
      await expect(host).toBeAttached({ timeout: 5000 });

      // Click outside the bubble
      await page.locator('#outside').click();

      await expect(host).not.toBeAttached({ timeout: 3000 });

      await page.close();
    });

    test('does not show bubble when extension is disabled', async ({
      context,
      extensionId,
    }) => {
      // Disable extension via popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
      // Wait for React to render the toggle
      await popupPage.waitForSelector('.toggle input[type="checkbox"]', { state: 'attached' });
      await popupPage.evaluate(() => {
        const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
        cb.click();
      });
      await popupPage.waitForTimeout(300);
      await popupPage.close();

      // Open a content page and try selecting text
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.waitForTimeout(1000);

      await selectText(page, '#source');

      // Wait a bit and verify no bubble appeared
      await page.waitForTimeout(1000);
      const host = page.locator('#nazori-translation-host');
      await expect(host).toHaveCount(0);

      // Re-enable for other tests
      const reEnablePage = await context.newPage();
      await reEnablePage.goto(`chrome-extension://${extensionId}/popup/index.html`);
      await reEnablePage.waitForSelector('.toggle input[type="checkbox"]', { state: 'attached' });
      await reEnablePage.evaluate(() => {
        const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
        cb.click();
      });
      await reEnablePage.waitForTimeout(300);
      await reEnablePage.close();

      await page.close();
    });

    test('does not show bubble for empty/whitespace selections', async ({ context }) => {
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.waitForTimeout(1000);

      // Try to select whitespace
      await selectText(page, '#whitespace');

      await page.waitForTimeout(800);
      const host = page.locator('#nazori-translation-host');
      await expect(host).toHaveCount(0);

      await page.close();
    });
  });

  test.describe('Shadow DOM Isolation', () => {
    test('bubble renders inside shadow DOM with mount point', async ({ context }) => {
      const page = await context.newPage();
      await page.goto(baseURL);
      await page.waitForTimeout(1000);

      // Select text
      await selectText(page, '#source');

      const host = page.locator('#nazori-translation-host');
      await expect(host).toBeAttached({ timeout: 5000 });

      // Verify the host has a shadow root
      const hasShadowRoot = await host.evaluate((el) => !!el.shadowRoot);
      expect(hasShadowRoot).toBe(true);

      // Verify the mount point exists inside shadow DOM
      const hasMountPoint = await host.evaluate(
        (el) => !!el.shadowRoot?.getElementById('nazori-mount'),
      );
      expect(hasMountPoint).toBe(true);

      await page.close();
    });
  });
});
