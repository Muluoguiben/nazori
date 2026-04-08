import type { Domain, Language, LangCode, Settings } from './types';

export const LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
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

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  defaultTargetLang: 'en',
  defaultDomain: 'general',
  theme: 'system',
  fontSize: 'medium',
  triggerMode: 'select',
  showTermHighlight: true,
};

export const API_BASE_URL = 'https://nazori-worker.YOUR_SUBDOMAIN.workers.dev';

export const MAX_TEXT_LENGTH = 5000;

export const DEBOUNCE_MS = 300;

export const CACHE_SIZE = 100;
