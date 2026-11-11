// Runs the ?bench=1 scene in headless Edge and prints the result (software rasteriser unless a GPU is available).
import { chromium } from 'playwright-core';
import path from 'node:path';
import { serve } from './serve.mjs';

const prefix = '/play/claude-sonnet-5.5-high/shardfront/';
const server = await serve(path.resolve('dist'), prefix, 5508);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:5508${prefix}?bench=1`);
for (let i = 0; i < 240; i++) { if (await page.evaluate(() => window.__bench)) break; await page.waitForTimeout(500); }
console.log(JSON.stringify(await page.evaluate(() => window.__bench)));
await page.screenshot({ path: 'oneshot/benchmark.png' });
await browser.close();
server.close();
