// End-to-end UI flow against the production build: select, mine, build, train, control group, attack-move.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const prefix = '/play/claude-sonnet-5.5-high/shardfront/';
const server = await serve(path.resolve('dist'), prefix, 5503);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:5503${prefix}`);
await page.waitForSelector('.menu');
await page.click('[data-a=play]');
await page.waitForSelector('[data-a=start]');
await page.click('[data-a=start]');
await page.waitForSelector('#hud', { timeout: 60000 });
await page.waitForTimeout(1500);
fs.mkdirSync('oneshot', { recursive: true });
const ev = (s) => page.evaluate(`(()=>{ const app=window.__app; const game=app.game; const sim=game.sim; ${s} })()`);
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' - ' + extra : '')); };

const spot = (defId, ax, ay, minR) => ev(`const di=${JSON.stringify(defId)}; let best=null; const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); const idx=sim.def(h).id? 0:0; const defs=window.__defs; for(let r=${minR};r<16;r+=1){ for(let k=0;k<32;k++){ const a=k/32*6.283; const x=sim.x[h]+Math.cos(a)*r, y=sim.y[h]+Math.sin(a)*r; const res=sim.canPlace(0, window.__defIndex[di], x, y); if(res.ok){ best=[x,y]; break; } } if(best) break; } const t={x:0,y:0,z:0}; game.renderer.cam.project(best[0],sim.groundHeight(best[0],best[1])+0.1,best[1],innerWidth,innerHeight,t); return [t.x,t.y,best[0],best[1]];`);
const until = async (cond, ms = 90000) => { await ev('game.speed = 8;'); const t0 = Date.now(); let ok = false; while (Date.now() - t0 < ms) { ok = await ev('return !!(' + cond + ')'); if (ok) break; await page.waitForTimeout(400); } await ev('game.speed = 1;'); return ok; };

// 1. box select workers (game paused while the box is measured and dragged so positions are stable)
await ev('game.paused = true;');
const wpos = await ev(`const out=[]; const t={x:0,y:0,z:0}; for(const id of sim.ids){ if(sim.alive[id]&&sim.owner[id]===0&&sim.td(id).isWorker){ game.renderer.cam.project(sim.x[id],sim.groundHeight(sim.x[id],sim.y[id])+0.6,sim.y[id],innerWidth,innerHeight,t); out.push([t.x,t.y]); } } return out;`);
const xs = wpos.map((p) => p[0]), ys = wpos.map((p) => p[1]);
const bx0 = Math.min(...xs) - 30, by0 = Math.min(...ys) - 30, bx1 = Math.max(...xs) + 30, by1 = Math.max(...ys) + 30;
await page.mouse.move(bx0, by0); await page.mouse.down(); await page.mouse.move((bx0 + bx1) / 2, (by0 + by1) / 2, { steps: 4 }); await page.mouse.move(bx1, by1, { steps: 4 }); await page.mouse.up();
await page.waitForTimeout(200);
await ev('game.paused = false;');
const selN = await ev('return game.input.selection.length');
check('box-select selects workers', selN >= 5, `selected ${selN}`);
await page.screenshot({ path: 'oneshot/e2e-select.png' });

// 2. build palette + place a pylon
await page.keyboard.press('b');
await page.waitForTimeout(150);
check('B opens build palette', (await ev('return game.input.cardMode')) === 'build');
await page.keyboard.press('w'); // second structure = supply
await page.waitForTimeout(150);
check('palette key enters placement mode', (await ev('return game.input.mode.kind')) === 'build');
const hallPos = await spot('grid_pylon', 0, 0, 8);
await page.mouse.move(hallPos[0], hallPos[1]);
await page.waitForTimeout(250);
await page.screenshot({ path: 'oneshot/e2e-place.png' });
await page.mouse.click(hallPos[0], hallPos[1]);
await page.waitForTimeout(300);
const orders = await ev(`let n=0; for(const id of sim.ids){ const e=sim.ext[id]; if(sim.alive[id]&&sim.owner[id]===0&&e.orders[0]&&e.orders[0].k===7) n++; } return n;`);
check('placing a pylon issues a build order', orders === 1, `build orders ${orders}`);
await until("sim.countOf(0,'grid_pylon',false)>=1");
const pyl = await ev(`return sim.countOf(0,'grid_pylon',false)`);
check('pylon construction started', pyl === 1, `pylons ${pyl}`);
await until("sim.countOf(0,'grid_pylon',true)>=1");
const done = await ev(`return [sim.countOf(0,'grid_pylon',true), sim.players[0].supplyCap]`);
check('pylon completes (supply cap raised)', done[0] === 1, `done ${done[0]}, cap ${done[1]}`);

// 3. train a worker from the hall via hotkey
await ev(`const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); game.input.select([h]);`);
await page.waitForTimeout(200);
await page.keyboard.press('q');
await page.waitForTimeout(200);
const q = await ev(`const h=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isHall); return sim.ext[h].q.length`);
check('hotkey Q trains a Fabricator', q === 1, `queue ${q}`);
await page.screenshot({ path: 'oneshot/e2e-train.png' });

// 4. build an assembly bay (palette key e = third structure)
await ev(`const w=sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.td(i).isWorker); game.input.select(w.slice(0,2));`);
await page.keyboard.press('b'); await page.keyboard.press('e');
const bayPos = await spot('assembly_bay', 0, 0, 9);
await page.mouse.move(bayPos[0], bayPos[1]); await page.waitForTimeout(150);
await page.mouse.click(bayPos[0], bayPos[1]);
await until("sim.countOf(0,'assembly_bay',true)>=1");
const bay = await ev(`return [sim.countOf(0,'assembly_bay',false), sim.countOf(0,'assembly_bay',true), Math.floor(sim.players[0].ore)]`);
check('assembly bay built', bay[1] === 1, `bays ${bay[0]}/${bay[1]} ore ${bay[2]}`);

// 5. train bulwarks and control group
await ev(`const b=sim.ids.find(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='assembly_bay'); game.input.select([b]);`);
await page.waitForTimeout(150);
await page.keyboard.press('w'); await page.keyboard.press('w');
await until("sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='bulwark').length>=2");
const bul = await ev(`return sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='bulwark').length`);
check('trained Bulwarks from Assembly Bay', bul >= 1, `bulwarks ${bul}`);
await ev(`const u=sim.ids.filter(i=>sim.alive[i]&&sim.owner[i]===0&&sim.def(i).id==='bulwark'); game.input.select(u);`);
await page.keyboard.press('Control+1');
await page.waitForTimeout(100);
const grp = await ev('return game.input.groups[1].length');
check('Ctrl+1 assigns a control group', grp >= 1, `group size ${grp}`);
await ev('game.input.select([])');
await page.keyboard.press('1');
await page.waitForTimeout(100);
check('pressing 1 re-selects the group', (await ev('return game.input.selection.length')) === grp);
await page.keyboard.press('a');
check('A enters attack-move mode', (await ev('return game.input.mode.kind')) === 'attackMove');
await page.mouse.click(700, 400);
await page.waitForTimeout(200);
const am = await ev(`const u=game.input.selection[0]; return sim.ext[u].orders[0]?.k`);
check('attack-move order issued', am === 1, `order kind ${am}`);
await page.screenshot({ path: 'oneshot/e2e-army.png' });
await page.mouse.click(760, 360, { button: 'right' });
await page.waitForTimeout(150);
check('right-click issues move', (await ev(`const u=game.input.selection[0]; return sim.ext[u].orders[0]?.k`)) === 0);
await page.keyboard.press('s');
check('S stops', (await ev(`const u=game.input.selection[0]; return sim.ext[u].orders.length`)) === 0);
console.log('\nconsole:', logs.slice(0, 15).join('\n') || 'none');
const failed = results.filter((r) => !r.ok).length;
console.log(`e2e: ${results.length - failed}/${results.length} passed`);
fs.writeFileSync('oneshot/e2e-results.json', JSON.stringify({ results, logs }, null, 2));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
