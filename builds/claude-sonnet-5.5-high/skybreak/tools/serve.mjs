// Tiny static server that serves dist/ under a sub-path (proves the build works from any sub-path).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

export function serve(port = 5552, prefix = '/play/claude-sonnet-5.5-high/skybreak/') {
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!url.startsWith(prefix)) { res.writeHead(404); res.end('not found (outside sub-path)'); return; }
    url = url.slice(prefix.length) || 'index.html';
    const file = path.join(root, url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${port}${prefix}` })));
}
