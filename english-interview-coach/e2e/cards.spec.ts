import { test, expect } from '@playwright/test';

test.describe('cards (flashcards) page', () => {
  test('opens face-down on the first card of Week 1', async ({ page }) => {
    await page.goto('/cards');
    await expect(page.getByLabel('Week')).toHaveValue('0');
    await expect(page.getByText('1 / 65')).toBeVisible();
    await expect(page.getByText(/Week 1 · #1/)).toBeVisible();
    await expect(page.getByText(/Tap, press space, or click to reveal/)).toBeVisible();
  });

  test('clicking the card flips it to show the explanation', async ({ page }) => {
    await page.goto('/cards');
    const card = page.getByRole('button', { name: /^Show explanation$/ });
    await card.click();
    await expect(page.getByRole('button', { name: /^Hide explanation$/ })).toBeVisible();
    await expect(page.getByText(/Tap, press space, or click to reveal/)).toHaveCount(0);
  });

  test('Next advances the counter and resets the flip', async ({ page }) => {
    await page.goto('/cards');
    await page.getByRole('button', { name: /^Show explanation$/ }).click();
    await page.getByRole('button', { name: 'Next card' }).click();
    await expect(page.getByText('2 / 65')).toBeVisible();
    await expect(page.getByText(/Week 1 · #2/)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Show explanation$/ })).toBeVisible();
  });

  test('Prev from card 1 wraps to the last card', async ({ page }) => {
    await page.goto('/cards');
    await page.getByRole('button', { name: 'Previous card' }).click();
    await expect(page.getByText('65 / 65')).toBeVisible();
  });

  test('Week selector switches week and resets to card 1', async ({ page }) => {
    await page.goto('/cards');
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next card' }).click();
    }
    await expect(page.getByText('5 / 65')).toBeVisible();
    await page.getByLabel('Week').selectOption('1');
    await expect(page.getByText('1 / 65')).toBeVisible();
    await expect(page.getByText(/Week 2 · #1/)).toBeVisible();
  });

  test('Home link returns to the landing page', async ({ page }) => {
    await page.goto('/cards');
    await page.getByRole('link', { name: /Home/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
