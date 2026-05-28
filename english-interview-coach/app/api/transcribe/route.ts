import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEMO_TRANSCRIPT =
  'A closure is when a function remembers the variables from where it was created, even after the outer function has finished running. For example, you can use a closure to keep a private counter that other code cannot touch directly.';

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === '1') {
    return NextResponse.json({ transcript: DEMO_TRANSCRIPT });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'transcription_not_configured',
        message: 'Set OPENAI_API_KEY to enable transcription (or DEMO_MODE=1).',
      },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const audio = form.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('file', audio, 'rep.webm');
  upstream.append('model', 'whisper-1');
  upstream.append('language', 'en');

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: 'transcription_failed', message: detail.slice(0, 300) },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { text: string };
    return NextResponse.json({ transcript: data.text });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'transcription_failed',
        message: err instanceof Error ? err.message : 'Network error.',
      },
      { status: 502 },
    );
  }
}
