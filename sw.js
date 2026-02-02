/* ================================
   ZYPSO MART – SAFE SERVICE WORKER
   ================================ */

const CACHE_NAME = 'zypso-static-v3';

/**
 * ONLY static assets
 * (NO API / Firebase / Firestore here)
 */
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/firebase.js',
  '/admin.html',
  '/admin.js',
  '/manifest.json',
  '/logo.png',
  '/map-icon.png'
];

/* ================================
   INSTALL
   ================================ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ================================
   ACTIVATE
   ================================ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ================================
   FETCH
   ================================ */
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url;

  /**
   * 🚫 NEVER intercept Firebase / APIs
   */
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('nominatim.openstreetmap.org')
  ) {
    return; // Let browser handle it
  }

  /**
   * ✅ Only cache GET requests
   */
  if (req.method !== 'GET') {
    return;
  }

  /**
   * Cache-first strategy ONLY for static assets
   */
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(req)
        .then(response => {
          // Safety checks
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback (optional)
          if (req.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
