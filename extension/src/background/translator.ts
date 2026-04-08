import type {
  Domain,
  LangCode,
  Message,
  TranslateRequest,
  TranslateResponse,
  TranslationRecord,
  ErrorCode,
  Settings,
  StorageSchema,
} from '../shared/types';
import { API_BASE_URL, MAX_TEXT_LENGTH } from '../shared/constants';
import { LRUCache, makeCacheKey } from './cache';
import { matchTerms } from './terms';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Module-level translation cache
// ---------------------------------------------------------------------------

const translationCache = new LRUCache<TranslateResponse>(100);

export { translationCache };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STREAM_TIMEOUT_MS = 15_000;

function makeMessage<T>(type: Message['type'], payload: T, requestId: string): Message<T> {
  return { type, payload, timestamp: Date.now(), requestId };
}

/**
 * Save a completed translation to the history in chrome.storage.local.
 * Keeps the most recent 200 entries to avoid unbounded growth.
 */
async function saveToHistory(record: TranslationRecord): Promise<void> {
  const MAX_HISTORY = 200;
  try {
    const result = await chrome.storage.local.get('history');
    const history: TranslationRecord[] = (result.history as TranslationRecord[] | undefined) ?? [];
    history.unshift(record);
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    await chrome.storage.local.set({ history });
  } catch {
    // Storage write failures are non-fatal for translations.
    console.warn('[nazori] failed to save translation to history');
  }
}

// ---------------------------------------------------------------------------
// SSE stream parser
// ---------------------------------------------------------------------------

interface SSEEvent {
  event?: string;
  data: string;
}

/**
 * Parse an SSE text chunk that may contain multiple events separated by blank
 * lines.  Handles the standard `event:` and `data:` fields.
 */
function parseSSEChunk(raw: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = raw.split(/\n\n+/);

  for (const block of blocks) {
    if (!block.trim()) continue;

    let event: string | undefined;
    const dataLines: string[] = [];

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trim());
      }
      // Ignore comment lines (starting with ':') and unknown fields.
    }

    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join('\n') });
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Main streaming translation handler
// ---------------------------------------------------------------------------

/**
 * Stream a translation from the backend API via a chrome.runtime.Port.
 *
 * Protocol (messages posted to the port):
 *   TRANSLATE_STREAM_CHUNK  { text: string }
 *   TRANSLATE_STREAM_END    TranslateResponse
 *   TRANSLATE_ERROR         { code: ErrorCode, message: string }
 */
export async function translateStream(
  port: chrome.runtime.Port,
  request: TranslateRequest,
  requestId: string,
): Promise<void> {
  // --- Pre-flight checks ---------------------------------------------------

  if (!navigator.onLine) {
    port.postMessage(
      makeMessage('TRANSLATE_ERROR', { code: 'NETWORK_OFFLINE', message: 'No internet connection' }, requestId),
    );
    return;
  }

  if (request.text.length > MAX_TEXT_LENGTH) {
    port.postMessage(
      makeMessage('TRANSLATE_ERROR', { code: 'TEXT_TOO_LONG', message: `Text exceeds ${MAX_TEXT_LENGTH} characters` }, requestId),
    );
    return;
  }

  // --- Load settings & device_id ------------------------------------------

  let settings: Settings;
  let deviceId: string;
  try {
    const stored = await chrome.storage.local.get(['settings', 'device_id']);
    settings = stored.settings as Settings;
    deviceId = (stored.device_id as string) ?? '';
  } catch {
    port.postMessage(
      makeMessage('TRANSLATE_ERROR', { code: 'STORAGE_CORRUPTED', message: 'Failed to read settings' }, requestId),
    );
    return;
  }

  // --- Check cache ---------------------------------------------------------

  const cacheKey = makeCacheKey(
    request.text,
    request.sourceLang,
    request.targetLang,
    request.domain,
  );

  const cached = translationCache.get(cacheKey);
  if (cached) {
    port.postMessage(makeMessage('TRANSLATE_STREAM_CHUNK', { text: cached.translatedText }, requestId));
    port.postMessage(makeMessage('TRANSLATE_STREAM_END', cached, requestId));
    return;
  }

  // --- Term matching -------------------------------------------------------

  let matchedTerms: { source: string; target: string }[] = [];
  if (request.sourceLang !== 'auto') {
    try {
      matchedTerms = await matchTerms(
        request.text,
        request.domain,
        request.sourceLang,
        request.targetLang,
      );
    } catch {
      // Non-fatal – continue without terms.
    }
  }

  // --- Build API request ---------------------------------------------------

  const body: TranslateRequest & { terms?: { source: string; target: string }[] } = {
    ...request,
    terms: matchedTerms.length > 0 ? matchedTerms : request.terms,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  // Track whether the port was disconnected so we can stop processing.
  let disconnected = false;
  const onDisconnect = () => {
    disconnected = true;
    controller.abort();
  };
  port.onDisconnect.addListener(onDisconnect);

  try {
    const response = await fetch(`${API_BASE_URL}/api/translate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorCode = mapHttpStatus(response.status);
      let errorMessage = `Server responded with ${response.status}`;
      try {
        const errorBody = await response.text();
        if (errorBody) errorMessage = errorBody;
      } catch { /* ignore */ }

      if (!disconnected) {
        port.postMessage(
          makeMessage('TRANSLATE_ERROR', { code: errorCode, message: errorMessage }, requestId),
        );
      }
      return;
    }

    // --- Read the SSE stream ------------------------------------------------

    const reader = response.body?.getReader();
    if (!reader) {
      if (!disconnected) {
        port.postMessage(
          makeMessage('TRANSLATE_ERROR', { code: 'SERVER_ERROR', message: 'No response body' }, requestId),
        );
      }
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let detectedLang: LangCode | undefined;
    let usage = { inputTokens: 0, outputTokens: 0 };

    while (true) {
      if (disconnected) {
        reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = parseSSEChunk(buffer);
      // Keep any trailing incomplete event in the buffer
      const lastDoubleNewline = buffer.lastIndexOf('\n\n');
      buffer = lastDoubleNewline >= 0 ? buffer.slice(lastDoubleNewline + 2) : buffer;

      for (const sseEvent of events) {
        if (sseEvent.data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(sseEvent.data) as Record<string, unknown>;

          if (sseEvent.event === 'delta' || parsed.delta !== undefined) {
            const delta = (parsed.delta as string) ?? '';
            fullText += delta;
            if (!disconnected) {
              port.postMessage(makeMessage('TRANSLATE_STREAM_CHUNK', { text: delta }, requestId));
            }
          }

          if (parsed.detectedLang !== undefined) {
            detectedLang = parsed.detectedLang as LangCode;
          }

          if (parsed.usage !== undefined) {
            usage = parsed.usage as { inputTokens: number; outputTokens: number };
          }

          // Some backends send the matched terms back
          if (parsed.matchedTerms !== undefined) {
            matchedTerms = parsed.matchedTerms as { source: string; target: string }[];
          }
        } catch {
          // Ignore unparseable lines (comments, keep-alive, etc.)
        }
      }
    }

    // --- Stream complete ----------------------------------------------------

    const result: TranslateResponse = {
      translatedText: fullText,
      detectedLang: detectedLang ?? (request.sourceLang === 'auto' ? 'en' : request.sourceLang) as LangCode,
      matchedTerms,
      usage,
    };

    // Cache the result
    translationCache.set(cacheKey, result);

    if (!disconnected) {
      port.postMessage(makeMessage('TRANSLATE_STREAM_END', result, requestId));
    }

    // Save to history (fire-and-forget)
    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
    const url = activeTab[0]?.url ?? '';

    const record: TranslationRecord = {
      id: nanoid(),
      sourceText: request.text,
      translatedText: fullText,
      sourceLang: result.detectedLang,
      targetLang: request.targetLang,
      domain: request.domain,
      matchedTerms,
      url,
      timestamp: Date.now(),
    };

    saveToHistory(record);
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (disconnected) return;

    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    const code: string = isAbort ? 'NETWORK_TIMEOUT' : 'TRANSLATION_FAILED';
    const message = isAbort
      ? 'Translation request timed out'
      : (err instanceof Error ? err.message : 'Unknown error');

    port.postMessage(makeMessage('TRANSLATE_ERROR', { code, message }, requestId));
  } finally {
    clearTimeout(timeout);
    port.onDisconnect.removeListener(onDisconnect);
  }
}

// ---------------------------------------------------------------------------
// HTTP status -> ErrorCode mapping
// ---------------------------------------------------------------------------

function mapHttpStatus(status: number): string {
  if (status === 429) return 'RATE_LIMITED';
  if (status === 503 || status === 502) return 'API_UNAVAILABLE';
  if (status >= 500) return 'SERVER_ERROR';
  return 'TRANSLATION_FAILED';
}
