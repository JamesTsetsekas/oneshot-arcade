// Minimal static server that mounts dist/ under a sub-path, to verify the
// build works when hosted at e.g. /play/claude-opus-5.5-high/protocol/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const direct = !!process.argv[1] && process.argv[1].endsWith('serve.mjs');
const root = path.resolve((direct && process.argv[2]) || 'dist');
const base = (direct && process.argv[3]) || '/play/claude-opus-5.5-high/protocol/';
const port = Number((direct && process.argv[4]) || 5432);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.wasm': 'application/wasm' };

export function serve() {
  const srv = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!url.startsWith(base)) {
      res.writeHead(404);
      res.end('not under base path');
      return;
    }
    let rel = url.slice(base.length) || 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found: ' + rel);
      return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => srv.listen(port, () => resolve(srv)));
}

if (direct) {
  serve().then(() => console.log(`serving ${root} at http://localhost:${port}${base}`));
}
