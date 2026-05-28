import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { EvalResult } from '@/lib/types';
import { saveRep } from '@/lib/db';

export const runtime = 'nodejs';

const SYSTEM_RUBRIC = `You are an English speaking coach for technical job interviews.
Grade a spoken explanation on a 1-10 scale across:
- accuracy: Does the explanation match the concept correctly?
- structure: Does it go intro -> mechanism -> tradeoff/example?
- language: Grammar, word choice, and vocabulary appropriate for a senior engineering audience.
- pace: target 110-150 wpm. The pace_wpm value is provided to you; echo it back unchanged.
Be specific in the fixes and quote the speaker's actual words. Return exactly 3 fixes.
inline_correction is the transcript rewritten so the most important fixes are wrapped in **double asterisks**.
Return strict JSON only.`;

const EVAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        accuracy: { type: 'integer', description: '1-10' },
        structure: { type: 'integer', description: '1-10' },
        language: { type: 'integer', description: '1-10' },
        pace_wpm: { type: 'integer', description: 'words per minute (provided in the prompt)' },
      },
      required: ['accuracy', 'structure', 'language', 'pace_wpm'],
    },
    inline_correction: {
      type: 'string',
      description: 'the transcript with the most important fixes wrapped in **double asterisks**',
    },
    fixes: {
      type: 'array',
      items: { type: 'string' },
      description: 'exactly three specific, actionable fixes',
    },
  },
  required: ['scores', 'inline_correction', 'fixes'],
};

function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length;
}

function demoEval(transcript: string, wpm: number): EvalResult {
  return {
    scores: { accuracy: 7, structure: 6, language: 7, pace_wpm: wpm },
    inline_correction: transcript.replace(/\bremembers\b/gi, '**captures**'),
    fixes: [
      'Use "captures" instead of "remembers" — it is the precise term for a senior audience.',
      'Open with a one-sentence definition before you explain the mechanism.',
      'End with a concrete example to anchor the concept.',
    ],
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    promptTerm?: string;
    promptText?: string;
    transcript?: string;
    durationSec?: number;
  };
  const promptTerm = body.promptTerm ?? '';
  const promptText = body.promptText ?? '';
  const transcript = body.transcript ?? '';
  const durationSec = body.durationSec ?? 0;
  const words = wordCount(transcript);
  const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;

  if (process.env.DEMO_MODE === '1') {
    return NextResponse.json(demoEval(transcript, wpm));
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: 'evaluation_not_configured',
        message: 'Set ANTHROPIC_API_KEY to enable evaluation (or DEMO_MODE=1).',
      },
      { status: 503 },
    );
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      thinking: { type: 'disabled' },
      // Cached so a longer rubric is billed once; on Sonnet 4.6 caching only
      // engages above ~2048 tokens, so today's short rubric is a no-op until it grows.
      system: [{ type: 'text', text: SYSTEM_RUBRIC, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema: EVAL_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: `Prompt: ${promptText}\nTranscript: ${transcript}\nDuration: ${durationSec}s\nWord count: ${words}\nWPM: ${wpm}\n\nReturn the JSON evaluation.`,
        },
      ],
    });

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text',
    );
    if (!textBlock) {
      return NextResponse.json({ error: 'evaluation_failed' }, { status: 502 });
    }
    const parsed = JSON.parse(textBlock.text) as EvalResult;
    parsed.scores.pace_wpm = wpm; // trust the server-computed pace

    // Persistence is best-effort: a DB hiccup must not block the feedback.
    try {
      await saveRep({ promptTerm, promptText, transcript, durationSec, result: parsed });
    } catch (err) {
      console.error('Failed to persist rep:', err);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'evaluation_failed',
        message: err instanceof Error ? err.message : 'Evaluation failed.',
      },
      { status: 502 },
    );
  }
}
