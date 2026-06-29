import React, { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { LANGUAGES, DOMAIN_LABELS, DOMAINS, DEFAULT_SETTINGS, TRANSLATE_MODES, MODE_LABELS } from '@shared/constants';
import type { Domain, LangCode, Message, Settings, TranslateMode } from '@shared/types';
import { calculateBubblePosition } from './SelectionHandler';

interface BubbleProps {
  sourceText: string;
  selectionRect: DOMRect;
  onClose: () => void;
}

const MAX_SOURCE_DISPLAY = 120;
const MAX_SPEECH_TEXT_LENGTH = 120;

const SPEECH_LANG_TAGS: Record<LangCode, string> = {
  zh: 'zh-CN',
  'zh-Hant': 'zh-TW',
  en: 'en-US',
  et: 'et-EE',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ru: 'ru-RU',
  pt: 'pt-PT',
  it: 'it-IT',
  ar: 'ar-SA',
};

const PREFERRED_VOICE_NAMES: Partial<Record<LangCode, string[]>> = {
  zh: ['Tingting', 'Meijia', 'Sin-ji', 'Google 普通话', 'Microsoft Xiaoxiao'],
  'zh-Hant': ['Meijia', 'Sin-ji', 'Google 國語', 'Microsoft HsiaoChen'],
  en: ['Google US English', 'Samantha', 'Alex', 'Microsoft Aria', 'Microsoft Jenny'],
  ja: ['Kyoko', 'Otoya', 'Google 日本語', 'Microsoft Nanami'],
  ko: ['Yuna', 'Google 한국', 'Microsoft SunHi'],
  fr: ['Thomas', 'Amelie', 'Audrey', 'Google français', 'Microsoft Denise'],
  de: ['Anna', 'Markus', 'Google Deutsch', 'Microsoft Katja'],
  es: ['Monica', 'Jorge', 'Paulina', 'Google español', 'Microsoft Elvira'],
  ru: ['Milena', 'Google русский', 'Microsoft Svetlana'],
  pt: ['Luciana', 'Joana', 'Felipe', 'Google português', 'Microsoft Francisca'],
  it: ['Alice', 'Luca', 'Google italiano', 'Microsoft Elsa'],
  ar: ['Maged', 'Tarik', 'Google العربية', 'Microsoft Hamed'],
};

const DISFAVORED_VOICE_NAMES = [
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Fred',
  'Good News',
  'Hysterical',
  'Junior',
  'Kathy',
  'Pipe Organ',
  'Princess',
  'Ralph',
  'Trinoids',
  'Whisper',
  'Zarvox',
];

function getSpeechText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_SPEECH_TEXT_LENGTH);
}

function voiceNameIncludes(voice: SpeechSynthesisVoice, names: string[]): boolean {
  const voiceName = voice.name.toLowerCase();
  return names.some((name) => voiceName.includes(name.toLowerCase()));
}

function isDisfavoredVoice(voice: SpeechSynthesisVoice): boolean {
  return voiceNameIncludes(voice, DISFAVORED_VOICE_NAMES);
}

function chooseSpeechVoice(
  voices: SpeechSynthesisVoice[],
  langCode: LangCode,
  speechLang: string,
): SpeechSynthesisVoice | undefined {
  const langPrefix = speechLang.split('-')[0].toLowerCase();
  const preferredNames = PREFERRED_VOICE_NAMES[langCode] ?? [];

  const scored = voices
    .filter((voice) => !isDisfavoredVoice(voice))
    .map((voice) => {
      const voiceLang = voice.lang.toLowerCase();
      let score = 0;

      if (voiceNameIncludes(voice, preferredNames)) score += 100;
      if (voiceLang === speechLang.toLowerCase()) score += 50;
      if (voiceLang.startsWith(`${langPrefix}-`) || voiceLang === langPrefix) score += 35;
      if (voice.localService) score += 8;
      if (voice.default) score += 2;

      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.find((item) => item.score >= 35)?.voice ?? scored[0]?.voice;
}

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
  const [fontSize, setFontSize] = useState<Settings['fontSize']>('medium');
  const [showTermHighlight, setShowTermHighlight] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Follow-up explain
  const [explainQuestion, setExplainQuestion] = useState('');
  const [explainText, setExplainText] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainStreaming, setExplainStreaming] = useState(false);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const explainPortRef = useRef<chrome.runtime.Port | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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
        if (s.fontSize) setFontSize(s.fontSize);
        if (s.showTermHighlight !== undefined) setShowTermHighlight(s.showTermHighlight);
      }
    });
  }, []);

  // ---------- Pronunciation playback ----------
  useEffect(() => {
    const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    setSpeechSupported(supported);
    if (!supported) return undefined;

    const updateVoices = () => {
      setSpeechVoices(window.speechSynthesis.getVoices());
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      if (speechUtteranceRef.current) {
        window.speechSynthesis.cancel();
        speechUtteranceRef.current = null;
      }
    };
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
    setIsSpeaking(false);
    if (speechUtteranceRef.current && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    }

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
          setIsWordLookup(Boolean(payload.isWordLookup));
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

  const speechText = getSpeechText(sourceText);
  const speechLang = detectedLang ? SPEECH_LANG_TAGS[detectedLang] : undefined;
  const selectedSpeechVoice =
    detectedLang && speechLang
      ? chooseSpeechVoice(speechVoices, detectedLang, speechLang)
      : undefined;

  const handlePronunciation = useCallback(() => {
    if (!speechSupported || !speechText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
      setIsSpeaking(false);
      return;
    }

    if (speechUtteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    const utterance = new window.SpeechSynthesisUtterance(speechText);
    const voices = speechVoices.length > 0 ? speechVoices : window.speechSynthesis.getVoices();
    const voice =
      detectedLang && speechLang ? chooseSpeechVoice(voices, detectedLang, speechLang) : undefined;
    if (voice) utterance.voice = voice;
    if (voice?.lang) utterance.lang = voice.lang;
    else if (speechLang) utterance.lang = speechLang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
        setIsSpeaking(false);
      }
    };

    utterance.onerror = () => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
        setIsSpeaking(false);
      }
    };

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [detectedLang, isSpeaking, speechLang, speechSupported, speechText, speechVoices]);

  const renderPronunciationButton = () => (
    <button
      className={`nazori-pronunciation-btn ${
        isSpeaking ? 'nazori-pronunciation-btn--speaking' : ''
      }`}
      type="button"
      onClick={handlePronunciation}
      disabled={!speechSupported || !speechText}
      aria-pressed={isSpeaking}
      aria-label={
        isSpeaking ? `Stop pronouncing ${speechText}` : `Play pronunciation for ${speechText}`
      }
      title={
        speechSupported
          ? `Play pronunciation${selectedSpeechVoice ? ` (${selectedSpeechVoice.name})` : ''}`
          : 'Speech playback is not available'
      }
    >
      <span className="nazori-pronunciation-icon" aria-hidden="true">
        {isSpeaking ? '\u25A0' : '\u25B6'}
      </span>
      <span>{isSpeaking ? 'Stop' : 'Play'}</span>
    </button>
  );

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
        <div className="nazori-dict-header-row">
          <div className="nazori-dict-header">{p.header}</div>
          {p.header === 'Pronunciation' && renderPronunciationButton()}
        </div>
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

  // ---------- Font size ----------
  const fontSizePx = fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14;

  // ---------- Term highlighting ----------
  const highlightTerms = (text: string): (string | React.ReactElement)[] => {
    if (!showTermHighlight || matchedTerms.length === 0) return [text];

    const targets = matchedTerms.map((t) => t.target).filter(Boolean);
    if (targets.length === 0) return [text];

    // Build regex from term targets, longest first to avoid partial matches
    const sorted = [...targets].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <mark key={match.index} className="nazori-term-highlight">{match[0]}</mark>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

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
          <div className="nazori-translation-text" style={{ fontSize: `${fontSizePx}px` }}>
            {isWordLookup
              ? renderDictSections(translatedText)
              : highlightTerms(translatedText)}
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
