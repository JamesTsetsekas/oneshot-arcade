// app-shell: boot, capability check, loading/streaming, menus, game loop, saves, recovery.
import "./ui/styles.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { Game } from "./sim/game";
import { Renderer } from "./render/renderer";
import { AudioEngine } from "./audio/audio";
import { Input, DEFAULT_BINDS, type Action } from "./input/input";
import { Hud } from "./ui/hud";
import { App, type ShellApi, type Overlay, type Screen } from "./ui/app";
import { makeBrowserRepository, loadSettings, storeSettings, type Settings, type SaveSnapshot } from "./persistence/save";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const uiRoot = document.getElementById("ui")!;
const hudRoot = document.getElementById("hud")!;

function fail(msg: string) {
  shell.screen = "error";
  shell.error = msg;
  render();
}

let renderer: Renderer | null = null;
let hud: Hud | null = null;
const settings = loadSettings();
const game = new Game(settings);
const audio = new AudioEngine(game);
const input = new Input(canvas, settings.binds as Partial<Record<Action, string>>);
input.aimToggle = settings.aimToggle; input.sprintToggle = settings.sprintToggle;
const repo = makeBrowserRepository();
let latest: SaveSnapshot | null = null;
const reactRoot = createRoot(uiRoot);

const shell: ShellApi = {
  game,
  screen: "loading" as Screen,
  overlay: null as Overlay,
  loadProgress: 0,
  loadLabel: "Starting…",
  error: null,
  hasSave: false,
  saveLabel: "",
  notice: null,
  bench: { running: false, result: null },
  setOverlay(o) {
    shell.overlay = o;
    if (shell.screen === "game") {
      game.paused = o !== null || !!game.ui.panel;
      if (o) input.releaseLock();
    }
    render();
  },
  continueGame() { if (latest) startFrom(latest); },
  newGame() { audio.start(); beginPlay(() => game.newGame()); },
  async loadKey(key) {
    const s = await repo.loadKey(key);
    if (!s) { notice("That save could not be read."); return; }
    startFrom(s);
  },
  listSaves: () => repo.list(),
  async exportSave() {
    const r = await repo.latest();
    if (!r) { notice("No save to export yet."); return; }
    const blob = new Blob([JSON.stringify(r.snap, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `meridian-run-save-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  async importSave(file) {
    try { const snap = await repo.importJson(await file.text(), "manual"); latest = snap; shell.hasSave = true; shell.saveLabel = snap.label; notice("Save imported into the manual slot."); }
    catch (e) { notice(`Import failed: ${(e as Error).message}`); }
  },
  saveSettings(s: Settings) {
    const prevQ = game.settings.quality, prevSh = game.settings.shadows;
    Object.assign(game.settings, s);
    storeSettings(game.settings);
    input.binds = { ...DEFAULT_BINDS, ...game.settings.binds } as Record<Action, string>;
    input.aimToggle = s.aimToggle; input.sprintToggle = s.sprintToggle;
    if (renderer && (prevQ !== s.quality || prevSh !== s.shadows)) renderer.applyQuality(s.quality, s.shadows);
  },
  quitToMenu() {
    game.closePanel();
    game.resetWorld();
    game.attract = true;
    game.paused = false;
    game.populate();
    shell.screen = "menu"; shell.overlay = null;
    refreshLatest();
    input.releaseLock();
    render();
  },
  resume() {
    shell.overlay = null;
    game.paused = !!game.ui.panel;
    render();
    if (!game.ui.panel) input.requestLock();
  },
  runBenchmark() { runBenchmark(); },
  rebind(action, done) {
    const l = (code: string) => {
      if (code === "Escape") { input.listeners = input.listeners.filter((x) => x !== l); done(); return true; }
      game.settings.binds = { ...game.settings.binds, [action]: code };
      shell.saveSettings(game.settings);
      input.listeners = input.listeners.filter((x) => x !== l);
      done();
      return true;
    };
    input.listeners.push(l);
  },
};

function render() { reactRoot.render(createElement(App, { shell })); }
function notice(text: string) { shell.notice = text; render(); setTimeout(() => { if (shell.notice === text) { shell.notice = null; render(); } }, 4000); }

async function refreshLatest() {
  try {
    const r = await repo.latest();
    latest = r?.snap ?? null;
    shell.hasSave = !!latest;
    shell.saveLabel = latest ? `${latest.label} · ${new Date(latest.savedAt).toLocaleString()}` : "";
    if (r && r.source !== "slot") notice(`Main save slot was damaged — restored from ${r.source}.`);
  } catch { shell.hasSave = false; }
  render();
}

function startFrom(s: SaveSnapshot) { audio.start(); beginPlay(() => game.applySnapshot(s)); }

/** Show the loading screen, set up the session, stream the starting cells, then play. */
function beginPlay(setup: () => void) {
  shell.screen = "loading"; shell.overlay = null; shell.loadProgress = 0; shell.loadLabel = "Preparing South Quay…";
  render();
  setTimeout(() => {
    setup();
    game.paused = false;
    const p = game.playerPos();
    game.cam.update(1 / 60, game.world, game.player, game.player.vehicle, false, false, 0);
    const total = renderer!.world.cells.length;
    const step = () => {
      const r = renderer!.preload(p.x, p.z, 30);
      shell.loadProgress = Math.min(1, r.built / Math.max(1, r.built + r.remaining));
      shell.loadLabel = `Streaming district cells ${r.built}/${total}`;
      render();
      if (r.remaining > 0 && r.built < 60) requestAnimationFrame(step);
      else { shell.screen = "game"; render(); input.requestLock(); }
    };
    step();
  }, 30);
}

// ---------------------------------------------------------------- benchmark route
const BENCH_ROUTE = [[-55, 100], [-55, -90], [150, -100], [300, -100], [300, 150], [0, 200], [-300, 200], [-300, -250], [0, -330], [200, -330]];
let benchT = -1;
const benchFrames: number[] = [];
function runBenchmark() {
  shell.bench = { running: true, result: null };
  shell.overlay = null;
  benchT = 0; benchFrames.length = 0;
  game.paused = false;
  render();
}
function benchCamera(dt: number) {
  benchT += dt;
  const total = 30;
  const u = Math.min(0.9999, benchT / total) * (BENCH_ROUTE.length - 1);
  const i = Math.floor(u), f = u - i;
  const a = BENCH_ROUTE[i], b = BENCH_ROUTE[i + 1];
  const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
  const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
  game.cam.pos = { x, y: game.heightAt(x, z) + 14, z };
  game.cam.fwd = { x: Math.sin(yaw) * 0.95, y: -0.3, z: Math.cos(yaw) * 0.95 };
  game.cam.target = { x: x + game.cam.fwd.x * 30, y: game.cam.pos.y - 9, z: z + game.cam.fwd.z * 30 };
  game.cam.fov = 85;
  game.focus = { x, z };
  benchFrames.push(dt * 1000);
  if (benchT >= total) {
    benchT = -1;
    const s = [...benchFrames].sort((p, q) => p - q);
    const med = s[Math.floor(s.length / 2)];
    const p99 = s[Math.floor(s.length * 0.99)];
    shell.bench = { running: false, result: `Benchmark: ${s.length} frames · median ${(1000 / med).toFixed(0)} FPS (${med.toFixed(1)} ms) · 1% low ${(1000 / p99).toFixed(0)} FPS · quality ${game.settings.quality}` };
    shell.setOverlay(shell.screen === "game" ? "settings" : "settings");
  }
}

// ---------------------------------------------------------------- loop
let last = performance.now();
let attractA = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  try {
    const g = game;
    // global keys
    if (shell.screen === "game") {
      if (input.wasPressed("pause")) {
        if (game.ui.panel && !["fail", "dead"].includes(game.ui.panel)) { game.closePanel(); shell.resume(); }
        else if (shell.overlay) shell.resume();
        else shell.setOverlay("pause");
      }
      if (!game.ui.panel && !game.ui.choice) {
        if (input.wasPressed("map")) shell.overlay === "map" ? shell.resume() : shell.setOverlay("map");
        if (input.wasPressed("phone")) shell.overlay === "phone" ? shell.resume() : shell.setOverlay("phone");
        const wheelDown = input.isDown("wheel") && !g.player.vehicle;
        if (wheelDown && shell.overlay === null) shell.setOverlay("wheel");
        if (!wheelDown && shell.overlay === "wheel") shell.resume();
      }
      if (game.ui.panel && !game.paused) game.paused = true;
    }
    const playing = shell.screen === "game" && !shell.overlay && !game.ui.panel;
    input.enabled = playing;
    input.fill(g.input, !!g.player.vehicle, dt);
    let alpha = 1;
    if (benchT >= 0) { benchCamera(dt); alpha = g.advance(dt); }
    else if (shell.screen === "menu" || shell.screen === "loading") {
      // attract mode: slow orbit over Tide Market
      if (g.attract) {
        attractA += dt * 0.05;
        g.paused = false;
        alpha = g.advance(dt);
        const fx = g.focus.x, fz = g.focus.z;
        g.cam.pos = { x: fx + Math.sin(attractA) * 110, y: 55, z: fz + Math.cos(attractA) * 110 };
        const dx = fx - g.cam.pos.x, dz = fz - g.cam.pos.z, L = Math.hypot(dx, 40, dz);
        g.cam.fwd = { x: dx / L, y: -40 / L, z: dz / L };
        g.cam.target = { x: fx, y: 15, z: fz };
        g.cam.fov = 70;
      }
    } else if (shell.screen === "game") {
      if (!g.paused) alpha = g.advance(dt);
      if (!g.player.alive && !g.ui.panel) { /* death panel is opened by the sim */ }
      if (g.ui.panel && document.pointerLockElement) input.releaseLock();
    }
    if (renderer) {
      audio.fx(g.fx);
      audio.update(dt);
      renderer.render(alpha, dt);
      if (renderer.contextLost && shell.notice !== "Graphics context lost — restoring…") notice("Graphics context lost — restoring…");
    }
    hud?.update(audio.state);
    // open/close panels triggers React refresh
    if (g.ui.panel || g.ui.choice) { if (!panelShown) { panelShown = true; input.releaseLock(); render(); } }
    else if (panelShown) { panelShown = false; render(); }
  } catch (e) {
    console.error(e);
    if (shell.screen !== "error") fail(`A runtime error stopped the game: ${(e as Error).message}`);
    return;
  }
  input.endFrame();
  requestAnimationFrame(frame);
}
let panelShown = false;

// ---------------------------------------------------------------- boot
async function boot() {
  render();
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) { fail("This browser or device does not provide WebGL 2."); return; }
  try {
    renderer = new Renderer(canvas, game);
  } catch (e) {
    fail(`Graphics initialisation failed: ${(e as Error).message}`);
    return;
  }
  hud = new Hud(hudRoot, game);
  window.addEventListener("resize", () => renderer?.resize());
  canvas.addEventListener("click", () => audio.start());
  window.addEventListener("keydown", () => { if (shell.screen === "game") audio.start(); }, { once: true });
  try {
    const rec = await repo.recover();
    if (rec.length) notice("Recovered an interrupted save write.");
  } catch { notice("Save storage unavailable — progress will not persist this session."); }
  await refreshLatest();
  // initial streaming for the attract view
  game.attract = true;
  game.step(1 / 60);
  game.populate();
  const t0 = performance.now();
  const total = renderer.world.cells.length;
  const step = () => {
    const r = renderer!.preload(game.focus.x, game.focus.z, 40);
    shell.loadProgress = r.built / Math.max(1, r.built + r.remaining);
    shell.loadLabel = `Building Port Meridian · cells ${r.built}/${total}`;
    render();
    if (r.remaining > 0 && r.built < 45 && performance.now() - t0 < 20000) requestAnimationFrame(step);
    else { shell.screen = "menu"; render(); }
  };
  requestAnimationFrame(frame);
  step();
  // offline PWA cache (production build only; relative path keeps sub-path hosting working)
  if (import.meta.env.PROD && "serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  (window as any).__meridian = { game, shell, renderer };
}

boot();
