import { test, expect, type Page } from '@playwright/test';

// These run against the DEMO_MODE server (auth off), so /api/transcribe and
// /api/evaluate return canned data and no external keys are needed. A fake media
// device is supplied via Chromium launch flags so MediaRecorder works headlessly.

async function recordOnce(page: Page) {
  const start = page.getByRole('button', { name: /start recording/i });
  await expect(start).toBeEnabled();
  await start.click();
  const stop = page.getByRole('button', { name: /stop/i });
  await expect(stop).toBeVisible();
  // Deterministic cue that ~1s of audio was captured (countdown ticked 90 -> 89).
  await expect(page.getByText('89', { exact: true })).toBeVisible();
  await stop.click();
}

test.describe('rep flow', () => {
  test('start session navigates to the rep screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /start session/i }).click();
    await expect(page).toHaveURL(/\/rep$/);
    await expect(page.getByRole('button', { name: /start recording/i })).toBeVisible();
  });

  test('records a rep and renders the evaluation data', async ({ page }) => {
    await page.goto('/rep');
    await recordOnce(page);

    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Accuracy')).toBeVisible();
    // Data-driven, not static labels: the demo eval bolds "captures" and returns 3 fixes.
    await expect(page.locator('strong', { hasText: 'captures' })).toBeVisible();
    await expect(page.locator('li')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('next loads another prompt and returns to idle', async ({ page }) => {
    await page.goto('/rep');
    await recordOnce(page);
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: /start recording/i })).toBeVisible();
  });

  test('shows an error and recovers when evaluation fails', async ({ page }) => {
    await page.route('**/api/evaluate', (route) =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Evaluation failed. Please try again.' }),
      }),
    );
    await page.goto('/rep');
    await recordOnce(page);

    await expect(page.locator('p[role="alert"]')).toContainText(/failed/i, { timeout: 20000 });
    const retry = page.getByRole('button', { name: 'Retry' });
    await expect(retry).toBeVisible();

    // Stop failing; Retry re-uses the captured recording (no re-record) and reaches feedback.
    await page.unroute('**/api/evaluate');
    await retry.click();
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible({ timeout: 20000 });
  });
});
