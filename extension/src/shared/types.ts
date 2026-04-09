export type LangCode = 'zh' | 'zh-Hant' | 'en' | 'et' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'pt' | 'it' | 'ar';

export interface Language {
  code: LangCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export type Domain = 'general' | 'legal' | 'medical' | 'tech';

export type TranslateMode = 'quick' | 'normal' | 'refined';

export interface Term {
  id: string;
  domain: Domain;
  translations: Partial<Record<LangCode, string>>;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TranslateRequest {
  text: string;
  sourceLang: 'auto' | LangCode;
  targetLang: LangCode;
  domain: Domain;
  mode?: TranslateMode;
  terms?: { source: string; target: string }[];
}

export interface TranslateResponse {
  translatedText: string;
  detectedLang: LangCode;
  matchedTerms: { source: string; target: string }[];
  usage: { inputTokens: number; outputTokens: number };
}

export type MessageType =
  | 'TRANSLATE_REQUEST'
  | 'TRANSLATE_RESPONSE'
  | 'TRANSLATE_STREAM_CHUNK'
  | 'TRANSLATE_STREAM_RESET'
  | 'TRANSLATE_STREAM_REFINE_START'
  | 'TRANSLATE_STREAM_END'
  | 'TRANSLATE_ERROR'
  | 'TERMS_GET'
  | 'TERMS_ADD'
  | 'TERMS_DELETE'
  | 'TERMS_UPDATE'
  | 'TERMS_IMPORT'
  | 'TERMS_EXPORT'
  | 'SETTINGS_GET'
  | 'SETTINGS_UPDATE'
  | 'CACHE_CLEAR';

export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  requestId: string;
  timestamp: number;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: LangCode;
  targetLang: LangCode;
  domain: Domain;
  matchedTerms: { source: string; target: string }[];
  url: string;
  timestamp: number;
}

export interface Settings {
  enabled: boolean;
  defaultTargetLang: LangCode;
  defaultDomain: Domain;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  triggerMode: 'select' | 'double-click' | 'hotkey';
  showTermHighlight: boolean;
}

export interface StorageSchema {
  'terms:general': Term[];
  'terms:legal': Term[];
  'terms:medical': Term[];
  'terms:tech': Term[];
  settings: Settings;
  device_id: string;
  history: TranslationRecord[];
  schema_version: number;
}

export enum ErrorCode {
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  UNSUPPORTED_LANG = 'UNSUPPORTED_LANG',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  STORAGE_FULL = 'STORAGE_FULL',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
}
