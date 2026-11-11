/** Game controller: owns the local match host, fixed-step loop, camera, events, spectating and results. */
import * as THREE from 'three';
import { DT, MOVE, WEAPONS } from '../shared/content';
import { Match } from '../sim/match';
import { emptyInput, type GameEvent, type Player } from '../sim/types';
import { GameView, QUALITY } from './gameview';
import { Hud } from './hud';
import { InputController } from './input';
import { AudioSystem } from './audio';
import { MapRenderer, type MapMarker } from './minimap';
import { Screens, type ResultData } from './screens';
import { loadProfile, loadSettings, masteryLevel, saveProfile, saveSettings, type Profile, type Settings } from './settings';
import { cameraPose } from '../sim/camera';

type State = 'menu' | 'queue' | 'loading' | 'playing' | 'paused' | 'results' | 'error';

export class Game {
  readonly settings: Settings = loadSettings();
  readonly profile: Profile = loadProfile();
  readonly canvas: HTMLCanvasElement;
  readonly app: HTMLElement;
  view!: GameView;
  hud!: Hud;
  screens!: Screens;
  input!: InputController;
  audio = new AudioSystem();
  match: Match | null = null;
  state: State = 'menu';
  private mapRenderer: MapRenderer | null = null;
  private marker: MapMarker | null = null;
  private acc = 0;
  private last = performance.now();
  private fps = 60;
  private fpsTimer = 0;
  private dynRatio = 1;
  private lowFpsFor = 0;
  private highFpsFor = 0;
  private routeTimer = 0;
  private route: { x: number; z: number }[] = [];
  private spectateId = -1;
  private spectateDelay = 0;
  private fast = 1;
  private endTimer = -1;
  private resultsShown = false;
  private queueTimer: number | null = null;
  private lastAlertPhase = -1;
  private storming = false;
  lastAimPose: { pos: THREE.Vector3; dir: THREE.Vector3; fov: number } | null = null;
  private frameCount = 0;
  private shake = 0;
  private lastStormTick = 0;
  /** Automation hook: multiplies simulation speed (used by headless verification only). */
  debugScale = 1;
  private pendingMode: 'quick' | 'practice' = 'quick';
  private seedOverride: number | null = null;

  constructor(canvas: HTMLCanvasElement, app: HTMLElement) {
    this.canvas = canvas;
    this.app = app;
    const q = new URLSearchParams(location.search).get('seed');
    if (q) this.seedOverride = Number(q) || null;
  }

  boot(): void {
    this.view = new GameView(this.canvas, this.settings);
    this.hud = new Hud(this.app);
    this.screens = new Screens(this.app, this.profile, this.settings);
    this.input = new InputController(this.canvas, this.settings);
    this.wire();
    this.applySettings();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.screens.showMenu();
    this.state = 'menu';
    requestAnimationFrame((t) => this.frame(t));
  }

  /* ------------------------------------------------------------ wiring */
  private wire(): void {
    const s = this.screens;
    s.onQuick = () => { this.audio.ensure(); this.audio.ui(); this.startQueue('quick'); };
    s.onPractice = () => { this.audio.ensure(); this.audio.ui(); this.pendingMode = 'practice'; this.input.requestLock(); this.startMatch('practice'); };
    s.onSettingsChanged = () => { this.applySettings(); saveSettings(this.settings); };
    s.onProfileChanged = () => saveProfile(this.profile);
    s.onResume = () => { s.clear(); this.state = 'playing'; this.input.requestLock(); };
    s.onLeaveMatch = () => this.leaveToMenu();
    s.onRequeue = () => { this.audio.ensure(); this.input.requestLock(); if (this.pendingMode === 'practice') this.startMatch('practice'); else this.startQueue('quick'); };
    s.onMenu = () => this.leaveToMenu();
    s.onCancelQueue = () => { if (this.queueTimer !== null) { clearInterval(this.queueTimer); this.queueTimer = null; } this.input.exitLock(); this.state = 'menu'; s.showMenu(); };
    s.onMarker = (m) => { this.marker = m; this.audio.ui(); };
    s.onDropSlot = (i) => { const h = this.humanPlayer(); if (!h) return; h.selected = i; this.queuedDrop = true; };
    s.onSelectSlot = (i) => { this.queuedSlot = i; };
    this.input.onToggleMap = () => this.toggleMap();
    this.input.onToggleInventory = () => this.toggleInventory();
    this.input.onPing = () => this.pingMarker();
    this.input.onEscape = () => this.escape();
    this.input.onLockChange = (locked) => {
      if (!locked && this.state === 'playing' && !this.screens.mapOpen && !this.screens.invOpen && !this.suppressPause) {
        this.openPause();
      }
      if (locked) this.hud.showHint(false);
    };
    this.input.onAnyKey = (code) => {
      if (this.state === 'playing' && this.spectating()) {
        if (code === 'ArrowRight' || code === 'KeyD') this.cycleSpectate(1);
        if (code === 'ArrowLeft' || code === 'KeyA') this.cycleSpectate(-1);
      }
      if (code === 'Enter' && this.state === 'playing' && this.match && this.match.phase === 'staging') this.match.stagingLeft = Math.min(this.match.stagingLeft, 0.4);
    };
    this.hud.onHintClick = () => { this.input.requestLock(); };
    this.hud.onLeave = () => this.showResults();
    this.hud.onNextSpectate = (d) => this.cycleSpectate(d);
    this.hud.onFast = () => { this.fast = this.fast === 1 ? 4 : 1; this.hud.fastBtn.textContent = `Fast ×${this.fast}`; };
    this.canvas.addEventListener('click', () => { if (this.state === 'playing' && !this.input.locked && !this.screens.mapOpen && !this.screens.invOpen && !this.spectating()) this.input.requestLock(); });
  }
  private queuedDrop = false;
  private queuedSlot = -1;
  private suppressPause = false;

  private applySettings(): void {
    const q = this.settings.quality;
    this.view.setQuality(q);
    this.audio.setVolumes(this.settings.volume, this.settings.music);
    this.resize();
  }

  private resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    const base = Math.min(window.devicePixelRatio || 1, 1.25) * this.settings.resolution * QUALITY[this.settings.quality].pixel;
    const ratio = this.settings.dynamicRes ? Math.min(base, base * this.dynRatio) : base;
    this.view.setPixelRatio(Math.max(0.4, ratio));
    this.view.resize(w, h);
  }

  humanPlayer(): Player | undefined { return this.match?.human; }
  private spectating(): boolean { const h = this.humanPlayer(); return !!h && !h.alive && this.match?.mode === 'quick'; }

  /* ------------------------------------------------------------- flow */
  private startQueue(mode: 'quick'): void {
    this.pendingMode = mode;
    this.state = 'queue';
    this.input.requestLock();
    const q = this.screens.showQueue();
    let t = 0, found = 1;
    const stages = ['Finding a room…', 'Room found · region: local', 'Filling seats with bots…', 'Match ready'];
    this.queueTimer = window.setInterval(() => {
      t += 0.2;
      found = Math.min(24, found + Math.ceil(Math.random() * 3));
      const st = t < 0.8 ? stages[0] : t < 1.4 ? stages[1] : found < 24 ? stages[2] : stages[3];
      q.update(t, found, 24, st);
      if (t >= 2.0) {
        clearInterval(this.queueTimer!); this.queueTimer = null;
        q.update(t, 24, 24, stages[3]);
        this.startMatch('quick');
      }
    }, 200);
  }

  startMatch(mode: 'quick' | 'practice'): void {
    this.pendingMode = mode;
    this.state = 'loading';
    this.screens.showLoading(mode === 'quick' ? 'Loading The Highwake' : 'Loading Practice Range');
    window.setTimeout(() => this.finishLoad(mode), 60);
  }

  private finishLoad(mode: 'quick' | 'practice'): void {
    const seed = this.seedOverride ?? Math.floor(Math.random() * 1e9);
    try {
      const m = new Match({ seed, mode, humanName: this.profile.name });
      const h = m.players[0];
      h.cosmetic = this.profile.outfit;
      this.match = m;
      this.view.setMatch(m);
      this.view.snapshot();
      this.mapRenderer = new MapRenderer(m);
      this.hud.setMap(this.mapRenderer);
      this.hud.reset();
      this.marker = null;
      this.route = []; this.routeTimer = 0;
      this.input.yaw = mode === 'quick' ? Math.atan2(m.skiff.dirX, m.skiff.dirZ) : Math.PI;
      this.input.pitch = -0.08;
      this.input.resetToggles();
      this.acc = 0; this.fast = 1; this.hud.fastBtn.textContent = 'Fast ×1';
      this.spectateId = -1; this.endTimer = -1; this.resultsShown = false; this.recordedRun = false; this.lastResult = null; this.shake = 0; this.lastAlertPhase = -1; this.storming = false;
      this.hud.setSpectate(false, '', '');
      this.screens.clear();
      this.hud.show(true);
      this.state = 'playing';
      this.input.enabled = true;
      this.input.overlayOpen = false;
      this.input.moveWhileUnlocked = false;
      if (!this.input.locked) this.hud.showHint(true);
      if (mode === 'practice') { this.profile.practiceVisited = true; saveProfile(this.profile); }
      this.hud.notify(mode === 'quick' ? 'Welcome to The Highwake — Solo' : 'Practice Range — weapons on the rack behind you', 3200);
    } catch (err) {
      console.error(err);
      this.state = 'error';
      this.screens.showError('Could not start the match', `The world failed to build: ${(err as Error).message}`, [{ label: 'Back to menu', fn: () => this.leaveToMenu() }]);
    }
  }

  leaveToMenu(): void {
    if (this.queueTimer !== null) { clearInterval(this.queueTimer); this.queueTimer = null; }
    // practice: record visit only; quick: leaving counts as the current placement
    if (this.match && this.match.mode === 'quick' && !this.resultsShown && this.state !== 'menu') this.recordResult(false);
    this.suppressPause = true;
    this.input.exitLock();
    setTimeout(() => { this.suppressPause = false; }, 100);
    this.screens.closeMap(); this.screens.closeInventory();
    this.hud.show(false);
    this.state = 'menu';
    this.match = null;
    this.screens.showMenu();
  }

  private openPause(): void {
    if (!this.match) return;
    this.state = 'paused';
    this.screens.showPause(this.match.mode === 'practice');
  }

  private escape(): void {
    if (this.screens.mapOpen) { this.toggleMap(); return; }
    if (this.screens.invOpen) { this.toggleInventory(); return; }
    if (this.state === 'playing') { this.suppressPause = true; this.input.exitLock(); setTimeout(() => { this.suppressPause = false; }, 100); this.openPause(); }
    else if (this.state === 'paused') { this.screens.onResume(); }
  }

  private toggleMap(): void {
    if (this.state !== 'playing' || !this.match || !this.mapRenderer) return;
    if (this.screens.mapOpen) {
      this.screens.closeMap(); this.input.overlayOpen = this.screens.invOpen; this.input.moveWhileUnlocked = false;
      if (!this.spectating()) this.input.requestLock();
    } else {
      this.screens.closeInventory();
      this.suppressPause = true; this.input.exitLock(); setTimeout(() => { this.suppressPause = false; }, 100);
      this.input.overlayOpen = true; this.input.moveWhileUnlocked = true;
      this.screens.openMap(this.match, this.mapRenderer, () => this.input.yaw, this.match.humanId, this.marker);
      this.audio.ui();
    }
  }

  private toggleInventory(): void {
    if (this.state !== 'playing' || !this.match || this.spectating()) return;
    if (this.screens.invOpen) {
      this.screens.closeInventory(); this.input.overlayOpen = false; this.input.moveWhileUnlocked = false; this.input.requestLock();
    } else {
      this.screens.closeMap();
      this.suppressPause = true; this.input.exitLock(); setTimeout(() => { this.suppressPause = false; }, 100);
      this.input.overlayOpen = true; this.input.moveWhileUnlocked = true;
      this.screens.openInventory(() => this.match!.players[this.match!.humanId]);
      this.audio.ui();
    }
  }

  private pingMarker(): void {
    const h = this.humanPlayer();
    if (!h || !this.match || !this.lastAimPose) return;
    const d = this.lastAimPose.dir, p = this.lastAimPose.pos;
    const t = this.match.world.raycast(p.x, p.y, p.z, d.x, d.y, d.z, 700, true);
    const tt = t > 0 ? t : 300;
    this.marker = { x: p.x + d.x * tt, z: p.z + d.z * tt };
    this.audio.ui();
    this.hud.notify('Marker placed');
  }

  /* ------------------------------------------------------- spectating */
  private cycleSpectate(dir: number): void {
    const m = this.match; if (!m) return;
    const alive = m.players.filter((p) => p.alive && !p.dummy && p.mode !== 'skiff');
    if (alive.length === 0) return;
    let idx = alive.findIndex((p) => p.id === this.spectateId);
    idx = (idx + dir + alive.length * 4) % alive.length;
    this.spectateId = alive[idx].id;
  }

  private onHumanDeath(killerId: number): void {
    const m = this.match!;
    this.spectateDelay = 2.2;
    this.spectateId = killerId >= 0 && m.players[killerId]?.alive ? killerId : -1;
    this.input.enabled = false;
    this.input.overlayOpen = false;
    this.input.moveWhileUnlocked = false;
    this.screens.closeInventory(); this.screens.closeMap();
    // release the mouse so the spectator buttons can be clicked (no pause menu for this unlock)
    this.suppressPause = true; this.input.exitLock(); setTimeout(() => { this.suppressPause = false; }, 150);
    const h = m.players[m.humanId];
    this.hud.setSpectate(true, `ELIMINATED · #${h.stats.placement}`, h.stats.killedBy ? `by ${h.stats.killedBy}` : '');
    this.recordResult(true);
  }

  /* ------------------------------------------------------------ results */
  private buildResult(): ResultData | null {
    const m = this.match; if (!m) return null;
    const h = m.players[m.humanId]; if (!h) return null;
    const total = m.totalCount();
    const win = m.winner === h.id;
    if (win) h.stats.placement = 1;
    else if (h.alive && h.stats.placement === 0) h.stats.placement = m.aliveCount();
    const st = h.stats;
    const acc = st.shots > 0 ? Math.round((st.hits / st.shots) * 100) : 0;
    const winner = m.winner >= 0 ? m.players[m.winner] : null;
    let xp = 0;
    if (m.mode === 'quick') {
      xp = 30 + Math.max(0, total - st.placement) * 8 + st.kills * 40 + st.assists * 10 + (st.placement === 1 ? 200 : 0) + Math.floor(st.damageDealt / 10) + Math.floor(st.surviveTime / 30) * 2;
    }
    return {
      placement: st.placement || 1, total, winnerName: winner?.name ?? '', kills: st.kills, assists: st.assists, damage: st.damageDealt, accuracy: acc,
      survive: st.surviveTime, distance: st.distance, storm: st.stormDamage, headshots: st.headshots, killedBy: st.killedBy, loot: st.lootPicked,
      timeline: m.timeline, xpGain: xp, mode: m.mode, route: this.route,
    };
  }

  private recordedRun = false;
  private recordResult(forceFinal: boolean): void {
    const m = this.match; if (!m || m.mode !== 'quick' || this.recordedRun) return;
    const r = this.buildResult(); if (!r) return;
    void forceFinal;
    this.recordedRun = true;
    const p = this.profile;
    p.xp += r.xpGain; p.matches += 1; p.kills += r.kills; if (r.placement === 1) p.wins += 1; p.bestPlacement = Math.min(p.bestPlacement, r.placement);
    p.history.unshift({ date: new Date().toISOString().slice(0, 10), placement: r.placement, kills: r.kills, damage: r.damage, survive: r.survive, xp: r.xpGain, mode: 'quick' });
    p.history = p.history.slice(0, 20);
    saveProfile(p);
    this.lastResult = r;
  }
  private lastResult: ResultData | null = null;

  private showResults(): void {
    const m = this.match; if (!m) return;
    if (m.mode === 'practice') { this.leaveToMenu(); return; }
    if (!this.recordedRun) this.recordResult(true);
    const r = this.lastResult ?? this.buildResult();
    if (!r) return;
    this.resultsShown = true;
    this.hud.show(false);
    this.state = 'results';
    this.suppressPause = true; this.input.exitLock(); setTimeout(() => { this.suppressPause = false; }, 100);
    this.screens.showResults(r, m, this.mapRenderer);
  }

  /* -------------------------------------------------------------- loop */
  private frame(now: number): void {
    requestAnimationFrame((t) => this.frame(t));
    const dtReal = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frameCount++;
    // fps + dynamic resolution
    this.fpsTimer += dtReal;
    this.fps += ((1 / Math.max(dtReal, 0.001)) - this.fps) * 0.05;
    if (this.settings.dynamicRes && (this.state === 'playing')) {
      if (this.fps < 48) { this.lowFpsFor += dtReal; this.highFpsFor = 0; } else if (this.fps > 75) { this.highFpsFor += dtReal; this.lowFpsFor = 0; } else { this.lowFpsFor = 0; this.highFpsFor = 0; }
      if (this.lowFpsFor > 1.5 && this.dynRatio > 0.55) { this.dynRatio = Math.max(0.55, this.dynRatio - 0.1); this.lowFpsFor = 0; this.resize(); }
      if (this.highFpsFor > 4 && this.dynRatio < 1) { this.dynRatio = Math.min(1, this.dynRatio + 0.05); this.highFpsFor = 0; this.resize(); }
    }
    const m = this.match;
    if (!m || (this.state !== 'playing' && this.state !== 'paused')) return;
    const h = m.players[m.humanId];
    const paused = this.state === 'paused' && m.mode === 'practice';
    if (this.state === 'playing' || (this.state === 'paused' && !paused)) this.simulate(m, dtReal);
    this.updateFrame(m, h, dtReal);
  }

  private simulate(m: Match, dtReal: number): void {
    const h = m.players[m.humanId];
    const ads = this.input.adsHeld() && !!h && h.alive;
    this.input.applyLook(ads);
    this.acc += dtReal * (this.spectating() || m.phase === 'ended' ? this.fast : 1) * this.debugScale;
    let steps = 0;
    const inputs = new Map<number, ReturnType<InputController['build']>>();
    while (this.acc >= DT && steps < 12) {
      this.acc -= DT;
      steps++;
      this.view.snapshot();
      if (h && h.alive) {
        const inp = this.input.build();
        if (this.queuedSlot >= 0) { inp.slot = this.queuedSlot; this.queuedSlot = -1; }
        if (this.queuedDrop) { inp.drop = true; this.queuedDrop = false; }
        // pitch/yaw are the free-look angles; the sim applies recoil on top
        inputs.set(h.id, inp);
      } else inputs.set(m.humanId, emptyInput());
      m.step(inputs);
      this.processEvents(m);
      this.routeTimer += DT;
      if (this.routeTimer >= 1) { this.routeTimer = 0; if (h && h.alive && h.mode !== 'skiff') this.route.push({ x: h.x, z: h.z }); }
    }
    if (this.acc > DT * 12) this.acc = 0;
  }

  private processEvents(m: Match): void {
    const events = m.drainEvents();
    const hid = m.humanId;
    const h = m.players[hid];
    const viewId = this.spectating() && this.spectateId >= 0 ? this.spectateId : hid;
    const v = m.players[viewId] ?? h;
    for (const e of events) {
      this.view.onEvent(e);
      this.audioEvent(e, v, hid);
      this.hudEvent(e, m, hid, v);
    }
  }

  private rel(v: Player, x: number, z: number): { pan: number; dist: number; ang: number } {
    const dx = x - v.x, dz = z - v.z;
    const dist = Math.hypot(dx, dz);
    const yaw = this.input.yaw;
    // right vector of the camera
    const rx = -Math.cos(yaw), rz = Math.sin(yaw);
    const pan = dist > 0.01 ? (dx * rx + dz * rz) / dist : 0;
    const bearing = Math.atan2(dx, dz);
    let ang = yaw - bearing;
    while (ang > Math.PI) ang -= Math.PI * 2; while (ang < -Math.PI) ang += Math.PI * 2;
    return { pan, dist, ang };
  }

  private audioEvent(e: GameEvent, v: Player, hid: number): void {
    const a = this.audio;
    switch (e.type) {
      case 'shot': {
        const sh = this.match!.players[e.pid];
        if (!sh) break;
        const r = this.rel(v, sh.x, sh.z);
        if (e.pid === hid || e.pid === v.id) a.gunshot(e.weapon, 0, 0, true); else a.gunshot(e.weapon, r.pan, r.dist, false);
        if (e.pid === hid && !this.settings.reducedMotion) this.shake = Math.min(1, this.shake + 0.25);
        break;
      }
      case 'sound': {
        if (e.pid === v.id) break;
        const r = this.rel(v, e.x, e.z);
        if (e.kind === 'footstep') a.footstep(r.pan, r.dist, e.loud > 30);
        if (this.settings.soundIndicators) {
          const lim = e.kind === 'gunshot' ? 150 : 38;
          if (r.dist < lim && r.dist > 2) this.hud.soundIndicator(r.ang, e.kind === 'gunshot' ? 'gun' : 'step', this.settings.captions ? `${e.kind === 'gunshot' ? 'Gunshot' : 'Footsteps'} ${r.ang > 0.4 ? '← left' : r.ang < -0.4 ? 'right →' : '↑ ahead'} (${r.dist > 80 ? 'far' : r.dist > 30 ? 'mid' : 'close'})` : undefined);
        }
        break;
      }
      case 'pickup': if (e.pid === hid) a.pickup(e.rarity); break;
      case 'full': if (e.pid === hid) a.full(); break;
      case 'chest': { const r = this.rel(v, e.x, e.z); if (r.dist < 40) a.chest(); break; }
      case 'reload': if (e.pid === v.id) a.reload(); break;
      case 'use': if (e.pid === v.id && !e.done) a.heal(); break;
      case 'explosion': { const r = this.rel(v, e.x, e.z); a.explosion(r.dist); break; }
      case 'land': if (e.pid === v.id) a.land(e.speed); break;
      case 'jump': if (e.pid === v.id) a.jump(); break;
      case 'slide': if (e.pid === v.id) a.slide(); break;
      case 'deploy': if (e.pid === v.id) a.deploy(); break;
      case 'storm': a.stormWarn(); break;
      case 'capsule': if (e.stage === 'incoming') a.capsule(); break;
      case 'kill': if (e.killer === hid) a.kill(); break;
      case 'beacon': if (e.pid === hid) a.windUse(); break;
      case 'grapple': if (e.pid === hid) a.windUse(); break;
      case 'projectile': if (e.pid === hid) a.windUse(); break;
      default: break;
    }
  }

  private hudEvent(e: GameEvent, m: Match, hid: number, v: Player): void {
    const hud = this.hud;
    switch (e.type) {
      case 'hit': {
        if (e.attacker === hid) {
          const vic = m.players[e.victim];
          const shielded = vic && vic.aegis + vic.reserve > 0.5;
          hud.hitMarker(e.killed ? 'kill' : e.zone === 'head' ? 'head' : shielded || e.shieldBreak ? 'shield' : 'normal');
          this.audio.hit(e.zone === 'head', !!shielded, e.shieldBreak);
        }
        break;
      }
      case 'damage': {
        if (e.victim === v.id) {
          if (e.dirX !== 0 || e.dirZ !== 0) hud.damageArc(this.input.yaw - Math.atan2(e.dirX, e.dirZ));
          else if (e.source !== 'Riftstorm') hud.damageArc(0);
          if (e.source !== 'Riftstorm' && e.source !== 'Heat channel') this.audio.hurt();
          if (!this.settings.reducedMotion) this.shake = Math.min(1, this.shake + e.amount * 0.012);
        }
        break;
      }
      case 'kill': {
        const killer = e.killer >= 0 ? m.players[e.killer] : undefined;
        const victim = m.players[e.victim];
        if (victim.dummy) break;
        const txt = killer ? `<b>${killer.name}</b> eliminated ${victim.name} <span style="opacity:.7">· ${e.weapon}</span>` : `${victim.name} <span style="opacity:.7">· ${e.weapon}</span>`;
        hud.addKillFeed(txt, e.killer === hid);
        if (e.killer === hid) hud.notify(`ELIMINATED ${victim.name.toUpperCase()}`, 2000);
        if (e.victim === hid && m.mode === 'quick') this.onHumanDeath(e.killer);
        break;
      }
      case 'pickup': if (e.pid === hid) hud.notify(e.name, 1000); break;
      case 'full': if (e.pid === hid) hud.notify('Inventory full — hold E to swap', 1600); break;
      case 'storm': hud.notify(e.msg === 'Calmfield holds' ? e.msg : `${e.msg.toUpperCase()} — check the map`, 3200); break;
      case 'capsule': hud.notify(e.stage === 'incoming' ? 'SUPPLY CAPSULE INBOUND — marked on the map' : 'Supply capsule landed', 3200); break;
      case 'beacon': if (e.pid === hid) hud.notify('Echo Beacon: trails revealed for 8s', 2200); break;
      case 'end': {
        this.endTimer = e.winner === hid ? 3.5 : 0.5;
        if (e.winner === hid) hud.notify('VICTORY — last one standing!', 4000);
        break;
      }
      default: break;
    }
  }

  private updateFrame(m: Match, h: Player, dt: number): void {
    const spectating = this.spectating();
    const viewP = spectating ? (m.players[this.spectateId] && m.players[this.spectateId].alive ? m.players[this.spectateId] : null) : h;
    // spectate target selection
    if (spectating) {
      if (this.spectateDelay > 0) this.spectateDelay -= dt;
      if (!viewP || !viewP.alive) {
        if (this.spectateDelay <= 0) {
          const alive = m.players.filter((p) => p.alive && !p.dummy && p.mode !== 'skiff');
          if (alive.length) this.spectateId = alive[0].id;
        }
      }
      if (m.phase === 'ended' && this.endTimer < 0) this.endTimer = 0.5;
    }
    const target = viewP ?? h;
    const alpha = this.acc / DT;
    const ip = this.view.interp(target, alpha);
    const lookYaw = spectating ? target.yaw : this.input.yaw;
    const lookPitch = spectating ? target.pitch : this.input.pitch;
    const reduce = this.settings.reducedMotion ? 0.2 : 1;
    const pose = this.view.poseFor(target, ip, lookYaw, lookPitch, reduce);
    // screen shake (camera layer only; never touches the aim ray)
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.shake > 0.01 && !this.settings.reducedMotion) {
      pose.pos.x += (Math.random() - 0.5) * 0.04 * this.shake; pose.pos.y += (Math.random() - 0.5) * 0.04 * this.shake;
    }
    this.lastAimPose = pose;
    const focus = !spectating && h.alive ? m.focusFor(h) : null;
    this.view.render(dt, alpha, -1, pose, focus && focus.kind === 'loot' ? focus.id : -1, m.humanId, ip);

    // crosshair offset when visual recoil is reduced
    if (this.settings.reducedMotion && !spectating) {
      const full = cameraPose(m.world, { ...target, x: ip.x, y: ip.y, z: ip.z, yaw: lookYaw, pitch: lookPitch } as Player, 2.3);
      const aimPt = this.view.worldPointToScreen(full.pos.x + full.dir.x * 60, full.pos.y + full.dir.y * 60, full.pos.z + full.dir.z * 60);
      this.hud.setCrosshair(aimPt.x, aimPt.y);
    } else this.hud.setCrosshair(0.5, 0.5);

    // storm exposure
    const s = m.storm;
    const outside = m.mode === 'quick' && s.phase >= 1 && m.phase !== 'staging' && Math.hypot(target.x - s.cx, target.z - s.cz) > s.r && target.alive && target.mode !== 'skiff';
    this.storming = outside;
    if (this.fpsTimer > 0.05 || true) {
      this.hud.update({
        match: m, human: h, view: target, spectating, focus, interactHold: h.interactHold, swapPending: h.swapPending, yaw: lookYaw, marker: this.marker,
        settings: this.settings, fps: this.fps, adsT: target.adsT, stormOutside: outside, trails: m.beaconTrails(h), canLeave: true,
      }, dt);
    }
    this.hud.setSpectate(spectating, spectating ? `${m.players[m.humanId].stats.placement ? '#' + m.players[m.humanId].stats.placement : ''} ELIMINATED` : '', spectating ? `Spectating ${viewP ? viewP.name : '…'} · ${m.aliveCount()} remaining${m.players[m.humanId].stats.killedBy ? ' · eliminated by ' + m.players[m.humanId].stats.killedBy : ''}` : '');

    // audio ambience / music
    const alt = target.mode === 'freefall' || target.mode === 'glide' ? 1 : 0;
    this.audio.setAmbience(alt, outside ? 1 : 0);
    const tension = m.mode === 'quick' ? Math.min(1, Math.max(0, (m.storm.phase - 1) / 5)) : 0;
    this.audio.tickMusic(dt, tension);

    // end of match handling
    if (this.endTimer >= 0) {
      this.endTimer -= dt;
      if (this.endTimer <= 0 && !this.resultsShown && m.mode === 'quick') { this.endTimer = -1; this.showResults(); }
    }
    void MOVE; void WEAPONS;
  }
}
