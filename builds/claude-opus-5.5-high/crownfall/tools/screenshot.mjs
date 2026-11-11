// Serves dist/ from a sub-path and captures real screenshots with a headless system browser.
// Usage: node tools/screenshot.mjs [scenario...]   scenarios: menu draft demo tutorial
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve('dist');
const PREFIX = '/play/claude-opus-5.5-high/crownfall/';
const PORT = 5442;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(PREFIX)) { res.writeHead(404); res.end('not under prefix'); return; }
  let p = path.join(root, url.slice(PREFIX.length));
  if (p.endsWith(path.sep) || url.endsWith('/')) p = path.join(p, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end('missing'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));
const base = `http://localhost:${PORT}${PREFIX}`;
const scenarios = process.argv.slice(2).length ? process.argv.slice(2) : ['menu', 'demo'];
let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }); break; } catch (e) { console.log(`launch ${channel} failed: ${e.message.split('\n')[0]}`); }
}
if (!browser) { console.log('No browser available'); process.exit(1); }
fs.mkdirSync('oneshot', { recursive: true });
const errors = [];
async function page(url) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await p.goto(url);
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const sc of scenarios) {
  const [name, arg] = sc.split(':');
  if (name === 'menu') {
    const p = await page(base);
    await sleep(1500);
    await p.screenshot({ path: 'oneshot/menu.png' });
    await p.click('text=Heroes'); await sleep(1500);
    await p.screenshot({ path: 'oneshot/heroes.png' });
    await p.close();
  } else if (name === 'draft') {
    const p = await page(base);
    await sleep(800);
    await p.click('text=Play'); await sleep(300);
    await p.click('text=Find match'); await sleep(3500);
    await p.click('text=Accept'); await sleep(1500);
    await p.click('.hero-tile >> nth=1'); await sleep(5000);
    await p.screenshot({ path: 'oneshot/draft.png' });
    await p.close();
  } else if (name === 'demo') {
    const minutes = Number(arg ?? 9);
    const p = await page(`${base}?demo=${minutes}&seed=11`);
    await p.waitForSelector('.hud .topbar', { timeout: 120000 });
    // wait for action: an enemy hero near our hero (up to 90 s), camera follows our hero
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      const near = await p.evaluate(() => {
        const c = window.__crownfall; const s = c?.session.latest; if (!s) return 0;
        const me = s.ents.find((e) => e.id === s.me.heroId); if (!me || me.st & 128) return 0;
        const foes = s.ents.filter((e) => e.k === 1 && e.tm !== 0 && Math.hypot(e.x - me.x, e.y - me.y) < 11).length;
        const mins = s.ents.filter((e) => e.k === 2 && Math.hypot(e.x - me.x, e.y - me.y) < 14).length;
        return foes * 10 + mins;
      });
      if (near >= 14) break;
      await sleep(500);
    }
    await sleep(700);
    const out = arg2(sc) ?? `oneshot/demo-${minutes}m.png`;
    await p.screenshot({ path: out });
    const info = await p.evaluate(() => { const c = window.__crownfall; return c ? { fps: c.store.state.fps, draws: c.renderer.drawCalls, tris: c.renderer.triangles, transport: c.session.transport.kind, time: c.session.latest?.time, ents: c.session.latest?.ents.length } : null; });
    console.log(sc, JSON.stringify(info));
    await p.close();
  } else if (name === 'playtest') {
    // drive real input through the tutorial: move, rank, cast, shop, ward, recall
    const p = await page(base);
    await sleep(800);
    await p.click('text=Tutorial');
    await p.waitForSelector('.hud .topbar', { timeout: 60000 });
    await sleep(1500);
    const st = () => p.evaluate(() => { const c = window.__crownfall; const s = c.session.latest; const me = s.ents.find((e) => e.id === s.me.heroId); return { x: me.x, y: me.y, ranks: s.me.abilities.map((a) => a.rank), gold: s.me.gold, items: s.me.items.filter(Boolean).map((i) => i.id), wards: s.me.wardCharges, step: c.store.state.tutorialStep, time: s.time, cd: s.me.abilities[0].cd }; });
    const toScreen = (x, y) => p.evaluate(([x, y]) => window.__crownfall.renderer.worldToScreen(x, 0, y), [x, y]);
    console.log('start', JSON.stringify(await st()));
    let s0 = await st();
    let tgt = await toScreen(s0.x + 10, s0.y + 2);
    await p.mouse.click(tgt.x, tgt.y, { button: 'right' });
    await sleep(3500);
    console.log('after right-click move', JSON.stringify(await st()));
    await p.keyboard.down('Control'); await p.keyboard.press('KeyQ'); await p.keyboard.up('Control');
    await sleep(400);
    console.log('after ctrl+q', JSON.stringify(await st()));
    await p.mouse.move(tgt.x + 200, tgt.y - 60);
    await p.keyboard.down('KeyQ'); await sleep(300);
    await p.screenshot({ path: 'oneshot/playtest-aim.png' });
    await p.keyboard.up('KeyQ'); await sleep(400);
    console.log('after Q cast', JSON.stringify(await st()));
    await p.mouse.move(tgt.x + 80, tgt.y + 40);
    await p.keyboard.press('Digit4'); await sleep(400);
    console.log('after ward', JSON.stringify(await st()));
    await p.keyboard.press('KeyB'); await sleep(7800);
    console.log('after recall', JSON.stringify(await st()));
    await p.keyboard.press('KeyP'); await sleep(600);
    await p.screenshot({ path: 'oneshot/shop.png' });
    await p.fill('.shop-head input', 'wraps'); await sleep(300);
    await p.click('.shop-item >> nth=0'); await sleep(200);
    await p.click('.detail .btn.primary'); await sleep(500);
    console.log('after buy', JSON.stringify(await st()));
    await p.keyboard.press('Escape'); await sleep(300);
    await p.keyboard.down('Tab'); await sleep(400);
    await p.screenshot({ path: 'oneshot/scoreboard.png' });
    await p.keyboard.up('Tab');
    await p.screenshot({ path: 'oneshot/tutorial.png' });
    await p.close();
  } else if (name === 'results') {
    // fast-forward a full bot match inside the worker, then capture the post-match screen
    const p = await page(`${base}?demo=40&seed=${arg ?? 7}`);
    await p.waitForSelector('.results', { timeout: 400000 });
    await sleep(1200);
    await p.screenshot({ path: 'oneshot/results.png' });
    console.log('results', await p.evaluate(() => document.querySelector('.results h1')?.textContent + ' | ' + document.querySelector('.results .muted')?.textContent));
    await p.click('text=Main menu'); await sleep(500);
    await p.click('text=Match History'); await sleep(500);
    await p.screenshot({ path: 'oneshot/history.png' });
    await p.close();
  } else if (name === 'tutorial') {
    const p = await page(base);
    await sleep(800);
    await p.click('text=Tutorial');
    await p.waitForSelector('.hud .topbar', { timeout: 60000 });
    await sleep(3000);
    await p.screenshot({ path: 'oneshot/tutorial.png' });
    await p.close();
  }
}
function arg2(sc) { const parts = sc.split(':'); return parts[2]; }
console.log(errors.length ? `console issues:\n${errors.slice(0, 30).join('\n')}` : 'no console errors');
await browser.close();
server.close();
