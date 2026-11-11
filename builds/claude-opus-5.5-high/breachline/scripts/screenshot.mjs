// Serves dist/ under a sub-path and captures real gameplay screenshots with a headless
// Chromium-family browser (system Edge/Chrome via playwright-core).
// Usage: node scripts/screenshot.mjs [outDir] [extraQuery]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve("dist");
const SUB = "/play/claude-opus-5.5-high/breachline/";
const PORT = 5422;
const outDir = path.resolve(process.argv[2] ?? "oneshot");
const extra = process.argv[3] ?? "";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".wasm": "application/wasm" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(SUB)) { res.writeHead(404); res.end("not under sub-path"); return; }
  let rel = url.pathname.slice(SUB.length) || "index.html";
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("404"); return; }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));
fs.mkdirSync(outDir, { recursive: true });

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
    console.log("browser:", channel);
    break;
  } catch (e) { console.log("launch failed", channel, String(e).slice(0, 120)); }
}
if (!browser) { server.close(); process.exit(1); }
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

const base = process.env.BASE_URL ?? `http://localhost:${PORT}${SUB}`;
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(outDir, "menu.png") });
console.log("menu captured");

await page.goto(`${base}?autostart=1&demo=1&warmup=3${extra}`, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__breachline, null, { timeout: 60000 });
const shots = (process.env.SHOTS ?? "screenshot.png:14000,gameplay-2.png:9000,gameplay-3.png:9000").split(",").map((x) => { const [n, w] = x.split(":"); return [n, Number(w)]; });
for (const [name, wait] of shots) {
  await page.waitForTimeout(wait);
  const st = await page.evaluate(() => window.__breachline?.state());
  console.log(name, JSON.stringify(st));
  await page.screenshot({ path: path.join(outDir, name) });
}
console.log("errors:", errors.slice(0, 20).join("\n"));
await browser.close();
server.close();
