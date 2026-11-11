// Captures the deliverable screenshots from the PRODUCTION build served under a sub-path.
// Usage: npm run build && node tools/capture.mjs   (needs Chrome or Edge installed; playwright-core drives it)
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';

const PORT = 5514;
const PREFIX = '/play/claude-sonnet-5.5-high/ashfall/';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => existsSync(p));
mkdirSync('oneshot', { recursive: true });
const server = await startServer(PORT, PREFIX);
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const url = `http://127.0.0.1:${PORT}${PREFIX}`;
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  await page.screenshot({ path: `oneshot/${name}.png` });
  console.log('saved', `oneshot/${name}.png`);
};
const ev = (fn, arg) => page.evaluate(fn, arg);

try {
  // 1. real menu flow: title -> create -> begin
  await page.goto(url);
  await wait(4000);
  await shot('01-title');
  await page.click('[data-m=create]');
  await wait(3500);
  await shot('02-create');
  await page.click('[data-m=begin]');
  await wait(4500);
  await shot('03-refuge');

  // 2. progress the character a little, then a live fight in the Soot March (screenshot.png)
  await ev(() => {
    const g = window.__ashfall.game;
    g.gainXp(560);
    for (const id of ['bastion_step', 'cinder_ring', 'brand_arc', 'brand_arc']) g.learnSkill(id);
    g.assign('q', 'cinder_ring');
    g.assign('w', 'bastion_step');
    for (let i = 0; i < 3; i++) g.ch.inv.add(g.genItem(6, {}));
    g.ch.inv.add(g.genItem(8, { rarity: 'inscribed', identified: true }));
    g.enterZone('march');
    const packs = g.zone.spawns.filter((s) => s.tag === 'pack' && s.members.length >= 5).sort((a, b) => a.level - b.level);
    const pack = packs[0];
    const free = (x, z) => g.zone.grid.cells[Math.floor(z) * g.zone.w + Math.floor(x)] === 0;
    let best = null;
    for (let r = 6; r < 14 && !best; r++) for (let a = 0; a < 32 && !best; a++) {
      const x = pack.x + Math.cos((a / 32) * 6.28) * r;
      const z = pack.z + Math.sin((a / 32) * 6.28) * r;
      if (free(x, z) && free(x + 1, z) && free(x - 1, z) && free(x, z + 1) && free(x, z - 1)) best = { x, z };
    }
    g.player.x = g.player.px = best.x;
    g.player.z = g.player.pz = best.z;
    window.__startBot = () => (window.__bot = setInterval(() => {
      const p = g.player;
      if (p.hp < p.maxHp * 0.35) g.cmdPotion('health');
      const foes = g.enemies.filter((e) => e.alive && !e.neutral && e.aggro);
      let tgt = null;
      let bd = 1e9;
      for (const e of foes) {
        const d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d < bd) {
          bd = d;
          tgt = e;
        }
      }
      if (!tgt) return;
      if (bd < 4.2 && p.focus > 22 && foes.filter((e) => Math.hypot(e.x - p.x, e.z - p.z) < 4.2).length >= 2) g.cmdSkill('q', tgt.x, tgt.z, tgt.id);
      else if (bd < 3.4 && p.focus > 18) g.cmdSkill('rmb', tgt.x, tgt.z, tgt.id);
      else g.cmdAttack(tgt.id);
    }, 140));
  });
  await wait(5000); // let the zone banner fade
  await ev(() => window.__startBot());
  // wait for a moment with live telegraphs + several enemies near
  let ok = false;
  for (let i = 0; i < 80 && !ok; i++) {
    await wait(250);
    ok = await ev(() => {
      const g = window.__ashfall.game;
      const near = g.enemies.filter((e) => e.alive && !e.neutral && Math.hypot(e.x - g.player.x, e.z - g.player.z) < 7).length;
      return near >= 3 && g.player.hitFlash === 0 && g.hazards.some((h) => h.telegraph && h.owner === 'enemy' && Math.hypot(h.x - g.player.x, h.z - g.player.z) < 8);
    });
  }
  await shot('screenshot');
  await wait(2500);
  await shot('04-combat-b');
  await ev(() => clearInterval(window.__bot));

  // 3. inventory + skills panels
  await ev(() => {
    const g = window.__ashfall.game;
    g.player.hp = g.player.maxHp;
    g.enterZone('refuge', { x: 22, z: 22 });
    for (let i = 0; i < 6; i++) g.ch.inv.add(g.genItem(9, {}));
    g.ch.inv.add(g.genItem(12, { rarity: 'relic', identified: true }));
  });
  await wait(2500);
  await page.keyboard.press('KeyI');
  await page.keyboard.press('KeyK');
  await wait(800);
  await shot('05-inventory-skills');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  // 4. boss arenas
  await ev(() => {
    const g = window.__ashfall.game;
    g.gainXp(4000);
    g.enterZone('march');
    const b = g.enemies.find((e) => e.type === 'toll_keeper');
    const a = g.zone.bossArena;
    g.player.x = g.player.px = a.x + 5;
    g.player.z = g.player.pz = a.z + 4;
    window.__god = setInterval(() => (g.player.hp = g.player.maxHp), 100);
    void b;
  });
  await wait(7000);
  await shot('06-boss-toll-keeper');
  await ev(() => {
    const g = window.__ashfall.game;
    g.enterZone('archive3');
    const a = g.zone.bossArena;
    g.player.x = g.player.px = a.x + 7;
    g.player.z = g.player.pz = a.z + 8;
  });
  await wait(9000);
  await shot('07-boss-orison-engine');
  await ev(() => {
    const g = window.__ashfall.game;
    g.enterZone('archive1');
    const lm = g.zone.anchors.landmark;
    g.player.x = g.player.px = lm.x + 3;
    g.player.z = g.player.pz = lm.z + 5;
  });
  await wait(5000);
  await shot('08-archive');
  console.log('page errors:', errors.length ? errors.slice(0, 5).join(' || ') : 'none');
} catch (e) {
  console.log('CAPTURE ERROR', e);
}
await browser.close();
server.close();
