const CACHE_NAME = 'sovereign-terminal-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx'
];

// Install Service Worker and cache essential static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Sovereign ServiceWorker] Pre-caching offline asset shell...');
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('[Sovereign ServiceWorker] Pre-cache warning: some static assets are generated dynamically.', error);
      });
    })
  );
  // Force active state instantly
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Sovereign ServiceWorker] Clearing old system cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategist: Cache First falling back to Network, with exception of live API endpoints
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude real-world backend and exchange API routes from Service Worker hijack so they always run live
  if (url.pathname.startsWith('/api/') || url.hostname.includes('kraken.com') || url.hostname.includes('coinbase.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to keep the cache updated
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Quietly ignore network failures during background sync */ });
        return cachedResponse;
      }

      // If not in cache, request from live network and cache for next time
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If offline and request is for navigating to HTML pages, fall back to shell index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
