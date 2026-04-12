# Nazori (なぞり)

A Chrome extension for professional domain-aware translation with built-in terminology management (RAG). Select any text on any webpage, get instant streaming translations with consistent terminology.

## Features

- **Select-to-translate** -- highlight text on any webpage, get translations in a floating bubble with typewriter effect
- **13 languages** -- Chinese (Simplified & Traditional), English, Estonian, Japanese, Korean, French, German, Spanish, Russian, Portuguese, Italian, Arabic
- **4 domains** -- General, Legal, Medical, Technology -- each with preset terminology
- **3 translation modes** -- Quick (speed), Normal (balanced), Refined (two-pass draft + review)
- **Terminology RAG** -- built-in glossary ensures consistent translation of domain-specific terms
- **Streaming** -- real-time SSE translation via Gemini 2.0 Flash, with Workers AI Llama 3.3 70B as fallback
- **Shadow DOM isolation** -- extension UI never conflicts with host page styles
- **Dark mode** -- system-following or manual toggle across all pages
- **Context menu & shortcuts** -- right-click "Translate with Nazori" + Alt+T toggle

## Architecture

```
Chrome Extension (Manifest V3)
├── Content Script  -- text selection & bubble UI (Shadow DOM)
├── Service Worker  -- API routing, term matching, LRU cache
├── Popup           -- quick settings (language, domain, on/off)
└── Options Page    -- term management, history, preferences
        │
        │ HTTPS + SSE
        ▼
Cloudflare Workers (Hono + LangGraph)
  detect language → match terms → build prompt → translate
        │
        ├─ Gemini 2.0 Flash (primary)
        └─ Workers AI Llama 3.3 70B (fallback)
```

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | React 19 + TypeScript + Vite + Shadow DOM + Zustand |
| Backend | Cloudflare Workers + Hono + LangGraph |
| AI (primary) | Google Gemini 2.0 Flash |
| AI (fallback) | Cloudflare Workers AI (Llama 3.3 70B) |
| Testing | Vitest (unit, 80% coverage) + Playwright (27 E2E tests) |
| CI/CD | GitHub Actions |
| i18n | English, 简体中文, Eesti |

## Development

```bash
# Extension
cd extension
npm ci
npm run dev        # watch rebuild
# Load extension/dist/ as unpacked extension in chrome://extensions

# Worker
cd worker
npm ci
npm run dev        # local wrangler dev server (http://localhost:8787)
```

For local development, update `API_BASE_URL` in `extension/src/shared/constants.ts` to `http://localhost:8787`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/translate` | SSE streaming translation |
| `POST` | `/api/v1/translate/full` | Complete JSON response |
| `GET` | `/health` | Health check |

All translation endpoints require `X-Device-Id` header. Rate limit: 30 req/min, 500 req/day per device.

## Documentation

- [SPEC.md](./SPEC.md) -- Full project specification
- [CONTRIBUTING.md](./CONTRIBUTING.md) -- Development setup and onboarding
- [CLAUDE.md](./CLAUDE.md) -- Codebase guide for AI assistants

## License

MIT
