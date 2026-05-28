<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# English Interview Coach

A phone-first PWA to practice explaining tech concepts out loud in English, for mid-level full-stack + AI/Agent job interviews. Solo use.

## What's done

- **Spec:** `spec.md` (10 v0 design decisions locked 2026-05-27). Read this first. HTML view at `spec.html`.
- **Curriculum:** `curriculum/week1.md` through `week6.md`. ~390 terms total. Format: simple definition (≤15 words B1), collocations, example, difficulty 1–3, interview use.

## What's next, in priority order

1. **Filter Week 1 → `prompts.json`** — pick ~20 concept-level terms from `curriculum/week1.md` (skip syntax-level ones like "spread operator"). Format: `{ term, prompt, tag }`.
2. **Scaffold Next.js PWA** — App Router + Tailwind + manifest. Mobile-first. Confirm it installs to phone home screen.
3. **Build the one happy-path rep** — tap to start → 90s countdown → MediaRecorder → Whisper STT → Claude Sonnet 4.6 evaluate → render feedback. No DB yet.
4. **Add Neon Postgres + schema** — one `reps` table, one `skipped_concepts` table. See spec for columns.
5. **Shared-secret cookie middleware + Vercel deploy.**

Build estimate: 15–20 hours focused work.

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
spec.md                       v0 design (read first)
spec.html                     rendered version
curriculum/week{1..6}.md      vocab content
prompts.json                  (to be created from week1.md)
```

## Identity / publishing rules

Do NOT push this project to a git remote using a personal or corporate git identity. Use a noreply email and sanitize file content before publishing. See `feedback_sanitize_identity_before_publishing` memory.
