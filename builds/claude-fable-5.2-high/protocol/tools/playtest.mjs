// Scripted end-to-end check of the production build with real keyboard/mouse events:
// buy menu, purchase, refund, movement, aiming, firing, scoreboard, map, pause, then a fast-forwarded
// bot match to reach the result screen. Writes evidence screenshots to oneshot/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, 'oneshot');
const PORT = Number(process.env.PORT || 5333);
const PREFIX = '/play/claude-fable-5.2-high/protocol/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(PREFIX)) return void res.writeHead(404).end();
  const file = normalize(join(dist, decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html'));
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const base = `http://127.0.0.1:${PORT}${PREFIX}`;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
};

let browser;
for (const channel of ['msedge', 'chrome', undefined]) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
    break;
  } catch {
    /* try next */
  }
}
const errors = [];
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const state = () => page.evaluate(() => window.__lp.state());
  const waitFor = async (pred, ms, label) => {
    const t0 = Date.now();
    for (;;) {
      const s = await state();
      if (pred(s)) return s;
      if (Date.now() - t0 > ms) {
        console.warn('timeout: ' + label);
        return s;
      }
      await page.waitForTimeout(100);
    }
  };
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForSelector('.menu-col', { timeout: 60000 });
  check('menu renders from a nested sub-path', true);
  // menu navigation
  await page.click('.nav button:has-text("Settings")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, 'settings.png') });
  await page.click('.nav button:has-text("Learn")');
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, 'learn.png') });

  // --- human-controlled match (pointer lock is unavailable headless, so capture is forced)
  await page.evaluate(() => {
    window.__lp.game.input.forceCapture = true;
    window.__lp.start({ mode: 'quick', side: 'atk', difficulty: 'easy', seed: 4242 });
  });
  let s = await waitFor((st) => st.phase === 'buy', 30000, 'buy');
  check('match starts in buy phase with $800', s.phase === 'buy' && s.money === 800, `money=${s.money}`);
  const spawn = { x: s.view.x, z: s.view.z };
  // barriers: try to leave spawn during the buy phase
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2600);
  await page.keyboard.up('KeyW');
  s = await state();
  check('buy-phase barrier keeps the player inside spawn', s.view.z < 15, `z=${s.view.z.toFixed(2)}`);
  check('player moved with W', Math.hypot(s.view.x - spawn.x, s.view.z - spawn.z) > 3, `moved ${Math.hypot(s.view.x - spawn.x, s.view.z - spawn.z).toFixed(1)} m`);
  // buy menu via keyboard
  await page.keyboard.press('KeyB');
  await page.waitForSelector('.buy', { timeout: 5000 });
  await page.keyboard.press('Digit3');
  await page.keyboard.press('Digit1'); // Aster 4: cannot afford
  await page.waitForTimeout(300);
  s = await state();
  check('unaffordable purchase is rejected by the server', s.money === 800 && !s.view.primary, `money=${s.money}`);
  await page.keyboard.press('Digit0');
  await page.keyboard.press('Digit5');
  await page.keyboard.press('Digit1'); // Vest $650
  await page.waitForTimeout(300);
  s = await state();
  check('vest purchase applies armor and charges $650', s.view.armor === 100 && s.money === 150, `armor=${s.view.armor} money=${s.money}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, 'buy-menu.png') });
  // refund with right-click
  await page.click('.item.owned', { button: 'right' });
  await page.waitForTimeout(300);
  s = await state();
  check('refund restores money and removes armor', s.view.armor === 0 && s.money === 800, `armor=${s.view.armor} money=${s.money}`);
  await page.keyboard.press('Digit0');
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit2'); // Rook .44 $700
  await page.waitForTimeout(300);
  s = await state();
  check('sidearm purchase equips the Rook .44', s.view.sidearm?.id === 'rook' && s.money === 100, JSON.stringify(s.view.sidearm));
  await page.keyboard.press('KeyB');
  await page.waitForTimeout(200);
  s = await state();
  check('buy menu closes', s.overlay === '');
  await page.keyboard.press('Enter');
  s = await waitFor((st) => st.phase === 'live', 8000, 'live');
  check('ready-up ends the buy phase early', s.phase === 'live');
  // aim with the mouse
  await page.mouse.move(640, 360);
  const yaw0 = (await state()).yaw;
  await page.mouse.move(840, 330, { steps: 10 });
  await page.waitForTimeout(100);
  s = await state();
  check('mouse movement turns the view', Math.abs(s.yaw - yaw0) > 0.05, `dyaw=${(s.yaw - yaw0).toFixed(3)} pitch=${s.pitch.toFixed(3)}`);
  // run out of spawn
  await page.evaluate(() => {
    // face the Spine opening (x 37-43 at z = 15)
    const g = window.__lp.game;
    const v = g.session.view.move;
    g.input.yaw = Math.atan2(40 - v.x, 19 - v.z);
    g.input.pitch = 0;
  });
  const z0 = (await state()).view.z;
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2200);
  s = await state();
  check('barriers drop when the round goes live', s.view.z > 15.2 || s.view.z - z0 > 4, `z ${z0.toFixed(1)} -> ${s.view.z.toFixed(1)}`);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(400);
  // fire
  s = await state();
  const ammo0 = s.view.sidearm.ammo;
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(450);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(250);
  s = await state();
  check('firing consumes ammunition (semi-auto: one per click)', s.view.sidearm.ammo === ammo0 - 2, `ammo ${ammo0} -> ${s.view.sidearm.ammo}`);
  check('prediction stays in agreement with the server', s.correctionCm < 2, `max correction ${s.correctionCm.toFixed(3)} cm`);
  await page.screenshot({ path: join(out, 'human-play.png') });
  // jump
  await page.keyboard.down('Space');
  await page.waitForTimeout(180);
  const air = await state();
  await page.keyboard.up('Space');
  check('jump leaves the ground', air.predicted.y > 0.15, `y=${air.predicted.y.toFixed(2)}`);
  await page.waitForTimeout(700);
  // scoreboard + map
  await page.keyboard.down('Tab');
  await page.waitForSelector('.board', { timeout: 4000 });
  await page.screenshot({ path: join(out, 'scoreboard.png') });
  await page.keyboard.up('Tab');
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, 'tactical-map.png') });
  await page.keyboard.press('KeyM');
  // pause
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pause', { timeout: 4000 });
  const t1 = (await state()).tick;
  await page.waitForTimeout(600);
  const t2 = (await state()).tick;
  check('pause freezes the local server', t1 === t2, `tick ${t1} -> ${t2}`);
  await page.screenshot({ path: join(out, 'pause.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  s = await state();
  check('resume continues the match', s.overlay === '' && s.playing);

  // --- fast-forwarded bot match to reach the result screen
  await page.evaluate(() => {
    window.__lp.start({ mode: 'quick', side: 'def', difficulty: 'normal', seed: 99, autopilot: true });
    window.__lp.game.debugSpeed = 12;
  });
  s = await waitFor((st) => st.phase === 'matchEnd', 240000, 'match end');
  check('a full quick match completes with a result', s.phase === 'matchEnd', `score ${s.score}`);
  await page.waitForSelector('.result', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, 'result.png') });
  check('result screen is shown', true);
  await page.click('button:has-text("Main menu")');
  await page.waitForSelector('.menu-col', { timeout: 5000 });
  check('returns to the main menu', true);
} catch (e) {
  console.error(e);
  check('script completed', false, String(e));
} finally {
  await browser.close();
  server.close();
}
if (errors.length) console.log('browser errors:\n' + [...new Set(errors)].slice(0, 15).join('\n'));
else console.log('no browser console errors');
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
