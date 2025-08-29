const CACHE_NAME = 'point-art-hub-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/point-art-logo-optimized.svg',
  '/src/assets/*'
];

// Critical routes that should work offline
const criticalRoutes = [
  '/',
  '/auth',
  '/profile'
];

// API endpoints to cache for offline functionality
const apiEndpoints = [
  '/api/user',
  '/api/profile'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/') || event.request.url.includes('/rest/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached page or offline page for navigation requests
          return caches.match(event.request)
            .then((response) => {
              return response || caches.match('/');
            });
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Handle background sync for critical operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales-data') {
    event.waitUntil(syncSalesData());
  }
});

// Function to sync sales data when connection is restored
function syncSalesData() {
  // This would handle syncing any offline sales data
  // Implementation would depend on how sales data is stored locally
  return Promise.resolve();
}