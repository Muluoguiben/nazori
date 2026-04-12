import { Context } from 'hono';
import type { AppEnv } from '../types';
import { streamGeminiNative } from '../graph/nodes';

const MAX_TEXT_LENGTH = 5000;

interface ExplainRequestBody {
  originalText: string;
  translatedText: string;
  question: string;
  targetLang: string;
}

function validateExplainBody(
  body: unknown,
): { valid: true; data: ExplainRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.originalText !== 'string' || b.originalText.trim().length === 0) {
    return { valid: false, error: '`originalText` is required' };
  }
  if (b.originalText.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: '`originalText` too long' };
  }
  if (typeof b.translatedText !== 'string') {
    return { valid: false, error: '`translatedText` is required' };
  }
  if (typeof b.question !== 'string' || b.question.trim().length === 0) {
    return { valid: false, error: '`question` is required' };
  }
  if (b.question.length > 500) {
    return { valid: false, error: '`question` must be at most 500 characters' };
  }
  if (typeof b.targetLang !== 'string' || b.targetLang.trim().length === 0) {
    return { valid: false, error: '`targetLang` is required' };
  }

  return {
    valid: true,
    data: {
      originalText: b.originalText as string,
      translatedText: b.translatedText as string,
      question: b.question as string,
      targetLang: b.targetLang as string,
    },
  };
}

function buildExplainPrompt(data: ExplainRequestBody): { system: string; user: string } {
  const system =
    `You are a helpful language tutor. The user translated some text and has a follow-up question. ` +
    `Answer in ${data.targetLang}. Be concise, clear, and practical. ` +
    `If the question is about grammar, explain the structure. ` +
    `If about meaning, explain nuance and context. ` +
    `If about usage, give examples.`;

  const user =
    `Original text: ${data.originalText}\n` +
    `Translation: ${data.translatedText}\n\n` +
    `Question: ${data.question}`;

  return { system, user };
}

export async function explainHandler(c: Context<AppEnv>) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const result = validateExplainBody(body);
  if (!result.valid) {
    return c.json({ error: result.error }, 400);
  }

  const { data } = result;
  const { system, user } = buildExplainPrompt(data);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (d: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));
      };

      // Try Gemini
      if (c.env.GEMINI_API_KEY) {
        try {
          for await (const chunk of streamGeminiNative(c.env.GEMINI_API_KEY, system, user)) {
            emit({ type: 'text_delta', text: chunk });
          }
          emit({ type: 'message_stop' });
          controller.close();
          return;
        } catch (err: unknown) {
          console.warn('Gemini explain failed, trying Workers AI:', err instanceof Error ? err.message : err);
        }
      }

      // Fallback: Workers AI
      if (c.env.AI) {
        try {
          const response = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            max_tokens: 4096,
          });
          const text = (response as { response: string }).response || '';
          emit({ type: 'text_delta', text });
          emit({ type: 'message_stop' });
          controller.close();
          return;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Workers AI failed';
          emit({ type: 'error', error: message });
          controller.close();
          return;
        }
      }

      emit({ type: 'error', error: 'No model available' });
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

export { validateExplainBody };
