/* =========================================================================
   sw.js — service worker for offline support.
   Cache-first for the app shell + photos, so the game (including its real
   photos) works fully offline once installed.
   ========================================================================= */

const CACHE_NAME = 'cila-zoro-v1';

const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/sounds.js',
  './manifest.json',
  './assets/photos/cila1.jpg',
  './assets/photos/cila2.jpg',
  './assets/photos/cila3.jpg',
  './assets/photos/cila4.jpg',
  './assets/photos/zoro1.jpg',
  './assets/photos/zoro2.jpg',
  './assets/photos/zoro3.jpg',
  './assets/photos/zoro4.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // opportunistically cache same-origin successful responses
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
