import { Context } from 'hono';
import type { AppEnv, TranslateRequestBody } from '../types';
import { streamTranslation } from '../services/claude';

const MAX_TEXT_LENGTH = 5000;

const VALID_DOMAINS = new Set(['general', 'legal', 'medical', 'tech']);

// ISO 639-1 codes (non-exhaustive but covers common languages).
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

  // text
  if (typeof b.text !== 'string' || b.text.trim().length === 0) {
    return { valid: false, error: '`text` is required and must be a non-empty string' };
  }
  if (b.text.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: `\`text\` must be at most ${MAX_TEXT_LENGTH} characters` };
  }

  // source_lang
  const sourceLang = typeof b.source_lang === 'string' ? b.source_lang : 'auto';
  if (!VALID_LANG_CODES.has(sourceLang)) {
    return { valid: false, error: `Invalid \`source_lang\`: ${sourceLang}` };
  }

  // target_lang
  if (typeof b.target_lang !== 'string' || !VALID_LANG_CODES.has(b.target_lang) || b.target_lang === 'auto') {
    return { valid: false, error: '`target_lang` is required and must be a valid language code (not "auto")' };
  }

  // domain
  const domain = typeof b.domain === 'string' ? b.domain : 'general';
  if (!VALID_DOMAINS.has(domain)) {
    return { valid: false, error: `Invalid \`domain\`: ${domain}` };
  }

  // terms
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

  const stream = streamTranslation(c.env, result.data);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
