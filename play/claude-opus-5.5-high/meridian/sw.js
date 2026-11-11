// generated — Meridian Run offline cache
const CACHE = "meridian-bd12e55b58";
const FILES = ["./","./assets/basisTextureLoader-DSRyUZVr.js","./assets/ddsTextureLoader-DVu_aDq-.js","./assets/envTextureLoader-CcxvR_1y.js","./assets/exrTextureLoader-BzdckqYv.js","./assets/hdrTextureLoader-DrPTnxp3.js","./assets/iesTextureLoader-Bw2Qk-Wj.js","./assets/index-B5vcXEFb.css","./assets/index-CmE77I1C.js","./assets/ktxTextureLoader-DC0NJyQ7.js","./assets/mesh.vertexData.functions-BYooUupK.js","./assets/react-BdZgHC1P.js","./assets/tgaTextureLoader-D5nla8Mz.js","./icon.svg","./index.html","./manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("meridian-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isDoc = e.request.mode === "navigate";
  if (isDoc) { e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("./")))); return; }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
