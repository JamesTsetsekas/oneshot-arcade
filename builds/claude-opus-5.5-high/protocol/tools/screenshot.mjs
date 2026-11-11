// Headless browser verification + screenshots of the PRODUCTION build served
// from a sub-path. Uses a locally installed Chrome/Edge via playwright-core.
// Usage: npm run build && node tools/screenshot.mjs [--quick]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './serve.mjs';

const BASE = '/play/claude-opus-5.5-high/protocol/';
const PORT = 5432;
const OUT = path.resolve('oneshot');
fs.mkdirSync(OUT, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exe = candidates.find((p) => fs.existsSync(p));
if (!exe) {
  console.error('No Chrome/Edge found; set CHROME_PATH');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const note = (s) => {
  console.log(s);
  log.push(s);
};

const srv = await serve();
const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack ?? e.message).slice(0, 600)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});
const url = `http://localhost:${PORT}${BASE}`;

try {
  // ---- menu ----
  await page.goto(url, { waitUntil: 'load' });
  await sleep(5000);
  const gl = await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl2');
    if (!c) return 'none';
    const ext = c.getExtension('WEBGL_debug_renderer_info');
    return ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'webgl2 (renderer hidden)';
  });
  note(`WebGL2 renderer: ${gl}`);
  await page.screenshot({ path: path.join(OUT, 'menu.png') });
  note('captured menu.png');

  // ---- gameplay with harness autopilot ----
  await page.goto(url + '?harness=1&autostart=quick&autopilot=1&side=intrusion', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lp, null, { timeout: 60000 });
  await page.evaluate(() => window.__lp.resume());
  await sleep(1500);
  // buy menu during buy phase
  await page.evaluate(() => {
    const s = window.__lp;
    s.ui.paused = false;
    s.setBuyOpen(true);
  });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, 'buy-menu.png') });
  note('captured buy-menu.png');
  await page.evaluate(() => window.__lp.setBuyOpen(false));
  await page.evaluate(() => {
    window.__lp.ui.paused = false;
  });

  // wait for live action: an enemy visible to the player, ideally while firing
  const t0 = Date.now();
  let shot = false;
  let fpsSamples = [];
  while (Date.now() - t0 < 240000) {
    const st = await page.evaluate(() => {
      const s = window.__lp;
      s.ui.paused = false;
      const snap = s.cur;
      const vid = snap.you.alive ? s.humanId : snap.you.spectating;
      const me = snap.players.find((p) => p.id === vid);
      const enemy = snap.players.find((p) => p.team !== snap.you.team && p.alive);
      const d = me && enemy ? Math.hypot(me.x - enemy.x, me.z - enemy.z) : 999;
      // frame quality: the view must not be pressed against geometry
      let clear = false;
      let where = '';
      if (me) {
        const eye = { x: me.x, y: me.y + 1.5, z: me.z };
        const dir = { x: Math.sin(me.yaw) * Math.cos(me.pitch), y: -Math.sin(me.pitch), z: Math.cos(me.yaw) * Math.cos(me.pitch) };
        const hit = s.map.raycast(eye, dir, 6, true);
        clear = !hit || hit.t > 2.5;
        where = `${me.x.toFixed(1)},${me.y.toFixed(1)},${me.z.toFixed(1)} yaw ${me.yaw.toFixed(2)} pitch ${me.pitch.toFixed(2)}`;
      }
      return { phase: snap.phase, alive: snap.you.alive, d, firing: me?.firing ?? false, tick: snap.tick, round: snap.round, fps: s.fpsAvg, clear, where, flashed: snap.you.flashUntil > snap.tick };
    });
    fpsSamples.push(st.fps);
    if ((st.phase === 'live' || st.phase === 'planted') && st.d < 26 && st.clear && !st.flashed && Date.now() - t0 > 4000) {
      await sleep(250);
      await page.screenshot({ path: path.join(OUT, 'screenshot.png') });
      note(`captured screenshot.png (round ${st.round}, enemy at ${st.d.toFixed(1)} m, tick ${st.tick}, view ${st.where})`);
      shot = true;
      break;
    }
    await sleep(400);
  }
  if (!shot) {
    await page.screenshot({ path: path.join(OUT, 'screenshot.png') });
    note('captured screenshot.png (no close contact found within time budget)');
  }
  const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, fpsSamples.length);
  note(`headless average fps during gameplay capture: ${avgFps.toFixed(1)}`);

  // extra gameplay shots a bit later
  await sleep(3000);
  await page.evaluate(() => {
    window.__lp.ui.paused = false;
  });
  await page.screenshot({ path: path.join(OUT, 'gameplay-2.png') });
  note('captured gameplay-2.png');

  // scoreboard
  await page.evaluate(() => {
    const s = window.__lp;
    s.ui.scoreOpen = true;
    s.pushUi(true);
  });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, 'scoreboard.png') });
  await page.evaluate(() => {
    const s = window.__lp;
    s.ui.scoreOpen = false;
    s.pushUi(true);
  });
  note('captured scoreboard.png');

  // tactical map
  await page.evaluate(() => {
    window.__lp.hud.showMap = true;
  });
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, 'tactical-map.png') });
  await page.evaluate(() => {
    window.__lp.hud.showMap = false;
  });
  note('captured tactical-map.png');

  // fast-forward the authoritative room to the end of the match (same sim, no rendering)
  const ff = await page.evaluate(() => {
    const s = window.__lp;
    let n = 0;
    while (s.room.phase !== 'matchEnd' && n < 64 * 60 * 40) {
      s.room.step();
      n++;
      if (n % 2000 === 0) s.room.drainEvents(s.humanId);
    }
    s.room.drainEvents(s.humanId);
    return { n, phase: s.room.phase, scores: s.room.scores, rounds: s.room.rounds.length };
  });
  note(`fast-forwarded ${ff.n} ticks -> ${ff.phase}, score ${ff.scores.join('-')}, ${ff.rounds} rounds`);
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, 'match-end.png') });
  note('captured match-end.png');
} finally {
  note(`page errors: ${errors.length ? '\n  ' + errors.slice(0, 20).join('\n  ') : 'none'}`);
  fs.writeFileSync(path.join(OUT, 'browser-check.log'), log.join('\n') + '\n');
  await browser.close();
  srv.close();
}
