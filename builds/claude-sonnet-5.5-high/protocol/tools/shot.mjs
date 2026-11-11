// Headless browser harness: serves dist/ from a sub-path, drives the production build with Playwright (Edge/Chrome
// channel, software WebGL), captures screenshots and reports console errors / runtime state.
// Usage: node tools/shot.mjs <outDir> <scenario>
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const BASE = '/play/claude-sonnet-5.5-high/protocol/';
const PORT = 5535;

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (!p.startsWith(BASE)) { res.writeHead(404); res.end('not found'); return; }
    p = p.slice(BASE.length) || 'index.html';
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dist, p);
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

export async function launch(opts = {}) {
  const server = await serve();
  const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath: exe, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle', '--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await browser.newContext({ viewport: { width: opts.width ?? 1920, height: opts.height ?? 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message + '\n' + (e.stack || '')));
  return { server, browser, page, logs, url: (q) => `http://localhost:${PORT}${BASE}${q ?? ''}` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || path.join(root, 'oneshot');
  const scenario = process.argv[3] || 'play';
  fs.mkdirSync(out, { recursive: true });
  const { server, browser, page, logs, url } = await launch();
  try {
    if (scenario === 'title') {
      await page.goto(url(''));
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(out, 'title.png') });
    } else {
      await page.goto(url('?dev=1&autoplay=1&start=1&seed=' + (process.argv[4] ?? 11) + '&side=' + (process.argv[6] ?? 'int')));
      await page.waitForFunction(() => window.__lp && window.__lp.state().running, null, { timeout: 30000 });
      const steps = (process.argv[5] ?? '30').split(',').map(Number);
      let idx = 0;
      for (const sec of steps) {
        await page.evaluate((s) => { window.__lp.game.devAdvance(s); window.__lp.game.devFreeze(true); }, sec);
        await page.waitForTimeout(1800);
        const st = await page.evaluate(() => window.__lp.state());
        console.log(JSON.stringify({ step: idx, adv: sec, phase: st.phase, round: st.round, score: st.score, fps: st.fps, dc: st.drawCalls, tri: st.triangles, tick: st.tickMsAvg?.toFixed(2), tickMax: st.tickMsMax?.toFixed(1), alive: st.self?.alive, hp: st.self?.hp, kbps: st.downKBps?.toFixed(1) }));
        await page.screenshot({ path: path.join(out, steps.length > 1 ? 'shot' + idx + '.png' : 'screenshot.png') });
        await page.evaluate(() => window.__lp.game.devFreeze(false));
        idx++;
      }

    }
  } finally {
    if (logs.length) console.log('--- console ---\n' + logs.slice(0, 30).join('\n'));
    await browser.close();
    server.close();
  }
}
