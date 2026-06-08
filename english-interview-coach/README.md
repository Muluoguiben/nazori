# English Interview Coach

A phone-first PWA to practice explaining technical concepts out loud in English for job interviews. Record a 90-second answer; it's transcribed (Whisper) and graded (Claude Sonnet 4.6) with scores, an inline-corrected transcript, and three specific fixes. Also includes `/cards` — tap-to-flip flashcards for the underlying vocabulary (6 weeks × 65 terms). Solo use.

See `spec.md` for the v0 design, `AGENTS.md` for working notes, and
`CHANGELOG.md` for what shipped since.

## Run locally

```bash
npm ci
cp .env.example .env.local   # add keys, or set DEMO_MODE=1 to run without them
npm run dev                  # http://localhost:3000
```

`DEMO_MODE=1` returns a canned transcript + evaluation, so the full flow works without API keys.

## Environment (`.env.example`)

| Var | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Whisper speech-to-text (`/api/transcribe`) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 evaluation (`/api/evaluate`) |
| `DATABASE_URL` | Neon Postgres for rep history + streak |
| `APP_SECRET` | Shared-secret gate; first visit asks once. Unset = open (dev only) |

## Scripts

- `npm run dev` / `build` / `start` / `lint`
- `npm run test:unit` — pure-JS helpers under `lib/*.test.mjs` (streak,
  curriculum parser, audio-format, prompts/scope) via `node --test`
- `npm run db:check` — schema + queries against in-process Postgres (PGlite)
- `npm run test:e2e` — Playwright (build + browser)
- `npm run db:migrate` — apply `db/schema.sql` to `DATABASE_URL`

## Deploy (Vercel)

1. Import the repo; set the project root to `english-interview-coach`.
2. Add env vars: `APP_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`.
3. Run `npm run db:migrate` once (with `DATABASE_URL` set) to create the tables.
