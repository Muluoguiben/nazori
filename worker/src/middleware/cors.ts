import { Context, Next } from 'hono';
import type { AppEnv } from '../types';

const ALLOWED_ORIGIN_PATTERNS = [
  /^chrome-extension:\/\/.+$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export async function corsMiddleware(c: Context<AppEnv>, next: Next) {
  const origin = c.req.header('Origin') ?? null;
  const allowed = isOriginAllowed(origin);

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...(allowed && origin ? { 'Access-Control-Allow-Origin': origin } : {}),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Device-Id',
        'Access-Control-Expose-Headers': 'Content-Type, X-Request-Id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  if (allowed && origin) {
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');
    c.res.headers.set('Access-Control-Expose-Headers', 'Content-Type, X-Request-Id');
  }
}
