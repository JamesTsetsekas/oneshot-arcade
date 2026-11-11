// Meridian Run offline cache. Navigation requests are network-first (so updates arrive);
// everything else in scope is cache-first and stored after the first successful fetch.
const CACHE = 'meridian-run-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const store = (res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then(store).catch(() => caches.match(req).then((r) => r || caches.match('./')))); return; }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(store)));
});
