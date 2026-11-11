// Benchmark scene probe: node tools/bench.mjs [seconds]. Reports what the HEADLESS (software-rendered) browser measured.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';

const PORT = 5515;
const PREFIX = '/play/claude-sonnet-5.5-high/ashfall/';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => existsSync(p));
const seconds = Number(process.argv[2] ?? 20);
const server = await startServer(PORT, PREFIX);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${PORT}${PREFIX}?autostart=cinder&bench=1`);
await page.waitForTimeout(seconds * 1000);
const res = await page.evaluate(() => {
  const a = window.__ashfall;
  return { fps: a.fps, enemiesAlive: a.game.enemies.filter((e) => e.alive).length, draws: a.view.renderer.info.render.calls, triangles: a.view.renderer.info.render.triangles, resScale: a.view.resScale, renderer: (() => { const c = document.createElement('canvas').getContext('webgl2'); const d = c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; })() };
});
console.log(JSON.stringify(res, null, 1));
await page.screenshot({ path: '.tmp/bench.png' });
await browser.close();
server.close();
