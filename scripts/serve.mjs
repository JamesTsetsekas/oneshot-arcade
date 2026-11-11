// Serve site/ locally at http://127.0.0.1:4160 (run `npm run site` first).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib/catalog.mjs";

const site = path.join(root, "site");
const port = Number(process.env.PORT ?? 4160);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".ktx2": "image/ktx2",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
if (!fs.existsSync(path.join(site, "index.html"))) {
  console.error("site/ is missing. Run `npm run setup` then `npm run site` first.");
  process.exit(1);
}
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }
    let file = path.resolve(site, "." + pathname);
    if (file !== site && !file.startsWith(site + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { Location: pathname + "/" }).end();
        return;
      }
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mime[ext] ?? "application/octet-stream",
      "Cache-Control":
        ext === ".html" || ext === ".json" || file.endsWith("sw.js") ? "no-store" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => console.log(`Oneshot Arcade: http://127.0.0.1:${port}  (Ctrl+C to stop)`));
