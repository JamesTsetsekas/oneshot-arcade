// Generates dist/sw.js: an offline cache of every built file (relative URLs, sub-path safe).
import { readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const dist = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (!p.endsWith("sw.js")) files.push(relative(dist, p).split("\\").join("/")); } };
walk(dist);
const hash = createHash("sha1");
for (const f of files) hash.update(f + readFileSync(join(dist, f)).length);
const version = hash.digest("hex").slice(0, 10);
const sw = `// generated — Meridian Run offline cache
const CACHE = "meridian-${version}";
const FILES = ${JSON.stringify(["./", ...files.map((f) => "./" + f)])};
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("meridian-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isDoc = e.request.mode === "navigate";
  if (isDoc) { e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("./")))); return; }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
`;
writeFileSync(join(dist, "sw.js"), sw);
console.log(`sw.js: ${files.length} files cached (version ${version})`);
