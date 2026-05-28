import { NextResponse } from 'next/server';
import { saveSkip } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { term } = (await request.json()) as { term?: string };
  if (!term) {
    return NextResponse.json({ error: 'no_term' }, { status: 400 });
  }
  try {
    await saveSkip(term);
  } catch (err) {
    console.error('Failed to record skip:', err);
  }
  return NextResponse.json({ ok: true });
}
