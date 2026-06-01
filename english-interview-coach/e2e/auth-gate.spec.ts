import { test, expect } from '@playwright/test';

// Runs against the second server (port 3100) started with APP_SECRET set, so
// the shared-secret gate is enforced. This is the reproducible artifact for the
// security boundary (previously only checked manually via curl).
test.describe('auth gate (APP_SECRET set)', () => {
  test('unauthenticated page request redirects to /login', async ({ page }) => {
    await page.goto('/rep');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel('Access secret')).toBeVisible();
  });

  test('unauthenticated API request returns 401', async ({ request }) => {
    const res = await request.get('/api/stats');
    expect(res.status()).toBe(401);
  });

  test('wrong secret is rejected; correct secret unlocks the app', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Access secret').fill('wrong-secret');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/did not match/i)).toBeVisible();

    await page.getByLabel('Access secret').fill('playwright-secret');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('http://localhost:3100/');

    // Authenticated: the cookie is now sent, so a gated API returns 200.
    const res = await page.request.get('/api/stats');
    expect(res.status()).toBe(200);
  });

  test('public /intro.html is reachable without auth even when the gate is on', async ({ request }) => {
    const res = await request.get('/intro.html');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('English Interview Coach');
  });
});
