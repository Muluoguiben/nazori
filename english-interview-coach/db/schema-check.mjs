// Verifies db/schema.sql and the shared queries against a real Postgres
// (PGlite, in-memory) — no external database needed.
// Usage: node db/schema-check.mjs
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { INSERT_REP, INSERT_SKIP, SELECT_RECENT_REPS } from './queries.mjs';

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

await db.close();

if (!ok || !skipOk) {
  console.error('schema check FAILED', { row, skips: skips.rows });
  process.exit(1);
}

console.log('schema check OK — insert + query round-trip verified (reps + skipped_concepts).');
