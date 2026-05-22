const CACHE_NAME = "smart-farming-v3";
const urlsToCache = [
  "/",
  "/dashboard",
  "/parcels",
  "/crops",
  "/data",
  "/alerts",
  "/costs",
  "/settings",
  "/recommendations",
  "/admin",
  "/admin/farmers",
  "/admin/recommendations",
  "/admin/reports",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // Ignorar peticiones que no sean GET o que vayan a la API
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  // Para la página raíz y rutas principales, usar network-first
  const isMainRoute = urlsToCache.some(
    (url) =>
      event.request.url.endsWith(url) ||
      event.request.url === self.location.origin + "/"
  );

  if (isMainRoute) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return response || new Response("Sin conexión", { status: 503 });
          });
        })
    );
  } else {
    // Para el resto, usar cache-first
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});
