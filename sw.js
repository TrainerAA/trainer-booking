/**
 * Trainer AA — minimal service worker for installability + offline shell.
 * API calls (Google Apps Script) always use the network.
 */
const CACHE_NAME = 'trainer-aa-v1';

function scopePath() {
  return new URL(self.registration.scope).pathname;
}

function asset(path) {
  const base = scopePath();
  return base + path.replace(/^\//, '');
}

const PRECACHE = [
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-512.png'
].map(asset);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (
    url.includes('script.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('gstatic.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
