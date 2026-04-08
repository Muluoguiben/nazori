import { Annotation } from '@langchain/langgraph';

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
  apiKey: Annotation<string>,

  // ── Intermediate ───────────────────────────────────────────────────
  detectedLang: Annotation<string>,
  matchedTerms: Annotation<{ source: string; target: string }[]>,
  systemPrompt: Annotation<string>,

  // ── Output ─────────────────────────────────────────────────────────
  translatedText: Annotation<string>,
  usage: Annotation<{ inputTokens: number; outputTokens: number }>,
  error: Annotation<string | undefined>,
});

export type TranslationStateType = typeof TranslationState.State;
