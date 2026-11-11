// Browser smoke test: serves dist/ from a sub-path, boots the production build in headless
// Edge/Chrome via playwright-core, starts a new game and captures real gameplay screenshots.
// Usage: node tools/smoke.mjs [--scenes] [--benchmark]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SUB = '/play/claude-fable-5.2-high/meridian/';
const PORT = 5362;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png' };
const args = new Set(process.argv.slice(2));

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(SUB)) { res.writeHead(404); res.end('outside sub-path'); return; }
  let file = path.join(dist, url.slice(SUB.length) || 'index.html');
  if (!file.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] }); break; } catch (e) { console.log(`could not launch ${channel}: ${e.message.split('\n')[0]}`); }
}
if (!browser) { console.error('No Edge/Chrome available for the smoke test.'); server.close(); process.exit(2); }
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], logs = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error') errors.push('console: ' + t); if (t.startsWith('BENCHMARK_RESULT')) logs.push(t); });
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
const shot = async (name) => { fs.mkdirSync(path.join(root, 'oneshot'), { recursive: true }); await page.screenshot({ path: path.join(root, 'oneshot', name) }); console.log('saved oneshot/' + name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const G = (fn, arg) => page.evaluate(fn, arg);
let code = 0;
try {
  await page.goto(`http://127.0.0.1:${PORT}${SUB}${args.has('--benchmark') ? '?benchmark=1' : ''}`);
  await page.waitForSelector('text=New Game', { timeout: 30000 });
  await shot('menu.png');
  await page.click('text=New Game');
  await page.waitForFunction(() => window.__meridian?.state.screen === 'playing', null, { timeout: 90000 });
  console.log('game reached "playing"');
  // headless browsers have no pointer lock; hide the "click to capture the mouse" hint for captures
  await page.addStyleTag({ content: '.lockhint{display:none!important}' });
  if (args.has('--benchmark')) {
    await page.waitForFunction(() => window.__meridian.state.screen === 'benchmark', null, { timeout: 120000 });
    console.log(logs.join('\n'));
    await shot('benchmark.png');
  } else {
    await sleep(4000);
    const info = await G(() => { const g = window.__meridian; return { drawCalls: g.renderer.drawCalls, fps: Math.round(g.hud.fps), vehicles: g.sim.vehicles.list.length, peds: g.sim.peds.list.length, simMs: +g.simMs.toFixed(2), mission: g.sim.missions.active?.id, objective: g.sim.missions.objective, cells: g.renderer.city.stats.detailCells }; });
    console.log('state', JSON.stringify(info));
    await shot('01-start-on-foot.png');
    if (args.has('--scenes')) {
      // ride the tutorial bike down Tide Street
      await G(() => { const g = window.__meridian, s = g.sim; const bike = s.missions.refs.get('bike'); s.player.respawn(bike.x, bike.z - 1.6, 0); });
      await sleep(700); // lets the mission advance from "walk to your bike" to "get on"
      await G(() => { const g = window.__meridian, s = g.sim; const bike = s.missions.refs.get('bike'); s.player.enterVehicle(bike, true); g.renderer.rig.snapBehind(bike.yaw); });
      await sleep(400);
      await page.keyboard.down('KeyW'); await sleep(3500); await shot('02-riding-swift.png'); await shot('screenshot.png'); await page.keyboard.up('KeyW');
      // drive a car on the arterial at sunset
      await G(() => { const g = window.__meridian, s = g.sim; s.missions.abandon(); s.clock.advanceTo(18.6); const v = s.spawnMissionVehicle('cutlass', 100, -304, Math.PI / 2, 0xd9482b); v.owned = true; s.player.exitVehicle(true); s.player.enterVehicle(v, true); g.renderer.rig.snapBehind(v.yaw); });
      await sleep(600); await page.keyboard.down('KeyW'); await sleep(4200); await shot('03-driving-sunset.png'); await page.keyboard.up('KeyW');
      // Tide Market plaza on foot
      await G(() => { const g = window.__meridian, s = g.sim; s.clock.t = 300; s.player.exitVehicle(true); s.player.respawn(-30, -52, 0.6); g.renderer.rig.snapBehind(0.6); g.renderer.warm(-30, -52); });
      await sleep(5000); await shot('04-tide-market.png');
      // alert: police pursuit at night in the rain
      await G(() => { const g = window.__meridian, s = g.sim; s.clock.advanceTo(21.6); s.weather.forceRain = true; s.weather.rain = 1; s.weather.wetness = 1; const v = s.spawnMissionVehicle('tern', -100, 266, Math.PI / 2, 0x1f7a8c); v.owned = true; s.player.enterVehicle(v, true); g.renderer.rig.snapBehind(v.yaw); g.renderer.warm(-100, 266); s.godMode = true; s.police.forceTier(3, -100, 266); });
      await page.keyboard.down('KeyW'); await sleep(14000); await shot('05-night-rain-pursuit.png'); await page.keyboard.up('KeyW');
      // Lantern Hill viewpoint
      await G(() => { const g = window.__meridian, s = g.sim; s.police.clear('reset'); s.dispatch.standDown(true); s.weather.forceRain = null; s.weather.rain = 0; s.weather.wetness = 0; s.clock.t = 1500; s.player.exitVehicle(true); s.player.respawn(283, 256, Math.PI); g.renderer.rig.snapBehind(Math.PI); g.renderer.rig.pitch = -0.08; g.renderer.warm(283, 256); });
      await sleep(5000); await shot('06-lantern-hill-view.png');
      // map screen
      await G(() => window.__meridian.open('map')); await sleep(600); await shot('07-map.png');
      // save, reload the page, continue: the session must resume from IndexedDB
      const saved = await G(async () => { const g = window.__meridian; g.resume(); g.sim.economy.cash = 4321; g.sim.missions.progress.completed.m1 = { grade: 'A', time: 120, score: 90 }; g.sim.rest(); g.sim.autosaveWanted = ''; return g.save('rest'); });
      await page.reload();
      await page.waitForSelector('text=Continue', { timeout: 30000 });
      await shot('08-menu-continue.png');
      await page.click('text=Continue');
      await page.waitForFunction(() => window.__meridian?.state.screen === 'playing', null, { timeout: 90000 });
      await page.addStyleTag({ content: '.lockhint{display:none!important}' });
      await sleep(2500);
      const after = await G(() => { const s = window.__meridian.sim; return { cash: s.economy.cash, m1: !!s.missions.progress.completed.m1, owned: s.player.ownedVehicle?.spec.id ?? null, x: Math.round(s.player.x), z: Math.round(s.player.z) }; });
      console.log('save ok:', saved, '| after reload + Continue:', JSON.stringify(after));
      if (!saved || after.cash !== 4321 || !after.m1) throw new Error('save/continue round trip failed');
      await shot('09-continued.png');
    }
  }
} catch (e) { console.error('SMOKE FAILED:', e.message); code = 1; try { await shot('failure.png'); } catch { /* ignore */ } }
if (errors.length) { console.log('page errors:\n' + errors.slice(0, 20).join('\n')); code = code || 1; } else console.log('no page errors');
await browser.close(); server.close();
process.exit(code);
