import { Context } from 'hono';
import type { AppEnv, TranslateMode, TranslateRequestBody } from '../types';
import { fullGraph, prepGraph } from '../graph';
import { streamGeminiNative, buildRefinePromptNode } from '../graph/nodes';
import type { TranslationStateType } from '../graph/state';

const MAX_TEXT_LENGTH = 5000;

const VALID_DOMAINS = new Set(['general', 'legal', 'medical', 'tech']);
const VALID_MODES = new Set<TranslateMode>(['quick', 'normal', 'refined']);

const VALID_LANG_CODES = new Set([
  'auto', 'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'ceb', 'cs',
  'cy', 'da', 'de', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fr',
  'ga', 'gd', 'gl', 'gu', 'ha', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id',
  'ig', 'is', 'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'ku', 'ky',
  'la', 'lb', 'lo', 'lt', 'lv', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms',
  'mt', 'my', 'ne', 'nl', 'no', 'ny', 'or', 'pa', 'pl', 'ps', 'pt', 'ro',
  'ru', 'rw', 'sd', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'st',
  'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'ug',
  'uk', 'ur', 'uz', 'vi', 'xh', 'yi', 'yo', 'zh', 'zh-Hant', 'zu',
]);

function validateBody(body: unknown): { valid: true; data: TranslateRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.text !== 'string' || b.text.trim().length === 0) {
    return { valid: false, error: '`text` is required and must be a non-empty string' };
  }
  if (b.text.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: `\`text\` must be at most ${MAX_TEXT_LENGTH} characters` };
  }

  const sourceLang = typeof b.source_lang === 'string' ? b.source_lang : 'auto';
  if (!VALID_LANG_CODES.has(sourceLang)) {
    return { valid: false, error: `Invalid \`source_lang\`: ${sourceLang}` };
  }

  if (typeof b.target_lang !== 'string' || !VALID_LANG_CODES.has(b.target_lang) || b.target_lang === 'auto') {
    return { valid: false, error: '`target_lang` is required and must be a valid language code (not "auto")' };
  }

  const domain = typeof b.domain === 'string' ? b.domain : 'general';
  if (!VALID_DOMAINS.has(domain)) {
    return { valid: false, error: `Invalid \`domain\`: ${domain}` };
  }

  let terms: { source: string; target: string }[] = [];
  if (b.terms !== undefined) {
    if (!Array.isArray(b.terms)) {
      return { valid: false, error: '`terms` must be an array' };
    }
    for (const t of b.terms) {
      if (
        !t ||
        typeof t !== 'object' ||
        typeof (t as Record<string, unknown>).source !== 'string' ||
        typeof (t as Record<string, unknown>).target !== 'string'
      ) {
        return { valid: false, error: 'Each entry in `terms` must have `source` and `target` strings' };
      }
    }
    terms = b.terms as { source: string; target: string }[];
  }

  const mode = typeof b.mode === 'string' && VALID_MODES.has(b.mode as TranslateMode)
    ? (b.mode as TranslateMode)
    : 'normal';

  return {
    valid: true,
    data: {
      text: b.text as string,
      source_lang: sourceLang,
      target_lang: b.target_lang as string,
      domain: domain as TranslateRequestBody['domain'],
      terms,
      mode,
    },
  };
}

/**
 * Streaming translate handler.
 *
 * Runs the prep graph (detect → match → prompt) via LangGraph, then
 * streams translation via Gemini native SSE for lower TTFB.
 */
export async function translateHandler(c: Context<AppEnv>) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const result = validateBody(body);
  if (!result.valid) {
    return c.json({ error: result.error }, 400);
  }

  const { data } = result;

  // Run prep graph: detectLanguage → matchTerms → buildPrompt
  const preparedState = await prepGraph.invoke({
    text: data.text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    domain: data.domain,
    inputTerms: data.terms,
    mode: data.mode,
    geminiApiKey: '',
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
  });

  // ── Same-language short-circuit ──────────────────────────────────────
  if (preparedState.detectedLang === data.target_lang) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const emit = (d: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));
        };
        emit({ type: 'text_delta', text: data.text });
        emit({
          type: 'message_stop',
          mode: data.mode,
          modelUsed: 'none',
          detectedLang: preparedState.detectedLang,
          matchedTerms: preparedState.matchedTerms,
          sameLanguage: true,
          usage: { inputTokens: 0, outputTokens: 0 },
        });
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (d: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));
      };

      let modelUsed = 'none';

      // ── Helper: stream or call a single translation pass ─────────
      async function translatePass(
        systemPrompt: string,
        inputText: string,
      ): Promise<{ text: string; model: string } | null> {
        // Try Gemini native SSE streaming
        if (c.env.GEMINI_API_KEY) {
          try {
            let fullText = '';
            for await (const chunk of streamGeminiNative(
              c.env.GEMINI_API_KEY,
              systemPrompt,
              inputText,
            )) {
              emit({ type: 'text_delta', text: chunk });
              fullText += chunk;
            }
            return { text: fullText, model: 'gemini-2.0-flash' };
          } catch (err: unknown) {
            console.warn('Gemini streaming failed, trying Workers AI fallback:', err instanceof Error ? err.message : err);
            emit({ type: 'text_reset' });
          }
        }

        // Fallback: Workers AI (non-streaming)
        if (c.env.AI) {
          try {
            const response = await c.env.AI.run(
              '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
              {
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: inputText },
                ],
                max_tokens: 4096,
              },
            );
            const text = (response as { response: string }).response || '';
            emit({ type: 'text_delta', text });
            return { text, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' };
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Workers AI failed';
            emit({ type: 'error', error: message });
            controller.close();
            return null;
          }
        }

        emit({ type: 'error', error: 'No model available. Set GEMINI_API_KEY or enable Workers AI.' });
        controller.close();
        return null;
      }

      // ── Phase 1: translate ────────────────────────────────────────
      const draft = await translatePass(preparedState.systemPrompt, preparedState.text);
      if (!draft) return;
      modelUsed = draft.model;

      // ── Phase 2: refine (refined mode only) ───────────────────────
      if (data.mode === 'refined' && draft.text) {
        // Build refine prompt using the graph node
        const refineState = await buildRefinePromptNode({
          ...preparedState,
          draftText: draft.text,
        } as TranslationStateType);

        const REFINE_SYSTEM = 'You are a senior translation reviewer. Follow the instructions in the user message exactly. Output ONLY the final polished translation.';
        let refineStarted = false;
        const startRefine = () => {
          if (refineStarted) return;
          emit({ type: 'refine_start' });
          emit({ type: 'text_reset' });
          refineStarted = true;
        };

        let refined: { text: string; model: string } | null = null;

        if (c.env.GEMINI_API_KEY) {
          try {
            let fullText = '';
            for await (const chunk of streamGeminiNative(
              c.env.GEMINI_API_KEY,
              REFINE_SYSTEM,
              refineState.refinePrompt!,
            )) {
              startRefine();
              emit({ type: 'text_delta', text: chunk });
              fullText += chunk;
            }

            if (fullText) {
              refined = { text: fullText, model: 'gemini-2.0-flash' };
            }
          } catch (err: unknown) {
            console.warn('Gemini refine streaming failed, trying Workers AI fallback:', err instanceof Error ? err.message : err);
          }
        }

        if (!refined && c.env.AI) {
          if (refineStarted) {
            emit({ type: 'text_reset' });
          }

          try {
            const response = await c.env.AI.run(
              '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
              {
                messages: [
                  { role: 'system', content: REFINE_SYSTEM },
                  { role: 'user', content: refineState.refinePrompt! },
                ],
                max_tokens: 4096,
              },
            );
            const text = (response as { response: string }).response || '';

            if (text) {
              startRefine();
              emit({ type: 'text_delta', text });
              refined = { text, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' };
            }
          } catch (err: unknown) {
            console.warn('Workers AI refine fallback failed, keeping draft translation:', err instanceof Error ? err.message : err);
          }
        }

        if (refined) {
          modelUsed = refined.model;
        } else if (refineStarted) {
          emit({ type: 'text_reset' });
          emit({ type: 'text_delta', text: draft.text });
        }
      }

      emit({
        type: 'message_stop',
        mode: data.mode,
        modelUsed,
        detectedLang: preparedState.detectedLang,
        matchedTerms: preparedState.matchedTerms,
        isWordLookup: preparedState.isWordLookup,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Non-streaming translate handler — runs the full LangGraph end-to-end.
 */
export async function translateFullHandler(c: Context<AppEnv>) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const result = validateBody(body);
  if (!result.valid) {
    return c.json({ error: result.error }, 400);
  }

  const { data } = result;

  // ── Same-language short-circuit ──────────────────────────────────────
  const prepState = await prepGraph.invoke({
    text: data.text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    domain: data.domain,
    inputTerms: data.terms,
    mode: data.mode,
    geminiApiKey: '',
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
  });

  if (prepState.detectedLang === data.target_lang) {
    return c.json({
      translatedText: data.text,
      detectedLang: prepState.detectedLang,
      matchedTerms: prepState.matchedTerms,
      modelUsed: 'none',
      sameLanguage: true,
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  }

  const finalState = await fullGraph.invoke({
    text: data.text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    domain: data.domain,
    inputTerms: data.terms,
    mode: data.mode,
    geminiApiKey: c.env.GEMINI_API_KEY || '',
    ai: c.env.AI || null,
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
  });

  if (finalState.error) {
    return c.json({ error: finalState.error }, 500);
  }

  return c.json({
    translatedText: finalState.translatedText,
    detectedLang: finalState.detectedLang,
    matchedTerms: finalState.matchedTerms,
    modelUsed: finalState.modelUsed,
    usage: finalState.usage,
  });
}

export { validateBody };
