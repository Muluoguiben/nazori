'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type CardEntry = {
  index: number;
  term: string;
  definition?: string;
  collocations?: string;
  example?: string;
  difficulty?: string;
  interview_use?: string;
};

export type CardsWeek = {
  week: number;
  entries: CardEntry[];
};

export function Cards({ weeks }: { weeks: CardsWeek[] }) {
  const available = weeks.filter((w) => w.entries.length > 0);
  const [weekIdx, setWeekIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const entries = available[weekIdx]?.entries ?? [];
  const current = entries[cardIdx];

  const flip = () => setFlipped((f) => !f);
  const next = () => {
    if (entries.length === 0) return;
    setFlipped(false);
    setCardIdx((i) => (i + 1) % entries.length);
  };
  const prev = () => {
    if (entries.length === 0) return;
    setFlipped(false);
    setCardIdx((i) => (i - 1 + entries.length) % entries.length);
  };

  const switchWeek = (idx: number) => {
    setWeekIdx(idx);
    setCardIdx(0);
    setFlipped(false);
  };

  const entriesLength = entries.length;
  useEffect(() => {
    if (entriesLength === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFlipped(false);
        setCardIdx((i) => (i + 1) % entriesLength);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFlipped(false);
        setCardIdx((i) => (i - 1 + entriesLength) % entriesLength);
      } else if (e.key === ' ' || e.key === 'Enter') {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'BUTTON' || t.tagName === 'SELECT')) return;
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entriesLength]);

  if (available.length === 0 || !current) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between py-2 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-300">
            ← Home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center text-center text-sm text-neutral-500">
          No flashcards are available.
        </div>
      </main>
    );
  }

  const activeWeek = available[weekIdx];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3 py-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-300">
          ← Home
        </Link>
        <select
          value={weekIdx}
          onChange={(e) => switchWeek(Number(e.target.value))}
          aria-label="Week"
          className="rounded-md bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800"
        >
          {available.map((w, i) => (
            <option key={w.week} value={i}>
              Week {w.week}
            </option>
          ))}
        </select>
        <span aria-live="polite" className="tabular-nums">
          {cardIdx + 1} / {entries.length}
        </span>
      </header>

      <button
        type="button"
        onClick={flip}
        aria-pressed={flipped}
        aria-label={flipped ? 'Hide explanation' : 'Show explanation'}
        className="mt-6 flex min-h-[18rem] w-full flex-1 select-text flex-col gap-3 rounded-2xl bg-neutral-900 p-6 text-left ring-1 ring-neutral-800 transition active:scale-[0.998]"
      >
        <div className="text-xs uppercase tracking-wide text-blue-400">
          Week {activeWeek.week} · #{current.index}
        </div>
        <div className="text-2xl font-semibold tracking-tight">{current.term}</div>
        {flipped ? (
          <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-neutral-200">
            {current.definition && <p>{current.definition}</p>}
            {current.example && (
              <p className="text-neutral-400">
                <span className="text-neutral-500">Example: </span>
                {current.example}
              </p>
            )}
            {current.collocations && (
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-600">Collocations: </span>
                {current.collocations}
              </p>
            )}
            {(current.difficulty || current.interview_use) && (
              <p className="text-xs text-neutral-500">
                {current.difficulty && (
                  <>
                    <span className="text-neutral-600">Difficulty </span>
                    {current.difficulty}
                  </>
                )}
                {current.difficulty && current.interview_use && ' · '}
                {current.interview_use && (
                  <>
                    <span className="text-neutral-600">Interview use: </span>
                    {current.interview_use}
                  </>
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-auto text-sm text-neutral-500">
            Tap, press space, or click to reveal the explanation.
          </p>
        )}
      </button>

      <nav className="mt-6 flex gap-3" aria-label="Card navigation">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous card"
          className="flex-1 rounded-2xl bg-neutral-800 px-6 py-3 text-base font-medium transition active:scale-[0.99]"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next card"
          className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition active:scale-[0.99]"
        >
          Next →
        </button>
      </nav>

      <p className="mt-3 text-center text-xs text-neutral-600">Use ← / → to move, space to flip.</p>
    </main>
  );
}
