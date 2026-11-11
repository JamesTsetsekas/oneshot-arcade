// Client orchestrator: owns the render loop, the local room + transport, the netcode session,
// and routes authoritative events to rendering, audio, HUD and the React shell.
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { AudioEngine } from '../audio/audio';
import type { Difficulty } from '../bots/bots';
import { DT, RULESET_VERSION, RULES_FULL, RULES_PRACTICE, RULES_QUICK, TICK_RATE, UTILITY, type Ruleset } from '../content/rules';
import { WEAPONS, computeSpread, isWeaponId } from '../content/weapons';
import { getAnnex } from '../map/annex';
import { calloutAt, type MapData } from '../map/build';
import { F_OPAQUE } from '../map/world';
import { ClientSession } from '../netcode/session';
import { LoopbackTransport } from '../netcode/transport';
import { PROTOCOL_VERSION, type BuyItem, type GameEvent, type Side, type ViewState } from '../protocol/types';
import { CharacterModel } from '../renderer/characters';
import { RenderCore } from '../renderer/core';
import { Fx } from '../renderer/fx';
import { buildMapVisual, buildSky, type MapVisual } from '../renderer/mapmesh';
import { ViewModel } from '../renderer/viewmodel';
import { Room } from '../server/room';
import { DEG, angleLerp, dirFromAngles, v3, wrapAngle } from '../shared/math';
import { simulateThrow } from '../sim/grenades';
import { eyeHeight } from '../sim/movement';
import { Hud } from '../ui/hud';
import type { UiStore } from '../ui/store';
import { Input, type Action } from './input';
import { loadHistory, pushHistory, saveSettings, type Settings } from './settings';

export interface MatchConfig {
  mode: 'quick' | 'full' | 'practice';
  side: Side | 'random';
  difficulty: Difficulty;
  autopilot?: boolean;
  seed?: number;
  /** simulated one-way latency in ms (net lab) */
  lag?: number;
}

const MENU_SHOTS: { p: [number, number, number]; t: [number, number, number]; d: [number, number, number] }[] = [
  { p: [35, 5.6, 30.5], t: [43, 2.2, 44], d: [6, 0, 0] },
  { p: [72, 5.8, 36.5], t: [61, 1.4, 47], d: [-5, 0.4, 2] },
  { p: [23.5, 2.6, 33.5], t: [12, 1.1, 44], d: [-3, 0, 3] },
  { p: [30, 7, 5], t: [44, 1, 16], d: [10, 0, 0] },
  { p: [57, 5.5, 75], t: [40, 1.2, 66], d: [-8, 0, 0] },
];

export class GameClient {
  core: RenderCore;
  audio = new AudioEngine();
  input: Input;
  hud: Hud;
  map: MapData;
  fx!: Fx;
  vm!: ViewModel;
  mapVisual!: MapVisual;
  sky!: Mesh;
  room: Room | null = null;
  session: ClientSession | null = null;
  transport: LoopbackTransport | null = null;
  config: MatchConfig | null = null;
  rules: Ruleset = RULES_QUICK;
  private chars = new Map<number, CharacterModel>();
  private acc = 0;
  private last = 0;
  private playing = false;
  private autopilot = false;
  private expectUnlock = false;
  private bigMap = false;
  private camY = 0;
  private punchP = 0;
  private punchY = 0;
  private specYaw = 0;
  private specPitch = 0;
  private prevYaw = 0;
  private prevPitch = 0;
  private menuT = 0;
  private fpsAcc = 0;
  private fpsFrames = 0;
  private fpsText = '';
  private uiTimer = 0;
  private reqId = 1;
  private pos = { x: 0, y: 0, z: 0, crouch: 0 };
  private tmpV = new Vector3();
  private tmpDir = v3();
  private wasAlive = false;
  private lastViewId = -1;
  private shake = 0;
  private firePrev = false;
  frames = 0;
  /** simulation fast-forward, used only by automated verification (1 = real time) */
  debugSpeed = 1;

  constructor(
    public canvas: HTMLCanvasElement,
    hudRoot: HTMLElement,
    public store: UiStore,
  ) {
    this.core = new RenderCore(canvas);
    this.map = getAnnex();
    this.input = new Input(canvas, () => this.store.get().settings);
    this.input.attachKeyUp();
    this.input.onAction = (a) => this.onAction(a);
    this.input.onLockChange = (locked) => this.onLock(locked);
    this.hud = new Hud(hudRoot, this.map);
    window.addEventListener('resize', () => this.core.resize());
    window.addEventListener('beforeunload', (e) => {
      // Ctrl+W (crouch + forward) must not silently close a live match
      if (this.playing && !this.autopilot && this.session?.world?.phase !== 'matchEnd') {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /** Builds the scene. Split across frames so the loading screen can paint. */
  async init(): Promise<void> {
    const tick = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
    this.store.set({ loadingText: 'Baking lighting for Aperture Annex' });
    await tick();
    await tick();
    this.mapVisual = buildMapVisual(this.core.scene, this.map);
    this.sky = buildSky(this.core.scene);
    this.store.set({ loadingText: 'Building equipment' });
    await tick();
    this.fx = new Fx(this.core);
    this.fx.onBeep = (x, y, z, remaining) => {
      this.sound('beep', x, y + 0.2, z, 1, 6);
      if (remaining < 10.05 && remaining > 9.8 && this.store.get().settings.captions) this.hud.caption('Cipher: 10 seconds');
    };
    this.vm = new ViewModel(this.core);
    this.vm.setVisible(false);
    this.mapVisual.barrier.setEnabled(false);
    this.applySettings(this.store.get().settings, false);
    this.core.engine.runRenderLoop(() => this.frame());
    this.store.set({ screen: 'menu', loadingText: '' });
  }

  // ------------------------------------------------------------------ settings
  applySettings(s: Settings, persist = true): void {
    this.store.set({ settings: s });
    if (persist) saveSettings(s);
    this.audio.musicVolume = s.musicVolume;
    this.audio.setVolume(s.volume);
    this.core.setPalette(s.palette);
    this.core.baseFov = s.fov;
    this.core.engine.setHardwareScalingLevel(1 / Math.max(0.5, Math.min(1, s.renderScale)));
    const root = document.documentElement.style;
    const pal = { default: ['#ffa01f', '#26d9ff'], alt: ['#ff6b1a', '#4d80ff'], contrast: ['#ffeb1a', '#d94dff'] }[s.palette] ?? ['#ffa01f', '#26d9ff'];
    root.setProperty('--atk', pal[0]);
    root.setProperty('--def', pal[1]);
  }

  // ------------------------------------------------------------------ match lifecycle
  startMatch(cfg: MatchConfig): void {
    this.endMatch();
    this.audio.unlock();
    this.audio.setMusic(false);
    const settings = this.store.get().settings;
    const seed = cfg.seed ?? (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    this.rules = cfg.mode === 'full' ? RULES_FULL : cfg.mode === 'practice' ? RULES_PRACTICE : RULES_QUICK;
    const side: Side = cfg.side === 'random' ? (seed & 1 ? 'atk' : 'def') : cfg.side;
    this.config = cfg;
    this.autopilot = !!cfg.autopilot;
    const room = (this.room = new Room({
      map: this.map,
      rules: this.rules,
      seed,
      humans: [{ name: settings.name || 'You', team: 0 }],
      team0Side: side,
      difficulty: cfg.difficulty,
      autopilot: cfg.autopilot,
    }));
    // version handshake: protocol, ruleset and collision representation must match the room
    const welcome = room.welcome(0);
    if (welcome.protocol !== PROTOCOL_VERSION || welcome.collisionHash !== this.map.collisionHash || welcome.ruleset !== RULESET_VERSION) {
      this.store.set({ screen: 'error', error: 'Version mismatch between client and match server. Reload the page to update.' });
      return;
    }
    const transport = (this.transport = new LoopbackTransport({ latency: cfg.lag ?? 0, jitter: cfg.lag ? cfg.lag * 0.2 : 0, loss: cfg.lag ? 0.01 : 0 }));
    const session = (this.session = new ClientSession(transport, this.map.world, welcome.playerId));
    session.onEvent = (ev) => this.onEvent(ev);
    session.passive = this.autopilot;
    room.connect(welcome.playerId, (f) => transport.sendDown(f));
    this.playing = true;
    this.acc = 0;
    this.wasAlive = false;
    this.hud.reset();
    this.hud.setVisible(true);
    this.fx.clearRound();
    this.store.set({ screen: 'game', overlay: '', summary: null, needClick: false, scoreboard: false, buyMsg: '' });
    this.input.enabled = true;
    if (!this.autopilot) {
      this.input.requestLock();
      const el = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
      if (this.input.forceCapture) return;
      // fullscreen + keyboard lock keeps browser shortcuts such as Ctrl+W from firing mid-round
      try {
        void el
          .requestFullscreen?.()
          .then(() => (navigator as unknown as { keyboard?: { lock?: (k: string[]) => Promise<void> } }).keyboard?.lock?.(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyT', 'KeyN', 'KeyF', 'KeyG', 'KeyB', 'Tab']))
          .catch(() => undefined);
      } catch {
        /* optional */
      }
    }
  }

  endMatch(): void {
    this.playing = false;
    this.room = null;
    this.session = null;
    this.transport = null;
    for (const c of this.chars.values()) c.dispose();
    this.chars.clear();
    this.hud.setVisible(false);
    if (this.vm) this.vm.setVisible(false);
    if (this.fx) this.fx.showTrajectory(null);
    this.input.enabled = false;
    if (this.mapVisual) this.mapVisual.barrier.setEnabled(false);
  }

  quitToMenu(): void {
    this.endMatch();
    this.expectUnlock = true;
    this.input.releaseLock();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    this.store.set({ screen: 'menu', overlay: '', history: loadHistory() });
    this.audio.setMusic(true);
    this.core.setFov(this.core.baseFov);
  }

  // ------------------------------------------------------------------ overlays / input routing
  private setOverlay(o: '' | 'buy' | 'pause' | 'result'): void {
    const prev = this.store.get().overlay;
    if (prev === o) return;
    this.store.set({ overlay: o, buyMsg: '' });
    if (this.room) this.room.paused = o === 'pause';
    if (o === '') {
      this.input.enabled = true;
      this.expectUnlock = false;
      if (!this.autopilot) this.input.requestLock();
    } else {
      this.input.enabled = false;
      this.expectUnlock = true;
      this.input.releaseLock();
      if (o === 'buy') this.pushUi(true);
    }
  }

  resume(): void {
    this.setOverlay('');
  }

  private onLock(locked: boolean): void {
    if (locked) {
      this.store.set({ needClick: false });
      return;
    }
    if (!this.playing || this.autopilot) return;
    const o = this.store.get().overlay;
    if (o === '' && !this.expectUnlock) this.setOverlay('pause');
    else if (o === '') this.store.set({ needClick: true });
    this.expectUnlock = false;
  }

  private onAction(a: Action): void {
    const st = this.store.get();
    if (!this.playing || !this.session) return;
    const s = this.session;
    if (a === 'escape') {
      if (st.overlay === 'buy' || st.overlay === 'pause') this.resume();
      else if (st.overlay === '') this.setOverlay('pause');
      return;
    }
    if (a === 'scoreDown' || a === 'scoreUp') {
      this.store.set({ scoreboard: a === 'scoreDown' });
      if (a === 'scoreDown') this.pushUi(true);
      return;
    }
    if (a === 'fps') {
      const set = { ...st.settings, showFps: !st.settings.showFps };
      this.applySettings(set);
      return;
    }
    if (a === 'buy') {
      if (st.overlay === 'buy') this.resume();
      else if (st.overlay === '' && s.own?.canBuy) this.setOverlay('buy');
      else if (st.overlay === '') this.hud.radio('', 'The buy menu is only available in your spawn during the buy phase.', true);
      return;
    }
    if (st.overlay !== '') return;
    if (a === 'click') {
      if (!this.input.isCaptured()) this.input.requestLock();
      return;
    }
    if (a === 'map') {
      this.bigMap = !this.bigMap;
      return;
    }
    if (a === 'ready') {
      s.command({ t: 'ready' });
      return;
    }
    if (!s.own?.alive) return;
    switch (a) {
      case 'slot1':
        s.command({ t: 'select', slot: 'primary' });
        break;
      case 'slot2':
        s.command({ t: 'select', slot: 'sidearm' });
        break;
      case 'slot3':
        s.command({ t: 'select', slot: 'tool' });
        break;
      case 'util0':
      case 'util1':
      case 'util2':
      case 'util3':
        s.command({ t: 'select', slot: 'util', util: Number(a.slice(4)) });
        break;
      case 'quick':
        s.command({ t: 'quick' });
        break;
      case 'drop':
        s.command({ t: 'drop' });
        break;
      case 'next':
        s.command({ t: 'cycle', dir: 1 });
        break;
      case 'prev':
        s.command({ t: 'cycle', dir: -1 });
        break;
      case 'inspect':
        this.vm.inspect();
        break;
      default:
        break;
    }
  }

  buy(item: BuyItem): void {
    this.session?.command({ t: 'buy', item, reqId: this.reqId++ });
  }
  refund(item: BuyItem): void {
    this.session?.command({ t: 'refund', item, reqId: this.reqId++ });
  }

  // ------------------------------------------------------------------ audio helpers
  private sound(kind: string, x: number, y: number, z: number, vol = 1, ref = 3): void {
    const cam = this.core.camera.position;
    const occluded = !this.map.world.segmentClear(cam.x, cam.y, cam.z, x, y + 0.3, z, F_OPAQUE);
    this.audio.play(kind, { x, y, z, vol, occluded, ref });
  }

  private nameOf(id: number): string {
    return this.session?.world?.roster[id]?.name ?? (id < 0 ? 'World' : 'Unit');
  }

  // ------------------------------------------------------------------ authoritative events
  private onEvent(ev: GameEvent): void {
    const s = this.session;
    if (!s) return;
    const own = s.own;
    const myId = s.playerId;
    const viewId = s.view ? s.view.id : -1;
    const myTeam = own ? own.team : 0;
    const roster = s.world?.roster;
    const settings = this.store.get().settings;
    switch (ev.t) {
      case 'shot': {
        const mine = ev.id === viewId;
        if (mine) {
          this.vm.onShot();
          this.audio.shot(ev.weapon, {}, true);
          const mz = this.vm.muzzleWorld(this.tmpV);
          if (!(s.view && s.view.scope > 0)) this.fx.tracer(mz.x, mz.y, mz.z, ev.ex, ev.ey, ev.ez);
          if (!settings.reduceMotion) this.shake = Math.min(1, this.shake + 0.12);
        } else {
          const cam = this.core.camera.position;
          const occluded = !this.map.world.segmentClear(cam.x, cam.y, cam.z, ev.ox, ev.oy, ev.oz, F_OPAQUE);
          this.audio.shot(ev.weapon, { x: ev.ox, y: ev.oy, z: ev.oz, occluded }, false);
          this.fx.tracer(ev.ox, ev.oy - 0.12, ev.oz, ev.ex, ev.ey, ev.ez);
        }
        for (const i of ev.impacts) this.fx.impact(i, settings.blood);
        break;
      }
      case 'melee':
        if (ev.id === viewId) this.vm.onSwing();
        break;
      case 'throw':
        if (ev.id === viewId) this.vm.onSwing();
        break;
      case 'hit':
        this.hud.hitmarker(ev.killed);
        this.audio.play(ev.zone === 'head' ? 'headshot' : 'hit');
        break;
      case 'hurt': {
        const v = s.view;
        if (v) {
          const ang = Math.atan2(ev.fx - v.move.x, ev.fz - v.move.z);
          if (ev.from >= 0 && ev.from !== myId) this.hud.hurt(wrapAngle(ang - (s.controlling ? this.input.yaw : v.yaw)));
          else this.hud.hurt(0);
        }
        this.audio.play('hurt');
        if (!settings.reduceMotion) this.shake = Math.min(1, this.shake + 0.5);
        break;
      }
      case 'kill': {
        const kAlly = roster && ev.killer >= 0 ? roster[ev.killer].team === myTeam : false;
        const vAlly = roster ? roster[ev.victim].team === myTeam : false;
        this.hud.kill(ev.killer >= 0 ? this.nameOf(ev.killer) : 'World', this.nameOf(ev.victim), ev.weapon, ev.head, ev.wall, kAlly, vAlly, ev.killer === myId || ev.victim === myId);
        if (ev.killer === myId) this.audio.play('killconfirm');
        const c = this.chars.get(ev.victim);
        if (c && c.visible) c.die(ev.dx, ev.dz);
        break;
      }
      case 'sound': {
        const mine = ev.id === viewId && ev.id >= 0;
        if (ev.kind === 'armed' || ev.kind === 'detonate' || ev.kind === 'disarmed') this.audio.play(ev.kind, { vol: 0.9 });
        else if (mine) this.audio.play(ev.kind, { vol: (ev.vol ?? 1) * (ev.kind.startsWith('step') ? 0.45 : 0.8) });
        else this.sound(ev.kind, ev.x, ev.y, ev.z, ev.vol ?? 1, ev.kind.startsWith('step') ? 2.6 : 4);
        if (settings.captions && !mine) {
          if (ev.kind === 'arm_start') this.hud.caption('Arming sound');
          else if (ev.kind === 'disarm_start') this.hud.caption('Disarm in progress');
        }
        break;
      }
      case 'veil':
        this.fx.veilPop(ev.x, ev.y, ev.z);
        if (settings.captions) this.hud.caption('Veil bloom');
        break;
      case 'flashpop':
        this.fx.flashPop(ev.x, ev.y, ev.z);
        if (settings.captions) this.hud.caption('Arc Flash');
        break;
      case 'blind':
        this.hud.flash(ev.amount, ev.duration);
        this.audio.ring(ev.duration, ev.amount);
        break;
      case 'frag':
        this.fx.explosion(ev.x, ev.y, ev.z);
        if (settings.captions) this.hud.caption('Fragment Charge');
        if (!settings.reduceMotion) {
          const cam = this.core.camera.position;
          this.shake = Math.min(1.5, this.shake + Math.max(0, 1.2 - Math.hypot(cam.x - ev.x, cam.z - ev.z) / 14));
        }
        break;
      case 'thermite':
        if (settings.captions) this.hud.caption('Thermite burning');
        break;
      case 'pulse':
        this.fx.pulse(ev.x, ev.y, ev.z);
        if (ev.wedges.length) this.hud.pulseWedges(ev.x, ev.z, ev.wedges);
        if (settings.captions) this.hud.caption(ev.team === myTeam ? `Pulse ${ev.n}: ${ev.wedges.length ? 'movement detected' : 'clear'}` : 'Enemy Pulse Shard');
        break;
      case 'shardbreak':
        this.fx.shardBreak(ev.x, ev.y, ev.z);
        break;
      case 'phase':
        this.onPhase(ev.phase, ev.round);
        break;
      case 'armed':
        this.hud.banner(`Cipher armed · Vault ${ev.site}`, own?.side === 'def' ? `Disarm it within ${this.rules.spikeTime} seconds` : 'Hold the vault until it detonates', '', 3.2);
        break;
      case 'disarmed':
        break;
      case 'detonated':
        this.fx.detonation(ev.x, ev.y, ev.z);
        this.hud.flash(0.8, 1.2);
        this.shake = 1.5;
        break;
      case 'roundend': {
        const won = ev.winnerTeam === myTeam;
        this.hud.banner(won ? 'Round won' : 'Round lost', `${ev.note}  ·  +$${ev.award}${ev.mvp >= 0 ? `  ·  MVP ${this.nameOf(ev.mvp)}` : ''}`, won ? 'win' : 'loss', 4.5);
        this.audio.play(won ? 'round_win' : 'round_loss', { vol: 0.8 });
        break;
      }
      case 'halftime':
        this.hud.radio('', 'Halftime — sides swap, economy resets to $' + this.rules.startMoney + '.', true);
        break;
      case 'matchend': {
        const sum = ev.summary;
        const me = sum.players[myId];
        const won = sum.winnerTeam < 0 ? null : sum.winnerTeam === myTeam;
        if (!this.autopilot) {
          pushHistory({
            date: new Date().toISOString(),
            mode: this.rules.name,
            score: [sum.score[myTeam], sum.score[1 - myTeam]],
            won,
            kills: me.kills,
            deaths: me.deaths,
            assists: me.assists,
            rounds: sum.rounds.length,
          });
        }
        this.store.set({ summary: sum });
        this.pushUi(true);
        window.setTimeout(() => {
          if (this.playing && this.session?.world?.phase === 'matchEnd') {
            this.setOverlay('result');
            this.audio.setMusic(true);
          }
        }, 1800);
        break;
      }
      case 'chat':
        this.hud.radio(ev.from >= 0 ? this.nameOf(ev.from) : '', ev.text, ev.kind === 'system');
        break;
      case 'buy':
        if (ev.ok) {
          this.audio.play('buy', { vol: 0.7 });
          this.store.set({ buyMsg: ev.refund ? `Refunded ${itemName(ev.item)}` : '' });
        } else {
          this.audio.play('deny', { vol: 0.7 });
          this.store.set({ buyMsg: `${itemName(ev.item)}: ${ev.reason}` });
        }
        this.pushUi(true);
        break;
      case 'pickup':
        break;
      case 'money':
        this.hud.moneyNotice(ev.amount, ev.reason);
        break;
      default:
        break;
    }
  }

  private onPhase(phase: string, round: number): void {
    const s = this.session;
    if (!s) return;
    if (phase === 'buy') {
      for (const c of this.chars.values()) c.reset();
      this.fx.clearRound();
      this.wasAlive = false;
      const side = s.own?.side ?? 'atk';
      this.hud.banner(`Round ${round}`, side === 'atk' ? 'INTRUSION — arm the Cipher Spike at Vault A or B' : 'CUSTODIAN — stop the arm, or disarm the Spike', '', 4);
      this.audio.play('round_start', { vol: 0.6 });
      if (this.store.get().overlay === 'buy') this.pushUi(true);
    } else if (phase === 'live') {
      if (this.store.get().overlay === 'buy') this.resume();
      this.audio.play('tick', { vol: 0.8 });
    }
  }

  // ------------------------------------------------------------------ React shell data (low rate)
  private pushUi(force = false): void {
    const s = this.session;
    if (!s || !s.own || !s.world) return;
    const st = this.store.get();
    if (!force && st.overlay !== 'buy' && !st.scoreboard && st.overlay !== 'result') return;
    const w = s.world;
    const own = s.own;
    const me = w.roster[own.id];
    const v = s.view && s.view.id === own.id ? s.view : null;
    this.store.set({
      buy: {
        money: own.money,
        side: own.side,
        timeLeft: w.phase === 'buy' ? Math.max(0, (w.phaseEnd - s.serverTick) / TICK_RATE) : 0,
        canBuy: own.canBuy,
        phase: w.phase,
        refundable: own.refundable,
        primary: v?.primary?.id ?? me.primary,
        sidearm: v?.sidearm?.id ?? me.sidearm,
        armor: v ? v.armor : Math.max(0, me.armor),
        helmet: v ? v.helmet : me.helmet,
        kit: v ? v.kit : me.kit,
        util: v ? v.util.slice() : [],
        mates: w.roster.filter((r) => r.team === own.team && r.id !== own.id),
        nextMin: own.nextRoundMin,
        infinite: this.rules.infiniteMoney,
      },
      board: { roster: w.roster, score: w.score, sides: w.sides, round: w.round, myTeam: own.team, myId: own.id, mode: this.rules.name },
    });
  }

  // ------------------------------------------------------------------ frame
  private frame(): void {
    const now = performance.now();
    const dt = Math.min(0.1, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.frames++;
    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc >= 0.5) {
      const fps = this.fpsFrames / this.fpsAcc;
      const s = this.session;
      this.fpsText = this.store.get().settings.showFps
        ? `${fps.toFixed(0)} fps\n${(this.fpsAcc / this.fpsFrames * 1000).toFixed(1)} ms\ntick ${this.room?.match.tick ?? 0}\ncorr ${s ? (s.lastCorrection * 100).toFixed(1) : 0} cm\ndraws ${this.core.scene.getActiveMeshes().length}`
        : '';
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
    if (this.playing && this.session && this.room && this.transport) {
      if (!this.room.paused) {
        this.acc += dt * this.debugSpeed;
        let steps = 0;
        const maxSteps = 8 * this.debugSpeed;
        while (this.acc >= DT && steps < maxSteps) {
          this.step();
          this.acc -= DT;
          steps++;
        }
        if (steps === maxSteps) this.acc = 0;
      }
      this.renderGame(this.room.paused ? 1 : this.acc / DT, dt);
      this.uiTimer += dt;
      if (this.uiTimer > 0.2) {
        this.uiTimer = 0;
        this.pushUi();
      }
    } else if (this.mapVisual) {
      this.menuCamera(dt);
    }
    this.core.scene.render();
  }

  private step(): void {
    const s = this.session!;
    const room = this.room!;
    const tr = this.transport!;
    const buttons = s.controlling ? this.input.sample() : 0;
    // while dead, a click cycles the spectated teammate
    const fire = this.input.fireHeld();
    if (fire && !this.firePrev && s.own && !s.own.alive && this.store.get().overlay === '') s.command({ t: 'spectate', dir: 1 });
    this.firePrev = fire;
    s.sendInput(buttons, this.input.yaw, this.input.pitch);
    tr.now += DT * 1000;
    tr.pumpUp((m) => room.receive(s.playerId, m));
    room.tick();
    tr.pumpDown((f) => s.onFrame(f));
  }

  private menuCamera(dt: number): void {
    this.menuT += dt;
    const dur = 16;
    const i = Math.floor(this.menuT / dur) % MENU_SHOTS.length;
    const k = (this.menuT % dur) / dur;
    const shot = MENU_SHOTS[i];
    const cam = this.core.camera;
    cam.position.set(shot.p[0] + shot.d[0] * k, shot.p[1] + shot.d[1] * k, shot.p[2] + shot.d[2] * k);
    const dx = shot.t[0] - cam.position.x;
    const dy = shot.t[1] - cam.position.y;
    const dz = shot.t[2] - cam.position.z;
    cam.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0);
    this.core.setFov(72);
    this.mapVisual.barrierMat.alpha = 0.22;
  }

  private charFor(id: number, side: Side): CharacterModel {
    let c = this.chars.get(id);
    if (c && c.side !== side) {
      c.dispose();
      c = undefined;
    }
    if (!c) {
      c = new CharacterModel(this.core, side);
      this.chars.set(id, c);
    }
    return c;
  }

  private renderGame(alpha: number, dt: number): void {
    const s = this.session!;
    const w = s.world;
    const own = s.own;
    if (!w || !own) return;
    const settings = this.store.get().settings;
    const view = s.view;
    const cam = this.core.camera;
    const controlling = s.controlling && !this.autopilot;
    const tickNow = s.serverTick + alpha - 1;

    // a fresh life (or a new spectate target) adopts the authoritative view direction
    if (view && own.alive && !this.wasAlive) {
      this.input.yaw = view.yaw;
      this.input.pitch = view.pitch;
    }
    this.wasAlive = own.alive;
    if (view && view.id !== this.lastViewId) {
      this.lastViewId = view.id;
      this.specYaw = view.yaw;
      this.specPitch = view.pitch;
      this.camY = view.move.y + eyeHeight(view.move.crouch);
    }

    let yaw = this.input.yaw;
    let pitch = this.input.pitch;
    let fov = this.core.baseFov;
    let spread = 0;
    if (view) {
      s.localPosition(alpha, this.pos);
      const targetY = this.pos.y + eyeHeight(this.pos.crouch);
      // smooth stair steps; follow falls and jumps exactly
      const diff = targetY - this.camY;
      if (view.move.onGround && Math.abs(diff) < 0.6) this.camY += diff * Math.min(1, dt * 20);
      else this.camY = targetY;
      if (!controlling) {
        this.specYaw = angleLerp(this.specYaw, view.yaw, Math.min(1, dt * 22));
        this.specPitch += (view.pitch - this.specPitch) * Math.min(1, dt * 22);
        yaw = this.specYaw;
        pitch = this.specPitch;
      }
      this.punchP += (view.punchP - this.punchP) * Math.min(1, dt * 26);
      this.punchY += (view.punchY - this.punchY) * Math.min(1, dt * 26);
      this.shake = Math.max(0, this.shake - dt * 5);
      const sh = this.shake * 0.006;
      cam.position.set(this.pos.x, this.camY, this.pos.z);
      cam.rotation.set(-(pitch + this.punchP) + Math.sin(this.frames * 1.7) * sh, yaw + this.punchY + Math.cos(this.frames * 2.3) * sh, 0);
      // weapon state
      const inst = view.slot === 'primary' ? view.primary : view.slot === 'sidearm' ? view.sidearm : null;
      const def = inst ? WEAPONS[inst.id] : WEAPONS.tool;
      if (view.scope > 0 && def.scope) fov = def.scope.fov[Math.min(def.scope.fov.length - 1, view.scope - 1)];
      this.input.zoomFactor = view.scope > 0 ? (Math.tan((fov * DEG) / 2) / Math.tan((this.core.baseFov * DEG) / 2)) * settings.scopeSensitivity : 1;
      const m = s.predicted;
      const speed = Math.hypot(m.vx, m.vz);
      if (inst)
        spread = computeSpread(def, { speed, maxSpeed: def.moveSpeed, onGround: m.onGround, crouch: m.crouch, landT: m.landT, heat: view.heat, scoped: view.scope > 0 });
      const item = view.slot === 'util' ? (view.util[view.utilSel] ?? 'tool') : inst ? inst.id : 'tool';
      const side = w.sides[w.roster[view.id]?.team ?? own.team];
      this.vm.setVisible(true);
      this.vm.setItem(item, side);
      this.vm.update(dt, {
        speed,
        onGround: m.onGround,
        reloading: view.reloading,
        drawing: view.drawing,
        scoped: view.scope > 0,
        busy: view.plant > 0 || view.defuse > 0,
        crouch: this.pos.crouch,
        dyaw: wrapAngle(yaw - this.prevYaw),
        dpitch: pitch - this.prevPitch,
        leftHand: settings.leftHand,
      });
      this.prevYaw = yaw;
      this.prevPitch = pitch;
      // Practice: trajectory preview from the same deterministic projectile sim the server uses
      if (this.rules.trajectoryPreview && view.slot === 'util' && view.util[view.utilSel] && controlling) {
        dirFromAngles(yaw, pitch, this.tmpDir);
        const ey = this.pos.y + eyeHeight(this.pos.crouch) - 0.05;
        const r = simulateThrow(this.map.world, view.util[view.utilSel], this.pos.x + this.tmpDir.x * 0.35, ey + this.tmpDir.y * 0.35, this.pos.z + this.tmpDir.z * 0.35, yaw, pitch, false, DT, 4, 4);
        this.fx.showTrajectory(r.points);
      } else this.fx.showTrajectory(null);
    } else {
      // whole team down: fixed tactical camera, never a free camera over live enemies
      this.vm.setVisible(false);
      this.fx.showTrajectory(null);
      const site = w.spike.site ? this.map.sites[w.spike.site] : this.map.sites.A;
      const cx = w.spike.x ?? site.center.x;
      const cz = w.spike.z ?? site.center.z;
      cam.position.set(cx - 7, 7.0, cz - 9);
      cam.rotation.set(0.62, Math.atan2(7, 9), 0);
      this.input.zoomFactor = 1;
    }
    this.core.setFov(fov);

    // --- remote characters (interest-filtered by the server)
    const samples = s.sampleRemotes(alpha);
    const viewId = view ? view.id : -1;
    const names: { x: number; y: number; text: string }[] = [];
    const seen = new Set<number>();
    const engine = this.core.engine;
    const rw = engine.getRenderWidth();
    const rh = engine.getRenderHeight();
    const cssScale = this.canvas.clientWidth / Math.max(1, rw);
    const transform = this.core.scene.getTransformMatrix();
    for (const p of samples) {
      if (p.id === viewId) continue;
      const ro = w.roster[p.id];
      if (!ro) continue;
      seen.add(p.id);
      const c = this.charFor(p.id, w.sides[ro.team]);
      if (c.dead) continue;
      c.update(p.x, p.y, p.z, p.yaw, p.pitch, p.crouch, p.speed, p.item, dt);
      if (ro.team === own.team && view) {
        this.tmpV.set(p.x, c.headY + 0.22, p.z);
        const pr = Vector3.Project(this.tmpV, Matrix.IdentityReadOnly, transform, cam.viewport.toGlobal(rw, rh));
        if (pr.z > 0 && pr.z < 1 && pr.x > 0 && pr.x < rw && pr.y > 0 && pr.y < rh) names.push({ x: pr.x * cssScale, y: pr.y * cssScale, text: ro.name });
      }
    }
    for (const [id, c] of this.chars) {
      if (c.dead) c.tick(dt);
      else if (!seen.has(id)) c.setVisible(false);
    }

    // --- world effects
    this.fx.syncWorld(w, tickNow, dt);
    this.fx.update(dt);
    const barriers = w.phase === 'buy' || w.phase === 'warmup';
    this.mapVisual.barrier.setEnabled(barriers);
    if (barriers) this.mapVisual.barrierMat.alpha = 0.2 + Math.sin(this.frames * 0.08) * 0.07;

    // --- audio listener
    dirFromAngles(yaw, pitch, this.tmpDir);
    this.audio.setListener(cam.position.x, cam.position.y, cam.position.z, this.tmpDir.x, this.tmpDir.y, this.tmpDir.z);

    // --- HUD
    const hfov = fov * DEG;
    this.hud.update(
      {
        own,
        view,
        world: w,
        tick: tickNow,
        settings,
        spread,
        pxPerRad: this.canvas.clientWidth / 2 / Math.tan(hfov / 2),
        yaw,
        callout: view ? calloutAt(this.map, this.pos.x, this.pos.z, this.pos.y) : '',
        names,
        veil: view ? this.fx.veilDepth(w, tickNow, cam.position.x, cam.position.y, cam.position.z) : 0,
        fps: this.fpsText,
        bigMap: this.bigMap,
        practice: this.rules.infiniteMoney,
      },
      dt,
    );
  }

  /** Small read-only summary for automation and the debug overlay. */
  debugState(): Record<string, unknown> {
    const s = this.session;
    const m = this.room?.match;
    return {
      playing: this.playing,
      frames: this.frames,
      tick: m?.tick ?? 0,
      phase: m?.phase ?? '',
      round: m?.round ?? 0,
      score: m ? [m.teams[0].score, m.teams[1].score] : [0, 0],
      alive: s?.own?.alive ?? false,
      view: s?.view
        ? {
            id: s.view.id,
            x: s.view.move.x,
            y: s.view.move.y,
            z: s.view.move.z,
            hp: s.view.hp,
            armor: s.view.armor,
            slot: s.view.slot,
            primary: s.view.primary,
            sidearm: s.view.sidearm,
            util: s.view.util,
            hasSpike: s.view.hasSpike,
            plant: s.view.plant,
          }
        : null,
      money: s?.own?.money ?? 0,
      side: s?.own?.side ?? '',
      yaw: this.input.yaw,
      pitch: this.input.pitch,
      predicted: s ? { x: s.predicted.x, y: s.predicted.y, z: s.predicted.z } : null,
      screen: this.store.get().screen,
      visibleEnemies: s?.world ? s.world.players.filter((p) => s.world!.roster[p.id].team !== s.own!.team).length : 0,
      // enemies near the centre of the current view (used by the capture script to frame a shot)
      enemiesInView:
        s?.world && s.view
          ? s.world.players.filter((p) => {
              if (s.world!.roster[p.id].team === s.own!.team) return false;
              const dx = p.x - s.view!.move.x;
              const dz = p.z - s.view!.move.z;
              const d = Math.hypot(dx, dz) || 1;
              return d > 3 && d < 30 && (dx * Math.sin(s.view!.yaw) + dz * Math.cos(s.view!.yaw)) / d > 0.93;
            }).length
          : 0,
      correctionCm: s ? s.maxCorrection * 100 : 0,
      meshes: this.core.scene.getActiveMeshes().length,
      fps: this.core.engine.getFps(),
      overlay: this.store.get().overlay,
    };
  }
}

function itemName(item: string): string {
  if (isWeaponId(item)) return WEAPONS[item].name;
  if (item in UTILITY) return UTILITY[item as keyof typeof UTILITY].name;
  return item === 'vest' ? 'Vest' : item === 'vesthelm' ? 'Vest + Helmet' : item === 'kit' ? 'Disarm Kit' : item;
}

export type { ViewState };
