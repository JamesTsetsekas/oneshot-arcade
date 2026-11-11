// Visual checks for effects: storm wall, mist cloud, Gale Launcher blast, supply capsule, zipline, glide.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const { server, base } = await serve(5555);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, a) => page.evaluate(fn, a);

// ---- practice: mist + gale launcher + zipline
await page.goto(base + '?seed=99'); await page.waitForSelector('.menu-col');
await page.click('text=Practice Range'); await page.waitForFunction(() => window.__skybreak?.state === 'playing');
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  g.input.debugSet({ locked: true }); g.hud.showHint(false);
  h.x = 0; h.z = 30; h.y = m.world.heightAt(0, 30); g.input.yaw = Math.PI; g.input.pitch = -0.1;
  h.slots[0] = { kind: 'weapon', weapon: 'gale', rarity: 3, mag: 4 }; h.slots[1] = { kind: 'item', item: 'mistCapsule', count: 2 }; h.slots[2] = { kind: 'item', item: 'windOrb', count: 3 };
  h.ammo.charge = 12; h.selected = 1;
});
await sleep(400);
await page.keyboard.press('KeyG'); // throws the first throwable (windOrb or mist)
await sleep(300);
await ev(() => { window.__skybreak.match.players[0].selected = 1; });
await page.keyboard.press('KeyG'); await sleep(1500);
await ev(() => { const h = window.__skybreak.match.players[0]; h.selected = 0; window.__skybreak.input.pitch = 0.05; });
await sleep(400);
await page.mouse.move(640, 360); await page.mouse.down(); await sleep(120); await page.mouse.up();
await sleep(900);
await page.screenshot({ path: 'oneshot/fx-practice.png' });

// ---- quick drop: storm wall + capsule
await ev(() => window.__skybreak.leaveToMenu());
await page.click('text=Quick Drop');
await page.waitForFunction(() => window.__skybreak?.state === 'playing', null, { timeout: 90000 });
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  g.input.debugSet({ locked: true }); g.hud.showHint(false);
  m.stagingLeft = 0.1;
});
await page.waitForFunction(() => window.__skybreak.match.phase === 'skiff', null, { timeout: 30000 });
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  // jump straight to the middle of the match: first contraction under way
  m.clock = 230;
  for (const p of m.players) if (p.mode === 'skiff') m.jumpFromSkiff(p);
});
await page.waitForFunction(() => ['ground', 'swim'].includes(window.__skybreak.match.players[0].mode), null, { timeout: 120000 }).catch(() => {});
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  g.debugScale = 1;
  const s = m.storm;
  // stand 25 m inside the wall, looking outward at it
  const a = 0.6;
  h.x = s.cx + Math.cos(a) * (s.r - 25); h.z = s.cz + Math.sin(a) * (s.r - 25);
  h.y = m.world.heightAt(h.x, h.z); h.mode = 'ground'; h.onGround = true; h.vx = h.vz = h.vy = 0;
  g.input.yaw = Math.atan2(Math.cos(a), Math.sin(a)); g.input.pitch = 0.02;
  h.slots[0] = { kind: 'weapon', weapon: 'sundial', rarity: 3, mag: 12 }; h.selected = 0;
  m.capsules.push({ id: 9001, x: h.x - Math.cos(a) * 40, z: h.z - Math.sin(a) * 40, y: h.y + 40, landed: false, opened: false, t: 0 });
});
await sleep(1200);
await page.screenshot({ path: 'oneshot/fx-storm.png' });
console.log('storm', await ev(() => { const s = window.__skybreak.match.storm; return { phase: s.phase, r: Math.round(s.r), label: s.label }; }));
console.log('logs', logs.slice(0, 10).join('\n') || 'none');
await browser.close(); server.close();
