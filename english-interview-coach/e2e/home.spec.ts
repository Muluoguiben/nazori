import { test, expect } from '@playwright/test';

test.describe('home screen', () => {
  test('renders the app title and tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/English Interview Coach/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'English Interview Coach' }),
    ).toBeVisible();
    await expect(
      page.getByText('Explain one concept out loud. 90 seconds. Instant feedback.'),
    ).toBeVisible();
  });

  test('links Start session to the rep screen', async ({ page }) => {
    await page.goto('/');
    const start = page.getByRole('link', { name: 'Start session' });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute('href', '/rep');
  });

  test('hides the iOS install hint on a desktop browser', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Add to Home Screen/)).toHaveCount(0);
  });
});

test.describe('iOS install hint', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  test('appears for iOS user agents that are not standalone', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Add to Home Screen/)).toBeVisible();
  });
});
