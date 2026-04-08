import { createRoot, type Root } from 'react-dom/client';
import { createShadowHost, removeShadowHost } from './shadow';
import { getSelectionInfo, type SelectionInfo } from './SelectionHandler';
import Bubble from './Bubble';
import { DEBOUNCE_MS } from '@shared/constants';

// ---------- State ----------
let host: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let currentSelection: SelectionInfo | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

// ---------- Event Handlers ----------

function handleMouseUp(e: MouseEvent) {
  // Ignore clicks inside the bubble
  if (isInsideBubble(e.target)) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const info = getSelectionInfo();
    if (info) {
      // Check if extension is enabled before showing
      chrome.storage.local.get('settings', (result) => {
        const settings = result.settings;
        // If settings have not been initialized yet, default to enabled
        const enabled = settings?.enabled ?? true;
        if (!enabled) return;

        showBubble(info);
      });
    }
  }, DEBOUNCE_MS);
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
  }
}

function handleScroll() {
  if (!currentSelection) return;

  // On scroll, close the bubble because the selection rect is stale
  // relative to the viewport. A new selection will re-trigger.
  closeBubble();
}

// ---------- Bootstrap ----------

function init() {
  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('scroll', handleScroll, true);

  // Listen for settings changes to close bubble if extension is disabled
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue?.enabled === false) {
      closeBubble();
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
