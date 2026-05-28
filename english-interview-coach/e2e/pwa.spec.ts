import { test, expect } from '@playwright/test';

test.describe('PWA installability', () => {
  test('links a web manifest in the document head', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    );
  });

  test('serves a valid standalone web manifest', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/manifest+json');

    const manifest = await res.json();
    expect(manifest.name).toBe('English Interview Coach');
    expect(manifest.short_name).toBe('Coach');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');

    const sizes: string[] = (manifest.icons ?? []).map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('exposes theme-color and apple web app meta tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a0a0a');
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
      'content',
      'English Interview Coach',
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      'content',
      'Coach',
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });

  test('serves the service worker with no-cache headers', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('javascript');
    expect(res.headers()['cache-control']).toContain('no-cache');
  });

  test('serves every manifest icon as a PNG', async ({ request }) => {
    const icons = ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-icon.png'];
    for (const path of icons) {
      const res = await request.get(path);
      expect(res.status(), `${path} status`).toBe(200);
      expect(res.headers()['content-type'], `${path} content-type`).toContain('image/png');
    }
  });

  test('registers an active service worker on the client', async ({ page }) => {
    await page.goto('/');
    const scope = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return null;
      const registration = await navigator.serviceWorker.ready;
      return registration.scope;
    });
    expect(scope).toContain('localhost:3000');
  });
});
