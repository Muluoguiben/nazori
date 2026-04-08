# Nazori TODO

## Deploy & Verify

- [ ] Deploy Worker backend (`cd worker && npx wrangler deploy`)
- [ ] Set Claude API key (`npx wrangler secret put CLAUDE_API_KEY`)
- [ ] Update `API_BASE_URL` in `extension/src/shared/constants.ts` with real Worker URL
- [ ] Rebuild extension (`cd extension && npm run build`)
- [ ] Load `extension/dist/` in Chrome and verify end-to-end translation flow
- [ ] Test streaming translation (typewriter effect)
- [ ] Test term matching (switch to Legal/Medical/Tech domain)
- [ ] Test Popup language/domain switching
- [ ] Test Options page term CRUD and import/export

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

- [ ] Back-translation review (translate -> back-translate -> compare)
- [ ] Full page translation mode
- [ ] PDF viewer text selection support
- [ ] Multi-model support (Claude / GPT / DeepL)
- [ ] Auto-discover terminology from translation context
- [ ] Team collaboration: cloud-synced shared glossaries

## Engineering

- [ ] E2E tests with Playwright (Chrome extension testing)
- [ ] Test coverage > 80% threshold enforcement in CI
- [ ] Chrome Web Store submission (prepare listing assets, privacy policy)
- [ ] Set up Cloudflare analytics monitoring for Worker
- [ ] Add `CONTRIBUTING.md` and development onboarding guide
