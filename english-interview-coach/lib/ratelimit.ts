// Best-effort in-memory rate limiter. Note: on serverless (Vercel) each
// instance has its own map, so this throttles bursts per warm instance rather
// than globally — adequate for a low-traffic solo app, not a hard guarantee.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientKey(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0].trim() : '') || 'local';
}
