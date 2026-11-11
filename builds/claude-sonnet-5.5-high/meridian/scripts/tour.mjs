// Visual tour of the production/dev build: captures several gameplay situations as PNGs for review.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:5560/';
const out = process.argv[3] || 'oneshot';
const only = process.argv[4] || '';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (m.type() !== 'debug') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message + '\n' + (e.stack || '')));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__meridian, null, { timeout: 90000 });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__meridian.startNew());
await page.waitForTimeout(2500);
const ev = (fn, arg) => page.evaluate(fn, arg);
const shot = async (name, wait = 2500) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${out}/${name}.png` }); };
const want = (n) => !only || only.split(',').includes(n);

// skip the intro dialogue: force the mission along
await ev(() => { const g = window.__meridian.game; g.missions.node === '__dialogue__'; });

if (want('night')) {
  await ev(() => { const g = window.__meridian.game; g.hour = 21.4; g.rain = 1; });
  await shot('t1-night-rain', 3500);
}
if (want('chase')) {
  await ev(() => {
    const g = window.__meridian.game; g.hour = 17.8; g.rain = 0;
    g.missions.abandon();
    const sh = g.world.poi('safehouse');
    const v = g.spawnVehicle('cormorant', sh.x + 20, sh.z - 8, Math.PI / 2, 'player');
    const h = g.player.human; h.x = v.x; h.z = v.z; h.vehicleId = v.id; v.driverId = 0; v.engineOn = true; g.player.camYaw = Math.PI / 2;
    g.police.setTier(3);
  });
  await page.keyboard.down('KeyW');
  await shot('t2-chase', 9000);
  await page.keyboard.up('KeyW');
}
if (want('gun')) {
  await ev(() => {
    const g = window.__meridian.game; g.police.clear();
    const pv = g.playerVehicle(); if (pv) { g.removeVehicle(pv); }
    const h = g.player.human; h.vehicleId = null; h.x = -120; h.z = -75; h.heading = 0; g.player.camYaw = 0; g.player.holstered = false; g.player.slot = 1;
    g.hour = 17.5;
  });
  await page.mouse.move(640, 360);
  await page.mouse.down({ button: 'right' });
  await page.waitForTimeout(600);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.up();
  await shot('t3-aim-fire', 300);
  await page.mouse.up({ button: 'right' });
}
if (want('panels')) {
  await ev(() => window.__meridian.game.police.clear());
  await page.keyboard.press('KeyM'); await shot('t4-map', 800);
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyP'); await shot('t5-phone', 800);
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(400);
  await ev(() => { const m = window.__meridian; m.game.panel = 'store'; });
  await shot('t6-store', 1200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape'); await shot('t7-pause', 800);
}
const info = await ev(() => { const m = window.__meridian; const g = m.game; return { t: g.t.toFixed(1), fps: Math.round(m.renderer.stats.fps), vehicles: g.vehicles.length, humans: g.humans.length, tier: g.police.tier, ident: g.police.ident, meshes: m.renderer.scene.getActiveMeshes().length, tris: m.renderer.scene.getActiveIndices() / 3 }; });
console.log(JSON.stringify(info));
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
