import { StateGraph, END } from '@langchain/langgraph';
import { TranslationState, type TranslationStateType } from './state';
import {
  detectLanguageNode,
  matchTermsNode,
  buildPromptNode,
  translateNode,
} from './nodes';

/**
 * Build the translation LangGraph.
 *
 * Graph topology:
 *   detectLanguage → matchTerms → buildPrompt → translate → END
 *
 * Model priority: Gemini 2.0 Flash (free) → Workers AI Llama 3.3 70B (free fallback)
 */
export function buildTranslationGraph() {
  const graph = new StateGraph(TranslationState)
    .addNode('detectLanguage', detectLanguageNode)
    .addNode('matchTerms', matchTermsNode)
    .addNode('buildPrompt', buildPromptNode)
    .addNode('translate', translateNode)
    .addEdge('__start__', 'detectLanguage')
    .addEdge('detectLanguage', 'matchTerms')
    .addEdge('matchTerms', 'buildPrompt')
    .addEdge('buildPrompt', 'translate')
    .addEdge('translate', END);

  return graph.compile();
}

export { TranslationState, type TranslationStateType };
export {
  detectLanguageNode,
  matchTermsNode,
  buildPromptNode,
  translateNode,
  translateWithGemini,
} from './nodes';
