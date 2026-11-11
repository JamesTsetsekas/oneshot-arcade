// Teleport the (demo) local player around K-17 and capture views (dev verification only).
import { chromium } from "playwright-core";
import path from "node:path";
const base = process.env.BASE_URL ?? "http://localhost:5420/";
const out = path.resolve(process.argv[2] ?? "oneshot");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${base}?autostart=1&demo=1&warmup=60`);
await page.waitForFunction(() => !!window.__breachline, null, { timeout: 60000 });
await page.waitForTimeout(2000);
const spots = (process.env.SPOTS ?? "ops:-41,0,7,1.57,0;ridge:-44,2.4,31,1.57,0.05;utility:-24,0,-30,1.57,0;tunnel:-14,-3.2,-11.5,1.57,0;catwalk:29.7,3.6,-2,-1.57,0.08;courtyard:-18,0,3,1.2,0").split(";");
for (const s of spots) {
  const [name, v] = s.split(":");
  const [x, y, z, yaw, pitch] = v.split(",").map(Number);
  await page.evaluate(([x, y, z, yaw, pitch]) => {
    const r = window.__breachline.session.room; const p = r.get(r.localId);
    p.brain = null; p.move.pos = { x, y, z }; p.move.vel = { x: 0, y: 0, z: 0 }; p.cmd = { ...p.cmd, yaw, pitch, buttons: 0, mx: 0, mz: 0 };
  }, [x, y, z, yaw, pitch]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `tour-${name}.png`) });
}
await browser.close();
