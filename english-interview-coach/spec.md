# English Interview Coach — v0 Spec

A phone-first PWA that helps a mid-level full-stack engineer practice explaining technical concepts in English for job interviews, focused on AI/Agent roles.

This document captures the v0 design — the result of a structured grill on 2026-05-27.

---

## Goal

After 6 weeks of daily use, the user can confidently explain any topic from the curriculum out loud in English, in 60–90 seconds, with correct domain terms and few filler words.

## Why this is needed

User is a 3–4 year full-stack engineer actively searching for AI Agent roles for 2026. Strong reading/writing English; weak speaking. No existing app targets tech-interview English at the concept-explanation level.

---

## Scope

### In v0
- One mode: **Explanation reps** — App shows a prompt ("Explain `closure` in 60s"), user speaks, app gives feedback.
- Curriculum: Week 1 only at launch (JS/TS/Async, 65 terms drafted; ~20 used as prompts after filtering to concept-level).

### Out of v0 (deferred to v1+)
- Mock interview mode (multi-turn, follow-up questions, interviewer voice)
- Reference answers (we use freestyle judgment first; add references if scoring drifts)
- Audio storage and playback
- Progress trend analytics

---

## Design principles

1. **Two-mode split for daily routine.** Silent work (vocab, flashcards) and loud work (speaking) happen at different times and places. Don't force them into one slot.
2. **The Whisper transcript is the listener's experience.** No transcript-editing step. If Whisper mishears you, that's a real signal about your pronunciation — same as it would be with a human interviewer.
3. **Concise answers under time pressure** is a feature, not a constraint. The 90s hard cap trains the right interview muscle.
4. **Habit science over feature completeness.** Open-ended sessions, low daily threshold (1 rep = streak), no all-or-nothing failure modes.

---

## v0 design decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Daily routine | Two-mode split: Quick (silent, anywhere) + Deep (speaking, home) |
| 2 | Quick mode | In-app `/cards`: tap-to-flip flashcards from `curriculum/week1-6.md`. No SRS — sequential browse of all 390 terms. |
| 3 | Deep v0 scope | Explanation reps only. Mock interview is v1. |
| 4 | Feedback format | Transcript with inline corrections + 3 specific fixes |
| 5 | Audio UX | Tap to start, 90s hard limit, auto-submit |
| 6 | Prompt source | Auto-generated from `week1.md` (filter to concept-level terms); show term + question together |
| 7 | Session length | Open-ended with skip button. Streak = 1 completed rep/day |
| 8 | Stack | Next.js + Neon Postgres, shared-secret cookie, no audio storage |
| 9 | Evaluation | Freestyle judgment with cached rubric (Claude Sonnet 4.6) |
| 10 | Transcript review | Auto-submit, no review step |

---

## Daily UX

### Quick mode (in-app `/cards`)
- Tap-to-flip flashcards sourced from `curriculum/week1.md`–`week6.md`
- All six weeks (390 terms) available; sequential browse, no SRS
- Done on phone, anywhere, silently; ~5–10 minutes

### Deep mode (this app)
- One fixed evening slot, at home
- Open PWA → tap "Start" → see prompt:
  ```
  closure
  Explain closure in 60 seconds as if to a senior engineer.
  ```
- Tap mic button → 90s countdown begins → speak
- At 90s: auto-stop, audio uploads, Whisper transcribes, Claude evaluates
- Feedback shows on screen:
  - Scores: Accuracy / Structure / Language / Pace (wpm)
  - Inline-corrected transcript with `**fixes**` highlighted
  - 3 specific fixes (e.g., "Use 'captures' instead of 'remembers' for tech audience")
- Tap "Next" → next random prompt, or "Skip" if unfamiliar concept (doesn't count toward streak)
- Tap "End session" whenever — at least 1 completed rep keeps streak alive

---

## Architecture

### Stack
- **Frontend:** Next.js (App Router) + Tailwind, mobile-first PWA
- **API:** Next.js route handlers
- **DB:** Neon Postgres
- **STT:** OpenAI Whisper API (server-side)
- **LLM:** Claude Sonnet 4.6 (`claude-sonnet-4-6`), with prompt caching on the system rubric
- **Auth:** Shared-secret cookie. `APP_SECRET` env var on Vercel. First visit on a device asks for the secret once; sets a long-lived cookie.
- **Hosting:** Vercel (free tier)

### Data model (minimal)

```sql
CREATE TABLE reps (
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  prompt_term   TEXT NOT NULL,
  prompt_text   TEXT NOT NULL,
  transcript    TEXT NOT NULL,
  duration_sec  INTEGER NOT NULL,
  scores        JSONB NOT NULL,   -- { accuracy, structure, language, pace_wpm }
  inline_correction TEXT NOT NULL, -- markdown with **fixes** highlighted
  fixes         JSONB NOT NULL    -- [string, string, string]
);

CREATE TABLE skipped_concepts (
  id            SERIAL PRIMARY KEY,
  skipped_at    TIMESTAMPTZ DEFAULT NOW(),
  prompt_term   TEXT NOT NULL
);
```

No user_id (solo app). No prompts table — prompts live in `prompts.json` in the repo.

### Audio flow
1. Browser records via MediaRecorder API (Opus codec)
2. On stop, upload blob to `/api/transcribe`
3. Server calls Whisper API
4. Server calls Claude with prompt + transcript
5. Server inserts row into `reps`
6. Server returns evaluation JSON to client
7. Client renders feedback screen

Audio blob is **not persisted** anywhere.

---

## Evaluation design

### System prompt (cached)

```
You are an English speaking coach for technical job interviews.
Grade spoken explanations on a 1–10 scale across:
- Accuracy: Does the explanation match the concept correctly?
- Structure: Does it go intro → mechanism → tradeoff/example?
- Language: Grammar, word choice, vocabulary appropriate for senior audience
- Pace: target 110–150 wpm

Return strict JSON only. Be specific in fixes — quote the user's actual words.
```

### User message (per rep)

```
Prompt: {prompt_text}
Transcript: {transcript}
Duration: {duration_sec}s
Word count: {n}
WPM: {n / duration_sec * 60}

Return:
{
  "scores": { "accuracy": int, "structure": int, "language": int, "pace_wpm": int },
  "inline_correction": "<markdown with **fixes**>",
  "fixes": ["fix 1", "fix 2", "fix 3"]
}
```

### Cost estimate
- ~500 input + 500 output tokens per rep
- Sonnet 4.6: ~$0.009 per rep
- 5 reps/day × 30 days = ~$1.35/month
- Whisper API: ~$0.006 per 60s clip
- Total: ~$2–3/month all-in

---

## Build plan

Estimated total: **15–20 hours focused work**, realistic over 2–3 weekends.

```
1. Next.js PWA scaffold + Tailwind + manifest      → verify: installs to phone home screen
2. Shared-secret cookie middleware                  → verify: blocks visitors without secret
3. Neon Postgres + schema migration                 → verify: can insert + query a row
4. prompts.json (filter ~20 concepts from week1.md) → verify: prompt list loads in app
5. Main screen + "Start session" button             → verify: looks clean on iPhone Safari
6. Rep screen: prompt display + mic button + 90s timer + countdown → verify: timer auto-stops
7. MediaRecorder → /api/transcribe → Whisper        → verify: 60s of my speech transcribes
8. /api/evaluate → Claude Sonnet 4.6 with cached system prompt → verify: returns valid scored JSON
9. Feedback screen: render scores + inline-corrected transcript + 3 fixes → verify: readable on phone
10. Streak counter (today's completed reps)          → verify: increments on completion, ignores skips
11. Deploy to Vercel + Neon connection              → verify: works from phone PWA, multi-device sync
```

### v0 ship criteria
- Open PWA on iPhone Safari → installable to home screen
- Tap Start → tap mic → talk for 60s → see real Claude evaluation feedback
- Repeat across iPhone, Mac, Windows; all reps appear in same history
- 3 consecutive days of real use without crashes

---

## Future scope (v1+)

| Version | Adds |
|---|---|
| v0.1 | Streak deprioritization for skipped concepts |
| v0.5 | Reference answers (Method B from Q9) for prompts with inconsistent scoring |
| v1.0 | Mock interview mode: multi-turn, follow-up questions, interviewer TTS voice, feedback at session end |
| v1.5 | Progress trends: weekly score deltas, retention rate per concept |
| v2.0 | LLM-generated prompts (Method C from Q6) for topic variety |
| v2.0 | Spaced-repetition scheduler on top of `/cards` (currently sequential only) |

---

## Open items (next grill)

Not yet decided. To resolve before or during build:

- Error UX: what shows when Whisper API errors? When Claude API errors? Mic permission denied?
- Onboarding: what does first-ever visit look like? (Set secret, do a test rep?)
- Visual design: color palette, typography, dark mode
- Prompt curation: which ~20 of the 65 week1 terms become Deep mode prompts?
- Week 2-6 content: drafted (65 terms each); not yet wired into prompts.json

---

## Appendix — curriculum overview

| Week | Topic | Status |
|---|---|---|
| 1 | JavaScript / TypeScript / Async | 65 vocab terms drafted (`curriculum/week1.md`) |
| 2 | React + State | 65 terms drafted (`curriculum/week2.md`) |
| 3 | Backend + API | 65 terms drafted (`curriculum/week3.md`) |
| 4 | System Design | 65 terms drafted (`curriculum/week4.md`) |
| 5 | LLM in production | 65 terms drafted (`curriculum/week5.md`) |
| 6 | Agents + RAG | 65 terms drafted (`curriculum/week6.md`) |

---

## Provenance

- **Date drafted:** 2026-05-27
- **Designed via:** `grill-me` skill (10 questions, ~30 min)
- **Author:** Claude Opus 4.7 (1M context)
- **Status:** v0 design locked. Ready to build.
