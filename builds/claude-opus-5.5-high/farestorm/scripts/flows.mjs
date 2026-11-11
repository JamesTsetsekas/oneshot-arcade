// Exercises every mode in a real browser build and reports page errors.
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";
const server = await serve();
const browser = await chromium.launch({ channel: process.env.BROWSER ?? "msedge", headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://localhost:5472/play/claude-opus-5.5-high/farestorm/";
const out = new URL("../oneshot/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
await page.goto(base);
await page.waitForSelector(".menu", { timeout: 60000 });
const run = async (label, mode, extra, seconds, shot) => {
  await page.evaluate(([m, e]) => { const a = window.farestorm; a.autodrive = true; a.startSession(m, e); }, [mode, extra]);
  const t0 = Date.now();
  while (Date.now() - t0 < seconds * 1000) {
    await page.waitForTimeout(1000);
    const done = await page.evaluate(() => window.farestorm.session?.phase === "done");
    if (done) break;
  }
  const info = await page.evaluate(() => { const s = window.farestorm.session; return { phase: s.phase, score: Math.round(s.score), deliveries: s.stats.deliveries, lessonMsg: s.lessonMsg, trialIndex: s.trialIndex, fps: Math.round(window.farestorm.renderer.fps) }; });
  if (shot) await page.screenshot({ path: out + shot });
  console.log(label, JSON.stringify(info));
};
await run("trial0", "trial", { trial: 0 }, 50, "trial.png");
await run("lesson0", "school", { lesson: 0 }, 20, null);
await page.waitForTimeout(2000);
await page.screenshot({ path: out + "lesson-results.png" });
await run("lesson6-air", "school", { lesson: 6 }, 30, null);
await run("quick", "quick", {}, 10, null);
// open each menu screen
await page.evaluate(() => { const a = window.farestorm; a.autodrive = false; a.toMenu(); });
for (const label of ["Records", "Settings", "Time Trial", "Skill School", "Garage", "Credits"]) {
  await page.click(`button:has-text("${label}")`);
  await page.waitForTimeout(500);
  if (label === "Settings") await page.screenshot({ path: out + "settings.png" });
  if (label === "Records") await page.screenshot({ path: out + "records.png" });
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);
}
console.log("errors:", errors.length ? errors.slice(0, 10).join("\n") : "none");
await browser.close();
server.close();
