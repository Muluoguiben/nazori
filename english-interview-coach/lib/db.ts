import { neon } from '@neondatabase/serverless';
import { INSERT_REP, INSERT_SKIP, SELECT_RECENT_REPS } from '@/db/queries.mjs';
import type { EvalResult, Scores } from './types';

export function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export type RepInput = {
  promptTerm: string;
  promptText: string;
  transcript: string;
  durationSec: number;
  result: EvalResult;
};

export async function saveRep(input: RepInput): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql.query(INSERT_REP, [
    input.promptTerm,
    input.promptText,
    input.transcript,
    input.durationSec,
    JSON.stringify(input.result.scores),
    input.result.inline_correction,
    JSON.stringify(input.result.fixes),
  ]);
}

export async function saveSkip(term: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql.query(INSERT_SKIP, [term]);
}

export type RepRow = {
  id: number;
  created_at: string;
  prompt_term: string;
  prompt_text: string;
  transcript: string;
  duration_sec: number;
  scores: Scores;
  inline_correction: string;
  fixes: string[];
};

export async function listRecentReps(limit = 20): Promise<RepRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql.query(SELECT_RECENT_REPS, [limit]);
  return rows as unknown as RepRow[];
}
