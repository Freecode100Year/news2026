const CACHE_NAME = 'prompter-cache-v2.4.1';
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 页面 navigation 及 HTML/JS 使用 Network First 策略，保障系统迭代最新逻辑实时生效
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html') || event.request.url.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // 静态资源使用 Cache First 策略
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
