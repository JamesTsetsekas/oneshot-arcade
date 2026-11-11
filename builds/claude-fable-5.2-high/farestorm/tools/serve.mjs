// Minimal static file server that mounts dist/ under a sub-path, mirroring how the arcade hosts builds.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

export function serve(port = 5372, base = '/play/claude-fable-5.2-high/farestorm/') {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (!url.pathname.startsWith(base)) { res.writeHead(404); res.end('outside base'); return; }
      let rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      const st = await stat(file);
      const target = st.isDirectory() ? path.join(file, 'index.html') : file;
      const data = await readFile(target);
      res.writeHead(200, { 'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${port}${base}` })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { url } = await serve(Number(process.env.PORT) || 5372);
  console.log('serving dist at', url);
}
