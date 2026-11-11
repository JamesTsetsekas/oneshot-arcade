// Serves dist/ from a nested sub-path and captures real screenshots of the production build with a
// headless Chromium (system Edge or Chrome via playwright-core; no browser download needed).
//   node tools/screenshot.mjs            -> oneshot/screenshot.png + extras
//   node tools/screenshot.mjs --quick    -> only the main gameplay screenshot
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, 'oneshot');
const PORT = Number(process.env.PORT || 5332);
const PREFIX = '/play/claude-fable-5.2-high/protocol/';
const quick = process.argv.includes('--quick');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.map': 'application/json' };

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(PREFIX)) {
    res.writeHead(404).end('outside sub-path');
    return;
  }
  let rel = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html';
  const file = normalize(join(dist, rel));
  if (!file.startsWith(dist)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await mkdir(out, { recursive: true });
const base = `http://127.0.0.1:${PORT}${PREFIX}`;

async function launch() {
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,720'];
  for (const channel of ['msedge', 'chrome', undefined]) {
    try {
      return await chromium.launch({ channel, headless: true, args });
    } catch (e) {
      console.warn(`launch with ${channel ?? 'bundled chromium'} failed: ${String(e).split('\n')[0]}`);
    }
  }
  throw new Error('No Chromium-based browser could be launched.');
}

const browser = await launch();
const errors = [];
let failed = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
  const state = () => page.evaluate(() => window.__lp?.state());
  const waitFor = async (pred, ms, label) => {
    const t0 = Date.now();
    for (;;) {
      const s = await state().catch(() => null);
      if (s && pred(s)) return s;
      if (Date.now() - t0 > ms) {
        console.warn(`timeout waiting for ${label}; state=${JSON.stringify(s)}`);
        return s;
      }
      await page.waitForTimeout(250);
    }
  };

  if (!quick) {
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForSelector('.menu-col', { timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(out, 'menu.png') });
    console.log('menu.png captured');
  }

  // attract mode: the local seat is bot-driven so the capture shows real, unscripted play
  const seed = process.env.SEED || '31';
  const side = process.env.SIDE || 'def';
  await page.goto(`${base}?autostart=quick&side=${side}&autopilot=1&seed=${seed}`, { waitUntil: 'load' });
  await waitFor((s) => s.playing && s.phase === 'buy', 60000, 'buy phase');
  if (!quick) {
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(out, 'buy-phase.png') });
    console.log('buy-phase.png captured');
  }
  await waitFor((s) => s.phase === 'live', 40000, 'live phase');
  await page.waitForTimeout(4000);
  if (!quick) await page.screenshot({ path: join(out, 'round-start.png') });
  // wait for a moment with an enemy on screen, otherwise fall back to mid-round
  // frame the shot: an enemy near the centre of the view while our seat is alive
  let s = await waitFor((st) => st.enemiesInView > 0 && st.alive, 150000, 'enemy in view');
  await page.screenshot({ path: join(out, 'screenshot.png') });
  console.log('screenshot.png captured', JSON.stringify(s));
  if (!quick) {
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(out, 'combat-2.png') });
    s = await waitFor((st) => st.phase === 'armed' || st.round >= 3, 150000, 'armed spike');
    await page.waitForTimeout(1500);
    // only label the capture 'armed' when the Spike really is armed
    const name = s && s.phase === 'armed' ? 'armed.png' : 'later-round.png';
    await page.screenshot({ path: join(out, name) });
    console.log(name + ' captured', JSON.stringify(s));
    // a clear view of an opponent on the armed Spike makes the better lead image
    if (s && s.phase === 'armed') {
      const framed = await waitFor((st) => st.phase !== 'armed' || (st.enemiesInView > 0 && st.alive), 20000, 'enemy near the armed spike');
      if (framed && framed.phase === 'armed' && framed.enemiesInView > 0) {
        await page.screenshot({ path: join(out, 'screenshot.png') });
        console.log('screenshot.png replaced with an armed-phase capture');
      }
    }
  }
  const final = await state();
  console.log('final state', JSON.stringify(final));
  if (!final || !final.playing || final.frames < 30) failed = true;
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  await browser.close();
  server.close();
}
if (errors.length) console.log('browser errors:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
else console.log('no browser console errors');
process.exit(failed ? 1 : 0);
