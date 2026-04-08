# Contributing to Nazori

## Prerequisites

- Node.js 20+
- npm
- Chrome browser (for testing the extension)

## Repository Layout

The project has two independent packages — install dependencies separately:

```
nazori/
├── extension/   # Chrome extension (React + Vite + TypeScript)
└── worker/      # Cloudflare Workers backend (Hono + LangGraph)
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Muluoguiben/nazori.git
cd nazori
cd extension && npm ci
cd ../worker && npm ci
```

### 2. Run the extension in dev mode

```bash
cd extension
npm run dev          # Watches and rebuilds on changes
```

Then load the extension in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/dist/` directory
4. The extension icon appears in the toolbar

### 3. Run the worker locally

```bash
cd worker
npm run dev          # Starts wrangler dev server
```

You'll need to update `API_BASE_URL` in `extension/src/shared/constants.ts` to point to `http://localhost:8787` during local development.

## Development Workflow

### Code quality checks

Run these before committing:

```bash
# Extension
cd extension
npx tsc --noEmit     # Type check
npm run lint         # ESLint
npm run format       # Prettier (writes fixes)
npm test             # Vitest

# Worker
cd worker
npx tsc --noEmit
npm run lint
npm run format
npm test
```

### Formatting rules

Configured in `.prettierrc` at the repo root:
- Semicolons, single quotes, trailing commas
- 100-character line width, 2-space indentation

### Building for production

```bash
cd extension
npm run build        # Type-checks then builds to dist/
```

## Project Architecture

### Extension

| Directory | Purpose |
|-----------|---------|
| `src/background/` | Service Worker — translation streaming, term CRUD, LRU cache |
| `src/content/` | Content Script — text selection, floating bubble UI (Shadow DOM) |
| `src/popup/` | Browser action popup — quick settings |
| `src/options/` | Options page — term management, history, full settings |
| `src/shared/` | Shared types, constants, utilities |

### Worker

| Directory | Purpose |
|-----------|---------|
| `src/graph/` | LangGraph pipeline: detect → match terms → prompt → translate |
| `src/middleware/` | CORS, auth (device ID), rate limiting |
| `src/routes/` | Translation endpoints (SSE streaming + full response) |

## Adding a New Language

1. Add the language code to the `LangCode` type in `extension/src/shared/types.ts`
2. Add the language entry to `LANGUAGES` in `extension/src/shared/constants.ts`
3. Add detection rules in `extension/src/shared/detectLanguage.ts`
4. Add preset terms (if applicable) in `extension/src/shared/presetTerms.ts`

## Adding a New Domain

1. Add the domain to the `Domain` type in `extension/src/shared/types.ts`
2. Add the domain to `DOMAINS` and `DOMAIN_LABELS` in `extension/src/shared/constants.ts`
3. Add domain-specific prompt instructions in `worker/src/graph/nodes.ts`
4. Add a storage key pattern `terms:<domain>` in `StorageSchema`
5. Add preset terms in `extension/src/shared/presetTerms.ts`

## Running Tests

```bash
# All extension tests
cd extension && npm test

# All worker tests
cd worker && npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

## Regenerating Icons

```bash
node scripts/generate-icons.js
```

This generates `icon-16.png`, `icon-48.png`, and `icon-128.png` in `extension/public/assets/`.
