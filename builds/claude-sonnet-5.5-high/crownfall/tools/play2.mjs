// Real-input playthrough: mouse + keyboard through the production build, then fast-forward to the results screen.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
import fs from 'node:fs';
const PORT = 5544, PREFIX = '/play/claude-sonnet-5.5-high/crownfall/';
const server = serve(PORT, PREFIX);
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const W = 1600, H = 900;
const page = await browser.newPage({ viewport: { width: W, height: H } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(`http://127.0.0.1:${PORT}${PREFIX}`);
await page.waitForTimeout(1500);
const S = (n) => page.screenshot({ path: `oneshot/${n}.png` });
const st = () => page.evaluate(() => { const s = window.__crownfall.match?.sim; const p = s.player; return { t: +s.time.toFixed(1), x: +p.x.toFixed(1), z: +p.z.toFixed(1), gold: Math.round(p.hero.gold), items: p.hero.items.filter(Boolean).map((i) => i.id), lvl: p.hero.level, ranks: p.hero.ranks, lh: p.hero.lastHits, dmg: Math.round(p.hero.damageDealt), ward: p.hero.wardsPlaced }; });
const run = (ticks) => page.evaluate((n) => { const s = window.__crownfall.match.sim; for (let i = 0; i < n; i++) s.step(); }, ticks);
await page.click('text=Play'); await page.waitForTimeout(600);
await page.click(`.d-card:has-text("Suri Vale")`);
await page.click('text=Lock In');
await page.waitForTimeout(4500);
console.log('start', await st());
// shop: double click to buy
await page.dblclick('.card:has-text("Whetstone")');
await page.waitForTimeout(300);
console.log('after buy', (await st()).items);
await S('p2-shop');
await page.keyboard.press('p'); // toggle shop closed
await page.waitForTimeout(200);
await page.keyboard.press('Control+q');
console.log('ranks', (await st()).ranks);
// right-click to move toward the upper lane
await page.mouse.click(W * 0.5, H * 0.3, { button: 'right' });
await run(30 * 12);
await page.mouse.click(W * 0.62, H * 0.28, { button: 'right' });
await run(30 * 30);
console.log('moved', await st());
await S('p2-move');
// ward
await page.mouse.move(W * 0.55, H * 0.45);
await page.keyboard.press('t');
await page.waitForTimeout(200);
console.log('ward', (await st()).ward);
// wait for minions then attack the nearest enemy by right-clicking minions via the picker
await run(30 * 40);
await page.waitForTimeout(300);
await S('p2-lane');
// scoreboard + map + settings UI
await page.keyboard.down('Tab'); await page.waitForTimeout(250); await S('p2-board'); await page.keyboard.up('Tab');
await page.keyboard.press('m'); await page.waitForTimeout(400); await S('p2-map'); await page.keyboard.press('Escape');
await page.keyboard.press('Escape'); await page.waitForTimeout(300); await S('p2-pause');
await page.click('text=Settings'); await page.waitForTimeout(300); await S('p2-settings');
await page.click('.settings >> text=Done'); await page.waitForTimeout(200);
await page.click('text=Resume'); await page.waitForTimeout(200);
// fast-forward to the end (the human is idle, so the bots will finish)
await page.evaluate(() => { const s = window.__crownfall.match.sim; let n = 0; while (s.winner < 0 && n++ < 30 * 60 * 45) s.step(); });
await page.waitForTimeout(6000);
console.log('end', await page.evaluate(() => { const s = window.__crownfall.match.sim; return { winner: s.winner, t: (s.time / 60).toFixed(1) }; }));
await S('p2-results');
console.log(logs.slice(0, 20).join('\n') || 'no console errors');
await browser.close(); server.close();
