const CACHE_NAME = 'litheral-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/auth.html',
  '/manifest.json',
  '/icon.svg',
  '/IMG_20260120_001022_124.png'
];

// Install & Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate & Clean
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)));
    })
  );
  return self.clients.claim();
});

// Fetch Logic
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
