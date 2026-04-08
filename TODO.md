# Nazori TODO

## Done

- [x] Project scaffolding (Vite + React + TypeScript + Manifest V3)
- [x] Shared modules (types, constants, language detection, messaging, storage)
- [x] Worker backend (Hono + auth + rate limiting + CORS)
- [x] Background Service Worker (translation, term CRUD, LRU cache)
- [x] Content Script + Bubble UI (Shadow DOM, streaming, smart positioning)
- [x] Popup + Options pages (term management, history, settings)
- [x] Preset terms (75 terms: legal/medical/tech) + i18n (en/zh_CN/et)
- [x] Unit tests (98 passing: extension 70 + worker 28)
- [x] CI/CD (GitHub Actions: ci, release-extension, release-worker)
- [x] Refactor worker to LangGraph framework (StateGraph: detect → match → prompt → translate)
- [x] Multi-model: Gemini 2.0 Flash (primary, free) + Workers AI Llama 3.3 70B (fallback, free)
- [x] Design and replace placeholder icons (indigo "N" at 16/48/128px via `scripts/generate-icons.js`)
- [x] Dark mode across all pages (Popup, Options, Bubble — system + manual toggle)
- [x] Right-click context menu translation (background sends to content script handler)
- [x] Keyboard shortcut handler (Alt+T toggles extension on/off)
- [x] LRU cache size tuned (100 entries, ~100 KB, documented in constants.ts)
- [x] Translation history search and re-view in Options (already implemented)
- [x] CSV/JSON import-export for terminology (already implemented)
- [x] Bubble position edge cases (viewport bounds, flip above/below, horizontal clamp)
- [x] Error UX polish (offline detection, timeout, rate limit, retry button)
- [x] Test coverage > 80% threshold enforcement in CI (vitest coverage-v8)
- [x] `CONTRIBUTING.md` and development onboarding guide
- [x] `CLAUDE.md` codebase guide for AI assistants

## Deploy & Verify

- [ ] Deploy Worker backend (`cd worker && npx wrangler login && npx wrangler deploy`)
- [ ] Set Gemini API key (`npx wrangler secret put GEMINI_API_KEY`)
- [ ] Update `API_BASE_URL` in `extension/src/shared/constants.ts` with real Worker URL
- [ ] Rebuild extension (`cd extension && npm run build`)
- [ ] Load `extension/dist/` in Chrome and verify end-to-end translation flow
- [ ] Test streaming translation (typewriter effect)
- [ ] Test term matching (switch to Legal/Medical/Tech domain)
- [ ] Test Popup language/domain switching
- [ ] Test Options page term CRUD and import/export
- [ ] Verify Gemini → Workers AI fallback works when Gemini quota exhausted

## v1.1 - Experience Polish

- [ ] Add keyboard shortcut customization UI (currently only Alt+T, no UI to remap)
- [ ] Font size setting wired to bubble UI (small/medium/large from Settings)
- [ ] Double-click and hotkey trigger modes in SelectionHandler
- [ ] Term highlighting in bubble translation text (showTermHighlight setting)

## v2 - Advanced Features

- [ ] Add LangGraph nodes for back-translation review (translate → back-translate → compare)
- [ ] Add quality assessment node to LangGraph (confidence scoring)
- [ ] Full page translation mode
- [ ] PDF viewer text selection support
- [ ] Add more model providers (Claude, DeepL, etc.) as LangGraph swap nodes
- [ ] Auto-discover terminology from translation context
- [ ] Team collaboration: cloud-synced shared glossaries

## Engineering

- [ ] E2E tests with Playwright (Chrome extension testing)
- [ ] Chrome Web Store submission (prepare listing assets, privacy policy)
- [ ] Set up Cloudflare analytics monitoring for Worker
