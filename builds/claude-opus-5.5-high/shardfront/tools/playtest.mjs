// Real-input playtest against the production build: drives mouse & keyboard like a player and
// checks the simulation's response. Runs at 100%, 125% and 150% device scale factors.
// Usage: node tools/playtest.mjs [url]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:5401/play/claude-opus-5.5-high/shardfront/';
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = {};
/** poll a page predicate (headless software GL runs at low FPS, so never rely on fixed sleeps) */
async function until(page, fn, arg, ms = 8000) {
  const t0 = Date.now();
  for (;;) { const v = await page.evaluate(fn, arg); if (v || Date.now() - t0 > ms) return !!v; await page.waitForTimeout(150); }
}
for (const dpr of (process.env.DPRS ? process.env.DPRS.split(',').map(Number) : [1, 1.25, 1.5])) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: dpr });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.click('text=Play');
  await page.click('text=Easy');
  await page.click('text=Start match');
  await page.waitForSelector('.hud', { timeout: 60000 });
  await page.waitForTimeout(800);
  const r = {};
  const screenOf = (id) => page.evaluate((id) => { const c = window.__client; const s = c.entityScreen(id); const rect = c.canvas.getBoundingClientRect(); return s ? { x: s.x + rect.left, y: s.y + rect.top } : null; }, id);
  const worldToScreen = (x, y) => page.evaluate(([x, y]) => { const c = window.__client; const map = c.runner.sim.map; const w = c.canvas.clientWidth, h = c.canvas.clientHeight; const H = c.renderer; const th = (H.sim.map, 0); void th; const p = H.project(x, window.__th(map, x, y), y, w, h); return { x: p.x, y: p.y }; }, [x, y]);
  await page.evaluate(() => { window.__th = (m, x, y) => { const V = m.size + 1; const fx = Math.min(m.size - 0.001, Math.max(0, x)), fy = Math.min(m.size - 0.001, Math.max(0, y)); const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0; const h = m.vheight; return (h[y0 * V + x0] * (1 - tx) + h[y0 * V + x0 + 1] * tx) * (1 - ty) + (h[(y0 + 1) * V + x0] * (1 - tx) + h[(y0 + 1) * V + x0 + 1] * tx) * ty; }; });
  // 1) click-select a worker
  const worker = await page.evaluate(() => { const c = window.__client; return c.runner.sim.unitsOf(0).find((u) => c.runner.sim.udef(u).worker); });
  const ws = await screenOf(worker);
  await page.mouse.click(ws.x, ws.y);
  await page.waitForTimeout(150);
  r.clickSelect = await page.evaluate((w) => window.__client.selection.has(w), worker);
  // 2) build palette: B then Q (Grid Pylon), place near base
  await page.keyboard.press('KeyB');
  await page.keyboard.press('KeyQ');
  const spot = await page.evaluate(() => { const c = window.__client; const sim = c.runner.sim; const p = sim.players[0];
    for (let r = 6; r < 12; r++) for (let a = 0; a < 16; a++) { const x = p.startX + Math.cos(a / 16 * 6.283) * r, y = p.startY + Math.sin(a / 16 * 6.283) * r; const f = sim.snapFootprint('grid_pylon', x, y); if (sim.checkPlacement(0, 'grid_pylon', f.tx, f.ty).ok) return { x, y }; } return null; });
  const ss = await worldToScreen(spot.x, spot.y);
  await page.mouse.move(ss.x, ss.y);
  await page.waitForTimeout(100);
  await page.mouse.click(ss.x, ss.y);
  await page.waitForTimeout(300);
  r.buildOrder = await page.evaluate((w) => window.__client.runner.sim.ext[w].orders.some((o) => o.t === 'build' && o.def === 'grid_pylon'), worker);
  // 3) drag-box select all workers around the HQ
  const hq = await page.evaluate(() => window.__client.runner.sim.structuresOf(0)[0]);
  const hs = await screenOf(hq);
  await page.mouse.move(hs.x - 150, hs.y - 120);
  await page.mouse.down();
  await page.mouse.move(hs.x + 150, hs.y + 140, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  r.boxSelectCount = await page.evaluate(() => window.__client.selection.size);
  // 4) right-click ground -> move order
  const before = await page.evaluate(() => window.__client.runner.sim.commandLog.length);
  const mv = await worldToScreen(spot.x + 2, spot.y + 2);
  await page.mouse.click(mv.x, mv.y, { button: 'right' });
  await page.waitForTimeout(400);
  r.rightClickMove = await until(page, (b) => window.__client.runner.sim.commandLog.slice(b).some((c) => c.kind === 'move'), before);
  // 5) control group Ctrl+1, deselect, press 1
  await page.keyboard.press('Control+Digit1');
  await page.mouse.click(5, 360); // empty-ish area? (left edge)
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.evaluate(() => { window.__client.selection = new Set(); });
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(100);
  r.controlGroup = await page.evaluate(() => window.__client.selection.size);
  // 6) minimap click moves camera
  const cam0 = await page.evaluate(() => ({ x: window.__client.cam.x, z: window.__client.cam.z }));
  const mm = await page.$('.minimapBox canvas');
  const box = await mm.boundingBox();
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.3);
  await page.waitForTimeout(200);
  const cam1 = await page.evaluate(() => ({ x: window.__client.cam.x, z: window.__client.cam.z }));
  r.minimapCamera = Math.hypot(cam1.x - cam0.x, cam1.z - cam0.z) > 20;
  // 7) minimap right-click order with selection
  await page.keyboard.press('Digit1');
  const b2 = await page.evaluate(() => window.__client.runner.sim.commandLog.length);
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6, { button: 'right' });
  await page.waitForTimeout(400);
  await page.waitForTimeout(400);
  r.minimapOrder = await until(page, (b) => window.__client.runner.sim.commandLog.slice(b).some((c) => c.kind === 'move'), b2);
  if (process.env.DEBUG) r.dbgMinimap = await page.evaluate((b) => ({ sel: window.__client.selection.size, log: window.__client.runner.sim.commandLog.slice(b).map((c) => c.kind), pend: window.__client.runner.sim.pending.length, tick: window.__client.runner.sim.tick, menu: window.__client.menuOpen, paused: window.__client.paused }), b2);
  // 8) Home key recenters
  await page.keyboard.press('Home');
  r.homeKey = await until(page, () => Math.abs(window.__client.cam.x - window.__client.runner.sim.players[0].startX - 4) < 1.5);
  const cam2 = await page.evaluate(() => ({ x: window.__client.cam.x, z: window.__client.cam.z }));
  if (process.env.DEBUG) r.dbgHome = cam2;
  // 9) select HQ, press Q to train a worker (command card hotkey)
  if (process.env.DEBUG) console.log(JSON.stringify(r));
  const hs2 = await screenOf(hq);
  await page.mouse.click(hs2.x, hs2.y);
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(300);
  r.trainHotkey = await until(page, (h) => window.__client.runner.sim.ext[h].queue.length > 0, hq);
  if (process.env.DEBUG) r.dbgTrain = await page.evaluate((h) => ({ sel: [...window.__client.selection], hq: h, card: window.__client.hud.get().card.map((c) => c.id + ':' + c.code + ':' + c.enabled), mode: window.__client.mode }), hq);
  r.errors = errors;
  results[`dpr ${dpr}`] = r;
  await page.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
