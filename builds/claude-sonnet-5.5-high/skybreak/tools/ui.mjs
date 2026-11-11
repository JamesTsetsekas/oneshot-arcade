// Click through the shell screens (settings, career, controls) and the load path without WebGL, and with a faked missing WebGL2.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const { server, base } = await serve(5553);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(base);
await page.waitForSelector('.menu-col');
await page.screenshot({ path: 'oneshot/menu.png' });
await page.click('text=Settings');
await page.waitForSelector('.settings-grid');
await page.click('.tab:has-text("Graphics")');
await page.screenshot({ path: 'oneshot/settings.png' });
await page.click('.tab:has-text("Controls")');
await page.click('.keybtn >> nth=0');
await page.keyboard.press('KeyI');
console.log('rebound forward ->', await page.evaluate(() => window.__skybreak.settings.keys.forward));
await page.click('text=Reset to defaults');
await page.click('.tab:has-text("Accessibility")');
await page.click('text=Done');
await page.click('text=Career & Appearance');
await page.waitForSelector('.outfits');
await page.screenshot({ path: 'oneshot/career.png' });
await page.click('text=Back');
await page.click('text=Controls & Credits');
await page.waitForSelector('.credits');
await page.screenshot({ path: 'oneshot/controls.png' });
await page.click('text=Back');
console.log('menu again', await page.isVisible('text=Quick Drop'));

// WebGL2 missing -> clear error screen
const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await p2.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) { if (type === 'webgl2') return null; return orig.call(this, type, ...rest); };
});
await p2.goto(base);
await p2.waitForSelector('.error-card');
console.log('no-webgl2 message:', await p2.textContent('.error-card h2'));
await p2.screenshot({ path: 'oneshot/error-webgl.png' });
console.log('logs', logs.slice(0, 10).join('\n') || 'none');
await browser.close(); server.close();
