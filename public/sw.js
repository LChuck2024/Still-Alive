const CACHE_NAME = 'still-alive-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/sw.js'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // 使用 addAll 但捕获错误，避免单个资源失败导致整个缓存失败
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[Service Worker] Failed to cache ${url}:`, err);
            return null;
          })
        )
      ).then(() => {
        console.log('[Service Worker] Cache installation completed');
      });
    })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// Fetch Event: Network first, then Cache (Strategy for dynamic content apps)
// or Cache First, then Network (Strategy for static apps).
// Here we use Stale-While-Revalidate logic or simple Cache Fallback.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});