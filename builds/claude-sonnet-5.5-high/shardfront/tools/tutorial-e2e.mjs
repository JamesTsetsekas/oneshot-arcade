// Drives the Tutorial scenario through every step (mix of real key presses and commands) to prove the steps validate actions.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const prefix = '/play/claude-sonnet-5.5-high/shardfront/';
const server = await serve(path.resolve('dist'), prefix, 5505);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:5505${prefix}`);
await page.waitForSelector('.menu');
await page.click('[data-a=tutorial]');
await page.waitForSelector('[data-a=start]');
await page.click('[data-a=start]');
await page.waitForSelector('#hud', { timeout: 60000 });
await page.waitForTimeout(1500);
fs.mkdirSync('oneshot', { recursive: true });
const ev = (s) => page.evaluate(`(()=>{ const app=window.__app; const game=app.game; const sim=game.sim; const D=window.__defIndex; ${s} })()`);
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' - ' + extra : '')); };
const until = async (cond, ms = 90000) => { await ev('game.speed = 8;'); const t0 = Date.now(); let ok = false; while (Date.now() - t0 < ms) { ok = await ev('return !!(' + cond + ')'); if (ok) break; await page.waitForTimeout(300); } await ev('game.speed = 1;'); return ok; };
const stepIdx = () => ev('return game.tutorial.idx');
const spot = (defId, minR) => ev(`let best=null; const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); for(let r=${minR};r<16&&!best;r++){ for(let k=0;k<32;k++){ const a=k/32*6.283; const x=sim.x[h]+Math.cos(a)*r, y=sim.y[h]+Math.sin(a)*r; if(sim.canPlace(0, D[${JSON.stringify(defId)}], x, y).ok){ best=[x,y]; break; } } } return best;`);

check('tutorial starts at step 0', (await stepIdx()) === 0);
check('tutorial enemy is a passive outpost (no AI economy)', await ev(`return sim.players[1].ai.state==='Opening' && sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===1&&sim.td(i).isWorker).length===3`));
// 1 select
await ev(`game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isWorker));`);
await until('game.tutorial.idx>=1', 10000);
check('step 1 (select) validates', (await stepIdx()) >= 1);
// 2 gather
await ev(`const n=sim.nearestNode(sim.x[sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall)], sim.y[sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall)], 'ore_seam'); game.cmd({c:'order',ord:'gather',ids:game.input.selection,target:n});`);
await until('game.tutorial.idx>=2', 60000);
check('step 2 (gather) validates', (await stepIdx()) >= 2);
// 3 workers
await ev(`const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); game.input.select([h]);`);
await page.keyboard.press('q'); await page.keyboard.press('q');
await until('game.tutorial.idx>=3', 20000);
check('step 3 (train workers) validates', (await stepIdx()) >= 3);
// 4 pylon, 5 bay, 6 tap
const build = async (defId, minR) => { const p = await spot(defId, minR); await ev(`game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isWorker).slice(0,2)); game.cmd({c:'order',ord:'build',ids:game.input.selection,x:${p[0]},y:${p[1]},param:D[${JSON.stringify(defId)}]});`); };
await build('grid_pylon', 8);
await until('game.tutorial.idx>=4', 60000);
check('step 4 (pylon) validates', (await stepIdx()) >= 4);
await until("sim.countOf(0,'grid_pylon',true)>=1", 80000);
await build('assembly_bay', 8);
await until('game.tutorial.idx>=5', 60000);
check('step 5 (assembly bay) validates', (await stepIdx()) >= 5);
await ev(`const v=sim.ids.find(i=>sim.alive[i]&&sim.type[i]===D.flux_vent&&Math.hypot(sim.x[i]-sim.x[sim.ids.find(j=>sim.alive[j]&&sim.owner[j]===0&&sim.td(j).isHall)], sim.y[i]-sim.y[sim.ids.find(j=>sim.alive[j]&&sim.owner[j]===0&&sim.td(j).isHall)])<15); game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isWorker).slice(2,4)); game.cmd({c:'order',ord:'build',ids:game.input.selection,x:sim.x[v],y:sim.y[v],param:D.flux_tap});`);
await until('game.tutorial.idx>=6', 60000);
check('step 6 (flux tap) validates', (await stepIdx()) >= 6);
// 7 train 4 bulwarks (top up resources: the tutorial economy is realistic, we are only testing validation here)
await until("sim.countOf(0,'assembly_bay',true)>=1", 90000);
await ev(`sim.players[0].ore += 600; const b=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='assembly_bay'); game.input.select([b]);`);
for (let i = 0; i < 4; i++) { await page.keyboard.press('w'); await page.waitForTimeout(80); }
await until("sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='bulwark').length>=4", 120000);
await until('game.tutorial.idx>=7', 20000);
check('step 7 (4 Bulwarks) validates', (await stepIdx()) >= 7);
// 8 control group via real key combo
await ev(`game.input.select(sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='bulwark'));`);
await page.keyboard.press('Control+1');
await until('game.tutorial.idx>=8', 10000);
check('step 8 (control group) validates', (await stepIdx()) >= 8);
// 9 brace via Q
await ev(`game.input.select([game.input.groups[1][0]]);`);
await page.keyboard.press('q');
await until('game.tutorial.idx>=9', 15000);
check('step 9 (ability) validates', (await stepIdx()) >= 9);
// 10 attack-move to the marker (units are teleported near the outpost to keep the test short)
await ev(`const m=game.tutorial.marker; for(const id of game.input.groups[1]){ sim.x[id]=m.x-14; sim.y[id]=m.y+8; sim.px[id]=sim.x[id]; sim.py[id]=sim.y[id]; sim.ext[id].mode=0; } game.renderer.cam.setTarget(m.x, m.y, true); game.input.select(game.input.groups[1]);`);
await page.keyboard.press('1');
await page.keyboard.press('a');
await page.waitForTimeout(300);
await page.mouse.click(800, 420);
await until('game.tutorial.idx>=10', 20000);
console.log(await ev(`const t=game.tutorial; const m=t.marker; return JSON.stringify({idx:t.idx, flags:t.flags, marker:m, d:game.input.groups[1].map(id=>sim.alive[id]?Math.round(Math.hypot(sim.x[id]-m.x,sim.y[id]-m.y)):-1), over:sim.over, mode:game.input.mode.kind})`));
check('step 10 (attack-move) validates', (await stepIdx()) >= 10);
// 11 destroy: the Bulwarks are attack-moving into the outpost; finish the Heartgrove if they have not yet
await page.evaluate(`(()=>{ const g=window.__app.game; if(!g) return; const sim=g.sim; const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===1&&sim.td(i).isHall); if(h!==undefined) sim.kill(h,0); })()`);
let done = false;
for (let i = 0; i < 60 && !done; i++) { await page.waitForTimeout(500); done = await page.evaluate(`window.__app.profile.tutorialDone`); }
check('final objective validates and the tutorial finishes', done);
await page.waitForTimeout(2500);
await page.screenshot({ path: 'oneshot/tutorial-complete.png' });
const badge = await page.evaluate('window.__app.profile.badges.join(",")');
check('tutorial badge persisted to the profile', badge.includes('Tutorial'), badge);
console.log('console:', logs.slice(0, 10).join('\n') || 'none');
const failed = results.filter((r) => !r.ok).length;
console.log(`tutorial e2e: ${results.length - failed}/${results.length} passed`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
