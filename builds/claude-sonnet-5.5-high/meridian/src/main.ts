import './ui/styles.css';
import { Game } from './sim/game';
import { Renderer } from './render/renderer';
import { Input } from './input/input';
import { AudioSystem } from './audio/audio';
import { Hud } from './ui/hud';
import { Panels } from './ui/panels';
import { SaveRepository, IdbKV, LocalKV, MemoryKV } from './persistence/save';
import type { KV } from './persistence/save';
import { loadSettings, saveSettings } from './core/settings';
import type { GameEvent } from './core/events';
import { emptyInput } from './sim/types';
import type { InputFrame } from './sim/types';

const DT = 1 / 60;
const WORLD_SEED = 1107;

function fatal(title: string, msg: string): void {
  const d = document.createElement('div');
  d.className = 'errscreen';
  d.innerHTML = `<h1></h1><p></p>`;
  d.querySelector('h1')!.textContent = title;
  d.querySelector('p')!.textContent = msg;
  document.getElementById('app')!.appendChild(d);
  document.getElementById('boot')?.classList.add('hidden');
}

function hasWebgl2(): boolean {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

async function pickStore(): Promise<KV> {
  try {
    if (typeof indexedDB !== 'undefined') { const kv = new IdbKV(); await kv.get('probe'); return kv; }
  } catch { /* fall through */ }
  try { localStorage.setItem('meridian.probe', '1'); localStorage.removeItem('meridian.probe'); return new LocalKV(); } catch { return new MemoryKV(); }
}

const tick = (ms = 16): Promise<void> => new Promise((r) => setTimeout(r, ms));
const bootMsg = (m: string, pct: number): void => {
  const e = document.getElementById('boot-msg'); if (e) e.textContent = m;
  const f = document.getElementById('boot-fill'); if (f) f.style.width = pct + '%';
};

async function main(): Promise<void> {
  if (!hasWebgl2()) {
    fatal('WebGL 2 is required', 'Meridian Run needs a desktop browser with WebGL 2 enabled (current Chrome or Edge recommended). Please enable hardware acceleration in your browser settings and reload.');
    return;
  }
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const hudRoot = document.getElementById('hud')!;
  const overlay = document.getElementById('overlay')!;
  const settings = loadSettings();
  bootMsg('Generating South Quay...', 15);
  await tick(30);

  let game = new Game(WORLD_SEED);
  const store = await pickStore();
  const saves = new SaveRepository(store);
  bootMsg('Building the district...', 40);
  await tick(30);
  let renderer: Renderer;
  try { renderer = new Renderer(canvas, game, settings); } catch (e) {
    fatal('Could not start the renderer', 'The graphics pipeline failed to initialise: ' + (e as Error).message + '. Try updating your graphics driver or enabling hardware acceleration.');
    return;
  }
  bootMsg('Tuning the engines...', 70);
  await tick(30);
  const input = new Input();
  input.attach(canvas);
  const audio = new AudioSystem(settings);
  const hud = new Hud(hudRoot, game);
  const panels = new Panels(overlay, game, settings, input, hud);

  type Mode = 'menu' | 'playing' | 'paused';
  let mode: Mode = 'menu';
  let saveBusy = false;
  let resultTimer = 0;
  let lastRadioName = '';
  let hasSaveCache = false;
  const ui = { applyT: 0 };

  // -------------------------------------------------------------------- settings plumbing
  const applySettings = (): void => {
    saveSettings(settings);
    game.settings = settings;
    game.cam.baseFov = settings.fov;
    game.cam.reducedMotion = settings.reducedMotion;
    game.traffic.target = Math.round(22 * settings.density);
    game.traffic.parkedTarget = Math.round(34 * settings.density);
    game.peds.target = Math.round(40 * settings.density);
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    hudRoot.classList.toggle('reduced-motion', settings.reducedMotion);
    hudRoot.classList.toggle('reduced-flashes', settings.reducedFlashes);
    renderer.vehicles.reducedFlashes = settings.reducedFlashes;
    hud.root.className = hud.root.className.replace(/cb-\w+/g, '').trim() + (settings.colorblind !== 'off' ? ' cb-' + settings.colorblind : '');
    audio.applySettings(settings);
    if (renderer.quality !== settings.quality) renderer.setupQuality(settings.quality);
  };

  const attachGame = (g: Game): void => {
    game = g;
    renderer.setGame(g);
    panels.game = g;
    applySettings();
    renderer.waypoint = null;
    hud.waypoint = null;
  };

  const doSave = async (): Promise<void> => {
    if (saveBusy) return;
    saveBusy = true;
    try { await saves.save(game.snapshot()); hasSaveCache = true; } catch (e) { game.toast('Save failed: ' + (e as Error).message, 'bad'); } finally { saveBusy = false; }
  };

  const enterGame = (): void => {
    mode = 'playing';
    panels.close();
    hudRoot.classList.remove('hidden');
    input.enabled = true;
    input.reset();
    audio.init();
    canvas.focus();
    input.requestLock(canvas);
  };

  const openPause = (): void => {
    if (mode !== 'playing') return;
    mode = 'paused';
    input.reset();
    if (document.pointerLockElement) document.exitPointerLock();
    panels.pause();
  };

  const resume = (): void => {
    if (mode === 'menu') return;
    panels.close();
    mode = 'playing';
    input.reset();
    input.requestLock(canvas);
    canvas.focus();
  };

  const openPanel = (kind: 'phone' | 'map' | 'store' | 'kiosk' | 'garage' | 'safehouse'): void => {
    if (mode !== 'playing') return;
    mode = 'paused';
    input.reset();
    if (document.pointerLockElement) document.exitPointerLock();
    audio.event({ type: 'sfx', name: 'phone' }, game);
    ({ phone: () => panels.phone(), map: () => panels.mapScreen(), store: () => panels.store(), kiosk: () => panels.kiosk(), garage: () => panels.garage(), safehouse: () => panels.safehouse() })[kind]();
  };

  const startDemo = (): void => {
    const g = new Game(WORLD_SEED);
    attachGame(g);
    const plaza = g.world.poi('lm-dome');
    g.player.human.x = plaza.x + 18;
    g.player.human.z = plaza.z - 14;
    g.hour = 17.2;
    g.timeScale = 0.4;
    hudRoot.classList.add('hidden');
    mode = 'menu';
    void panels.menu();
  };

  const toMenu = (): void => {
    input.reset();
    if (document.pointerLockElement) document.exitPointerLock();
    startDemo();
  };

  panels.setHooks({
    newGame: () => {
      const g = new Game(WORLD_SEED);
      attachGame(g);
      g.newGame();
      enterGame();
      bootstrapCamera();
    },
    continueGame: async () => {
      const res = await saves.load();
      if (!res) { game.toast('No save found', 'warn'); return; }
      const g = new Game(WORLD_SEED);
      attachGame(g);
      g.loadSnapshot(res.snapshot);
      for (const w of res.warnings) g.toast(w, 'warn');
      g.toast('Welcome back', 'good');
      enterGame();
      bootstrapCamera();
    },
    hasSave: async () => { try { hasSaveCache = await saves.exists(); } catch { hasSaveCache = false; } return hasSaveCache; },
    saveGame: doSave,
    importSave: (t) => saves.importJson(t),
    exportSave: () => saves.exportJson(),
    quitToMenu: () => toMenu(),
    resume,
    applySettings,
    setWaypoint: (p) => { hud.waypoint = p; renderer.waypoint = p; panels.refreshMap(); },
    clickSfx: () => { audio.init(); audio.event({ type: 'sfx', name: 'click' }, game); },
  });

  const bootstrapCamera = (): void => {
    for (let i = 0; i < 30; i++) game.step(emptyInput(), DT);
    renderer.capturePrev();
  };

  // -------------------------------------------------------------------- keyboard shortcuts
  input.onPauseKey = () => { if (mode === 'playing') openPause(); };
  input.onKey = (code) => {
    if (mode === 'menu') return false;
    if (code === 'Escape') {
      if (mode === 'playing') openPause();
      else if (mode === 'paused') { if (panels.current === 'pause' || panels.current === 'fail' || panels.current === 'dead') { if (panels.current === 'pause') resume(); } else if (panels.current === 'settings') panels.pause(); else resume(); }
      return true;
    }
    if (mode === 'playing' && !game.playerBusy()) {
      if (code === input.bindings.map) { openPanel('map'); return true; }
      if (code === input.bindings.phone) { openPanel('phone'); return true; }
      if (code === 'F3') { hud.showFps = !hud.showFps; return true; }
      if (code === 'F1') { hud.hintsOn = !hud.hintsOn; return true; }
      if (code === input.bindings.radio && game.playerVehicle()) { const n = audio.nextStation(); hud.setRadio(n === 'Radio off' ? '' : n); game.toast(n, 'info'); return true; }
    } else if (mode === 'paused') {
      if (code === input.bindings.map && panels.current === 'map') { resume(); return true; }
      if (code === input.bindings.phone && panels.current === 'phone') { resume(); return true; }
    }
    return false;
  };
  window.addEventListener('beforeunload', () => { if (mode === 'playing' && game.safeToSave() && game.tutorialDone) void saves.save(game.snapshot()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) openPause(); });
  window.addEventListener('resize', () => renderer.resize());
  renderer.engine.onContextLostObservable.add(() => game.toast('Graphics context lost - recovering...', 'bad'));
  renderer.engine.onContextRestoredObservable.add(() => game.toast('Graphics context restored', 'good'));

  // -------------------------------------------------------------------- frame loop
  let last = performance.now();
  let acc = 0;
  let adaptT = 0;
  let orbit = 0;
  const handleEvent = (e: GameEvent): void => {
    hud.event(e, settings);
    audio.event(e, game);
    renderer.onEvent(e);
    if (e.type === 'missionFailed' && mode === 'playing') {
      mode = 'paused';
      input.reset();
      if (document.pointerLockElement) document.exitPointerLock();
      setTimeout(() => { if (game.failInfo) panels.fail(game.failInfo.reason, game.failInfo.canRetry); }, 1200);
    }
  };

  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.1);
    if (mode === 'menu') {
      // living city behind the menu: sim runs with no input, camera orbits the market plaza
      acc += dt;
      let n = 0;
      while (acc >= DT && n++ < 4) { renderer.capturePrev(); game.step(emptyInput(), DT); acc -= DT; }
      orbit += dt * 0.07;
      const p = game.world.poi('lm-dome');
      const r = 74;
      game.cam.pose = { x: p.x + Math.cos(orbit) * r, y: 26 + Math.sin(orbit * 0.7) * 4, z: p.z + Math.sin(orbit) * r, tx: p.x, ty: 6, tz: p.z, hfov: 68 };
      game.events.length = 0;
      renderer.render(dt, 0.0, true);
      audio.update(game, dt);
      return;
    }
    const running = mode === 'playing';
    let steps = 0;
    if (running) {
      acc += dt;
      const f0: InputFrame = input.build(settings, game.playerVehicle() !== null);
      let first = true;
      while (acc >= DT && steps < 5) {
        const f: InputFrame = first ? f0 : { ...f0, lookDX: 0, lookDY: 0, jump: false, interact: false, exit: false, firePressed: false, reload: false, throwItem: false, holster: false, swap: false, camCycle: false, heal: false, select: -1, cycle: 0 };
        first = false;
        renderer.capturePrev();
        game.step(f, DT);
        acc -= DT;
        steps++;
      }
      if (steps > 0) input.endFrame();
      if (steps === 5) acc = 0;
    } else {
      // paused: keep the sim frozen, but let the camera/visuals stay valid
      input.endFrame();
    }
    // drain events
    if (game.events.length) {
      const evs = game.events.splice(0, game.events.length);
      for (const e of evs) handleEvent(e);
    }
    // sim -> UI requests
    if (game.panel && mode === 'playing') { const k = game.panel; game.panel = null; if (k) openPanel(k); }
    if (game.choice && mode === 'playing') { mode = 'paused'; input.reset(); if (document.pointerLockElement) document.exitPointerLock(); const c = game.choice; game.choice = null; panels.choice(c.prompt, c.options, (i) => { c.cb(i); }); }
    if (game.lastResult && mode === 'playing' && panels.current === 'none') {
      resultTimer += dt;
      if (resultTimer > 2.2) { resultTimer = 0; mode = 'paused'; input.reset(); if (document.pointerLockElement) document.exitPointerLock(); panels.result(); }
    }
    if (game.autosaveWanted) { game.autosaveWanted = false; if (game.safeToSave() || game.respawnT <= 0 && game.failInfo === null) void doSave(); }
    renderer.render(dt, running ? acc / DT : 1);
    audio.update(game, running ? dt : 0);
    hud.update(game, settings, dt, renderer.stats.fps);
    if (audio.stationName !== lastRadioName) { lastRadioName = audio.stationName; hud.setRadio(audio.stationName === 'Radio off' ? '' : audio.stationName); }
    if (panels.current === 'map') panels.refreshMap();
    // dynamic resolution (keeps the target frame rate on weaker GPUs)
    adaptT += dt;
    if (adaptT > 3 && running) {
      adaptT = 0;
      const fps = renderer.stats.fps;
      const lvl = renderer.engine.getHardwareScalingLevel();
      if (fps < 36 && lvl < 1.6) renderer.engine.setHardwareScalingLevel(lvl + 0.2);
      else if (fps > 58 && lvl > 1.0 && settings.quality !== 'low') renderer.engine.setHardwareScalingLevel(Math.max(1, lvl - 0.2));
    }
    ui.applyT += dt;
  };

  applySettings();
  startDemo();
  bootMsg('Ready', 100);
  await tick(200);
  document.getElementById('boot')?.classList.add('hidden');
  requestAnimationFrame(frame);
  // debug handle for automated checks
  (window as unknown as Record<string, unknown>).__meridian = {
    get game() { return game; }, get renderer() { return renderer; }, enterGame, input, hud, panels, audio,
    startNew: () => panels['hooks'].newGame(),
  };

  // Offline-capable shell (network-first, relative scope so it works from any sub-path)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.includes('localhost:5560')) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* optional */ });
  }
}

main().catch((e) => { console.error(e); fatal('Something went wrong', String(e?.message ?? e)); });
