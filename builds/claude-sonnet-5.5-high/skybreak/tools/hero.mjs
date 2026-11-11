// Plays a Quick Drop in the production build and captures the hero gameplay screenshot.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const { server, base } = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const logs = [];
page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, a) => page.evaluate(fn, a);
await page.goto(base + '?seed=' + (process.argv[2] ?? '20260511'));
await page.waitForSelector('.menu-col');
await page.click('text=Quick Drop');
await page.waitForFunction(() => window.__skybreak?.state === 'playing', null, { timeout: 90000 });
await ev(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); g.debugScale = 6; });
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__skybreak.match.phase === 'skiff', null, { timeout: 30000 });
await page.waitForFunction(() => window.__skybreak.match.clock > 16, null, { timeout: 60000 });
await page.keyboard.press('Space');
await page.waitForFunction(() => window.__skybreak.match.players[0].mode === 'freefall', null, { timeout: 20000 });
// steer the drop onto Aerie Market
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  const l = m.world.locations.find((q) => q.id === 'aerie');
  h.x = l.x + 40; h.z = l.z - 20; h.y = l.padH + 200; h.vx = 0; h.vz = 0;
});
await page.keyboard.down('KeyW');
await page.waitForFunction(() => ['ground', 'swim'].includes(window.__skybreak.match.players[0].mode), null, { timeout: 90000 });
await page.keyboard.up('KeyW');
// loot: a Tuned+ rifle, heals, and ammo from the world (teleport to the nearest weapon & chest, press E)
await ev(() => { window.__skybreak.debugScale = 1; });
const bot = await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  const ws = [...m.loot.values()].filter((e) => e.data.kind === 'weapon');
  ws.sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z));
  const w = ws[0]; h.x = w.x - 1; h.z = w.z; h.y = w.y;
  return { weapon: w.data.weapon, rarity: w.data.rarity, hp: h.health };
});
await sleep(300);
await page.keyboard.press('KeyE');
await sleep(500);
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  h.slots[1] = { kind: 'item', item: 'medInjector', count: 3 }; h.slots[2] = { kind: 'item', item: 'shieldFlask', count: 2 }; h.slots[3] = { kind: 'item', item: 'windOrb', count: 2 };
  h.ammo.light = 150; h.ammo.shell = 16;
  if (!h.slots[0]) h.slots[0] = { kind: 'weapon', weapon: 'wayfarer', rarity: 2, mag: 30 };
  h.selected = 0; h.reserve = 25;
});
// Find a live bot near a named location and stand 24 m away with a clear line of sight
const tgt = await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  const bots = m.players.filter((p) => p.alive && p.id !== 0 && p.mode === 'ground');
  const named = m.world.locations.filter((l) => l.named);
  const score = (b) => Math.min(...named.map((l) => Math.hypot(b.x - l.x, b.z - l.z)));
  bots.sort((a, b) => score(a) - score(b));
  for (const b of bots) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, d = 16;
      const x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d;
      const y = m.world.groundHeight(x, z, m.world.heightAt(x, z) + 0.2, 0.3, 0.4, [], []);
      if (m.world.heightAt(x, z) < 1 || Math.abs(y - b.y) > 4) continue;
      const eye = { x, y: y + 1.6, z }, tp = { x: b.x, y: b.y + 1.2, z: b.z };
      if (!m.world.hasLineOfSight(eye, tp)) continue;
      h.x = x; h.z = z; h.y = y; h.vx = h.vz = 0;
      g.input.yaw = Math.atan2(b.x - x, b.z - z); g.input.pitch = -0.03;
      window.__target = b.id;
      return { name: b.name, where: Math.round(score(b)), alive: bots.length };
    }
  }
  return { none: true };
});
console.log('target', JSON.stringify(tgt), JSON.stringify(bot));
for (let i = 0; i < 3; i++) {
  await sleep(250);
  await ev(() => {
    const g = window.__skybreak, m = g.match, b = m.players[window.__target];
    const cam = g.lastAimPose.pos;
    g.input.yaw = Math.atan2(b.x - cam.x, b.z - cam.z);
    const eye = b.y + 1.15;
    g.input.pitch = Math.atan2(eye - cam.y, Math.hypot(b.x - cam.x, b.z - cam.z));
  });
}
await page.mouse.move(960, 540);
await page.mouse.down();
let shotDone = false;
for (let i = 0; i < 40 && !shotDone; i++) {
  await sleep(150);
  const st = await ev(() => { const g = window.__skybreak, h = g.match.players[0], b = g.match.players[window.__target]; const cam = g.lastAimPose.pos; g.input.yaw = Math.atan2(b.x - cam.x, b.z - cam.z); g.input.pitch = Math.atan2(b.y + 1.1 - cam.y, Math.hypot(b.x - cam.x, b.z - cam.z)) - h.recoilP * 0.0175 * 0.6; return h.stats.hits; });
  if (st >= 3) { await sleep(120); await page.screenshot({ path: process.argv[3] ?? 'oneshot/hero.png' }); shotDone = true; }
}
await page.mouse.up();
console.log('stats', JSON.stringify(await ev(() => { const h = window.__skybreak.match.players[0]; return { shots: h.stats.shots, hits: h.stats.hits, dmg: Math.round(h.stats.damageDealt), hp: h.health, alive: window.__skybreak.match.aliveCount() }; })));
console.log('logs', logs.slice(0, 10).join('\n') || 'none');
await browser.close(); server.close();
