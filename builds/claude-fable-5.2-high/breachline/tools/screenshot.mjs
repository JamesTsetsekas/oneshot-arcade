// Serves the production build (dist/) from a sub-path, drives it in a system Chrome/Edge via playwright-core,
// and saves real screenshots + a smoke report to oneshot/. Run with `npm run shots` after `npm run build`.
// The gameplay shots use the built-in ?demo=1 autopilot, which plays through the normal input/prediction path.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = join(process.cwd(), 'dist');
const BASE = '/play/claude-fable-5.2-high/breachline/';
const PORT = Number(process.env.SHOT_PORT ?? 5325);
const OUT = join(process.cwd(), 'oneshot');
const SCORE = Number(process.env.SHOT_SCORE ?? 20);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

if (!existsSync(join(ROOT, 'index.html'))) { console.error('dist/index.html not found - run `npm run build` first'); process.exit(1); }
await mkdir(OUT, { recursive: true });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); res.end('outside sub-path'); return; }
  let rel = decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html';
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const origin = `http://127.0.0.1:${PORT}${BASE}`;
console.log('serving', ROOT, 'at', origin);

const launch = async () => {
  const args = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required'];
  for (const channel of ['chrome', 'msedge']) {
    try { return await chromium.launch({ channel, headless: true, args }); } catch (e) { console.error('launch failed', channel, String(e).slice(0, 100)); }
  }
  return chromium.launch({ headless: true, args });
};
const browser = await launch();
const report = { origin, startedAt: new Date().toISOString(), errors: [], notFound: [], shots: [], match: null };
const newPage = async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => report.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push('console: ' + m.text().slice(0, 200)); });
  page.on('response', (r) => { if (r.status() >= 400) report.notFound.push(`${r.status()} ${r.url()}`); });
  return page;
};
const shot = async (page, name) => { await page.screenshot({ path: join(OUT, name) }); report.shots.push(name); console.log('saved', name); };

try {
  // ---- shell screens
  const page = await newPage();
  await page.goto(origin, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  await page.waitForTimeout(2500);
  await shot(page, 'menu.png');
  await page.click('text=Practice');
  await page.waitForTimeout(700);
  await shot(page, 'practice.png');
  await page.click('text=Edit loadouts');
  await page.waitForTimeout(500);
  await shot(page, 'loadouts.png');
  await page.click('.tab:has-text("attachments")');
  await page.waitForTimeout(300);
  await shot(page, 'loadouts-attachments.png');
  await page.close();

  // ---- a full demo match on the production build
  const game = await newPage();
  await game.goto(`${origin}?demo=1&score=${SCORE}`, { waitUntil: 'load' });
  await game.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  const info = () => game.evaluate('window.__breachline.game.debugInfo()');
  await game.waitForFunction('window.__breachline.game.debugInfo().phase === 1', null, { timeout: 60000 });
  let n = 0, lastKills = 0, best = false, deadShot = false;
  const t0 = Date.now();
  const samples = [];
  while (Date.now() - t0 < 420000) {
    await game.waitForTimeout(700);
    const d = await info();
    samples.push({ t: Math.round((Date.now() - t0) / 1000), fps: Math.round(d.fps), score: d.score, alive: d.alive, kb: Number((d.kb ?? 0).toFixed(1)), err: d.recon?.lastError ?? 0 });
    if (d.ended) break;
    const kills = d.me ? d.me.kills : 0;
    if (kills > lastKills && d.alive) { lastKills = kills; n++; await shot(game, `gameplay-${n}.png`); if (!best) { best = true; await game.screenshot({ path: join(OUT, 'screenshot.png') }); } }
    else if (!d.alive && !deadShot && d.phase === 1) { deadShot = true; await game.waitForTimeout(600); await shot(game, 'death-recap.png'); }
    else if (samples.length % 14 === 0 && d.alive && n < 12) { n++; await shot(game, `gameplay-${n}.png`); }
  }
  if (!best) await game.screenshot({ path: join(OUT, 'screenshot.png') });
  const end = await info();
  await game.waitForTimeout(1500);
  if (end.ended) await shot(game, 'results.png');
  const fpsList = samples.map((s) => s.fps).sort((a, b) => a - b);
  report.match = {
    ended: end.ended, finalScore: end.score, you: end.me, prediction: end.recon, samples: samples.length,
    fpsMedian: fpsList[Math.floor(fpsList.length / 2)], fpsMin: fpsList[0], snapshotKBps: samples.length ? samples[Math.floor(samples.length / 2)].kb : 0,
    maxPredictionErrorCm: Math.max(0, ...samples.map((s) => s.err)) * 100,
    renderer: await game.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return c && e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }),
  };
  await game.close();
} catch (e) {
  report.errors.push('runner: ' + (e && e.message ? e.message : String(e)));
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(join(OUT, 'smoke.json'), JSON.stringify(report, null, 2));
  await browser.close();
  server.close();
}
console.log(JSON.stringify({ errors: report.errors, notFound: report.notFound, match: report.match }, null, 2));
process.exit(report.errors.length ? 1 : 0);
