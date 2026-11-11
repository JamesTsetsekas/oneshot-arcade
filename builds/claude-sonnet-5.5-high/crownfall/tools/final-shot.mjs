// Captures oneshot/screenshot.png from the production build: a real mid-game fight.
// The player's hero is driven by the bot controller (so the match state is organic), then we render at 1920x1080.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
import fs from 'node:fs';
const PORT = 5547, PREFIX = '/play/claude-sonnet-5.5-high/crownfall/';
const server = serve(PORT, PREFIX);
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const W = 1920, H = 1080;
const page = await browser.newPage({ viewport: { width: W, height: H } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`http://127.0.0.1:${PORT}${PREFIX}`);
await page.waitForTimeout(1500);
await page.click('text=Play'); await page.waitForTimeout(600);
await page.click(`.d-card:has-text("${process.env.HERO ?? 'Suri Vale'}")`);
await page.click('text=Lock In');
await page.waitForTimeout(4500);
await page.keyboard.press('Escape');
await page.evaluate(() => {
  const a = window.__crownfall, s = a.match.sim, p = s.player;
  const other = [...s.bots.brains.entries()].find(([id]) => s.byId.get(id).team === 0)[1];
  p.hero.controller = 'bot';
  s.bots.brains.set(p.id, { ...other, role: 'lane', lane: 0, partner: 0, goals: s.bots.goalsFor(p.hero.heroId), state: 'Lane', think: 3 });
  a.match.hud.toggleShop(false);
  a.match.hud.showHint('', 0.01);
});
// advance until a good fight is on screen
let found = null;
for (let step = 0; step < 2400 && !found; step++) {
  found = await page.evaluate(() => {
    const s = window.__crownfall.match.sim, p = s.player;
    for (let i = 0; i < 15; i++) s.step();
    if (s.time < 340) s.events.length = 0;
    if (s.time < 300 || p.dead) return null;
    const foes = s.heroes.filter((h) => h.team === 1 && !h.dead && Math.hypot(h.x - p.x, h.z - p.z) < 13 && s.canSee(0, h));
    const allies = s.heroes.filter((h) => h.team === 0 && h !== p && !h.dead && Math.hypot(h.x - p.x, h.z - p.z) < 12);
    const minions = s.units.filter((u) => u.kind === 'minion' && Math.hypot(u.x - p.x, u.z - p.z) < 10).length;
    if (foes.length >= 1 && minions >= 3 && s.projectiles.length >= 1 && p.hp / p.maxHp > 0.4) return { t: s.time.toFixed(0), foes: foes.length, allies: allies.length, minions, proj: s.projectiles.length };
    return null;
  });
}
console.log('fight', found);
await page.evaluate(() => { window.__crownfall.match.paused = false; });
await page.waitForTimeout(250);
await page.screenshot({ path: 'oneshot/screenshot.png' });
console.log(logs.slice(0, 10).join('\n') || 'no console errors');
await browser.close(); server.close();
