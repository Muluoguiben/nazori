import { NextResponse } from 'next/server';
import { clientKey, rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

const DEMO_TRANSCRIPT =
  'A closure is when a function remembers the variables from where it was created, even after the outer function has finished running. For example, you can use a closure to keep a private counter that other code cannot touch directly.';

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === '1') {
    return NextResponse.json({ transcript: DEMO_TRANSCRIPT });
  }

  if (!rateLimit(`transcribe:${clientKey(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
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

  // Reject oversized uploads by Content-Length before buffering the whole body.
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: 'audio_too_large', message: 'Recording is too large.' },
      { status: 413 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const audio = form.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: 'audio_too_large', message: 'Recording is too large.' },
      { status: 413 },
    );
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
      console.error('Whisper error:', res.status, (await res.text()).slice(0, 500));
      return NextResponse.json(
        { error: 'transcription_failed', message: 'Transcription failed. Please try again.' },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { text: string };
    return NextResponse.json({ transcript: data.text });
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      { error: 'transcription_failed', message: 'Transcription failed. Please try again.' },
      { status: 502 },
    );
  }
}
