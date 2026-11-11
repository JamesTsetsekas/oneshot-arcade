/**
 * Headless verification + screenshot capture against the production build (dist/), served from a
 * sub-path to prove relative URLs work. Usage: node scripts/capture.mjs [shots|probe]
 * Requires a local Chrome/Edge (playwright-core, no browser download).
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');
const SUB = '/play/claude-sonnet-5.5-high/farestorm/';
const PORT = 5571;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.map': 'application/json' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!p.startsWith(SUB)) { res.writeHead(404); res.end('not under sub-path'); return; }
  p = p.slice(SUB.length) || 'index.html';
  const f = join(root, p);
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': mime[extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
}).listen(PORT);

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));
if (!exe) throw new Error('No Chrome/Edge found');

const mode = process.argv[2] || 'shots';
await mkdir('oneshot', { recursive: true });
const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
const url = (q) => `http://localhost:${PORT}${SUB}${q}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = () => page.evaluate(() => {
  const f = window.__farestorm;
  const s = f.sim();
  return { state: f.state(), phase: s.phase, clock: +s.clock.toFixed(1), score: s.displayScore, deliveries: s.deliveries, speed: Math.round(s.speedKmh), trip: !!s.trip, cands: s.fares.candidates.length, traffic: s.traffic.agents.length, collisions: s.collisions, t: +s.time.toFixed(1), calls: f.info().calls, tris: f.info().tris, ratio: f.info().ratio };
});

try {
  if (mode === 'shots') {
    await page.goto(url(''), { waitUntil: 'load' });
    await sleep(5000);
    await page.screenshot({ path: 'oneshot/menu.png' });
    await page.click('[data-mode="arcade"]');
    await sleep(2500);
    await page.screenshot({ path: 'oneshot/garage.png' });
    console.log('menu + setup captured');
    await page.goto(url(`?autostart=arcade&bot=1&seed=${process.argv[4] || 7}&taxi=${process.argv[3] || 'breaker'}&traffic=normal`), { waitUntil: 'load' });
    await sleep(1500);
    const step = (sec) => page.evaluate((s) => window.__farestorm.fast(s), sec);
    await step(4);
    let shot = 0, delivered = 0;
    for (let i = 0; i < 400 && shot < 3; i++) {
      await step(0.5);
      const p = await probe();
      if (p.phase === 'ended') break;
      if (shot === 0 && p.trip && p.speed > 65) { await sleep(900); await page.screenshot({ path: 'oneshot/screenshot.png' }); console.log('gameplay shot', JSON.stringify(p)); shot++; }
      if (p.deliveries > delivered) {
        delivered = p.deliveries;
        if (shot === 1) { await sleep(500); await page.screenshot({ path: 'oneshot/delivery.png' }); console.log('delivery shot', JSON.stringify(p)); shot++; }
      }
      if (shot === 1 && p.trip && p.speed > 100) { await sleep(600); await page.screenshot({ path: 'oneshot/gameplay-2.png' }); console.log('fast shot', JSON.stringify(p)); }
    }
    for (let i = 0; i < 700; i++) { await step(1); const p = await probe(); if (p.phase === 'ended') { console.log('shift ended', JSON.stringify(p)); break; } }
    await sleep(6500);
    await page.screenshot({ path: 'oneshot/results.png' });
    console.log('final', JSON.stringify(await probe()));
  } else if (mode === 'drift') {
    // human-style keyboard run: accelerate, snap-drift, boost
    await page.goto(url('?autostart=arcade&taxi=gull&traffic=calm'), { waitUntil: 'load' });
    await sleep(4500);
    await page.keyboard.down('KeyW');
    for (let i = 0; i < 24; i++) { await sleep(500); const p = await probe(); if (p.speed > 85) break; }
    console.log('cruise', JSON.stringify(await probe()));
    await page.keyboard.down('KeyD');
    await page.keyboard.down('Space');
    await sleep(350);
    await page.keyboard.up('Space');
    for (let i = 0; i < 4; i++) {
      await sleep(250);
      await page.screenshot({ path: `oneshot/drift-${i + 1}.png` });
      const s = await page.evaluate(() => { const v = window.__farestorm.sim().vehicle; return { drifting: v.drifting, slip: +v.slip.toFixed(2), speed: Math.round(v.speed * 3.6), yaw: +v.yawRate.toFixed(2) }; });
      console.log('drift', JSON.stringify(s));
    }
    await page.keyboard.up('KeyD');
    await page.keyboard.down('ShiftLeft');
    await sleep(600);
    await page.screenshot({ path: 'oneshot/boost.png' });
    console.log('boost', JSON.stringify(await probe()));
  } else if (mode === 'ui') {
    // menu -> time trial -> bot drives -> results; plus pause, settings, records, credits, garage
    await page.goto(url('?bot=1'), { waitUntil: 'load' });
    await sleep(3500);
    for (const g of ['records', 'settings', 'credits', 'garage']) {
      await page.click(`[data-go="${g}"]`);
      await sleep(600);
      await page.screenshot({ path: `oneshot/ui-${g}.png` });
      await page.click('[data-back]');
      await sleep(400);
    }
    await page.click('[data-mode="trial"]');
    await sleep(800);
    await page.screenshot({ path: 'oneshot/setup-trial.png' });
    await page.click('[data-start]');
    await sleep(1200);
    await page.screenshot({ path: 'oneshot/trial-start.png' });
    await page.keyboard.press('Escape');
    await sleep(800);
    await page.screenshot({ path: 'oneshot/pause.png' });
    await page.keyboard.press('Escape');
    await sleep(500);
    for (let i = 0; i < 400; i++) { await page.evaluate(() => window.__farestorm.fast(1)); const p = await probe(); if (p.phase === 'ended') { console.log('trial ended', JSON.stringify(p)); break; } }
    await sleep(6000);
    await page.screenshot({ path: 'oneshot/trial-results.png' });
    console.log('state', JSON.stringify(await probe()));
  } else {
    await page.goto(url(`?autostart=arcade&bot=1&taxi=${process.argv[3] || 'breaker'}&traffic=normal`), { waitUntil: 'load' });
    for (let i = 0; i < Number(process.argv[4] || 40); i++) {
      await sleep(400);
      await page.evaluate(() => window.__farestorm.fast(20));
      const p = await probe();
      console.log(JSON.stringify(p));
      if (p.state === 'results') { await page.screenshot({ path: 'oneshot/results.png' }); break; }
    }
  }
} finally {
  console.log('console issues:', logs.length ? '\n' + logs.slice(0, 15).join('\n') : 'none');
  await browser.close();
  server.close();
}
