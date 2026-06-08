# Changelog

All notable changes to **English Interview Coach** are recorded here. Dates are
when changes landed on `main`. The project's design lives in `spec.md`; this
file tracks what shipped against it. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

---

## 2026-06-08 — Deployed to Vercel

The PWA is live on Vercel. Required env: `APP_SECRET`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL` (Neon). The first deploy
requires a one-time `npm run db:migrate` against the production `DATABASE_URL`
to create the `reps` and `skipped_concepts` tables.

---

## 2026-06-05 — Range selector + full 390-prompt curriculum ([#7])

### Added

- **All 390 curriculum prompts wired into `prompts.json`** (6 weeks × 65 terms,
  tagged by 36 topic groups). The original 20 hand-picked Week-1 prompts are
  preserved verbatim.
- **`/rep` practice selector** — a grouped `<select>` filters by `all` / a
  single week / a single topic tag. "In order" walks the curriculum and serves
  the first not-yet-done prompt; a Shuffle toggle picks randomly inside the
  range.
- **Progress bar (`done / total`) for the selected range.** "Done" is derived
  from `reps ∪ skipped_concepts` (no new table) via `GET /api/progress`, then
  merged with a localStorage cache so progress also works offline / in
  `DEMO_MODE`.
- `lib/scope.mjs` — pure selection / scope logic (mirrors `lib/stats.mjs`),
  unit-tested in `lib/prompts.test.mjs`.
- `e2e/select.spec.ts` — E2E coverage of the selector.

### Changed

- **Per-prompt completion ids (`tag + term`)** replace bare-term keying — three
  repeated terms across weeks (`error boundary`, `batching`,
  `cache invalidation`) no longer mark each other done.
- **Cross-device resume:** after `/api/progress` merges server-side done terms,
  sequential mode jumps to the first not-done prompt (only while still idle on
  the initial pick).
- **All-done sequential review** walks cyclically through the pool instead of
  bouncing between the first two items.

### Tests

37 unit, 31 e2e.

---

## 2026-06-04 — iOS recording format fix ([#6])

### Fixed

- **iOS Safari transcription**. The browser's `MediaRecorder` produces
  `audio/mp4`, but the upload had been hard-coded as `rep.webm`. Whisper detects
  format by filename extension, so iOS recordings were being mislabelled and
  rejected. The client now derives the filename from the blob's MIME; the
  server prefers the client-attached filename when forwarding to Whisper
  (falling back to a MIME-based derivation for non-browser callers).

### Added

- `lib/audio-format.mjs` — `audioExtensionFromMime(mime)` +
  `audioFilenameFromMime(mime, baseName)`. Maps to the Whisper-supported
  extensions (`mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`, `flac`,
  `oga`, `ogg`). Codec parameters stripped; unknown formats fall back to
  `webm` (the dominant case on Chromium / Firefox).
- 8 `node:test` cases in `lib/audio-format.test.mjs`.

---

## 2026-06-04 — In-app `/cards` flashcards ([#5])

### Added

- **`/cards` flashcard page** replaces the original Anki Quick-mode dependency.
  Tap-to-flip cards over `curriculum/week1.md`–`week6.md` (390 entries). Week
  selector, position counter (`X / 65`), Prev/Next with wrap-around, full
  keyboard support (`←` / `→` / `Space` / `Enter`). Sequential only — no SRS,
  no shuffle, no mark-as-known (those are the v2.0 line in `spec.md`).
- `lib/curriculum.mjs` — pure parser, one entry per `### N. term`. Splits the
  same-line `**Difficulty:**  ·  **Interview use:**` pair while preserving
  internal `·` separators inside collocations and examples. Covered by 8
  `node:test` cases.
- "Browse flashcards" link on the home page (secondary button below
  "Start session").
- `outputFileTracingIncludes` in `next.config.ts` so `curriculum/*.md` ships on
  deployments that fall through to dynamic rendering.

### Changed

- **Design principle #1** (`AGENTS.md`) and the v0 design decision (`spec.md` /
  `spec.html`). The "two modes" split is preserved (silent Quick, loud Deep),
  but Quick mode is now in-app at `/cards` rather than externalised to Anki.
  The v2.0 roadmap row about "fold flashcards back into the app" is now done;
  the follow-on item is "spaced-repetition scheduler on top of `/cards`".

---

## 2026-06-01 — Public intro / landing page ([#4])

### Added

- `public/intro.html` — standalone marketing / landing page for the deployed
  app, reachable at `/intro.html`.

### Changed

- `middleware.ts` matcher exempts `.html` (alongside the pre-existing
  exemptions for `.js`, `.css`, etc.) so the public intro is reachable without
  going through the `APP_SECRET` gate.
- `auth-gate.spec.ts` adds a test asserting `/intro.html` returns 200 even with
  `APP_SECRET` set.

---

## 2026-05-29 — v0 build complete ([#3])

10 design decisions locked on 2026-05-27 (`spec.md`). The initial PWA shipped:

- Next.js 16 (App Router) + React 19 + Tailwind v4.
- **`/rep`** — 90s record → Whisper (`/api/transcribe`) → Claude Sonnet 4.6
  (`/api/evaluate`, cached rubric + json_schema) → inline-corrected transcript
  + 4-axis scores + 3 fixes.
- **Neon Postgres** (`reps`, `skipped_concepts`) with `lib/db.ts` and a
  `scripts/migrate.mjs` runner.
- **Shared-secret cookie gate** (`middleware.ts`, `/login`, `/api/login`).
  Production fails closed when `APP_SECRET` is unset; `DEMO_MODE=1` runs the
  full flow with canned data.
- **Streak counter** (`/api/stats`).
- **65 vocab terms per week × 6 weeks** drafted in `curriculum/`.
- **20 Week-1 prompts** wired into `prompts.json` (expanded to all 390 in #7).
- **Service worker + manifest** for "Add to Home Screen" / standalone install.

---

## Conventions

A short read for future contributors / agents:

- **Unit tests** live in `lib/*.test.mjs` next to their implementation, run
  with `node --test` via `npm run test:unit`.
- **E2E** lives in `e2e/*.spec.ts` (Playwright). `npm run test:e2e` runs
  `next build` first, then tests against two webservers: a `DEMO_MODE`
  one on port 3000 and an `APP_SECRET`-gated one on port 3100.
- Pure helpers shared between client and server (`stats.mjs`, `scope.mjs`,
  `curriculum.mjs`, `audio-format.mjs`) are `.mjs` so they're Node-testable
  without transpilation, then imported from TS via `@/lib/xxx.mjs`.
- Designs documented in `spec.md` (`spec.html` for the rendered view).
  Working notes for agents in `AGENTS.md`. Release history in this file.

[#3]: https://github.com/Muluoguiben/nazori/pull/3
[#4]: https://github.com/Muluoguiben/nazori/pull/4
[#5]: https://github.com/Muluoguiben/nazori/pull/5
[#6]: https://github.com/Muluoguiben/nazori/pull/6
[#7]: https://github.com/Muluoguiben/nazori/pull/7
