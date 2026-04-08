import { Context, Next } from 'hono';
import type { AppEnv } from '../types';

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const deviceId = c.req.header('X-Device-Id');

  if (!deviceId || deviceId.trim().length === 0) {
    return c.json(
      { error: 'Missing or empty X-Device-Id header' },
      401,
    );
  }

  c.set('deviceId', deviceId.trim());
  await next();
}
