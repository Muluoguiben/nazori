import { test, expect } from '@playwright/test';

// The E2E server runs without APP_SECRET, so the auth gate is disabled here.
// This verifies the login page renders and its submit/redirect plumbing works.
// The real gate (unauthed redirect + 401) is verified via a curl pass with
// APP_SECRET set (see the step 5 commit notes).
test.describe('login', () => {
  test('renders the access form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Access secret')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test('submitting returns to the app when auth is disabled', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Access secret').fill('anything');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(
      page.getByText('Explain one concept out loud. 90 seconds. Instant feedback.'),
    ).toBeVisible();
  });
});
