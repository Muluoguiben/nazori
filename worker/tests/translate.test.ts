import { describe, it, expect } from 'vitest';
import { detectLanguageNode, matchTermsNode, buildPromptNode, buildRefinePromptNode } from '../src/graph/nodes';
import { validateBody } from '../src/routes/translate';
import type { TranslationStateType } from '../src/graph/state';

// ---------------------------------------------------------------------------
// Helper to create a minimal state
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<TranslationStateType> = {}): TranslationStateType {
  return {
    text: 'The quick brown fox jumps over the lazy dog',
    sourceLang: 'auto',
    targetLang: 'zh',
    domain: 'general',
    inputTerms: [],
    mode: 'normal',
    geminiApiKey: 'test-key',
    ai: null,
    detectedLang: '',
    matchedTerms: [],
    systemPrompt: '',
    isWordLookup: false,
    draftText: '',
    refinePrompt: '',
    translatedText: '',
    modelUsed: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    error: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// detectLanguageNode
// ---------------------------------------------------------------------------

describe('detectLanguageNode', () => {
  it('passes through explicit source language', async () => {
    const result = await detectLanguageNode(makeState({ sourceLang: 'fr' }));
    expect(result.detectedLang).toBe('fr');
  });

  it('detects Chinese text', async () => {
    const result = await detectLanguageNode(makeState({ text: '你好世界' }));
    expect(result.detectedLang).toBe('zh');
  });

  it('detects Japanese text (hiragana)', async () => {
    const result = await detectLanguageNode(makeState({ text: 'こんにちは' }));
    expect(result.detectedLang).toBe('ja');
  });

  it('detects Korean text', async () => {
    const result = await detectLanguageNode(makeState({ text: '안녕하세요' }));
    expect(result.detectedLang).toBe('ko');
  });

  it('detects Arabic text', async () => {
    const result = await detectLanguageNode(makeState({ text: 'مرحبا بالعالم' }));
    expect(result.detectedLang).toBe('ar');
  });

  it('detects Russian text', async () => {
    const result = await detectLanguageNode(makeState({ text: 'Привет мир' }));
    expect(result.detectedLang).toBe('ru');
  });

  it('detects English via word patterns', async () => {
    const result = await detectLanguageNode(makeState({ text: 'The quick brown fox is jumping' }));
    expect(result.detectedLang).toBe('en');
  });

  it('detects Estonian via special characters', async () => {
    const result = await detectLanguageNode(makeState({ text: 'Tere, kuidas teil läheb? Täna on ilus päev šokk' }));
    expect(result.detectedLang).toBe('et');
  });

  it('falls back to English for ambiguous text', async () => {
    const result = await detectLanguageNode(makeState({ text: 'xyz 123' }));
    expect(result.detectedLang).toBe('en');
  });
});

// ---------------------------------------------------------------------------
// matchTermsNode
// ---------------------------------------------------------------------------

describe('matchTermsNode', () => {
  it('returns empty array when no terms provided', async () => {
    const result = await matchTermsNode(makeState());
    expect(result.matchedTerms).toEqual([]);
  });

  it('matches terms case-insensitively', async () => {
    const result = await matchTermsNode(
      makeState({
        text: 'The Contract specifies liability',
        inputTerms: [
          { source: 'contract', target: '合同' },
          { source: 'liability', target: '责任' },
          { source: 'arbitration', target: '仲裁' },
        ],
      }),
    );
    expect(result.matchedTerms).toHaveLength(2);
    expect(result.matchedTerms).toContainEqual({ source: 'contract', target: '合同' });
    expect(result.matchedTerms).toContainEqual({ source: 'liability', target: '责任' });
  });

  it('returns empty when no terms match', async () => {
    const result = await matchTermsNode(
      makeState({
        text: 'Hello world',
        inputTerms: [{ source: 'contract', target: '合同' }],
      }),
    );
    expect(result.matchedTerms).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildPromptNode
// ---------------------------------------------------------------------------

describe('buildPromptNode', () => {
  it('includes domain instructions', async () => {
    const result = await buildPromptNode(
      makeState({
        detectedLang: 'en',
        targetLang: 'zh',
        domain: 'legal',
        matchedTerms: [],
      }),
    );
    expect(result.systemPrompt).toContain('legal');
    expect(result.systemPrompt).toContain('precise legal terminology');
  });

  it('includes mandatory terminology', async () => {
    const result = await buildPromptNode(
      makeState({
        detectedLang: 'en',
        targetLang: 'zh',
        domain: 'general',
        matchedTerms: [{ source: 'contract', target: '合同' }],
      }),
    );
    expect(result.systemPrompt).toContain('Mandatory terminology');
    expect(result.systemPrompt).toContain('"contract" -> "合同"');
  });

  it('omits terminology section when no terms matched', async () => {
    const result = await buildPromptNode(
      makeState({
        detectedLang: 'en',
        targetLang: 'zh',
        domain: 'general',
        matchedTerms: [],
      }),
    );
    expect(result.systemPrompt).not.toContain('Mandatory terminology');
  });

  it('uses auto-detected label when detectedLang is empty', async () => {
    const result = await buildPromptNode(
      makeState({
        detectedLang: '',
        targetLang: 'zh',
        domain: 'general',
        matchedTerms: [],
      }),
    );
    expect(result.systemPrompt).toContain('auto-detected');
  });

  it('includes medical domain instructions', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', domain: 'medical', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('medical/clinical terminology');
  });

  it('includes tech domain instructions', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', domain: 'tech', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('software/engineering');
  });

  it('quick mode produces minimal prompt', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', targetLang: 'zh', mode: 'quick', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('Output ONLY');
    expect(result.systemPrompt).not.toContain('Rewrite into natural');
  });

  it('normal mode includes baoyu-style principles', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', targetLang: 'zh', mode: 'normal', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('Rewrite into natural');
    expect(result.systemPrompt).toContain('Natural flow');
    expect(result.systemPrompt).toContain('Accuracy first');
  });

  it('normal mode zh includes anti-translationese rules', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', targetLang: 'zh', mode: 'normal', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('over-nominalization');
  });

  it('refined mode also uses baoyu-style principles', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', targetLang: 'zh', mode: 'refined', matchedTerms: [] }),
    );
    expect(result.systemPrompt).toContain('Rewrite into natural');
  });

  it('word lookup mode for short text', async () => {
    const result = await buildPromptNode(
      makeState({ text: 'serendipity', detectedLang: 'en', targetLang: 'zh', matchedTerms: [] }),
    );
    expect(result.isWordLookup).toBe(true);
    expect(result.systemPrompt).toContain('[Translation]');
    expect(result.systemPrompt).toContain('[Pronunciation]');
    expect(result.systemPrompt).toContain('[Meaning]');
    expect(result.systemPrompt).toContain('[Usage]');
  });

  it('word lookup mode for CJK idiom', async () => {
    const result = await buildPromptNode(
      makeState({ text: '塞翁失马', detectedLang: 'zh', targetLang: 'en', matchedTerms: [] }),
    );
    expect(result.isWordLookup).toBe(true);
    expect(result.systemPrompt).toContain('[Meaning]');
  });

  it('does not trigger word lookup for sentences', async () => {
    const result = await buildPromptNode(
      makeState({ detectedLang: 'en', targetLang: 'zh', matchedTerms: [] }),
    );
    expect(result.isWordLookup).toBeFalsy();
    expect(result.systemPrompt).toContain('professional translator');
  });
});

// ---------------------------------------------------------------------------
// buildRefinePromptNode
// ---------------------------------------------------------------------------

describe('buildRefinePromptNode', () => {
  it('includes source text and draft in refine prompt', async () => {
    const result = await buildRefinePromptNode(
      makeState({
        text: 'The quick brown fox jumps over the lazy dog',
        draftText: '敏捷的棕色狐狸跳过了懒惰的狗',
        targetLang: 'zh',
        domain: 'general',
        matchedTerms: [],
      }),
    );
    expect(result.refinePrompt).toContain('The quick brown fox jumps over the lazy dog');
    expect(result.refinePrompt).toContain('敏捷的棕色狐狸跳过了懒惰的狗');
    expect(result.refinePrompt).toContain('senior translation reviewer');
  });

  it('includes glossary in refine prompt when terms exist', async () => {
    const result = await buildRefinePromptNode(
      makeState({
        text: 'test',
        draftText: '测试',
        targetLang: 'zh',
        matchedTerms: [{ source: 'API', target: '接口' }],
      }),
    );
    expect(result.refinePrompt).toContain('"API" -> "接口"');
  });

  it('includes CJK-specific review criteria for zh target', async () => {
    const result = await buildRefinePromptNode(
      makeState({ text: 'test', draftText: '测试', targetLang: 'zh', matchedTerms: [] }),
    );
    expect(result.refinePrompt).toContain('over-nominalization');
  });
});

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

describe('validateBody', () => {
  it('rejects non-object body', () => {
    const r = validateBody(null);
    expect(r.valid).toBe(false);
  });

  it('rejects missing text', () => {
    const r = validateBody({ target_lang: 'zh' });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toContain('text');
  });

  it('rejects empty text', () => {
    const r = validateBody({ text: '   ', target_lang: 'zh' });
    expect(r.valid).toBe(false);
  });

  it('rejects text exceeding max length', () => {
    const r = validateBody({ text: 'a'.repeat(5001), target_lang: 'zh' });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toContain('5000');
  });

  it('rejects invalid target_lang', () => {
    const r = validateBody({ text: 'hello', target_lang: 'invalid' });
    expect(r.valid).toBe(false);
  });

  it('rejects auto as target_lang', () => {
    const r = validateBody({ text: 'hello', target_lang: 'auto' });
    expect(r.valid).toBe(false);
  });

  it('rejects missing target_lang', () => {
    const r = validateBody({ text: 'hello' });
    expect(r.valid).toBe(false);
  });

  it('rejects invalid source_lang', () => {
    const r = validateBody({ text: 'hello', target_lang: 'zh', source_lang: 'xxx' });
    expect(r.valid).toBe(false);
  });

  it('accepts valid request with defaults', () => {
    const r = validateBody({ text: 'hello', target_lang: 'zh' });
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.data.source_lang).toBe('auto');
      expect(r.data.domain).toBe('general');
      expect(r.data.mode).toBe('normal');
      expect(r.data.terms).toEqual([]);
    }
  });

  it('accepts valid request with all fields', () => {
    const r = validateBody({
      text: 'hello world',
      source_lang: 'en',
      target_lang: 'zh',
      domain: 'legal',
      mode: 'refined',
      terms: [{ source: 'contract', target: '合同' }],
    });
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.data.domain).toBe('legal');
      expect(r.data.mode).toBe('refined');
      expect(r.data.terms).toHaveLength(1);
    }
  });

  it('defaults invalid mode to normal', () => {
    const r = validateBody({ text: 'hello', target_lang: 'zh', mode: 'invalid' });
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.data.mode).toBe('normal');
  });
});
