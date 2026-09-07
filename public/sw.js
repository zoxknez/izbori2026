/*
 * Ručno pisan service worker: transparentne keš politike, bez bundler workaround-a.
 * Dva odvojena lifecycle-a: aplikacioni shell i pravni dataset.
 */
const SHELL_CACHE = "izborna-shell-v2";
const LEGAL_DATA_CACHE = "legal-data-v2";
const ACTIVE_CACHES = [SHELL_CACHE, LEGAL_DATA_CACHE];

const SHELL = [
  "/",
  "/offline",
  "/pravila",
  "/vidim-problem",
  "/kontrolor",
  "/validator",
  "/rokovi",
  "/izvori",
  "/prijavi",
  "/trening/kviz",
  "/simulator/biracki-dan",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  // Pojedinačni put ne sme da obori ceo precache ako jedna ruta zakaže.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(SHELL.map((path) => cache.add(path).catch(() => undefined))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !ACTIVE_CACHES.includes(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Admin i auth rute nikada ne smeju da završe u kešu.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin") || url.pathname.startsWith("/api/auth")) {
    return;
  }

  // Pravni dataset: immutable po verziji, pa cache-first; `current` uvek ide na mrežu.
  if (url.pathname.startsWith("/api/offline-dataset/")) {
    event.respondWith(
      caches.open(LEGAL_DATA_CACHE).then(async (cache) => {
        const isCurrent = url.pathname === "/api/offline-dataset/current";
        if (!isCurrent) {
          const cached = await cache.match(request);
          if (cached) return cached;
        }
        try {
          const response = await fetch(request);
          if (response.ok && !isCurrent) await cache.put(request, response.clone());
          return response;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw error;
        }
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const refresh = fetch(request)
          .then(async (response) => {
            if (response.ok) await cache.put(request, response.clone());
            return response;
          });

        if (cached) {
          event.waitUntil(refresh.catch(() => undefined));
          return cached;
        }
        try {
          return await refresh;
        } catch {
          return (await cache.match("/offline")) || Response.error();
        }
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  // Aktiviranje nove verzije je uvek eksplicitna korisnička radnja iz UI-ja,
  // da reload nikada ne prekine otvoreni incident, trening ili simulaciju.
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
