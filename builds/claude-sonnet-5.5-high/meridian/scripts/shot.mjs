// Headless browser check: loads the production build, starts a new game and captures screenshots.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:5560/';
const out = process.argv[3] || 'oneshot';
const waitMs = Number(process.argv[4] || 6000);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__meridian, null, { timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/menu.png` });
await page.evaluate(() => window.__meridian.startNew());
await page.waitForTimeout(waitMs);
await page.screenshot({ path: `${out}/game1.png` });
const info = await page.evaluate(() => {
  const m = window.__meridian; const g = m.game;
  return { t: g.t, fps: m.renderer.stats.fps, vehicles: g.vehicles.length, humans: g.humans.length, traffic: g.traffic.count(), mission: g.missions.def?.id, obj: g.missionObjective.text, player: [g.player.human.x, g.player.human.z] };
});
console.log(JSON.stringify(info));
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
