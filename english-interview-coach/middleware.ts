import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, expectedToken, timingSafeEqual } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const expected = await expectedToken();
  if (!expected) return NextResponse.next(); // no APP_SECRET -> auth disabled

  const { pathname } = request.nextUrl;
  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
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
  // Gate everything except Next internals and static metadata/assets.
  matcher: ['/((?!_next/|.*\\.(?:js|css|png|svg|ico|webmanifest|map|txt)$).*)'],
};
