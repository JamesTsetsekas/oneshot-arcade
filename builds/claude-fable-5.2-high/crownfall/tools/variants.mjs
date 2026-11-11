// Smoke-checks settings variants on the production build: low quality + colour-blind palette +
// 125% UI scale, and high quality with the in-process (non-worker) simulation fallback.
import { join } from 'node:path';
import { OUT, launch, serveDist, sleep } from './lib.mjs';
import { installPilot } from './pilot.mjs';

const { server, origin } = await serveDist(Number(process.env.PORT || 5343));
const browser = await launch();
let failed = 0;
const variants = [
  { name: 'variant-low-colorblind-125', settings: { quality: 'low', colorblind: true, uiScale: 1.25 }, query: '?autostart=ilyra', expectLink: 'worker' },
  { name: 'variant-high-inproc', settings: { quality: 'high' }, query: '?autostart=kesh&inproc=1', expectLink: 'inproc' },
];
for (const v of variants) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await ctx.addInitScript((settings) => {
    const base = { quality: 'medium', castMode: 'indicator', master: 0.7, music: 0.45, sfx: 0.8, edgeScroll: true, cameraLock: true, screenShake: true, damageNumbers: true, colorblind: false, uiScale: 1, tutorialHints: true };
    localStorage.setItem('crownfall.v1', JSON.stringify({ v: 1, settings: { ...base, ...settings }, profile: { mastery: {}, history: [], tutorialDone: false, matches: 0 } }));
  }, v.settings);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(origin + v.query);
    await page.waitForFunction(() => !!window.__crownfall?.debugState()?.self, null, { timeout: 60000 });
    await page.evaluate(() => {
      const g = window.__crownfall;
      g.send({ t: 'buy', item: 'exiles_inkpot' });
      g.send({ t: 'buy', item: 'reedcutters_fang' });
      g.setTimeScale(4);
    });
    await installPilot(page);
    for (let i = 0; i < 80; i++) {
      await sleep(500);
      if ((await page.evaluate(() => window.__crownfall.debugState().time)) > 95) break;
    }
    await page.evaluate(() => window.__crownfall.setTimeScale(1));
    await sleep(1200);
    const s = await page.evaluate(() => window.__crownfall.debugState());
    const perf = await page.locator('.perf').textContent();
    await page.screenshot({ path: join(OUT, v.name + '.png') });
    const ok = !errors.length && perf.includes(v.expectLink) && s.time > 90;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${v.name}: t=${s.time.toFixed(0)}s, ${perf}${errors.length ? ' errors: ' + errors.join(' | ') : ''}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${v.name}: ${e}`);
  }
  await ctx.close();
}
await browser.close();
server.close();
process.exitCode = failed ? 1 : 0;
