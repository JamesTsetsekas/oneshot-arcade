// Shared helpers for the browser tools: serve dist/ from a nested sub-path and launch an installed
// Chromium-based browser through playwright-core (no browser download needed).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
export const DIST = join(ROOT, 'dist');
export const OUT = join(ROOT, 'oneshot');
export const BASE = '/play/claude-fable-5.2-high/crownfall/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

export async function serveDist(port) {
  if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/index.html missing - run "npm run build" first');
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(BASE)) return void res.writeHead(404).end('only served under ' + BASE);
    const rel = decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html';
    const file = normalize(join(DIST, rel));
    if (!file.startsWith(DIST)) return void res.writeHead(403).end();
    try {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
    } catch {
      res.writeHead(404).end('missing ' + rel);
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { server, origin: `http://127.0.0.1:${port}${BASE}` };
}

export async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      const browser = await chromium.launch({ channel, headless: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
      console.log('browser:', channel, browser.version());
      return browser;
    } catch (e) {
      console.warn('could not launch', channel, String(e).split('\n')[0]);
    }
  }
  throw new Error('No Chromium-based browser (Edge/Chrome) available for playwright-core');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
