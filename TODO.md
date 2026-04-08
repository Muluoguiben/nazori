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

- [ ] Design and replace placeholder icons (current 1x1 PNG)
- [ ] Verify dark mode across all pages (Popup, Options, Bubble)
- [ ] End-to-end test right-click context menu translation
- [ ] Tune LRU cache size based on real usage
- [ ] Add keyboard shortcut customization UI
- [ ] Translation history search and re-view in Options
- [ ] CSV import/export testing with real terminology files
- [ ] Bubble position edge cases (iframe, very long pages, narrow viewports)
- [ ] Error UX polish (offline, rate limit countdown, retry)

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
- [ ] Test coverage > 80% threshold enforcement in CI
- [ ] Chrome Web Store submission (prepare listing assets, privacy policy)
- [ ] Set up Cloudflare analytics monitoring for Worker
- [ ] Add `CONTRIBUTING.md` and development onboarding guide
