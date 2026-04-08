import type { LangCode } from './types';

interface DetectionResult {
  lang: LangCode;
  confidence: 'high' | 'medium' | 'low';
}

// Layer 1: Unicode range detection
// Returns a map of lang -> character count for script-identifiable languages.
function detectByUnicodeRange(text: string): Map<LangCode, number> {
  const counts = new Map<LangCode, number>();

  for (const char of text) {
    const cp = char.codePointAt(0)!;

    // Hiragana (U+3040-309F) or Katakana (U+30A0-30FF)
    if ((cp >= 0x3040 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff)) {
      counts.set('ja', (counts.get('ja') ?? 0) + 1);
    }
    // CJK Unified Ideographs (U+4E00-9FFF) and extensions
    else if (
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x20000 && cp <= 0x2a6df)
    ) {
      // CJK could be zh or ja; we count toward zh here.
      // If ja is already dominant from kana, Layer 1 will prefer ja.
      counts.set('zh', (counts.get('zh') ?? 0) + 1);
    }
    // Hangul Syllables (U+AC00-D7AF) and Jamo (U+1100-11FF, U+3130-318F)
    else if (
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0x1100 && cp <= 0x11ff) ||
      (cp >= 0x3130 && cp <= 0x318f)
    ) {
      counts.set('ko', (counts.get('ko') ?? 0) + 1);
    }
    // Arabic script (U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF)
    else if (
      (cp >= 0x0600 && cp <= 0x06ff) ||
      (cp >= 0x0750 && cp <= 0x077f) ||
      (cp >= 0x08a0 && cp <= 0x08ff) ||
      (cp >= 0xfb50 && cp <= 0xfdff) ||
      (cp >= 0xfe70 && cp <= 0xfeff)
    ) {
      counts.set('ar', (counts.get('ar') ?? 0) + 1);
    }
    // Cyrillic (U+0400-04FF, U+0500-052F)
    else if ((cp >= 0x0400 && cp <= 0x04ff) || (cp >= 0x0500 && cp <= 0x052f)) {
      counts.set('ru', (counts.get('ru') ?? 0) + 1);
    }
  }

  // If text has both CJK and Kana, it is likely Japanese.
  const jaCount = counts.get('ja') ?? 0;
  const zhCount = counts.get('zh') ?? 0;
  if (jaCount > 0 && zhCount > 0) {
    counts.set('ja', jaCount + zhCount);
    counts.delete('zh');
  }

  return counts;
}

// Layer 2: Language-specific characters for Latin-script languages
function detectBySpecificChars(text: string): LangCode | null {
  const lower = text.toLowerCase();

  // Estonian: š, ž, õ, ä, ö, ü (shared with others, but š/ž/õ are strong signals)
  const estonianChars = /[šžõ]/;
  if (estonianChars.test(lower)) return 'et';

  // German: ß is unique to German
  if (lower.includes('ß')) return 'de';

  // Spanish: ñ, ¿, ¡ are strong signals
  const spanishChars = /[ñ¿¡]/;
  if (spanishChars.test(lower)) return 'es';

  // Portuguese: ã and õ together, or ç with ã
  const portuguesePattern = /[ãõ].*[ãõ]|ç.*ã|ã.*ç/;
  if (portuguesePattern.test(lower)) return 'pt';

  // French: ç, è, é, ê, ë, î, ï, ô, ù, û, ü, ÿ, œ, æ
  const frenchChars = /[çèêëîïôùûÿœæ]/;
  if (frenchChars.test(lower)) return 'fr';

  // Portuguese: standalone ã or ç (weaker signal, checked after French)
  const portugueseChars = /[ãç]/;
  if (portugueseChars.test(lower)) return 'pt';

  return null;
}

// Layer 3: High-frequency word matching for Latin-script languages
const WORD_LISTS: Record<string, LangCode> = {};

const EN_WORDS = [
  'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'been', 'will',
  'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'which',
  'their', 'what', 'there', 'about', 'when', 'make', 'like', 'just', 'over',
  'such', 'than', 'into', 'some', 'very', 'after', 'also', 'know', 'because',
];

const FR_WORDS = [
  'les', 'des', 'une', 'est', 'que', 'dans', 'qui', 'pour', 'pas', 'sur',
  'sont', 'avec', 'plus', 'tout', 'fait', 'mais', 'nous', 'vous', 'cette',
  'bien', 'elle', 'peut', 'ses', 'deux', 'aussi', 'entre', 'autre', 'comme',
  'leurs', 'avoir', 'donc', 'cela', 'mais', 'etre', 'tout',
];

const DE_WORDS = [
  'der', 'die', 'und', 'ist', 'von', 'den', 'mit', 'sich', 'des', 'auf',
  'ein', 'eine', 'als', 'auch', 'nicht', 'das', 'aus', 'dem', 'noch', 'nach',
  'wird', 'bei', 'einer', 'nur', 'hat', 'aber', 'wie', 'oder', 'sind', 'wenn',
  'alle', 'kann', 'sehr', 'zum', 'zur', 'wurde', 'haben', 'diese', 'mehr',
];

const ES_WORDS = [
  'los', 'las', 'del', 'una', 'por', 'con', 'para', 'como', 'pero', 'sus',
  'esta', 'hay', 'son', 'muy', 'todo', 'desde', 'que', 'entre', 'cuando',
  'sobre', 'tiene', 'puede', 'este', 'hacer', 'otro', 'mas', 'ser', 'todos',
  'estos', 'sido', 'tienen', 'hacia', 'donde', 'cual', 'debe',
];

const PT_WORDS = [
  'dos', 'das', 'uma', 'para', 'com', 'por', 'como', 'mais', 'mas', 'sua',
  'seu', 'tem', 'foi', 'ser', 'ter', 'tambem', 'seus', 'pode', 'esta',
  'entre', 'quando', 'isso', 'muito', 'mesmo', 'nos', 'ainda', 'sobre',
  'todos', 'depois', 'essa', 'fazer', 'outro', 'desde', 'cada', 'onde',
];

const IT_WORDS = [
  'che', 'per', 'con', 'una', 'del', 'della', 'dei', 'sono', 'alla',
  'delle', 'gli', 'dal', 'anche', 'nel', 'nella', 'questo', 'questa',
  'tutti', 'sua', 'suo', 'come', 'dopo', 'essere', 'hanno', 'stato',
  'fatto', 'fare', 'ancora', 'molto', 'ogni', 'dove', 'sempre', 'degli',
];

const ET_WORDS = [
  'ja', 'on', 'ei', 'see', 'mis', 'kui', 'ning', 'aga', 'kas', 'oli',
  'oma', 'selle', 'kuid', 'nii', 'siis', 'veel', 'juba', 'seda', 'mida',
  'olid', 'ning', 'kes', 'nad', 'tema', 'nende', 'alla', 'kuna', 'veel',
  'pole', 'olema', 'saab', 'mille', 'vaid', 'kus', 'iga',
];

function detectByWordFrequency(text: string): LangCode | null {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return null;

  const langScores: [LangCode, readonly string[]][] = [
    ['en', EN_WORDS],
    ['fr', FR_WORDS],
    ['de', DE_WORDS],
    ['es', ES_WORDS],
    ['pt', PT_WORDS],
    ['it', IT_WORDS],
    ['et', ET_WORDS],
  ];

  let bestLang: LangCode | null = null;
  let bestScore = 0;

  for (const [lang, langWords] of langScores) {
    const wordSet = new Set(langWords);
    let score = 0;
    for (const word of words) {
      if (wordSet.has(word)) {
        score++;
      }
    }
    const normalizedScore = score / words.length;
    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestLang = lang;
    }
  }

  // Require at least 10% word match to be meaningful
  if (bestScore < 0.1) return null;

  return bestLang;
}

/**
 * Detect the language of a given text string.
 * Uses a 4-layer detection strategy:
 *   1. Unicode ranges (CJK, Kana, Hangul, Arabic, Cyrillic)
 *   2. Language-specific characters (Estonian, French, German, Spanish, Portuguese)
 *   3. High-frequency word matching (en, fr, de, es, pt, it, et)
 *   4. Fallback to English
 */
export function detectLanguage(text: string): LangCode {
  return detectLanguageWithConfidence(text).lang;
}

/**
 * Detect language with a confidence level.
 */
export function detectLanguageWithConfidence(text: string): DetectionResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { lang: 'en', confidence: 'low' };
  }

  // Layer 1: Unicode ranges
  const unicodeCounts = detectByUnicodeRange(trimmed);
  if (unicodeCounts.size > 0) {
    let topLang: LangCode = 'en';
    let topCount = 0;
    for (const [lang, count] of unicodeCounts) {
      if (count > topCount) {
        topCount = count;
        topLang = lang;
      }
    }

    // High confidence if script-identifiable characters make up a significant portion
    const totalChars = [...trimmed].filter((c) => c.trim().length > 0).length;
    const ratio = topCount / totalChars;

    if (ratio > 0.3) {
      return { lang: topLang, confidence: 'high' };
    }
    if (ratio > 0.1) {
      return { lang: topLang, confidence: 'medium' };
    }
  }

  // Layer 2: Language-specific characters
  const charLang = detectBySpecificChars(trimmed);
  if (charLang) {
    return { lang: charLang, confidence: 'medium' };
  }

  // Layer 3: High-frequency word matching
  const wordLang = detectByWordFrequency(trimmed);
  if (wordLang) {
    return { lang: wordLang, confidence: 'medium' };
  }

  // Layer 4: Fallback
  return { lang: 'en', confidence: 'low' };
}
