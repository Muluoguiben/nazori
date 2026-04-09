import { test, expect } from './fixtures';

test.describe('Options Page', () => {
  test.describe('Tab Navigation', () => {
    test('displays three tabs and defaults to Terms', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      const tabs = page.locator('.tab-btn');
      await expect(tabs).toHaveCount(3);
      await expect(tabs.nth(0)).toHaveText('Terms');
      await expect(tabs.nth(1)).toHaveText('History');
      await expect(tabs.nth(2)).toHaveText('Settings');

      // Terms tab is active by default
      await expect(tabs.nth(0)).toHaveClass(/active/);

      await page.close();
    });

    test('can switch between tabs', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      // Switch to History — shows toolbar with search
      await page.locator('.tab-btn', { hasText: 'History' }).click();
      await expect(page.locator('.search-input[placeholder="Search history..."]')).toBeVisible();

      // Switch to Settings — shows card with "Settings" heading
      await page.locator('.tab-btn', { hasText: 'Settings' }).click();
      await expect(page.locator('.card h2', { hasText: 'Settings' })).toBeVisible();

      // Switch back to Terms — shows domain tabs
      await page.locator('.tab-btn', { hasText: 'Terms' }).click();
      await expect(page.locator('.domain-tabs')).toBeVisible();

      await page.close();
    });
  });

  test.describe('Term Manager', () => {
    test('displays domain tabs for all 4 domains', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await expect(page.locator('.domain-tab')).toHaveCount(4);
      await expect(page.locator('.domain-tab', { hasText: 'General' })).toBeVisible();
      await expect(page.locator('.domain-tab', { hasText: 'Legal' })).toBeVisible();
      await expect(page.locator('.domain-tab', { hasText: 'Medical' })).toBeVisible();
      await expect(page.locator('.domain-tab', { hasText: 'Technology' })).toBeVisible();

      await page.close();
    });

    test('displays preset terms when switching to legal domain', async ({
      context,
      extensionId,
    }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      // Switch to Legal domain
      await page.locator('.domain-tab', { hasText: 'Legal' }).click();

      // Should display the terms table with preset terms
      await expect(page.locator('.terms-table')).toBeVisible({ timeout: 5000 });
      // Should have 25 rows (preset legal terms)
      await expect(page.locator('.terms-table tbody tr')).toHaveCount(25, { timeout: 5000 });

      await page.close();
    });

    test('can search terms', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      // Switch to legal domain which has preset terms
      await page.locator('.domain-tab', { hasText: 'Legal' }).click();
      await expect(page.locator('.terms-table')).toBeVisible({ timeout: 5000 });

      // Search for a specific term
      await page.locator('.search-input[placeholder="Search terms..."]').fill('jurisdiction');

      // Should filter to matching terms
      const rows = page.locator('.terms-table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(25); // Filtered down from all 25

      await page.close();
    });

    test('shows add term form with language inputs', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      // Click Add Term button
      await page.locator('.btn-primary', { hasText: '+ Add Term' }).click();

      // Add form should appear with language inputs
      await expect(page.locator('.translations-grid')).toBeVisible();

      // Should have inputs for all 12 languages
      await expect(page.locator('.translations-grid .form-group')).toHaveCount(12);

      // Cancel to close
      await page.locator('.btn-secondary', { hasText: 'Cancel' }).click();
      await expect(page.locator('.translations-grid')).not.toBeVisible();

      await page.close();
    });

    test('can export terms as JSON', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      // Switch to legal domain
      await page.locator('.domain-tab', { hasText: 'Legal' }).click();
      await expect(page.locator('.terms-table')).toBeVisible({ timeout: 5000 });

      // Click export button - intercept the download
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.btn-secondary', { hasText: 'Export' }).click();
      const download = await downloadPromise;

      // Verify filename pattern
      expect(download.suggestedFilename()).toMatch(/nazori-terms-legal\.json/);

      await page.close();
    });
  });

  test.describe('History Tab', () => {
    test('shows empty state initially', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await page.locator('.tab-btn', { hasText: 'History' }).click();

      // Should show search input and empty state
      await expect(
        page.locator('.search-input[placeholder="Search history..."]'),
      ).toBeVisible();
      await expect(page.locator('.history-empty')).toHaveText(
        'No translation history yet.',
      );

      await page.close();
    });

    test('clear history button is disabled when empty', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await page.locator('.tab-btn', { hasText: 'History' }).click();

      const clearBtn = page.locator('.btn-danger', { hasText: 'Clear History' });
      await expect(clearBtn).toBeDisabled();

      await page.close();
    });
  });

  test.describe('Settings Tab', () => {
    test('displays all settings options', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await page.locator('.tab-btn', { hasText: 'Settings' }).click();

      // Theme selector
      await expect(page.locator('#opt-theme')).toBeVisible();

      // Font size selector
      await expect(page.locator('#opt-font')).toBeVisible();

      // Trigger mode selector
      await expect(page.locator('#opt-trigger')).toBeVisible();

      // Default target language selector
      await expect(page.locator('#opt-lang')).toBeVisible();

      // Toggle switches
      await expect(page.locator('text=Term Highlighting')).toBeVisible();
      await expect(page.locator('text=Extension Enabled')).toBeVisible();

      await page.close();
    });

    test('can change theme to dark mode', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await page.locator('.tab-btn', { hasText: 'Settings' }).click();

      // Change theme to dark
      await page.locator('#opt-theme').selectOption('dark');

      // Body should have dark theme class
      await expect(page.locator('body')).toHaveClass(/theme-dark/);

      // Reset to system
      await page.locator('#opt-theme').selectOption('system');

      await page.close();
    });

    test('settings changes persist across reloads', async ({ context, extensionId }) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options/index.html`);

      await page.locator('.tab-btn', { hasText: 'Settings' }).click();

      // Change default target language to Chinese
      await page.locator('#opt-lang').selectOption('zh');

      // Reload and verify
      await page.reload();
      await page.locator('.tab-btn', { hasText: 'Settings' }).click();
      await expect(page.locator('#opt-lang')).toHaveValue('zh');

      // Reset
      await page.locator('#opt-lang').selectOption('en');

      await page.close();
    });
  });
});
