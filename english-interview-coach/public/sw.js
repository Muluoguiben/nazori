// Minimal service worker — present so the app is installable on Android/Chrome.
// Offline caching and push notifications are intentionally deferred (out of v0 scope).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass through to the network. A registered fetch handler is required for installability.
});
