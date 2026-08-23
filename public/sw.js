const SHELL = "eunik-shell-v3";
const IMAGES = "eunik-images-v1";
const ASSETS = ["/", "/index.html", "/images/eunik.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(ASSETS).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL, IMAGES]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)))),
  );
  event.waitUntil(self.clients.claim());
});

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  if (/\.(avif|webp|jpe?g|png|gif|svg)(\?|$)/i.test(url.pathname)) return true;
  if (url.hostname.includes("res.cloudinary.com")) return true;
  if (url.origin === self.location.origin && url.pathname.startsWith("/images/")) return true;
  return false;
}

function shouldBypassCache(request, url) {
  if (url.pathname.startsWith("/v1")) return true;
  if (request.headers.get("Authorization")) return true;
  if (request.mode === "navigate") return true;
  return false;
}

/** Cache-first images (local + Cloudinary) so revisits paint instantly. */
async function imageCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Soft refresh in background
    void fetch(request)
      .then((response) => {
        if (response.ok) {
          void caches.open(IMAGES).then((cache) => cache.put(request, response.clone()));
        }
      })
      .catch(() => undefined);
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    void caches.open(IMAGES).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (isImageRequest(event.request, url)) {
    event.respondWith(
      imageCacheFirst(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? Response.error();
      }),
    );
    return;
  }

  if (shouldBypassCache(event.request, url)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? caches.match("/index.html");
      }),
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(SHELL).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
  }
});
