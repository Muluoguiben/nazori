import { test, expect } from './fixtures';

test.describe('Popup', () => {
  test('opens and displays default UI elements', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    // Header
    await expect(page.locator('h1')).toHaveText('Nazori');
    await expect(page.locator('.subtitle')).toHaveText('Translation Assistant');

    // Toggle switch should default to enabled
    const toggle = page.locator('.toggle input[type="checkbox"]');
    await expect(toggle).toBeChecked();

    // Target language selector should be present
    await expect(page.locator('#target-lang')).toBeVisible();

    // Domain selector should be present
    await expect(page.locator('#domain')).toBeVisible();

    // Stats bar
    await expect(page.locator('.stats-bar')).toBeVisible();
    await expect(page.locator('.stat-label').first()).toHaveText('Today');
    await expect(page.locator('.stat-label').last()).toHaveText('Terms');

    // Footer button
    await expect(page.locator('.popup-footer button')).toHaveText(
      'Open Settings & Term Manager',
    );

    await page.close();
  });

  test('can toggle extension on and off', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    const toggle = page.locator('.toggle input[type="checkbox"]');
    const body = page.locator('.popup-body');

    // Initially enabled
    await expect(toggle).toBeChecked();
    await expect(body).not.toHaveClass(/disabled/);

    // Disable — checkbox has width/height 0, use evaluate to toggle
    await page.evaluate(() => {
      const checkbox = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();
    });
    await expect(toggle).not.toBeChecked();
    await expect(body).toHaveClass(/disabled/);

    // Re-enable
    await page.evaluate(() => {
      const checkbox = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();
    });
    await expect(toggle).toBeChecked();
    await expect(body).not.toHaveClass(/disabled/);

    await page.close();
  });

  test('can change target language', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    const langSelect = page.locator('#target-lang');
    await langSelect.selectOption('ja');
    await expect(langSelect).toHaveValue('ja');

    // Verify it persisted — reload and check
    await page.reload();
    await expect(page.locator('#target-lang')).toHaveValue('ja');

    // Reset to English for other tests
    await page.locator('#target-lang').selectOption('en');
    await page.close();
  });

  test('can change domain', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    const domainSelect = page.locator('#domain');
    await domainSelect.selectOption('legal');
    await expect(domainSelect).toHaveValue('legal');

    // Verify persistence
    await page.reload();
    await expect(page.locator('#domain')).toHaveValue('legal');

    // Reset
    await page.locator('#domain').selectOption('general');
    await page.close();
  });

  test('shows correct term count from preset terms', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    // Preset terms: 25 legal + 25 medical + 25 tech = 75
    const termCount = page.locator('.stat-value').last();
    await expect(termCount).toHaveText('75');

    await page.close();
  });
});
