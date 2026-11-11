// Game controller: boot, mode routing, the fixed-step loop and glue between simulation, view,
// audio, HUD, persistence and the React menus.
import RAPIER from '@dimforge/rapier3d-compat';
import { WorldModel } from '../world/model';
import { WORLD_VERSION } from '../world/galeport';
import { GameView } from '../renderer/gameView';
import { Session, SessionOptions, SessionEvent, ModeId, TRIALS } from '../game-session/session';
import { InputManager, Action, ViewControls } from '../camera-input/input';
import { AudioEngine } from '../audio/audio';
import { Hud } from '../ui/hud';
import { Minimap } from '../ui/minimap';
import { ui } from '../ui/store';
import { Store, Settings, recordFromResult, bestRecords } from '../persistence/db';
import { DT } from '../physics/physicsWorld';
import { InputFrame, NEUTRAL_INPUT } from '../vehicle/vehicle';
import { TaxiId, TAXI_RULES_VERSION } from '../vehicle/taxiSpecs';
import { SCORE_RULES_VERSION } from '../score/pulse';
import { FARE_RULES_VERSION } from '../fares/fares';
import { Autopilot } from '../tools/autopilot';
import { TrafficDensity } from '../traffic/traffic';

export const RULES_VERSION = WORLD_VERSION * 1000000 + TAXI_RULES_VERSION * 10000 + SCORE_RULES_VERSION * 100 + FARE_RULES_VERSION;
const NO_VIEW: ViewControls = { lookBack: false, glance: 0, lookX: 0, lookY: 0, dragging: false };

export class Game {
  view!: GameView;
  model!: WorldModel;
  input!: InputManager;
  audio = new AudioEngine();
  hud!: Hud;
  store = new Store();
  session: Session | null = null;
  private last = 0;
  private acc = 0;
  private lastOpts: SessionOptions | null = null;
  private autopilot: Autopilot | null = null;
  private lastInput: InputFrame = NEUTRAL_INPUT;
  private finishTimer = -1;
  private params = new URLSearchParams(location.search);

  async init(canvas: HTMLCanvasElement, hudRoot: HTMLElement): Promise<void> {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) throw new Error('WebGL 2 is required to run Farestorm, and this browser or GPU does not provide it.');
    if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly is required to run Farestorm.');
    ui.set({ loadingText: 'Loading physics...' });
    await RAPIER.init();
    await this.store.open();
    const [settings, profile, records] = await Promise.all([this.store.loadSettings(), this.store.loadProfile(), this.store.records()]);
    ui.set({ settings, profile, records, storageOk: this.store.ok, loadingText: 'Surveying Galeport...' });
    await new Promise((r) => setTimeout(r, 20));
    this.model = new WorldModel();
    ui.set({ loadingText: 'Pouring concrete, planting palms...' });
    await new Promise((r) => setTimeout(r, 20));
    this.view = new GameView(canvas, this.model);
    this.hud = new Hud(hudRoot, new Minimap(this.model));
    this.input = new InputManager(canvas);
    this.input.enabled = false;
    this.input.onAction = (a) => this.onAction(a);
    this.input.onGamepadChange = (connected, name) => {
      ui.set({ gamepad: connected ? name : '', notice: connected ? 'Gamepad connected' : 'Gamepad disconnected' });
      if (!connected && ui.get().screen === 'playing') this.pause();
      setTimeout(() => ui.set({ notice: '' }), 2500);
    };
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => { if (document.hidden && ui.get().screen === 'playing') this.pause(); });
    this.view.engine.getRenderingCanvas()!.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      ui.set({ screen: 'error', error: 'The graphics context was lost. Reload the page to get back on shift.' });
    });
    this.applySettings(settings);
    if (this.params.has('mute')) this.audio.setMuted(true);
    this.last = performance.now();
    this.view.engine.runRenderLoop(() => this.frame());
    ui.set({ screen: 'menu' });
    (window as unknown as { __farestorm: Game }).__farestorm = this;
    const auto = this.params.get('autostart') as ModeId | null;
    if (auto) {
      this.startRun(auto, (this.params.get('taxi') as TaxiId) || settings.taxi, {
        seed: Number(this.params.get('seed')) || undefined, trial: Number(this.params.get('trial')) || 0,
        hub: this.params.has('hub') ? Number(this.params.get('hub')) : undefined, traffic: (this.params.get('traffic') as TrafficDensity) || undefined,
      });
    }
  }

  applySettings(s: Settings): void {
    this.view.setQuality(s.quality);
    this.applySettingsLight(s);
  }
  updateSettings(patch: Partial<Settings>): void {
    const prev = ui.get().settings;
    const settings = { ...prev, ...patch };
    ui.set({ settings });
    if (patch.quality !== undefined && patch.quality !== prev.quality) this.applySettings(settings);
    else this.applySettingsLight(settings);
    void this.store.set('settings', settings);
  }
  private applySettingsLight(s: Settings): void {
    this.audio.setVolumes({ master: s.master, music: s.music, sfx: s.sfx });
    this.view.dynamicResolution = s.dynamicRes;
    this.view.chase.fovScale = s.fov;
    this.view.chase.shakeScale = s.cameraShake;
    this.view.setReducedMotion(s.reducedMotion);
    this.hud.subtitles = s.subtitles;
    this.hud.showMinimap = s.minimap;
    this.input.bindings = JSON.parse(JSON.stringify(s.bindings));
    this.input.rebuild();
    this.input.steerSensitivity = s.steerSensitivity;
    this.input.deadZone = s.deadZone;
    this.input.vibration = s.vibration;
    document.documentElement.style.setProperty('--hud-scale', String(s.hudScale));
    document.documentElement.classList.toggle('reduced-motion', s.reducedMotion);
  }

  /** Show a cab on the setup screen (null hides it). */
  showcase(taxi: TaxiId | null): void {
    if (this.session) return;
    this.view.setTaxi(taxi);
  }

  startRun(mode: ModeId, taxi: TaxiId, extra: { seed?: number; trial?: number; hub?: number; traffic?: TrafficDensity } = {}): void {
    const st = ui.get();
    const trial = extra.trial ?? st.trial;
    const seed = extra.seed ?? (mode === 'trial' ? 7771 + trial * 13 : mode === 'school' ? 4242 : (Date.now() & 0x7fffffff) || 1);
    const hub = extra.hub ?? (st.hub >= 0 ? st.hub : undefined);
    const opts: SessionOptions = {
      mode, taxi, seed, trial, hub: mode === 'school' ? 1 : hub,
      traffic: extra.traffic ?? (mode === 'trial' || mode === 'school' ? 'medium' : st.settings.traffic),
      wideWindows: st.settings.wideWindows, steerAssist: st.settings.steerAssist, discovered: st.profile.discovered,
    };
    this.launch(opts);
  }
  private launch(opts: SessionOptions): void {
    this.session?.dispose();
    this.lastOpts = opts;
    this.session = new Session(RAPIER, this.model, opts);
    this.view.setSession(this.session);
    this.hud.reset();
    this.hud.setVisible(true);
    this.input.enabled = true;
    this.acc = 0;
    this.finishTimer = -1;
    this.autopilot = this.params.has('autopilot') ? new Autopilot() : null;
    this.audio.unlock();
    this.audio.ui('start');
    ui.set({ screen: 'playing', result: null, newBest: false });
    if (opts.taxi !== ui.get().settings.taxi) this.updateSettings({ taxi: opts.taxi });
  }
  retry(): void {
    if (!this.lastOpts) return;
    const o = this.lastOpts;
    const seed = o.mode === 'arcade' || o.mode === 'quick' ? (Date.now() & 0x7fffffff) || 1 : o.seed;
    this.launch({ ...o, seed, discovered: ui.get().profile.discovered });
  }
  pause(): void {
    if (ui.get().screen !== 'playing' || !this.session || this.session.phase === 'ended') return;
    this.input.enabled = false;
    ui.set({ screen: 'paused' });
  }
  resume(): void {
    if (ui.get().screen !== 'paused') return;
    this.input.enabled = true;
    this.last = performance.now();
    ui.set({ screen: 'playing' });
  }
  quitToMenu(): void {
    this.session?.dispose();
    this.session = null;
    this.view.setSession(null);
    this.view.setTaxi(null);
    this.hud.setVisible(false);
    this.input.enabled = false;
    ui.set({ screen: 'menu', result: null });
  }
  /** End the current shift early and go to the results screen. */
  endShift(): void {
    if (!this.session) return;
    this.input.enabled = true;
    ui.set({ screen: 'playing' });
    this.session.finish(false);
    this.dispatch(this.session.drainEvents());
  }

  private onAction(a: Action): void {
    const screen = ui.get().screen;
    if (a === 'pause') { if (screen === 'playing') this.pause(); else if (screen === 'paused') this.resume(); return; }
    if (screen !== 'playing') return;
    if (a === 'camera') this.view.chase.cycle();
    else if (a === 'map') this.hud.mapOpen = !this.hud.mapOpen;
    else if (a === 'horn') this.audio.horn();
  }

  private dispatch(events: SessionEvent[]): void {
    const s = this.session!;
    for (const e of events) {
      this.hud.onEvent(e, s);
      this.audio.event(e);
      this.view.handleEvent(e);
      if (e.type === 'collision') this.input.rumble(Math.min(1, e.severity / 12), e.hard ? 260 : 120);
      else if (e.type === 'finished') this.finishTimer = 2.2;
    }
  }

  private async showResults(): Promise<void> {
    const s = this.session;
    if (!s || !s.result) return;
    const r = s.result;
    const st = ui.get();
    const profile = { ...st.profile, discovered: [...s.discovered], shifts: st.profile.shifts + 1, medals: { ...st.profile.medals } };
    if (r.mode === 'school') profile.lessonsDone = Math.max(profile.lessonsDone, r.lessonsDone);
    if (r.mode === 'trial' && r.medal && r.medal !== 'none') {
      const order = ['bronze', 'silver', 'gold'];
      const key = `trial${r.trial}`;
      if (order.indexOf(r.medal) > order.indexOf(profile.medals[key] ?? '')) profile.medals[key] = r.medal;
    }
    let newBest = false;
    let records = st.records;
    if (r.mode !== 'school' && (r.mode !== 'trial' || (r.medal !== null && r.completed))) {
      const prevBest = bestRecords(records, r.mode, r.trial, 1)[0];
      newBest = r.mode === 'trial' ? r.deliveries >= 3 && (!prevBest || r.trialTime < prevBest.time) : r.score > 0 && (!prevBest || r.score > prevBest.score);
      const rec = recordFromResult(r, RULES_VERSION);
      records = [...records, rec];
      void this.store.addRecord(rec);
    }
    void this.store.set('profile', profile);
    this.input.enabled = false;
    ui.set({ screen: 'results', result: r, profile, records, newBest });
  }

  private frame(): void {
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const screen = ui.get().screen;
    const s = this.session;
    if (s && screen === 'playing') {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= DT && steps < 4) {
        const frame = this.autopilot ? this.autopilot.drive(s) : this.input.frame();
        this.lastInput = frame;
        s.step(frame);
        this.dispatch(s.drainEvents());
        this.acc -= DT;
        steps++;
      }
      if (this.acc > DT * 4) this.acc = 0; // drop time rather than spiral when the tab stalls
      const view = this.input.view();
      this.view.render(Math.min(1, this.acc / DT), dt, view, this.lastInput.brake > 0.2);
      this.hud.update(dt, s, this.view);
      const v = s.vehicle;
      this.audio.update(dt, {
        speed: v.speed, throttle: s.phase === 'ended' ? 0 : this.lastInput.throttle, slide: v.slide, boost: v.boostActive, airborne: v.groundedCount === 0,
        surface: v.surface, pitch: v.spec.id === 'gull' ? 1.22 : v.spec.id === 'tempest' ? 0.84 : 1, pulseTier: s.pulse.tier,
        carrying: s.fares.state === 'carrying', active: s.phase !== 'ended',
      });
      if (this.finishTimer > 0) {
        this.finishTimer -= dt;
        if (this.finishTimer <= 0) void this.showResults();
      }
    } else {
      this.view.render(1, screen === 'paused' ? 0 : dt, NO_VIEW, false);
      this.audio.update(dt, { speed: 0, throttle: 0, slide: 0, boost: false, airborne: false, surface: 'asphalt', pitch: 1, pulseTier: 0, carrying: false, active: false });
    }
  }

  trialName(i: number): string {
    return TRIALS[i]?.name ?? '';
  }
}

export const game = new Game();
