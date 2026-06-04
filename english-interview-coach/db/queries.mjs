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

// Recent timestamps drive streak/today (bucketed by the client's timezone in JS).
export const SELECT_REP_TIMES = `SELECT created_at FROM reps ORDER BY created_at DESC LIMIT 2000`;

// Lifetime total counted separately so it never undercounts beyond the window above.
export const SELECT_REP_TOTAL = `SELECT COUNT(*)::int AS n FROM reps`;

// Terms the user has "covered": attempted (a saved rep) or explicitly skipped.
// UNION (not UNION ALL) de-duplicates across both tables.
export const SELECT_DONE_TERMS = `SELECT prompt_term FROM reps
  UNION
  SELECT prompt_term FROM skipped_concepts`;
