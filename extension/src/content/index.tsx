import { createRoot, type Root } from 'react-dom/client';
import { createShadowHost, removeShadowHost } from './shadow';
import { getSelectionInfo, type SelectionInfo } from './SelectionHandler';
import Bubble from './Bubble';
import { DEBOUNCE_MS, DEFAULT_SETTINGS } from '@shared/constants';
import type { Settings } from '@shared/types';

// ---------- State ----------
let host: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let currentSelection: SelectionInfo | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let triggerMode: Settings['triggerMode'] = DEFAULT_SETTINGS.triggerMode;

// ---------- Helpers ----------

/** Ensure the shadow host exists and return the React mount node. */
function ensureHost(): HTMLElement {
  if (!host || !shadowRoot || !document.body.contains(host)) {
    const result = createShadowHost();
    host = result.host;
    shadowRoot = result.shadowRoot;
    reactRoot = null; // will be created below
  }
  return shadowRoot!.getElementById('nazori-mount')!;
}

/** Render the Bubble into the shadow DOM. */
function showBubble(info: SelectionInfo) {
  const mountPoint = ensureHost();

  if (!reactRoot) {
    reactRoot = createRoot(mountPoint);
  }

  currentSelection = info;

  reactRoot.render(
    <Bubble
      sourceText={info.text}
      selectionRect={info.rect}
      onClose={closeBubble}
    />,
  );
}

/** Unmount the bubble and remove the shadow host. */
function closeBubble() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (host) {
    removeShadowHost(host);
    host = null;
    shadowRoot = null;
  }
  currentSelection = null;
}

/** Check if the given element is inside the shadow host (our bubble). */
function isInsideBubble(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Node)) return false;
  if (!host) return false;
  return host.contains(el) || el === host;
}

/** Check enabled + show bubble for current selection. */
function tryShowBubble(info: SelectionInfo) {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings;
    const enabled = settings?.enabled ?? true;
    if (!enabled) return;
    showBubble(info);
  });
}

// ---------- Event Handlers ----------

function handleMouseUp(e: MouseEvent) {
  // Ignore clicks inside the bubble
  if (isInsideBubble(e.target)) return;

  // Only trigger on text selection in 'select' mode
  if (triggerMode !== 'select') return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const info = getSelectionInfo();
    if (info) {
      tryShowBubble(info);
    }
  }, DEBOUNCE_MS);
}

function handleDblClick(e: MouseEvent) {
  if (isInsideBubble(e.target)) return;
  if (triggerMode !== 'double-click') return;

  // Small delay to let the browser finish selecting the double-clicked word
  setTimeout(() => {
    const info = getSelectionInfo();
    if (info) {
      tryShowBubble(info);
    }
  }, 50);
}

function handleHotkeyTrigger(e: KeyboardEvent) {
  // Ctrl+Shift+T (or Cmd+Shift+T on Mac) to trigger translation of current selection
  if (triggerMode !== 'hotkey') return;
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey || e.key !== 'T') return;

  e.preventDefault();
  const info = getSelectionInfo();
  if (info) {
    tryShowBubble(info);
  }
}

function handleMouseDown(e: MouseEvent) {
  // Close bubble when clicking outside it
  if (currentSelection && !isInsideBubble(e.target)) {
    closeBubble();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && currentSelection) {
    closeBubble();
    return;
  }

  handleHotkeyTrigger(e);
}

function handleScroll() {
  if (!currentSelection) return;

  // Try to reposition the bubble to follow the selection.
  // Never close the bubble on scroll — the user may still be reading
  // a streaming translation. They can close it with Escape or click-away.
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const text = sel.toString().trim();
  if (!text) return;

  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  showBubble({ text: currentSelection.text, rect });
}

// ---------- Bootstrap ----------

function init() {
  // Load initial trigger mode
  chrome.storage.local.get('settings', (result) => {
    triggerMode = result.settings?.triggerMode ?? DEFAULT_SETTINGS.triggerMode;
  });

  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('dblclick', handleDblClick, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('scroll', handleScroll, true);

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue?.enabled === false) {
      closeBubble();
    }
    if (changes.settings?.newValue?.triggerMode) {
      triggerMode = changes.settings.newValue.triggerMode;
    }
  });

  // Listen for messages from the background (e.g. context menu translation)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TRANSLATE_REQUEST' && message.payload?.text) {
      // Build a synthetic selection rect centered in the viewport
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 3;
      const rect = new DOMRect(centerX - 50, centerY, 100, 0);

      showBubble({ text: message.payload.text, rect });
    }
  });
}

// Self-initialize when the content script loads
init();
