import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { TranslationStateType } from './state';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
const GEMINI_TIMEOUT_MS = 20_000;

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
  const { detectedLang, targetLang, domain, matchedTerms, mode } = state;

  const sourceLangLabel = detectedLang || 'auto-detected';
  const targetLangLabel = getTargetLanguageLabel(targetLang);

  // ── Quick mode: minimal prompt for speed ──
  if (mode === 'quick') {
    let system = `Translate from ${sourceLangLabel} to ${targetLangLabel}. Output ONLY the translated text.\n`;
    system += DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS.general;
    if (targetLang === 'zh') system += '\nUse Simplified Chinese only.';
    if (targetLang === 'zh-Hant') system += '\nUse Traditional Chinese only.';
    if (matchedTerms && matchedTerms.length > 0) {
      system += '\nGlossary:\n';
      for (const t of matchedTerms) system += `  "${t.source}" -> "${t.target}"\n`;
    }
    return { systemPrompt: system };
  }

  // ── Normal / Refined: baoyu-style principles ──
  let system = `You are a professional translator. Translate the user-provided text from ${sourceLangLabel} to ${targetLangLabel}.\n\n`;
  system += `Domain: ${domain}\n${DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS.general}\n\n`;

  system += 'Translation principles:\n';
  system += `- Rewrite into natural, engaging ${targetLangLabel} — not merely translate. Every sentence should read as if a skilled native writer composed it from scratch.\n`;
  system += '- Accuracy first: facts, data, and logic must match the original exactly.\n';
  system += `- Natural flow: use idiomatic ${targetLangLabel} word order. Break long source sentences into shorter, natural ones. Interpret metaphors and idioms by intended meaning, not word-for-word.\n`;
  system += '- Preserve the original formatting (line breaks, punctuation style).\n';
  system += '- Do not transliterate proper nouns unless the target language convention demands it.\n';

  if (targetLang === 'zh') {
    system += '- Use Simplified Chinese characters only. Prefer Mainland China standard word choices and punctuation.\n';
    system += '- Avoid unnecessary connectives (因此/然而/此外), passive voice abuse (被/由/受到), and over-nominalization.\n';
  }
  if (targetLang === 'zh-Hant') {
    system += '- Use Traditional Chinese characters only. Prefer Taiwan standard word choices and punctuation.\n';
  }

  system += '\nRules:\n';
  system += '- Output ONLY the translated text. No explanations, notes, or commentary.\n';

  if (matchedTerms && matchedTerms.length > 0) {
    system += '\nMandatory terminology (use these exact translations consistently; annotate with original in parentheses on first occurrence):\n';
    for (const t of matchedTerms) {
      system += `  "${t.source}" -> "${t.target}"\n`;
    }
  }

  return { systemPrompt: system };
}

// ── Node: Build Refine Prompt (refined mode only) ────────────────────

export async function buildRefinePromptNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { text, draftText, targetLang, domain, matchedTerms } = state;

  const targetLangLabel = getTargetLanguageLabel(targetLang);

  let prompt = `You are a senior translation reviewer. Below is a source text and its draft translation into ${targetLangLabel} (domain: ${domain}).\n\n`;
  prompt += 'Your task: critically review the draft, then produce a polished final translation.\n\n';

  prompt += '## Review criteria\n';
  prompt += '1. **Accuracy**: Compare each sentence against the source. Flag content accidentally added, removed, or altered. Verify facts, numbers, proper nouns.\n';
  prompt += '2. **Native voice**: Flag sentences that read as "translated" rather than "written". Check for unnatural word order, calques, stiff phrasing.\n';
  if (targetLang === 'zh' || targetLang === 'zh-Hant') {
    prompt += '   - For Chinese: check for unnecessary connectives (因此/然而/此外), passive voice abuse (被/由/受到), noun pile-ups, over-nominalization.\n';
  }
  prompt += '3. **Terminology**: Verify glossary terms are applied consistently.\n';
  prompt += `4. **Flow**: Read the translation as a standalone ${targetLangLabel} piece — does it flow naturally?\n\n`;

  if (matchedTerms && matchedTerms.length > 0) {
    prompt += 'Glossary:\n';
    for (const t of matchedTerms) prompt += `  "${t.source}" -> "${t.target}"\n`;
    prompt += '\n';
  }

  prompt += '## Instructions\n';
  prompt += '- Fix all accuracy issues, rewrite unnatural expressions, ensure consistent terminology.\n';
  prompt += '- Output ONLY the final polished translation. No commentary, no review notes.\n\n';

  prompt += `## Source text\n${text}\n\n`;
  prompt += `## Draft translation\n${draftText}\n`;

  return { refinePrompt: prompt };
}

// ── Node: Refine (critique + revise in one LLM pass) ─────────────────

const REFINE_SYSTEM = 'You are a senior translation reviewer. Follow the instructions in the user message exactly. Output ONLY the final polished translation.';

export async function refineNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { refinePrompt, draftText, geminiApiKey, ai } = state;

  if (geminiApiKey) {
    try {
      const result = await translateWithGemini(geminiApiKey, REFINE_SYSTEM, refinePrompt);
      return { translatedText: result.translatedText, modelUsed: 'gemini-2.0-flash', usage: result.usage };
    } catch (err: unknown) {
      console.warn('Gemini refine failed, falling back:', err instanceof Error ? err.message : err);
    }
  }

  if (ai) {
    try {
      const result = await translateWithWorkersAI(ai, REFINE_SYSTEM, refinePrompt);
      return { translatedText: result.translatedText, modelUsed: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', usage: result.usage };
    } catch {
      return { translatedText: draftText };
    }
  }

  return { translatedText: draftText };
}

// ── Node: Translate (Gemini primary → Workers AI fallback) ────────────

export async function translateNode(
  state: TranslationStateType,
): Promise<Partial<TranslationStateType>> {
  const { text, systemPrompt, geminiApiKey, ai, mode } = state;

  let translatedText = '';
  let modelUsed = 'none';
  let usage = { inputTokens: 0, outputTokens: 0 };

  // Try Gemini first
  if (geminiApiKey) {
    try {
      const result = await translateWithGemini(geminiApiKey, systemPrompt, text);
      translatedText = result.translatedText;
      usage = result.usage;
      modelUsed = 'gemini-2.0-flash';
    } catch (err: unknown) {
      console.warn('Gemini failed, falling back to Workers AI:', err instanceof Error ? err.message : err);
    }
  }

  // Fallback to Cloudflare Workers AI
  if (!translatedText && ai) {
    try {
      const result = await translateWithWorkersAI(ai, systemPrompt, text);
      translatedText = result.translatedText;
      modelUsed = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'All translation models failed';
      return { translatedText: '', usage, modelUsed: 'none', error: message };
    }
  }

  if (!translatedText) {
    return { translatedText: '', usage, modelUsed: 'none', error: 'No model available. Set GEMINI_API_KEY or enable Workers AI binding.' };
  }

  // For refined mode, save as draft and let refine nodes produce final output
  if (mode === 'refined') {
    return { draftText: translatedText, translatedText: '', modelUsed, usage };
  }

  return { translatedText, modelUsed, usage };
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

  const response = await model.invoke(
    [new SystemMessage(systemPrompt), new HumanMessage(text)],
    { signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS) },
  );

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

// ── Gemini native SSE streaming (bypasses LangChain for lower TTFB) ──

export async function* streamGeminiNative(
  apiKey: string,
  systemPrompt: string,
  text: string,
): AsyncGenerator<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini stream failed (${response.status}): ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6);
        if (json === '[DONE]') return;

        try {
          const parsed = JSON.parse(json);
          const chunk = parsed.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? '')
            .join('');
          if (chunk) yield chunk;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}
