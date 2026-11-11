// Headless browser check + screenshots from the production build (served under a sub-path).
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
import fs from 'node:fs';

const PORT = 5542, PREFIX = '/play/claude-sonnet-5.5-high/crownfall/';
const server = serve(PORT, PREFIX);
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(`http://127.0.0.1:${PORT}${PREFIX}`);
await page.waitForTimeout(2500);
fs.mkdirSync('oneshot', { recursive: true });
await page.screenshot({ path: 'oneshot/menu.png' });
console.log('menu ok');
const step = process.argv[2] ?? 'menu';
if (step !== 'menu') {
  await page.click('text=Play');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'oneshot/draft.png' });
  console.log('draft ok');
}
console.log(logs.join('\n') || 'no console errors');
await browser.close();
server.close();
