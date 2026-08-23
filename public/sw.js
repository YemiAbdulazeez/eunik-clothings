const CACHE = "eunik-shell-v2";
const ASSETS = ["/", "/index.html", "/images/eunik.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  event.waitUntil(self.clients.claim());
});

function shouldBypassCache(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/v1")) return true;
  if (request.headers.get("Authorization")) return true;
  if (request.mode === "navigate") return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-first for navigations and never cache API / credentialed
  if (shouldBypassCache(event.request)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? caches.match("/index.html");
      }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
