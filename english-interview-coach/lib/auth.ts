export const AUTH_COOKIE = 'eic_auth';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function authConfigured(): boolean {
  return Boolean(process.env.APP_SECRET);
}

// Cookie value is derived from the secret so the raw secret never lives client-side.
export function tokenFor(secret: string): Promise<string> {
  return sha256Hex(`eic-auth:${secret}`);
}

export async function expectedToken(): Promise<string | null> {
  const secret = process.env.APP_SECRET;
  return secret ? tokenFor(secret) : null;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
