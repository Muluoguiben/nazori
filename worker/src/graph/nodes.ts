import type { TranslationStateType } from './state';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;
const GEMINI_TIMEOUT_MS = 20_000;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

function buildGeminiRequest(systemPrompt: string, text: string) {
  return {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  };
}

function extractGeminiText(response: GeminiGenerateContentResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('') ?? ''
  );
}

function extractGeminiUsage(response: GeminiGenerateContentResponse) {
  return {
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

async function fetchGeminiGenerateContent(
  apiKey: string,
  systemPrompt: string,
  text: string,
): Promise<GeminiGenerateContentResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_BASE}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildGeminiRequest(systemPrompt, text)),
      signal: controller.signal,
    });

    const json = (await response.json()) as GeminiGenerateContentResponse;

    if (!response.ok) {
      throw new Error(json.error?.message || `Gemini request failed with ${response.status}`);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

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

function getTargetLanguageLabel(targetLang: string): string {
  switch (targetLang) {
    case 'zh':
      return 'Simplified Chinese (简体中文)';
    case 'zh-Hant':
      return 'Traditional Chinese (繁體中文)';
    case 'en':
      return 'English';
    case 'ja':
      return 'Japanese';
    case 'ko':
      return 'Korean';
    case 'fr':
      return 'French';
    case 'de':
      return 'German';
    case 'es':
      return 'Spanish';
    case 'ru':
      return 'Russian';
    case 'pt':
      return 'Portuguese';
    case 'it':
      return 'Italian';
    case 'ar':
      return 'Arabic';
    case 'et':
      return 'Estonian';
    default:
      return targetLang;
  }
}

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
  const targetLangLabel = getTargetLanguageLabel(targetLang);

  let system = `You are a professional translator. Translate the user-provided text from ${sourceLangLabel} to ${targetLangLabel}.\n\n`;
  system += `Domain: ${domain}\n${DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS.general}\n\n`;
  system += 'Rules:\n';
  system += '- Output ONLY the translated text. No explanations, notes, or commentary.\n';
  system += '- Preserve the original formatting (line breaks, punctuation style).\n';
  system += '- Do not transliterate proper nouns unless the target language convention demands it.\n';
  if (targetLang === 'zh') {
    system += '- Use Simplified Chinese characters only. Do not use Traditional Chinese.\n';
    system += '- Prefer Mainland China standard word choices and punctuation.\n';
  }
  if (targetLang === 'zh-Hant') {
    system += '- Use Traditional Chinese characters only. Do not use Simplified Chinese.\n';
    system += '- Prefer Taiwan standard word choices and punctuation.\n';
  }

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

export async function translateWithGemini(
  apiKey: string,
  systemPrompt: string,
  text: string,
): Promise<{ translatedText: string; usage: { inputTokens: number; outputTokens: number }; error: undefined }> {
  const response = await fetchGeminiGenerateContent(apiKey, systemPrompt, text);
  const translatedText = extractGeminiText(response);
  const usage = extractGeminiUsage(response);

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
