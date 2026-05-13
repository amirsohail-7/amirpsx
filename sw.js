// PSX Portfolio PWA — Service Worker
const CACHE = "psx-v1";
const ASSETS = ["./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Price fetch requests — network first, fall through on fail (app handles fallback)
  if (url.hostname === "sarmaaya.pk" || url.hostname === "dps.psx.com.pk") {
    e.respondWith(
      fetch(e.request, { mode: "no-cors" })
        .catch(() => new Response(JSON.stringify({ offline: true }), { headers: { "Content-Type": "application/json" } }))
    );
    return;
  }

  // App shell — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
