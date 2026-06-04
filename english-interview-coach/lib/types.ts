export type Prompt = { term: string; prompt: string; tag: string };

export type Scope = { type: 'all' } | { type: 'week'; week: number } | { type: 'tag'; tag: string };

export type Mode = 'sequential' | 'random';

export type Scores = {
  accuracy: number;
  structure: number;
  language: number;
  pace_wpm: number;
};

export type EvalResult = {
  scores: Scores;
  inline_correction: string;
  fixes: string[];
};
