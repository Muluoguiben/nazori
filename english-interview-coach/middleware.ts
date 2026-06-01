import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, tokenFor, timingSafeEqual } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const secret = process.env.APP_SECRET;
  const { pathname } = request.nextUrl;

  if (!secret) {
    // No secret configured: open in dev or demo, but fail CLOSED in production
    // so a missing/typo'd APP_SECRET can't silently expose the app.
    const open = process.env.DEMO_MODE === '1' || process.env.NODE_ENV !== 'production';
    if (open) return NextResponse.next();
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 });
    }
    return new NextResponse(
      'Authentication is not configured. Set APP_SECRET (or DEMO_MODE=1 to run open).',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await tokenFor(secret);
  if (token && timingSafeEqual(token, expected)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/|.*\\.(?:js|css|html|png|svg|ico|webmanifest|map|txt)$).*)'],
};
