// Minimal static server that hosts dist/ under a sub-path, to verify sub-path deployment.
// Usage: node tools/serve.mjs [port] [basePath]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port = +(process.argv[2] ?? 5401);
const base = process.argv[3] ?? '/play/claude-opus-5.5-high/shardfront/';
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(base)) { res.writeHead(404); res.end('not under base path'); return; }
  let rel = url.slice(base.length) || 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving dist at http://localhost:${port}${base}`));
