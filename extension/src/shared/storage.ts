import { nanoid } from 'nanoid';
import { DEFAULT_SETTINGS } from './constants';
import type { Settings, StorageSchema } from './types';

/**
 * Type-safe getter for chrome.storage.local.
 */
export async function getStorage<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K] | undefined> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Storage read error'));
          return;
        }
        resolve(result[key] as StorageSchema[K] | undefined);
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Type-safe setter for chrome.storage.local.
 */
export async function setStorage<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Storage write error'));
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Get settings, merging stored values with defaults so newly added
 * settings fields always have a value.
 */
export async function getSettings(): Promise<Settings> {
  const stored = await getStorage('settings');
  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }
  // Merge: defaults first, then stored values override
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Partially update settings. Returns the full merged settings object.
 */
export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = { ...current, ...partial };
  await setStorage('settings', updated);
  return updated;
}

/**
 * Get or create a persistent device ID.
 * Generates a nanoid on first call and persists it in storage.
 */
export async function getDeviceId(): Promise<string> {
  const existing = await getStorage('device_id');
  if (existing) {
    return existing;
  }
  const id = nanoid();
  await setStorage('device_id', id);
  return id;
}

/**
 * Remove one or more keys from chrome.storage.local.
 */
export async function removeStorage(keys: (keyof StorageSchema)[] | keyof StorageSchema): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys as string | string[], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Storage remove error'));
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Get the total bytes in use by storage (useful for quota warnings).
 */
export async function getStorageBytesInUse(): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Storage bytes query error'));
          return;
        }
        resolve(bytes);
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
