// Minimal static server for dist/ under a sub-path (tests relative-URL correctness). Usage: node tools/serve.mjs [port] [prefix]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const DEFAULT_PREFIX = '/play/claude-sonnet-5.5-high/crownfall/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
export function serve(port = 5542, prefix = DEFAULT_PREFIX) {
  return http.createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!p.startsWith(prefix)) { res.writeHead(404); res.end('not found (outside prefix)'); return; }
    p = p.slice(prefix.length) || 'index.html';
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(port, '127.0.0.1');
}
if (process.argv[1] && process.argv[1].endsWith('serve.mjs')) { const port = Number(process.argv[2] ?? 5542); serve(port); console.log(`serving dist at http://127.0.0.1:${port}${DEFAULT_PREFIX}`); }
