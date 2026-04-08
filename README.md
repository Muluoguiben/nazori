# Nazori (なぞり)

A Chrome extension for professional domain-aware translation with built-in terminology management (RAG). Select any text on any webpage, get instant translations with consistent terminology.

## Features

- **Select-to-translate** — Highlight text on any webpage, get translations in a floating bubble
- **12 languages** — Chinese, English, Estonian, Japanese, Korean, French, German, Spanish, Russian, Portuguese, Italian, Arabic
- **Terminology RAG** — Built-in glossary ensures consistent translation of domain-specific terms
- **4 domains** — General, Legal, Medical, Tech
- **Streaming** — Real-time translation with typewriter effect via SSE
- **Shadow DOM isolation** — Extension UI never conflicts with host page styles

## Architecture

```
Chrome Extension (Manifest V3)
├── Content Script — text selection & bubble UI (Shadow DOM)
├── Service Worker — API routing, term matching, caching
├── Popup — quick settings
└── Options Page — term management, history, preferences
        │
        │ HTTPS + SSE
        ▼
Backend Proxy (Cloudflare Workers + Hono)
        │
        ▼
Claude API (Sonnet 4.6)
```

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | React + TypeScript + Vite + Shadow DOM |
| Backend | Cloudflare Workers + Hono |
| AI | Claude API (claude-sonnet-4-6) |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

## Development

```bash
# Extension
cd extension
npm install
npm run dev        # dev mode with HMR
npm run build      # production build

# Backend
cd worker
npm install
npm run dev        # local dev server
npm run deploy     # deploy to Cloudflare
```

## Documentation

- [SPEC.md](./SPEC.md) — Full project specification

## License

MIT
