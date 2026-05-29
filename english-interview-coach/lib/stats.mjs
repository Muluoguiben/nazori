// Pure streak/stats helpers, shared by lib/db.ts and the tests/checks.
// Day bucketing is done in the user's IANA timezone so streak/today are correct
// for non-UTC users near local midnight.

export function localDay(value, tz = 'UTC') {
  const d = value instanceof Date ? value : new Date(value);
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function addDays(dayStr, delta) {
  const d = new Date(`${dayStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// times: array of created_at values (ISO strings or Date objects).
// tz: IANA timezone. total: lifetime count (defaults to times.length).
export function computeStats(times, tz = 'UTC', total) {
  const counts = new Map();
  for (const t of times) {
    const day = localDay(t, tz);
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  const todayStr = localDay(new Date(), tz);
  const today = counts.get(todayStr) ?? 0;

  // Count consecutive days back from today (or yesterday, if nothing yet today).
  let streak = 0;
  let cursor = counts.has(todayStr) ? todayStr : addDays(todayStr, -1);
  while (counts.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return { streak, today, total: typeof total === 'number' ? total : times.length };
}
