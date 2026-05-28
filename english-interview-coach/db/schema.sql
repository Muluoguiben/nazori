-- English Interview Coach — v0 schema (solo app: no user_id, no prompts table).

CREATE TABLE IF NOT EXISTS reps (
  id                SERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prompt_term       TEXT NOT NULL,
  prompt_text       TEXT NOT NULL,
  transcript        TEXT NOT NULL,
  duration_sec      INTEGER NOT NULL,
  scores            JSONB NOT NULL,
  inline_correction TEXT NOT NULL,
  fixes             JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS skipped_concepts (
  id          SERIAL PRIMARY KEY,
  skipped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prompt_term TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS reps_created_at_idx ON reps (created_at DESC);
