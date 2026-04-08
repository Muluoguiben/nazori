import type { Env, TranslateRequestBody } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 4096;

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const DOMAIN_INSTRUCTIONS: Record<TranslateRequestBody['domain'], string> = {
  general: 'Translate naturally and idiomatically for a general audience.',
  legal:
    'Use precise legal terminology. Preserve formal register, defined terms, and legal conventions of the target language.',
  medical:
    'Use standard medical/clinical terminology. Maintain precision for drug names, anatomical terms, and diagnostic language.',
  tech:
    'Use standard software/engineering terminology. Keep code identifiers, API names, and technical acronyms untranslated where conventional.',
};

export function buildPrompt(params: TranslateRequestBody): {
  system: string;
  userMessage: string;
} {
  const { text, source_lang, target_lang, domain, terms } = params;

  const sourceLangLabel = source_lang === 'auto' ? 'auto-detected' : source_lang;

  let system = `You are a professional translator. Translate the user-provided text from ${sourceLangLabel} to ${target_lang}.\n\n`;
  system += `Domain: ${domain}\n${DOMAIN_INSTRUCTIONS[domain]}\n\n`;
  system += 'Rules:\n';
  system += '- Output ONLY the translated text. No explanations, notes, or commentary.\n';
  system += '- Preserve the original formatting (line breaks, punctuation style).\n';
  system += '- Do not transliterate proper nouns unless the target language convention demands it.\n';

  if (terms.length > 0) {
    system += '\nMandatory terminology (you MUST use these exact translations when the source term appears):\n';
    for (const t of terms) {
      system += `  "${t.source}" -> "${t.target}"\n`;
    }
  }

  const userMessage = text;

  return { system, userMessage };
}

// ---------------------------------------------------------------------------
// Streaming translation via Claude API
// ---------------------------------------------------------------------------

export function streamTranslation(
  env: Env,
  params: TranslateRequestBody,
): ReadableStream {
  const { system, userMessage } = buildPrompt(params);

  const body = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    stream: true,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  // We return a ReadableStream that the caller can pipe directly into a Response.
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const emit = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const response = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.CLAUDE_API_KEY,
            'anthropic-version': ANTHROPIC_VERSION,
          },
          body,
        });

        if (!response.ok) {
          const errorText = await response.text();
          emit({ type: 'error', error: `Claude API error ${response.status}: ${errorText}` });
          controller.close();
          return;
        }

        if (!response.body) {
          emit({ type: 'error', error: 'No response body from Claude API' });
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Claude SSE events are separated by double newlines.
          const parts = buffer.split('\n\n');
          // The last element may be an incomplete chunk; keep it in the buffer.
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const lines = part.split('\n');
            let eventType = '';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                eventData += line.slice(6);
              }
            }

            if (!eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                emit({ type: 'text_delta', text: parsed.delta.text });
              } else if (eventType === 'message_stop') {
                // Usage is on the preceding message_delta event; we forward
                // a stop event so the client knows the stream is complete.
                emit({ type: 'message_stop' });
              } else if (eventType === 'message_delta' && parsed.usage) {
                emit({ type: 'message_stop', usage: parsed.usage });
              } else if (eventType === 'error') {
                emit({ type: 'error', error: parsed.error?.message ?? 'Unknown Claude error' });
              }
            } catch {
              // Non-JSON lines (e.g. "event: ping") are safe to ignore.
            }
          }
        }

        // Process any remaining buffer content.
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          let eventData = '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              eventData += line.slice(6);
            }
          }
          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.delta?.type === 'text_delta') {
                emit({ type: 'text_delta', text: parsed.delta.text });
              }
            } catch {
              // Ignore partial data.
            }
          }
        }

        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error during translation';
        emit({ type: 'error', error: message });
        controller.close();
      }
    },
  });
}
