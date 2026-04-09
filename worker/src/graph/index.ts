import { StateGraph, END } from '@langchain/langgraph';
import { TranslationState, type TranslationStateType } from './state';
import {
  detectLanguageNode,
  matchTermsNode,
  buildPromptNode,
  translateNode,
  buildRefinePromptNode,
  refineNode,
} from './nodes';

/**
 * Route after translate: refined mode continues to review, others end.
 */
function afterTranslateRouter(state: TranslationStateType): string {
  if (state.mode === 'refined' && state.draftText && !state.error) {
    return 'buildRefinePrompt';
  }
  return '__end__';
}

/**
 * Full translation graph with conditional refined path.
 *
 * quick/normal: detect → match → prompt → translate → END
 * refined:      detect → match → prompt → translate → buildRefinePrompt → refine → END
 */
const fullGraph = new StateGraph(TranslationState)
  .addNode('detectLanguage', detectLanguageNode)
  .addNode('matchTerms', matchTermsNode)
  .addNode('buildPrompt', buildPromptNode)
  .addNode('translate', translateNode)
  .addNode('buildRefinePrompt', buildRefinePromptNode)
  .addNode('refine', refineNode)
  .addEdge('__start__', 'detectLanguage')
  .addEdge('detectLanguage', 'matchTerms')
  .addEdge('matchTerms', 'buildPrompt')
  .addEdge('buildPrompt', 'translate')
  .addConditionalEdges('translate', afterTranslateRouter, {
    buildRefinePrompt: 'buildRefinePrompt',
    __end__: END,
  })
  .addEdge('buildRefinePrompt', 'refine')
  .addEdge('refine', END)
  .compile();

/**
 * Prep-only graph (detect → match → prompt → END).
 * Used by the streaming handler: runs prep via LangGraph, then streams
 * translation via Gemini native SSE for lower TTFB.
 */
const prepGraph = new StateGraph(TranslationState)
  .addNode('detectLanguage', detectLanguageNode)
  .addNode('matchTerms', matchTermsNode)
  .addNode('buildPrompt', buildPromptNode)
  .addEdge('__start__', 'detectLanguage')
  .addEdge('detectLanguage', 'matchTerms')
  .addEdge('matchTerms', 'buildPrompt')
  .addEdge('buildPrompt', END)
  .compile();

export { fullGraph, prepGraph, TranslationState, type TranslationStateType };
export {
  detectLanguageNode,
  matchTermsNode,
  buildPromptNode,
  translateNode,
  buildRefinePromptNode,
  refineNode,
} from './nodes';
