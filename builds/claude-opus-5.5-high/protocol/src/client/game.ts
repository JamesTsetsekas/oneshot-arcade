// client runtime: fixed-step 64 Hz input sampling + authoritative room tick
// (in-process listen server), snapshot buffering/interpolation, event
// de-duplication, and render separation.

import { Color3, MeshBuilder, Vector3, type LinesMesh } from '@babylonjs/core';
import { simulateTrajectory, throwState } from '../sim/grenades';
import { DT, RULES_PRACTICE, RULES_QUICK, RULES_STANDARD, TICK_RATE, type MatchRules } from '../content/rules';
import { ANNEX } from '../map/annex';
import { GameMap } from '../map/runtime';
import { NavGrid } from '../map/nav';
import type { ClientRequest, GameEvent, ItemId, MatchResult, RoundRecord, Snapshot, SnapPlayer } from '../protocol/messages';
import { MatchRoom, segmentSphereChord } from '../sim/room';
import { eyeHeight } from '../sim/movement';
import { lerp, wrapAngle } from '../sim/math';
import { Renderer } from '../render/renderer';
import { smokeRadiusAt } from '../render/effects';
import { audio } from '../audio/audio';
import { Hud } from '../ui/hud';
import { InputState } from './input';
import { pushHistory, type Action, type Settings } from './settings';

export type Mode = 'standard' | 'quick' | 'practice';

export interface UiState {
  phase: Snapshot['phase'];
  snap: Snapshot;
  buyOpen: boolean;
  scoreOpen: boolean;
  paused: boolean;
  radioOpen: boolean;
  result: MatchResult | null;
  roster: { id: number; name: string; team: 0 | 1; bot: boolean; stats: MatchResult['players'][number]['stats']; alive: boolean; money?: number }[];
  locked: boolean;
  rounds: RoundRecord[];
}

let rid = 1;
const mapCache: { map?: GameMap; nav?: NavGrid } = {};
export function getAnnex(): { map: GameMap; nav: NavGrid } {
  if (!mapCache.map) {
    mapCache.map = new GameMap(ANNEX);
    mapCache.nav = new NavGrid(mapCache.map);
  }
  return { map: mapCache.map, nav: mapCache.nav! };
}

export const RADIO_LINES = ['Going A.', 'Going B.', 'Need backup!', 'Hold this position.', 'Rotate!', 'Enemy spotted.', 'Nice shot.', 'Saving this round.'];

export class GameSession {
  readonly room: MatchRoom;
  readonly map: GameMap;
  readonly renderer: Renderer;
  readonly input: InputState;
  readonly hud: Hud;
  readonly humanId = 0;
  readonly mode: Mode;
  private settings: Settings;
  private prev: Snapshot | null = null;
  cur: Snapshot;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private seq = 0;
  private running = false;
  private players = new Map<number, SnapPlayer>();
  private fpsAvg = 60;
  private lastYaw = 0;
  private lastPitch = 0;
  private beepNext = 0;
  private lastPhase = '';
  private resultSaved = false;
  ui: UiState;
  onUi: (s: UiState) => void = () => {};
  private uiTimer = 0;
  private trajectory: LinesMesh | null = null;

  constructor(canvas: HTMLCanvasElement, hudParent: HTMLElement, settings: Settings, mode: Mode, side: 'intrusion' | 'custodian', seed: number) {
    this.settings = settings;
    this.mode = mode;
    const { map, nav } = getAnnex();
    this.map = map;
    const rules: MatchRules = mode === 'practice' ? RULES_PRACTICE : mode === 'quick' ? RULES_QUICK : RULES_STANDARD;
    this.room = new MatchRoom({
      rules,
      seed,
      map,
      nav,
      humans: [{ name: 'You', team: 0 }],
      intrusionTeam: side === 'intrusion' ? 0 : 1,
      botDifficulty: settings.botDifficulty,
      practiceDummies: 6,
    });
    this.renderer = new Renderer(canvas, map, settings);
    this.hud = new Hud(hudParent, settings, map);
    this.hud.setNameList(this.room.players.map((p) => ({ id: p.id, name: p.name, team: p.team })));
    this.input = new InputState(canvas, settings);
    this.input.onAction = (a, down) => this.action(a, down);
    this.input.onLockChange = (locked) => {
      if (!locked && !this.ui.buyOpen && !this.ui.result && !this.ui.radioOpen) this.ui.paused = true;
      if (locked) this.ui.paused = false;
      this.ui.locked = locked;
      this.pushUi();
    };
    this.cur = this.room.buildSnapshot(this.humanId);
    const hp = this.room.players[this.humanId];
    this.input.yaw = hp.yaw;
    this.input.pitch = 0;
    this.ui = { phase: this.cur.phase, snap: this.cur, buyOpen: false, scoreOpen: false, paused: true, radioOpen: false, result: null, roster: [], locked: false, rounds: [] };
    audio.init();
    audio.stopMusic();
    audio.setVolumes(settings.volume, settings.sfxVolume, settings.musicVolume);
    audio.occluder = (a, b) => !map.lineClear(a, b, true);
    this.renderer.vm.setSide(this.cur.you.side);
    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('click', this.onCanvasClick);
  }

  private onResize = () => this.renderer.resize();
  private onCanvasClick = () => {
    if (!this.input.locked && !this.ui.buyOpen && !this.ui.result) this.input.requestLock();
  };

  applySettings(s: Settings): void {
    this.settings = s;
    this.input.rebind(s);
    this.hud.applySettings(s);
    this.renderer.applySettings(s);
    audio.setVolumes(s.volume, s.sfxVolume, s.musicVolume);
  }

  start(): void {
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      try {
        this.frame(now);
      } catch (e) {
        // never let a presentation fault stop the fixed-step loop
        console.error('[frame]', (e as Error).stack ?? e);
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.exitLock();
    this.input.dispose();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.hud.dispose();
  }

  request(r: Omit<ClientRequest, 'rid'> & Record<string, unknown>): void {
    this.room.submitRequest(this.humanId, { ...(r as ClientRequest), rid: rid++ });
  }

  buy(item: ItemId): void {
    this.request({ kind: 'buy', item });
  }
  refund(item: ItemId): void {
    this.request({ kind: 'refund', item });
  }
  radio(text: string): void {
    this.request({ kind: 'radio', text });
    this.ui.radioOpen = false;
    this.pushUi();
  }

  setBuyOpen(open: boolean): void {
    if (open && !this.cur.you.canBuy) {
      audio.ui('deny');
      return;
    }
    this.ui.buyOpen = open;
    if (open) {
      this.input.exitLock();
      this.ui.paused = false;
    } else this.input.requestLock();
    this.pushUi(true);
  }

  /** the room does not start ticking until the player first deploys */
  deployed = false;

  resume(): void {
    this.deployed = true;
    this.ui.paused = false;
    this.input.requestLock();
    this.pushUi(true);
  }

  private action(a: Action, down: boolean): void {
    if (a === 'scoreboard') {
      this.ui.scoreOpen = down;
      this.pushUi(true);
    } else if (a === 'map') {
      this.hud.showMap = down;
    } else if (!down) return;
    else if (a === 'buy') {
      if (this.ui.buyOpen) this.setBuyOpen(false);
      else if (this.input.locked) this.setBuyOpen(true);
    } else if (a === 'drop' && this.input.locked) this.request({ kind: 'drop' });
    else if (a === 'inspect') this.renderer.vm.inspect();
    else if (a === 'radio' && this.input.locked) {
      this.ui.radioOpen = !this.ui.radioOpen;
      this.pushUi(true);
    }
  }

  radioKey(n: number): void {
    if (this.ui.radioOpen && RADIO_LINES[n]) this.radio(RADIO_LINES[n]);
  }

  private pushUi(force = false): void {
    const now = performance.now();
    if (!force && now - this.uiTimer < 100) return;
    this.uiTimer = now;
    const r = this.room;
    this.ui = {
      ...this.ui,
      phase: this.cur.phase,
      snap: this.cur,
      rounds: r.rounds,
      result: r.result && this.cur.phase === 'matchEnd' ? r.result : this.ui.result,
      roster: r.players.map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        bot: p.bot,
        stats: p.stats,
        alive: p.alive,
        money: p.team === r.players[this.humanId].team ? p.money : undefined,
      })),
    };
    this.onUi(this.ui);
  }

  private frame(now: number): void {
    let dt = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    this.fpsAvg = lerp(this.fpsAvg, 1 / Math.max(dt, 1e-3), 0.05);
    const paused = (this.ui.paused && this.mode === 'practice') || !this.deployed;
    if (!paused) this.acc += dt;
    // zoom-scaled sensitivity
    const you = this.cur.you;
    this.input.zoomScale = you.scopeFov > 0 ? (you.scopeFov / this.settings.fov) * this.settings.zoomSensitivity : 1;
    this.input.enabled = !this.ui.buyOpen;
    let steps = 0;
    while (this.acc >= DT && steps < 8) {
      this.acc -= DT;
      steps++;
      this.tick();
    }
    if (steps >= 8) this.acc = 0;
    const alpha = Math.min(1, this.acc / DT);
    this.draw(dt, alpha);
    this.pushUi();
  }

  private tick(): void {
    const s = this.input.sample();
    const viewTick = this.cur.tick - 1 + Math.min(1, this.acc / DT);
    const cmd = { seq: ++this.seq, tick: this.room.tick + 1, time: performance.now(), buttons: s.buttons, yaw: this.input.yaw, pitch: this.input.pitch, select: s.select, viewTick };
    this.room.submitInput(this.humanId, cmd);
    this.room.step();
    this.prev = this.cur;
    this.cur = this.room.buildSnapshot(this.humanId);
    for (const ev of this.room.drainEvents(this.humanId)) this.onEvent(ev);
    if (this.cur.phase !== this.lastPhase) {
      this.onPhase(this.lastPhase, this.cur.phase);
      this.lastPhase = this.cur.phase;
    }
    // keep local view angles synced on round reset
    if (this.prev && this.prev.round !== this.cur.round) {
      const me = this.cur.players.find((p) => p.id === this.humanId);
      if (me) {
        this.input.yaw = me.yaw;
        this.input.pitch = 0;
      }
      this.renderer.vm.setSide(this.cur.you.side);
      this.renderer.fx.clearRound();
      if (this.ui.buyOpen && !this.cur.you.canBuy) this.setBuyOpen(false);
    }
    if (this.ui.buyOpen && !this.cur.you.canBuy) this.setBuyOpen(false);
    this.spikeAudio();
  }

  private onPhase(from: string, to: string): void {
    if (to === 'buy') audio.ui('round');
    if (to === 'roundEnd') {
      const lr = this.cur.lastRound;
      if (lr) audio.ui(lr.winner === this.cur.you.team ? 'win' : 'lose');
    }
    if (to === 'matchEnd') {
      this.input.exitLock();
      audio.startMusic();
      const res = this.room.result;
      if (res && !this.resultSaved && this.mode !== 'practice') {
        this.resultSaved = true;
        const me = res.players.find((p) => p.id === this.humanId)!;
        const myTeam = me.team;
        pushHistory({
          date: new Date().toISOString(),
          mode: this.mode === 'quick' ? 'Quick' : 'Full',
          won: res.winner === -1 ? null : res.winner === myTeam,
          score: [res.scores[myTeam], res.scores[myTeam === 0 ? 1 : 0]],
          kills: me.stats.kills,
          deaths: me.stats.deaths,
          assists: me.stats.assists,
          adr: Math.round(me.stats.damage / Math.max(1, res.rounds.length)),
          matchId: res.matchId,
        });
      }
      this.pushUi(true);
    }
    void from;
  }

  /** Fixed, readable beep schedule derived from plant/explode ticks. */
  private spikeAudio(): void {
    const sp = this.cur.spike;
    if (sp.state !== 'planted') {
      this.beepNext = 0;
      return;
    }
    const t = this.cur.tick;
    if (this.beepNext === 0) this.beepNext = sp.plantTick + TICK_RATE;
    if (t >= this.beepNext) {
      const left = (sp.explodeTick - t) / TICK_RATE;
      const interval = left > 20 ? 1.0 : left > 10 ? 0.7 : left > 5 ? 0.4 : left > 2 ? 0.22 : 0.12;
      this.beepNext = t + Math.round(interval * TICK_RATE);
      audio.spikeBeep({ x: sp.x, y: sp.y + 0.2, z: sp.z }, left < 10);
      this.renderer.fx.spikeBeep(this.renderer.fx.now() + Math.min(0.12, interval / 2));
      if (Math.abs(left - 10) < interval / 2 + 0.01) this.hud.caption('[Cipher: 10 seconds]');
      if (Math.abs(left - 5) < interval / 2 + 0.01) this.hud.caption('[Cipher: 5 seconds]');
    }
  }

  private onEvent(ev: GameEvent): void {
    const fx = this.renderer.fx;
    const me = this.humanId;
    this.hud.onEvent(ev, me, this.cur);
    switch (ev.e) {
      case 'sound': {
        const pos = { x: ev.x, y: ev.y + 0.2, z: ev.z };
        const own = ev.src === this.viewerId();
        if (ev.kind === 'shot') audio.gunshot(ev.weapon ?? 'aster', pos, own);
        else if (ev.kind === 'step') audio.step(pos, ev.mat ?? 'concrete', false);
        else if (ev.kind === 'gear') audio.step(pos, ev.mat ?? 'concrete', true);
        else if (ev.kind === 'land') audio.land(pos, ev.mat ?? 'concrete');
        else if (ev.kind === 'bounce') audio.bounce(pos, ev.mat ?? 'concrete');
        else if (ev.kind === 'arm') audio.armTone(pos, false);
        else if (ev.kind === 'disarm') audio.armTone(pos, true);
        else audio.click(own ? null : pos, ev.kind as 'reload');
        break;
      }
      case 'shot': {
        const own = ev.src === this.viewerId();
        if (ev.tracer) fx.tracer(ev.ox, ev.oy, ev.oz, ev.ex, ev.ey, ev.ez, own);
        if (own) this.renderer.vm.fire();
        else {
          const dx = ev.ex - ev.ox;
          const dy = ev.ey - ev.oy;
          const dz = ev.ez - ev.oz;
          const l = Math.hypot(dx, dy, dz) || 1;
          fx.muzzle(new Vector3(ev.ox + (dx / l) * 0.8, ev.oy - 0.15 + (dy / l) * 0.8, ev.oz + (dz / l) * 0.8), 0.2);
          this.renderer.charFire(ev.src);
        }
        break;
      }
      case 'impact':
        fx.impact(ev.x, ev.y, ev.z, ev.nx, ev.ny, ev.nz, ev.flesh, ev.mat);
        break;
      case 'hit':
        if (ev.src === me) audio.hitmarker(ev.head, ev.kill);
        break;
      case 'hurt':
        if (ev.dst === me) audio.hurt();
        break;
      case 'smoke':
        audio.smokeBloom({ x: ev.x, y: ev.y, z: ev.z });
        break;
      case 'flash':
        audio.flashbang({ x: ev.x, y: ev.y, z: ev.z });
        fx.flashDet(ev.x, ev.y, ev.z);
        break;
      case 'blind':
        if (ev.dst === me) audio.ring(ev.duration, ev.amount);
        break;
      case 'explode':
        audio.explosion({ x: ev.x, y: ev.y, z: ev.z }, ev.kind === 'spike');
        fx.explosion(ev.x, ev.y, ev.z, ev.kind === 'spike');
        break;
      case 'fire':
        audio.ignite({ x: ev.x, y: ev.y, z: ev.z });
        break;
      case 'pulse':
        audio.ping({ x: ev.x, y: ev.y, z: ev.z });
        fx.pulseRing(ev.x, ev.y, ev.z);
        break;
      case 'purchase':
        if (ev.player === me) audio.ui(ev.ok ? 'buy' : 'deny');
        break;
      case 'kill':
        if (ev.victim === me) {
          this.hud.caption('You were eliminated');
        }
        break;
    }
  }

  private viewerId(): number {
    const y = this.cur.you;
    return y.alive ? this.humanId : y.spectating >= 0 ? y.spectating : this.humanId;
  }

  private draw(dt: number, alpha: number): void {
    const r = this.renderer;
    const you = this.cur.you;
    const viewer = this.viewerId();
    this.players = r.updatePlayers(this.prev, this.cur, alpha, dt, viewer);
    const vp = this.players.get(viewer);
    let eye = new Vector3(0, 2, 0);
    let yaw = this.input.yaw;
    let pitch = this.input.pitch;
    let firstPerson = true;
    if (vp) {
      eye = new Vector3(vp.x, vp.y + eyeHeight(vp.crouch), vp.z);
      if (viewer !== this.humanId || this.room.autopilot.has(this.humanId)) {
        yaw = vp.yaw + (vp.recoilYaw ?? 0);
        pitch = vp.pitch + (vp.recoilPitch ?? 0);
      } else {
        yaw += you.recoilYaw;
        pitch += you.recoilPitch;
      }
      if (!vp.alive) firstPerson = false;
    }
    if (!you.alive && (you.spectating < 0 || !vp || !vp.alive)) {
      // fixed tactical camera after team elimination: over the objective or own spawn
      firstPerson = false;
      const sp = this.cur.spike;
      const focus = sp.known && sp.state !== 'none' ? new Vector3(sp.x, sp.y, sp.z) : new Vector3(0, 0, -10);
      eye = focus.add(new Vector3(-6, 9, -8));
      const d = focus.subtract(eye);
      yaw = Math.atan2(d.x, d.z);
      pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z));
    }
    const fov = you.scopeFov > 0 && you.alive ? you.scopeFov : this.settings.fov;
    r.setView({ eye, yaw, pitch, fov, firstPerson, hideId: viewer });
    audio.setListener({ x: eye.x, y: eye.y, z: eye.z }, yaw, pitch);
    // viewmodel
    const showVm = firstPerson && you.alive && you.scopeFov === 0;
    if (you.alive) {
      const item = you.active === 'primary' ? you.primary?.id : you.active === 'secondary' ? you.secondary?.id : you.active === 'tool' ? 'tool' : you.active === 'util' ? you.utils[you.utilIndex] : 'spike';
      r.vm.setItem(item ?? '');
    }
    const dyaw = wrapAngle(this.input.yaw - this.lastYaw);
    const dpitch = this.input.pitch - this.lastPitch;
    this.lastYaw = this.input.yaw;
    this.lastPitch = this.input.pitch;
    const me = this.players.get(this.humanId);
    r.vm.update(dt, you, dyaw, dpitch, you.speed, me?.onGround ?? true, showVm);
    r.fx.sync(this.cur, this.cur.tick + alpha, dt);
    r.spinTurbines(dt);
    this.updateTrajectory();
    // inside smoke?
    let inside = 0;
    for (const s of this.cur.smokes) {
      const rad = smokeRadiusAt(s.radius, s.startTick, s.endTick, this.cur.tick);
      const d = Math.hypot(eye.x - s.x, eye.y - s.y, eye.z - s.z);
      if (d < rad) inside = Math.max(inside, Math.min(1, (rad - d) / 1.2 + 0.35));
    }
    void segmentSphereChord;
    this.hud.update(dt, this.cur, this.players, { x: eye.x, y: eye.y, z: eye.z, yaw, fov, insideSmoke: inside, spectating: !you.alive && vp && vp.alive ? vp.name : null }, this.fpsAvg);
    r.render();
  }

  /** Practice-only grenade trajectory preview using the exact server step. */
  private updateTrajectory(): void {
    const you = this.cur.you;
    const show = this.cur.practice && you.alive && you.active === 'util' && you.primed;
    if (!show) {
      if (this.trajectory) {
        this.trajectory.dispose();
        this.trajectory = null;
      }
      return;
    }
    const p = this.room.players[this.humanId];
    const body = throwState(p.pos, p.vel, p.crouchAmt, this.input.yaw, this.input.pitch, p.primed === 2, this.map);
    const pts = simulateTrajectory(this.map, body, DT, 5);
    this.trajectory?.dispose();
    const lines = MeshBuilder.CreateLines('traj', { points: pts.map((q) => new Vector3(q.x, q.y, q.z)) }, this.renderer.scene);
    lines.color = Color3.FromHexString('#7dffb0');
    lines.isPickable = false;
    this.trajectory = lines;
  }
}
