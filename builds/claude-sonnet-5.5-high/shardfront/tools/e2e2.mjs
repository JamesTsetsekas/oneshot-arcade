// Verdant faction flow, post-game screen, replay persistence + playback with hash verification, settings persistence.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const prefix = '/play/claude-sonnet-5.5-high/shardfront/';
const server = await serve(path.resolve('dist'), prefix, 5507);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:5507${prefix}`);
await page.waitForSelector('.menu');
fs.mkdirSync('oneshot', { recursive: true });
const ev = (s) => page.evaluate(`(()=>{ const app=window.__app; const game=app.game; const sim=game&&game.sim; const D=window.__defIndex; ${s} })()`);
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' - ' + extra : '')); };
const until = async (cond, ms = 60000) => { await ev('game.speed = 8;'); const t0 = Date.now(); let ok = false; while (Date.now() - t0 < ms) { ok = await ev('return !!(' + cond + ')'); if (ok) break; await page.waitForTimeout(300); } await ev('game.speed = 1;'); return ok; };

// settings persistence + palette
await page.click('[data-a=settings]');
await page.waitForSelector('[data-t=access]');
await page.click('[data-t=access]');
await page.selectOption('[data-s=palette]', 'deuter');
await page.click('[data-a=done]');
check('settings change applied', (await page.evaluate('window.__app.settings.palette')) === 'deuter');

// Verdant skirmish
await page.click('[data-a=play]');
await page.waitForSelector('[data-a=start]');
await page.click('[data-f=verdant]');
await page.click('[data-e=helix]');
await page.click('[data-d=easy]');
await page.click('[data-a=start]');
await page.waitForSelector('#hud', { timeout: 60000 });
await page.waitForTimeout(1200);
check('Verdant start: 6 Tenders + Glimmerwing scout', await ev(`return sim.ids.filter(i=>sim.owner[i]===0&&sim.def(i).id==='tender').length===6 && sim.ids.filter(i=>sim.owner[i]===0&&sim.def(i).id==='glimmerwing').length===1`));
// build a Root Node by key presses, tender freed immediately
await ev(`game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='tender').slice(0,1));`);
await page.keyboard.press('b'); await page.keyboard.press('w');
const spot = await ev(`let best=null; const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); for(let r=8;r<16&&!best;r++){ for(let k=0;k<32;k++){ const a=k/32*6.283; const x=sim.x[h]+Math.cos(a)*r, y=sim.y[h]+Math.sin(a)*r; if(sim.canPlace(0, D.root_node, x, y).ok){ best=[x,y]; break; } } } const t={x:0,y:0,z:0}; game.renderer.cam.project(best[0],sim.groundHeight(best[0],best[1])+0.1,best[1],innerWidth,innerHeight,t); return [t.x,t.y];`);
await page.mouse.move(spot[0], spot[1]); await page.waitForTimeout(150); await page.mouse.click(spot[0], spot[1]);
await until("sim.countOf(0,'root_node',false)>=1", 30000);
await until("sim.ext[sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='root_node')].prog>40", 30000);
check('seeded Root Node grows autonomously while the Tender is free', await ev(`const w=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='tender'&&sim.ext[i].orders[0]?.k!==7); const n=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='root_node'); return !!w && sim.ext[n].prog>40`));
await until("sim.countOf(0,'root_node',true)>=1", 60000);
check('Root Node completes and raises supply', await ev('return sim.players[0].supplyCap===18'));
// Rootstep
await ev(`const t=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='tender'); const n=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='root_node'); game.input.select([t]); game.cmd({c:'order',ord:'ability',ids:[t],target:n,x:sim.x[n],y:sim.y[n],param:0});`);
await page.waitForTimeout(400);
await until("sim.ids.some(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='tender'&&sim.ext[i].cds[0]>0)", 5000);
check('Rootstep ability starts its cooldown', await ev(`return sim.ids.some(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='tender'&&sim.ext[i].cds[0]>0)`));
await page.screenshot({ path: 'oneshot/e2e-verdant.png' });
// advance and win, then post-game + replay
await ev(`game.paused=true; for(let i=0;i<400;i++){ sim.step(); sim.events.length=0; } const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===1&&sim.td(i).isHall); sim.kill(h,0); game.paused=false;`);
await page.waitForSelector('[data-a=rematch]', { timeout: 30000 });
check('post-game screen shows result and stats', (await page.textContent('.big')).includes('VICTORY'));
await page.screenshot({ path: 'oneshot/postgame.png' });
check('post-game offers rematch + replay', (await page.$('[data-a=replay]')) !== null);
await page.click('[data-a=replay]');
await page.waitForSelector('.replaybar', { timeout: 30000 });
await until("game.sim.tick>=300", 40000);
await page.waitForTimeout(500);
check('replay reaches matching state hashes', (await ev('return game.verified')) === 'ok', await ev('return game.verified'));
await page.screenshot({ path: 'oneshot/replay.png' });
// settings persisted in IndexedDB across reload
await page.reload();
await page.waitForSelector('.menu');
check('settings persisted to IndexedDB across reload', (await page.evaluate('window.__app.settings.palette')) === 'deuter');
check('history persisted', await page.evaluate(`(async()=>{ const l = await window.__app.repo.list('history'); return l.length>=1; })()`));
console.log('console:', logs.slice(0, 10).join('\n') || 'none');
const failed = results.filter((r) => !r.ok).length;
console.log(`e2e2: ${results.length - failed}/${results.length} passed`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
