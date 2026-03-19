const CACHE_NAME = 'muhasabah-journal-v5';
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install — cache semua assets (except app.html)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — padam cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — ALWAYS go to network first for app.html
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // If requesting the main app, ALWAYS go to network to get latest styles
  if (url.pathname.endsWith('app.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache response baru (except for the main app)
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
