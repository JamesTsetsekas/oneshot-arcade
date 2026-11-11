// End-to-end flow check on the production build: death -> spectate -> results -> requeue, pause menu, victory.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const { server, base } = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, a) => page.evaluate(fn, a);
const out = (n) => 'oneshot/' + n + '.png';

await page.goto(base + '?seed=4242');
await page.waitForSelector('.menu-col');
await page.click('text=Quick Drop');
await page.waitForSelector('.queue-card');
await page.screenshot({ path: out('queue') });
await page.waitForFunction(() => window.__skybreak?.state === 'playing', null, { timeout: 90000 });
await ev(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); g.debugScale = 8; });
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__skybreak.match.phase === 'skiff', null, { timeout: 30000 });
await page.waitForFunction(() => window.__skybreak.match.clock > 16, null, { timeout: 60000 });
await page.keyboard.press('Space');
await page.waitForFunction(() => ['ground', 'swim'].includes(window.__skybreak.match.players[0].mode), null, { timeout: 120000 });
await ev(() => { window.__skybreak.debugScale = 1; });
// pause menu via Escape
await page.keyboard.press('Escape'); await sleep(400);
await page.screenshot({ path: out('pause') });
console.log('state after esc', await ev(() => window.__skybreak.state));
await page.click('text=Resume'); await sleep(300);
await ev(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); });
// eliminate the player -> spectate
await ev(() => { const m = window.__skybreak.match; const h = m.players[0]; const k = m.players[5]; m.damage(h, 999, k.id, 'Wayfarer Rifle', 'torso', true); });
await sleep(3500);
await page.screenshot({ path: out('spectate') });
console.log('spectate bar', await ev(() => !document.querySelector('.spectate-bar').classList.contains('hidden')));
await ev(() => { window.__skybreak.debugScale = 8; });
console.log('probe', JSON.stringify(await ev(() => { const bs = [...document.querySelectorAll('.spectate-bar button')]; const b = bs[bs.length - 1]; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); const bar = document.querySelector('.spectate-bar'); return { rect: [r.x, r.y, r.width, r.height], top: el && (el.tagName + '.' + el.className + '#' + el.id), barClass: bar.className, hudClass: document.getElementById('hud').className, barPE: getComputedStyle(bar).pointerEvents, scroll: [document.documentElement.scrollTop, document.body.scrollTop, document.getElementById('app').scrollTop] }; })));
const pt = await ev(() => { const bs = [...document.querySelectorAll('.spectate-bar button')]; const r = bs[bs.length - 1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, lock: !!document.pointerLockElement }; });
console.log('click point', JSON.stringify(pt));
await page.mouse.click(pt.x, pt.y); await sleep(800);
await page.screenshot({ path: out('results') });
console.log('results shown', await ev(() => !!document.querySelector('.results')));
await page.click('text=Requeue');
await page.waitForFunction(() => window.__skybreak?.state === 'playing', null, { timeout: 90000 });
console.log('requeued ->', await ev(() => ({ state: window.__skybreak.state, phase: window.__skybreak.match.phase, profile: window.__skybreak.profile.matches })));
// victory path: kill every bot
await ev(() => { const g = window.__skybreak; g.input.debugSet({ locked: true }); g.hud.showHint(false); g.debugScale = 8; });
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__skybreak.match.phase === 'skiff', null, { timeout: 30000 });
await page.waitForFunction(() => window.__skybreak.match.clock > 18, null, { timeout: 60000 });
await page.keyboard.press('Space');
await page.waitForFunction(() => ['ground', 'swim'].includes(window.__skybreak.match.players[0].mode), null, { timeout: 120000 });
await ev(() => { window.__skybreak.debugScale = 1; const m = window.__skybreak.match; for (const p of m.players) if (p.id !== 0 && p.alive) m.damage(p, 999, 0, 'Wayfarer Rifle', 'torso', true); });
await page.waitForSelector('.results', { timeout: 30000 });
await sleep(400);
await page.screenshot({ path: out('victory') });
console.log('victory text', await ev(() => document.querySelector('.place').textContent));
console.log('logs', logs.slice(0, 10).join('\n') || 'none');
await browser.close(); server.close();
