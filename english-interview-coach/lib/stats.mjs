// Pure streak/stats helpers, shared by lib/db.ts and db/schema-check.mjs.

export function toDayStr(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return s.length === 10 ? s : new Date(s).toISOString().slice(0, 10);
}

// rows: [{ day, n }] grouped by day, any order. now: the reference "today".
export function statsFromDays(rows, now = new Date()) {
  const counts = new Map();
  let total = 0;
  for (const r of rows) {
    const n = Number(r.n) || 0;
    counts.set(toDayStr(r.day), n);
    total += n;
  }

  const todayStr = toDayStr(now);
  const today = counts.get(todayStr) ?? 0;

  // Count consecutive days back from today (or yesterday, if nothing yet today).
  let streak = 0;
  const cursor = new Date(`${todayStr}T00:00:00Z`);
  if (!counts.has(todayStr)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (counts.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { streak, today, total };
}
