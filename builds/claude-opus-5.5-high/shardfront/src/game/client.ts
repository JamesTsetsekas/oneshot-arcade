// Browser game client: owns the fixed-step loop, input → protocol commands, renderer, audio,
// overlays (health bars, selection box, command paths), minimap, alerts and the HUD read model.
import { ABILITIES, FACTIONS, STRUCTURES, TECHS, UNITS, buildPalette, requirementName } from '../faction-data';
import { MatchRunner } from './runner';
import { benchmarkOrders } from './scenario';
import { TUTORIAL_STEPS, type TutorialContext } from './tutorial';
import { GameRenderer } from '../renderer/renderer';
import { RTSCamera } from '../input-camera/camera';
import { keyLabel, type Action } from '../input-camera/bindings';
import { audio } from '../audio/audio';
import { Kind, type SimEvent } from '../simulation-core/types';
import { TPS } from '../simulation-core/sim';
import { terrainHeight, F_CHASM, F_ROCK, F_CLIFF } from '../world/map';
import type { MatchSetup, ReplayFile } from '../network-protocol/protocol';
import type { Settings } from '../persistence/store';
import { Store } from '../ui/store';

export interface CardButton {
  id: string; label: string; key: string; code: string; icon: string;
  cost?: { ore: number; flux: number; supply?: number; energy?: number };
  enabled: boolean; reason?: string; tooltip: string; detail?: string; active?: boolean; progress?: number;
}
export interface SelGroup { def: string; name: string; count: number; kind: 'unit' | 'structure' | 'neutral' | 'enemy' }
export interface Primary {
  id: number; name: string; def: string; owner: number; hp: number; maxHp: number; role: string; armor: number; tags: string[];
  weapon?: string; status: string[]; energy?: number; energyMax?: number; shield?: number; progress?: number; built: boolean;
  queue: { def: string; name: string; progress: number; paused: string; kind: string }[]; strongVs?: string; weakVs?: string; amount?: number;
  order?: string; carry?: string;
}
export interface AlertItem { id: number; text: string; kind: string; t: number; x?: number; y?: number }
export interface HudState {
  mode: MatchSetup['mode'] | 'replay';
  tick: number; time: string;
  ore: number; flux: number; supplyUsed: number; supplyCap: number; workers: number; idleWorkers: number; army: number;
  bases: { workers: number; ideal: number; fluxWorkers: number; fluxIdeal: number; oreLeft: number; travel: number }[];
  groups: SelGroup[]; primary: Primary | null; selectionCount: number; subgroup: string;
  card: CardButton[]; cardTitle: string;
  alerts: AlertItem[];
  objective: { title: string; text: string; step: number; total: number } | null;
  paused: boolean; speed: number; menuOpen: boolean;
  hint: string;
  perf: null | { fps: number; frameMs: number; simMs: number; calls: number; tris: number; entities: number; units: number; fields: number; heapMb: number };
  ctrlGroups: number[];
  replay: null | { hashOk: boolean; checked: number; players: { name: string; faction: string; ore: number; flux: number; supply: string; army: number }[] };
  aiStates: string[];
  faction: string;
  contextLost: boolean;
  gameOver: boolean;
  lateGame: boolean;
}

type Mode =
  | { m: 'normal' }
  | { m: 'attackMove' } | { m: 'patrol' } | { m: 'guard' } | { m: 'rally' }
  | { m: 'ability'; ability: string }
  | { m: 'build'; def: string }
  | { m: 'palette' };


const SLOT_LETTERS = ['Q', 'W', 'E', 'D', 'F', 'C', 'G'];

export class GameClient {
  readonly runner: MatchRunner;
  readonly renderer: GameRenderer;
  readonly cam = new RTSCamera();
  readonly hud: Store<HudState>;
  readonly viewer: number;
  private canvas: HTMLCanvasElement;
  private overlay: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private minimap: HTMLCanvasElement | null = null;
  private mmBase: ImageData | null = null;
  settings: Settings;
  selection = new Set<number>();
  private subgroupIdx = 0;
  controlGroups: number[][] = Array.from({ length: 10 }, () => []);
  private lastGroupTap = { n: -1, t: 0 };
  mode: Mode = { m: 'normal' };
  private hover = -1;
  private mouse = { x: 0, y: 0, inside: false, down: false, button: -1, sx: 0, sy: 0, dragging: false, mid: false, midWorld: { x: 0, y: 0 } };
  private keys = new Set<string>();
  private lastClick = { t: 0, id: -1, x: 0, y: 0 };
  private raf = 0;
  private lastFrame = 0;
  private acc = 0;
  paused = false;
  menuOpen = false;
  speed = 1;
  private alerts: AlertItem[] = [];
  private alertId = 1;
  private lastAlertPos: { x: number; y: number } | null = null;
  private lastAlertSound = new Map<string, number>();
  private hudTimer = 0;
  private perfOn = false;
  private debugNav = false;
  private fps = 60; private frameMs = 16; private simMs = 0;
  private tutorialStep = 0;
  private tutorialCtx: { lastCommands: string[]; cameraMoved: boolean } = { lastCommands: [], cameraMoved: false };
  private markers: { x: number; y: number; t: number; color: string }[] = [];
  private gameOverFired = false;
  private hidden = false;
  private benchmark: { frames: number[]; start: number; done: boolean; result: string } | null = null;
  onGameOver: (r: MatchRunner) => void = () => {};
  onMenu: () => void = () => {};
  onBenchmark: (summary: string) => void = () => {};
  private disposers: (() => void)[] = [];
  private combatHeat = 0;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement, setup: MatchSetup, settings: Settings, replay: ReplayFile | null = null) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.octx = overlay.getContext('2d')!;
    this.settings = settings;
    this.runner = new MatchRunner(setup, replay);
    this.viewer = replay ? -1 : 0;
    this.renderer = new GameRenderer(canvas, this.runner.sim, this.viewer, settings.graphics);
    const start = this.runner.sim.players[0];
    this.cam.jumpTo(replay || setup.mode === 'benchmark' ? (setup.mode === 'benchmark' ? 13 : 72) : start.startX + 6, replay ? 72 : setup.mode === 'benchmark' ? 70 : start.startY - 8, false);
    if (setup.mode === 'benchmark') { this.cam.height = this.cam.targetHeight = 52; }
    this.hud = new Store<HudState>(this.buildHud());
    audio.faction = replay ? 'helix' : start.faction;
    if (setup.mode === 'benchmark') { benchmarkOrders(this.runner.sim); this.benchmark = { frames: [], start: 0, done: false, result: '' }; }
    this.bind();
    this.resize();
  }

  // ------------------------------------------------------------------ lifecycle
  start() {
    this.lastFrame = performance.now();
    const loop = (t: number) => { this.raf = requestAnimationFrame(loop); this.frame(t); };
    this.raf = requestAnimationFrame(loop);
    audio.init();
    audio.startMusic();
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    for (const d of this.disposers) d();
    audio.stopMusic();
    this.renderer.dispose();
  }
  get sim() { return this.runner.sim; }

  private bind() {
    const c = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window | Document, ev: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn as EventListener, opts);
      this.disposers.push(() => el.removeEventListener(ev, fn as EventListener, opts));
    };
    on(c, 'pointerdown', (e: PointerEvent) => this.pointerDown(e));
    on(window, 'pointermove', (e: PointerEvent) => this.pointerMove(e));
    on(window, 'pointerup', (e: PointerEvent) => this.pointerUp(e));
    on(c, 'wheel', (e: WheelEvent) => { e.preventDefault(); this.cam.zoom(Math.sign(e.deltaY) * 0.12); this.tutorialCtx.cameraMoved = true; }, { passive: false });
    on(c, 'contextmenu', (e: MouseEvent) => e.preventDefault());
    on(c, 'pointerleave', () => { this.mouse.inside = false; });
    on(c, 'pointerenter', () => { this.mouse.inside = true; });
    on(window, 'keydown', (e: KeyboardEvent) => this.keyDown(e));
    on(window, 'keyup', (e: KeyboardEvent) => { this.keys.delete(e.code); });
    on(window, 'blur', () => this.keys.clear());
    on(window, 'resize', () => this.resize());
    on(document, 'visibilitychange', () => {
      // pause local play when the tab is hidden
      this.hidden = document.hidden;
      if (this.hidden) audio.suspend(); else { audio.resume(); this.lastFrame = performance.now(); }
    });
    on(c, 'webglcontextlost', (e: Event) => { e.preventDefault(); this.renderer.contextLost = true; this.paused = true; this.publishHud(); });
    on(c, 'webglcontextrestored', () => { this.renderer.contextLost = false; this.publishHud(); });
  }

  attachMinimap(el: HTMLCanvasElement | null) {
    this.minimap = el;
    if (!el) return;
    el.width = 220; el.height = 220;
    this.buildMinimapBase();
    const toWorld = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * this.sim.map.size, y: ((e.clientY - r.top) / r.height) * this.sim.map.size };
    };
    let dragging = false;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      const w = toWorld(e);
      if (e.button === 2) { this.contextCommand(w.x, w.y, -1, e.shiftKey, e.altKey); this.minimapPing(w.x, w.y); return; }
      if (e.button === 0 && this.mode.m !== 'normal' && this.mode.m !== 'palette' && this.mode.m !== 'build') { this.targetCommand(w.x, w.y, -1, e.shiftKey); return; }
      dragging = true;
      el.setPointerCapture(e.pointerId);
      this.cam.jumpTo(w.x, w.y, false);
      this.tutorialCtx.cameraMoved = true;
    };
    const move = (e: PointerEvent) => { if (dragging && (e.buttons & 1)) { const w = toWorld(e); this.cam.jumpTo(w.x, w.y, false); } else dragging = false; };
    const up = () => { dragging = false; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); window.addEventListener('pointerup', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    this.disposers.push(() => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); window.removeEventListener('pointerup', up); });
  }
  private minimapPing(x: number, y: number) { this.markers.push({ x, y, t: performance.now(), color: '#7ff5e0' }); audio.ui('ping'); }

  private buildMinimapBase() {
    const map = this.sim.map;
    const n = map.size;
    const img = new ImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const f = map.flags[i], lv = map.level[i];
      let c = [[38, 42, 50], [66, 72, 82], [128, 124, 116]][lv];
      if (f & F_CHASM) c = [8, 28, 34];
      else if (f & (F_ROCK | F_CLIFF)) c = [24, 25, 30];
      img.data.set([c[0], c[1], c[2], 255], i * 4);
    }
    this.mmBase = img;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.resize(w, h);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.overlay.width = Math.round(w * dpr); this.overlay.height = Math.round(h * dpr);
    this.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ------------------------------------------------------------------ frame loop (fixed 20 Hz sim, interpolated render)
  private frame(now: number) {
    const rawDt = Math.min(0.25, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.fps = this.fps * 0.95 + (1 / Math.max(1e-3, rawDt)) * 0.05;
    this.frameMs = this.frameMs * 0.9 + rawDt * 1000 * 0.1;
    if (this.hidden) return;
    const running = !this.paused && !this.menuOpen && !this.renderer.contextLost && !this.tutorialPaused();
    const sim = this.sim;
    if (running && !sim.over) {
      this.acc += rawDt * this.speed;
      const t0 = performance.now();
      let steps = 0;
      while (this.acc >= 1 / TPS && steps < 8 * Math.max(1, this.speed)) {
        this.acc -= 1 / TPS;
        this.runner.step();
        this.drainEvents();
        steps++;
      }
      if (steps) this.simMs = this.simMs * 0.8 + ((performance.now() - t0) / steps) * 0.2;
      if (this.acc > 0.5) this.acc = 0;
    }
    // camera uses unscaled render time
    this.updateCamera(rawDt);
    const alpha = running ? Math.min(1, this.acc * TPS) : 1;
    this.renderer.camTarget.set(this.cam.x, 0, this.cam.z);
    this.cam.apply(this.renderer.camera);
    this.updateHover();
    this.renderer.render(alpha, rawDt, this.selection, this.hover);
    this.drawOverlay(alpha);
    if (this.minimap && (Math.floor(now / 100) !== Math.floor((now - rawDt * 1000) / 100))) this.drawMinimap();
    this.hudTimer -= rawDt;
    if (this.hudTimer <= 0) { this.hudTimer = 0.1; this.publishHud(); }
    this.updateTutorial();
    if (sim.over && !this.gameOverFired) {
      this.gameOverFired = true;
      audio.ui(this.viewer < 0 || sim.winner === this.viewer ? 'victory' : 'defeat', 0);
      this.publishHud();
      setTimeout(() => this.onGameOver(this.runner), 2200);
    }
    if (this.benchmark && !this.benchmark.done) {
      const b = this.benchmark;
      if (!b.start) b.start = now;
      if (now - b.start > 2000) b.frames.push(rawDt * 1000);
      if (now - b.start > 22000) {
        b.done = true;
        const sorted = b.frames.slice().sort((x, y) => x - y);
        const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
        const units = sim.unitsOf(0).length + sim.unitsOf(1).length;
        b.result = `Benchmark: median ${(1000 / med).toFixed(1)} FPS (${med.toFixed(2)} ms), 1% low ${(1000 / p99).toFixed(1)} FPS, ${b.frames.length} frames, ${units} units alive at end, sim ${this.simMs.toFixed(2)} ms/tick, ${this.renderer.stats().calls} draw calls`;
        this.onBenchmark(b.result);
      }
    }
  }

  private tutorialPaused() { return false; }

  private updateCamera(dt: number) {
    const b = this.settings.bindings;
    let dx = 0, dz = 0;
    if (this.keys.has(b.panLeft)) dx -= 1;
    if (this.keys.has(b.panRight)) dx += 1;
    if (this.keys.has(b.panUp)) dz -= 1;
    if (this.keys.has(b.panDown)) dz += 1;
    if (this.settings.camera.edgeScroll && this.mouse.inside && document.hasFocus()) {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight, m = 8;
      if (this.mouse.x < m) dx -= 1; else if (this.mouse.x > w - m) dx += 1;
      if (this.mouse.y < m) dz -= 1; else if (this.mouse.y > h - m) dz += 1;
    }
    if (dx || dz) { this.cam.pan(dx * this.settings.camera.panSpeed, dz * this.settings.camera.panSpeed, dt, this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')); this.tutorialCtx.cameraMoved = true; }
    this.cam.update(dt);
  }

  // ------------------------------------------------------------------ events → feedback, alerts
  private drainEvents() {
    const sim = this.sim;
    const evs = sim.events;
    sim.events = [];
    this.renderer.handleEvents(evs);
    for (const ev of evs) this.eventAudio(ev);
  }

  private screenPan(x: number, y: number): { pan: number; dist: number; onScreen: boolean } {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const p = this.renderer.project(x, terrainHeight(this.sim.map, x, y), y, w, h);
    const onScreen = p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h;
    return { pan: (p.x / w) * 2 - 1, dist: Math.hypot(x - this.cam.x, y - this.cam.z) * 0.6 + (this.cam.height - 24) * 0.25, onScreen };
  }

  private eventAudio(ev: SimEvent) {
    const sim = this.sim;
    const vis = this.renderer.cellVisible(ev.x ?? 0, ev.y ?? 0);
    switch (ev.type) {
      case 'shot': {
        if (!vis) return;
        const sp = this.screenPan(ev.x ?? 0, ev.y ?? 0);
        const k = ev.kind;
        const name = k === 'rifle' ? 'rifle' : k === 'arc' ? 'arc' : k === 'lance' ? 'lance' : k === 'shell' ? 'shell' : k === 'spore' ? 'spore' : k === 'needle' ? 'needle' : k === 'eruption' ? 'spore' : k === 'torch' ? 'torch' : 'melee';
        audio.play(name, sp.pan, sp.dist, name === 'rifle' ? 35 : 60);
        this.combatHeat = Math.min(40, this.combatHeat + 0.4);
        break;
      }
      case 'impact': {
        if (!vis) return;
        if (ev.kind === 'shell' || ev.kind === 'eruption') { const sp = this.screenPan(ev.x ?? 0, ev.y ?? 0); audio.play(ev.kind === 'shell' ? 'boom' : 'eruption', sp.pan, sp.dist, 90); }
        break;
      }
      case 'death': {
        if (ev.kind === 'silent' || !vis) return;
        const sp = this.screenPan(ev.x ?? 0, ev.y ?? 0);
        const def = ev.def ?? '';
        if (def === 'barrier') audio.play('crystal', sp.pan, sp.dist * 0.5, 100);
        else if (STRUCTURES[def]) audio.play('death_struct', sp.pan, sp.dist, 150);
        else if (UNITS[def]) audio.play(UNITS[def].faction === 'helix' ? 'death_mech' : 'death_bio', sp.pan, sp.dist, 70);
        this.combatHeat = Math.min(40, this.combatHeat + 2);
        break;
      }
      case 'pulse': audio.ui('pulse', 0); break;
      case 'alert': {
        if (this.viewer >= 0 && ev.owner !== this.viewer) return;
        if (this.viewer < 0 && ev.kind !== 'info') return;
        this.pushAlert(ev.text ?? '', ev.kind ?? 'info', ev.x, ev.y);
        break;
      }
      case 'queued': if (ev.owner === this.viewer) audio.ui('queue', 40); break;
    }
    void sim;
  }

  private pushAlert(text: string, kind: string, x?: number, y?: number) {
    const now = performance.now();
    if (kind === 'unit') { audio.ui('alert_unit', 300); return; } // unit-ready is audio only (no text spam)
    // de-duplicate identical text within 3 s
    if (this.alerts.some((a) => a.text === text && now - a.t < 3000)) return;
    const priority: Record<string, number> = { attack: 5, supply: 4, resources: 3, invalid: 3, depleted: 3, research: 2, built: 1, expansion: 2, pylon: 2, info: 2 };
    this.alerts.push({ id: this.alertId++, text, kind, t: now, x, y });
    this.alerts.sort((a, b) => (priority[b.kind] ?? 0) - (priority[a.kind] ?? 0) || b.t - a.t);
    this.alerts = this.alerts.slice(0, 5);
    if (x !== undefined && y !== undefined && (kind === 'attack' || kind === 'built' || kind === 'research' || kind === 'pylon' || kind === 'depleted' || kind === 'expansion')) this.lastAlertPos = { x, y };
    const sound = kind === 'invalid' ? 'invalid' : 'alert_' + kind;
    const last = this.lastAlertSound.get(kind) ?? 0;
    const gap = kind === 'attack' ? 6000 : 1200;
    if (now - last > gap) { this.lastAlertSound.set(kind, now); audio.ui(sound, 0); }
    if (kind === 'attack') audio.setIntensity(1);
  }

  // ------------------------------------------------------------------ input
  private localPos(e: { clientX: number; clientY: number }) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private pointerDown(e: PointerEvent) {
    audio.init();
    this.canvas.focus();
    const p = this.localPos(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    if (e.button === 1) {
      e.preventDefault();
      this.mouse.mid = true;
      this.mouse.midWorld = this.renderer.pickGround(p.x, p.y, this.canvas.clientWidth, this.canvas.clientHeight);
      return;
    }
    if (e.button === 2) {
      if (this.mode.m !== 'normal' && this.mode.m !== 'palette') { this.mode = { m: 'normal' }; this.renderer.placement = null; this.publishHud(); return; }
      const w = this.renderer.pickGround(p.x, p.y, this.canvas.clientWidth, this.canvas.clientHeight);
      this.contextCommand(w.x, w.y, this.pickEntity(p.x, p.y), e.shiftKey, e.altKey);
      return;
    }
    if (e.button === 0) {
      const w = this.renderer.pickGround(p.x, p.y, this.canvas.clientWidth, this.canvas.clientHeight);
      if (this.mode.m === 'build') { this.placeBuilding(w.x, w.y, e.shiftKey); return; }
      if (this.mode.m !== 'normal' && this.mode.m !== 'palette') { this.targetCommand(w.x, w.y, this.pickEntity(p.x, p.y), e.shiftKey); return; }
      this.mouse.down = true; this.mouse.button = 0; this.mouse.sx = p.x; this.mouse.sy = p.y; this.mouse.dragging = false;
    }
  }

  private pointerMove(e: PointerEvent) {
    const p = this.localPos(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    if (this.mouse.mid) {
      const w = this.renderer.pickGround(p.x, p.y, this.canvas.clientWidth, this.canvas.clientHeight);
      this.cam.panWorld(this.mouse.midWorld.x - w.x, this.mouse.midWorld.y - w.y);
      this.cam.apply(this.renderer.camera);
      this.tutorialCtx.cameraMoved = true;
      return;
    }
    if (this.mouse.down && !this.mouse.dragging && Math.hypot(p.x - this.mouse.sx, p.y - this.mouse.sy) > 5) this.mouse.dragging = true;
    if (this.mode.m === 'build') this.updatePlacementPreview();
  }

  private pointerUp(e: PointerEvent) {
    if (e.button === 1) { this.mouse.mid = false; return; }
    if (e.button !== 0 || !this.mouse.down) return;
    this.mouse.down = false;
    const p = this.localPos(e);
    if (this.mouse.dragging) this.boxSelect(this.mouse.sx, this.mouse.sy, p.x, p.y, e.shiftKey);
    else this.clickSelect(p.x, p.y, e.shiftKey, e.ctrlKey || e.metaKey);
    this.mouse.dragging = false;
  }

  private entityScreen(id: number): { x: number; y: number; r: number } | null {
    const sim = this.sim;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const k = sim.kind[id];
    const x = sim.x[id], y = sim.y[id];
    let hh = terrainHeight(sim.map, x, y);
    let r = sim.radius[id];
    if (k === Kind.Unit && sim.isHover(id)) hh += 1.8;
    if (k === Kind.Unit) hh += 0.5; else hh += 0.8;
    if (k === Kind.Structure) r = sim.sdef(id).size * 0.6;
    const p = this.renderer.project(x, hh, y, w, h);
    if (p.behind) return null;
    const p2 = this.renderer.project(x + r, hh, y, w, h);
    return { x: p.x, y: p.y, r: Math.max(10, Math.abs(p2.x - p.x) * 1.25) };
  }

  /** visible, selectable entity under the cursor (screen-space picking; DPR independent) */
  pickEntity(sx: number, sy: number): number {
    const sim = this.sim;
    let best = -1, bd = 1e9;
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id]) continue;
      const k = sim.kind[id];
      if (k === Kind.None) continue;
      if (this.viewer >= 0 && sim.owner[id] !== this.viewer) {
        if (k === Kind.Unit || k === Kind.Structure || k === Kind.Spike) { if (!sim.isVisibleTo(this.viewer, id)) continue; }
        else if (!sim.players[this.viewer].explored[Math.floor(sim.y[id]) * sim.map.size + Math.floor(sim.x[id])]) continue;
      }
      const s = this.entityScreen(id);
      if (!s) continue;
      const d = Math.hypot(s.x - sx, s.y - sy);
      if (d > s.r) continue;
      const score = d / s.r + (k === Kind.Unit ? 0 : 0.6);
      if (score < bd) { bd = score; best = id; }
    }
    return best;
  }

  private updateHover() {
    if (!this.mouse.inside || this.mouse.mid) { this.hover = -1; return; }
    this.hover = this.pickEntity(this.mouse.x, this.mouse.y);
  }

  private isOwn(id: number) { return this.viewer >= 0 && this.sim.owner[id] === this.viewer; }

  private setSelection(ids: Iterable<number>) {
    this.selection = new Set(ids);
    this.subgroupIdx = 0;
    if (this.mode.m === 'palette') this.mode = { m: 'normal' };
    if (this.mode.m === 'build') { this.mode = { m: 'normal' }; this.renderer.placement = null; }
    const first = [...this.selection][0];
    if (first !== undefined && this.isOwn(first)) audio.ui('select', 80);
    this.publishHud();
  }

  private clickSelect(sx: number, sy: number, shift: boolean, ctrl: boolean) {
    const id = this.pickEntity(sx, sy);
    const now = performance.now();
    const dbl = id > 0 && this.lastClick.id === id && now - this.lastClick.t < 320;
    this.lastClick = { t: now, id, x: sx, y: sy };
    if (id < 0) { if (!shift) this.setSelection([]); return; }
    if ((dbl || ctrl) && this.sim.kind[id] === Kind.Unit) {
      // all visible units of the same type & owner on screen
      const def = this.sim.def[id], owner = this.sim.owner[id];
      const same = this.onScreenIds().filter((j) => this.sim.kind[j] === Kind.Unit && this.sim.def[j] === def && this.sim.owner[j] === owner);
      this.setSelection(shift ? [...this.selection, ...same] : same);
      return;
    }
    if (shift && this.isOwn(id) && [...this.selection].every((s) => this.isOwn(s))) {
      const next = new Set(this.selection);
      if (next.has(id)) next.delete(id); else next.add(id);
      this.setSelection(next);
      return;
    }
    this.setSelection([id]);
  }

  private onScreenIds(): number[] {
    const out: number[] = [];
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const sim = this.sim;
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.kind[id] !== Kind.Unit) continue;
      if (this.viewer >= 0 && sim.owner[id] !== this.viewer && !sim.isVisibleTo(this.viewer, id)) continue;
      const s = this.entityScreen(id);
      if (s && s.x >= 0 && s.y >= 0 && s.x <= w && s.y <= h) out.push(id);
    }
    return out;
  }

  private boxSelect(x0: number, y0: number, x1: number, y1: number, shift: boolean) {
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1), minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    const sim = this.sim;
    const units: number[] = [];
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.kind[id] !== Kind.Unit) continue;
      if (this.viewer >= 0 && sim.owner[id] !== this.viewer) continue;
      const s = this.entityScreen(id);
      if (!s) continue;
      if (s.x >= minX - 4 && s.x <= maxX + 4 && s.y >= minY - 4 && s.y <= maxY + 4) units.push(id);
    }
    if (!units.length) { if (!shift) this.setSelection([]); return; }
    this.setSelection(shift ? [...this.selection, ...units] : units);
  }

  private selectedOwn(): number[] { return [...this.selection].filter((id) => this.sim.alive[id] && this.isOwn(id)); }
  private selectedUnits(): number[] { return this.selectedOwn().filter((id) => this.sim.kind[id] === Kind.Unit); }
  private selectedStructs(): number[] { return this.selectedOwn().filter((id) => this.sim.kind[id] === Kind.Structure); }

  issue(kind: Parameters<GameClient['sim']['issue']>[0]['kind'], extra: Partial<Parameters<GameClient['sim']['issue']>[0]>, ids: number[]) {
    if (this.viewer < 0 || this.sim.over) return;
    this.sim.issue({ player: this.viewer, kind, ids, ...extra });
    this.tutorialCtx.lastCommands.push(kind);
    if (this.tutorialCtx.lastCommands.length > 30) this.tutorialCtx.lastCommands.shift();
  }

  /** Right-click: contextual move / attack / gather / repair / capture / rally. */
  private contextCommand(x: number, y: number, target: number, queued: boolean, force: boolean) {
    const sim = this.sim;
    const units = this.selectedUnits();
    const structs = this.selectedStructs();
    if (!units.length && structs.length) {
      const t = target > 0 && (sim.kind[target] === Kind.Ore || (sim.kind[target] === Kind.Structure && this.isOwn(target))) ? target : -1;
      this.issue('rally', { x, y, target: t }, structs);
      this.marker(x, y, '#7ff5e0');
      audio.ui('click');
      return;
    }
    if (!units.length) return;
    const k = target > 0 ? sim.kind[target] : -1;
    const workers = units.filter((u) => sim.udef(u).worker);
    if (target > 0 && !force) {
      const enemy = sim.owner[target] >= 0 && sim.owner[target] !== this.viewer;
      if (enemy && (k === Kind.Unit || k === Kind.Structure || k === Kind.Spike)) {
        this.issue('attack', { target, queued }, units);
        this.marker(sim.x[target], sim.y[target], '#ff5c5c');
        audio.ui('ack_attack', 120);
        return;
      }
      if (k === Kind.Barrier) { this.issue('attack', { target, queued }, units); this.marker(sim.x[target], sim.y[target], '#ff5c5c'); audio.ui('ack_attack', 120); return; }
      if (k === Kind.Pylon) { this.issue('capture', { target, queued }, units); this.marker(sim.x[target], sim.y[target], '#ffe27a'); audio.ui('ack_move', 120); return; }
      if (workers.length && (k === Kind.Ore || (k === Kind.Structure && this.isOwn(target) && sim.sdef(target).isExtractor && sim.built[target]))) {
        this.issue('gather', { target, queued }, workers);
        const rest = units.filter((u) => !workers.includes(u));
        if (rest.length) this.issue('move', { x, y, queued }, rest);
        this.marker(sim.x[target], sim.y[target], '#5ff0e0');
        audio.ui('ack_move', 120);
        return;
      }
      if (k === Kind.Vent && workers.length) { this.pushAlert(`Build a ${STRUCTURES[FACTIONS[sim.players[this.viewer].faction].extractor].name} on the vent first`, 'invalid'); return; }
      if (this.isOwn(target) && target !== units[0]) {
        const fabs = units.filter((u) => sim.udef(u).id === 'fabricator');
        const needs = (sim.kind[target] === Kind.Structure && (!sim.built[target] || sim.hp[target] < sim.maxHp[target])) || (sim.kind[target] === Kind.Unit && sim.hp[target] < sim.maxHp[target]);
        if (fabs.length && needs && sim.tagsOf(target).includes('Mechanical')) {
          this.issue('repair', { target, queued }, fabs);
          this.marker(sim.x[target], sim.y[target], '#ffe27a');
          audio.ui('ack_build', 120);
          return;
        }
        if (sim.kind[target] === Kind.Unit) {
          this.issue('guard', { target, queued }, units.filter((u) => u !== target));
          this.marker(sim.x[target], sim.y[target], '#5cff8a');
          audio.ui('ack_move', 120);
          return;
        }
      }
    }
    this.issue('move', { x, y, queued, force }, units);
    this.marker(x, y, force ? '#ffd27a' : '#5cff8a');
    audio.ui('ack_move', 120);
  }

  /** left-click in a targeting mode */
  private targetCommand(x: number, y: number, target: number, queued: boolean) {
    const sim = this.sim;
    const units = this.selectedUnits();
    const m = this.mode;
    const keep = queued; // shift keeps the mode active for chaining
    if (m.m === 'attackMove') {
      if (target > 0 && sim.owner[target] >= 0 && sim.owner[target] !== this.viewer) this.issue('attack', { target, queued }, units);
      else this.issue('attackMove', { x, y, queued }, units);
      this.marker(x, y, '#ff5c5c'); audio.ui('ack_attack', 120);
    } else if (m.m === 'patrol') { this.issue('patrol', { x, y, queued }, units); this.marker(x, y, '#7fb8ff'); audio.ui('ack_move', 120); }
    else if (m.m === 'guard') {
      if (target > 0 && this.isOwn(target)) { this.issue('guard', { target, queued }, units.filter((u) => u !== target)); audio.ui('ack_move', 120); }
      else { audio.ui('invalid'); this.pushAlert('Guard: target a friendly unit or structure', 'invalid'); }
    } else if (m.m === 'rally') {
      const structs = this.selectedStructs();
      this.issue('rally', { x, y, target: target > 0 && sim.kind[target] === Kind.Ore ? target : -1 }, structs);
      this.marker(x, y, '#7ff5e0'); audio.ui('click');
    } else if (m.m === 'ability') {
      const ab = ABILITIES[m.ability];
      if (ab.target === 'unit') {
        if (!(target > 0)) { audio.ui('invalid'); this.pushAlert(`${ab.name}: choose a target`, 'invalid'); return; }
        this.issue('ability', { def: ab.id, target, queued }, units);
      } else this.issue('ability', { def: ab.id, x, y, queued }, units);
      this.marker(x, y, '#c08bff'); audio.ui('ack_attack', 120);
    }
    if (!keep) { this.mode = { m: 'normal' }; }
    this.publishHud();
  }

  private placeBuilding(x: number, y: number, queued: boolean) {
    if (this.mode.m !== 'build') return;
    const def = this.mode.def;
    const workers = this.selectedUnits().filter((u) => this.sim.udef(u).worker);
    if (!workers.length) { this.mode = { m: 'normal' }; this.renderer.placement = null; return; }
    const { tx, ty } = this.sim.snapFootprint(def, x, y);
    const pl = this.sim.checkPlacement(this.viewer, def, tx, ty, workers[0]);
    if (!pl.ok) { audio.ui('invalid'); this.pushAlert(pl.reason, 'invalid'); return; }
    // closest selected worker builds
    const d = STRUCTURES[def];
    workers.sort((a, b) => Math.hypot(this.sim.x[a] - tx - d.size / 2, this.sim.y[a] - ty - d.size / 2) - Math.hypot(this.sim.x[b] - tx - d.size / 2, this.sim.y[b] - ty - d.size / 2));
    this.issue('build', { def, x: tx, y: ty, queued }, [workers[0]]);
    audio.ui('ack_build');
    if (!queued) { this.mode = { m: 'normal' }; this.renderer.placement = null; }
    this.publishHud();
  }

  private updatePlacementPreview() {
    if (this.mode.m !== 'build') { this.renderer.placement = null; return; }
    const def = this.mode.def;
    const w = this.renderer.pickGround(this.mouse.x, this.mouse.y, this.canvas.clientWidth, this.canvas.clientHeight);
    const { tx, ty } = this.sim.snapFootprint(def, w.x, w.y);
    const pl = this.sim.checkPlacement(this.viewer, def, tx, ty, this.selectedUnits()[0] ?? -1);
    const zones: { x: number; y: number; r: number }[] = [];
    for (const s of this.sim.structuresOf(this.viewer)) { const sd = this.sim.sdef(s); if (sd.zoneRadius && this.sim.built[s]) zones.push({ x: this.sim.x[s], y: this.sim.y[s], r: sd.zoneRadius }); }
    this.renderer.placement = { def, tx, ty, cells: pl.cells, ok: pl.ok, zones };
    this.placementReason = pl.ok ? '' : pl.reason;
  }
  private placementReason = '';

  private marker(x: number, y: number, color: string) { this.markers.push({ x, y, t: performance.now(), color }); }

  private keyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.target as HTMLElement | null)?.closest?.('[data-rebind]')) return;
    const b = this.settings.bindings;
    const code = e.code;
    if (['Tab', 'Space', 'F10', 'F9', 'Backquote', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(code) || code.startsWith('Digit')) e.preventDefault();
    if (e.repeat && !code.startsWith('Arrow')) { this.keys.add(code); return; }
    this.keys.add(code);
    if (code === 'F11') { e.preventDefault(); if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.(); return; }
    if (code === 'Escape' || code === b.menu) {
      if (code === 'Escape' && this.mode.m !== 'normal') { this.mode = { m: 'normal' }; this.renderer.placement = null; this.publishHud(); return; }
      this.toggleMenu();
      return;
    }
    if (this.menuOpen) return;
    if (code === b.perf) { this.perfOn = !this.perfOn; this.publishHud(); return; }
    if (code === b.debugNav) { this.debugNav = !this.debugNav; this.renderer.setDebugOverlay(this.debugNav); return; }
    // control groups
    if (code.startsWith('Digit')) {
      const n = parseInt(code.slice(5), 10);
      if (Number.isNaN(n)) return;
      if (e.ctrlKey || e.metaKey) { this.controlGroups[n] = this.selectedOwn(); audio.ui('click'); this.publishHud(); return; }
      if (e.shiftKey) { this.controlGroups[n] = [...new Set([...this.controlGroups[n], ...this.selectedOwn()])]; audio.ui('click'); this.publishHud(); return; }
      const g = this.controlGroups[n].filter((id) => this.sim.alive[id]);
      this.controlGroups[n] = g;
      if (!g.length) return;
      const now = performance.now();
      if (this.lastGroupTap.n === n && now - this.lastGroupTap.t < 350) this.focusOn(g);
      this.lastGroupTap = { n, t: now };
      this.setSelection(g);
      return;
    }
    // command card hotkeys take priority over global actions
    const card = this.hud.get().card;
    const btn = card.find((c) => c.code === code);
    if (btn) { e.preventDefault(); this.pressButton(btn.id); return; }
    const act = (Object.keys(b) as Action[]).find((k) => b[k] === code);
    switch (act) {
      case 'alert': if (this.lastAlertPos) { this.cam.jumpTo(this.lastAlertPos.x, this.lastAlertPos.y + 4); } break;
      case 'home': { const p = this.sim.players[Math.max(0, this.viewer)]; this.cam.jumpTo(p.startX + 4, p.startY - 6); break; }
      case 'focus': this.focusOn(this.selectedOwn().length ? this.selectedOwn() : [...this.selection]); break;
      case 'cycle': this.cycleSubgroup(e.shiftKey ? -1 : 1); break;
    }
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; this.mode = { m: 'normal' }; this.renderer.placement = null; this.publishHud(); }
  setMenuOpen(v: boolean) { this.menuOpen = v; this.lastFrame = performance.now(); this.publishHud(); }

  focusOn(ids: number[]) {
    const live = ids.filter((id) => this.sim.alive[id]);
    if (!live.length) return;
    let x = 0, y = 0;
    for (const id of live) { x += this.sim.x[id]; y += this.sim.y[id]; }
    this.cam.jumpTo(x / live.length, y / live.length + 2);
  }

  private subgroups(): string[] {
    const defs: string[] = [];
    for (const id of this.selectedOwn()) { const d = this.sim.defName(id); if (!defs.includes(d)) defs.push(d); }
    return defs;
  }
  private cycleSubgroup(dir: number) {
    const g = this.subgroups();
    if (g.length < 2) return;
    this.subgroupIdx = (this.subgroupIdx + dir + g.length) % g.length;
    this.publishHud();
  }
  private activeSubgroup(): string { const g = this.subgroups(); return g[this.subgroupIdx % Math.max(1, g.length)] ?? ''; }

  /** Select a single entity from the HUD (portrait click) or narrow to a type. */
  selectOnly(def: string) {
    const ids = [...this.selection].filter((id) => this.sim.alive[id] && this.sim.defName(id) === def);
    this.setSelection(ids);
  }
  cancelQueue(index: number) {
    const s = this.hud.get().primary;
    if (!s) return;
    this.issue('cancel', { index }, [s.id]);
    audio.ui('click');
  }

  // ------------------------------------------------------------------ command card
  pressButton(id: string) {
    const sim = this.sim;
    const units = this.selectedUnits();
    const structs = this.selectedStructs();
    const btn = this.hud.get().card.find((c) => c.id === id);
    if (btn && !btn.enabled) { audio.ui('invalid'); this.pushAlert(btn.reason ?? 'Unavailable', btn.reason?.includes('Ore') || btn.reason?.includes('Flux') ? 'resources' : 'invalid'); return; }
    const [kind, arg] = id.split(':');
    switch (kind) {
      case 'stop': this.issue('stop', {}, [...units, ...structs]); audio.ui('click'); break;
      case 'hold': this.issue('hold', {}, units); audio.ui('click'); break;
      case 'attackMove': this.mode = { m: 'attackMove' }; break;
      case 'patrol': this.mode = { m: 'patrol' }; break;
      case 'guard': this.mode = { m: 'guard' }; break;
      case 'rally': this.mode = { m: 'rally' }; break;
      case 'palette': this.mode = { m: 'palette' }; break;
      case 'back': this.mode = { m: 'normal' }; this.renderer.placement = null; break;
      case 'build': this.mode = { m: 'build', def: arg }; this.updatePlacementPreview(); break;
      case 'train': this.issue('train', { def: arg }, structs.filter((s) => sim.sdef(s).trains.includes(arg))); break;
      case 'research': this.issue('research', { def: arg }, structs.filter((s) => sim.sdef(s).researches.includes(arg))); audio.ui('click'); break;
      case 'cancelBuild': this.issue('cancel', { index: -1 }, structs.filter((s) => !sim.built[s])); audio.ui('click'); break;
      case 'ability': {
        const ab = ABILITIES[arg];
        if (ab.target === 'toggle' || ab.target === 'none') { this.issue('ability', { def: arg }, units.filter((u) => sim.udef(u).abilities.includes(arg))); audio.ui('ack_attack', 100); }
        else this.mode = { m: 'ability', ability: arg };
        break;
      }
    }
    this.publishHud();
  }

  private slotCode(letter: string): string {
    const i = SLOT_LETTERS.indexOf(letter);
    return i >= 0 ? this.settings.bindings[`slot${i + 1}` as Action] : 'Key' + letter;
  }

  private buildCard(): { title: string; card: CardButton[] } {
    const sim = this.sim;
    if (this.viewer < 0) return { title: '', card: [] };
    const p = sim.players[this.viewer];
    const b = this.settings.bindings;
    const units = this.selectedUnits();
    const structs = this.selectedStructs();
    const card: CardButton[] = [];
    const afford = (c: { ore: number; flux: number }) => (p.ore < c.ore ? 'Not enough Prism Ore' : p.flux < c.flux ? 'Not enough Flux' : '');
    if (this.mode.m !== 'normal' && this.mode.m !== 'palette') {
      card.push({ id: 'back', label: 'Cancel', key: 'Esc', code: 'Escape', icon: '✕', enabled: true, tooltip: 'Cancel the current targeting mode (Esc or right-click).' });
      return { title: this.modeTitle(), card };
    }
    if (units.length) {
      const sub = this.activeSubgroup();
      const workers = units.filter((u) => sim.udef(u).worker);
      if (this.mode.m === 'palette' && workers.length) {
        for (const sd of buildPalette(p.faction)) {
          const miss = sim.missingRequirements(this.viewer, sd.requires);
          const reason = miss.length ? `Requires ${miss.map(requirementName).join(', ')}` : afford(sd.cost);
          card.push({ id: 'build:' + sd.id, label: sd.name, key: sd.hotkey, code: this.slotCode(sd.hotkey), icon: iconFor(sd.id), cost: sd.cost, enabled: !reason, reason, tooltip: sd.role, detail: structureDetail(sd.id) });
        }
        card.push({ id: 'back', label: 'Back', key: 'Esc', code: 'Escape', icon: '↩', enabled: true, tooltip: 'Return to unit commands.' });
        return { title: 'Construction', card };
      }
      const armed = units.some((u) => sim.udef(u).weapon);
      card.push({ id: 'attackMove', label: 'Attack', key: keyLabel(b.attackMove), code: b.attackMove, icon: '⚔', enabled: armed, reason: armed ? '' : 'Selected units cannot attack', tooltip: 'Attack-move: advance and engage every enemy on the way. Click an enemy to focus it.' });
      card.push({ id: 'stop', label: 'Stop', key: keyLabel(b.stop), code: b.stop, icon: '■', enabled: true, tooltip: 'Cancel all orders.' });
      card.push({ id: 'hold', label: 'Hold', key: keyLabel(b.hold), code: b.hold, icon: '⛉', enabled: true, tooltip: 'Hold position: never move, fire on targets in range.' });
      card.push({ id: 'patrol', label: 'Patrol', key: keyLabel(b.patrol), code: b.patrol, icon: '⇄', enabled: true, tooltip: 'Patrol between here and a point, engaging enemies.' });
      card.push({ id: 'guard', label: 'Guard', key: keyLabel(b.guard), code: b.guard, icon: '◎', enabled: true, tooltip: 'Follow and protect a friendly unit or structure.' });
      if (workers.length) card.push({ id: 'palette', label: 'Build', key: keyLabel(b.build), code: b.build, icon: '⌂', enabled: true, tooltip: 'Open the construction palette.' });
      // abilities of the active subgroup
      const subUnits = units.filter((u) => sim.defName(u) === sub);
      const ud = UNITS[sub];
      if (ud) for (const aid of ud.abilities) {
        const ab = ABILITIES[aid];
        const code = b[`slot${ab.slot + 1}` as Action];
        const ready = subUnits.some((u) => (sim.ext[u].abilityReady[aid] ?? 0) <= sim.tick && sim.ext[u].energy >= (ab.energy ?? 0));
        const cdLeft = Math.min(...subUnits.map((u) => Math.max(0, (sim.ext[u].abilityReady[aid] ?? 0) - sim.tick)));
        const reason = !ready ? (ab.energy && subUnits.every((u) => sim.ext[u].energy < (ab.energy ?? 0)) ? 'Not enough energy' : `Cooling down (${Math.ceil(cdLeft / 20)} s)`) : ab.cost ? afford(ab.cost) : '';
        const active = ab.target === 'toggle' && subUnits.some((u) => (aid === 'brace' ? sim.ext[u].braced : sim.ext[u].curled));
        card.push({ id: 'ability:' + aid, label: ab.name, key: keyLabel(code), code, icon: iconFor(aid), cost: ab.cost || ab.energy ? { ore: ab.cost?.ore ?? 0, flux: ab.cost?.flux ?? 0, energy: ab.energy } : undefined, enabled: !reason, reason, tooltip: ab.description, active, progress: ready ? undefined : 1 - cdLeft / ab.cooldown });
      }
      return { title: ud ? ud.name : 'Units', card };
    }
    if (structs.length) {
      const sub = this.activeSubgroup();
      const same = structs.filter((s) => sim.defName(s) === sub);
      const sd = STRUCTURES[sub];
      if (!sd) return { title: '', card };
      if (same.some((s) => !sim.built[s])) {
        card.push({ id: 'cancelBuild', label: 'Cancel', key: 'Esc', code: 'Escape', icon: '✕', enabled: true, tooltip: `Cancel construction and refund 75% (${Math.floor(sd.cost.ore * 0.75)} Ore${sd.cost.flux ? `, ${Math.floor(sd.cost.flux * 0.75)} Flux` : ''}).` });
        return { title: sd.name + ' (under construction)', card };
      }
      for (const uid of sd.trains) {
        const ud = UNITS[uid];
        const miss = sim.missingRequirements(this.viewer, ud.requires);
        const full = same.every((s) => sim.ext[s].queue.length >= 5);
        const reason = miss.length ? `Requires ${miss.map(requirementName).join(', ')}` : full ? 'Queue full' : afford(ud.cost);
        card.push({ id: 'train:' + uid, label: ud.name, key: ud.hotkey, code: this.slotCode(ud.hotkey), icon: iconFor(uid), cost: { ...ud.cost, supply: ud.supply }, enabled: !reason, reason, tooltip: ud.role, detail: unitDetail(uid) });
      }
      for (const tid of sd.researches) {
        const td = TECHS[tid];
        if (p.techs.has(tid)) continue;
        // show only the next level of each upgrade line
        if (td.requires.some((r) => TECHS[r] && !p.techs.has(r) && !sim.isResearching(this.viewer, r))) continue;
        const researching = sim.isResearching(this.viewer, tid);
        if (td.requires.some((r) => TECHS[r] && sim.isResearching(this.viewer, r))) continue;
        const miss = sim.missingRequirements(this.viewer, td.requires);
        const reason = researching ? 'Researching…' : miss.length ? `Requires ${miss.map(requirementName).join(', ')}` : afford(td.cost);
        card.push({ id: 'research:' + tid, label: td.name, key: td.hotkey, code: this.slotCode(td.hotkey), icon: iconFor(tid), cost: td.cost, enabled: !reason, reason, tooltip: td.description, detail: `Research time ${Math.round(td.time / 20)} s` });
      }
      if (sd.trains.length) card.push({ id: 'rally', label: 'Rally', key: keyLabel(b.rally), code: b.rally, icon: '⚑', enabled: true, tooltip: 'Set where new units gather. Right-click also sets the rally point; rally on ore sends new workers to mine.' });
      return { title: sd.name, card };
    }
    return { title: '', card };
  }
  private modeTitle() {
    const m = this.mode;
    if (m.m === 'attackMove') return 'Attack-move: left-click a target point (Shift to chain)';
    if (m.m === 'patrol') return 'Patrol: left-click a point';
    if (m.m === 'guard') return 'Guard: left-click a friendly unit';
    if (m.m === 'rally') return 'Rally: left-click a point or Prism Ore';
    if (m.m === 'ability') return `${ABILITIES[m.ability].name}: left-click a ${ABILITIES[m.ability].target === 'unit' ? 'target' : 'location'}`;
    if (m.m === 'build') return `Place ${STRUCTURES[m.def].name} (Shift to queue more)`;
    return '';
  }

  // ------------------------------------------------------------------ HUD read model
  publishHud() { this.hud.set(this.buildHud()); }

  private buildHud(): HudState {
    const sim = this.runner.sim;
    const v = Math.max(0, this.viewer);
    const p = sim.players[v];
    const secs = Math.floor(sim.tick / TPS);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const units = sim.unitsOf(v);
    let workers = 0, idle = 0, army = 0;
    for (const u of units) { const d = sim.udef(u); if (d.worker) { workers++; if (!sim.ext[u].orders.length) idle++; } else army += d.cost.ore + d.cost.flux; }
    // selection summary
    for (const id of [...this.selection]) if (!sim.alive[id] || (this.viewer >= 0 && sim.owner[id] !== this.viewer && !sim.isVisibleTo(this.viewer, id) && sim.kind[id] !== Kind.Ore && sim.kind[id] !== Kind.Vent && sim.kind[id] !== Kind.Pylon && sim.kind[id] !== Kind.Barrier)) this.selection.delete(id);
    const groupsMap = new Map<string, SelGroup>();
    for (const id of this.selection) {
      const def = sim.defName(id);
      const k = sim.kind[id];
      const name = UNITS[def]?.name ?? STRUCTURES[def]?.name ?? neutralName(def);
      const g = groupsMap.get(def) ?? { def, name, count: 0, kind: (sim.owner[id] >= 0 && sim.owner[id] !== this.viewer && this.viewer >= 0 ? 'enemy' : k === Kind.Unit ? 'unit' : k === Kind.Structure ? 'structure' : 'neutral') as SelGroup['kind'] };
      g.count++;
      groupsMap.set(def, g);
    }
    const sub = this.activeSubgroup();
    let primaryId: number | undefined = [...this.selection].find((id) => sim.defName(id) === sub) ?? [...this.selection][0];
    if (primaryId !== undefined && !sim.alive[primaryId]) primaryId = undefined;
    const primary = primaryId !== undefined ? this.describe(primaryId) : null;
    const { title, card } = this.buildCard();
    const now = performance.now();
    this.alerts = this.alerts.filter((a) => now - a.t < 7000);
    const step = sim.setup.mode === 'tutorial' ? TUTORIAL_STEPS[Math.min(this.tutorialStep, TUTORIAL_STEPS.length - 1)] : null;
    let perf: HudState['perf'] = null;
    if (this.perfOn) {
      const st = this.renderer.stats();
      let ents = 0, us = 0;
      for (let id = 1; id < sim.nextId; id++) if (sim.alive[id]) { ents++; if (sim.kind[id] === Kind.Unit) us++; }
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      perf = { fps: this.fps, frameMs: this.frameMs, simMs: this.simMs, calls: st.calls, tris: st.triangles, entities: ents, units: us, fields: sim.nav.stats.fieldsBuilt, heapMb: mem ? mem.usedJSHeapSize / 1048576 : 0 };
    }
    const replay = this.viewer < 0 ? {
      hashOk: this.runner.hashMismatch < 0, checked: Math.floor(sim.tick / 100),
      players: sim.players.map((pl) => {
        let a = 0; for (const u of sim.unitsOf(pl.id)) { const d = sim.udef(u); if (!d.worker) a += d.cost.ore + d.cost.flux; }
        return { name: pl.name, faction: pl.faction, ore: Math.floor(pl.ore), flux: Math.floor(pl.flux), supply: `${pl.supplyUsed}/${pl.supplyCap}`, army: a };
      }),
    } : null;
    // adaptive music intensity
    this.combatHeat *= 0.9;
    if (this.viewer >= 0 || true) audio.setIntensity(sim.tick >= 18 * 60 * TPS ? 3 : this.combatHeat > 8 ? 2 : this.combatHeat > 1.5 ? 1 : 0);
    return {
      mode: this.viewer < 0 ? 'replay' : sim.setup.mode, tick: sim.tick, time,
      ore: Math.floor(p.ore), flux: Math.floor(p.flux), supplyUsed: p.supplyUsed, supplyCap: p.supplyCap, workers, idleWorkers: idle, army,
      bases: this.viewer >= 0 ? sim.baseEconomy(v).map((b) => ({ workers: b.workers, ideal: b.ideal, fluxWorkers: b.fluxWorkers, fluxIdeal: b.fluxIdeal, oreLeft: b.oreLeft, travel: b.travel })) : [],
      groups: [...groupsMap.values()], primary, selectionCount: this.selection.size, subgroup: sub,
      card, cardTitle: title,
      alerts: this.alerts.slice(),
      objective: step ? { title: step.title, text: step.text, step: this.tutorialStep + 1, total: TUTORIAL_STEPS.length } : sim.setup.mode === 'skirmish' ? { title: 'Objective', text: `Destroy every enemy ${STRUCTURES[FACTIONS[sim.players[1].faction].hq].name}`, step: 0, total: 0 } : null,
      paused: this.paused, speed: this.speed, menuOpen: this.menuOpen,
      hint: this.mode.m === 'build' ? (this.placementReason || this.modeTitle()) : this.modeTitle(),
      perf, ctrlGroups: this.controlGroups.map((g) => g.filter((id) => sim.alive[id]).length),
      replay, aiStates: this.runner.ais.map((a) => `${a.difficulty}: ${a.state} / ${a.squad}`),
      faction: p.faction, contextLost: this.renderer.contextLost, gameOver: sim.over, lateGame: sim.tick >= 18 * 60 * TPS,
    };
  }

  private describe(id: number): Primary {
    const sim = this.sim;
    const k = sim.kind[id];
    const e = sim.ext[id];
    const status: string[] = [];
    const base: Primary = { id, name: '', def: sim.defName(id), owner: sim.owner[id], hp: Math.ceil(sim.hp[id]), maxHp: sim.maxHp[id], role: '', armor: sim.armorOf(id), tags: sim.tagsOf(id), status, queue: [], built: !!sim.built[id] };
    if (k === Kind.Unit) {
      const d = sim.udef(id);
      base.name = d.name; base.role = d.role; base.strongVs = d.strongVs; base.weakVs = d.weakVs;
      if (d.weapon) base.weapon = weaponText(d.weapon);
      if (d.energyMax) { base.energy = Math.floor(e.energy); base.energyMax = d.energyMax; }
      if (d.id === 'aegis_frame') base.shield = Math.floor(e.shield);
      if (e.slowUntil > sim.tick) status.push('Slowed');
      if (e.silencedUntil > sim.tick) status.push('Silenced');
      if (e.braced) status.push('Braced (+2 range, immobile)');
      if (e.curled) status.push('Curled (50% damage, immobile)');
      if (e.toggleTicks > 0) status.push('Transforming…');
      if (e.setup > 0 && d.weapon?.setupTicks) status.push(e.setup >= d.weapon.setupTicks ? 'Deployed' : 'Setting up…');
      if (e.speedBoostUntil > sim.tick) status.push('Frenzied (+35% speed)');
      const o = e.orders[0];
      base.order = !o ? 'Idle' : o.t === 'move' ? (o.attack ? 'Attack-moving' : 'Moving') : o.t === 'gather' ? `Harvesting (${e.phase})` : o.t === 'build' ? `Constructing ${STRUCTURES[o.def].name}` : o.t[0].toUpperCase() + o.t.slice(1);
      if (e.carryAmount > 0) base.carry = `${e.carryAmount.toFixed(0)} ${e.carry === 'ore' ? 'Ore' : 'Flux'}`;
    } else if (k === Kind.Structure) {
      const d = sim.sdef(id);
      base.name = d.name; base.role = d.role;
      if (d.weapon) base.weapon = weaponText(d.weapon);
      if (!sim.built[id]) base.progress = sim.progress[id];
      if (d.isExtractor) base.amount = Math.floor(e.amount);
      if (sim.owner[id] === this.viewer || this.viewer < 0) base.queue = e.queue.map((q) => ({ def: q.def, name: UNITS[q.def]?.name ?? TECHS[q.def]?.name ?? q.def, progress: q.progress / q.total, paused: q.paused === 'supply' ? 'Supply blocked' : q.paused === 'prereq' ? 'Missing prerequisite' : '', kind: q.kind }));
      if (d.zoneRadius) status.push(`${sim.players[Math.max(0, sim.owner[id])].faction === 'helix' ? 'Construction field' : 'Root zone'} radius ${d.zoneRadius}`);
      if (d.supply) status.push(`+${d.supply} supply`);
    } else {
      base.name = neutralName(sim.defName(id));
      if (k === Kind.Ore || k === Kind.Vent) { base.amount = Math.floor(e.amount); base.role = k === Kind.Ore ? 'Prism Ore seam. Workers mine 5 per trip; 2 workers per seam is ideal.' : 'Flux vent. Build an extractor on it, then assign 3 workers.'; }
      if (k === Kind.Pylon) { base.role = 'Neutral Watch Pylon. Right-click with any unit and stand nearby for 3 s to capture; grants wide vision until an enemy contests it.'; status.push(e.captureOwner < 0 ? 'Neutral' : e.captureOwner === this.viewer ? 'Yours' : 'Enemy'); if (e.contested) status.push('Contested'); }
      if (k === Kind.Barrier) base.role = 'Destructible crystal barrier sealing the central lower route. Attack it (right-click) to open a shorter path.';
      if (k === Kind.Pod) base.role = 'Salvage pod: walk any unit over it for a one-time 100 Ore + 40 Flux bundle.';
    }
    return base;
  }

  // ------------------------------------------------------------------ overlays
  private drawOverlay(alpha: number) {
    const ctx = this.octx;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const sim = this.sim;
    const map = sim.map;
    // command paths for selected own units, rally lines for selected structures
    ctx.lineWidth = 1.5;
    let drawn = 0;
    for (const id of this.selection) {
      if (!sim.alive[id] || !this.isOwn(id) || drawn > 24) continue;
      drawn++;
      const e = sim.ext[id];
      const pts: { x: number; y: number; c: string }[] = [];
      if (sim.kind[id] === Kind.Unit) {
        for (const o of e.orders) {
          if (o.t === 'move' || o.t === 'patrol') pts.push({ x: o.x, y: o.y, c: o.t === 'patrol' ? '#7fb8ff' : o.attack ? '#ff6b6b' : '#5cff8a' });
          else if ((o.t === 'attack' || o.t === 'gather' || o.t === 'repair' || o.t === 'capture' || o.t === 'guard') && sim.alive[o.target]) pts.push({ x: sim.x[o.target], y: sim.y[o.target], c: o.t === 'attack' ? '#ff6b6b' : o.t === 'gather' ? '#5ff0e0' : '#ffe27a' });
          else if (o.t === 'build') pts.push({ x: o.tx + STRUCTURES[o.def].size / 2, y: o.ty + STRUCTURES[o.def].size / 2, c: '#ffd27a' });
          else if (o.t === 'ability') pts.push({ x: o.x, y: o.y, c: '#c08bff' });
        }
      } else if (e.hasRally) pts.push({ x: e.rallyX, y: e.rallyY, c: '#7ff5e0' });
      if (!pts.length) continue;
      const sx = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha, sy = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha;
      let prev = this.renderer.project(sx, terrainHeight(map, sx, sy) + 0.1, sy, w, h);
      ctx.setLineDash([5, 5]);
      for (const p of pts.slice(0, 8)) {
        const q = this.renderer.project(p.x, terrainHeight(map, p.x, p.y) + 0.1, p.y, w, h);
        ctx.strokeStyle = p.c; ctx.globalAlpha = this.selection.size > 8 ? 0.28 : 0.55;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
        prev = q;
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    // command markers
    const now = performance.now();
    this.markers = this.markers.filter((m) => now - m.t < 600);
    for (const m of this.markers) {
      const k = (now - m.t) / 600;
      const q = this.renderer.project(m.x, terrainHeight(map, m.x, m.y) + 0.1, m.y, w, h);
      ctx.strokeStyle = m.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 + k * 14, (6 + k * 14) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // health / shield / energy / progress bars
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id]) continue;
      const k = sim.kind[id];
      if (k !== Kind.Unit && k !== Kind.Structure && k !== Kind.Barrier) continue;
      const sel = this.selection.has(id), hov = this.hover === id;
      const damaged = sim.hp[id] < sim.maxHp[id] * 0.995;
      const building = k === Kind.Structure && !sim.built[id];
      const producing = k === Kind.Structure && this.isOwn(id) && sim.ext[id].queue.length > 0;
      if (!sel && !hov && !damaged && !building && !producing) continue;
      if (this.viewer >= 0 && sim.owner[id] !== this.viewer && (k === Kind.Unit || k === Kind.Structure) && !sim.isVisibleTo(this.viewer, id)) continue;
      if (k === Kind.Barrier && this.viewer >= 0 && !this.renderer.cellVisible(sim.x[id], sim.y[id]) && !sel && !hov) continue;
      const x = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha, y = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha;
      let hh = terrainHeight(map, x, y);
      let width = 26;
      if (k === Kind.Unit) { const d = sim.udef(id); hh += (d.hover ? 2.4 : 0) + 1.3 + d.radius; width = 18 + d.radius * 18; }
      else if (k === Kind.Structure) { const d = sim.sdef(id); hh += 1.5 + d.size * 0.6; width = 20 + d.size * 9; }
      else hh += 3;
      const q = this.renderer.project(x, hh, y, w, h);
      if (q.behind || q.x < -50 || q.y < -50 || q.x > w + 50 || q.y > h + 50) continue;
      const frac = Math.max(0, sim.hp[id] / sim.maxHp[id]);
      const bx = q.x - width / 2, by = q.y;
      ctx.fillStyle = 'rgba(5,8,12,0.8)'; ctx.fillRect(bx - 1, by - 1, width + 2, 6);
      ctx.fillStyle = frac > 0.6 ? '#53e08a' : frac > 0.3 ? '#f2c94c' : '#ff5a4f';
      ctx.fillRect(bx, by, width * frac, 4);
      ctx.fillStyle = this.renderer.teamHex(sim.owner[id]);
      ctx.fillRect(bx - 4, by - 1, 3, 6); // team accent
      let yy = by + 5;
      const e = sim.ext[id];
      if (k === Kind.Unit) {
        const d = sim.udef(id);
        if (d.id === 'aegis_frame') { ctx.fillStyle = 'rgba(5,8,12,0.8)'; ctx.fillRect(bx - 1, yy, width + 2, 3); ctx.fillStyle = '#7fdcff'; ctx.fillRect(bx, yy, width * (e.shield / 160), 2); yy += 3; }
        if (d.energyMax && (sel || hov)) { ctx.fillStyle = 'rgba(5,8,12,0.8)'; ctx.fillRect(bx - 1, yy, width + 2, 3); ctx.fillStyle = '#c08bff'; ctx.fillRect(bx, yy, width * (e.energy / d.energyMax), 2); }
        if (e.slowUntil > sim.tick || e.silencedUntil > sim.tick) { ctx.fillStyle = e.silencedUntil > sim.tick ? '#c08bff' : '#9dffc4'; ctx.font = '10px sans-serif'; ctx.fillText(e.silencedUntil > sim.tick ? '⊘' : '❄', bx + width + 3, by + 5); }
      } else if (building) {
        ctx.fillStyle = 'rgba(5,8,12,0.8)'; ctx.fillRect(bx - 1, yy, width + 2, 4); ctx.fillStyle = '#ffd27a'; ctx.fillRect(bx, yy, width * sim.progress[id], 3);
      } else if (producing) {
        const it = e.queue[0];
        ctx.fillStyle = 'rgba(5,8,12,0.8)'; ctx.fillRect(bx - 1, yy, width + 2, 4); ctx.fillStyle = it.paused ? '#ff5a4f' : '#7ff5e0'; ctx.fillRect(bx, yy, width * (it.progress / it.total), 3);
      }
    }
    // drag box
    if (this.mouse.down && this.mouse.dragging) {
      const x0 = Math.min(this.mouse.sx, this.mouse.x), y0 = Math.min(this.mouse.sy, this.mouse.y);
      ctx.strokeStyle = '#7ff5e0'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(127,245,224,0.08)';
      ctx.fillRect(x0, y0, Math.abs(this.mouse.x - this.mouse.sx), Math.abs(this.mouse.y - this.mouse.sy));
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, Math.abs(this.mouse.x - this.mouse.sx), Math.abs(this.mouse.y - this.mouse.sy));
    }
    // targeting cursor ring for ability previews
    if (this.mode.m === 'ability' && this.mouse.inside) {
      const ab = ABILITIES[this.mode.ability];
      const wpt = this.renderer.pickGround(this.mouse.x, this.mouse.y, w, h);
      if (ab.radius) {
        const c = this.renderer.project(wpt.x, terrainHeight(map, wpt.x, wpt.y), wpt.y, w, h);
        const e = this.renderer.project(wpt.x + ab.radius, terrainHeight(map, wpt.x, wpt.y), wpt.y, w, h);
        const r = Math.abs(e.x - c.x);
        ctx.strokeStyle = '#c08bff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // cast range from the caster
      const caster = this.selectedUnits().find((u) => sim.udef(u).abilities.includes(ab.id));
      if (caster !== undefined && ab.range < 100) {
        const c = this.renderer.project(sim.x[caster], terrainHeight(map, sim.x[caster], sim.y[caster]), sim.y[caster], w, h);
        const e = this.renderer.project(sim.x[caster] + ab.range, terrainHeight(map, sim.x[caster], sim.y[caster]), sim.y[caster], w, h);
        const r = Math.abs(e.x - c.x);
        ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(192,139,255,0.6)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // selected unit weapon ranges (thin), for clarity while microing
    if (this.selection.size === 1) {
      const id = [...this.selection][0];
      const wpn = sim.alive[id] ? sim.weaponOf(id) : undefined;
      if (wpn) {
        const rr = wpn.range + (sim.kind[id] === Kind.Unit && sim.ext[id].braced ? 2 : 0) + sim.radius[id];
        const c = this.renderer.project(sim.x[id], terrainHeight(map, sim.x[id], sim.y[id]), sim.y[id], w, h);
        const e = this.renderer.project(sim.x[id] + rr, terrainHeight(map, sim.x[id], sim.y[id]), sim.y[id], w, h);
        const r = Math.abs(e.x - c.x);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  private drawMinimap() {
    const el = this.minimap;
    if (!el || !this.mmBase) return;
    const ctx = el.getContext('2d')!;
    const sim = this.sim;
    const n = sim.map.size;
    const img = new ImageData(new Uint8ClampedArray(this.mmBase.data), n, n);
    if (this.viewer >= 0) {
      const p = sim.players[this.viewer];
      for (let i = 0; i < n * n; i++) {
        const f = p.visible[i] ? 1 : p.explored[i] ? 0.5 : 0.15;
        img.data[i * 4] *= f; img.data[i * 4 + 1] *= f; img.data[i * 4 + 2] *= f;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = n; tmp.height = n;
    tmp.getContext('2d')!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, el.width, el.height);
    const s = el.width / n;
    // ghosts
    if (this.viewer >= 0) for (const g of sim.players[this.viewer].ghosts.values()) {
      if (sim.alive[g.id] && sim.isVisibleTo(this.viewer, g.id)) continue;
      ctx.fillStyle = 'rgba(160,160,170,0.7)'; ctx.fillRect((g.x - g.size / 2) * s, (g.y - g.size / 2) * s, g.size * s, g.size * s);
    }
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id]) continue;
      const k = sim.kind[id];
      if (k === Kind.Ore) { if (this.viewer < 0 || sim.players[this.viewer].explored[Math.floor(sim.y[id]) * n + Math.floor(sim.x[id])]) { ctx.fillStyle = '#39e0d0'; ctx.fillRect(sim.x[id] * s - 1, sim.y[id] * s - 1, 2, 2); } continue; }
      if (k === Kind.Vent) { ctx.fillStyle = '#ff8b2e'; ctx.fillRect(sim.x[id] * s - 2, sim.y[id] * s - 2, 3, 3); continue; }
      if (k === Kind.Pylon) { const e = sim.ext[id]; ctx.fillStyle = e.captureOwner >= 0 ? this.renderer.teamHex(e.captureOwner) : '#e8f1ff'; ctx.beginPath(); ctx.arc(sim.x[id] * s, sim.y[id] * s, 3, 0, Math.PI * 2); ctx.fill(); continue; }
      if (k === Kind.Barrier) { ctx.fillStyle = '#bfe9ff'; ctx.fillRect(sim.x[id] * s - 2, sim.y[id] * s - 2, 4, 4); continue; }
      if (k !== Kind.Unit && k !== Kind.Structure) continue;
      if (this.viewer >= 0 && sim.owner[id] !== this.viewer && !sim.isVisibleTo(this.viewer, id)) continue;
      ctx.fillStyle = this.selection.has(id) ? '#ffffff' : this.renderer.teamHex(sim.owner[id]);
      if (k === Kind.Structure) { const sz = sim.sdef(id).size * s; ctx.fillRect(sim.x[id] * s - sz / 2, sim.y[id] * s - sz / 2, sz, sz); }
      else ctx.fillRect(sim.x[id] * s - 1.2, sim.y[id] * s - 1.2, 2.6, 2.6);
    }
    // camera frustum footprint
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const corners = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => this.renderer.pickGround(x, y, w, h));
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;
    ctx.beginPath(); corners.forEach((c, i) => (i ? ctx.lineTo(c.x * s, c.y * s) : ctx.moveTo(c.x * s, c.y * s))); ctx.closePath(); ctx.stroke();
    // alert pings
    const now = performance.now();
    for (const a of this.alerts) if (a.kind === 'attack' && a.x !== undefined && now - a.t < 3000) {
      const k = ((now - a.t) % 1000) / 1000;
      ctx.strokeStyle = `rgba(255,90,79,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x * s, (a.y ?? 0) * s, 4 + k * 12, 0, Math.PI * 2); ctx.stroke();
    }
    for (const m of this.markers) { ctx.strokeStyle = m.color; ctx.beginPath(); ctx.arc(m.x * s, m.y * s, 5, 0, Math.PI * 2); ctx.stroke(); }
  }

  // ------------------------------------------------------------------ tutorial
  private updateTutorial() {
    const sim = this.sim;
    if (sim.setup.mode !== 'tutorial' || this.tutorialStep >= TUTORIAL_STEPS.length) return;
    const ctx: TutorialContext = { sim, selection: this.selection, controlGroups: this.controlGroups, lastCommands: this.tutorialCtx.lastCommands, cameraMoved: this.tutorialCtx.cameraMoved };
    const step = TUTORIAL_STEPS[this.tutorialStep];
    if (step.done(ctx)) {
      this.tutorialStep++;
      this.tutorialCtx.lastCommands = [];
      audio.ui('alert_research', 0);
      this.publishHud();
    }
  }
  get tutorialProgress() { return this.tutorialStep; }

  setSpeed(s: number) { this.speed = s; this.publishHud(); }
  togglePause() { this.paused = !this.paused; this.lastFrame = performance.now(); this.publishHud(); }
  applySettings(s: Settings) {
    this.settings = s;
    this.renderer.applySettings(s.graphics);
    audio.volumes = { ...s.audio };
    audio.applyVolumes();
    this.publishHud();
  }
  /** used by automated capture: frame the latest fight / base */
  debugFrame(x: number, y: number, h: number) { this.cam.jumpTo(x, y, false); this.cam.height = this.cam.targetHeight = h; }
  restoreFromContextLoss() { this.renderer.contextLost = false; this.paused = false; this.publishHud(); }
}

function neutralName(def: string): string {
  return ({ ore: 'Prism Ore', vent: 'Flux Vent', pylon: 'Watch Pylon', barrier: 'Crystal Barrier', pod: 'Salvage Pod', spike: 'Sensor Spike' } as Record<string, string>)[def] ?? def;
}

export function weaponText(w: NonNullable<(typeof UNITS)[string]['weapon']>): string {
  const bonus = Object.entries(w.bonus ?? {}).map(([t, v]) => `+${v} vs ${t}`).join(', ');
  const parts = [`${w.damage} dmg`, `every ${(w.period / 20).toFixed(2)} s`, `range ${w.range}${w.minRange ? ` (min ${w.minRange})` : ''}`];
  if (w.projectileSpeed) parts.push(`projectile ${w.projectileSpeed} u/s`); else if (w.kind !== 'eruption') parts.push('instant');
  if (w.splash) parts.push(`splash ${w.splash}`);
  if (w.eruptionDelay) parts.push(`erupts after ${(w.eruptionDelay / 20).toFixed(1)} s`);
  if (w.slow) parts.push(`slow ${Math.round(w.slow * 100)}%`);
  if (w.overpenetrate) parts.push('overpenetrates 1 Light');
  if (w.setupTicks) parts.push(`setup ${(w.setupTicks / 20).toFixed(1)} s`);
  if (w.coneHalfAngle) parts.push(`${w.coneHalfAngle * 2}° cone`);
  if (!w.canTargetHover) parts.push('ground only');
  return parts.join(' · ') + (bonus ? ` · ${bonus}` : '');
}
export function unitDetail(id: string): string {
  const u = UNITS[id];
  return `${u.hp} HP · armor ${u.armor} · speed ${u.speed} · sight ${u.sight} · ${u.tags.join(', ')}${u.weapon ? '\n' + weaponText(u.weapon) : ''}\nStrong vs: ${u.strongVs}\nWeak vs: ${u.weakVs}\nBuild time ${Math.round(u.buildTime / 20)} s`;
}
export function structureDetail(id: string): string {
  const s = STRUCTURES[id];
  return `${s.hp} HP · armor ${s.armor} · ${s.size}×${s.size}${s.supply ? ` · +${s.supply} supply` : ''}${s.weapon ? '\n' + weaponText(s.weapon) : ''}\nBuild time ${Math.round(s.buildTime / 20)} s${s.requires.length ? `\nRequires ${s.requires.map(requirementName).join(', ')}` : ''}`;
}

const ICONS: Record<string, string> = {
  fabricator: '⚙', kestrel: '➶', bulwark: '⛨', arc_lancer: '⚡', mender_rig: '✚', mortar_crawler: '☄', aegis_frame: '⬢',
  tender: '❀', glimmerwing: '✧', thornling: '✶', sporecaster: '❂', carapace_guard: '◒', bloom_sage: '✿', rift_stag: '♆', crownbeast: '♛',
  core_relay: '⌬', grid_pylon: '⏚', assembly_bay: '⌂', flux_tap: '⛽', signal_foundry: '⌘', sentry_arc: '⊕',
  heartgrove: '❦', root_node: '⚘', brood_hollow: '◍', flux_siphon: '♨', memory_bloom: '❁', needle_pod: '✺',
  emergency_weld: '✚', sensor_spike: '⌖', brace: '⛉', rootstep: '⇶', curl: '◐', mend_spores: '❋', silence_patch: '⊘',
};
export function iconFor(id: string): string {
  if (ICONS[id]) return ICONS[id];
  if (id.includes('attack')) return '⚔';
  if (id.includes('armor')) return '⛊';
  if (id === 'aegis_protocol') return '⬢';
  if (id === 'crown_rite') return '♛';
  return '•';
}
