const CACHE_NAME = 'still-alive-v2';

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // 只缓存确定存在的核心资源
      const coreAssets = [
        '/',
        '/index.html',
        '/icon.svg',
        '/sw.js'
      ];
      
      // 使用 Promise.allSettled 确保单个资源失败不影响整体
      return Promise.allSettled(
        coreAssets.map(url => 
          cache.add(url).catch(err => {
            // 静默处理错误，不输出警告（避免控制台噪音）
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
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 跳过跨域请求和外部资源
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    // 先尝试网络请求
    fetch(event.request)
      .then((response) => {
        // 如果请求成功，缓存响应
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时，尝试从缓存获取
        return caches.match(event.request);
      })
  );
});