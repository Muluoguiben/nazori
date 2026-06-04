import { NextResponse } from 'next/server';
import { getDoneTerms } from '@/lib/db';

export const runtime = 'nodejs';

// Terms already covered (attempted or skipped), so the client can resume the
// curriculum in order. Degrades to an empty list without DATABASE_URL.
export async function GET() {
  try {
    return NextResponse.json({ done: await getDoneTerms() });
  } catch (err) {
    console.error('Failed to load progress:', err);
    return NextResponse.json({ done: [] });
  }
}
