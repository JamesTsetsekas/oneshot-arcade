// End-to-end check of the production build with REAL mouse and keyboard input.
//   node tools/playtest.mjs          -> input / HUD / shop / pause checks (about 40 s)
//   node tools/playtest.mjs full     -> also plays a whole fast-forwarded match to the results screen
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT, launch, serveDist, sleep } from './lib.mjs';
import { installPilot } from './pilot.mjs';

const full = process.argv.includes('full');
const { server, origin } = await serveDist(Number(process.env.PORT || 5341));
await mkdir(OUT, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
  if (ok) pass++;
  else fail++;
};
const state = () => page.evaluate(() => window.__crownfall.debugState());
const you = () =>
  page.evaluate(() => {
    const st = window.__crownfall.debugState();
    return { x: st.self?.x, y: st.self?.y, hp: st.self?.hp, lvl: st.self?.lvl, time: st.time };
  });

try {
  // ---- shell: menu -> draft -> loading -> match --------------------------------------------
  await page.goto(origin);
  await page.waitForSelector('.menu-item');
  check('menu renders with 8 entries', (await page.locator('.menu-item').count()) === 8);
  await page.click('.menu-item:nth-child(3)'); // Practice
  await page.waitForSelector('.hero-card');
  check('draft shows six heroes', (await page.locator('.hero-card').count()) === 6);
  await page.click('.hero-card:nth-child(2)'); // Suri
  await page.click('.talent:nth-child(3)'); // swap a talent
  check('exactly two talents stay selected', (await page.locator('.talent.sel').count()) === 2);
  await page.click('.lockin');
  await page.waitForSelector('.vs-seat');
  check('loading screen lists both teams', (await page.locator('.vs-seat').count()) === 6);
  await page.waitForFunction(() => !!window.__crownfall?.debugState()?.self, null, { timeout: 30000 });
  await sleep(600);
  const s0 = await state();
  check('match starts with six heroes and the worker sim', s0.heroes.length === 6 && (await page.locator('.perf').textContent()).includes('worker'));
  check('allies never duplicate a hero', new Set(s0.heroes.filter((h) => h.team === 0).map((h) => h.hero)).size === 3);

  // ---- shop with real clicks ---------------------------------------------------------------
  await page.keyboard.press('KeyP');
  await page.waitForSelector('.shop');
  await page.locator('.rec-row .shopitem').first().dblclick();
  await sleep(300);
  check('double-click buys the recommended starter', (await page.locator('.inv-row .invslot .tile').count()) === 1);
  const goldAfter = Number((await page.locator('.shop-gold').textContent()).replace(/\D/g, ''));
  check('gold was deducted by the server', goldAfter < 200, 'gold ' + goldAfter);
  await page.click('.buyrow button:nth-child(2)'); // undo
  await sleep(300);
  check('undo refunds while still in the fountain', (await page.locator('.inv-row .invslot .tile').count()) === 0);
  await page.locator('.rec-row .shopitem').first().dblclick();
  await page.keyboard.press('Escape');
  await sleep(200);
  check('Escape closes the shop', (await page.locator('.shop').count()) === 0);

  // ---- rank up, practice tools ---------------------------------------------------------------
  await page.locator('.rankup').first().click({ force: true });
  await sleep(250);
  check('+ button ranks an ability', (await page.locator('.pips b.on').count()) === 1);
  for (let i = 0; i < 5; i++) await page.click('.practice .row:nth-child(2) button:nth-child(2)');
  await page.click('.practice .row:nth-child(2) button:nth-child(1)');
  await sleep(400);
  check('practice tools grant levels', (await you()).lvl === 6, 'level ' + (await you()).lvl);
  await page.keyboard.press('Shift+KeyW');
  await page.keyboard.press('Shift+KeyE');
  await page.keyboard.press('Shift+KeyR');
  await sleep(300);
  check('Shift+key ranks W, E and the ultimate at level 6', (await page.locator('.pips b.on').count()) === 4, 'pips ' + (await page.locator('.pips b.on').count()));

  // ---- movement with a real right-click ------------------------------------------------------
  const p0 = await you();
  await page.mouse.click(1150, 330, { button: 'right' });
  await sleep(1800);
  const p1 = await you();
  check('right-click moves the hero', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 3, `moved ${Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(1)} m`);
  await page.keyboard.press('KeyS');
  await sleep(300);
  const p2 = await you();
  await sleep(500);
  const p3 = await you();
  check('S stops', Math.hypot(p3.x - p2.x, p3.y - p2.y) < 0.2);

  // ---- aim indicator (hold), cast on release -------------------------------------------------
  await page.mouse.move(1100, 380);
  await page.keyboard.down('KeyQ');
  await sleep(250);
  check('holding Q shows the aim hint', (await page.locator('.aimhint').count()) === 1);
  await page.screenshot({ path: join(OUT, 'aim.png') });
  await page.keyboard.up('KeyQ');
  await sleep(350);
  check('releasing Q casts (cooldown starts)', (await page.locator('.slot.ability .cd').count()) === 1);
  await page.keyboard.press('KeyT');
  await sleep(300);
  check('T places a ward', (await page.locator('.slot.talent .count').textContent()) === '1');
  await page.keyboard.press('KeyW'); // Slipstream dash toward the cursor (quick-release)
  await sleep(600);
  const p4 = await you();
  check('W dash displaces the hero', Math.hypot(p4.x - p3.x, p4.y - p3.y) > 3, `moved ${Math.hypot(p4.x - p3.x, p4.y - p3.y).toFixed(1)} m`);

  // ---- camera, scoreboard, pause -------------------------------------------------------------
  await page.keyboard.press('KeyY');
  await sleep(250);
  check('Y toggles camera lock', (await page.locator('.mini-hint').textContent()).includes('free'));
  await page.keyboard.press('KeyY');
  await page.keyboard.down('Tab');
  await sleep(250);
  check('Tab shows the scoreboard', (await page.locator('.scoreboard tbody tr').count()) === 6);
  await page.keyboard.up('Tab');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pause');
  await sleep(300);
  const t1 = (await state()).time;
  await sleep(900);
  const t2 = (await state()).time;
  check('Escape pauses the simulation', t2 - t1 < 0.05, `dt ${(t2 - t1).toFixed(2)}`);
  await page.screenshot({ path: join(OUT, 'pause.png') });
  await page.click('.pause .primary');
  await sleep(600);
  check('Resume continues', (await state()).time > t2);

  // ---- recall with a real key ----------------------------------------------------------------
  await page.keyboard.press('KeyB');
  await sleep(400);
  check('B starts the recall channel', (await page.locator('.recallbar').count()) === 1);
  await page.mouse.click(1150, 330, { button: 'right' });
  await sleep(300);
  check('moving cancels recall', (await page.locator('.recallbar').count()) === 0);

  if (full) {
    // ---- a whole unranked match, fast-forwarded: a scripted player (ordinary commands) + bots ----
    await page.goto(origin + '?autostart=suri&difficulty=normal');
    await page.waitForFunction(() => !!window.__crownfall?.debugState()?.self, null, { timeout: 30000 });
    await page.evaluate(() => {
      const g = window.__crownfall;
      g.send({ t: 'buy', item: 'couriers_satchel' });
      g.send({ t: 'buy', item: 'amber_draught' });
      g.setTimeScale(8);
    });
    await installPilot(page);
    const t0 = Date.now();
    let last = 0;
    for (;;) {
      await sleep(3000);
      if ((await page.locator('.results').count()) > 0) break;
      const s = await page.evaluate(() => window.__crownfall?.debugState?.());
      if (s && s.time - last > 120) {
        last = s.time;
        const k = (t) => s.heroes.filter((h) => h.team === t).reduce((a, h) => a + h.k, 0);
        const me = s.heroes.find((h) => !h.bot);
        console.log(`  t=${(s.time / 60).toFixed(1)}m fps=${s.fps} draws=${s.drawCalls} kills=${k(0)}-${k(1)} you: L${me.lvl} ${me.k}/${me.d}/${me.a} cs${me.cs} items=${me.items.length}`);
      }
      if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('match did not finish within 12 minutes of wall time');
    }
    await sleep(500);
    await page.screenshot({ path: join(OUT, 'results.png') });
    const title = await page.locator('.results h1').textContent();
    check('match reaches the results screen', title === 'Victory' || title === 'Defeat', title);
    check('results list all six heroes', (await page.locator('.res-table tbody tr').count()) === 6);
    check('timeline recorded the Crown Engine', (await page.locator('.timeline li').allTextContents()).some((t) => t.includes('Crown Engine')));
    await page.click('.res-side .row button:nth-child(2)');
    await page.waitForSelector('.menu-item');
    await page.click('.menu-item:nth-child(6)');
    await page.waitForSelector('.hist-row');
    check('match history persisted', (await page.locator('.hist-row').count()) === 1);
    await page.screenshot({ path: join(OUT, 'history.png') });
  }
} catch (e) {
  console.error('PLAYTEST ABORTED:', e);
  fail++;
  try {
    await page.screenshot({ path: join(OUT, 'failure.png') });
  } catch {
    /* ignore */
  }
} finally {
  console.log(errors.length ? 'page errors:\n' + errors.slice(0, 20).join('\n') : 'no page errors');
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  server.close();
  process.exitCode = fail || errors.length ? 1 : 0;
}
