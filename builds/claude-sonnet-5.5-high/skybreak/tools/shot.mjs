// Headless browser checks + screenshots against the production build served from a sub-path.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const scenario = process.argv[2] ?? 'practice';
const { server, base } = await serve();
const outDir = new URL('../oneshot/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.BROWSER ?? 'chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(base + '?seed=20260511', { waitUntil: 'load' });
await page.waitForSelector('.menu-col');
await page.screenshot({ path: outDir + 'menu.png' });
console.log('menu ok');

async function waitPlaying(timeout = 60000) {
  await page.waitForFunction(() => window.__skybreak && window.__skybreak.state === 'playing' && window.__skybreak.match, null, { timeout });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evalG = (fn, arg) => page.evaluate(fn, arg);

if (scenario === 'practice') {
  await page.click('text=Practice Range');
  await waitPlaying();
  await evalG(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); });
  await sleep(1500);
  // equip a weapon: teleport to rack and pick up
  const info = await evalG(() => {
    const g = window.__skybreak; const m = g.match; const h = m.players[0];
    let n = 0; const out = [];
    for (const e of m.loot.values()) if (e.data.kind === 'weapon' && e.data.rarity === 2 && n < 3) { n++; h.x = e.x; h.z = e.z - 1; out.push(e.data.weapon); g.input.debugSet({}); }
    return { pos: [h.x, h.y, h.z], out, loot: m.loot.size };
  });
  console.log('practice', JSON.stringify(info));
  await page.screenshot({ path: outDir + 'practice.png' });
}
if (scenario === 'match') {
  await page.click('text=Quick Drop');
  await waitPlaying(90000);
  await evalG(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); });
  await sleep(1500);
  console.log('fps', await evalG(() => window.__skybreak.fps));
  await page.screenshot({ path: outDir + 'staging.png' });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__skybreak.match.phase === 'skiff', null, { timeout: 30000 });
  await page.waitForFunction(() => window.__skybreak.match.clock > 14, null, { timeout: 60000 });
  await page.screenshot({ path: outDir + 'skiff.png' });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__skybreak.match.players[0].mode === 'freefall', null, { timeout: 10000 });
  await sleep(2500);
  await page.screenshot({ path: outDir + 'freefall.png' });
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => window.__skybreak.match.players[0].mode === 'glide', null, { timeout: 40000 });
  await sleep(1500);
  await page.screenshot({ path: outDir + 'glide.png' });
  await page.waitForFunction(() => window.__skybreak.match.players[0].mode === 'ground' || window.__skybreak.match.players[0].mode === 'swim', null, { timeout: 90000 });
  await page.keyboard.up('KeyW');
  await sleep(1000);
  await page.screenshot({ path: outDir + 'landed.png' });
  console.log('landed', await evalG(() => { const h = window.__skybreak.match.players[0]; return [h.mode, Math.round(h.x), Math.round(h.y), Math.round(h.z), h.health]; }));
}
console.log('logs:', logs.slice(0, 20).join('\n') || 'none');
await browser.close();
server.close();
