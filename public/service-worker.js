const CACHE_NAME = 'prompter-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './director.html',
  './anchor.html',
  './qrcode.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
