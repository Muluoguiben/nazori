import { Annotation } from '@langchain/langgraph';
import type { TranslateMode } from '../types';

/**
 * Translation graph state definition.
 * Each node reads from and writes to this shared state as it flows through the graph.
 */
export const TranslationState = Annotation.Root({
  // ── Input ──────────────────────────────────────────────────────────
  text: Annotation<string>,
  sourceLang: Annotation<string>,
  targetLang: Annotation<string>,
  domain: Annotation<'general' | 'legal' | 'medical' | 'tech'>,
  inputTerms: Annotation<{ source: string; target: string }[]>,
  mode: Annotation<TranslateMode>,

  // ── Model config ───────────────────────────────────────────────────
  geminiApiKey: Annotation<string>,
  ai: Annotation<Ai | null>, // Cloudflare Workers AI binding (fallback)

  // ── Intermediate ───────────────────────────────────────────────────
  detectedLang: Annotation<string>,
  matchedTerms: Annotation<{ source: string; target: string }[]>,
  systemPrompt: Annotation<string>,

  // ── Word/idiom lookup ──────────────────────────────────────────────
  isWordLookup: Annotation<boolean>,

  // ── Refined mode intermediate ──────────────────────────────────────
  draftText: Annotation<string>,
  refinePrompt: Annotation<string>,

  // ── Output ─────────────────────────────────────────────────────────
  translatedText: Annotation<string>,
  modelUsed: Annotation<string>, // which model actually served the request
  usage: Annotation<{ inputTokens: number; outputTokens: number }>,
  error: Annotation<string | undefined>,
});

export type TranslationStateType = typeof TranslationState.State;
