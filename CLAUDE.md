# CLAUDE.md

## Project Overview

Nazori is a Chrome extension for domain-aware translation with built-in terminology management (RAG). Users select text on any webpage and receive instant translations with consistent terminology across 12 languages and 4 professional domains (General, Legal, Medical, Technology).

**Architecture**: Chrome Extension (Manifest V3 + React + Vite) communicates with a Cloudflare Workers backend (Hono + LangGraph) that orchestrates AI translation via Google Gemini 2.0 Flash (primary) with Cloudflare Workers AI as fallback.

## Repository Structure

```
nazori/
├── extension/          # Chrome extension (React + TypeScript + Vite)
│   ├── src/
│   │   ├── background/ # Service Worker: messaging hub, term management, cache
│   │   ├── content/    # Content Script: selection UI, floating bubble, Shadow DOM
│   │   ├── popup/      # Quick settings popup
│   │   ├── options/    # Full settings & term management page
│   │   ├── shared/     # Shared types, constants, utilities
│   │   └── assets/
│   ├── public/         # manifest.json, _locales/, icons
│   └── tests/unit/     # Vitest unit tests
├── worker/             # Cloudflare Workers backend (Hono + LangGraph)
│   ├── src/
│   │   ├── index.ts    # Hono app entry point
│   │   ├── graph/      # LangGraph: detect → match terms → prompt → translate
│   │   ├── middleware/  # CORS, auth, rate limiting
│   │   ├── routes/     # Translation endpoints (SSE streaming + full)
│   │   └── types.ts
│   └── tests/          # Vitest unit tests
├── scripts/            # Build utilities (icon generation)
├── .github/workflows/  # CI, release-extension, deploy-worker
├── SPEC.md             # Full project specification
├── CONTRIBUTING.md     # Development setup and onboarding guide
└── TODO.md             # Development roadmap
```

## Quick Reference Commands

All commands run from within either `extension/` or `worker/` directories — there is no root-level package.json.

### Extension (`cd extension`)

```bash
npm ci                  # Install dependencies
npm run dev             # Dev mode with watch rebuild
npm run build           # Type-check + production build (outputs to dist/)
npm test                # Run unit tests (vitest run)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with 80% coverage threshold
npm run lint            # ESLint (src --ext .ts,.tsx)
npm run format          # Prettier write (src/**/*.{ts,tsx,css})
```

### Worker (`cd worker`)

```bash
npm ci                  # Install dependencies
npm run dev             # Local dev server (wrangler dev)
npm run deploy          # Deploy to Cloudflare Workers
npm test                # Run unit tests (vitest run)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with 80% coverage threshold
npm run lint            # ESLint (src --ext .ts)
npm run format          # Prettier write (src/**/*.ts)
```

## CI Pipeline

GitHub Actions runs on push to `main` and all PRs:

1. **lint-and-typecheck** — `tsc --noEmit` for both extension and worker
2. **test-extension** — `npm run test:coverage` in extension/ (80% threshold)
3. **test-worker** — `npm run test:coverage` in worker/ (80% threshold)
4. **build** — Production build of extension (depends on lint)

Always run `tsc --noEmit` and `npm test` in both directories before pushing.

## Code Style & Conventions

### Formatting (Prettier)

- Semicolons: yes
- Quotes: single
- Trailing commas: all
- Print width: 100
- Tab width: 2

### TypeScript

- **Strict mode** enabled in both projects (`strict: true`)
- ES2022 target, ESNext modules, bundler module resolution
- Extension uses path alias: `@shared/*` maps to `src/shared/*`
- Worker uses Cloudflare Workers types

### Naming

- **Types/Interfaces**: PascalCase (`TranslateRequest`, `Domain`, `LangCode`)
- **Variables/Functions**: camelCase (`translateStream`, `matchedTerms`)
- **Constants**: SCREAMING_SNAKE_CASE (`LANGUAGES`, `DEFAULT_SETTINGS`, `DEBOUNCE_MS`)
- **Storage keys**: lowercase with colons (`terms:general`, `terms:legal`, `device_id`)

### Architecture Patterns

- **Extension messaging**: Chrome extension message passing between content script, service worker, popup, and options page. All messages follow the `Message<T>` interface with `type`, `payload`, `requestId`, `timestamp`.
- **Worker pipeline**: LangGraph StateGraph with sequential nodes: detect language -> match terms -> build prompt -> translate (Gemini primary, Workers AI fallback).
- **State management**: Zustand in the extension for lightweight client state.
- **Shadow DOM**: Content script UI is isolated in a Shadow DOM to prevent style conflicts with host pages.
- **Middleware chain**: Hono middleware for CORS, auth (API key), and rate limiting.

## Key Types (extension/src/shared/types.ts)

- `LangCode` — Union of 12 supported language codes
- `Domain` — `'general' | 'legal' | 'medical' | 'tech'`
- `Term` — Terminology entry with multi-language translations
- `TranslateRequest` / `TranslateResponse` — API contract
- `Settings` — User preferences (language, domain, theme, trigger mode)
- `StorageSchema` — Chrome storage shape
- `Message<T>` — Inter-component messaging format

## API Endpoints (Worker)

- `POST /api/v1/translate` — SSE streaming translation
- `POST /api/v1/translate/full` — Complete translation response
- `GET /health` — Health check

## Testing

### Unit Tests (Vitest)
- **Framework**: Vitest 2.1.8 with global test functions (`describe`, `it`, `expect`)
- **Extension tests** (`extension/tests/unit/`): cache, detectLanguage, terms
- **Worker tests** (`worker/tests/`): translate endpoint and LangGraph pipeline
- Tests use mocks for Chrome APIs and external services
- Coverage threshold: 80% (lines/functions/branches/statements)

### E2E Tests (Playwright)
- **Framework**: Playwright with Chromium, runs headed via `xvfb-run`
- **Location**: `extension/e2e/`
- **Run**: `cd extension && npm run test:e2e` (builds then runs Playwright)
- **27 tests** covering: popup UI, options page (tabs, terms, settings, history), content script (bubble show/close/disabled), shadow DOM isolation, extension lifecycle (storage init, service worker, settings sync)
- Uses a local HTTP server to test content script injection on real pages
- Content script is built as IIFE (two-pass Vite build) for broad Chrome compatibility

## Important Notes

- The two packages (extension, worker) are independent — each has its own `package.json`, `tsconfig.json`, and `node_modules`. Always `npm ci` in both.
- The `API_BASE_URL` in `extension/src/shared/constants.ts` must be updated with the actual Cloudflare Workers subdomain before deployment.
- Gemini API key is set as a Cloudflare secret: `npx wrangler secret put GEMINI_API_KEY`
- Extension outputs to `extension/dist/` — load as unpacked extension in Chrome for development.
- The build uses a two-pass Vite process: first pass builds background/popup/options as ES modules, second pass (`BUILD_TARGET=content`) builds the content script as IIFE to avoid `import` statements that fail in some Chrome environments.
- Node.js 20 is used in CI.
