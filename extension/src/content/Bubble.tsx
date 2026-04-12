import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { LANGUAGES, DOMAIN_LABELS, DOMAINS, DEFAULT_SETTINGS, TRANSLATE_MODES, MODE_LABELS } from '@shared/constants';
import type { Domain, LangCode, Message, TranslateMode } from '@shared/types';
import { calculateBubblePosition } from './SelectionHandler';

interface BubbleProps {
  sourceText: string;
  selectionRect: DOMRect;
  onClose: () => void;
}

const MAX_SOURCE_DISPLAY = 120;

export default function Bubble({ sourceText, selectionRect, onClose }: BubbleProps) {
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedTerms, setMatchedTerms] = useState<{ source: string; target: string }[]>([]);
  const [detectedLang, setDetectedLang] = useState<LangCode | null>(null);
  const [targetLang, setTargetLang] = useState<LangCode>(DEFAULT_SETTINGS.defaultTargetLang);
  const [domain, setDomain] = useState<Domain>(DEFAULT_SETTINGS.defaultDomain);
  const [copied, setCopied] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<TranslateMode>('normal');
  const [isRefining, setIsRefining] = useState(false);
  const [isWordLookup, setIsWordLookup] = useState(false);

  // Follow-up explain
  const [explainQuestion, setExplainQuestion] = useState('');
  const [explainText, setExplainText] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainStreaming, setExplainStreaming] = useState(false);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const explainPortRef = useRef<chrome.runtime.Port | null>(null);
  const requestIdRef = useRef<string>('');
  const targetLangRef = useRef(targetLang);
  const domainRef = useRef(domain);
  const modeRef = useRef(mode);
  targetLangRef.current = targetLang;
  domainRef.current = domain;
  modeRef.current = mode;

  // ---------- Position ----------
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const pos = calculateBubblePosition(selectionRect, rect.width, rect.height);
    setPosition(pos);
  }, [selectionRect]);

  // Reposition once the bubble has rendered
  useEffect(() => {
    // First pass: estimate from defaults
    const estimated = calculateBubblePosition(selectionRect, 360, 180);
    setPosition(estimated);

    // Second pass after paint so we have real dimensions
    requestAnimationFrame(() => updatePosition());
  }, [selectionRect, updatePosition]);

  // ---------- Load persisted settings ----------
  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      const s = result.settings;
      if (s) {
        if (s.defaultTargetLang) setTargetLang(s.defaultTargetLang);
        if (s.defaultDomain) setDomain(s.defaultDomain);
        if (s.defaultMode) setMode(s.defaultMode);
      }
    });
  }, []);

  // ---------- Translation streaming ----------
  const startTranslation = useCallback(() => {
    // Clean up previous port
    if (portRef.current) {
      try { portRef.current.disconnect(); } catch { /* noop */ }
    }

    setTranslatedText('');
    setMatchedTerms([]);
    setDetectedLang(null);
    setError(null);
    setIsLoading(true);
    setIsStreaming(false);
    setIsRefining(false);
    setIsWordLookup(false);

    const port = chrome.runtime.connect({ name: 'translate-stream' });
    portRef.current = port;

    const reqId = nanoid();
    requestIdRef.current = reqId;

    const message: Message = {
      type: 'TRANSLATE_REQUEST',
      payload: {
        text: sourceText,
        sourceLang: 'auto',
        targetLang: targetLangRef.current,
        domain: domainRef.current,
        mode: modeRef.current,
      },
      requestId: reqId,
      timestamp: Date.now(),
    };

    port.postMessage(message);

    port.onMessage.addListener((msg: Message) => {
      // Ignore messages for stale requests
      if (msg.requestId !== requestIdRef.current) return;

      switch (msg.type) {
        case 'TRANSLATE_STREAM_CHUNK': {
          const payload = msg.payload as {
            text: string;
            detectedLang?: LangCode;
          };
          setIsLoading(false);
          setIsStreaming(true);
          setTranslatedText((prev) => prev + payload.text);
          if (payload.detectedLang) {
            setDetectedLang(payload.detectedLang);
          }
          break;
        }
        case 'TRANSLATE_STREAM_REFINE_START': {
          setIsRefining(true);
          break;
        }
        case 'TRANSLATE_STREAM_RESET': {
          setTranslatedText('');
          setIsLoading(true);
          setIsStreaming(false);
          break;
        }
        case 'TRANSLATE_STREAM_END': {
          const payload = msg.payload as {
            matchedTerms?: { source: string; target: string }[];
            detectedLang?: LangCode;
            isWordLookup?: boolean;
          };
          setIsLoading(false);
          setIsStreaming(false);
          if (payload.matchedTerms) setMatchedTerms(payload.matchedTerms);
          if (payload.detectedLang) setDetectedLang(payload.detectedLang);
          if (payload.isWordLookup) setIsWordLookup(true);
          break;
        }
        case 'TRANSLATE_ERROR': {
          const payload = msg.payload as { message?: string; code?: string };
          setIsLoading(false);
          setIsStreaming(false);
          setError(payload.message ?? 'Translation failed. Please try again.');
          break;
        }
      }
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
    });
  // sourceText is the only real trigger — language/domain changes re-translate below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText]);

  // Trigger translation on mount
  useEffect(() => {
    startTranslation();
    return () => {
      if (portRef.current) {
        try { portRef.current.disconnect(); } catch { /* noop */ }
        portRef.current = null;
      }
    };
  }, [startTranslation]);

  // Re-translate when user switches language, domain, or mode (skip initial mount)
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    startTranslation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLang, domain, mode]);

  // ---------- Keyboard ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // ---------- Copy ----------
  const handleCopy = useCallback(async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for contexts where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = translatedText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [translatedText]);

  // ---------- Dictionary section renderer ----------
  const renderDictSections = (text: string) => {
    const HEADERS = ['Translation', 'Pronunciation', 'Meaning', 'Usage'];
    const regex = /\[(Translation|Pronunciation|Meaning|Usage)\]\n?/g;
    const parts: { header: string; body: string }[] = [];
    let lastIndex = 0;
    let lastHeader = '';
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (lastHeader) {
        parts.push({ header: lastHeader, body: text.slice(lastIndex, match.index).trim() });
      }
      lastHeader = match[1];
      lastIndex = match.index + match[0].length;
    }
    if (lastHeader) {
      parts.push({ header: lastHeader, body: text.slice(lastIndex).trim() });
    }

    // If no sections parsed (streaming in progress), fall back to plain text
    if (parts.length === 0) return text;

    return parts.map((p, i) => (
      <div key={i} className="nazori-dict-section">
        <div className="nazori-dict-header">{p.header}</div>
        <div className="nazori-dict-body">{p.body}</div>
      </div>
    ));
  };

  // ---------- Explain (follow-up question) ----------
  const sendExplainQuestion = useCallback(() => {
    const q = explainQuestion.trim();
    if (!q || !translatedText) return;

    // Clean up previous port
    if (explainPortRef.current) {
      try { explainPortRef.current.disconnect(); } catch { /* noop */ }
    }

    setExplainText('');
    setExplainError(null);
    setIsExplaining(true);
    setExplainStreaming(false);

    const port = chrome.runtime.connect({ name: 'explain-stream' });
    explainPortRef.current = port;

    const reqId = nanoid();

    const message: Message = {
      type: 'EXPLAIN_REQUEST',
      payload: {
        originalText: sourceText,
        translatedText,
        question: q,
        targetLang: targetLangRef.current,
      },
      requestId: reqId,
      timestamp: Date.now(),
    };

    port.postMessage(message);

    port.onMessage.addListener((msg: Message) => {
      if (msg.requestId !== reqId) return;

      switch (msg.type) {
        case 'EXPLAIN_STREAM_CHUNK': {
          const payload = msg.payload as { text: string };
          setIsExplaining(false);
          setExplainStreaming(true);
          setExplainText((prev) => prev + payload.text);
          break;
        }
        case 'EXPLAIN_STREAM_END': {
          setIsExplaining(false);
          setExplainStreaming(false);
          break;
        }
        case 'EXPLAIN_ERROR': {
          const payload = msg.payload as { message?: string };
          setIsExplaining(false);
          setExplainStreaming(false);
          setExplainError(payload.message ?? 'Failed to get explanation');
          break;
        }
      }
    });

    port.onDisconnect.addListener(() => {
      explainPortRef.current = null;
    });
  }, [explainQuestion, translatedText, sourceText]);

  // Clean up explain port on unmount
  useEffect(() => {
    return () => {
      if (explainPortRef.current) {
        try { explainPortRef.current.disconnect(); } catch { /* noop */ }
        explainPortRef.current = null;
      }
    };
  }, []);

  // ---------- Truncated source ----------
  const truncatedSource =
    sourceText.length > MAX_SOURCE_DISPLAY
      ? sourceText.slice(0, MAX_SOURCE_DISPLAY) + '\u2026'
      : sourceText;

  // ---------- Render ----------
  return (
    <div
      ref={bubbleRef}
      className="nazori-bubble"
      role="dialog"
      aria-label="Nazori Translation"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="nazori-header">
        <span
          className="nazori-source-text"
          title={sourceText.length > MAX_SOURCE_DISPLAY ? sourceText : undefined}
        >
          {truncatedSource}
        </span>
        <button
          className="nazori-close-btn"
          onClick={onClose}
          aria-label="Close translation"
          tabIndex={0}
        >
          &#x2715;
        </button>
      </div>

      <hr className="nazori-separator" />

      {/* Controls */}
      <div className="nazori-controls">
        {/* Source language (auto-detected, read-only display) */}
        <select
          className="nazori-select"
          value={detectedLang ?? 'auto'}
          disabled
          aria-label="Detected source language"
        >
          <option value="auto">Auto{detectedLang ? '' : '-detect'}</option>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>

        <span className="nazori-arrow-icon" aria-hidden="true">
          &#x2192;
        </span>

        {/* Target language */}
        <select
          className="nazori-select"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value as LangCode)}
          aria-label="Target language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>

        {/* Domain */}
        <select
          className="nazori-select"
          value={domain}
          onChange={(e) => setDomain(e.target.value as Domain)}
          aria-label="Translation domain"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {DOMAIN_LABELS[d]}
            </option>
          ))}
        </select>

        {/* Mode */}
        <select
          className="nazori-select nazori-select--mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as TranslateMode)}
          aria-label="Translation mode"
        >
          {TRANSLATE_MODES.map((m) => (
            <option key={m} value={m}>
              {MODE_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Translation area */}
      <div className="nazori-translation-area">
        {isLoading && !translatedText && !error && (
          <div className="nazori-loading" aria-label="Loading translation">
            <div className="nazori-skeleton-line" />
            <div className="nazori-skeleton-line" />
            <div className="nazori-skeleton-line" />
          </div>
        )}

        {error && (
          <div className="nazori-error" role="alert">
            <span className="nazori-error-message">{error}</span>
            <button
              className="nazori-retry-btn"
              onClick={startTranslation}
              aria-label="Retry translation"
            >
              Retry
            </button>
          </div>
        )}

        {isRefining && isLoading && !translatedText && (
          <div className="nazori-refining-hint">Polishing translation&#x2026;</div>
        )}

        {translatedText && (
          <div className="nazori-translation-text">
            {isWordLookup ? renderDictSections(translatedText) : translatedText}
            {isStreaming && <span className="nazori-cursor" aria-hidden="true" />}
          </div>
        )}
      </div>

      {/* Footer */}
      {translatedText && !error && (
        <div className="nazori-footer">
          <button
            className={`nazori-copy-btn ${copied ? 'nazori-copy-btn--copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied to clipboard' : 'Copy translation'}
          >
            {copied ? '\u2713 Copied!' : '\u2398 Copy'}
          </button>

          {matchedTerms.length > 0 && (
            <button
              className="nazori-terms-toggle"
              onClick={() => setTermsOpen((v) => !v)}
              aria-expanded={termsOpen}
              aria-label="Toggle matched terms"
            >
              {termsOpen ? '\u25BC' : '\u25B6'} Terms ({matchedTerms.length})
            </button>
          )}
        </div>
      )}

      {/* Matched terms */}
      {termsOpen && matchedTerms.length > 0 && (
        <div className="nazori-terms-section">
          <ul className="nazori-terms-list">
            {matchedTerms.map((term, i) => (
              <li key={i} className="nazori-term-item">
                <span className="nazori-term-source">{term.source}</span>
                <span className="nazori-term-arrow" aria-hidden="true">
                  &rarr;
                </span>
                <span className="nazori-term-target">{term.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up question */}
      {translatedText && !error && !isStreaming && (
        <div className="nazori-explain-section">
          <div className="nazori-explain-input-row">
            <input
              className="nazori-explain-input"
              type="text"
              placeholder="Ask a follow-up question..."
              value={explainQuestion}
              onChange={(e) => setExplainQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing) {
                  e.preventDefault();
                  sendExplainQuestion();
                }
                e.stopPropagation();
              }}
              disabled={isExplaining || explainStreaming}
              aria-label="Follow-up question"
            />
            <button
              className="nazori-explain-send"
              onClick={sendExplainQuestion}
              disabled={!explainQuestion.trim() || isExplaining || explainStreaming}
              aria-label="Send question"
            >
              &#x27A4;
            </button>
          </div>

          {isExplaining && !explainText && (
            <div className="nazori-explain-loading">Thinking&#x2026;</div>
          )}

          {explainError && (
            <div className="nazori-error" role="alert">
              <span className="nazori-error-message">{explainError}</span>
            </div>
          )}

          {explainText && (
            <div className="nazori-explain-text">
              {explainText}
              {explainStreaming && <span className="nazori-cursor" aria-hidden="true" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
