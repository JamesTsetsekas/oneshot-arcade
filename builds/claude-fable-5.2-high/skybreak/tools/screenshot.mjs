// Captures real screenshots from the production build, served from a nested sub-path to prove relative URLs work.
// Usage: node tools/screenshot.mjs [menu|practice|match|hero|flow|all] [--size=1920x1080]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const PREFIX = "/play/claude-fable-5.2-high/skybreak/";
const PORT = 5351;
const scenario = process.argv[2] ?? "all";
const sizeArg = process.argv.find((a) => a.startsWith("--size="));
const [W, H] = sizeArg ? sizeArg.slice(7).split("x").map(Number) : [1280, 720];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm", ".png": "image/png", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (!url.startsWith(PREFIX)) {
    res.writeHead(404);
    res.end("outside sub-path");
    return;
  }
  const rel = url.slice(PREFIX.length) || "index.html";
  const file = path.join(dist, rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
    break;
  } catch (e) {
    console.log(`channel ${channel} unavailable: ${String(e).split("\n")[0]}`);
  }
}
if (!browser) {
  console.error("No Chromium-based browser available for capture.");
  server.close();
  process.exit(2);
}
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
const notFound = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
page.on("response", (r) => {
  if (r.status() >= 400) notFound.push(r.status() + " " + r.url());
});
const out = (name) => path.join(root, "oneshot", name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  await page.screenshot({ path: out(name) });
  console.log("saved oneshot/" + name);
};
const finish = async (code) => {
  console.log("console errors:", errors.length ? errors.slice(0, 12) : "none");
  console.log("failed requests:", notFound.length ? notFound.slice(0, 12) : "none");
  await browser.close();
  server.close();
  process.exit(code);
};

await page.goto(`http://127.0.0.1:${PORT}${PREFIX}`);
try {
  await page.waitForSelector(".menu, .errorbox", { timeout: 120000 });
} catch {
  await shot("timeout.png");
  await finish(4);
}
if (await page.$(".errorbox")) {
  console.error("Game showed its error screen:", await page.textContent(".errorbox"));
  await shot("error.png");
  await finish(3);
}
const info = await page.evaluate(() => {
  const g = window.__skybreak;
  const gl = g.renderer.world.engine._gl;
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown", webgl: gl.getParameter(gl.VERSION) };
});
console.log("GL:", JSON.stringify(info));
await sleep(1500);
if (scenario === "menu" || scenario === "all") await shot("menu.png");

const fps = async (label) => {
  const v = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let n = 0;
        const t0 = performance.now();
        const f = () => {
          n++;
          if (performance.now() - t0 > 2000) resolve(n / 2);
          else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }),
  );
  console.log(`fps (${label}, ${W}x${H}): ${v.toFixed(1)}`);
};
const walkTo = async (tx, tz, reach, pitch = -0.2, maxSteps = 90) => {
  await page.keyboard.down("KeyW");
  for (let i = 0; i < maxSteps; i++) {
    const d = await page.evaluate(
      ([x, z, p]) => {
        const g = window.__skybreak;
        g.input.yaw = Math.atan2(x - g.px, z - g.pz);
        g.input.pitch = p;
        return Math.hypot(x - g.px, z - g.pz);
      },
      [tx, tz, pitch],
    );
    if (d < reach) break;
    if (i % 14 === 13) await page.keyboard.press("Space");
    await sleep(100);
  }
  await page.keyboard.up("KeyW");
};

if (scenario === "survey") {
  // aerial survey of every location (menu camera override; UI hidden) to eyeball world-building
  await page.addStyleTag({ content: "#ui{display:none}" });
  const locs = [["market", -130, 190], ["array", 240, 260], ["kilnworks", 270, -130], ["orchard", -270, -110], ["abbey", 20, -20], ["docks", -80, -468], ["huts", 385, 60], ["span", 158, -55], ["quarry", -30, 395], ["camp", -400, 110], ["turbine", 110, -335], ["hollow", -180, -300], ["relay", 60, 330], ["wreck", 430, -235], ["pier", -655, -655]];
  for (const [name, x, z] of locs) {
    await page.evaluate(([x, z]) => {
      const g = window.__skybreak;
      const gy = Math.max(0, g.island.hf.height(x, z));
      const r = 75;
      g.debugCam = [x - r * 0.7, gy + 48, z - r * 0.7, Math.PI / 4, -0.5];
    }, [x, z]);
    await sleep(500);
    await shot("survey-" + name + ".png");
  }
  await page.evaluate(() => (window.__skybreak.debugCam = null));
}

if (scenario === "practice" || scenario === "all") {
  await page.click("text=Practice Range");
  await page.waitForSelector(".vitals");
  await page.evaluate(() => window.__skybreak.debugForceLock());
  await sleep(1200);
  await shot("practice-start.png");
  await walkTo(-655 - 29, -655 - 18.6, 1.5);
  await sleep(200);
  await page.keyboard.press("KeyE");
  await sleep(400);
  await page.evaluate(() => {
    const g = window.__skybreak;
    g.input.yaw = Math.atan2(-655 + 8 - g.px, -655 - 11 - g.pz);
    g.input.pitch = -0.02;
  });
  await sleep(500);
  await page.mouse.move(W / 2, H / 2);
  await page.mouse.down();
  await sleep(450);
  await shot("practice.png");
  await page.mouse.up();
  await fps("practice range");
  // quality presets can be switched live without errors
  for (const q of ["low", "high", "medium"]) {
    await page.evaluate((q) => {
      const raw = JSON.parse(localStorage.getItem("skybreak.settings.v1") || "{}");
      void raw;
      window.__skybreakSettings.set({ quality: q });
    }, q);
    await sleep(900);
    if (q !== "medium") await shot("quality-" + q + ".png");
  }
  // utilities: throw a Mist Capsule and a Wind Orb downrange (verifies projectiles, cloud and blast in the client)
  await walkTo(-655 - 20.5, -655 - 15.2, 1.4);
  await page.keyboard.press("KeyE");
  await sleep(300);
  await page.evaluate(() => {
    const g = window.__skybreak;
    g.input.slot = g.link.curr.you.slots.findIndex((q) => q && q.kind === "item" && q.item === "mist");
    g.input.yaw = Math.PI / 2;
    g.input.pitch = 0.1;
  });
  await sleep(500);
  await page.mouse.down();
  await sleep(120);
  await page.mouse.up();
  await sleep(2200);
  await shot("mist.png");
  await page.evaluate(() => window.__skybreak.leaveToMenu());
  await page.waitForSelector(".menu");
}

const startMatch = async () => {
  try {
    await page.click(".menu-buttons .seg button:has-text(\"Blitz\")", { timeout: 8000 });
    await page.click(".menu-buttons button.primary", { timeout: 8000 });
  } catch (e) {
    await shot("debug-start.png");
    console.log("startMatch failed; screen =", await page.evaluate(() => document.getElementById("ui").innerText.slice(0, 200)));
    throw e;
  }
  await page.waitForSelector(".vitals");
  await page.evaluate(() => window.__skybreak.debugForceLock());
};
const state = () =>
  page.evaluate(() => {
    const g = window.__skybreak;
    if (!g.link) return null;
    const c = g.link.curr;
    const me = c.actors.find((a) => a.id === c.viewId);
    return { phase: c.phase, alive: c.alive, mode: me ? me.mode : 1, x: g.px, y: g.py, z: g.pz, weapons: c.you.slots.filter((q) => q && q.kind === "weapon").length, items: c.you.slots.filter(Boolean).length, spectating: c.spectating, health: c.you.health, time: c.time };
  });

if (scenario === "match" || scenario === "all") {
  await startMatch();
  await sleep(2500);
  await shot("staging.png");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__skybreak.link && window.__skybreak.link.curr.you.canJump, null, { timeout: 60000 });
  await sleep(1500);
  await shot("skiff.png");
  await page.keyboard.press("KeyM");
  await sleep(700);
  await shot("map.png");
  await page.keyboard.press("KeyM");
  await page.evaluate(() => window.__skybreak.debugForceLock());
  // drop on the Orchard Steps: quieter, so the capture run survives long enough to loot and look around
  const TX = -262, TZ = -118;
  await page.waitForFunction(
    ([x, z]) => {
      const g = window.__skybreak;
      const s = g.link.curr.skiff;
      return Math.hypot(s.x - x, s.z - z) < 340 || g.link.curr.phaseTimer < 12;
    },
    [TX, TZ],
    { timeout: 60000 },
  );
  await page.keyboard.press("Space");
  await page.keyboard.down("KeyW");
  let st = await state();
  let shotAir = false;
  for (let i = 0; i < 800; i++) {
    const d = Math.hypot(TX - st.x, TZ - st.z);
    await page.evaluate(
      ([x, z, p]) => {
        const g = window.__skybreak;
        g.input.yaw = Math.atan2(x - g.px, z - g.pz);
        g.input.pitch = p;
      },
      [TX, TZ, st.mode === 3 ? (d < 45 ? -0.95 : -0.22) : -0.5],
    );
    st = await state();
    if (st.mode === 2 && Math.hypot(TX - st.x, TZ - st.z) > 260) await page.keyboard.press("KeyZ");
    if (!shotAir && st.mode === 3 && st.y < 150) {
      shotAir = true;
      await shot("glide.png");
    }
    if (st.mode !== 1 && st.mode !== 2 && st.mode !== 3) break;
    await sleep(100);
  }
  await page.keyboard.up("KeyW");
  console.log("landed", JSON.stringify(st));
  await sleep(500);
  // loot nearby pickups and containers the way a player would: walk up, press E
  const tried = new Set();
  for (let k = 0; k < 14; k++) {
    st = await state();
    if (!st || st.spectating || st.items >= 4) break;
    const target = await page.evaluate((skip) => {
      const g = window.__skybreak;
      let best = null;
      let bd = 60;
      for (const l of g.link.curr.loot) {
        if (l.kind === "ammo" || skip.includes(l.id) || Math.abs(l.y - g.py) > 1.3) continue;
        const d = Math.hypot(l.x - g.px, l.z - g.pz);
        if (d < bd) {
          bd = d;
          best = { id: l.id, x: l.x, z: l.z };
        }
      }
      for (const c of g.link.curr.chests) {
        if (c.open || skip.includes(c.id) || Math.abs(c.y - g.py) > 1.3) continue;
        const d = Math.hypot(c.x - g.px, c.z - g.pz) - 4;
        if (d < bd) {
          bd = d;
          best = { id: c.id, x: c.x, z: c.z };
        }
      }
      return best;
    }, [...tried]);
    if (!target) break;
    tried.add(target.id);
    await walkTo(target.x, target.z, 1.5, -0.45, 70);
    await page.keyboard.press("KeyE");
    await sleep(350);
  }
  st = await state();
  console.log("after looting", JSON.stringify(st));
  // step into the open and frame the settlement
  await page.evaluate(() => {
    const g = window.__skybreak;
    g.input.slot = g.link.curr.you.slots.findIndex((q) => q && q.kind === "weapon");
    if (g.input.slot < 0) g.input.slot = 0;
  });
  for (let i = 0; i < 6; i++) {
    await page.evaluate((i) => {
      const g = window.__skybreak;
      g.input.yaw = i * 1.05;
      g.input.pitch = 0.03;
    }, i);
    await sleep(650);
    await shot(i === 0 ? "ground.png" : "ground" + (i + 1) + ".png");
  }
  await fps("in match");
  await page.keyboard.press("Tab");
  await sleep(500);
  await shot("inventory.png");
  await page.keyboard.press("Tab");
  await page.evaluate(() => window.__skybreak.leaveToMenu());
  await page.waitForSelector(".menu");
}

if (scenario === "hero" || scenario === "all") {
  // The headline gameplay frame: drop on the Aerie Market, loot a weapon, engage whoever is nearby.
  let best = null;
  for (let attempt = 0; attempt < 3 && !best; attempt++) {
    await startMatch();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__skybreak.link && window.__skybreak.link.curr.you.canJump, null, { timeout: 60000 });
    const TX = -128, TZ = 176;
    await page.waitForFunction(
      ([x, z]) => {
        const g = window.__skybreak;
        const s = g.link.curr.skiff;
        return Math.hypot(s.x - x, s.z - z) < 330 || g.link.curr.phaseTimer < 12;
      },
      [TX, TZ],
      { timeout: 60000 },
    );
    await page.keyboard.press("Space");
    await page.keyboard.down("KeyW");
    let st = await state();
    for (let i = 0; i < 800; i++) {
      const d = Math.hypot(TX - st.x, TZ - st.z);
      await page.evaluate(
        ([x, z, p]) => {
          const g = window.__skybreak;
          g.input.yaw = Math.atan2(x - g.px, z - g.pz);
          g.input.pitch = p;
        },
        [TX, TZ, st.mode === 3 ? (d < 45 ? -0.95 : -0.22) : -0.5],
      );
      st = await state();
      if (st.mode === 2 && Math.hypot(TX - st.x, TZ - st.z) > 260) await page.keyboard.press("KeyZ");
      if (st.mode !== 1 && st.mode !== 2 && st.mode !== 3) break;
      await sleep(100);
    }
    await page.keyboard.up("KeyW");
    const tried = new Set();
    for (let k = 0; k < 10; k++) {
      st = await state();
      if (!st || st.spectating || st.weapons >= 1) break;
      const target = await page.evaluate((skip) => {
        const g = window.__skybreak;
        let pick = null;
        let bd = 50;
        for (const l of g.link.curr.loot) {
          if (l.kind !== "weapon" || skip.includes(l.id) || Math.abs(l.y - g.py) > 1.3) continue;
          const d = Math.hypot(l.x - g.px, l.z - g.pz);
          if (d < bd) {
            bd = d;
            pick = { id: l.id, x: l.x, z: l.z };
          }
        }
        return pick;
      }, [...tried]);
      if (!target) break;
      tried.add(target.id);
      await walkTo(target.x, target.z, 1.5, -0.45, 70);
      await page.keyboard.press("KeyE");
      await sleep(350);
    }
    st = await state();
    if (!st || st.spectating || st.weapons < 1) {
      console.log("hero attempt", attempt, "no weapon / eliminated; retrying");
      await page.evaluate(() => window.__skybreak.leaveToMenu());
      await page.waitForSelector(".menu");
      continue;
    }
    await page.evaluate(() => {
      const g = window.__skybreak;
      g.input.slot = g.link.curr.you.slots.findIndex((q) => q && q.kind === "weapon");
    });
    // step out into the plaza so the frame shows the town, not a wall
    await walkTo(-120, 197, 2.5, -0.1, 110);
    // hunt: face the nearest visible opponent and fire; capture while tracers are in the air
    for (let i = 0; i < 260 && !best; i++) {
      const tgt = await page.evaluate(() => {
        const g = window.__skybreak;
        const c = g.link.curr;
        if (c.spectating) return { dead: true };
        let pick = null;
        let bd = 70;
        for (const a of c.actors) {
          if (a.id === c.viewId || a.mode === 12) continue;
          const d = Math.hypot(a.x - g.px, a.z - g.pz);
          if (d < bd && g.island.world.lineClear(g.px, g.py + 1.9, g.pz, a.x, a.y + 1.2, a.z) && g.island.world.lineClear(g.px, g.py + 1.3, g.pz, a.x, a.y + 1.0, a.z) && !g.island.world.blocked(g.px, g.pz, 2.2, g.py + 2.4, g.py + 6)) {
            bd = d;
            pick = { x: a.x, y: a.y, z: a.z, d };
          }
        }
        if (pick) {
          // aim through the over-shoulder pivot
          const yaw0 = Math.atan2(pick.x - g.px, pick.z - g.pz);
          const px = g.px + Math.cos(yaw0) * 0.55, pz = g.pz - Math.sin(yaw0) * 0.55, py = g.py + 1.9;
          g.input.yaw = Math.atan2(pick.x - px, pick.z - pz);
          g.input.pitch = Math.atan2(pick.y + 1.15 - py, Math.hypot(pick.x - px, pick.z - pz));
        } else {
          g.input.yaw += 0.12;
          g.input.pitch = 0;
        }
        return pick;
      });
      if (tgt && tgt.dead) break;
      if (tgt && tgt.d > 6 && tgt.d < 42) {
        await page.mouse.move(W / 2, H / 2);
        for (let b = 0; b < 3; b++) {
          await page.mouse.down();
          await sleep(110 + b * 40);
          await shot(b === 1 ? "screenshot.png" : "combat-" + "abc"[b] + ".png");
          await page.mouse.up();
          await sleep(60);
        }
        best = tgt;
        break;
      }
      await sleep(120);
    }
    if (!best) console.log("hero attempt", attempt, "found no opponent in view");
    await page.evaluate(() => window.__skybreak.leaveToMenu());
    await page.waitForSelector(".menu");
  }
  console.log("hero:", best ? "captured at " + best.d.toFixed(0) + " m" : "NOT captured");
}

if (scenario === "victory") {
  // Verification aid for the win path: every other player is eliminated through the server's own damage call.
  await startMatch();
  await page.keyboard.press("Enter");
  await page.evaluate(() => (window.__skybreak.link.timeScale = 6));
  await page.waitForFunction(() => window.__skybreak.link.curr.phase === "active", null, { timeout: 120000 });
  await page.evaluate(() => (window.__skybreak.link.timeScale = 1));
  await sleep(1500);
  await page.evaluate(() => {
    const m = window.__skybreak.link.match;
    for (const a of m.actors) if (a.id !== 0) m.damage(a, 999, 0, "wayfarer", "head", false, 30);
  });
  await sleep(2500);
  await shot("victory.png");
  await page.waitForSelector(".results-inner", { timeout: 20000 });
  await sleep(400);
  await shot("results-win.png");
  console.log("victory title:", await page.textContent(".results-inner h1"));
  await page.evaluate(() => window.__skybreak.leaveToMenu());
  await page.waitForSelector(".menu");
}

if (scenario === "flow" || scenario === "all") {
  // Full loop with an idle player, fast-forwarded: auto-drop, elimination, spectate, results, requeue.
  await startMatch();
  await page.keyboard.press("Enter");
  await page.evaluate(() => (window.__skybreak.link.timeScale = 6));
  let st = await state();
  let stormShot = false;
  for (let i = 0; i < 1200; i++) {
    st = await state();
    if (!st) break;
    if (!stormShot && st.phase === "active" && st.time > 200) {
      stormShot = true;
      await page.evaluate(() => (window.__skybreak.link.timeScale = 1));
      await sleep(700);
      await shot("midmatch.png");
      await page.evaluate(() => (window.__skybreak.link.timeScale = 6));
    }
    if (st.spectating || st.phase === "ended") break;
    await sleep(250);
  }
  console.log("flow state", JSON.stringify(st));
  await page.evaluate(() => window.__skybreak.link && (window.__skybreak.link.timeScale = 1));
  await sleep(1200);
  if (await page.$(".deathcard")) {
    await shot("eliminated.png");
    await page.click(".deathcard button:has-text(\"Next\")");
    await sleep(600);
    await page.evaluate(() => window.__skybreak.link && (window.__skybreak.link.timeScale = 8));
    await page.waitForFunction(() => !window.__skybreak.link || window.__skybreak.link.curr.phase === "ended", null, { timeout: 240000 });
    await sleep(300);
    await shot("spectate-end.png");
  }
  await page.waitForSelector(".results-inner", { timeout: 60000 }).catch(async () => {
    if (await page.$(".deathcard")) await page.click(".deathcard button:has-text(\"View results\")");
  });
  await page.waitForSelector(".results-inner", { timeout: 20000 });
  await sleep(500);
  await shot("results.png");
  await page.click(".results-inner button:has-text(\"Drop again\")");
  await page.waitForSelector(".vitals", { timeout: 20000 });
  console.log("requeue: ok");
  await page.evaluate(() => window.__skybreak.leaveToMenu());
  await page.waitForSelector(".menu");
}

await finish(errors.some((e) => e.startsWith("PAGEERROR")) ? 1 : 0);
