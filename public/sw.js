const SHELL_CACHE = "izborna-shell-v1";
const LEGAL_DATA_CACHE = "legal-data-v1";
const SHELL = ["/", "/offline", "/pravila", "/validator", "/trening/kviz", "/simulator/biracki-dan"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/offline-dataset/")) {
    event.respondWith(caches.open(LEGAL_DATA_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && url.pathname !== "/api/offline-dataset/current") await cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const refresh = fetch(request).then((response) => {
        if (response.ok) return cache.put(request, response.clone()).then(() => response);
        return response;
      });
      if (cached) {
        event.waitUntil(refresh.catch(() => undefined));
        return cached;
      }
      return refresh.catch(async () => (await cache.match("/offline")) || Response.error());
    }));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
