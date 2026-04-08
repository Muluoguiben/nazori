import { Context } from 'hono';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AppEnv, TranslateRequestBody } from '../types';
import {
  buildTranslationGraph,
  detectLanguageNode,
  matchTermsNode,
  buildPromptNode,
} from '../graph';

const MAX_TEXT_LENGTH = 5000;

const VALID_DOMAINS = new Set(['general', 'legal', 'medical', 'tech']);

const VALID_LANG_CODES = new Set([
  'auto', 'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'ceb', 'cs',
  'cy', 'da', 'de', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fr',
  'ga', 'gd', 'gl', 'gu', 'ha', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id',
  'ig', 'is', 'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'ku', 'ky',
  'la', 'lb', 'lo', 'lt', 'lv', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms',
  'mt', 'my', 'ne', 'nl', 'no', 'ny', 'or', 'pa', 'pl', 'ps', 'pt', 'ro',
  'ru', 'rw', 'sd', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'st',
  'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'ug',
  'uk', 'ur', 'uz', 'vi', 'xh', 'yi', 'yo', 'zh', 'zu',
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

  return {
    valid: true,
    data: {
      text: b.text as string,
      source_lang: sourceLang,
      target_lang: b.target_lang as string,
      domain: domain as TranslateRequestBody['domain'],
      terms,
    },
  };
}

/**
 * Streaming translate handler using LangGraph.
 *
 * Runs the graph nodes (detectLanguage → matchTerms → buildPrompt) to prepare
 * the prompt, then streams the Claude response token-by-token via SSE.
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
  const apiKey = c.env.CLAUDE_API_KEY;

  // Run the pre-translation graph nodes to build the prompt
  const initialState = {
    text: data.text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    domain: data.domain,
    inputTerms: data.terms,
    apiKey,
    detectedLang: '',
    matchedTerms: [] as { source: string; target: string }[],
    systemPrompt: '',
    translatedText: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    error: undefined,
  };

  // Execute detect → match → buildPrompt nodes sequentially
  const afterDetect = await detectLanguageNode(initialState);
  const stateAfterDetect = { ...initialState, ...afterDetect };

  const afterMatch = await matchTermsNode(stateAfterDetect);
  const stateAfterMatch = { ...stateAfterDetect, ...afterMatch };

  const afterPrompt = await buildPromptNode(stateAfterMatch);
  const preparedState = { ...stateAfterMatch, ...afterPrompt };

  // Stream the translation using LangChain's ChatAnthropic
  const model = new ChatAnthropic({
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    anthropicApiKey: apiKey,
    streaming: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const langchainStream = await model.stream([
          new SystemMessage(preparedState.systemPrompt),
          new HumanMessage(preparedState.text),
        ]);

        let fullText = '';

        for await (const chunk of langchainStream) {
          const text =
            typeof chunk.content === 'string'
              ? chunk.content
              : chunk.content
                  .filter((c) => c.type === 'text')
                  .map((c) => ('text' in c ? c.text : ''))
                  .join('');

          if (text) {
            fullText += text;
            emit({ type: 'text_delta', text });
          }
        }

        emit({
          type: 'message_stop',
          detectedLang: preparedState.detectedLang,
          matchedTerms: preparedState.matchedTerms,
        });

        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Translation failed';
        emit({ type: 'error', error: message });
        controller.close();
      }
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
 * Useful for batch/API consumers that don't need SSE.
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

  const graph = buildTranslationGraph();

  const finalState = await graph.invoke({
    text: data.text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    domain: data.domain,
    inputTerms: data.terms,
    apiKey: c.env.CLAUDE_API_KEY,
    detectedLang: '',
    matchedTerms: [],
    systemPrompt: '',
    translatedText: '',
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
    usage: finalState.usage,
  });
}

export { validateBody };
