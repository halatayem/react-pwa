const CACHE_NAME = "bilar-static-v3";
const CACHE_DYNAMIC_NAME = "bilar-dynamic-v3";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); 
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== CACHE_DYNAMIC_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim(); 
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@react-refresh") ||
    url.pathname.includes("hot-update")
  ) {
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
              cache.put(event.request, res.clone()); 
              return res;
            });
          })
          .catch(() => {
            if (event.request.headers.get("accept")?.includes("text/html")) {
              return caches.match("./offline.html");
            }
          });
      })
    );
  }
});
