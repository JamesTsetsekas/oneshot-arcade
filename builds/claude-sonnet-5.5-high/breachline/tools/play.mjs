// Headless Chromium driver used for screenshots and smoke checks.  usage: node tools/play.mjs <baseUrl> <outDir> [scenario]
import { chromium } from "playwright";
import fs from "node:fs";
const base = process.argv[2] ?? "http://localhost:5520/";
const out = process.argv[3] ?? "oneshot";
const scenario = process.argv[4] ?? "shots";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--use-gl=angle", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on("console", (m) => { logs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
process.on("unhandledRejection", () => {});
process.on("exit", () => { console.log(logs.filter((l) => !l.includes("GPU stall")).slice(0, 30).join(String.fromCharCode(10))); });
await page.goto(base, { waitUntil: "load", timeout: 180000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/menu.png` });
if (scenario === "ui") {
  await page.click("text=Loadouts"); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/ui_loadout.png` });
  await page.click("text=Back"); await page.click("button:has-text('Profile')"); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/ui_profile.png` });
  await page.click("text=Back"); await page.click("button:has-text('Settings')"); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/ui_settings.png` });
  await page.click("button:has-text('Key bindings')"); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/ui_keys.png` });
  await page.click("text=Back"); await page.click("button:has-text('Credits')"); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/ui_credits.png` });
  await page.click("text=Back");
}
await page.click("text=Practice");
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/practice.png` });
await page.click("text=Deploy");
await page.waitForFunction(() => window.__breachline && window.__breachline.session, null, { timeout: 120000 });
await page.evaluate(() => { const s = window.__breachline.session; s.forceRun(); document.querySelectorAll(".modal").forEach((m) => m.remove()); });
const sim = (fn, arg) => page.evaluate(fn, arg);
const wait = (ms) => page.waitForTimeout(ms);
await wait(1500);
await page.screenshot({ path: `${out}/warmup.png` });
// fast-forward warmup
await sim(() => { const w = window.__breachline.session.world; w.match.phaseT = w.cfg.warmup - 0.2; });
await wait(1500);
await page.screenshot({ path: `${out}/live1.png` });
if (scenario === "shots") {
  await sim(() => window.__breachline.session.debugPlace(-20, 0, Math.PI / 2, 0));
  await wait(800);
  await page.screenshot({ path: `${out}/courtyard_east.png` });
  await sim(() => window.__breachline.session.debugPlace(-20, 0, 0, 0));
  await wait(600);
  await page.screenshot({ path: `${out}/courtyard_north.png` });
  await sim(() => window.__breachline.session.debugPlace(-33, 0, 0, 0));
  await wait(600);
  await page.screenshot({ path: `${out}/control_room.png` });
  await sim(() => window.__breachline.session.debugPlace(-30, 32, Math.PI / 2, 0));
  await wait(600);
  await page.screenshot({ path: `${out}/north_lane.png` });
  await sim(() => window.__breachline.session.debugPlace(-30, -31, Math.PI / 2, 0));
  await wait(600);
  await page.screenshot({ path: `${out}/south_lane.png` });
}
if (scenario === "combat") {
  // advance the simulation so that bots make contact, then fight
  await sim(() => { const s = window.__breachline.session; const w = s.world; w.match.phaseT = w.cfg.warmup; for (let i = 0; i < 60 * 22; i++) w.tick(); w.drainEvents(); });
  await wait(500);
  await sim(() => { const s = window.__breachline.session; const w = s.world; const me = s.me; me.spawnProtectedUntil = w.time + 60; let best = null, bd = 1e9; for (const p of w.players) { if (p.team === me.team || !p.alive) continue; const d = Math.hypot(p.pos.x - me.pos.x, p.pos.z - me.pos.z); if (d < bd) { bd = d; best = p; } } if (best) { s.debugPlace(best.pos.x - 14 * Math.sin(0.4), best.pos.z - 14 * Math.cos(0.4), 0.4, 0); const dx = best.pos.x - me.pos.x, dz = best.pos.z - me.pos.z; s.input.setView(Math.atan2(dx, dz), Math.atan2(1.3 - 1.68, Math.hypot(dx, dz))); } });
  await wait(400);
  await page.screenshot({ path: `${out}/combat_a.png` });
  await page.mouse.down({ button: "right" });
  await wait(500);
  await page.mouse.down({ button: "left" });
  await wait(260);
  await page.screenshot({ path: `${out}/combat_ads_fire.png` });
  await wait(1200);
  await page.screenshot({ path: `${out}/combat_b.png` });
  await page.mouse.up({ button: "left" }); await page.mouse.up({ button: "right" });
  await page.keyboard.down("Tab");
  await wait(300);
  await page.screenshot({ path: `${out}/scoreboard.png` });
  await page.keyboard.up("Tab");
  // death recap
  await sim(() => { const s = window.__breachline.session; const w = s.world; const me = s.me; const e = w.players.find((p) => p.team !== me.team && p.alive); me.spawnProtectedUntil = 0; w.damagePlayer(me, e.id, 500, "upper", e.weapons[0].id, me.pos, 12, false, e.pos); });
  await wait(1200);
  await page.screenshot({ path: `${out}/death_recap.png` });
}
if (scenario === "gear") {
  await sim(() => { const s = window.__breachline.session; const w = s.world; const me = s.me; w.match.phaseT = w.cfg.warmup; for (let i = 0; i < 60 * 12; i++) w.tick(); w.drainEvents(); me.spawnProtectedUntil = w.time + 120; w.addMomentum(me, 8); s.debugPlace(-18, 4, Math.PI / 2, 0.1); });
  await wait(600);
  await page.screenshot({ path: `${out}/gear_hud.png` });
  await page.keyboard.press("Digit3");
  await page.keyboard.press("Digit4");
  await wait(400);
  await page.keyboard.down("KeyG"); await wait(250); await page.keyboard.up("KeyG");
  await wait(500);
  await page.screenshot({ path: `${out}/gear_throw.png` });
  await page.keyboard.press("KeyQ");
  await wait(300);
  await sim(() => { const s = window.__breachline.session; s.me.loadout.tactical; });
  await wait(1700);
  await page.screenshot({ path: `${out}/gear_after.png` });
  await page.mouse.down({ button: "right" });
  await wait(700);
  await page.screenshot({ path: `${out}/ads.png` });
  await page.mouse.up({ button: "right" });
  await page.keyboard.press("KeyR");
  await wait(700);
  await page.screenshot({ path: `${out}/reload.png` });
}
if (scenario === "end") {
  await sim(() => { const s = window.__breachline.session; const w = s.world; const me = s.me; w.match.phaseT = w.cfg.warmup; me.spawnProtectedUntil = w.time + 9999; let g = 0; while (w.match.phase !== "ended" && g++ < 60 * 60 * 9) { w.tick(); if (g % 20 === 0) w.drainEvents(); } });
  await wait(1500);
  await page.screenshot({ path: `${out}/end_banner.png` });
  await wait(5500);
  await page.screenshot({ path: `${out}/results.png` });
  await page.click("text=Play again");
  await page.waitForFunction(() => window.__breachline && window.__breachline.session && !window.__breachline.session.matchEnded, null, { timeout: 120000 });
  await wait(1500);
  await page.screenshot({ path: `${out}/again.png` });
}
if (scenario === "soak") {
  await sim(() => { const s = window.__breachline.session; s.timeScale = 10; s.me.spawnProtectedUntil = 1e9; s.world.cfg.scoreLimit = 400; });
  for (let i = 0; i < 12; i++) { await wait(5000); await page.screenshot({ path: `${out}/soak_${i}.png` }); const st = await page.evaluate(() => { const s = window.__breachline.session; return { t: s.world.time.toFixed(0), score: s.world.match.teamScore, ph: s.world.match.phase, proj: s.world.projectiles.length, dep: s.world.deployables.length }; }); console.log(JSON.stringify(st)); }
}
const info = await page.evaluate(() => { const s = window.__breachline.session; const r = s.renderer; return { fps: r.fpsSmooth, stats: r.stats(), draw: r.scene.getActiveMeshes().length, meshes: r.scene.meshes.length, tickMs: s.world.tickMs, state: s.world.match.phase }; });
console.log(JSON.stringify(info));
console.log(logs.slice(0, 40).join("\n"));
await browser.close();
