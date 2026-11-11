// Serves dist/ from a sub-path and captures real in-game screenshots with a
// headless Chromium-family browser (system Edge/Chrome via playwright-core).
// Usage: node scripts/screenshot.mjs [--wait=SECONDS] [--seed=N]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'oneshot');
const PORT = 5452;
const BASE = '/play/claude-opus-5.5-high/skybreak/';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(BASE)) { res.writeHead(404); res.end('not under sub-path'); return; }
  let p = path.join(dist, url.slice(BASE.length));
  if (p.endsWith(path.sep) || url.endsWith('/')) p = path.join(p, 'index.html');
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); res.end('missing'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));
console.log(`serving dist at http://localhost:${PORT}${BASE}`);

const launchOpts = { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] };
let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ ...launchOpts, channel }); console.log('browser:', channel); break; } catch (e) { console.log(`no ${channel}: ${e.message.split('\n')[0]}`); }
}
if (!browser) { server.close(); throw new Error('No Chromium-family browser available'); }
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

try {
  // menu
  await page.goto(`http://localhost:${PORT}${BASE}`, { waitUntil: 'load' });
  await page.waitForSelector('.menu', { timeout: 20000 });
  await page.screenshot({ path: path.join(out, 'menu.png') });
  console.log('menu ok');
  // practice range (autopilot off: shows the pause card since there is no pointer lock in headless)
  if (args.practice) {
    await page.goto(`http://localhost:${PORT}${BASE}?autoplay=practice`, { waitUntil: 'load' });
    await page.waitForSelector('.hud', { timeout: 120000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(out, 'practice.png') });
    console.log('practice ok');
  }
  // autoplay solo match: local seat driven by bot AI, real production build
  const seed = args.seed ?? '7';
  await page.goto(`http://localhost:${PORT}${BASE}?autoplay=solo&seed=${seed}`, { waitUntil: 'load' });
  await page.waitForSelector('.hud', { timeout: 180000 });
  console.log('hud up');
  const shots = (args.shots ?? '12,40,70').split(',').map(Number);
  let t = 0;
  for (const [i, s] of shots.entries()) {
    await page.waitForTimeout((s - t) * 1000);
    t = s;
    const info = await page.evaluate(() => {
      const el = document.querySelector('.counters');
      return { counters: el?.textContent ?? '', mode: document.querySelector('.modeline')?.textContent ?? '', fps: document.querySelector('.fps')?.textContent ?? '' };
    });
    const main = Number(args.main ?? shots[shots.length - 1]);
    const file = path.join(out, s === main ? 'screenshot.png' : `gameplay-${s}s.png`);
    await page.screenshot({ path: file });
    console.log(`shot @${s}s ->`, path.basename(file), JSON.stringify(info));
  }
} finally {
  console.log('console errors:', errors.length ? errors.slice(0, 10) : 'none');
  await browser.close();
  server.close();
}
