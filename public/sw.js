const CACHE_NAME = "tiketin-cache-v1";
const ASSETS_TO_CACHE = [
  "/favicon.png",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First, Cache Fallback)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Exclude API requests, Supabase, and Midtrans from Service Worker caching
  if (
    url.pathname.startsWith("/api") || 
    url.host.includes("supabase.co") || 
    url.host.includes("midtrans.com") ||
    url.host.includes("sandbox.midtrans.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for local pages and static assets
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
        });
      })
  );
});
