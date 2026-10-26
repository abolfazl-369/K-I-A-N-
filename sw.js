const CACHE_NAME = 'kian-cache-v56';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // add each file on its own so one missing file can't break the whole cache
      Promise.all(ASSETS.map((a) => cache.add(a).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Puter, fonts, KaTeX etc. go straight to the network

  // Network-first so updates show up immediately; keep a fresh copy for offline use.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
