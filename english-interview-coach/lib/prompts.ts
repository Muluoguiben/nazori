import promptsData from '@/prompts.json';
import type { Prompt } from './types';

export const prompts = promptsData as Prompt[];

export function randomPrompt(excludeTerm?: string): Prompt {
  const pool =
    excludeTerm && prompts.length > 1
      ? prompts.filter((p) => p.term !== excludeTerm)
      : prompts;
  return pool[Math.floor(Math.random() * pool.length)];
}
