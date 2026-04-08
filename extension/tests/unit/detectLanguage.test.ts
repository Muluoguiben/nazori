import { describe, it, expect } from 'vitest';
import { detectLanguage, detectLanguageWithConfidence } from '../../src/shared/detectLanguage';

describe('detectLanguage', () => {
  // -------------------------------------------------------------------------
  // Layer 1: Unicode range detection
  // -------------------------------------------------------------------------

  describe('Chinese text detection', () => {
    it('detects simplified Chinese characters', () => {
      expect(detectLanguage('这是一段中文文本用于测试')).toBe('zh');
    });

    it('detects Chinese with high confidence', () => {
      const result = detectLanguageWithConfidence('这是一段中文文本用于测试');
      expect(result.lang).toBe('zh');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Japanese text detection', () => {
    it('detects hiragana', () => {
      expect(detectLanguage('これはテストです')).toBe('ja');
    });

    it('detects katakana', () => {
      expect(detectLanguage('コンピューター')).toBe('ja');
    });

    it('detects kanji mixed with kana as Japanese', () => {
      expect(detectLanguage('日本語のテスト文章です')).toBe('ja');
    });

    it('detects Japanese with high confidence', () => {
      const result = detectLanguageWithConfidence('これはテストです');
      expect(result.lang).toBe('ja');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Korean text detection', () => {
    it('detects hangul syllables', () => {
      expect(detectLanguage('한국어 텍스트 테스트')).toBe('ko');
    });

    it('detects Korean with high confidence', () => {
      const result = detectLanguageWithConfidence('한국어 텍스트 테스트입니다');
      expect(result.lang).toBe('ko');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Arabic text detection', () => {
    it('detects Arabic script', () => {
      expect(detectLanguage('هذا نص باللغة العربية')).toBe('ar');
    });

    it('detects Arabic with high confidence', () => {
      const result = detectLanguageWithConfidence('هذا نص باللغة العربية للاختبار');
      expect(result.lang).toBe('ar');
      expect(result.confidence).toBe('high');
    });
  });

  describe('Russian text detection', () => {
    it('detects Cyrillic script', () => {
      expect(detectLanguage('Это тестовый текст на русском языке')).toBe('ru');
    });

    it('detects Russian with high confidence', () => {
      const result = detectLanguageWithConfidence('Это тестовый текст на русском языке');
      expect(result.lang).toBe('ru');
      expect(result.confidence).toBe('high');
    });
  });

  // -------------------------------------------------------------------------
  // Layer 2: Language-specific characters
  // -------------------------------------------------------------------------

  describe('Estonian text detection', () => {
    it('detects Estonian by š, ž, õ characters', () => {
      expect(detectLanguage('Tere, kuidas läheb? Võib-olla šokk')).toBe('et');
    });

    it('detects Estonian with medium confidence', () => {
      const result = detectLanguageWithConfidence('See on õige šanss');
      expect(result.lang).toBe('et');
      expect(result.confidence).toBe('medium');
    });
  });

  describe('French text detection', () => {
    it('detects French by ç, è, é characters', () => {
      expect(detectLanguage('Voilà une très bonne idée, ça marche')).toBe('fr');
    });

    it('detects French by è', () => {
      expect(detectLanguage('Il est très content de la fête')).toBe('fr');
    });
  });

  describe('German text detection', () => {
    it('detects German by ß character', () => {
      expect(detectLanguage('Die Straße ist groß und weiß')).toBe('de');
    });
  });

  describe('Spanish text detection', () => {
    it('detects Spanish by ñ character', () => {
      expect(detectLanguage('El niño está en España')).toBe('es');
    });

    it('detects Spanish by ¿ character', () => {
      expect(detectLanguage('¿Cómo estás hoy amigo?')).toBe('es');
    });
  });

  describe('Portuguese text detection', () => {
    it('detects Portuguese by ç with ã pattern', () => {
      // Note: standalone õ triggers Estonian detection first, so we use ç+ã pattern
      expect(detectLanguage('A nação é uma graça')).toBe('pt');
    });

    it('detects Portuguese by standalone ã (after French check)', () => {
      expect(detectLanguage('O coração do Brasil')).toBe('pt');
    });
  });

  // -------------------------------------------------------------------------
  // Layer 3: High-frequency word matching
  // -------------------------------------------------------------------------

  describe('English text detection', () => {
    it('detects English by common words', () => {
      expect(detectLanguage('This is a very important document that has been reviewed')).toBe('en');
    });

    it('detects English with medium confidence for longer text', () => {
      const result = detectLanguageWithConfidence(
        'The quick brown fox would have been very happy with this',
      );
      expect(result.lang).toBe('en');
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Italian text detection', () => {
    it('detects Italian by high-frequency words', () => {
      expect(detectLanguage('Questo della nella anche tutti hanno fatto essere')).toBe('it');
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('empty and short text handling', () => {
    it('returns en with low confidence for empty string', () => {
      const result = detectLanguageWithConfidence('');
      expect(result.lang).toBe('en');
      expect(result.confidence).toBe('low');
    });

    it('returns en with low confidence for whitespace-only', () => {
      const result = detectLanguageWithConfidence('   ');
      expect(result.lang).toBe('en');
      expect(result.confidence).toBe('low');
    });
  });

  describe('mixed language text', () => {
    it('detects dominant script in mixed CJK/Latin text', () => {
      // Mostly Chinese with some English
      const result = detectLanguage('这是一段中文 with some English words');
      expect(result).toBe('zh');
    });

    it('detects Japanese when kana is present with kanji', () => {
      // Kanji + kana should resolve to Japanese
      const result = detectLanguage('漢字とひらがなが混ざったテキスト');
      expect(result).toBe('ja');
    });
  });

  describe('pure numbers and symbols', () => {
    it('falls back to en for pure numbers', () => {
      const result = detectLanguageWithConfidence('123456789');
      expect(result.lang).toBe('en');
      expect(result.confidence).toBe('low');
    });

    it('falls back to en for symbols only', () => {
      const result = detectLanguageWithConfidence('!@#$%^&*()');
      expect(result.lang).toBe('en');
      expect(result.confidence).toBe('low');
    });
  });

  describe('confidence levels', () => {
    it('returns high confidence for obvious script-based detection', () => {
      const result = detectLanguageWithConfidence('これはテストです');
      expect(result.confidence).toBe('high');
    });

    it('returns medium confidence for character-based detection', () => {
      const result = detectLanguageWithConfidence('Die Straße');
      expect(result.confidence).toBe('medium');
    });

    it('returns low confidence for undetectable text', () => {
      const result = detectLanguageWithConfidence('abc');
      expect(result.confidence).toBe('low');
    });
  });
});
