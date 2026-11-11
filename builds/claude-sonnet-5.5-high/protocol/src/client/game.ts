// The game shell: owns the local authoritative room (simulation + bots), the client netcode, input, rendering,
// audio and UI, and runs the fixed 64 Hz tick with a decoupled render loop.

import { AudioEngine } from '../audio/audio';
import { MOVEMENT, RULESETS, UTILITY } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import { PALETTES } from '../render/models';
import { CameraState, GameRenderer, ViewmodelState } from '../render/renderer';
import { NetLink, PERFECT_LINK } from '../server/link';
import { ServerRoom } from '../server/room';
import { BotBrain, DIFFICULTY, TeamAI, installBots } from '../sim/bots';
import { predictThrow } from '../sim/grenades';
import { MAP_HASH, calloutAt } from '../sim/map';
import { Match, TICK_RATE, newMatch } from '../sim/match';
import { Vec3, anglesFromDir, clamp, dirFromAngles, lerp } from '../sim/math';
import { eyeHeight } from '../sim/movement';
import type { GameEvent, Side } from '../sim/types';
import { computeSpread, kickNow } from '../sim/weapons';
import { BuyMenu } from '../ui/buy';
import { Hud, HudFrame, el } from '../ui/hud';
import { MapDraw, MapPulse } from '../ui/minimap';
import { Menus, StartOptions } from '../ui/menus';
import { EndScreen, Scoreboard, TacticalMap } from '../ui/overlays';
import { ClientNet, RenderedPlayer } from './netcode';
import { InputState } from './input';
import { Settings, loadSettings, saveSettings } from './settings';

const DT = 1 / TICK_RATE;
const TICK_MS = 1000 / TICK_RATE;

export interface DevFlags { dev: boolean; autoplay: boolean; seed?: number; side?: 'int' | 'cus'; rules?: 'quick' | 'full'; difficulty?: 'easy' | 'normal' | 'hard'; practice?: boolean }

export class Game {
  settings: Settings = loadSettings();
  audio = new AudioEngine();
  renderer: GameRenderer;
  input: InputState;
  hud: Hud;
  buy: BuyMenu;
  scoreboard: Scoreboard;
  tacmap: TacticalMap;
  endScreen: EndScreen;
  menus: Menus;

  match: Match | null = null;
  room: ServerRoom | null = null;
  link: NetLink | null = null;
  net: ClientNet | null = null;
  autoplayBrain: BotBrain | null = null;
  startOpts: StartOptions | null = null;
  practice = false;

  private lastFrame = performance.now();
  private acc = 0;
  private clockMs = 0;
  private running = false;
  paused = false;
  private ended = false;
  private endShownAt = 0;
  private fps = 60;
  private frames = 0;
  private fpsT = 0;
  private bodyPrev = { x: 0, y: 0, z: 0 };
  private bodyCur = { x: 0, y: 0, z: 0 };
  private eyeY = 0;
  private haveEye = false;
  private shownKick = { pitch: 0, yaw: 0 };
  private pulses: MapPulse[] = [];
  private roundKills = new Map<number, number>();
  private lastFlashUntil = 0;
  private spectateId = -1;
  private names: string[] = [];
  private lastPhase = '';
  private lastRound = 0;
  private firstBuyOpened = false;
  private autoBuyPending = false;
  private lastStepAudioT = 0;
  private lastScoped = 0;
  private flashFx = { duration: 0 };
  private statsAcc = { ticks: 0, tickMs: 0, maxTickMs: 0 };
  dev: DevFlags;
  private shotAt = new Map<number, number>();
  private prevSnapTick = -1;
  private backdropT = 0;
  private lastAmmoWarn = 0;

  constructor(private canvas: HTMLCanvasElement, root: HTMLElement, dev: DevFlags) {
    this.dev = dev;
    this.renderer = new GameRenderer(canvas, this.settings);
    this.input = new InputState(canvas, () => this.settings);
    const hudEl = document.getElementById('hud')!;
    this.hud = new Hud(hudEl);
    const overlays = document.getElementById('screens')!;
    this.buy = new BuyMenu(overlays);
    this.scoreboard = new Scoreboard(overlays);
    this.tacmap = new TacticalMap(overlays);
    this.endScreen = new EndScreen(overlays);
    this.menus = new Menus(overlays, () => this.settings);
    void root;

    this.menus.onStart = (o) => this.startMatch(o);
    this.menus.onResume = () => this.resume();
    this.menus.onQuit = () => this.quitToMenu();
    this.menus.onUiClick = () => { this.audio.resume(); this.audio.uiClick(); };
    this.menus.onSettingsChanged = () => this.applySettings();
    this.endScreen.onRematch = () => { if (this.startOpts) this.startMatch(this.startOpts); };
    this.endScreen.onMenu = () => this.quitToMenu();
    this.buy.onBuy = (id) => this.net?.requestBuy(id);
    this.buy.onRefund = (id) => this.net?.requestRefund(id);
    this.buy.onClose = () => this.closeBuy();

    this.input.onPointerLockChange = (locked) => this.onLockChange(locked);
    this.input.onKeyAction = (code, down) => this.onKey(code, down);
    this.input.onWheelSpectate = () => undefined;
    document.addEventListener('mousedown', (e) => { if (this.running && this.input.locked && this.isDead() && e.button === 0) this.cycleSpectate(1); });
    window.addEventListener('resize', () => this.renderer.resize());
    this.applySettings();
    requestAnimationFrame((t) => this.frame(t));
  }

  applySettings(): void {
    this.renderer.setSettings(this.settings);
    this.audio.volume = this.settings.volume; this.audio.sfxVolume = this.settings.sfxVolume; this.audio.musicVolume = this.settings.musicVolume;
    this.audio.applyVolumes();
    const pal = PALETTES[this.settings.colorblind];
    document.documentElement.style.setProperty('--cus', '#' + pal.cus.toString(16).padStart(6, '0'));
    document.documentElement.style.setProperty('--int', '#' + pal.int.toString(16).padStart(6, '0'));
    saveSettings(this.settings);
  }

  // ------------------------------------------------------------------ lifecycle
  startMatch(o: StartOptions): void {
    this.audio.resume();
    this.audio.stopMusic();
    this.startOpts = o;
    this.practice = o.mode === 'practice';
    const side: Side = o.side === 'random' ? (Math.random() < 0.5 ? 'int' : 'cus') : o.side;
    const seed = this.dev.seed ?? ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    const rules = this.practice ? RULESETS.practice : RULESETS[o.rules];
    const humanIds = [0];
    const names = ['You', 'Vesper', 'Halcyon', 'Quill', 'Ember', 'Tarn', 'Juno', 'Cobalt', 'Sable', 'Pike'];
    this.match = newMatch({ seed, rules, squad0Side: side, humanIds, practice: this.practice, names });
    const ais = installBots(this.match, o.difficulty);
    void ais;
    this.names = names;
    this.room = new ServerRoom(this.match);
    this.link = new NetLink(PERFECT_LINK);
    this.room.addClient(0, this.link.server);
    this.net = new ClientNet(this.link.client);
    this.net.practice = this.practice;
    this.net.hello('You');
    if (this.dev.autoplay) {
      const ai = { cus: new TeamAI('cus'), int: new TeamAI('int') };
      // The autoplay brain shares the same team planners as the bots on its squad.
      const brains = Array.from(this.match.brains.values()) as BotBrain[];
      void brains;
      this.autoplayBrain = new BotBrain(DIFFICULTY.hard, ai);
      // Shared planners: reuse the planners of the bots so the autoplayer follows the same plan.
      const first = this.match.brains.get(1) as BotBrain | undefined;
      if (first) (this.autoplayBrain as any).ai = (first as any).ai;
    } else this.autoplayBrain = null;
    this.clockMs = performance.now();
    this.acc = 0;
    this.ended = false; this.endShownAt = 0;
    this.input.yaw = 0; this.input.pitch = 0;
    this.haveEye = false;
    this.pulses = [];
    this.roundKills.clear();
    this.lastPhase = ''; this.lastRound = 0;
    this.firstBuyOpened = false;
    this.prevSnapTick = -1;
    this.spectateId = -1;
    this.shownKick = { pitch: 0, yaw: 0 };
    this.hud.clearTransient();
    this.endScreen.hide();
    this.menus.showLoading('Loading Aperture Annex', 0.3);
    // Pre-run a few ticks so the first snapshot exists before the first rendered frame.
    for (let i = 0; i < 8; i++) this.tick(false);
    this.running = true;
    this.paused = true; // until deployed
    this.hud.setVisible(true);
    this.renderer.clearRound();
    if (this.dev.dev) this.deploy();
    else this.menus.showDeploy(() => this.deploy(), `${this.practice ? 'Practice' : RULESETS[o.rules].name} · you play ${side === 'int' ? 'Intrusion (attack)' : 'Custodian (defend)'} first`);
  }

  private deploy(): void {
    this.audio.resume();
    this.menus.clear();
    this.paused = false;
    this.lastFrame = performance.now();
    this.clockMs = performance.now();
    this.acc = 0;
    if (!this.dev.autoplay) this.input.lock();
    if (this.autoBuyPending && !this.firstBuyOpened) {
      this.firstBuyOpened = true;
      this.autoBuyPending = false;
      setTimeout(() => { if (this.running && !this.paused && this.net?.latest?.phase === 'buy') this.openBuy(); }, 900);
    }
    document.getElementById('hud')!.classList.remove('hidden');
  }

  private resume(): void {
    this.menus.clear();
    this.paused = false;
    this.lastFrame = performance.now();
    this.input.lock();
  }

  private pause(): void {
    if (!this.running || this.paused || this.ended) return;
    this.paused = true;
    this.menus.showPause();
  }

  quitToMenu(): void {
    this.running = false;
    this.paused = false;
    this.match = null; this.room = null; this.net = null; this.link = null;
    this.input.unlock();
    this.hud.setVisible(false);
    this.buy.show(false); this.tacmap.show(false); this.scoreboard.show(false);
    this.endScreen.hide();
    this.renderer.clearRound();
    this.menus.showTitle();
    this.audio.startMusic();
  }

  private onLockChange(locked: boolean): void {
    if (!this.running || this.ended || this.dev.autoplay) return;
    if (locked) {
      if (this.paused && this.menus.visible) { this.menus.clear(); this.paused = false; this.lastFrame = performance.now(); }
    } else if (!this.buy.open && !this.endScreen.root.classList.contains('hidden') === false) {
      this.pause();
    }
  }

  private onKey(code: string, down: boolean): void {
    if (!this.running) return;
    if (down && this.buy.open && this.buy.handleKey(code)) return;
    if (code === 'Tab') { this.scoreboard.show(down && !this.paused); return; }
    if (!down) return;
    if (this.paused || this.ended) return;
    switch (code) {
      case 'KeyB': {
        const s = this.net?.latest;
        if (s && s.self.alive && (s.self.canBuy || this.practice)) this.openBuy();
        break;
      }
      case 'KeyM': this.tacmap.show(!this.tacmap.open); break;
      case 'ArrowRight': if (this.isDead()) this.cycleSpectate(1); break;
      case 'ArrowLeft': if (this.isDead()) this.cycleSpectate(-1); break;
      case 'Escape': if (!this.input.locked && !this.buy.open) this.pause(); break;
    }
  }

  private openBuy(): void {
    this.buy.show(true);
    this.input.captureDigits = true;
    this.input.captureWithoutLock = true;
    this.input.unlock();
    this.audio.uiClick();
  }

  closeBuy(): void {
    this.buy.show(false);
    this.input.captureDigits = false;
    this.input.captureWithoutLock = false;
    if (this.running && !this.paused && !this.ended && !this.dev.autoplay) this.input.lock();
  }

  private isDead(): boolean { return !!this.net?.latest && !this.net.latest.self.alive; }

  private cycleSpectate(dir: number): void {
    const s = this.net?.latest;
    if (!s) return;
    const mates = s.players.filter((p) => !p.spotted && p.alive && p.id !== s.self.id).map((p) => p.id);
    if (!mates.length) return;
    const i = mates.indexOf(this.spectateId);
    this.spectateId = mates[(i + dir + mates.length * 2) % mates.length];
  }

  // ------------------------------------------------------------------ tick
  private tick(sendInput = true): void {
    const m = this.match, room = this.room, net = this.net, link = this.link;
    if (!m || !room || !net || !link) return;
    const t0 = performance.now();
    this.clockMs += TICK_MS;
    link.now = this.clockMs;
    if (sendInput) {
      const snap = net.latest;
      const frozen = !!snap && (snap.phase === 'matchEnd' || snap.phase === 'halftime' || !snap.self.alive) && !this.input.captureWithoutLock;
      let partial;
      if (this.autoplayBrain) {
        const p = m.players[0];
        const c = this.autoplayBrain.think(m, p);
        partial = { moveX: c.moveX, moveZ: c.moveZ, yaw: c.yaw, pitch: c.pitch, fire: c.fire, alt: c.alt, jump: c.jump, crouch: c.crouch, walk: c.walk, use: c.use, reload: c.reload, select: c.select, buy: c.buy ? undefined : undefined } as any;
        if (c.buy) net.requestBuy(c.buy.item);
        this.input.yaw = c.yaw; this.input.pitch = c.pitch;
      } else {
        partial = this.input.sample(frozen || this.paused);
        if (this.buy.open) { partial.fire = false; partial.alt = false; }
      }
      this.bodyPrev = { ...net.body.pos };
      net.sendInput(partial, this.clockMs);
      this.bodyCur = { ...net.body.pos };
    }
    room.step();
    net.poll(this.clockMs);
    const dtm = performance.now() - t0;
    this.statsAcc.ticks++; this.statsAcc.tickMs += dtm; this.statsAcc.maxTickMs = Math.max(this.statsAcc.maxTickMs, dtm);
  }

  // ------------------------------------------------------------------ frame
  private frame(nowRaw: number): void {
    requestAnimationFrame((t) => this.frame(t));
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { this.fps = this.frames / this.fpsT; this.frames = 0; this.fpsT = 0; }

    if (!this.running || !this.net || !this.net.latest || !this.match) { this.renderBackdrop(dt); return; }
    const net = this.net;

    if (!this.paused) {
      this.acc += dt;
      let guard = 0;
      while (this.acc >= DT && guard++ < 8) { this.tick(); this.acc -= DT; }
      if (guard >= 8) this.acc = 0;
    }
    const snap = net.latest!;
    const renderMs = this.clockMs + this.acc * 1000;
    const serverTime = net.serverTickAt(renderMs) / TICK_RATE;

    // ----- events
    const events = net.drainEvents();
    if (events.length) this.handleEvents(events, snap, serverTime);

    // ----- phase transitions (banners, buy menu, music)
    this.phaseUi(snap);

    // ----- local view
    const self = snap.self;
    const dead = !self.alive;
    const selfW = self.cur === 'primary' ? self.weapons.primary : self.cur === 'secondary' ? self.weapons.secondary : self.cur === 'tool' ? self.weapons.tool : null;
    const selfDef = selfW ? WEAPONS[selfW.id] : null;
    const scopeLevel = selfW?.scope ?? 0;
    const zoomFov = selfDef?.scoped && scopeLevel > 0 ? selfDef.scoped.zoomFov[scopeLevel - 1] : null;

    const lookActive = this.input.locked && !this.paused && !this.buy.open && !this.ended && !this.dev.autoplay && !dead;
    if (lookActive) {
      const sensMul = zoomFov ? (zoomFov / this.settings.fov) * this.settings.adsSensitivity : 1;
      this.input.applyLook(sensMul);
    } else { this.input.applyLook(0); }
    if (scopeLevel !== this.lastScoped) { this.lastScoped = scopeLevel; }

    net.smooth(dt);
    const remote = net.interpolated(renderMs);

    // pick the camera subject
    let viewId = self.id;
    let spectating = false;
    let camPos: Vec3; let yaw = this.input.yaw, pitch = this.input.pitch;
    let spectated: RenderedPlayer | undefined;
    if (dead) {
      const mates = remote.filter((p) => !p.spotted && p.alive);
      if (!mates.some((p) => p.id === this.spectateId)) this.spectateId = mates.length ? mates[0].id : -1;
      spectated = mates.find((p) => p.id === this.spectateId);
    }
    if (dead && spectated) {
      spectating = true; viewId = spectated.id;
      camPos = { x: spectated.pos.x, y: spectated.pos.y + eyeHeight(spectated.crouch), z: spectated.pos.z };
      yaw = spectated.yawOut; pitch = spectated.pitch;
    } else {
      const a = this.paused ? 0 : this.acc / DT;
      const bx = lerp(this.bodyPrev.x, net.body.pos.x, 0), bz = lerp(this.bodyPrev.z, net.body.pos.z, 0);
      void bx; void bz;
      const px = lerp(this.bodyPrev.x, this.bodyCur.x, clamp(a, 0, 1));
      const pz = lerp(this.bodyPrev.z, this.bodyCur.z, clamp(a, 0, 1));
      const py = lerp(this.bodyPrev.y, this.bodyCur.y, clamp(a, 0, 1));
      const base = dead ? { x: self.pos.x, y: self.pos.y, z: self.pos.z } : { x: px + net.errX, y: py + net.errY, z: pz + net.errZ };
      const targetEye = base.y + eyeHeight(net.body.crouch);
      if (!this.haveEye || Math.abs(targetEye - this.eyeY) > 0.6) { this.eyeY = targetEye; this.haveEye = true; }
      else this.eyeY += (targetEye - this.eyeY) * (1 - Math.exp(-dt * 26));
      camPos = { x: base.x, y: this.eyeY, z: base.z };
      if (dead) { yaw = this.input.yaw; pitch = this.input.pitch; }
    }

    // recoil kick (what the crosshair shows)
    let kp = 0, ky = 0;
    if (!spectating && selfW && selfDef && selfDef.mode !== 'melee' && self.alive) {
      const k = kickNow(selfW as any, selfDef, serverTime);
      this.shownKick.pitch += (k.pitch - this.shownKick.pitch) * Math.min(1, dt * 60);
      this.shownKick.yaw += (k.yaw - this.shownKick.yaw) * Math.min(1, dt * 60);
      kp = this.shownKick.pitch; ky = this.shownKick.yaw;
    } else { this.shownKick.pitch *= 0.8; this.shownKick.yaw *= 0.8; }

    const cam: CameraState = { pos: camPos, yaw, pitch, kickPitch: kp, kickYaw: ky, zoomFov: spectating ? null : zoomFov, roll: 0 };

    // viewmodel
    const vm = this.viewmodelState(snap, spectated, serverTime, scopeLevel, dt);

    // practice trajectory
    let trajectory: Vec3[] | null = null;
    if (this.practice && self.alive && self.cur.startsWith('util')) {
      const dir = dirFromAngles(this.input.yaw, this.input.pitch + 0.1);
      const eye = camPos;
      const start = { x: eye.x + dir.x * 0.45, y: eye.y + dir.y * 0.45 - 0.1, z: eye.z + dir.z * 0.45 };
      const spd = this.input.buttons.has(2) ? 9 : 20;
      const r = predictThrow(start, { x: dir.x * spd + net.body.vel.x * 0.5, y: dir.y * spd + net.body.vel.y * 0.3, z: dir.z * spd + net.body.vel.z * 0.5 }, 64 * 4);
      trajectory = r.path;
    }

    this.audio.listener = { x: camPos.x, y: camPos.y, z: camPos.z, yaw };
    this.renderer.render(dt, snap, remote, cam, vm, serverTime, self.id, trajectory, spectating ? viewId : null);

    // ----- HUD
    const mapData = this.mapData(snap, remote, camPos, yaw);
    const spread = this.currentSpread(snap, selfW, selfDef, serverTime);
    const vfov = this.renderer.camera.fov;
    const frame: HudFrame = {
      snap, serverTime, settings: this.settings, viewId, spectating, spread, vfov, mapData, pos: { x: camPos.x, z: camPos.z }, scopeLevel: spectating ? 0 : scopeLevel,
      fps: this.fps, names: this.names, highlight: '',
    };
    this.hud.update(dt, frame, 0);
    this.scoreboard.update(snap);
    this.tacmap.update(mapData);
    if (this.buy.open) this.buy.update({ snap, side: snap.squadSide[self.id < 5 ? 0 : 1], practice: this.practice });
    for (const p of this.pulses) p.age += dt;
    this.pulses = this.pulses.filter((p) => p.age < 3);

    // flash from authoritative state
    if (self.alive && self.flashUntil > serverTime + 0.05 && self.flashUntil !== this.lastFlashUntil) {
      this.lastFlashUntil = self.flashUntil;
      this.hud.flash(self.flashUntil - serverTime, Math.max(0, self.flashFull - serverTime), this.settings.reduceFlash);
      this.audio.flashPop({ x: camPos.x, y: camPos.y, z: camPos.z });
    }

    // end of match
    if (snap.phase === 'matchEnd' && !this.ended) {
      this.endShownAt = performance.now();
      this.ended = true;
      this.audio.stinger(snap.winnerSquad === (self.id < 5 ? 0 : 1) ? 'win' : 'lose');
      setTimeout(() => {
        if (!this.running || !this.net?.latest) return;
        this.input.unlock();
        this.scoreboard.show(false);
        this.buy.show(false);
        this.hud.hideBanner();
        const s = this.net.latest;
        this.endScreen.show({ snap: s, winnerSquad: s.winnerSquad ?? -1, names: this.names, colors: { cus: '#2fe0ff', int: '#ffa726' } });
        this.audio.startMusic();
      }, 3000);
    }
    void nowRaw;
  }

  private renderBackdrop(dt: number): void {
    this.backdropT += dt;
    const t = this.backdropT * 0.07;
    const r = this.renderer;
    // Slow dolly along the central axis (yard to calibration chamber), with a gentle yaw sweep.
    const z = 52 + Math.sin(t) * 12;
    const x = 48 + Math.sin(t * 0.7) * 5;
    r.camera.fov = 66;
    r.camera.position.set(x, 3.4, z);
    r.camera.rotation.order = 'YXZ';
    r.camera.rotation.set(-0.1, Math.sin(t * 0.9) * 0.6, 0);
    r.camera.updateProjectionMatrix();
    r.renderer.clear();
    r.renderer.render(r.scene, r.camera);
  }

  private viewmodelState(snap: NonNullable<ClientNet['latest']>, spectated: RenderedPlayer | undefined, serverTime: number, scopeLevel: number, dt: number): ViewmodelState {
    const self = snap.self;
    let weapon: WeaponId | null = null;
    let w = null as null | (typeof self.weapons.primary);
    if (spectated) {
      weapon = spectated.weapon === 'util' ? null : spectated.weapon;
    } else if (self.alive) {
      w = self.cur === 'primary' ? self.weapons.primary : self.cur === 'secondary' ? self.weapons.secondary : self.cur === 'tool' ? self.weapons.tool : null;
      weapon = w ? w.id : null;
    }
    const def = weapon ? WEAPONS[weapon] : null;
    const sinceShot = w ? Math.max(0, serverTime - w.lastShot) : 9;
    const reloading = !!w?.reloading;
    const reloadProgress = w && def && reloading ? 1 - clamp((w.reloadEnd - serverTime) / Math.max(0.1, def.reloadTime), 0, 1) : 0;
    const drawProgress = w && def ? clamp((serverTime - (w.readyAt - def.drawTime)) / Math.max(0.1, def.drawTime), 0, 1) : 1;
    const speed = spectated ? 0 : Math.hypot(this.net!.body.vel.x, this.net!.body.vel.z);
    return {
      weapon, visible: weapon !== null && scopeLevel === 0 && !(!self.alive && !spectated), speed, onGround: this.net!.body.onGround, crouch: this.net!.body.crouch,
      sinceShot, reloading, reloadProgress, drawProgress, inspect: 0, swingT: 0, swayX: this.input.swayX, swayY: this.input.swayY, interacting: self.interact.kind !== null,
    };
    void dt;
  }

  private currentSpread(snap: NonNullable<ClientNet['latest']>, w: any, def: any, serverTime: number): number {
    if (!w || !def || def.mode === 'melee') return 0;
    const b = this.net!.body;
    const fake = { onGround: b.onGround, landPenalty: b.landPenalty, crouch: b.crouch } as any;
    const hs = Math.hypot(b.vel.x, b.vel.z);
    const ws = { heat: 0, lastShot: w.lastShot, scopeLevel: w.scope } as any;
    void snap;
    return computeSpread(fake, ws, def, serverTime, hs);
  }

  private mapData(snap: NonNullable<ClientNet['latest']>, remote: RenderedPlayer[], camPos: Vec3, yaw: number): MapDraw {
    const self = snap.self;
    const mySquad = self.id < 5 ? 0 : 1;
    const mySide = snap.squadSide[mySquad];
    const players = remote.map((p) => ({ id: p.id, x: p.pos.x, z: p.pos.z, yaw: p.yawOut, alive: p.alive, spotted: p.spotted, side: (p.spotted ? (mySide === 'cus' ? 'int' : 'cus') : mySide) as Side, self: false }));
    players.push({ id: self.id, x: camPos.x, z: camPos.z, yaw, alive: self.alive, spotted: false, side: mySide, self: true });
    const sp = snap.spike;
    const pal = PALETTES[this.settings.colorblind];
    return {
      players,
      spike: sp.pos && (sp.state === 'planted' || sp.state === 'dropped') ? { x: sp.pos.x, z: sp.pos.z, state: sp.state } : null,
      smokes: snap.smokes.filter((s) => s.bloomIn <= 0).map((s) => ({ x: s.x, z: s.z, r: s.r })),
      fires: snap.fires.flatMap((f) => { const o: Array<{ x: number; z: number }> = []; for (let i = 0; i < f.cells.length; i += 3) o.push({ x: f.cells[i], z: f.cells[i + 2] }); return o; }),
      pulses: this.pulses,
      colors: { cus: '#' + pal.cus.toString(16).padStart(6, '0'), int: '#' + pal.int.toString(16).padStart(6, '0') },
      grenades: snap.grenades.filter((g) => g.owner === self.id || true).map((g) => ({ x: g.x, z: g.z, type: g.type })),
    };
  }

  // ------------------------------------------------------------------ UI reactions
  private phaseUi(snap: NonNullable<ClientNet['latest']>): void {
    const mySquad = snap.self.id < 5 ? 0 : 1;
    const mySide = snap.squadSide[mySquad];
    if (snap.phase !== this.lastPhase || snap.round !== this.lastRound) {
      const prev = this.lastPhase;
      this.lastPhase = snap.phase;
      this.lastRound = snap.round;
      if (snap.phase === 'buy') {
        this.roundKills.clear();
        this.renderer.clearRound();
        this.hud.clearTransient();
        this.audio.stopMusic();
        this.hud.showStatusBanner(`Round ${snap.round}`, mySide === 'int' ? 'Intrusion · carry the Spike to A or B' : 'Custodian · hold both vaults', 3000);
        if (snap.round === 1 && !this.dev.autoplay) this.autoBuyPending = true;
      } else if (snap.phase === 'live' && prev === 'buy') {
        if (this.buy.open) this.closeBuy();
        this.audio.stinger('start');
        this.hud.showStatusBanner('Go', 'Round live', 1200);
      } else if (snap.phase === 'halftime') {
        this.hud.showStatusBanner('Halftime', 'Sides swap · economy resets', 5500);
        this.audio.stinger('half');
        this.audio.startMusic();
        if (this.buy.open) this.closeBuy();
      }
    }
    if (snap.phase === 'buy' && snap.phaseRemaining < 0.2 && this.buy.open) this.closeBuy();
  }

  private handleEvents(events: GameEvent[], snap: NonNullable<ClientNet['latest']>, serverTime: number): void {
    const selfId = snap.self.id;
    const mySquad = selfId < 5 ? 0 : 1;
    const sideOf = (id: number): Side => snap.squadSide[id < 5 ? 0 : 1];
    const nameOf = (id: number) => (id >= 0 ? this.names[id] ?? 'Player' : 'World');
    const pos = (v: Vec3) => ({ x: v.x, y: v.y, z: v.z });
    const cap = this.settings.captions;
    for (const e of events) {
      this.renderer.handleEvent(e, snap, selfId);
      switch (e.t) {
        case 'shot': {
          const def = WEAPONS[e.weapon];
          this.audio.shot(def.cls, pos(e.o), e.id === selfId);
          if (e.id === selfId) this.renderer.localShotFlash(e.o);
          else if (cap && sideOf(e.id) !== sideOf(selfId)) this.captionDir('Gunfire', e.o);
          break;
        }
        case 'step': {
          if (e.id === selfId) { if (e.kind === 'land') this.audio.land(undefined, true); else if (e.kind === 'jump') this.audio.click(undefined, 'jump', true); else this.audio.step(undefined, e.loud, true); }
          else {
            if (e.kind === 'land') this.audio.land(pos(e.p)); else this.audio.step(pos(e.p), e.loud);
            if (cap && sideOf(e.id) !== sideOf(selfId) && e.loud > 0.5 && performance.now() - this.lastStepAudioT > 700) { this.lastStepAudioT = performance.now(); this.captionDir('Footsteps', e.p); }
          }
          break;
        }
        case 'sfx': this.audio.click(e.id === selfId ? undefined : pos(e.p), e.kind as any, e.id === selfId); break;
        case 'nade':
          if (e.kind === 'bounce') this.audio.bounce(pos(e.p), e.data?.[0] ?? 0);
          else if (e.kind === 'flash') this.audio.flashPop(pos(e.p));
          else if (e.kind === 'frag') this.audio.boom(pos(e.p));
          else if (e.kind === 'veil') { this.audio.hiss(pos(e.p)); if (cap) this.captionDir('Veil bloom', e.p); }
          else if (e.kind === 'thermite') this.audio.ignite(pos(e.p));
          else if (e.kind === 'pulsePing') {
            this.audio.pulsePing(pos(e.p));
            const d = e.data ?? [];
            for (let i = 0; i + 1 < d.length; i += 2) this.pulses.push({ x: e.p.x, z: e.p.z, sector: d[i], band: d[i + 1], age: 0 });
            if (!d.length) this.pulses.push({ x: e.p.x, z: e.p.z, sector: -99, band: 0, age: 2.9 });
            this.hud.popup(d.length ? `Pulse: ${d.length / 2} contact${d.length > 2 ? 's' : ''} (coarse)` : 'Pulse: no motion');
          } else if (e.kind === 'pulseDestroyed') this.audio.bounce(pos(e.p), 2);
          break;
        case 'spike':
          if (e.kind === 'beep') { this.audio.beep(pos(e.p), e.remaining ?? 30); if (cap && (e.remaining ?? 30) < 10) this.hud.caption('Beep · ' + Math.ceil(e.remaining ?? 0) + 's'); }
          else if (e.kind === 'planted') { this.audio.stinger('plant'); this.hud.showStatusBanner('Cipher armed', `Site ${snap.spike.site ?? ''} · 35 seconds`, 3000); }
          else if (e.kind === 'armStart') { this.audio.armLoop(e.id === selfId ? undefined : pos(e.p)); if (cap && e.id !== selfId) this.captionDir('Arming', e.p); }
          else if (e.kind === 'defuseStart') this.audio.armLoop(e.id === selfId ? undefined : pos(e.p));
          else if (e.kind === 'defused') this.audio.stinger('defuse');
          else if (e.kind === 'explode') this.audio.boom(pos(e.p), true);
          else if (e.kind === 'pickup' && e.id === selfId) this.hud.popup('Picked up the Cipher Spike');
          else if (e.kind === 'drop') this.audio.click(pos(e.p), 'drop');
          break;
        case 'kill': {
          const kSide = e.killer >= 0 ? sideOf(e.killer) : sideOf(e.victim) === 'cus' ? 'int' : 'cus';
          const vSide = sideOf(e.victim);
          const involved = e.killer === selfId ? 'killer' : e.victim === selfId ? 'victim' : null;
          const wname = e.weapon === 'spike' ? 'Cipher blast' : e.weapon === 'fire' ? 'Thermite' : e.weapon === 'frag' ? 'Fragment' : e.weapon === 'world' ? 'World' : WEAPONS[e.weapon].name;
          this.hud.killEntry(e.killer >= 0 ? nameOf(e.killer) : 'World', kSide, nameOf(e.victim), vSide, wname, e.head, e.wall, involved);
          if (e.killer >= 0) this.roundKills.set(e.killer, (this.roundKills.get(e.killer) ?? 0) + 1);
          break;
        }
        case 'hit':
          if (e.shooter === selfId) { this.hud.hitMarker(e.head, e.killed); this.audio.hitMarker(e.head, e.killed); }
          break;
        case 'hurt':
          if (e.victim === selfId) {
            this.audio.hurt();
            const eye = this.net!.body.pos;
            const dirYaw = Math.atan2(-(e.from.x - eye.x), -(e.from.z - eye.z));
            this.hud.damageFrom(-(dirYaw - this.input.yaw));
          }
          break;
        case 'econ':
          if (e.id === selfId) this.hud.popup((e.delta > 0 ? '+$' : '-$') + Math.abs(e.delta).toLocaleString() + ' · ' + e.reason, e.delta > 0 ? 'pos' : 'neg');
          break;
        case 'buy':
          if (e.id === selfId) {
            this.audio.buy(e.ok);
            if (!e.ok) this.hud.popup(e.reason ?? 'Cannot buy', 'neg');
          }
          break;
        case 'roundEnd': {
          const win = e.winnerSquad === mySquad;
          this.audio.stinger(win ? 'win' : 'lose');
          let top = -1, topK = 0;
          for (const [id, k] of this.roundKills) if (k > topK) { topK = k; top = id; }
          const hl = topK >= 2 ? `${nameOf(top)} got ${topK} eliminations` : '';
          this.hud.showBanner(win, e.reason, `${e.score[mySquad]} – ${e.score[1 - mySquad]}`, hl);
          break;
        }
        case 'info': this.hud.popup(e.text); break;
        default: break;
      }
    }
    void serverTime;
    void calloutAt;
    void MOVEMENT; void UTILITY; void MAP_HASH; void anglesFromDir; void el;
  }

  private captionDir(text: string, p: Vec3): void {
    const me = this.net!.body.pos;
    const ang = Math.atan2(-(p.x - me.x), -(p.z - me.z)) - this.input.yaw;
    const a = ((ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI; // -pi..pi, positive = left
    const arrow = Math.abs(a) < 0.5 ? '↑' : a > 2.6 || a < -2.6 ? '↓' : a > 0 ? '←' : '→';
    this.hud.caption(`${text} ${arrow}`);
  }

  // ------------------------------------------------------------------ debug / automation
  /** Dev only: run the simulation forward without rendering. */
  devAdvance(seconds: number): void { for (let i = 0; i < Math.round(seconds * TICK_RATE); i++) this.tick(); }
  devFreeze(v: boolean): void { this.paused = v; }

  debugState(): Record<string, unknown> {
    const m = this.match;
    const s = this.net?.latest;
    return {
      running: this.running, paused: this.paused, fps: Math.round(this.fps), phase: s?.phase, round: s?.round, score: s?.score,
      drawCalls: this.renderer.stats.drawCalls, triangles: this.renderer.stats.triangles,
      tickMsAvg: this.statsAcc.ticks ? this.statsAcc.tickMs / this.statsAcc.ticks : 0, tickMsMax: this.statsAcc.maxTickMs,
      self: s ? { alive: s.self.alive, hp: s.self.hp, money: s.self.money, pos: s.self.pos, cur: s.self.cur } : null,
      time: m?.time,
      downKBps: this.link ? this.link.bytesDown / 1024 / Math.max(1, (m?.time ?? 1)) : 0,
    };
  }
}
