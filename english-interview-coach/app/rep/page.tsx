'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { randomPrompt } from '@/lib/prompts';
import type { EvalResult, Prompt } from '@/lib/types';

const MAX_SECONDS = 90;

type Phase = 'idle' | 'recording' | 'processing' | 'feedback' | 'error';

function renderInline(markdown: string) {
  return markdown.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-blue-300">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function ScoreCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-xl bg-neutral-900 p-3 text-center ring-1 ring-neutral-800">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-[10px] text-neutral-600">{suffix}</div>
    </div>
  );
}

export default function RepPage() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [repCount, setRepCount] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Pick the first prompt on the client only, so the random choice can't
    // differ between server-rendered HTML and hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrompt(randomPrompt());
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const submit = useCallback(
    async (blob: Blob, durationSec: number) => {
      const current = prompt;
      if (!current) return;
      setPhase('processing');
      try {
        setStatusText('Transcribing…');
        const fd = new FormData();
        fd.append('audio', blob, 'rep.webm');
        const tRes = await fetch('/api/transcribe', { method: 'POST', body: fd });
        if (!tRes.ok) {
          const e = await tRes.json().catch(() => ({}));
          throw new Error(e.message || 'Transcription failed.');
        }
        const { transcript: tx } = (await tRes.json()) as { transcript: string };
        setTranscript(tx);

        setStatusText('Evaluating…');
        const eRes = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptText: current.prompt, transcript: tx, durationSec }),
        });
        if (!eRes.ok) {
          const e = await eRes.json().catch(() => ({}));
          throw new Error(e.message || 'Evaluation failed.');
        }
        setResult((await eRes.json()) as EvalResult);
        setRepCount((c) => c + 1);
        setPhase('feedback');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
        setPhase('error');
      }
    },
    [prompt],
  );

  const stopRecording = useCallback(() => {
    clearTimers();
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  }, [clearTimers]);

  const startRecording = useCallback(async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const durationSec =
          Math.min(MAX_SECONDS, Math.round((Date.now() - startedAtRef.current) / 1000)) || 1;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        stopStream();
        void submit(blob, durationSec);
      };
      startedAtRef.current = Date.now();
      mr.start();
      setSecondsLeft(MAX_SECONDS);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
      autoStopRef.current = setTimeout(stopRecording, MAX_SECONDS * 1000);
    } catch {
      setErrorMsg(
        'Microphone access is needed to record. Allow it in your browser, then try again.',
      );
      setPhase('error');
    }
  }, [stopRecording, stopStream, submit]);

  const nextPrompt = useCallback(() => {
    clearTimers();
    stopStream();
    setResult(null);
    setTranscript('');
    setErrorMsg('');
    setSecondsLeft(MAX_SECONDS);
    setPrompt((p) => randomPrompt(p?.term));
    setPhase('idle');
  }, [clearTimers, stopStream]);

  useEffect(
    () => () => {
      clearTimers();
      stopStream();
    },
    [clearTimers, stopStream],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between py-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-300">
          ← End session
        </Link>
        <span>Reps: {repCount}</span>
      </header>

      {phase !== 'feedback' && (
        <section className="mt-6">
          <div className="text-xs uppercase tracking-wide text-blue-400">
            {prompt?.tag ?? '…'}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{prompt?.term ?? ' '}</h1>
          <p className="mt-2 text-neutral-300">{prompt?.prompt ?? 'Preparing your prompt…'}</p>
        </section>
      )}

      <div className="mt-auto flex flex-col items-center gap-4 pt-10">
        {phase === 'idle' && (
          <>
            <button
              type="button"
              onClick={startRecording}
              disabled={!prompt}
              className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-medium text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.99] disabled:opacity-50"
            >
              Start recording · {MAX_SECONDS}s
            </button>
            <button
              type="button"
              onClick={nextPrompt}
              className="text-sm text-neutral-500 hover:text-neutral-300"
            >
              Skip this concept
            </button>
          </>
        )}

        {phase === 'recording' && (
          <>
            <div className="text-5xl font-semibold tabular-nums text-blue-300">{secondsLeft}</div>
            <div className="text-sm text-neutral-500">Speak as if to a senior engineer.</div>
            <button
              type="button"
              onClick={stopRecording}
              className="w-full rounded-2xl bg-red-600 px-6 py-4 text-base font-medium text-white transition active:scale-[0.99]"
            >
              Stop &amp; submit
            </button>
          </>
        )}

        {phase === 'processing' && (
          <div className="py-10 text-center text-neutral-400">{statusText || 'Working…'}</div>
        )}

        {phase === 'error' && (
          <>
            <p className="text-center text-sm text-red-300">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="w-full rounded-2xl bg-neutral-800 px-6 py-4 text-base font-medium transition active:scale-[0.99]"
            >
              Try again
            </button>
          </>
        )}
      </div>

      {phase === 'feedback' && result && (
        <section className="mt-6 flex flex-col gap-5">
          <h1 className="text-xl font-semibold tracking-tight">Feedback</h1>

          <div className="grid grid-cols-4 gap-2">
            <ScoreCard label="Accuracy" value={result.scores.accuracy} suffix="/10" />
            <ScoreCard label="Structure" value={result.scores.structure} suffix="/10" />
            <ScoreCard label="Language" value={result.scores.language} suffix="/10" />
            <ScoreCard label="Pace" value={result.scores.pace_wpm} suffix="wpm · 110-150" />
          </div>

          <div>
            <h2 className="mb-1 text-sm font-medium text-neutral-400">Transcript with fixes</h2>
            <p className="rounded-xl bg-neutral-900 p-3 text-sm leading-relaxed ring-1 ring-neutral-800">
              {renderInline(result.inline_correction || transcript)}
            </p>
          </div>

          <div>
            <h2 className="mb-1 text-sm font-medium text-neutral-400">3 fixes</h2>
            <ul className="flex flex-col gap-2">
              {result.fixes.map((fix, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-neutral-900 p-3 text-sm ring-1 ring-neutral-800"
                >
                  {fix}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={nextPrompt}
              className="flex-1 rounded-2xl bg-blue-600 px-6 py-4 text-base font-medium text-white transition active:scale-[0.99]"
            >
              Next
            </button>
            <Link
              href="/"
              className="rounded-2xl bg-neutral-800 px-6 py-4 text-base font-medium transition active:scale-[0.99]"
            >
              End
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
