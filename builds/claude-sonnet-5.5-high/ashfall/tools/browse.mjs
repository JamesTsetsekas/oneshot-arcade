// Headless browser harness: node tools/browse.mjs <scenario> ; screenshots land in oneshot/ (or .tmp/ for scratch scenarios).
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';

const PORT = 5513;
const PREFIX = '/play/claude-sonnet-5.5-high/ashfall/';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => {
  try {
    return require_fs_exists(p);
  } catch {
    return false;
  }
});
import { existsSync } from 'node:fs';
function require_fs_exists(p) {
  return existsSync(p);
}

const scenario = process.argv[2] ?? 'basic';
mkdirSync('.tmp', { recursive: true });
mkdirSync('oneshot', { recursive: true });
const server = await startServer(PORT, PREFIX);
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
const url = `http://127.0.0.1:${PORT}${PREFIX}`;
const shot = async (name, dir = '.tmp') => {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log('screenshot', `${dir}/${name}.png`);
};
const ev = (fn, arg) => page.evaluate(fn, arg);
const wait = (ms) => page.waitForTimeout(ms);

try {
  if (scenario === 'march') {
    await page.goto(url + '?autostart=ranger');
    await wait(2500);
    await ev(() => {
      const g = window.__ashfall.game;
      g.gainXp(900);
      for (const id of ['ghostline', 'snare_bloom', 'splinter_volley']) g.learnSkill(id);
      g.enterZone('march');
      const pack = g.zone.spawns.find((s) => s.tag === 'pack');
      const free = (x, z) => g.zone.grid.cells[Math.floor(z) * g.zone.w + Math.floor(x)] === 0;
      let best = null;
      for (let r = 5; r < 12 && !best; r++) for (let a = 0; a < 24 && !best; a++) { const x = pack.x + Math.cos(a / 24 * 6.28) * r, z = pack.z + Math.sin(a / 24 * 6.28) * r; if (free(x, z) && free(x + 1, z) && free(x - 1, z) && free(x, z + 1) && free(x, z - 1)) best = { x, z }; }
      g.player.x = best.x; g.player.z = best.z;
      g.player.px = g.player.x; g.player.pz = g.player.z;
    });
    await wait(1500);
    await shot('march_a');
    // fight using bot via setInterval inside the page
    await ev(() => {
      const g = window.__ashfall.game;
      window.__bot = setInterval(() => {
        const p = g.player;
        const foes = g.enemies.filter((e) => e.alive && !e.neutral && e.aggro);
        let best = null, bd = 1e9;
        for (const e of foes) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd) { bd = d; best = e; } }
        if (p.hp < p.maxHp * 0.4) g.cmdPotion('health');
        if (!best) return;
        if (bd < 8 && g.player.focus > 16) g.cmdSkill('rmb', best.x, best.z, best.id); else g.cmdAttack(best.id);
      }, 130);
    });
    await wait(4500);
    await shot('march_b');
    await wait(5000);
    await shot('march_c');
    const info = await ev(() => { const g = window.__ashfall.game; return { dead: g.player.dead, hp: g.player.hp, alive: g.enemies.filter(e=>e.alive && !e.neutral).length, lvl: g.ch.level }; });
    console.log(JSON.stringify(info));
    console.log(JSON.stringify(await ev(() => { const v = window.__ashfall.view; const p = window.__ashfall.game.player; return { cam: v.camera.position.toArray(), tgt: v.camTarget.toArray(), shake: v.shakeAmt, zoom: v.zoom, pl: [p.x, p.z, p.vx, p.vz, p.focus, p.heat] }; })));
  }
  if (scenario === 'boss') {
    await page.goto(url + '?autostart=cinder');
    await wait(2500);
    await ev(() => {
      const g = window.__ashfall.game;
      g.gainXp(5000);
      for (const id of ['cinder_ring', 'bastion_step']) g.learnSkill(id);
      g.enterZone('march');
      const b = g.enemies.find((e) => e.type === 'toll_keeper');
      g.player.x = b.x + 5; g.player.z = b.z + 3; g.player.px = g.player.x; g.player.pz = g.player.z;
      window.__keep = setInterval(() => { g.player.hp = g.player.maxHp; }, 100);
    });
    await wait(5000);
    console.log(JSON.stringify(await ev(() => { const v = window.__ashfall.view; const g = window.__ashfall.game; return { cam: v.camera.position.toArray(), tgt: v.camTarget.toArray(), zoom: v.zoom, zt: v.zoomTarget, shake: v.shakeAmt, flash: [v.flash.intensity, v.flash.position.toArray()], pl: [g.player.x, g.player.z], boss: g.boss && [g.boss.x, g.boss.z, g.boss.boss_state.engaged], arena: g.zone.bossArena, res: v.resScale, lights: v.lights.map(l => [l.intensity, l.position.toArray()]).slice(0,3) }; })));
    await shot('boss_a');
    await wait(2500);
    await shot('boss_b');
    await ev(() => {
      const g = window.__ashfall.game;
      g.enterZone('archive3');
      const b = g.enemies.find((e) => e.type === 'orison_engine');
      g.player.x = g.zone.bossArena.x + 6; g.player.z = g.zone.bossArena.z + 7; g.player.px = g.player.x; g.player.pz = g.player.z;
    });
    await wait(6000);
    await shot('engine_a');
    await wait(3000);
    await shot('engine_b');
  }
  if (scenario === 'input') {
    await page.goto(url + '?autostart=cinder');
    await wait(3000);
    const st = () => ev(() => { const g = window.__ashfall.game; return { x: +g.player.x.toFixed(2), z: +g.player.z.toFixed(2), tut: g.ch.tutorial, hp: Math.round(g.player.hp), evade: g.player.evadeCharges, dummy: Math.round(g.dummyDamage), panels: [...document.querySelectorAll('.pcol.on')].length }; });
    console.log('start', JSON.stringify(await st()));
    await page.mouse.click(760, 420);
    await wait(2500);
    console.log('after move click', JSON.stringify(await st()));
    // find the dummy on screen
    const pos = await ev(() => { const a = window.__ashfall; const g = a.game; const d = g.enemies.find((e) => e.type === 'dummy'); const p = a.view.project(d.x, 1.0, d.z); return { x: p.x, y: p.y, dx: d.x, dz: d.z }; });
    console.log('dummy screen', JSON.stringify(pos));
    await page.mouse.click(pos.x, pos.y);
    await wait(4000);
    console.log('after attack click', JSON.stringify(await st()));
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.click(pos.x, pos.y, { button: 'right' });
    await wait(800);
    await page.keyboard.press('Space');
    await wait(500);
    await page.keyboard.press('Digit1');
    await page.keyboard.press('KeyI');
    await wait(500);
    await page.keyboard.press('Escape');
    await wait(300);
    console.log('after keys', JSON.stringify(await st()));
    await shot('input');
  }
  if (scenario === 'archive') {
    await page.goto(url + '?autostart=ranger');
    await wait(2500);
    await ev(() => {
      const g = window.__ashfall.game;
      g.gainXp(5000);
      for (const id of ['ghostline', 'snare_bloom', 'mothcloak']) g.learnSkill(id);
      g.ch.flags.artificerRescued = true;
      g.enterZone('archive1');
      const lm = g.zone.anchors.landmark;
      g.player.x = lm.x + 3; g.player.z = lm.z + 4; g.player.px = g.player.x; g.player.pz = g.player.z;
    });
    await wait(4500);
    await shot('archive');
    await ev(() => { const g = window.__ashfall.game; g.enterZone('refuge'); const v = g.zone.interactables.find((i) => i.kind === 'vendor'); g.player.x = v.x; g.player.z = v.z + 2; g.player.px = g.player.x; g.player.pz = g.player.z; g.cmdInteract(v.id); });
    await wait(3500);
    await shot('vendor');
    await ev(() => { const g = window.__ashfall.game; const v = g.zone.interactables.find((i) => i.kind === 'artificer'); g.player.x = v.x; g.player.z = v.z + 2; g.cmdInteract(v.id); for (let i = 0; i < 3; i++) g.ch.inv.add(g.genItem(14, { rarity: 'inscribed', identified: false })); });
    await wait(3000);
    await page.keyboard.press('KeyI');
    await wait(500);
    await shot('artificer');
  }
  if (scenario === 'smoke') {
    await page.goto(url + '?autostart=cinder');
    await wait(3000);
    const res = await ev(async () => {
      const a = window.__ashfall;
      const g = a.game;
      const out = [];
      g.gainXp(8000);
      g.ch.flags.artificerRescued = true;
      g.ch.actComplete = true; g.ch.veteranUnlocked = true;
      for (let i = 0; i < 6; i++) g.ch.inv.add(g.genItem(14, {}));
      g.ch.inv.add(g.genItem(16, { rarity: 'relic', identified: true }));
      g.ch.waypoints.push('ashway');
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const id of ['inventory', 'character', 'skills', 'quests', 'vendor', 'stash', 'artificer', 'waypoint', 'portal', 'summary', 'map', 'pause', 'settings', 'dialog']) {
        try { a.panels.openPanel(id); await sleep(250); out.push(id + ':ok'); } catch (e) { out.push(id + ':ERR ' + e.message); }
      }
      a.panels.closeAll();
      // hunts + death + expedition
      try { g.enterZone('refuge'); g.startHunt('toll_keeper'); await sleep(500); out.push('hunt:' + g.zone.id); g.enterZone('refuge'); } catch (e) { out.push('hunt ERR ' + e.message); }
      try { g.hurtPlayer({ phys: 1e6 }, { name: 'Smoke Test' }); await sleep(600); out.push('dead:' + g.player.dead + ' overlay:' + !document.querySelector('#death').classList.contains('hidden')); a.respawn(); await sleep(400); out.push('alive:' + !g.player.dead); } catch (e) { out.push('death ERR ' + e.message); }
      try { g.newExpedition('veteran'); await sleep(800); g.enterZone('march'); await sleep(800); out.push('vet:' + g.ch.difficulty + ' lvl' + g.zone.level); } catch (e) { out.push('exped ERR ' + e.message); }
      try { await a.saveNow(); out.push('saved'); } catch (e) { out.push('save ERR ' + e.message); }
      return out;
    });
    console.log(res.join(' | '));
    await shot('smoke');
  }
  if (scenario === 'continue') {
    await page.goto(url + '?autostart=ranger');
    await wait(2500);
    await ev(async () => { const a = window.__ashfall; a.game.gainXp(300); a.game.ch.gold = 777; await a.saveNow(); });
    await page.goto(url);
    await wait(2500);
    const txt = await ev(() => document.querySelector('.menu-btns')?.textContent);
    console.log('menu:', txt);
    await page.click('[data-m=continue]');
    await wait(3000);
    console.log(JSON.stringify(await ev(() => { const g = window.__ashfall.game; return { cls: g.ch.cls, lvl: g.ch.level, gold: g.ch.gold, zone: g.zone.id }; })));
    // corrupt the primary save and verify recovery from backup on next load
    await ev(async () => {
      const a = window.__ashfall; a.game.ch.gold = 888; await a.saveNow();
      const id = a.game.ch.id;
      const req = indexedDB.open('ashfall-covenant');
      await new Promise((res) => { req.onsuccess = () => { const db = req.result; const tx = db.transaction('kv', 'readwrite'); const st = tx.objectStore('kv'); const g = st.get('char:' + id + ':main'); g.onsuccess = () => { st.put(g.result.replace('"checksum":"', '"checksum":"0'), 'char:' + id + ':main'); }; tx.oncomplete = () => res(); }; });
    });
    await page.goto(url);
    await wait(2500);
    console.log('menu2:', await ev(() => document.querySelector('.menu-btns')?.textContent));
    await page.click('[data-m=continue]');
    await wait(3000);
    console.log(JSON.stringify(await ev(() => { const g = window.__ashfall.game; return { gold: g.ch.gold, toast: [...document.querySelectorAll('.toast')].map((t) => t.textContent) }; })));
  }
  if (scenario === 'menusettings') {
    await page.goto(url);
    await wait(3000);
    await page.click('[data-m=settings]');
    await wait(800);
    await shot('menu_settings');
    await page.selectOption('#s-quality', 'low');
    await page.click('[data-act=rebind][data-a=skillQ]');
    await page.keyboard.press('KeyZ');
    await wait(300);
    console.log('keyQ:', await ev(() => window.__ashfall.settings.keys.skillQ), 'shadows:', await ev(() => window.__ashfall.settings.shadows));
    await page.click('[data-act=settingsdone]');
    await wait(800);
    console.log('back at title:', await ev(() => !!document.querySelector('.menu-btns')));
  }
  if (scenario === 'create') {
    await page.goto(url);
    await wait(3500);
    await shot('title2');
    await page.click('[data-m=create]');
    await wait(3000);
    await shot('create');
  }
  if (scenario === 'ui') {
    await page.goto(url + '?autostart=cinder');
    await wait(3000);
    await ev(() => {
      const g = window.__ashfall.game;
      g.gainXp(900);
      for (let i = 0; i < 14; i++) g.ch.inv.add(g.genItem(12, {}));
      g.ch.inv.add(g.genItem(14, { rarity: 'inscribed', identified: true }));
      g.ch.inv.add(g.genItem(16, { rarity: 'relic', identified: true }));
      g.ch.inv.add(g.genItem(16, { rarity: 'inscribed', identified: false }));
      g.recompute();
    });
    await page.keyboard.press('KeyI');
    await wait(400);
    await page.keyboard.press('KeyK');
    await wait(700);
    await shot('ui_skills');
    await page.keyboard.press('KeyC');
    await wait(500);
    await shot('ui_char');
    await page.keyboard.press('KeyJ');
    await wait(400);
    await ev(() => { document.querySelector('.invgrid .it:nth-child(15)')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await wait(400);
    await page.mouse.move(1000, 330);
    await ev(() => { document.querySelector('.invgrid .it:nth-child(15)')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 900, clientY: 300 })); });
    await wait(400);
    await shot('ui_inv');
  }
  if (scenario === 'basic') {
    await page.goto(url);
    await wait(2500);
    await shot('title');
    await page.goto(url + '?autostart=cinder');
    await wait(3500);
    await shot('refuge');
    const info = await ev(() => {
      const a = window.__ashfall;
      return { zone: a.game.zone.id, hp: a.game.player.hp, enemies: a.game.enemies.length };
    });
    console.log(JSON.stringify(info));
  }
} catch (e) {
  console.log('SCENARIO ERROR', e);
}
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
server.close();
