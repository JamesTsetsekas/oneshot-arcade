import './styles.css';
import { AudioEngine } from './audio/audio';
import { Bot } from './bot';
import { Input } from './input';
import { load, recordRun, save, type Settings } from './persist';
import { GameView, type ViewSettings } from './render/view';
import { STEP } from './sim/rules';
import { Sim, IDLE, type GameEvent, type Mode } from './sim/sim';
import { TAXIS } from './sim/data';
import { getWorld } from './sim/world';
import { Hud } from './ui/hud';
import { Menus } from './ui/menus';

type State = 'menu' | 'playing' | 'paused' | 'results';

const params = new URLSearchParams(location.search);
const ui = document.getElementById('ui') as HTMLElement;
const app = document.getElementById('app') as HTMLElement;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const boot = document.getElementById('boot') as HTMLElement;
const bootFill = document.getElementById('boot-fill') as HTMLElement;
const bootMsg = document.getElementById('boot-msg') as HTMLElement;

function setBoot(p: number, msg: string) {
  bootFill.style.width = `${p * 100}%`;
  bootMsg.textContent = msg;
}

function hasWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function viewSettings(s: Settings): ViewSettings {
  return { shadows: s.shadows, resolutionScale: s.resolution, dynamicRes: s.dynamicRes, reducedMotion: s.reducedMotion, shake: s.shake, fov: s.fov, crowd: s.crowd, guidance: s.guidance };
}

async function main() {
  const errMenus = new Menus(ui, { click() {}, start() {}, previewTaxi() {}, settingsChanged() {}, resume() {}, restart() {}, quit() {}, back() {} });
  if (!hasWebGL2()) {
    boot.classList.add('gone');
    errMenus.error('WebGL 2 required', 'Farestorm needs a desktop browser with WebGL 2 (current Chrome, Edge or Firefox). Enable hardware acceleration in your browser settings, update your graphics driver, then reload.');
    return;
  }
  setBoot(0.2, 'Raising Galeport…');
  await new Promise((r) => setTimeout(r, 30));

  const save0 = load();
  const input = new Input();
  const audio = new AudioEngine();
  const world = getWorld();
  const botOn = params.get('bot') === '1';
  const bot = new Bot();

  let sim = new Sim({ seed: 11, mode: 'arcade', taxi: save0.taxi, traffic: 'calm', startCountdown: 1e9, hub: 1 });
  setBoot(0.5, 'Painting the city…');
  await new Promise((r) => setTimeout(r, 30));
  let view: GameView;
  try {
    view = new GameView(canvas, sim, viewSettings(save0.settings), save0.color);
  } catch (e) {
    boot.classList.add('gone');
    errMenus.error('Graphics could not start', `The renderer failed to initialise (${String(e)}). Try reloading or enabling hardware acceleration.`);
    return;
  }
  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    new Menus(ui, { click() {}, start() {}, previewTaxi() {}, settingsChanged() {}, resume() {}, restart() {}, quit() {}, back() {} }).error('Graphics context lost', 'The GPU driver reset the graphics context. Your records are safe. Reload to continue.');
  });
  view.menuMode = true;
  setBoot(0.85, 'Tuning engines…');

  let state: State = 'menu';
  let hud: Hud | null = null;
  let mode: Mode = 'arcade';
  let endTimer = -1;
  let resultsShown = false;
  let orbit = 0.6;
  let acc = 0;
  let last = performance.now();
  let lastBrake = false;

  const applySettings = () => {
    const s = load().settings;
    view.applySettings(viewSettings(s));
    audio.setVolumes(s.master, s.music, s.sfx);
    input.deadzone = s.deadzone;
    hud?.applySettings(s);
  };

  const menus: Menus = new Menus(ui, {
    click: () => { audio.start(); audio.uiClick(); audio.setMusic(state === 'playing' ? 'game' : 'menu'); },
    start: (m) => beginRun(m),
    previewTaxi: (id, color) => {
      sim = new Sim({ seed: 11, mode: 'arcade', taxi: id, traffic: 'calm', startCountdown: 1e9, hub: 1 });
      view.setSim(sim, color);
      view.menuMode = true;
    },
    settingsChanged: applySettings,
    resume: () => { state = 'playing'; menus.clear(); last = performance.now(); acc = 0; },
    restart: () => beginRun(mode),
    quit: () => toMenu(),
    back: () => toMenu(),
  });

  function toMenu(): void {
    hud?.destroy();
    hud = null;
    state = 'menu';
    resultsShown = false;
    endTimer = -1;
    const s = load();
    sim = new Sim({ seed: 11, mode: 'arcade', taxi: s.taxi, traffic: 'calm', startCountdown: 1e9, hub: 1 });
    view.setSim(sim, s.color);
    view.menuMode = true;
    audio.setMusic('menu');
    menus.main();
  }

  function beginRun(m: Mode): void {
    const s = load();
    mode = m;
    audio.start();
    hud?.destroy();
    const forced = Number(params.get('seed'));
    const seed = m === 'trial' ? 1 : forced > 0 ? forced : Math.floor(Math.random() * 1e9);
    const traffic = m === 'trial' ? 'normal' : s.traffic;
    sim = new Sim({ seed, mode: m, taxi: s.taxi, traffic, discovered: s.discovered });
    view.setSim(sim, s.color);
    view.menuMode = false;
    hud = new Hud(app, sim, view);
    hud.applySettings(s.settings);
    state = 'playing';
    resultsShown = false;
    endTimer = -1;
    acc = 0;
    menus.clear();
    audio.setMusic('game');
    input.clearPressed();
  }

  function dispatch(events: GameEvent[]): void {
    for (const e of events) {
      hud?.onEvent(e);
      view.onEvent(e);
      audio.onEvent(e);
      if (e.type === 'shortcut' && e.first) {
        const s = load();
        s.discovered = [...sim.discovered];
        save();
      }
      if (e.type === 'ended') endTimer = 2.6;
    }
  }

  function showResults(): void {
    const r = sim.result!;
    const s = load();
    s.discovered = [...sim.discovered];
    s.totalFares += r.deliveries;
    let newBest = false;
    if (r.mode === 'trial') {
      if (r.medal !== 'none' || sim.deliveries >= sim.trialChain.length) {
        const total = r.time;
        if (s.trialBest === null || total < s.trialBest) { s.trialBest = total; newBest = true; }
        s.trialMedal = r.medal ?? null;
      }
      save();
    } else {
      newBest = recordRun(r.mode, r.score, r.bestChain, r.deliveries, r.rank).newBest;
    }
    save();
    state = 'results';
    resultsShown = true;
    menus.results(r, { newBest, medal: r.medal });
    audio.rankSting(r.rank);
  }

  applySettings();
  setBoot(1, 'Ready');
  setTimeout(() => boot.classList.add('gone'), 250);

  // autostart for automated verification
  const auto = params.get('autostart') as Mode | null;
  if (auto) {
    const s = load();
    const t = params.get('taxi');
    if (t && t in TAXIS) s.taxi = t as keyof typeof TAXIS;
    const tr = params.get('traffic');
    if (tr === 'calm' || tr === 'normal' || tr === 'dense') s.traffic = tr;
    beginRun(auto);
  } else {
    menus.main();
    audio.setMusic('menu');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing' && sim.phase === 'running') { state = 'paused'; menus.pause(); }
  });
  input.onDisconnect = () => {
    if (state === 'playing' && sim.phase === 'running') { state = 'paused'; menus.pause(); }
  };
  window.addEventListener('resize', () => view.resize());
  window.addEventListener('keydown', (e) => {
    if (state === 'results' && (e.code === 'KeyR' || e.code === 'Enter') && document.activeElement === document.body) beginRun(mode);
    if (state === 'paused' && e.code === 'Escape') { state = 'playing'; menus.clear(); last = performance.now(); acc = 0; }
  });

  (window as unknown as Record<string, unknown>).__farestorm = { sim: () => sim, view, state: () => state, begin: beginRun, hud: () => hud, info: () => view.info, fast: (sec: number) => { for (let i = 0; i < sec * 60 && sim.phase !== 'ended'; i++) { sim.step(bot.next(sim)); dispatch(sim.drain()); } } };

  function frame(now: number): void {
    requestAnimationFrame(frame);
    const frameMs = Math.min(now - last, 100);
    last = now;
    const dt = frameMs / 1000;

    if (state === 'playing') {
      const actions = input.takeActions();
      if (actions.pause && sim.phase === 'running') { state = 'paused'; menus.pause(); }
      if (actions.camera) view.chase.cycle();
      if (actions.map) hud?.toggleMap();
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        const inp = botOn ? bot.next(sim) : sim.phase === 'running' || sim.phase === 'countdown' ? input.read() : IDLE;
        sim.step(inp);
        dispatch(sim.drain());
        acc -= STEP;
        steps++;
      }
      if (steps >= 5) acc = 0; // cap catch-up to keep input stable after hitches
      const brake = input.read().brake > 0.1;
      if (brake !== lastBrake) { view.setBrake(brake); lastBrake = brake; }
      if (sim.phase === 'ended' && endTimer >= 0) {
        endTimer -= dt;
        if (endTimer <= 0 && !resultsShown) showResults();
      }
    } else if (state === 'menu' || state === 'results') {
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 3) { sim.step(IDLE); sim.drain(); acc -= STEP; steps++; }
      if (steps >= 3) acc = 0;
    }

    const alpha = state === 'paused' ? 1 : Math.min(1, acc / STEP);
    if (state !== 'paused') view.update(alpha, dt, { camBack: state === 'playing' && input.lookBack });
    if (view.menuMode) {
      orbit += dt * 0.22;
      const v = sim.vehicle;
      const cam = view.chase.cam;
      const r = 8.2;
      const cx = v.x + Math.sin(orbit) * r, cz = v.z + Math.cos(orbit) * r;
      cam.position.set(cx, 2.5 + Math.sin(orbit * 0.7) * 0.4, cz);
      const rx = Math.cos(orbit), rz = -Math.sin(orbit);
      const shift = state === 'menu' ? -2.6 : -2.2;
      cam.lookAt(v.x + rx * shift, 1.0, v.z + rz * shift);
      cam.fov = 52;
      cam.updateProjectionMatrix();
    }
    if (state !== 'paused') view.render(frameMs);
    else view.renderer.render(view.scene, view.chase.cam);
    if (hud && state !== 'menu') hud.update(dt);
    audio.update(sim, dt, state === 'playing' || state === 'results');
  }
  requestAnimationFrame(frame);
}

main().catch((e) => {
  boot.classList.add('gone');
  const m = new Menus(ui, { click() {}, start() {}, previewTaxi() {}, settingsChanged() {}, resume() {}, restart() {}, quit() {}, back() {} });
  m.error('Something went wrong', `Startup failed: ${String(e)}. Reload to try again.`);
  console.error(e);
});
