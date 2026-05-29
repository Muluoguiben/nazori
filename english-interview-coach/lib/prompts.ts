import promptsData from '@/prompts.json';
import type { Prompt } from './types';

function isPrompt(value: unknown): value is Prompt {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Prompt).term === 'string' &&
    typeof (value as Prompt).prompt === 'string' &&
    typeof (value as Prompt).tag === 'string'
  );
}

export const prompts: Prompt[] = Array.isArray(promptsData) ? promptsData.filter(isPrompt) : [];

export function randomPrompt(excludeTerm?: string): Prompt | null {
  if (prompts.length === 0) return null;
  const pool =
    excludeTerm && prompts.length > 1
      ? prompts.filter((p) => p.term !== excludeTerm)
      : prompts;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
