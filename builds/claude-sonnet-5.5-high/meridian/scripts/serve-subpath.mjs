// Serves dist/ under a sub-path (default /play/claude-sonnet-5.5-high/meridian/) to prove relative URLs work.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] || '/play/claude-sonnet-5.5-high/meridian/';
const port = Number(process.argv[3] || 5561);
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!url.startsWith(base)) { res.writeHead(404); res.end('outside base'); return; }
  let rel = url.slice(base.length) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log('serving', base, 'on', port));
