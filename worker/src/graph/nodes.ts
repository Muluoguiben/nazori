import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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

  for (const [pattern, lang] of LANG_PATTERNS) {
    if (pattern.test(text)) {
      return { detectedLang: lang };
    }
  }

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

// ── Node: Translate (Gemini primary → Workers AI fallback) ────────────

export async function translateNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { text, systemPrompt, geminiApiKey, ai } = state;

  // Try Gemini first
  if (geminiApiKey) {
    try {
      const result = await translateWithGemini(geminiApiKey, systemPrompt, text);
      return { ...result, modelUsed: 'gemini-2.0-flash' };
    } catch (err: unknown) {
      console.warn('Gemini failed, falling back to Workers AI:', err instanceof Error ? err.message : err);
    }
  }

  // Fallback to Cloudflare Workers AI
  if (ai) {
    try {
      const result = await translateWithWorkersAI(ai, systemPrompt, text);
      return { ...result, modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'All translation models failed';
      return {
        translatedText: '',
        usage: { inputTokens: 0, outputTokens: 0 },
        modelUsed: 'none',
        error: message,
      };
    }
  }

  return {
    translatedText: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    modelUsed: 'none',
    error: 'No model available. Set GEMINI_API_KEY or enable Workers AI binding.',
  };
}

// ── Gemini via LangChain ──────────────────────────────────────────────

async function translateWithGemini(
  apiKey: string,
  systemPrompt: string,
  text: string,
): Promise<{ translatedText: string; usage: { inputTokens: number; outputTokens: number }; error: undefined }> {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    maxOutputTokens: 4096,
    apiKey,
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
}

// ── Cloudflare Workers AI (native binding) ────────────────────────────

async function translateWithWorkersAI(
  ai: Ai,
  systemPrompt: string,
  text: string,
): Promise<{ translatedText: string; usage: { inputTokens: number; outputTokens: number }; error: undefined }> {
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    max_tokens: 4096,
  });

  // Workers AI returns { response: string } for non-streaming
  const translatedText = (response as { response: string }).response || '';

  return {
    translatedText,
    usage: { inputTokens: 0, outputTokens: 0 }, // Workers AI doesn't report token usage
    error: undefined,
  };
}

// ── Exported helpers for streaming in route handler ───────────────────

export function createGeminiStreamingModel(apiKey: string) {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    maxOutputTokens: 4096,
    apiKey,
    streaming: true,
  });
}
