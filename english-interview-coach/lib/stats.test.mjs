import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, localDay } from './stats.mjs';

function daysAgoIso(n) {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

test('streak counts a contiguous run ending today (UTC)', () => {
  const s = computeStats([daysAgoIso(0), daysAgoIso(1), daysAgoIso(2)], 'UTC');
  assert.equal(s.streak, 3);
  assert.equal(s.today, 1);
  assert.equal(s.total, 3);
});

test('streak stops at a gap day', () => {
  const s = computeStats([daysAgoIso(0), daysAgoIso(2), daysAgoIso(3)], 'UTC'); // gap at -1
  assert.equal(s.streak, 1);
});

test('streak survives when today is empty but yesterday is present', () => {
  const s = computeStats([daysAgoIso(1), daysAgoIso(2)], 'UTC');
  assert.equal(s.streak, 2);
  assert.equal(s.today, 0);
});

test('duplicate reps on the same day count once for the streak', () => {
  const s = computeStats([daysAgoIso(0), daysAgoIso(0), daysAgoIso(1)], 'UTC');
  assert.equal(s.streak, 2);
  assert.equal(s.today, 2);
  assert.equal(s.total, 3);
});

test('explicit total overrides the fetched-window length', () => {
  const s = computeStats([daysAgoIso(0)], 'UTC', 999);
  assert.equal(s.total, 999);
});

test('timezone bucketing differs from UTC near local midnight', () => {
  // 15:30Z is the next calendar day in Tokyo (UTC+9).
  const t = '2026-05-28T15:30:00Z';
  assert.equal(localDay(t, 'UTC'), '2026-05-28');
  assert.equal(localDay(t, 'Asia/Tokyo'), '2026-05-29');
});

test('empty history yields zeros', () => {
  const s = computeStats([], 'UTC');
  assert.deepEqual(s, { streak: 0, today: 0, total: 0 });
});

test('localDay handles a space-separated Postgres timestamp', () => {
  assert.equal(localDay('2026-05-29 12:00:00+00', 'UTC'), '2026-05-29');
});

test('localDay falls back safely on an unparseable value (no throw)', () => {
  assert.match(localDay('not-a-date', 'UTC'), /^\d{4}-\d{2}-\d{2}$/);
});
