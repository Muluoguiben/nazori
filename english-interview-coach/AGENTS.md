<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# English Interview Coach

A phone-first PWA to practice explaining tech concepts out loud in English, for mid-level full-stack + AI/Agent job interviews. Solo use.

## What's done (v0 build complete)

- **Spec:** `spec.md` (10 v0 design decisions locked 2026-05-27). HTML view at `spec.html`.
- **Curriculum:** all six weeks drafted — `curriculum/week1.md`–`week6.md` (65 terms each, 390 total). `prompts.json` wires 20 Week-1 concepts for v0.
- **App:** Next.js 16 (App Router) + React 19 + Tailwind v4 PWA.
  1. `prompts.json` from Week 1 — done.
  2. PWA scaffold — manifest, icons, service worker (`app/`, `public/`).
  3. Happy-path rep — `/rep`: 90s record → Whisper (`/api/transcribe`) → Claude Sonnet 4.6 (`/api/evaluate`, cached rubric + json_schema) → feedback.
  4. Neon Postgres — `db/schema.sql` (`reps`, `skipped_concepts`), `lib/db.ts`, `/api/skip`, `/api/history`, `scripts/migrate.mjs`.
  5. Shared-secret cookie auth — `middleware.ts`, `/login`, `/api/login` (`APP_SECRET`).
  6. Streak counter — `/api/stats`, shown on the home screen.

Everything is env-gated: missing keys / `DATABASE_URL` / `APP_SECRET` degrade gracefully (production fails closed without `APP_SECRET`), and `DEMO_MODE=1` runs the full flow with canned data. Verify with `npm run build`, `npm run lint`, `npm run test:unit`, `npm run db:check`, `npm run test:e2e`.

## What's left

- **Deploy to Vercel:** set the project root to `english-interview-coach`; add env `APP_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`; run `npm run db:migrate` once. See `.env.example`.
- **Wire more prompts** — `prompts.json` covers 20 Week-1 concepts; weeks 2–6 (drafted) aren't wired yet.
- Deferred to v1+ (do not scope-creep into v0): mock interview mode, reference answers, progress trends.

## Design principles (do not violate)

1. **Two-mode split.** This app is Deep mode (speaking) only. Vocab/flashcards live in Anki.
2. **Whisper transcript = listener's experience.** Never add a transcript-edit step before evaluation.
3. **Concise under time pressure.** The 90s hard cap is a feature.
4. **v0 = explanation reps only.** Mock interview is v1. Do not scope-creep.

## User preferences

- Mid-level engineer (3–5 yr), building agent apps but has not shipped LLM in production
- Pure-English curriculum content. No Chinese translations in vocab files.
- Simple English in conversation too — avoid words like "calibration", "hallucination" without a quick gloss
- Phone is Android. Anki is free on Android.
- Multi-device: phone + Mac + Windows. Needs server-side history (Neon Postgres in the spec).

## Key file paths

```
spec.md                  v0 design (read first)
prompts.json             20 Week 1 prompts (term, prompt, tag)
curriculum/week{1..6}.md vocab content (390 terms)
app/                     App Router: home, /rep, /login, /api/*
lib/                     db, auth, prompts, stats, types
db/                      schema.sql, migrate + check scripts
middleware.ts            shared-secret auth gate
.env.example             required env vars
```

## Identity / publishing rules

Do NOT push this project to a git remote using a personal or corporate git identity. Use a noreply email and sanitize file content before publishing. See `feedback_sanitize_identity_before_publishing` memory.
