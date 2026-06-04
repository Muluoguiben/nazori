import { test, expect } from '@playwright/test';

// Runs against the DEMO_MODE server (no DATABASE_URL), so /api/progress returns
// an empty done-list and sequential selection is deterministic from term 1.

test.describe('practice range selector', () => {
  test('defaults to in-order from the first curriculum term', async ({ page }) => {
    await page.goto('/rep');
    await expect(page.locator('h1').first()).toHaveText('type annotation');
    await expect(page.getByText('0/390', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'In order' })).toBeVisible();
  });

  test('filtering to a whole week serves that week and updates progress', async ({ page }) => {
    await page.goto('/rep');
    await page.getByLabel('Practice range').selectOption('w:2');
    await expect(page.locator('h1').first()).toHaveText('component');
    await expect(page.getByText('0/65', { exact: true })).toBeVisible();
  });

  test('filtering to a single tag scopes the pool', async ({ page }) => {
    await page.goto('/rep');
    await page.getByLabel('Practice range').selectOption('t:hooks');
    await expect(page.locator('h1').first()).toHaveText('useState');
    await expect(page.getByText('0/14', { exact: true })).toBeVisible();
  });

  test('shuffle toggle flips the order mode', async ({ page }) => {
    await page.goto('/rep');
    const toggle = page.getByRole('button', { name: 'In order' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Shuffle' })).toBeVisible();
  });
});
