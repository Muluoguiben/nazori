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

// Key off a platform-trusted source. The leftmost X-Forwarded-For entry is
// client-controlled (spoofable), so prefer x-real-ip (set by the platform) or
// the last XFF hop, falling back to a shared key when neither is present.
export function clientKey(request: Request): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return 'local';
}
