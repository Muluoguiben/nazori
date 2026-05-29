import { NextResponse } from 'next/server';
import { AUTH_COOKIE, expectedToken, timingSafeEqual, tokenFor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let secret: string | undefined;
  try {
    ({ secret } = (await request.json()) as { secret?: string });
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const expected = await expectedToken();
  if (!expected) {
    return NextResponse.json({ ok: true }); // auth disabled
  }

  // Compare equal-length hashes so response timing doesn't leak the secret length.
  if (!secret || !timingSafeEqual(await tokenFor(secret), expected)) {
    return NextResponse.json({ error: 'invalid_secret' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}
