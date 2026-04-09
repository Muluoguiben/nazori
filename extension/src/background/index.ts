import { nanoid } from 'nanoid';
import type {
  Domain,
  Message,
  Settings,
  StorageSchema,
  Term,
  TranslateRequest,
} from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { PRESET_TERMS } from '../shared/presetTerms';
import {
  getTerms,
  addTerm,
  updateTerm,
  deleteTerm,
  importTerms,
  exportTerms,
} from './terms';
import { translateStream, translationCache } from './translator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Installation & Migrations
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initializeDefaults();
  }

  // Always run migrations (covers both install and update)
  await runMigrations();

  // Create context menu
  chrome.contextMenus.create({
    id: 'nazori-translate',
    title: 'Translate with Nazori',
    contexts: ['selection'],
  });
});

/**
 * Set up default storage values on first install.
 */
async function initializeDefaults(): Promise<void> {
  const deviceId = nanoid();

  const defaults: Partial<StorageSchema> = {
    settings: DEFAULT_SETTINGS,
    device_id: deviceId,
    history: [],
    schema_version: CURRENT_SCHEMA_VERSION,
  };

  await chrome.storage.local.set(defaults);

  // Load preset terms for each domain
  for (const [key, terms] of Object.entries(PRESET_TERMS)) {
    if (terms.length > 0) {
      await chrome.storage.local.set({ [key]: terms });
    }
  }
}

/**
 * Run sequential schema migrations based on the stored schema_version.
 */
async function runMigrations(): Promise<void> {
  const result = await chrome.storage.local.get('schema_version');
  let version = (result.schema_version as number | undefined) ?? 0;

  if (version < 1) {
    // Migration 0 -> 1: ensure all expected keys exist
    const existing = await chrome.storage.local.get([
      'settings',
      'device_id',
      'history',
      'terms:general',
      'terms:legal',
      'terms:medical',
      'terms:tech',
    ]);

    const patch: Record<string, unknown> = {};
    if (!existing.settings) patch.settings = DEFAULT_SETTINGS;
    if (!existing.device_id) patch.device_id = nanoid();
    if (!existing.history) patch.history = [];
    for (const domain of ['general', 'legal', 'medical', 'tech'] as const) {
      const key = `terms:${domain}`;
      if (!existing[key]) patch[key] = PRESET_TERMS[key] ?? [];
    }

    if (Object.keys(patch).length > 0) {
      await chrome.storage.local.set(patch);
    }

    version = 1;
  }

  // Future migrations go here:
  // if (version < 2) { ... version = 2; }

  await chrome.storage.local.set({ schema_version: version });
}

// ---------------------------------------------------------------------------
// Streaming translation port
// ---------------------------------------------------------------------------

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'translate-stream') return;

  let abortCleanup: (() => void) | null = null;

  port.onMessage.addListener((msg: Message<TranslateRequest>) => {
    if (msg.type !== 'TRANSLATE_REQUEST') return;

    // translateStream is async but we don't await it here; it manages its own
    // lifecycle and posts messages back through the port.
    translateStream(port, msg.payload, msg.requestId);
  });

  port.onDisconnect.addListener(() => {
    // Port disconnection is handled inside translateStream via its own
    // onDisconnect listener. Nothing extra needed here, but we clean up
    // our reference.
    abortCleanup?.();
    abortCleanup = null;
  });
});

// ---------------------------------------------------------------------------
// Non-streaming message handler
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ): boolean => {
    // All handlers are async, so we always return true to keep the channel open.
    handleMessage(message, sendResponse);
    return true;
  },
);

async function handleMessage(
  message: Message,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    switch (message.type) {
      // ----- Terms ---------------------------------------------------------
      case 'TERMS_GET': {
        const { domain } = message.payload as { domain: Domain };
        const terms = await getTerms(domain);
        sendResponse({ success: true, data: terms });
        break;
      }
      case 'TERMS_ADD': {
        const termData = message.payload as Omit<Term, 'id' | 'createdAt' | 'updatedAt'>;
        const newTerm = await addTerm(termData);
        sendResponse({ success: true, data: newTerm });
        break;
      }
      case 'TERMS_UPDATE': {
        const { id, updates } = message.payload as {
          id: string;
          updates: Partial<Term>;
        };
        const updated = await updateTerm(id, updates);
        sendResponse({ success: true, data: updated });
        break;
      }
      case 'TERMS_DELETE': {
        const { domain, id } = message.payload as { domain: Domain; id: string };
        await deleteTerm(domain, id);
        sendResponse({ success: true });
        break;
      }
      case 'TERMS_IMPORT': {
        const { domain, terms } = message.payload as {
          domain: Domain;
          terms: Term[];
        };
        await importTerms(domain, terms);
        sendResponse({ success: true });
        break;
      }
      case 'TERMS_EXPORT': {
        const { domain } = message.payload as { domain: Domain };
        const exported = await exportTerms(domain);
        sendResponse({ success: true, data: exported });
        break;
      }

      // ----- Settings ------------------------------------------------------
      case 'SETTINGS_GET': {
        const result = await chrome.storage.local.get('settings');
        sendResponse({ success: true, data: result.settings ?? DEFAULT_SETTINGS });
        break;
      }
      case 'SETTINGS_UPDATE': {
        const updates = message.payload as Partial<Settings>;
        const current = await chrome.storage.local.get('settings');
        const merged: Settings = {
          ...(current.settings as Settings ?? DEFAULT_SETTINGS),
          ...updates,
        };
        await chrome.storage.local.set({ settings: merged });
        sendResponse({ success: true, data: merged });
        break;
      }

      // ----- Cache ---------------------------------------------------------
      case 'CACHE_CLEAR': {
        translationCache.clear();
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}

// ---------------------------------------------------------------------------
// Keyboard shortcut (Alt+T toggle)
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-translation') return;

  const result = await chrome.storage.local.get('settings');
  const settings = (result.settings as Settings) ?? DEFAULT_SETTINGS;
  const updated: Settings = { ...settings, enabled: !settings.enabled };
  await chrome.storage.local.set({ settings: updated });
});

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'nazori-translate') return;
  if (!info.selectionText || !tab?.id) return;

  // Send the selected text to the content script to open the translation popup
  chrome.tabs.sendMessage(tab.id, {
    type: 'TRANSLATE_REQUEST',
    payload: { text: info.selectionText },
    requestId: nanoid(),
    timestamp: Date.now(),
  } satisfies Message);
});
