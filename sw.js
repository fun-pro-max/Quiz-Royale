const CACHE_NAME = 'quiz-royale-v1';
const assets = [
  'index.html',
  'style.css',
  'script.js',
  'ChatGPT Image Mar 31, 2026, 08_22_00 AM.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});