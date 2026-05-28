import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch (err) {
    console.error('Failed to compute stats:', err);
    return NextResponse.json({ streak: 0, today: 0, total: 0 });
  }
}
