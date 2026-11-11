// Tiny static file server used for sub-path verification and screenshots: node tools/serve.mjs [port] [prefix]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] ?? 5512);
const prefix = (process.argv[3] ?? '/play/claude-sonnet-5.5-high/ashfall/').replace(/\/?$/, '/');
const root = resolve(process.cwd(), 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm' };

export function startServer(p = port, pre = prefix) {
  const server = createServer((req, res) => {
    let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!url.startsWith(pre)) {
      res.writeHead(404);
      res.end('not under prefix');
      return;
    }
    url = url.slice(pre.length) || 'index.html';
    const file = normalize(join(root, url));
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(p, '127.0.0.1', () => ok(server)));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  await startServer();
  console.log(`serving dist at http://127.0.0.1:${port}${prefix}`);
}
