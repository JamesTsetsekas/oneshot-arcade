// Dev verification: scoped marksman ADS, obscurant volume, support devices/strikes rendered in a live match.
import { chromium } from "playwright-core";
import path from "node:path";
const base = process.env.BASE_URL ?? "http://localhost:5420/";
const out = path.resolve(process.argv[2] ?? "oneshot");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await page.getByText("Loadouts", { exact: true }).click();
await page.getByText("Practice: all unlocks").click();
await page.waitForTimeout(300);
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem("breachline.profile") || "null");
  if (p) { p.practiceAllUnlocked = true; p.loadouts[0].primary = "warden"; p.loadouts[0].primaryAttachments = []; p.selected = 0; localStorage.setItem("breachline.profile", JSON.stringify(p)); }
});
await page.goto(`${base}?autostart=1&demo=1&warmup=60`);
await page.waitForFunction(() => !!window.__breachline, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const act = (fn, arg) => page.evaluate(fn, arg);
// scoped ADS on the ridge
await act(() => { const r = window.__breachline.session.room; const p = r.get(r.localId); p.brain = null; p.move.pos = { x: -44, y: 2.4, z: 33 }; p.cmd = { ...p.cmd, yaw: 1.57, pitch: 0.02, buttons: 2 }; });
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(out, "feature-scope.png") });
// obscurant + frag + drone + mortar marker in the courtyard
await act(() => {
  const r = window.__breachline.session.room; const p = r.get(r.localId);
  p.move.pos = { x: -20, y: 0, z: 4 }; p.cmd = { ...p.cmd, yaw: 1.4, pitch: 0.05, buttons: 0 };
  r.phase = "live"; r.phaseEnd = r.time + 400;
  r.smokes.push({ id: 900, pos: { x: -6, y: 0, z: 6 }, radius: 5.5, t: 2, life: 30 });
  r.devices.push({ id: 901, kind: "drone", owner: p.id, team: 1, pos: { x: -8, y: 9, z: -2 }, hp: 120, maxHp: 120, life: 30, yaw: 0, target: { x: -8, y: 12, z: -2 }, nextMark: 0, refillCd: new Map() });
  r.devices.push({ id: 902, kind: "ammoPod", owner: p.id, team: 0, pos: { x: -16, y: 0.4, z: 2 }, hp: 150, maxHp: 150, life: 30, yaw: 0.4, target: { x: 0, y: 0, z: 0 }, nextMark: 0, refillCd: new Map() });
  r.strikes.push({ id: 903, kind: "mortar", owner: p.id, team: 1, pos: { x: -10, y: 0, z: -6 }, dir: { x: 0, y: 0, z: 0 }, t: 0, impactAt: r.time + 20, done: false, hitSet: new Set() });
});
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(out, "feature-support.png") });
console.log("errors", errors.join("\n"));
await browser.close();
