// Browser game session: fixed-step clock with render interpolation, pause, save checkpoints, and the
// glue between the headless Sim and the presentation layers (renderer, audio, HUD, React screens).
import { Sim, SaveData, UiRequest } from './sim';
import { Physics, DT } from '../physics/physics';
import { Renderer } from '../renderer/renderer';
import { AudioEngine } from '../audio/audio';
import { Hud } from '../ui/hud';
import { MapPainter, MapOverlay, MapMark, STATIC_MARKS } from '../ui/minimap';
import { Input } from '../core/input';
import { Settings, loadSettings, saveSettings, QUALITY_PRESETS, Action } from '../core/settings';
import { SaveRepo } from '../persistence/saveRepo';
import { ANCHORS } from '../world/district';
import { roadRoute } from '../world/roads';
import { STORY, GIVER_ANCHOR, CIRCUIT_GATES } from '../missions/data';
import { steerToward } from '../vehicles/vehicle';

export type Screen = 'boot' | 'menu' | 'loading' | 'playing' | 'paused' | 'map' | 'phone' | 'shop' | 'safehouse' | 'contact' | 'result' | 'failed' | 'choice' | 'settings' | 'credits' | 'error' | 'wheel' | 'benchmark';
export interface UiState {
  screen: Screen; back: Screen; shop: 'mart' | 'supply' | 'clothing' | 'garage'; contact: string; error: string; loading: string;
  save: { savedAt: number; playTime: number; cash: number; missions: number } | null; notice: string; rev: number; benchmark: string;
}
export const SLOT = 'main';

export class Game {
  settings: Settings = loadSettings();
  state: UiState = { screen: 'boot', back: 'menu', shop: 'mart', contact: '', error: '', loading: '', save: null, notice: '', rev: 0, benchmark: '' };
  sim!: Sim; renderer!: Renderer; audio!: AudioEngine; hud!: Hud; input!: Input; painter!: MapPainter;
  repo = new SaveRepo(); repoOk = false;
  waypoint: { x: number; z: number } | null = null;
  overlay: MapOverlay = { route: null, marks: [], search: null, px: 0, pz: 0, yaw: 0 };
  mapFilter: Record<string, boolean> = { shop: true, contact: true, activity: true, landmark: true };
  private listeners = new Set<() => void>();
  private acc = 0; private last = 0; private routeT = 0; private raf = 0; private failT = 0; private started = false; private phys: Physics | null = null;
  private bench: { t: number; frames: number[]; gate: number } | null = null;
  simMs = 0; private lockPauseT = -1e9;

  constructor(public canvas: HTMLCanvasElement, public hudParent: HTMLElement) { (window as any).__meridian = this; }
  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  set(patch: Partial<UiState>) { this.state = { ...this.state, ...patch, rev: this.state.rev + 1 }; for (const l of this.listeners) l(); }
  getState = () => this.state;

  /** Capability checks and save discovery. Returns false (with an error screen) when the browser cannot run the game. */
  async boot(): Promise<boolean> {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl2');
    if (!gl) { this.set({ screen: 'error', error: 'Meridian Run needs WebGL 2. Your browser or graphics driver did not provide it. Try a current desktop Chrome, Edge or Firefox with hardware acceleration enabled.' }); return false; }
    if (typeof WebAssembly === 'undefined') { this.set({ screen: 'error', error: 'Meridian Run needs WebAssembly for its physics engine, and this browser has it disabled.' }); return false; }
    try { await this.repo.open(); this.repoOk = true; } catch { this.repoOk = false; }
    let notice = this.repoOk ? '' : 'Saving is unavailable in this browser session (IndexedDB is blocked). You can still play.';
    let save: UiState['save'] = null;
    if (this.repoOk) { const r = await this.repo.load(SLOT).catch(() => null); if (r?.note) notice = r.note; save = await this.repo.peek(SLOT); }
    this.set({ screen: 'menu', save, notice });
    return true;
  }
  async start(mode: 'new' | 'continue') {
    try {
      this.set({ screen: 'loading', loading: 'Starting physics…' });
      await new Promise((r) => setTimeout(r, 30));
      if (this.started) { cancelAnimationFrame(this.raf); this.renderer.dispose(); this.hud.root.remove(); }
      this.phys = await Physics.create();
      this.sim = new Sim(this.phys, 1337 + Math.floor(Math.random() * 1e6));
      this.set({ loading: 'Laying out South Quay…' }); await new Promise((r) => setTimeout(r, 20));
      this.renderer = new Renderer(this.canvas, this.sim, this.renderSettings());
      if (!this.renderer.webgl2) throw new Error('WebGL 2 context could not be created.');
      this.renderer.init();
      if (!this.painter) this.painter = new MapPainter();
      this.audio = new AudioEngine(this.sim, this.settings); this.audio.unlock();
      this.hud = new Hud(this.hudParent, this.sim, this.settings, this.painter);
      if (!this.input) {
        this.input = new Input(this.canvas, this.settings);
        this.input.onAction = (a) => this.onAction(a);
        this.input.onLockChange = (locked) => { if (!locked && this.state.screen === 'playing' && !this.bench) { this.lockPauseT = performance.now(); this.pause(); } };
        window.addEventListener('resize', () => this.renderer?.resize());
        this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.set({ screen: 'error', error: 'The graphics context was lost (the GPU reset or ran out of memory). Your last save is safe. Reload the page to continue; lowering the quality preset in Settings helps if this repeats.' }); });
      }
      this.sim.ui = (r) => this.onUi(r);
      this.sim.bus.on('missionChanged', () => { const m = this.sim.missions; if (m.choice) this.open('choice'); this.set({}); });
      let data: SaveData | null = null;
      if (mode === 'continue' && this.repoOk) { const r = await this.repo.load(SLOT); data = r.data; if (r.note) this.set({ notice: r.note }); }
      this.set({ loading: 'Waking the city…' }); await new Promise((r) => setTimeout(r, 20));
      this.applySettings();
      if (data) this.sim.applySave(data);
      this.sim.prewarm();
      this.renderer.warm(this.sim.player.x, this.sim.player.z);
      this.renderer.rig.snapBehind(this.sim.player.body.yaw);
      this.started = true; this.acc = 0; this.last = performance.now();
      this.set({ screen: 'playing' }); this.input.enabled = true; this.input.reset();
      if (mode === 'new') this.sim.schedule(1.2, () => this.sim.startMission(STORY[0]));
      else if (!this.sim.player.ownedVehicle && this.sim.missions.progress.completed.m1) this.sim.recallBike();
      if (new URLSearchParams(location.search).has('benchmark')) this.startBenchmark();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    } catch (e) {
      console.error(e);
      this.set({ screen: 'error', error: `The game could not start: ${(e as Error).message}. Reload the page; if it keeps failing, try another browser or update your graphics driver.` });
    }
  }
  renderSettings() { const s = this.settings; return { quality: s.quality, renderScale: s.renderScale, reducedFlashes: s.reducedFlashes, viewDistance: s.viewDistance, fov: s.fov, sensitivity: s.sensitivity, invertY: s.invertY, reducedMotion: s.reducedMotion, recenter: s.recenter, recenterDelay: s.recenterDelay }; }
  /** Push settings into the running systems and persist them. */
  applySettings(changedQuality = false) {
    const s = this.settings;
    if (changedQuality) Object.assign(s, QUALITY_PRESETS[s.quality]);
    saveSettings(s);
    if (!this.sim) return;
    this.sim.traffic.density = s.trafficDensity; this.sim.peds.density = s.pedDensity;
    this.sim.toggleCrouch = s.toggleCrouch; this.sim.steerSensitivity = s.steerSensitivity;
    this.sim.vehicles.assists.traction = s.traction; this.sim.vehicles.assists.stability = s.stability;
    Object.assign(this.renderer.settings, this.renderSettings());
    if (this.started || changedQuality) this.renderer.applyQuality();
    this.set({});
  }

  // ------------------------------------------------------------------ screens
  open(screen: Screen, patch: Partial<UiState> = {}) {
    if (!this.started) { this.set({ screen, ...patch }); return; }
    this.input.enabled = false; this.input.releaseLock(); this.input.reset();
    this.set({ screen, back: 'playing', ...patch });
    this.audio.play('ui');
  }
  resume() {
    if (!this.started) { this.set({ screen: 'menu' }); return; }
    if (this.sim.missions.failed) { this.set({ screen: 'failed' }); return; }
    if (this.sim.missions.choice) { this.set({ screen: 'choice' }); return; }
    this.set({ screen: 'playing' }); this.input.enabled = true; this.input.reset(); this.input.requestLock(); this.audio.unlock(); this.last = performance.now();
  }
  pause() { if (this.state.screen === 'playing') this.open('paused'); }
  private onAction(a: Action | 'pause') {
    const sc = this.state.screen;
    if (a === 'pause') { if (performance.now() - this.lockPauseT < 400) return; if (sc === 'playing') this.pause(); else if (['paused', 'map', 'phone', 'shop', 'safehouse', 'contact', 'wheel'].includes(sc)) this.resume(); else if (sc === 'settings' || sc === 'credits') this.set({ screen: this.started ? 'paused' : 'menu' }); return; }
    if (sc !== 'playing') return;
    if (a === 'map') this.open('map'); else if (a === 'phone') this.open('phone');
    else if (a === 'camera') { this.renderer.rig.vehMode = (this.renderer.rig.vehMode + 1) % 3; }
    else if (a === 'radio') this.audio.nextStation();
    else if (a === 'wheel' && !this.sim.player.vehicle) this.open('wheel');
  }
  private onUi(r: UiRequest) {
    if (r.kind === 'shop') this.open('shop', { shop: r.shop }); else if (r.kind === 'safehouse') this.open('safehouse');
    else if (r.kind === 'contact') this.open('contact', { contact: r.mission }); else if (r.kind === 'result') this.open('result'); else if (r.kind === 'down') this.open('failed');
  }
  async save(reason: string): Promise<boolean> {
    if (!this.repoOk) { this.hud?.toast('Saving is unavailable in this browser session', 'bad'); return false; }
    try { await this.repo.save(SLOT, this.sim.serialize()); this.hud.toast(reason === 'rest' ? 'Game saved' : 'Autosaved', 'good'); this.set({ save: await this.repo.peek(SLOT) }); return true; }
    catch (e) { this.hud.toast('Save failed: ' + (e as Error).message, 'bad'); return false; }
  }
  quitToMenu() {
    cancelAnimationFrame(this.raf); this.input.enabled = false; this.input.releaseLock();
    this.hud.root.remove(); this.renderer.dispose(); this.started = false;
    void this.repo.peek(SLOT).then((save) => this.set({ screen: 'menu', save }));
  }
  setWaypoint(x: number, z: number) { this.waypoint = this.waypoint && Math.hypot(this.waypoint.x - x, this.waypoint.z - z) < 25 ? null : { x, z }; this.routeT = 0; this.updateOverlay(0); this.set({}); }

  // ------------------------------------------------------------------ per-frame
  private updateOverlay(dt: number) {
    const sim = this.sim, p = sim.player, m = sim.missions, o = this.overlay, marks: MapMark[] = [];
    o.px = p.x; o.pz = p.z; o.yaw = p.vehicle ? p.vehicle.yaw : this.renderer.rig.yaw;
    const world: { x: number; z: number; r: number; color: number; beam: boolean }[] = [];
    for (const s of STATIC_MARKS) if (s.kind === 'safe' || s.kind === 'garage' || this.mapFilter[s.kind] !== false) marks.push(s);
    for (const a of [ANCHORS.quayMart, ANCHORS.supply, ANCHORS.clothing, ANCHORS.safehouse]) world.push({ x: a.x, z: a.z, r: 1.1, color: a === ANCHORS.safehouse ? 0x7bd389 : 0x2ec4b6, beam: false });
    if (!m.busy) {
      const n = sim.nextStory();
      if (n && this.mapFilter.contact) { const a = ANCHORS[GIVER_ANCHOR[n.id]]; marks.push({ x: a.x, z: a.z, kind: 'contact', label: `${n.giver}: ${n.title}` }); world.push({ x: a.x, z: a.z, r: 1.6, color: 0xff9f1c, beam: true }); }
    }
    let goal: { x: number; z: number } | null = null;
    for (const mk of m.markers) {
      const x = mk.follow ? mk.follow.x : mk.x, z = mk.follow ? mk.follow.z : mk.z;
      marks.push({ x, z, kind: mk.kind, r: mk.r, label: mk.label });
      if (mk.kind !== 'area') world.push({ x, z, r: Math.min(mk.r, 9), color: mk.kind === 'side' ? 0xffffff : 0xffd23f, beam: true }); else world.push({ x, z, r: mk.r, color: 0xffd23f, beam: false });
      if (!goal && mk.kind !== 'side') goal = { x, z };
    }
    const ov = p.ownedVehicle;
    if (ov && p.vehicle !== ov && sim.vehicles.list.includes(ov)) marks.push({ x: ov.x, z: ov.z, kind: 'vehicle', label: `Your ${ov.spec.name}` });
    if (this.waypoint) { marks.push({ ...this.waypoint, kind: 'waypoint', label: 'Waypoint' }); world.push({ ...this.waypoint, r: 3, color: 0xff4f9a, beam: true }); if (Math.hypot(p.x - this.waypoint.x, p.z - this.waypoint.z) < 12) this.waypoint = null; }
    // police: only units that currently have eyes on the player are shown; the search region is always shown
    const pol = sim.police;
    for (const u of pol.units) if (u.vehicle && (u.sees || (u.vehicle.siren && Math.hypot(u.vehicle.x - p.x, u.vehicle.z - p.z) < 70))) marks.push({ x: u.vehicle.x, z: u.vehicle.z, kind: 'police' });
    for (const a of sim.actors.list) if (a.faction === 'police' && a.sees && !a.disabled) marks.push({ x: a.x, z: a.z, kind: 'police' });
    o.search = pol.tier > 0 && (pol.status === 'Search' || pol.status === 'Cooling') ? { x: pol.lastKnown.x, z: pol.lastKnown.z, r: pol.searchR } : null;
    o.marks = marks; this.renderer.markers = world;
    this.routeT -= dt;
    if (this.routeT <= 0) {
      this.routeT = 0.4;
      const t = this.waypoint ?? goal;
      o.route = t && Math.hypot(t.x - p.x, t.z - p.z) > 30 ? roadRoute(p.x, p.z, t.x, t.z) : null;
    }
    // ghost of the best Street Circuit run
    const g = m.progress.ghost, te = m.active?.id === 'circuit' ? m.timerElapsed : -1;
    const gi = te >= 0 ? Math.floor(te / 0.25) * 2 : -1;
    this.renderer.ghost = gi >= 0 && gi + 1 < g.length ? { x: g[gi], z: g[gi + 1] } : null;
  }
  private frame(now: number) {
    this.raf = requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min(0.1, Math.max(0.001, (now - this.last) / 1000)); this.last = now;
    const sim = this.sim, playing = this.state.screen === 'playing';
    if (playing) {
      const [mx, my] = this.input.takeMouse();
      if (mx || my) this.renderer.rig.onMouse(mx, my, this.renderer.settings);
      const inVeh = !!sim.player.vehicle;
      this.renderer.rig.lookBack = inVeh && this.input.lookBackHeld();
      this.acc += dt;
      if (this.acc >= DT) {
        if (!inVeh && this.input.shoulderHit()) this.renderer.rig.shoulder *= -1;
        if (this.bench) this.benchInput(); else this.input.apply(sim.input, inVeh);
        const t0 = performance.now();
        let steps = 0;
        while (this.acc >= DT && steps < 4) { sim.step(DT); this.acc -= DT; steps++; }
        if (steps === 4) this.acc = 0; // too slow to keep up: drop time rather than spiral
        this.simMs += (performance.now() - t0 - this.simMs) * 0.1;
      }
      // deferred work that must not run mid-step
      if (sim.autosaveWanted && sim.police.tier === 0 && !sim.player.downed) { const r = sim.autosaveWanted; sim.autosaveWanted = ''; void this.save(r); }
      if (sim.missions.failed) { this.failT += dt; if (this.failT > 1.4) { this.failT = 0; this.open('failed'); } } else this.failT = 0;
      if (this.bench) this.benchFrame(dt);
    }
    this.updateOverlay(dt);
    this.renderer.render(playing ? this.acc / DT : 1, playing ? dt : 0);
    this.hud.radioText = this.audio.radioText;
    this.hud.setVisible(playing || this.state.screen === 'benchmark');
    if (playing) { this.hud.update(dt, this.overlay); this.hud.setLockHint(!this.input.locked && !this.bench); }
    this.audio.update(dt, this.renderer.rig.x, this.renderer.rig.y, this.renderer.rig.z, this.renderer.rig.yaw, !playing);
  }

  // ------------------------------------------------------------------ benchmark route (?benchmark=1)
  private startBenchmark() {
    const sim = this.sim, s = ANCHORS.circuitStart;
    sim.missions.abandon(); sim.godMode = true;
    const v = sim.spawnMissionVehicle('tern', s.x, s.z, s.yaw ?? 0, 0x1f7a8c); v.owned = true;
    sim.player.enterVehicle(v, true);
    this.bench = { t: 0, frames: [], gate: 0 };
  }
  private benchInput() {
    const sim = this.sim, v = sim.player.vehicle, b = this.bench!;
    if (!v) return;
    const g = CIRCUIT_GATES[b.gate % CIRCUIT_GATES.length];
    if (Math.hypot(g.x - v.x, g.z - v.z) < 22) b.gate++;
    const route = roadRoute(v.x, v.z, g.x, g.z);
    const tx = route.length > 4 && Math.hypot(route[2] - v.x, route[3] - v.z) < 12 ? route[4] : route[2], tz = route.length > 4 && Math.hypot(route[2] - v.x, route[3] - v.z) < 12 ? route[5] : route[3];
    const steer = steerToward(v, tx, tz), want = Math.abs(steer) > 0.45 ? 9 : 22;
    sim.input.moveX = steer; sim.input.moveZ = v.speed < want ? 1 : v.speed > want + 3 ? -1 : 0;
  }
  private benchFrame(dt: number) {
    const b = this.bench!; b.t += dt; if (b.t > 3) b.frames.push(dt * 1000);
    if (b.t > 63) {
      const f = b.frames.slice().sort((x, y) => x - y), n = f.length;
      const res = { frames: n, medianFps: +(1000 / f[Math.floor(n / 2)]).toFixed(1), onePercentLowFps: +(1000 / f[Math.floor(n * 0.99)]).toFixed(1), maxFrameMs: +f[n - 1].toFixed(1), simMs: +this.simMs.toFixed(2), drawCalls: this.renderer.drawCalls, cellBuildMaxMs: +this.renderer.city.stats.maxBuildMs.toFixed(1), quality: this.settings.quality, resolution: `${this.canvas.width}x${this.canvas.height}` };
      console.log('BENCHMARK_RESULT ' + JSON.stringify(res));
      this.bench = null; this.input.enabled = false;
      this.set({ screen: 'benchmark', benchmark: JSON.stringify(res, null, 2) });
    }
  }
}
