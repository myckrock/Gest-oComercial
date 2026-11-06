const CACHE_NAME = 'gestao-comercial-1.1.2';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './pwa.js',
  './manifest.webmanifest',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('gestao-comercial-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate';
  const isVersion = url.pathname.endsWith('/version.json');
  const isPwaScript = url.pathname.endsWith('/pwa.js');

  if (isNavigation || isVersion || isPwaScript) {
    event.respondWith(
      fetch(request, {cache: 'no-store'})
        .then(response => {
          if (response.ok && (isNavigation || isPwaScript)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(isNavigation ? './index.html' : './pwa.js', copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match(isNavigation ? './index.html' : './pwa.js')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
