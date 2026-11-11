// Captures real screenshots from the production build served under a sub-path, using a locally
// installed Chromium-based browser (Edge/Chrome) through playwright-core.
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";
import { mkdir } from "node:fs/promises";

const port = Number(process.env.PORT ?? 5472);
const base = "/play/claude-opus-5.5-high/farestorm/";
const out = new URL("../oneshot/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
await mkdir(out, { recursive: true });
const server = await serve();
const channel = process.env.BROWSER ?? "msedge";
const browser = await chromium.launch({ channel, headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
const shots = (process.env.SHOTS ?? "menu,play").split(",");
const wait = (ms) => page.waitForTimeout(ms);
try {
  if (shots.includes("menu")) {
    await page.goto(`http://localhost:${port}${base}`);
    await page.waitForSelector(".menu", { timeout: 60000 });
    await wait(2500);
    await page.screenshot({ path: out + "menu.png" });
    console.log("menu ok");
  }
  if (shots.includes("select")) {
    await page.goto(`http://localhost:${port}${base}`);
    await page.waitForSelector(".menu", { timeout: 60000 });
    await wait(800);
    await page.click("text=Arcade Shift");
    await wait(700);
    await page.screenshot({ path: out + "taxi-select.png" });
    await page.click("text=Start shift");
    await wait(9000);
    await page.screenshot({ path: out + "play-manual-start.png" });
    await page.evaluate(() => window.farestorm.session.finish());
    await wait(2500);
    await page.screenshot({ path: out + "results.png" });
    console.log("select/results ok");
  }
  if (shots.includes("play")) {
    await page.goto(`http://localhost:${port}${base}?autodrive=1&seed=${process.env.SEED ?? 4}`);
    await page.waitForFunction(() => window.farestorm?.session, null, { timeout: 60000 });
    const secs = Number(process.env.PLAY_SECONDS ?? 14);
    const extra = (process.env.EXTRA ?? "").split(",").filter(Boolean).map(Number);
    for (let i = 1; i <= secs; i++) {
      await wait(1000);
      if (extra.includes(i)) await page.screenshot({ path: out + `play-${i}s.png` });
    }
    await page.screenshot({ path: out + (process.env.OUT ?? "screenshot.png") });
    const info = await page.evaluate(() => {
      const s = window.farestorm.session;
      return { tick: s.tick, score: s.score, kmh: s.kmh, active: !!s.active, deliveries: s.stats.deliveries, fps: window.farestorm.renderer.fps, x: s.v.x, z: s.v.z, cands: s.fares.candidates.length };
    });
    console.log("play", JSON.stringify(info));
  }
} finally {
  console.log(logs.slice(0, 30).join("\n"));
  await browser.close();
  server.close();
}
