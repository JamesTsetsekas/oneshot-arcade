// Captures real screenshots of the production build with a headless browser.
// Usage: node tools/screenshot.mjs [scenario] ; scenarios: all (default), menu, play, quick, final, tour
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { serve } from './serve.mjs';

const scenario = process.argv[2] ?? 'all';
const { server, url } = await serve(5372);
await mkdir('oneshot', { recursive: true });
let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'] }); break; } catch (e) { console.log('launch failed for', channel, String(e).slice(0, 120)); }
}
if (!browser) { console.error('No Chromium-based browser available'); server.close(); process.exit(2); }
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 400)}`));
const shot = async (name) => { await page.screenshot({ path: `oneshot/${name}.png` }); console.log('saved', `oneshot/${name}.png`); };
const state = () => page.evaluate(() => {
  const g = window.__farestorm; const s = g?.session;
  return s ? { phase: s.phase, clock: +s.clock.toFixed(1), score: s.score, deliveries: s.fares.deliveries, fare: s.fares.state, kmh: Math.round(s.vehicle.speedKmh), pos: [Math.round(s.vehicle.pos.x), Math.round(s.vehicle.pos.z)], fps: Math.round(g.view.fps) } : { screen: document.querySelector('.ui')?.className };
});
try {
  if (scenario === 'all' || scenario === 'menu') {
    await page.goto(url + '?mute');
    await page.waitForSelector('.menu-screen', { timeout: 60000 });
    await page.waitForTimeout(2500);
    await shot('menu');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.setup-screen');
    await page.waitForTimeout(1800);
    await shot('setup');
  }
  if (scenario === 'all' || scenario === 'play' || scenario === 'quick') {
    const seed = process.env.SEED ?? '424242';
    await page.goto(`${url}?mute&autostart=arcade&autopilot&seed=${seed}&hub=${process.env.HUB ?? '0'}&taxi=${process.env.TAXI ?? 'breaker'}`);
    await page.waitForFunction(() => window.__farestorm?.session, null, { timeout: 60000 });
    await page.waitForTimeout(4500);
    await shot('play-start');
    console.log(JSON.stringify(await state()));
    const waits = scenario === 'quick' ? [6000] : [9000, 14000, 16000, 20000];
    let i = 0;
    for (const w of waits) {
      await page.waitForTimeout(w);
      await shot(`play-${++i}`);
      console.log(JSON.stringify(await state()));
    }
    if (scenario !== 'quick') {
      await page.keyboard.press('KeyM');
      await page.waitForTimeout(500);
      await shot('map');
      await page.keyboard.press('KeyM');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      await shot('pause');
      await page.evaluate(() => window.__farestorm.endShift());
      await page.waitForSelector('.results-screen', { timeout: 15000 });
      await page.waitForTimeout(1200);
      await shot('results');
    }
  }
  if (scenario === 'all' || scenario === 'final') {
    // The headline screenshot: wait for a moment with a passenger on board at speed.
    await page.goto(`${url}?mute&autostart=arcade&autopilot&seed=${process.env.SEED ?? '90210'}&hub=${process.env.HUB ?? '2'}&taxi=${process.env.TAXI ?? 'breaker'}`);
    await page.waitForFunction(() => window.__farestorm?.session, null, { timeout: 60000 });
    let ok = false;
    for (let i = 0; i < 160 && !ok; i++) {
      await page.waitForTimeout(500);
      const st = await state();
      ok = st.fare === 'carrying' && st.kmh > 60;
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'oneshot/screenshot.png' });
    console.log('saved oneshot/screenshot.png', JSON.stringify(await state()), ok ? '' : '(fallback moment)');
  }
  if (scenario === 'all') {
    // Persistence check: a finished run must survive a reload (IndexedDB).
    await page.goto(url + '?mute');
    await page.waitForSelector('.menu-screen', { timeout: 60000 });
    await page.waitForTimeout(800);
    console.log('menu chips after reload:', JSON.stringify(await page.evaluate(() => document.querySelector('.menu-chips')?.textContent)));
  }
  if (scenario === 'tour') {
    await page.goto(url + '?mute&autostart=school&hub=0');
    await page.waitForFunction(() => window.__farestorm?.session, null, { timeout: 60000 });
    await page.waitForTimeout(2500);
    const views = {
      aerial: [[-120, 380, -380], [700, 0, 480], 1.0],
      top: [[700, 1250, 470], [700, 0, 500], 0.95],
      harbor: [[300, 45, 10], [470, 5, 140], 1.2],
      beach: [[980, 26, 40], [1080, 4, 150], 1.2],
      oldsteps: [[110, 62, 330], [300, 32, 520], 1.2],
      civic: [[560, 95, 650], [720, 42, 820], 1.2],
      lantern: [[900, 30, 395], [1080, 3, 446], 1.2],
      highline: [[1390, 70, 660], [1240, 15, 540], 1.2],
      garage: [[900, 44, 520], [820, 27, 572], 1.2],
      street: [[214, 8, 160], [330, 8, 300], 1.2],
    };
    const only = process.env.VIEWS ? process.env.VIEWS.split(',') : Object.keys(views);
    for (const name of only) {
      const [p, t, fov] = views[name];
      await page.evaluate(([p, t, fov]) => { window.__farestorm.view.debugCam = { pos: { x: p[0], y: p[1], z: p[2] }, target: { x: t[0], y: t[1], z: t[2] }, fov }; }, [p, t, fov]);
      await page.waitForTimeout(500);
      await shot('tour-' + name);
    }
  }
} catch (e) {
  console.error('scenario error', e);
  await shot('error').catch(() => {});
}
console.log('console issues:', errors.length);
for (const e of [...new Set(errors)].slice(0, 25)) console.log(' ', e);
await browser.close();
server.close();
