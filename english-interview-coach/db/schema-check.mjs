// Verifies db/schema.sql and the shared queries against a real Postgres
// (PGlite, in-memory) — no external database needed.
// Usage: node db/schema-check.mjs
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import {
  INSERT_REP,
  INSERT_SKIP,
  SELECT_RECENT_REPS,
  SELECT_REP_TIMES,
  SELECT_REP_TOTAL,
} from './queries.mjs';
import { computeStats } from '../lib/stats.mjs';

const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');

const db = new PGlite();
await db.exec(schema);

const scores = { accuracy: 8, structure: 7, language: 8, pace_wpm: 132 };
const fixes = ['Define it first.', 'Add an example.', 'Tighten the closing.'];

const inserted = await db.query(INSERT_REP, [
  'closure',
  'Explain closure in 60 seconds.',
  'A closure captures variables from its surrounding scope.',
  62,
  JSON.stringify(scores),
  'A closure **captures** variables from its surrounding scope.',
  JSON.stringify(fixes),
]);
console.log('inserted rep id:', inserted.rows[0].id);

await db.query(INSERT_SKIP, ['monads']);

const recent = await db.query(SELECT_RECENT_REPS, [10]);
const row = recent.rows[0];

const ok =
  recent.rows.length === 1 &&
  row.prompt_term === 'closure' &&
  row.duration_sec === 62 &&
  row.scores.accuracy === 8 &&
  Array.isArray(row.fixes) &&
  row.fixes.length === 3;

const skips = await db.query('SELECT prompt_term FROM skipped_concepts');
const skipOk = skips.rows.length === 1 && skips.rows[0].prompt_term === 'monads';

// Streak: add reps on today, yesterday, and the day before (one rep already
// exists for today from the insert above), then verify the streak query and
// computation report 3 consecutive days.
const now = new Date();
const INSERT_REP_AT = `INSERT INTO reps
  (prompt_term, prompt_text, transcript, duration_sec, scores, inline_correction, fixes, created_at)
  VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8)`;
for (const offset of [0, 1, 2]) {
  const at = new Date(now);
  at.setUTCDate(at.getUTCDate() - offset);
  await db.query(INSERT_REP_AT, [
    `term-${offset}`,
    'p',
    'transcript',
    30,
    JSON.stringify(scores),
    'x',
    JSON.stringify(fixes),
    at.toISOString(),
  ]);
}
const times = (await db.query(SELECT_REP_TIMES)).rows.map((r) => r.created_at);
const totalRow = (await db.query(SELECT_REP_TOTAL)).rows[0];
const stats = computeStats(times, 'UTC', totalRow.n);
const streakOk = stats.streak === 3 && stats.today >= 1 && stats.total === times.length;

await db.close();

if (!ok || !skipOk || !streakOk) {
  console.error('schema check FAILED', { row, skips: skips.rows, stats });
  process.exit(1);
}

console.log('schema check OK — reps + skipped_concepts round-trip and streak =', stats.streak);
