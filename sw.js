const CACHE_NAME = 'litheral-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the new service worker to become active immediately
});

self.addEventListener('fetch', (event) => {
    // Network first, falling back to cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
