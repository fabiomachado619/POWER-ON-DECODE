const CACHE_NAME = "power-on-decode-static-v1";
const OFFLINE_IGNORE = [
  "/api/",
  "/admin",
  ".bin",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/icons/icon-192.png", "/icons/icon-512.png"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function shouldBypassCache(url) {
  const pathname = new URL(url).pathname;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.includes(".bin")) return true;
  if (pathname.startsWith("/tools/") && pathname.includes("/process")) return true;
  return OFFLINE_IGNORE.some((rule) => pathname.includes(rule));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (shouldBypassCache(request.url)) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(request);
    })
  );
});
