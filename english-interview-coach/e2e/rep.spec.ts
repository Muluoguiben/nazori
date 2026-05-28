import { test, expect } from '@playwright/test';

// These run against the production server started with DEMO_MODE=1 (see
// playwright.config.ts), so /api/transcribe and /api/evaluate return canned
// data and no external API keys are needed. A fake media device is supplied
// via Chromium launch flags so MediaRecorder works headlessly.

test.describe('rep flow', () => {
  test('start session navigates to the rep screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /start session/i }).click();
    await expect(page).toHaveURL(/\/rep$/);
    await expect(page.getByRole('button', { name: /start recording/i })).toBeVisible();
  });

  test('records a rep and renders feedback', async ({ page }) => {
    await page.goto('/rep');

    const start = page.getByRole('button', { name: /start recording/i });
    await expect(start).toBeEnabled();
    await start.click();

    const stop = page.getByRole('button', { name: /stop/i });
    await expect(stop).toBeVisible();
    // Give MediaRecorder a moment so stop() isn't called on a just-started recorder.
    await page.waitForTimeout(600);
    await stop.click();

    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Accuracy')).toBeVisible();
    await expect(page.getByText('3 fixes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('next loads another prompt and returns to idle', async ({ page }) => {
    await page.goto('/rep');
    await page.getByRole('button', { name: /start recording/i }).click();
    const stop = page.getByRole('button', { name: /stop/i });
    await expect(stop).toBeVisible();
    await page.waitForTimeout(600);
    await stop.click();

    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: /start recording/i })).toBeVisible();
  });
});
