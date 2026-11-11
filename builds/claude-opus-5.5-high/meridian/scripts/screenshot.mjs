// Headless capture from the production build served under a sub-path.
// Usage: node scripts/screenshot.mjs [scenario]
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";
import { mkdirSync } from "node:fs";
const root = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const out = new URL("../oneshot/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(out, { recursive: true });
const srv = await serve(root);
const channel = process.env.PW_CHANNEL || "msedge";
const browser = await chromium.launch({ channel, headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const url = "http://localhost:5461/play/claude-opus-5.5-high/meridian/";
await page.goto(url);
const wait = (ms) => page.waitForTimeout(ms);
await page.waitForFunction(() => window.__meridian && window.__meridian.shell.screen === "menu", null, { timeout: 90000 });
await wait(2500);
await page.screenshot({ path: out + "menu.png" });
const scenario = process.argv[2] || "all";
const ev = (fn, arg) => page.evaluate(fn, arg);
// New game
await ev(() => window.__meridian.shell.newGame());
await page.waitForFunction(() => window.__meridian.shell.screen === "game", null, { timeout: 90000 });
await wait(1500);
const stats = await ev(() => { const g = window.__meridian.game; return { veh: g.vehicles.length, chars: g.chars.length, obj: g.ui.objective, fps: window.__meridian.renderer.engine.getFps() }; });
console.log("after new game", JSON.stringify(stats));
await page.screenshot({ path: out + "start.png" });
// Gameplay: real keyboard driving in a Brava along the Tide Market arterial, late afternoon
await ev(() => {
  const g = window.__meridian.game;
  g.clock.hour = 17.7;
  const { x, z } = { x: -150, z: -101.75 };
  const V = g.vehicles[0].constructor;
  const v = new V("brava", x, z, Math.PI / 2, 3);
  v.role = "parked"; v.y = g.heightAt(x, z); v.savePrev(); g.addVehicle(v);
  g.placePlayer(x, z + 2, Math.PI / 2);
  g.enterVehicle(v);
  g.cam.vehMode = "near";
  g.populate();
});
await page.mouse.click(640, 360);
await page.keyboard.down("KeyW"); await wait(2600); await page.keyboard.up("KeyW");
await page.keyboard.down("KeyW"); await wait(900); await page.keyboard.up("KeyW");
await wait(300);
const drive = await ev(() => { const g = window.__meridian.game; const v = g.player.vehicle; return { speed: v ? v.speed : -1, x: v?.x, z: v?.z, near: g.vehicles.filter((q) => Math.hypot(q.x - v.x, q.z - v.z) < 80).length, peds: g.chars.filter((c) => Math.hypot(c.x - v.x, c.z - v.z) < 60).length }; });
console.log("drive", JSON.stringify(drive));
await page.screenshot({ path: out + "screenshot.png" });
// On-foot plaza shot
await ev(() => { const g = window.__meridian.game; g.exitVehicle(false); g.placePlayer(-60, -150, Math.PI); g.cam.yaw = Math.PI; g.cam.pitch = -0.1; g.clock.hour = 16.2; });
await wait(2500);
await page.screenshot({ path: out + "tide-market.png" });
// UI panels: map, phone, shop
await ev(() => window.__meridian.shell.setOverlay("map")); await wait(600);
await page.screenshot({ path: out + "map.png" });
await ev(() => window.__meridian.shell.setOverlay("phone")); await wait(600);
await page.screenshot({ path: out + "phone.png" });
await ev(() => { const s = window.__meridian.shell; s.resume(); const g = window.__meridian.game; g.ui.panel = "shop"; g.paused = true; }); await wait(600);
await page.screenshot({ path: out + "shop.png" });
await ev(() => { const s = window.__meridian.shell; window.__meridian.game.closePanel(); s.resume(); });
// Night + rain on Glassline
await ev(() => { const g = window.__meridian.game; g.placePlayer(205, -70, 0); g.cam.yaw = 0.6; g.cam.pitch = 0.05; g.clock.hour = 21.4; g.weather.target = g.weather.rain = 1; g.weather.wet = 1; });
await wait(2500);
await page.screenshot({ path: out + "night-rain.png" });
// Police pursuit (Tier 3) while driving
await ev(() => {
  const g = window.__meridian.game;
  g.weather.target = g.weather.rain = 0; g.weather.wet = 0; g.clock.hour = 18.3;
  const V = g.vehicles[0].constructor;
  const v = new V("osprey", 40, -101.75, -Math.PI / 2, 1); v.role = "parked"; v.y = 0; v.savePrev(); g.addVehicle(v);
  g.placePlayer(40, -99, 0); g.enterVehicle(v); g.cam.vehMode = "far";
  g.police.forceTier(3);
});
await wait(12000);
await page.screenshot({ path: out + "alert.png" });
const final = await ev(() => { const g = window.__meridian.game; return { tier: g.police.tier, units: g.police.units.length, fps: window.__meridian.renderer.engine.getFps(), built: window.__meridian.renderer.world.builtCount, state: g.police.state }; });
console.log("final", JSON.stringify(final));
console.log("errors:", errors.length ? "\n" + errors.slice(0, 30).join("\n") : "none");
await browser.close();
srv.close();
