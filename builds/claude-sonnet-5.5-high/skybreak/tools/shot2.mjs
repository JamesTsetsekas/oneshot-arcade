// Gameplay checks in the production build: loot, shoot, heal, chest, UI overlays, results.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const { server, base } = await serve();
const outDir = new URL('../oneshot/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, a) => page.evaluate(fn, a);
await page.goto(base + '?seed=777', { waitUntil: 'load' });
await page.waitForSelector('.menu-col');
await page.click('text=Practice Range');
await page.waitForFunction(() => window.__skybreak?.state === 'playing');
await ev(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); });
// teleport next to a Prototype Wayfarer and pick it up with E
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  for (const e of m.loot.values()) if (e.data.kind === 'weapon' && e.data.weapon === 'wayfarer' && e.data.rarity === 4) { h.x = e.x; h.z = e.z - 1.2; h.y = e.y; h.yaw = 0; g.input.yaw = 0; }
});
await sleep(300);
await page.keyboard.press('KeyE'); await sleep(300);
// ammo
await ev(() => { const g = window.__skybreak, m = g.match, h = m.players[0]; for (const e of m.loot.values()) if (e.data.kind === 'ammo' && e.data.ammo === 'light') { h.x = e.x; h.z = e.z; break; } });
await sleep(400);
console.log('inventory', JSON.stringify(await ev(() => { const h = window.__skybreak.match.players[0]; return { slots: h.slots, ammo: h.ammo }; })));
// face the nearest dummy and fire
await ev(() => {
  const g = window.__skybreak, m = g.match, h = m.players[0];
  h.x = 0; h.z = -20; h.y = m.world.heightAt(0, -20);
  const d = m.players[3]; // dummy at (0,-48)
  const dx = d.x - h.x, dz = d.z - h.z;
  g.input.yaw = Math.atan2(dx, dz); g.input.pitch = -0.02;
});
await sleep(500);
await page.mouse.move(640, 360);
await page.mouse.down();
await sleep(700);
await page.screenshot({ path: outDir + 'firing.png' });
await sleep(600);
await page.mouse.up();
console.log('stats', JSON.stringify(await ev(() => { const h = window.__skybreak.match.players[0]; return { shots: h.stats.shots, hits: h.stats.hits, dmg: Math.round(h.stats.damageDealt), mag: h.slots[0] && h.slots[0].mag }; })));
// reload, heal
await ev(() => { const m = window.__skybreak.match, h = m.players[0]; h.health = 40; for (const e of m.loot.values()) if (e.data.kind === 'item' && e.data.item === 'medInjector') { h.x = e.x; h.z = e.z - 1; break; } });
await sleep(300);
await page.keyboard.press('KeyE'); await sleep(300);
await page.keyboard.press('Digit2'); await sleep(200);
await page.mouse.down(); await sleep(100); await page.mouse.up();
await sleep(1200);
await page.screenshot({ path: outDir + 'healing.png' });
console.log('hp', await ev(() => window.__skybreak.match.players[0].health));
// inventory + map overlay
await page.keyboard.press('Tab'); await sleep(500);
await page.screenshot({ path: outDir + 'inventory.png' });
await page.keyboard.press('Tab'); await sleep(300);
await page.keyboard.press('KeyM'); await sleep(600);
await page.screenshot({ path: outDir + 'map.png' });
await page.keyboard.press('KeyM'); await sleep(300);
console.log('state', await ev(() => window.__skybreak.state));
console.log('logs:', logs.slice(0, 20).join('\n') || 'none');
await browser.close(); server.close();
