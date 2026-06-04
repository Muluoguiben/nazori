import promptsData from '@/prompts.json';
import {
  selectFrom,
  progressOf,
  scopeChoices as rawScopeChoices,
  parseScope as rawParseScope,
  scopeToValue as rawScopeToValue,
  WEEKS,
  WEEK_TITLES,
} from './scope.mjs';
import type { Mode, Prompt, Scope } from './types';

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
  return selectFrom(prompts, {
    scope: { type: 'all' },
    mode: 'random',
    prevTerm: excludeTerm,
  }) as Prompt | null;
}

export function selectPrompt(opts: {
  scope: Scope;
  mode: Mode;
  done?: Iterable<string>;
  prevTerm?: string;
}): Prompt | null {
  return selectFrom(prompts, opts) as Prompt | null;
}

export function progressFor(scope: Scope, done: Iterable<string>): { done: number; total: number } {
  return progressOf(prompts, scope, done instanceof Set ? done : new Set(done));
}

export type ScopeChoice = {
  value: string;
  label: string;
  week: number;
  whole?: boolean;
  tag?: string;
};

export const scopeChoices = (): ScopeChoice[] => rawScopeChoices() as ScopeChoice[];
export const parseScope = (value: string): Scope => rawParseScope(value) as Scope;
export const scopeToValue = (scope: Scope): string => rawScopeToValue(scope);

export const weeks: number[] = WEEKS as number[];
export const weekTitles: Record<number, string> = WEEK_TITLES as Record<number, string>;
