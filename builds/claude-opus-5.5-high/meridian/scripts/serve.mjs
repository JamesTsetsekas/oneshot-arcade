// Minimal static server that hosts dist/ under a sub-path (to verify relative URLs).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };
export function serve(root, prefix = "/play/claude-opus-5.5-high/meridian/", port = 5461) {
  const srv = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!url.startsWith(prefix)) { res.writeHead(404); res.end("not under sub-path"); return; }
    let rel = url.slice(prefix.length) || "index.html";
    const p = normalize(join(root, rel));
    try {
      const st = await stat(p);
      const file = st.isDirectory() ? join(p, "index.html") : p;
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch { res.writeHead(404); res.end("missing " + rel); }
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}
if (process.argv[1] && process.argv[1].endsWith("serve.mjs")) {
  const root = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  serve(root).then(() => console.log("serving dist at http://localhost:5461/play/claude-opus-5.5-high/meridian/"));
}
