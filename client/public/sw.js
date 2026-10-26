const CACHE_NAME = 'electrocare-v3';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Install: pre-cache critical shell assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Precache skipped for ${url}:`, err);
          })
        )
      );
    })
  );
});

// Activate: clean up older caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: intelligent routing for SPA navigation, bypassing API and external calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // 1. Only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass API calls, WebSockets, Supabase, and Google Maps services
  if (
    url.includes('/api/') ||
    url.includes('/socket.io/') ||
    url.includes('supabase.co') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // 3. SPA Navigation requests (e.g. /admin, /technician, /shop)
  // Attempt network first; if offline or network fails, serve SPA shell /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedShell = (await cache.match('/index.html')) || (await cache.match('/'));
        if (cachedShell) return cachedShell;
        return new Response('Application offline. Please reconnect to the internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
    );
    return;
  }

  // 4. Static assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          // Cache successful same-origin responses
          if (networkResponse && networkResponse.status === 200 && url.startsWith(self.location.origin)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Graceful fallback to avoid unhandled promise rejection
          return new Response('', { status: 408, statusText: 'Offline or asset unavailable' });
        });
    })
  );
});