// Headless capture of real gameplay from the production build (served from a sub-path).
// Usage: node tools/screenshot.mjs [url] [outDir]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:5401/play/claude-opus-5.5-high/shardfront/';
const out = process.argv[3] ?? 'oneshot';
const mode = process.argv[4] ?? 'full';
fs.mkdirSync(out, { recursive: true });
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForSelector('.menuBtn', { timeout: 20000 });
await page.screenshot({ path: `${out}/menu.png` });
if (mode === 'menu') { console.log(logs.join('\n')); await browser.close(); process.exit(0); }
await page.click('text=Play');
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/setup.png` });
await page.click('text=Start match');
await page.waitForSelector('.hud', { timeout: 60000 });
await page.mouse.move(640, 300);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/opening.png` });
// Give our seat an AI too so the match develops on its own, fast-forward to the first big
// engagement that player 0 can actually see, then frame it and let real rendering run.
const r = await page.evaluate(async () => {
  const c = window.__client;
  const AIController = c.runner.ais[0].constructor;
  c.runner.ais.push(new AIController(c.runner.sim, 0, 'normal'));
  const sim = c.runner.sim;
  const t0 = performance.now();
  let best = null;
  while (sim.tick < 20 * 60 * 16 && !sim.over) {
    c.runner.step();
    sim.events = [];
    if (sim.tick % 20 || sim.tick < 20 * 60 * 6) continue;
    const enemies = sim.unitsOf(1).filter((u) => !sim.udef(u).worker && sim.isVisibleTo(0, u));
    if (enemies.length < 6) continue;
    let ex = 0, ey = 0; for (const u of enemies) { ex += sim.x[u]; ey += sim.y[u]; } ex /= enemies.length; ey /= enemies.length;
    const mine = sim.unitsOf(0).filter((u) => !sim.udef(u).worker && Math.hypot(sim.x[u] - ex, sim.y[u] - ey) < 14);
    if (mine.length >= 6) { best = { x: ex, y: ey, n: enemies.length + mine.length }; break; }
  }
  if (best) { c.debugFrame(best.x, best.y + 2, 30); c.selection = new Set(sim.unitsOf(0).filter((u) => !sim.udef(u).worker && Math.hypot(sim.x[u] - best.x, sim.y[u] - best.y) < 14)); }
  return { tick: sim.tick, ms: performance.now() - t0, best };
});
logs.push(`fast-forward ${JSON.stringify(r)}`);
await page.waitForTimeout(2500);
await page.mouse.move(640, 300);
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/screenshot.png` });
// base view
await page.evaluate(() => { const c = window.__client; const p = c.runner.sim.players[0]; c.debugFrame(p.startX + 8, p.startY - 6, 40); c.selection = new Set(c.runner.sim.structuresOf(0).slice(0, 1)); c.publishHud(); });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/base.png` });
// debug capture: nav overlay + perf panel
await page.keyboard.press('F9');
await page.keyboard.press('Backquote');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/debug-nav-perf.png` });
// post-game summary: the enemy surrenders, capture the results screen
await page.keyboard.press('F9');
await page.keyboard.press('Backquote');
await page.evaluate(() => { const c = window.__client; c.runner.sim.issue({ player: 1, kind: 'surrender', ids: [] }); });
await page.waitForSelector('.result', { timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/postgame.png` });
// tutorial opening
const t = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await t.goto(url);
await t.waitForSelector('.menuBtn');
await t.click('text=Tutorial');
await t.waitForSelector('.objective.tutorial', { timeout: 60000 });
await t.mouse.move(640, 300);
await t.waitForTimeout(1500);
await t.screenshot({ path: `${out}/tutorial.png` });
console.log(logs.slice(-40).join('\n'));
await browser.close();
