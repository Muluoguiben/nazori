// Parameterized SQL shared by the app (lib/db.ts) and the schema check
// (db/schema-check.mjs), so both exercise the exact same statements.

export const INSERT_REP = `INSERT INTO reps
  (prompt_term, prompt_text, transcript, duration_sec, scores, inline_correction, fixes)
  VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)
  RETURNING id, created_at`;

export const INSERT_SKIP = `INSERT INTO skipped_concepts (prompt_term)
  VALUES ($1)
  RETURNING id, skipped_at`;

export const SELECT_RECENT_REPS = `SELECT
  id, created_at, prompt_term, prompt_text, transcript, duration_sec, scores, inline_correction, fixes
  FROM reps
  ORDER BY created_at DESC
  LIMIT $1`;

export const SELECT_REP_DAYS = `SELECT created_at::date AS day, COUNT(*)::int AS n
  FROM reps
  GROUP BY day
  ORDER BY day DESC
  LIMIT 400`;
