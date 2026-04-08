import { Context, Next } from 'hono';
import type { AppEnv } from '../types';

const MINUTE_LIMIT = 30;
const DAY_LIMIT = 500;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Per-isolate in-memory store. Each Cloudflare Worker isolate is short-lived,
// so this acts as a best-effort sliding window rate limiter.
const requestLog = new Map<string, number[]>();

function pruneOlderThan(timestamps: number[], cutoff: number): number[] {
  // Timestamps are in chronological order; binary-search-ish but the array is
  // small enough that a simple filter is fine for <= 500 entries.
  return timestamps.filter((t) => t > cutoff);
}

export async function rateLimitMiddleware(c: Context<AppEnv>, next: Next) {
  const deviceId: string = c.get('deviceId');
  if (!deviceId) {
    // Auth middleware should have run first; bail gracefully.
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const now = Date.now();
  let timestamps = requestLog.get(deviceId) ?? [];

  // Prune entries older than 24 h (keeps memory bounded).
  timestamps = pruneOlderThan(timestamps, now - DAY_MS);

  // Count requests in the last minute.
  const minuteCount = timestamps.filter((t) => t > now - MINUTE_MS).length;
  if (minuteCount >= MINUTE_LIMIT) {
    const oldestInWindow = timestamps.find((t) => t > now - MINUTE_MS)!;
    const retryAfter = Math.ceil((oldestInWindow + MINUTE_MS - now) / 1000);
    return c.json(
      { error: 'Rate limit exceeded (per-minute). Try again later.' },
      429,
      { 'Retry-After': String(retryAfter) },
    );
  }

  // Count requests in the last 24 hours.
  if (timestamps.length >= DAY_LIMIT) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + DAY_MS - now) / 1000);
    return c.json(
      { error: 'Rate limit exceeded (daily). Try again later.' },
      429,
      { 'Retry-After': String(retryAfter) },
    );
  }

  // Record this request.
  timestamps.push(now);
  requestLog.set(deviceId, timestamps);

  await next();
}
