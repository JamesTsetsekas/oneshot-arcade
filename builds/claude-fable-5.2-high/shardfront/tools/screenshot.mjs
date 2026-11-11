// Captures real screenshots of the production build (dist/) served from a sub-path, using headless Edge/Chrome
// through playwright-core. Also acts as a browser smoke test: it drives menus, real mouse/keyboard input,
// a recorded match, the post-game screen and a verified replay, and fails on any page error.
//   npm run build && npm run screenshot
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { serve } from './serve.mjs';

const OUT = 'oneshot';
const W = Number(process.env.SHOT_W ?? 1920), H = Number(process.env.SHOT_H ?? 1080);
mkdirSync(OUT, { recursive: true });
const { server, url } = await serve(Number(process.env.PORT) || 5300);
const errors = [];
let browser;
const log = (...a) => console.log('[shot]', ...a);

async function launch() {
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--mute-audio'];
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true, args }); } catch (e) { log(`channel ${channel} unavailable: ${String(e).slice(0, 80)}`); }
  }
  return chromium.launch({ headless: true, args });
}

async function newPage(query = '') {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); log('console.error:', m.text().slice(0, 300)); } });
  page.on('pageerror', (e) => { errors.push(e.message); log('pageerror:', e.message.slice(0, 300)); });
  await page.goto(url + query);
  await page.waitForFunction(() => window.__sf && ['menu', 'game'].includes(window.__sf.state().screen), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  return page;
}
const shot = async (page, name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); log('saved', `${OUT}/${name}.png`); };
const sim = (page, fn, arg) => page.evaluate(fn, arg);

try {
  browser = await launch();

  // ---------------------------------------------------------------- menus
  let page = await newPage();
  await page.waitForTimeout(2500);
  await shot(page, 'menu');
  await page.getByText('Tech Archive').click();
  await page.waitForTimeout(500);
  await shot(page, 'tech-archive');
  await page.getByText('Back').click();
  await page.getByText('Play Skirmish').click();
  await page.waitForTimeout(500);
  await shot(page, 'setup');

  // ---------------------------------------------------------------- real input: a short recorded match
  await page.getByText('easy', { exact: true }).click();
  await page.getByText('Start match').click();
  await page.waitForFunction(() => window.__sf.state().screen === 'game', null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  // box-select the workers beside the Core Relay, right-click an ore seam
  const box = await sim(page, () => { const s = window.__sf.session().simulation; const w = s.ids.filter((e) => s.alive[e] && s.owner[e] === 0 && s.d(e).worker).map((e) => window.__sf.screen(s.x[e], s.z[e])); return { x0: Math.min(...w.map((p) => p.x)) - 30, y0: Math.min(...w.map((p) => p.y)) - 40, x1: Math.max(...w.map((p) => p.x)) + 30, y1: Math.max(...w.map((p) => p.y)) + 30 }; });
  await page.mouse.move(box.x0, box.y0); await page.mouse.down(); await page.mouse.move(box.x1, box.y1, { steps: 6 }); await page.mouse.up();
  const ore = await sim(page, () => { const s = window.__sf.session().simulation; const e = s.ids.find((i) => s.alive[i] && s.d(i).id === 'ore' && Math.abs(s.x[i] - 24) < 14 && Math.abs(s.z[i] - 134) < 14); return window.__sf.screen(s.x[e], s.z[e]); });
  await page.mouse.click(ore.x, ore.y - 6, { button: 'right' });
  await page.waitForTimeout(300);
  await sim(page, () => window.__sf.advance(6));
  const gathering = await sim(page, () => { const s = window.__sf.session().simulation; return s.ids.filter((e) => s.alive[e] && s.owner[e] === 0 && s.orders[e][0]?.t === 4).length; });
  if (gathering < 5) throw new Error(`real-input gather failed (${gathering} workers gathering)`);
  // click the Core Relay, press Q to queue a worker
  const hq = await sim(page, () => window.__sf.screen(24, 134));
  await page.mouse.click(hq.x, hq.y - 25);
  await page.waitForTimeout(250);
  await page.keyboard.press('q');
  await page.waitForTimeout(250);
  await sim(page, () => window.__sf.advance(6));
  // select a worker, B then Q, place a Grid Pylon
  const w0 = await sim(page, () => { const s = window.__sf.session().simulation; const e = s.ids.find((i) => s.alive[i] && s.owner[i] === 0 && s.d(i).worker); return window.__sf.screen(s.x[e], s.z[e]); });
  await page.mouse.click(w0.x, w0.y - 4);
  await page.waitForTimeout(250);
  await page.keyboard.press('b'); await page.waitForTimeout(250); await page.keyboard.press('q');
  const spot = await sim(page, () => window.__sf.screen(36, 126));
  await page.mouse.move(spot.x, spot.y);
  await page.waitForTimeout(600);
  await sim(page, () => window.__sf.advance(20 * 20)); // earn the 100 ore
  await page.waitForTimeout(400);
  await shot(page, 'placement');
  await page.mouse.click(spot.x, spot.y);
  await page.waitForTimeout(300);
  await sim(page, () => window.__sf.advance(20 * 45));
  const early = await sim(page, () => { const s = window.__sf.session().simulation; return { pylons: s.ids.filter((e) => s.alive[e] && s.owner[e] === 0 && s.d(e).id === 'grid_pylon').length, workers: s.players[0].workers, cap: s.players[0].supplyCap, commands: s.players[0].stats.commands }; });
  log('after real input:', JSON.stringify(early));
  if (early.pylons < 1 || early.workers < 7) throw new Error('real-input build/train flow failed');
  await page.waitForTimeout(800);
  await shot(page, 'early-game');
  // pause menu -> surrender -> post-game
  for (let i = 0; i < 3; i++) {
    if (await sim(page, () => window.__sf.state().pauseMenu)) break;
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  }
  await shot(page, 'pause-menu');
  await page.getByText('Surrender').click();
  await page.waitForTimeout(300);
  await sim(page, () => window.__sf.advance(30));
  await page.waitForFunction(() => window.__sf.state().screen === 'postgame', null, { timeout: 90000 });
  await page.waitForTimeout(600);
  await shot(page, 'postgame-defeat');
  // watch the replay of that match and verify hashes
  await page.getByText('Watch replay').click();
  await page.waitForFunction(() => window.__sf.state().screen === 'game', null, { timeout: 60000 });
  await page.waitForTimeout(800);
  await sim(page, () => window.__sf.advance(20 * 40));
  await page.waitForTimeout(800);
  await shot(page, 'replay');
  await sim(page, () => window.__sf.advance(20 * 200));
  await page.waitForFunction(() => window.__sf.state().screen === 'postgame', null, { timeout: 90000 });
  const verified = await sim(page, () => window.__sf.state().result.replayVerified);
  log('replay verified in browser:', verified);
  if (verified !== true) throw new Error('replay did not verify in the browser');
  await page.waitForTimeout(400);
  await shot(page, 'replay-verified');
  await page.close();

  // ---------------------------------------------------------------- mid-game captures (AI autopilot drives the local side)
  for (const [faction, name] of [['chorus', 'screenshot'], ['helix', 'helix-battle']]) {
    let info = null;
    // try a few seeds until the autopilot produces a healthy mid-game battle to frame
    for (const seed of [11, 12, 13, 14, 15, 16]) {
      page = await newPage(`?autostart=skirmish&faction=${faction}&enemy=${faction === 'helix' ? 'chorus' : 'helix'}&difficulty=normal&seed=${seed}`);
      await sim(page, () => { window.__sf.autopilot(true); window.__sf.advance(20 * 60 * 3.5); });
      info = await sim(page, () => {
        const ses = window.__sf.session(); const s = ses.simulation;
        let found = false;
        for (let k = 0; k < 900 && !found && s.winner < 0; k++) {
          window.__sf.advance(10);
          let mine = 0, theirs = 0;
          for (const e of s.ids) {
            if (!s.alive[e] || s.d(e).cls !== 'unit' || s.d(e).worker || s.tick - s.lastFire[e] > 20) continue;
            if (s.owner[e] === 0) mine++; else if (s.owner[e] === 1 && s.isVisibleTo(0, e)) theirs++;
          }
          found = mine >= 6 && theirs >= 4;
        }
        if (!found) return null;
        const army = s.ids.filter((e) => s.alive[e] && s.owner[e] === 0 && s.d(e).cls === 'unit' && !s.d(e).worker && !s.d(e).scout);
        const hot = army.filter((e) => s.tick - s.lastFire[e] < 40);
        let x = 0, z = 0;
        for (const e of hot) { x += s.x[e]; z += s.z[e]; }
        x /= hot.length; z /= hot.length;
        window.__sf.camera(x, z - 1, 33);
        ses.input.setSelection(army.filter((e) => Math.abs(s.x[e] - x) < 20 && Math.abs(s.z[e] - z) < 14));
        return { tick: s.tick, army: army.length, fighting: hot.length, winner: s.winner };
      });
      if (info) { info.seed = seed; break; }
      await page.close();
    }
    if (!info) throw new Error('no battle found for ' + faction);
    log(name, JSON.stringify(info));
    await page.waitForTimeout(3500); // let live frames render projectiles and impacts
    await shot(page, name);
    if (faction === 'helix') {
      // base overview with a production structure selected
      await sim(page, () => { const ses = window.__sf.session(); const s = ses.simulation; const st = s.map.starts[0]; window.__sf.camera(st.x + 8, st.z - 3, 40); const b = s.ids.find((e) => s.alive[e] && s.owner[e] === 0 && s.d(e).id === 'assembly_bay'); if (b !== undefined) ses.input.setSelection([b]); });
      await page.waitForTimeout(1500);
      await shot(page, 'base-helix');
      // debug capture: performance panel + navigation / vision surface overlay
      await page.keyboard.press('Backquote');
      await page.waitForTimeout(600);
      await page.getByText('Show nav / vision surfaces').click();
      await sim(page, () => window.__sf.camera(70, 100, 62));
      await page.waitForTimeout(1500);
      await shot(page, 'debug-overlay');
    } else {
      await sim(page, () => { const ses = window.__sf.session(); const s = ses.simulation; const st = s.map.starts[0]; window.__sf.camera(st.x + 8, st.z - 3, 40); const b = s.ids.find((e) => s.alive[e] && s.owner[e] === 0 && s.d(e).id === 'brood_hollow'); if (b !== undefined) ses.input.setSelection([b]); });
      await page.waitForTimeout(1500);
      await shot(page, 'base-chorus');
    }
    await page.close();
  }

  // ---------------------------------------------------------------- tutorial opening
  page = await newPage('?autostart=tutorial');
  await page.waitForTimeout(1500);
  await shot(page, 'tutorial');
  await page.close();

  if (errors.length) throw new Error(`${errors.length} page error(s): ${errors[0]}`);
  log('all captures complete with no page errors');
} catch (e) {
  console.error('[shot] FAILED:', e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.close();
}
