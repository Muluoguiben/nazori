import { test, expect } from './fixtures';

test.describe('Extension Lifecycle', () => {
  test('service worker is active after extension loads', async ({ context, extensionId }) => {
    const serviceWorker = context.serviceWorkers()[0];
    expect(serviceWorker).toBeTruthy();
    expect(serviceWorker.url()).toContain(extensionId);
    expect(serviceWorker.url()).toContain('background/index.js');
  });

  test('extension storage is initialized with defaults', async ({ context, extensionId }) => {
    // Read storage via the popup page which has chrome.storage access
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    const storageData = await page.evaluate(async () => {
      const result = await chrome.storage.local.get([
        'settings',
        'device_id',
        'history',
        'schema_version',
        'terms:general',
        'terms:legal',
        'terms:medical',
        'terms:tech',
      ]);
      return result;
    });

    // Settings should have defaults
    expect(storageData.settings).toBeDefined();
    expect(storageData.settings.enabled).toBe(true);
    expect(storageData.settings.defaultTargetLang).toBe('en');
    expect(storageData.settings.defaultDomain).toBe('general');

    // Device ID should be generated
    expect(storageData.device_id).toBeTruthy();
    expect(typeof storageData.device_id).toBe('string');

    // Schema version should be set
    expect(storageData.schema_version).toBe(1);

    // History should be empty array
    expect(storageData.history).toEqual([]);

    // Preset terms should be loaded
    expect(storageData['terms:legal']).toHaveLength(25);
    expect(storageData['terms:medical']).toHaveLength(25);
    expect(storageData['terms:tech']).toHaveLength(25);

    await page.close();
  });

  test('toggle via popup persists to storage', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html`);

    // Disable via toggle (checkbox has 0 dimensions, use evaluate)
    await page.waitForSelector('.toggle input[type="checkbox"]', { state: 'attached' });
    await page.evaluate(() => {
      const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
      cb.click();
    });
    await page.waitForTimeout(300);

    // Read storage to verify
    const settings = await page.evaluate(async () => {
      const result = await chrome.storage.local.get('settings');
      return result.settings;
    });
    expect(settings.enabled).toBe(false);

    // Re-enable
    await page.evaluate(() => {
      const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement;
      cb.click();
    });
    await page.waitForTimeout(300);

    const settingsAfter = await page.evaluate(async () => {
      const result = await chrome.storage.local.get('settings');
      return result.settings;
    });
    expect(settingsAfter.enabled).toBe(true);

    await page.close();
  });

  test('settings changes in options page are reflected in popup', async ({
    context,
    extensionId,
  }) => {
    // Change language in options page
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options/index.html`);
    await optionsPage.locator('.tab-btn', { hasText: 'Settings' }).click();
    await optionsPage.locator('#opt-lang').selectOption('ja');
    await optionsPage.waitForTimeout(300);
    await optionsPage.close();

    // Verify in popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await expect(popupPage.locator('#target-lang')).toHaveValue('ja');

    // Reset
    await popupPage.locator('#target-lang').selectOption('en');
    await popupPage.close();
  });
});
