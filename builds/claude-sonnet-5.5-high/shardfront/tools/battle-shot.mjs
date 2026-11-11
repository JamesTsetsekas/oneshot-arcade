// Plays a real skirmish (the local side is driven by the same utility AI via the public command path), fast-forwards the
// deterministic simulation headlessly inside the page until armies meet, then captures production-build screenshots.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const prefix = '/play/claude-sonnet-5.5-high/shardfront/';
const server = await serve(path.resolve('dist'), prefix, 5506);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:5506${prefix}`);
await page.waitForSelector('.menu');
const faction = process.env.FACTION || 'helix';
await page.click('[data-a=play]');
await page.waitForSelector('[data-a=start]');
await page.click(`[data-f=${faction}]`);
await page.click('[data-d=hard]');
await page.click('[data-a=start]');
await page.waitForSelector('#hud', { timeout: 60000 });
await page.waitForTimeout(1000);
fs.mkdirSync('oneshot', { recursive: true });
const info = await page.evaluate(`(()=>{
  const app=window.__app, game=app.game, sim=game.sim;
  game.paused = true;
  sim.players[0].ai = window.__createAI(sim, 0, 'hard', false);
  const minTick = ${process.env.MIN_TICK || 4800};
  let contact = 0;
  for (let i = 0; i < 24000 && !sim.over; i++) {
    sim.step(); sim.events.length = 0;
    if (sim.tick > minTick && sim.tick % 20 === 0) {
      let hit = 0;
      for (const id of sim.ids) if (sim.alive[id] && sim.td(id).isUnit && !sim.td(id).isWorker && sim.tick - sim.ext[id].lastHit < 80) hit++;
      if (hit >= 6) { contact++; if (contact >= 2) break; }
    }
  }
  let cx = 0, cy = 0, n = 0;
  for (const id of sim.ids) if (sim.alive[id] && sim.td(id).isUnit && !sim.td(id).isWorker && sim.tick - sim.ext[id].lastHit < 40) { cx += sim.x[id]; cy += sim.y[id]; n++; }
  if (n) { cx /= n; cy /= n; } else { cx = 72; cy = 72; }
  game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isUnit&&!sim.td(i).isWorker&&Math.hypot(sim.x[i]-cx,sim.y[i]-cy)<9).slice(0,40));
  game.renderer.cam.setTarget(cx, cy + 3, true);
  game.renderer.cam.targetHeight = game.renderer.cam.height = 30;
  game.paused = false;
  return { tick: sim.tick, over: sim.over, n, cx, cy, mine: sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isUnit&&!sim.td(i).isWorker).length, theirs: sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===1&&sim.td(i).isUnit&&!sim.td(i).isWorker).length };
})()`);
console.log(JSON.stringify(info));
await page.waitForTimeout(1800);
await page.screenshot({ path: process.env.OUT || 'oneshot/screenshot.png' });
await page.waitForTimeout(1500);
await page.screenshot({ path: (process.env.OUT || 'oneshot/screenshot.png').replace('.png', '-b.png') });
console.log(logs.slice(0, 10).join('\n') || 'no console errors');
await browser.close();
server.close();
