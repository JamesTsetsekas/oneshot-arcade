// Captures the delivery screenshots from the production build (served from a sub-path) with a headless browser.
// The player seat is driven by the bot brain (?autoplay=1) so no human input is needed; frames come from the real render path.
import { launch } from './shot.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'oneshot');
fs.mkdirSync(out, { recursive: true });
const seed = process.argv[2] ?? '11';
const { server, browser, page, logs, url } = await launch({ width: 1920, height: 1080 });
try {
  await page.goto(url('?dev=1&autoplay=1&start=1&seed=' + seed + '&side=int'));
  await page.waitForFunction(() => window.__lp && window.__lp.state().running, null, { timeout: 30000 });
  const snap = async (name) => {
    await page.evaluate(() => window.__lp.game.devFreeze(true));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(out, name) });
    await page.evaluate(() => window.__lp.game.devFreeze(false));
  };
  // title / menu
  // advance to the live phase
  await page.evaluate(() => window.__lp.game.devAdvance(21));
  let found = false;
  const info = await page.evaluate(() => window.__lp.state());
  console.log('after buy', JSON.stringify({ phase: info.phase, round: info.round }));
  for (let i = 0; i < 90 && !found; i++) {
    await page.evaluate(() => window.__lp.game.devAdvance(1));
    found = await page.evaluate(() => {
      const s = window.__lp.game.net.latest;
      if (!s || s.phase === 'buy' || !s.self.alive || s.phaseRemaining > 95) return false;
      const yaw = window.__lp.game.input.yaw, me = s.self.pos;
      return s.players.some((p) => {
        if (!p.spotted || !p.alive) return false;
        const dx = p.pos.x - me.x, dz = p.pos.z - me.z;
        const d = Math.hypot(dx, dz);
        const a = Math.atan2(-dx, -dz) - yaw;
        const ad = Math.abs(((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        return d < 40 && ad < 0.6;
      });
    });
  }
  console.log('enemy spotted:', found);
  await page.evaluate(() => window.__lp.game.devAdvance(0.3));
  await snap('screenshot.png');
  console.log(JSON.stringify(await page.evaluate(() => window.__lp.state())));
} finally {
  if (logs.length) console.log('--- console ---\n' + logs.slice(0, 20).join('\n'));
  await browser.close();
  server.close();
}
