// Ad-hoc browser debugging helper: node tools/debug.mjs "<js expression evaluated in the page>" [shot.png]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/g\//, '') || 'index.html');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(5363, '127.0.0.1', r));
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type() + ':', m.text().slice(0, 300)); });
await page.goto('http://127.0.0.1:5363/g/');
await page.click('text=New Game');
await page.waitForFunction(() => window.__meridian?.state.screen === 'playing', null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 1500));
const steps = process.argv.slice(2);
for (let i = 0; i < steps.length; i++) {
  const s = steps[i];
  if (s.endsWith('.png')) { await page.screenshot({ path: path.join(root, 'oneshot', s) }); console.log('shot', s); }
  else if (/^\d+$/.test(s)) await new Promise((r) => setTimeout(r, Number(s)));
  else if (s.startsWith('key:')) { const [, k, ms] = s.split(':'); await page.keyboard.down(k); await new Promise((r) => setTimeout(r, Number(ms))); await page.keyboard.up(k); }
  else console.log(JSON.stringify(await page.evaluate(`(() => { const g = window.__meridian, s = g.sim, r = g.renderer; ${s} })()`)));
}
await browser.close(); server.close();
