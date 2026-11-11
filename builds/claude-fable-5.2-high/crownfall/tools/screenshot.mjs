// Captures real screenshots of the production build (dist/) served from a nested sub-path, using
// an installed Chromium-based browser via playwright-core.
//   node tools/screenshot.mjs [menu] [draft] [shop] [game] [tutorial]     (default: all)
// "game" lets a tiny autopilot (issuing ordinary player commands through the public command path)
// lane for a few minutes so the capture is of an actual fight, then saves several candidates.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT, launch, serveDist, sleep } from './lib.mjs';
import { installPilot } from './pilot.mjs';

const { server, origin } = await serveDist(Number(process.env.PORT || 5340));
console.log('serving dist at', origin);
const want = process.argv.slice(2);
const doShot = (n) => !want.length || want.includes(n);
await mkdir(OUT, { recursive: true });
const browser = await launch();
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
const state = () => page.evaluate(() => window.__crownfall?.debugState());
const send = (cmd) => page.evaluate((c) => window.__crownfall.send(c), cmd);
const waitStart = () => page.waitForFunction(() => !!window.__crownfall?.debugState()?.self, null, { timeout: 60000 });

try {
  if (doShot('menu')) {
    await page.goto(origin);
    await page.waitForSelector('.menu-item');
    await sleep(400);
    await page.screenshot({ path: join(OUT, 'menu.png') });
    console.log('menu.png');
  }
  if (doShot('draft')) {
    await page.goto(origin);
    await page.click('.menu-item.primary');
    await page.waitForSelector('.hero-card');
    await page.click('.hero-card:nth-child(4)');
    await sleep(300);
    await page.screenshot({ path: join(OUT, 'draft.png') });
    console.log('draft.png');
  }
  if (doShot('tutorial')) {
    await page.goto(origin + '?autostart=brannoch&mode=tutorial');
    await waitStart();
    await sleep(1500);
    await page.screenshot({ path: join(OUT, 'tutorial.png') });
    console.log('tutorial.png');
  }
  if (doShot('shop') || doShot('game')) {
    await page.goto(origin + '?autostart=suri&difficulty=normal');
    await waitStart();
    await send({ t: 'buy', item: 'couriers_satchel' });
    await send({ t: 'buy', item: 'amber_draught' });
    await send({ t: 'rank', slot: 0 });
    if (doShot('shop')) {
      await page.keyboard.press('KeyP');
      await sleep(500);
      await page.click('.tier:last-child .shopitem:nth-child(1)');
      await sleep(200);
      await page.screenshot({ path: join(OUT, 'shop.png') });
      console.log('shop.png');
      await page.keyboard.press('KeyP');
    }
    if (doShot('game')) {
      // autopilot: lane in the lower lane, last-hit-ish, cast at heroes, retreat when low
      await installPilot(page);
      await page.evaluate(() => window.__crownfall.setTimeScale(3));
      let n = 0;
      const t0 = Date.now();
      let slowed = false;
      while (n < 8 && Date.now() - t0 < 240000) {
        await sleep(350);
        const s = await state();
        if (!s?.self) continue;
        const info = await page.evaluate(() => {
          const g = window.__crownfall;
          const me = g.debugState().self;
          if (!me) return null;
          const u = g.debugUnits();
          const d = (x) => Math.hypot(x.x - me.x, x.y - me.y);
          return { heroes: u.filter((x) => x.k === 'hero' && x.t === 1 && d(x) < 10).length, near: u.filter((x) => d(x) < 13).length, allies: u.filter((x) => x.k === 'hero' && x.t === 0 && d(x) < 12).length };
        });
        if (!info) continue;
        if (s.time > 140 && !slowed) {
          slowed = true;
          await page.evaluate(() => window.__crownfall.setTimeScale(1));
        }
        if (s.time > 150 && info.heroes >= 1 && info.near >= 9) {
          await page.mouse.move(1180, 430);
          await page.screenshot({ path: join(OUT, `cand-${n}.png`) });
          console.log(`cand-${n}.png t=${s.time.toFixed(0)}s`, JSON.stringify(info), `lvl ${s.self.lvl} hp ${s.self.hp}/${s.self.mhp}`);
          n++;
          await sleep(900);
        }
      }
      if (n === 0) {
        await page.screenshot({ path: join(OUT, 'cand-0.png') });
        console.log('no fight found within the time limit; captured the current view as cand-0.png');
      }
      const s = await state();
      console.log('final:', `t=${s.time.toFixed(0)}s fps=${s.fps} draws=${s.drawCalls} units=${s.units}`);
    }
  }
} catch (e) {
  console.error('SCREENSHOT RUN FAILED:', e);
  try {
    await page.screenshot({ path: join(OUT, 'failure.png') });
  } catch {
    /* ignore */
  }
  process.exitCode = 3;
} finally {
  console.log(errors.length ? 'page errors:\n' + errors.slice(0, 20).join('\n') : 'no page errors');
  await browser.close();
  server.close();
}
