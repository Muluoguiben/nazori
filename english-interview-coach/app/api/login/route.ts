import { NextResponse } from 'next/server';
import { AUTH_COOKIE, timingSafeEqual, tokenFor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { secret } = (await request.json()) as { secret?: string };
  const appSecret = process.env.APP_SECRET;

  if (!appSecret) {
    return NextResponse.json({ ok: true }); // auth disabled
  }
  if (!secret || !timingSafeEqual(secret, appSecret)) {
    return NextResponse.json({ error: 'invalid_secret' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await tokenFor(appSecret), {
    httpOnly: true,
    secure: request.headers.get('x-forwarded-proto') === 'https',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}
