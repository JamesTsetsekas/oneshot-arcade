// Minimal static server that mounts dist/ under a sub-path (to verify relative asset URLs).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const base = process.env.BASE ?? "/play/claude-opus-5.5-high/farestorm/";
const port = Number(process.env.PORT ?? 5472);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".wasm": "application/wasm" };

export function serve() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (!url.startsWith(base)) { res.writeHead(404); res.end("not under base"); return; }
    let rel = url.slice(base.length) || "index.html";
    const file = normalize(join(root, rel));
    if (!file.startsWith(normalize(root))) { res.writeHead(403); res.end(); return; }
    try {
      const st = await stat(file);
      const f = st.isDirectory() ? join(file, "index.html") : file;
      const body = await readFile(f);
      res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (process.argv[1] && process.argv[1].endsWith("serve.mjs")) {
  serve().then(() => console.log(`serving dist at http://localhost:${port}${base}`));
}
