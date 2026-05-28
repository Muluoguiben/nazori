import { NextResponse } from 'next/server';
import { listRecentReps } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const reps = await listRecentReps(20);
    return NextResponse.json({ reps });
  } catch (err) {
    console.error('Failed to list reps:', err);
    return NextResponse.json({ reps: [] });
  }
}
