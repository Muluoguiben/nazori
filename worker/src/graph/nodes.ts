import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { TranslationStateType } from './state';

// ── Domain-specific instructions ──────────────────────────────────────

const DOMAIN_INSTRUCTIONS: Record<string, string> = {
  general: 'Translate naturally and idiomatically for a general audience.',
  legal:
    'Use precise legal terminology. Preserve formal register, defined terms, and legal conventions of the target language.',
  medical:
    'Use standard medical/clinical terminology. Maintain precision for drug names, anatomical terms, and diagnostic language.',
  tech:
    'Use standard software/engineering terminology. Keep code identifiers, API names, and technical acronyms untranslated where conventional.',
};

// ── Unicode-based language detection ──────────────────────────────────

const LANG_PATTERNS: [RegExp, string][] = [
  [/[\u3040-\u309F\u30A0-\u30FF]/u, 'ja'],
  [/[\uAC00-\uD7AF]/u, 'ko'],
  [/[\u0600-\u06FF]/u, 'ar'],
  [/[\u0400-\u04FF]/u, 'ru'],
  [/[\u4E00-\u9FFF]/u, 'zh'],
];

const WORD_PATTERNS: [RegExp, string][] = [
  [/\b(the|is|and|of|to|in|that|for|with)\b/i, 'en'],
  [/\b(le|la|les|de|et|est|un|une|des|du)\b/i, 'fr'],
  [/\b(der|die|das|und|ist|ein|eine|nicht|auch)\b/i, 'de'],
  [/\b(el|la|los|las|de|en|que|por|con|una)\b/i, 'es'],
  [/[šžõ]/i, 'et'],
  [/\b(o|a|os|as|de|em|que|não|um|uma)\b/i, 'pt'],
  [/\b(il|la|di|che|è|un|una|non|per)\b/i, 'it'],
];

// ── Node: Detect Language ─────────────────────────────────────────────

export async function detectLanguageNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  if (state.sourceLang !== 'auto') {
    return { detectedLang: state.sourceLang };
  }

  const text = state.text;

  // Check Unicode ranges first
  for (const [pattern, lang] of LANG_PATTERNS) {
    if (pattern.test(text)) {
      return { detectedLang: lang };
    }
  }

  // Check word patterns for Latin-script languages
  for (const [pattern, lang] of WORD_PATTERNS) {
    if (pattern.test(text)) {
      return { detectedLang: lang };
    }
  }

  return { detectedLang: 'en' };
}

// ── Node: Match Terms ─────────────────────────────────────────────────

export async function matchTermsNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { text, inputTerms } = state;

  if (!inputTerms || inputTerms.length === 0) {
    return { matchedTerms: [] };
  }

  const lowerText = text.toLowerCase();
  const matched = inputTerms.filter((term) =>
    lowerText.includes(term.source.toLowerCase()),
  );

  return { matchedTerms: matched };
}

// ── Node: Build Prompt ────────────────────────────────────────────────

export async function buildPromptNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { detectedLang, targetLang, domain, matchedTerms } = state;

  const sourceLangLabel = detectedLang || 'auto-detected';

  let system = `You are a professional translator. Translate the user-provided text from ${sourceLangLabel} to ${targetLang}.\n\n`;
  system += `Domain: ${domain}\n${DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS.general}\n\n`;
  system += 'Rules:\n';
  system += '- Output ONLY the translated text. No explanations, notes, or commentary.\n';
  system += '- Preserve the original formatting (line breaks, punctuation style).\n';
  system += '- Do not transliterate proper nouns unless the target language convention demands it.\n';

  if (matchedTerms && matchedTerms.length > 0) {
    system +=
      '\nMandatory terminology (you MUST use these exact translations when the source term appears):\n';
    for (const t of matchedTerms) {
      system += `  "${t.source}" -> "${t.target}"\n`;
    }
  }

  return { systemPrompt: system };
}

// ── Node: Translate (Claude API via LangChain) ────────────────────────

export async function translateNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { text, systemPrompt, apiKey } = state;

  try {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
      anthropicApiKey: apiKey,
    });

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(text),
    ]);

    const translatedText =
      typeof response.content === 'string'
        ? response.content
        : response.content
            .filter((c) => c.type === 'text')
            .map((c) => ('text' in c ? c.text : ''))
            .join('');

    const usage = response.usage_metadata
      ? {
          inputTokens: response.usage_metadata.input_tokens,
          outputTokens: response.usage_metadata.output_tokens,
        }
      : { inputTokens: 0, outputTokens: 0 };

    return { translatedText, usage, error: undefined };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Translation failed';
    return {
      translatedText: '',
      usage: { inputTokens: 0, outputTokens: 0 },
      error: message,
    };
  }
}

// ── Node: Translate with Streaming ────────────────────────────────────

export function createStreamingTranslateNode(apiKey: string) {
  const model = new ChatAnthropic({
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    anthropicApiKey: apiKey,
    streaming: true,
  });

  return { model };
}
