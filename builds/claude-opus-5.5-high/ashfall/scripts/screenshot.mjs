// Serves dist/ from a sub-path, drives the production build in a headless browser, and captures real gameplay screenshots.
// Usage: node scripts/screenshot.mjs [--scenario=all] [--out=oneshot]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outDir = path.join(root, process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "oneshot");
const scenario = process.argv.find((a) => a.startsWith("--scenario="))?.slice(11) ?? "all";
const SUB = "/play/claude-opus-5.5-high/ashfall/";
const PORT = 5412;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (!url.startsWith(SUB)) { res.writeHead(404); res.end("not under sub-path"); return; }
  let f = path.join(dist, url.slice(SUB.length) || "index.html");
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404); res.end("missing"); return; }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const exe = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const size = (process.argv.find((a) => a.startsWith("--size="))?.slice(7) ?? "1280x720").split("x").map(Number);
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
fs.mkdirSync(outDir, { recursive: true });
for (const f of ["telegraph.png", "screenshot.png"]) fs.rmSync(path.join(outDir, f), { force: true });
const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name) }); console.log("saved", name); };
const sleep = (ms) => page.waitForTimeout(ms);
const evalG = (fn, arg) => page.evaluate(fn, arg);

try {
  await page.goto(`http://localhost:${PORT}${SUB}`, { waitUntil: "load" });
  await page.waitForSelector(".menu-buttons", { timeout: 30000 });
  await sleep(500);
  await shot("menu.png");
  await page.click("text=Create Warden");
  await sleep(300);
  await page.fill(".create-row input", "Ysolde");
  if (scenario.includes("ranger")) await page.click(".class-card >> nth=1");
  await shot("create.png");
  await page.click("text=Enter Ember Refuge");
  await page.waitForFunction(() => window.__ash?.controller?.game && !window.__ash.store.get().loading, null, { timeout: 60000 });
  await sleep(2500);
  // walk a little in the refuge with real input
  await page.mouse.click(size[0] * 0.59, size[1] * 0.46);
  await sleep(1500);
  await shot("refuge.png");
  const fps1 = await evalG(() => window.__ash.controller.renderer.fps());
  console.log("refuge fps", fps1);

  // Soot March: travel through the real gate interaction, then fight with real mouse input
  await evalG(() => { const c = window.__ash.controller; const g = c.game; g.ch.level = 6; g.ch.skillPoints = 3; g.ch.belt.health = 5; g.ch.belt.focus = 3; g.rankSkill(g.ch.classId === "cinder" ? "bastion_step" : "ghostline"); g.rankSkill(g.ch.classId === "cinder" ? "cinder_ring" : "snare_bloom"); g.recomputeStats(); g.requestZone("march", "start"); window.__ash.store.set({ tutorial: { steps: {}, visible: false } }); });
  await page.waitForFunction(() => window.__ash.controller.game.zone.id === "march" && !window.__ash.store.get().loading, null, { timeout: 30000 });
  await sleep(1500);
  // move next to a sizeable pack away from the entrance (staging only; combat below uses real input)
  await evalG(() => {
    const g = window.__ash.controller.game;
    const p = g.player, st = g.zone.entries.start;
    const packs = g.zone.packs.filter((pk) => pk.kind !== "boss" && pk.members.length >= 4 && Math.hypot(pk.x - st.x, pk.y - st.y) > 22);
    packs.sort((a, b) => Math.hypot(a.x - st.x, a.y - st.y) - Math.hypot(b.x - st.x, b.y - st.y));
    const t = packs[0];
    if (!t) return;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const nx = t.x + Math.cos(a) * 7, ny = t.y + Math.sin(a) * 7;
      const c = g.nav.cells[Math.floor(ny) * g.nav.w + Math.floor(nx)];
      if (c === 1 || c === 2) { p.x = p.px = nx; p.y = p.py = ny; p.facing = Math.atan2(t.y - ny, t.x - nx); break; }
    }
  });
  await sleep(600);
  // fight using the real input pipeline: hover the nearest enemy on screen and click / right-click
  for (let i = 0; i < 26; i++) {
    const pos = await evalG(() => {
      const c = window.__ash.controller, g = c.game, r = c.renderer;
      const p = g.player;
      const es = g.enemies.filter((e) => e.alive && e.def.behavior !== "dummy").sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const e = es[0];
      if (!e) return null;
      const BABYLON = r.scene.getEngine();
      const m = r.scene.getTransformMatrix();
      const v = { x: e.x, y: 1, z: e.y };
      // project manually
      const vp = r.rig.cam.viewport.toGlobal(BABYLON.getRenderWidth(), BABYLON.getRenderHeight());
      const w = m.m;
      const x = v.x * w[0] + v.y * w[4] + v.z * w[8] + w[12];
      const y = v.x * w[1] + v.y * w[5] + v.z * w[9] + w[13];
      const ww = v.x * w[3] + v.y * w[7] + v.z * w[11] + w[15];
      const sx = (x / ww + 1) / 2 * vp.width, sy = (1 - y / ww) / 2 * vp.height;
      const scale = window.innerWidth / BABYLON.getRenderWidth();
      if (p.hp < p.maxHp * 0.45) g.ch.belt.health > 0;
      return { x: sx * scale, y: sy * scale, hp: p.hp / p.maxHp, d: Math.hypot(e.x - p.x, e.y - p.y) };
    });
    if (!pos) break;
    await page.mouse.move(pos.x, pos.y);
    if (pos.hp < 0.45 && i % 4 === 0) await page.keyboard.press("Digit1");
    if (pos.hp < 0.3 && i % 5 === 1) await page.keyboard.press("Space");
    if (i % 3 === 2) { await page.mouse.down({ button: "right" }); await sleep(120); await page.mouse.up({ button: "right" }); }
    else { await page.mouse.down(); await sleep(250); await page.mouse.up(); }
    if (i === 6) await page.keyboard.press("KeyW");
    if (i === 10) await page.keyboard.press("KeyQ");
    if (i === 9) await shot("combat-1.png");
    if (i === 14) { const tele = await evalG(() => window.__ash.controller.game.telegraphs.length); if (tele > 0) { await shot("telegraph.png"); await shot("screenshot.png"); } }
    await sleep(200);
  }
  // the hero screenshot is the mid-fight telegraph moment when one was captured; otherwise the end of the fight
  if (!fs.existsSync(path.join(outDir, "telegraph.png"))) await shot("screenshot.png");
  await shot("combat-2.png");
  const fps2 = await evalG(() => window.__ash.controller.renderer.fps());
  console.log("march fps", fps2);
  const state = await evalG(() => { const g = window.__ash.controller.game; return { kills: g.ch.stats.kills, hp: g.player.hp, lvl: g.ch.level, alive: g.player.alive }; });
  console.log("state", JSON.stringify(state));

  if (scenario === "all") {
    // inventory panel with loot
    await evalG(() => {
      const g = window.__ash.controller.game;
      for (const pk of g.pickups.filter((p) => p.kind === "item").slice(0, 8)) g.pickUp(pk.id);
      // add a few extra rolled drops (same generator as world loot) so the inventory view shows a realistic mid-run bag
      for (let i = 0; i < 6; i++) { const e = g.enemies.find((x) => !x.isBoss) ?? { x: g.player.x, y: g.player.y, level: 5, isElite: true, guardian: i === 0 }; g.dropLoot({ ...e, x: g.player.x, y: g.player.y, level: 6, isElite: true, guardian: i === 0 }); }
      for (const pk of g.pickups.filter((p) => p.kind === "item")) g.pickUp(pk.id);
      window.__ash.controller.openPanel("inventory");
    });
    await sleep(500);
    const cell = await page.$(".grid .icell");
    if (cell) { const b = await cell.boundingBox(); await page.mouse.move(b.x + 10, b.y + 10); await sleep(300); }
    await shot("inventory.png");
    await evalG(() => window.__ash.controller.openPanel("skills"));
    await sleep(300);
    await shot("skills.png");
    await evalG(() => window.__ash.controller.closePanel());
    // Archive floor 1
    await evalG(() => { const g = window.__ash.controller.game; g.ch.flags.boss_tollkeeper = true; g.requestZone("archive1", "start"); });
    await page.waitForFunction(() => window.__ash.controller.game.zone.id === "archive1" && !window.__ash.store.get().loading, null, { timeout: 30000 });
    await sleep(2500);
    await shot("archive.png");
    // Toll-Keeper fight framing
    await evalG(() => { const g = window.__ash.controller.game; g.ch.level = 7; g.recomputeStats(); g.ch.zoneStates = {}; g.requestZone("march", "start"); });
    await page.waitForFunction(() => window.__ash.controller.game.zone.id === "march" && !window.__ash.store.get().loading, null, { timeout: 30000 });
    await evalG(() => { const g = window.__ash.controller.game; const a = g.zone.meta.arena; g.player.x = g.player.px = a.x - 5; g.player.y = g.player.py = a.y; });
    await sleep(2600);
    await shot("boss-tollkeeper.png");
    // Engine arena
    await evalG(() => { const g = window.__ash.controller.game; g.ch.level = 12; g.recomputeStats(); g.requestZone("archive3", "threshold"); });
    await page.waitForFunction(() => window.__ash.controller.game.zone.id === "archive3" && !window.__ash.store.get().loading, null, { timeout: 30000 });
    await evalG(() => { const g = window.__ash.controller.game; const a = g.zone.meta.arena; g.player.x = g.player.px = a.x; g.player.y = g.player.py = a.y + 8; });
    await sleep(3500);
    await shot("boss-engine.png");
  }
} catch (e) {
  console.error("SCRIPT ERROR", e);
  await shot("error.png").catch(() => {});
} finally {
  console.log("console errors:", errors.length ? errors.slice(0, 15).join("\n") : "none");
  await browser.close();
  server.close();
}
