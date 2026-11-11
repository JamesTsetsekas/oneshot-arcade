// Serves the production build from a sub-path and captures real gameplay screenshots with a headless browser.
// Usage: npm run build && node scripts/screenshot.mjs [--quick]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = resolve('dist'), BASE = '/play/claude-fable-5.2-high/ashfall/', PORT = 5310;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); res.end('outside sub-path'); return; }
  let rel = decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html';
  if (rel.includes('..')) { res.writeHead(400); res.end(); return; }
  try { const buf = await readFile(join(ROOT, rel)); res.writeHead(200, { 'content-type': MIME[extname(rel)] ?? 'application/octet-stream' }); res.end(buf); }
  catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await mkdir('oneshot', { recursive: true });
const quick = process.argv.includes('--quick');
const cls = process.argv.includes('--ranger') ? 'ranger' : 'cinder';
let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--mute-audio'] }); break; } catch (e) { console.log(`channel ${channel} unavailable: ${e.message.split('\n')[0]}`); }
}
if (!browser) { console.error('No system Chromium-based browser found for screenshots.'); server.close(); process.exit(2); }
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
const shot = async (name) => { await page.screenshot({ path: `oneshot/${name}.png` }); console.log('saved oneshot/' + name + '.png'); };
const wait = (ms) => page.waitForTimeout(ms);
const ev = (fn, arg) => page.evaluate(fn, arg);
try {
  await page.goto(`http://127.0.0.1:${PORT}${BASE}`, { waitUntil: 'load' });
  await page.waitForSelector('.menu-col', { timeout: 20000 });
  await wait(600);
  await shot('01-menu');
  await page.getByText('Create Warden').click();
  await page.waitForSelector('.class-card');
  if (cls === 'ranger') await page.locator('.class-card.ranger').click();
  await page.locator('.create-row input').fill('Ashen');
  await shot('02-create');
  await page.getByText('Enter Ember Refuge').click();
  await page.waitForSelector('canvas.view', { timeout: 20000 });
  await page.waitForFunction(() => !!window.__ashfall?.session && !!window.__ashfall?.renderer && document.querySelector('.orb'), null, { timeout: 30000 });
  await wait(4000);
  await shot('03-refuge');
  const info = await ev(() => { const g = window.__ashfall; return { zone: g.session.zone.id, fps: g.debug().ui.get().fps, webgl: g.renderer.engine.webGLVersion, draws: g.renderer.scene.getActiveMeshes().length }; });
  console.log('state', JSON.stringify(info));
  // Basic input check: click-to-move through the real pointer path.
  const before = await ev(() => ({ x: window.__ashfall.session.player.x, y: window.__ashfall.session.player.y }));
  await page.mouse.click(1000, 300);
  await wait(1500);
  const after = await ev(() => ({ x: window.__ashfall.session.player.x, y: window.__ashfall.session.player.y }));
  console.log('click-to-move distance', Math.hypot(after.x - before.x, after.y - before.y).toFixed(2));
  await page.keyboard.press('KeyI'); await wait(400); await shot('04-inventory'); await page.keyboard.press('KeyI');
  await page.keyboard.press('KeyK'); await wait(400); await shot('05-skills'); await page.keyboard.press('KeyK');
  await page.keyboard.press('KeyC'); await wait(400); await shot('06-character'); await page.keyboard.press('KeyC');
  // Into the Soot March: walk the sim to the nearest pack and fight with real intents.
  await ev(() => { const g = window.__ashfall, s = g.session; s.hero.level = 6; s.hero.skillPoints = 6; s.hero.attrs.vigor += 14; for (const id of Object.keys(s.hero.ranks)) void id; g.skipTutorial(); s.refresh(); s.interact(s.zone.inter.find((i) => i.type === 'exit')); });
  await wait(2500);
  await shot('07-march-gate');
  await ev((c) => {
    const g = window.__ashfall, s = g.session, h = s.hero;
    const learn = c === 'cinder' ? ['bastion_step', 'cinder_ring', 'vow_chain'] : ['ghostline', 'snare_bloom', 'mothcloak'];
    learn.forEach((id, i) => { h.ranks[id] = 1; h.hotbar[i + 1] = id; }); s.refresh(); s.player.hp = s.stats.hpMax;
    const p = s.player;
    const all = s.zone.actors.filter((a) => a.kind === 'enemy' && !a.boss && !a.elite);
    const size = (id) => all.filter((a) => a.pack === id).length;
    const packs = all.filter((a) => size(a.pack) >= 5).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const t = packs[0] ?? all[0];
    s.enterZone('march', 'start', { x: t.x - 5, y: t.y - 5 });
  }, cls);
  await wait(1200);
  // Fight: attack nearest foe, use skills, for a few seconds, then capture mid-combat.
  const fight = (ms) => ev(async ({ ms, c }) => {
    const g = window.__ashfall, s = g.session, end = performance.now() + ms; let n = 0;
    while (performance.now() < end) {
      const p = s.player;
      const foes = s.zone.actors.filter((a) => a.team === 1 && !a.dead && a.kind === 'enemy').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const t = foes[0];
      if (t && Math.hypot(t.x - p.x, t.y - p.y) < 16) {
        n++;
        if (p.hp < s.stats.hpMax * 0.45) s.usePotion(0);
        if (n % 9 === 4) s.intent({ type: 'skill', slot: 0, x: t.x, y: t.y });
        else if (n % 9 === 7) s.intent({ type: 'skill', slot: c === 'cinder' ? 2 : 1, x: t.x, y: t.y });
        else s.intent({ type: 'attack', target: t.id, x: t.x, y: t.y });
      }
      await new Promise((r) => setTimeout(r, 130));
    }
    return { hp: Math.round(s.player.hp), kills: s.hero.stats.kills, foes: s.zone.actors.filter((a) => a.kind === 'enemy' && !a.dead && a.ai?.state !== 'dormant').length };
  }, { ms, c: cls });
  console.log('combat', JSON.stringify(await fight(1500)));
  // Wait for the pack to close in, then capture mid-cast with enemy and player telegraphs on screen.
  await ev(async (c) => {
    const s = window.__ashfall.session, end = performance.now() + 5000;
    while (performance.now() < end) {
      const p = s.player;
      const close = s.zone.actors.filter((a) => a.kind === 'enemy' && !a.dead && Math.hypot(a.x - p.x, a.y - p.y) < 4.2);
      if (close.length >= 2) { s.pc.heat = 70; s.intent({ type: 'skill', slot: c === 'cinder' ? 2 : 0, x: close[0].x, y: close[0].y }); break; }
      const t = s.zone.actors.filter((a) => a.kind === 'enemy' && !a.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (t) s.intent({ type: 'attack', target: t.id, x: t.x, y: t.y });
      await new Promise((r) => setTimeout(r, 120));
    }
  }, cls);
  await wait(520);
  await shot('screenshot');
  if (!quick) {
    console.log('combat', JSON.stringify(await fight(2200)));
    await shot('08-combat-2');
    console.log('combat', JSON.stringify(await fight(5000)));
    await ev(() => { const s = window.__ashfall.session; for (const pk of [...s.zone.pickups]) if (pk.kind === 'item') s.takeItem(pk.id); for (let i = 0; i < 5; i++) window.__ashfall.act((h, ss) => { const it = ss.lootRng && null; return it; }); });
    await shot('09-loot');
    // Boss arena.
    await ev(() => { const s = window.__ashfall.session; s.hero.attrs.vigor += 30; s.refresh(); s.player.hp = s.stats.hpMax; const b = s.zone.landmarks.boss; s.enterZone('march', 'start', { x: b.x - 4, y: b.y + 6 }); });
    await wait(600);
    console.log('boss', JSON.stringify(await fight(4200)));
    await shot('10-tollkeeper');
    // Crypt and Engine vault.
    await ev(() => { const s = window.__ashfall.session; s.hero.quest = 6; s.enterZone('archive1', 'start'); });
    await wait(2500); await shot('11-archive');
    await ev(() => { const s = window.__ashfall.session; s.hero.attrs.vigor += 80; s.refresh(); s.player.hp = s.stats.hpMax; s.enterZone('archive3', 'start', { x: 17, y: 27 }); });
    await wait(4500); await shot('12-engine');
    await page.keyboard.press('KeyM'); await wait(500); await shot('13-map'); await page.keyboard.press('KeyM');
    // Town services with a loot-filled pack.
    await ev(() => { const g = window.__ashfall, s = g.session; s.hero.flags.artificer = true; s.hero.gold += 400; s.hero.dust += 40; s.enterZone('refuge', 'start'); });
    await wait(1500);
    await ev(() => { const s = window.__ashfall.session; s.interact(s.zone.inter.find((i) => i.npc === 'vendor')); });
    await wait(700); await shot('14-vendor');
    await ev(() => { const g = window.__ashfall, s = g.session; g.closeAll(); s.interact(s.zone.inter.find((i) => i.npc === 'artificer')); });
    await wait(500);
    const cell = page.locator('.panel.right .cell-in').first();
    if (await cell.count()) { await cell.click(); await wait(300); await cell.hover(); await wait(300); }
    await shot('15-artificer');
    await ev(() => { const g = window.__ashfall, s = g.session; g.closeAll(); s.enterZone('march', 'waypoint'); });
    await wait(800);
    await ev(() => { const s = window.__ashfall.session; s.zone.safe = false; s.player.hp = 1; s.playerDeath({ id: 0, name: 'Bell Husk', team: 1 }, 'physical'); });
    await wait(1600); await shot('16-death');
    await page.getByText('Respawn at').click(); await wait(1200);
  }
  const fin = await ev(() => { const g = window.__ashfall; return { zone: g.session.zone.id, fps: g.debug().ui.get().fps, kills: g.session.hero.stats.kills, level: g.session.hero.level }; });
  console.log('final', JSON.stringify(fin));
} catch (e) { console.error('SCRIPT ERROR', e.message); await shot('error').catch(() => {}); process.exitCode = 1; }
console.log(errors.length ? 'console errors:\n' + [...new Set(errors)].slice(0, 20).join('\n') : 'no console errors');
await browser.close(); server.close();
