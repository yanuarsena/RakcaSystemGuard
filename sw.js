/**
 * RAKCA SYSTEM GUARD - Service Worker Script
 * Handles Offline Caching and PWA Shell Lifecycle
 */

const CACHE_NAME = 'rakca-guard-pwa-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap',
  'https://lh3.googleusercontent.com/d/19zAKhQasqz0ulozwHBNOzfdulFxcfDrl',
  'https://lh3.googleusercontent.com/d/1pBbjzdbyy7A9rGjCS_PRxg53pNE51z9g',
  'https://lh3.googleusercontent.com/d/1N7o5tEzYxjl4S9ohq36nk6RhiBDKYuYu',
  'https://lh3.googleusercontent.com/d/1R8RHfqxAS7tDt5zBW6-l16KYBuh9MS1D'
];

// 1. INSTALLATION EVENT - Cache Static App Shell & Custom Branding Images
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching PWA App Shell & Custom Branding Assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATION EVENT - Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignore cross-origin Google Apps Script Web App iframe requests from SW caching to prevent CORS blocks
  if (event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
