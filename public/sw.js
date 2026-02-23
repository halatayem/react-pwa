const STATIC_CACHE = "bilar-static-v6";
const DYNAMIC_CACHE = "bilar-dynamic-v6";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // stoppa chrome-extension crash
  if (!req.url.startsWith("http")) return;
  if (req.method !== "GET") return;

  // API: /bilar network-first + cache fallback
  if (req.url.includes("/bilar")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (!res || res.status !== 200) return res;
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(req, res.clone());
            return res;
          });
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            if (cached) return cached;
            return new Response("[]", {
              headers: { "Content-Type": "application/json" },
            });
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          if (!res || res.status !== 200) return res;

          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(req, res.clone());
            return res;
          });
        })
        .catch(() => {
          // offline.html
          if (req.headers.get("accept")?.includes("text/html")) {
            return caches.match("/offline.html");
          }
          return new Response("", { status: 504 });
        });
    })
  );
});