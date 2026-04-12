import type { Domain, Language, LangCode, Settings, TranslateMode } from './types';

export const LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
];

export const LANGUAGE_MAP: Record<LangCode, Language> = Object.fromEntries(
  LANGUAGES.map((lang) => [lang.code, lang]),
) as Record<LangCode, Language>;

export const DOMAINS: Domain[] = ['general', 'legal', 'medical', 'tech'];

export const DOMAIN_LABELS: Record<Domain, string> = {
  general: 'General',
  legal: 'Legal',
  medical: 'Medical',
  tech: 'Technology',
};

export const TRANSLATE_MODES: TranslateMode[] = ['quick', 'normal', 'refined'];

export const MODE_LABELS: Record<TranslateMode, string> = {
  quick: 'Quick',
  normal: 'Normal',
  refined: 'Refined',
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  defaultTargetLang: 'en',
  defaultDomain: 'general',
  defaultMode: 'normal',
  theme: 'system',
  fontSize: 'medium',
  triggerMode: 'select',
  showTermHighlight: true,
};

export const API_BASE_URL = 'https://nazori-worker.nazori-agent.workers.dev';

export const MAX_TEXT_LENGTH = 5000;

export const DEBOUNCE_MS = 300;

// LRU translation cache capacity. At ~1 KB per cached response and 100 entries,
// memory usage stays under 100 KB — negligible for a service worker. Sized to
// cover a typical browsing session (user translates ~50-80 snippets/day) with
// room for repeated lookups on multi-language pages.
export const CACHE_SIZE = 100;
