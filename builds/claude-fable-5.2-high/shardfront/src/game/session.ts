// Match session: the local "server" loop. Fixed 20 Hz simulation clock, render interpolation, command
// scheduling with a short input delay, replay recording / verified playback, alerts and HUD read models.
import { FACTIONS, TECH_DEFS } from '../data/defs';
import { fmtTime, statLines } from '../data/describe';
import type { Settings } from '../app/settings';
import type { AudioEngine } from '../audio/audio';
import { InputController, type Host } from '../input/controller';
import { BUILD_VERSION, PROTOCOL_VERSION, type Command, type CommandEnvelope, type MatchConfig, type ReplayData } from '../net/protocol';
import type { GameRenderer, ViewState } from '../render/renderer';
import { createSim } from '../sim/create';
import { FixedClock } from '../sim/clock';
import { AIController } from '../ai/ai';
import { DECISION_TICK, ENDGAME_TICK, FL_CONSTRUCTING, NEUTRAL, TICK_RATE, type AlertKind, type Sim, type SimEvent } from '../sim/sim';
import { queuePauseReason } from '../sim/systems';
import { orderLabel } from '../sim/units';
import { getState, setState, type AlertView, type HudState, type MatchResult, type QueueView, type SelGroup, type SelSingle } from '../ui/store';
import { TutorialDirector } from './tutorial';

export const INPUT_DELAY_TICKS = 2;
const HASH_INTERVAL = 100;

export type SessionMode = 'play' | 'replay' | 'spectate';

export interface SessionOptions {
  config: MatchConfig;
  mode: SessionMode;
  replay?: ReplayData;
  /** quiet attract-mode match rendered behind the menus */
  backdrop?: boolean;
  onEnd: (r: MatchResult) => void;
}

const ALERT_TEXT: Record<AlertKind, string> = {
  attack: 'Under attack', supply: 'Supply blocked', ore: 'Not enough Prism Ore', flux: 'Not enough Flux', depleted: 'Resource field depleted',
  blocked: 'Cannot build there', prereq: 'Requirement missing', invalid: 'Invalid target', queue: 'Production queue is full', cooldown: 'Ability is not ready', energy: 'Not enough energy',
};

export let activeSession: GameSession | null = null;

export class GameSession implements Host {
  readonly simulation: Sim;
  readonly mode: SessionMode;
  readonly input: InputController;
  readonly localPlayer = 0;
  speed = 1;
  paused = false;
  ended = false;
  perfOn = false;
  private clock = new FixedClock();
  private seq = 0;
  private commands: CommandEnvelope[] = [];
  private hashes: [number, number][] = [];
  private replay: ReplayData | null;
  private replayOk = true;
  private replayHashIdx = 0;
  private alerts: AlertView[] = [];
  private alertId = 1;
  private lastAlertByKind = new Map<string, number>();
  private hudTimer = 0;
  private endTimer = 0;
  private heat = 0;
  private toastText = '';
  private toastUntil = 0;
  private tutorial: TutorialDirector | null = null;
  private fps = 60; private simMs = 0;
  private wall = 0;
  private overlayCtx: CanvasRenderingContext2D | null;
  private view: ViewState;
  private endgameAnnounced = false;
  private opts: SessionOptions;
  private disposed = false;
  private backdrop = false;
  private fast = false;
  private focusX = 80; private focusZ = 80; private focusAge = 99;

  constructor(readonly renderer: GameRenderer, private audio: AudioEngine, private overlay: HTMLCanvasElement, opts: SessionOptions) {
    this.opts = opts;
    this.mode = opts.mode;
    this.replay = opts.replay ?? null;
    this.simulation = createSim(opts.config);
    if (this.replay) for (const env of this.replay.commands) this.simulation.schedule(env.player, env.seq, env.tick, env.cmd);
    if (opts.config.mode === 'tutorial' && opts.mode === 'play') this.tutorial = new TutorialDirector();
    this.view = { player: this.localPlayer, observer: opts.mode !== 'play', selection: [], hover: -1, placement: null, ranges: [], dragBox: null, showZones: false };
    renderer.setSim(this.simulation, this.localPlayer);
    this.input = new InputController(renderer.canvas, renderer, this, audio);
    this.backdrop = !!opts.backdrop;
    this.overlayCtx = overlay.getContext('2d');
    this.resize();
    audio.startMusic(opts.config.players[this.localPlayer].faction);
    if (this.backdrop) { renderer.rig.hGoal = 54; this.focusX = renderer.rig.tx; this.focusZ = renderer.rig.tz; return; }
    this.input.attach();
    activeSession = this;
    this.pushHud();
  }

  // ---- Host
  sim(): Sim { return this.simulation; }
  settings(): Settings { return getState().settings; }
  player(): number { return this.localPlayer; }
  interactive(): boolean { return this.mode === 'play' && !this.ended; }
  toast(text: string): void { this.toastText = text; this.toastUntil = this.wall + 2.2; this.input.dirty = true; }
  openMenu(): void { const open = !getState().pauseMenu; setState({ pauseMenu: open, pauseTab: 'main' }); this.setPaused(open || this.userPaused); }
  togglePerf(): void { this.perfOn = !this.perfOn; if (!this.perfOn) { setState({ perf: null }); this.renderer.setDebugNav(false); } }
  userPaused = false;

  /** Commands are stamped with an intended tick a few ticks ahead, exactly as an online client would send them. */
  issue(cmd: Command): void {
    if (!this.interactive()) return;
    const env: CommandEnvelope = { v: PROTOCOL_VERSION, seq: this.seq++, player: this.localPlayer, tick: this.simulation.tick + INPUT_DELAY_TICKS, cmd };
    this.commands.push(env);
    this.simulation.schedule(env.player, env.seq, env.tick, env.cmd);
  }

  setPaused(p: boolean): void {
    this.paused = p;
    if (p) this.audio.suspend(); else this.audio.resume();
  }

  setSpeed(v: number): void { this.speed = v; this.input.dirty = true; }

  resize(): void {
    this.renderer.resize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.overlay.width = Math.round(this.renderer.width * dpr);
    this.overlay.height = Math.round(this.renderer.height * dpr);
    this.overlayCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ------------------------------------------------------------------ main loop
  frame(dt: number): void {
    if (this.disposed) return;
    this.wall += dt;
    this.fps += (1 / Math.max(dt, 0.001) - this.fps) * 0.05;
    if (this.backdrop) {
      // drift toward the most recent fighting, otherwise sweep slowly between the two bases
      this.focusAge += dt;
      const st = this.simulation.map.starts;
      const k = 0.5 + 0.5 * Math.sin(this.wall * 0.045);
      const gx = this.focusAge < 12 ? this.focusX : st[0].x + (st[1].x - st[0].x) * k;
      const gz = this.focusAge < 12 ? this.focusZ : st[0].z + (st[1].z - st[0].z) * k;
      const rig = this.renderer.rig;
      rig.goalX += (gx - rig.goalX) * Math.min(1, dt * 0.35); rig.goalZ += (gz - rig.goalZ) * Math.min(1, dt * 0.35);
    } else this.input.update(dt);
    if (!this.paused && !this.ended) {
      const steps = this.clock.advance(dt * 1000, this.speed, Math.max(4, Math.ceil(this.speed * 3)));
      for (let i = 0; i < steps && !this.ended; i++) this.stepOnce();
    }
    const alpha = this.paused || this.ended ? 1 : this.clock.alpha;
    const v = this.view;
    v.selection = this.input.selection; v.hover = this.input.hover; v.placement = this.input.placement;
    v.ranges = this.input.ranges; v.dragBox = this.input.dragBox; v.showZones = this.input.mode === 'place';
    this.renderer.render(alpha, dt, v);
    if (this.overlayCtx && !this.backdrop) this.renderer.drawOverlay(this.overlayCtx, v);
    if (this.backdrop) { if (this.ended) { this.endTimer -= dt; if (this.endTimer <= 0 && this.endTimer > -100) { this.endTimer = -1000; this.finish(); } } return; }
    const rig = this.renderer.rig;
    this.audio.setListener(rig.tx, rig.tz, rig.h);
    this.heat = Math.max(0, this.heat - dt * 0.9);
    this.audio.setIntensity(this.heat / 9);
    this.hudTimer -= dt;
    if (this.hudTimer <= 0 || this.input.dirty) { this.hudTimer = 0.1; this.input.dirty = false; this.pushHud(); }
    if (this.ended) {
      this.endTimer -= dt;
      if (this.endTimer <= 0 && this.endTimer > -100) { this.endTimer = -1000; this.finish(); }
    }
  }

  private stepOnce(): void {
    const s = this.simulation;
    const t0 = performance.now();
    s.step();
    this.simMs += (performance.now() - t0 - this.simMs) * 0.1;
    this.onEvents(s.events);
    if (s.tick % HASH_INTERVAL === 0) {
      const h = s.hash();
      if (this.replay) {
        const rec = this.replay.hashes[this.replayHashIdx];
        if (rec && rec[0] === s.tick) { if (rec[1] !== h) this.replayOk = false; this.replayHashIdx++; }
      } else this.hashes.push([s.tick, h]);
    }
    if (this.tutorial) {
      this.tutorial.update(s, this.input);
      if (this.tutorial.justAdvanced) {
        this.audio.ui('step');
        const tg = this.tutorial.target(s);
        if (tg) this.addAlert('Objective marked on the minimap', 'info', tg.x, tg.z);
        this.input.dirty = true;
      }
    }
    if (!this.endgameAnnounced && s.tick >= ENDGAME_TICK) {
      this.endgameAnnounced = true;
      this.audio.endgame = true;
      this.addAlert('Endgame: wells yield 15% faster, reveal pulses every 90s', 'info', 80, 80);
    }
    if (s.tick === DECISION_TICK - 5 * 60 * TICK_RATE) this.addAlert('Decision at 35:00 - the greater surviving force wins', 'info', 80, 80);
    if (this.replay && s.winner < 0 && s.tick >= this.replay.endTick + 40) { this.ended = true; this.endTimer = 1; }
    if (s.winner >= 0 && !this.ended) { this.ended = true; this.endTimer = 2.4; this.input.cancelMode(); }
  }

  private addAlert(text: string, kind: string, x = -1, z = -1): void {
    const now = this.wall;
    const last = this.lastAlertByKind.get(kind + text) ?? -100;
    if (now - last < 4) return;
    this.lastAlertByKind.set(kind + text, now);
    this.alerts.unshift({ id: this.alertId++, text, kind, t: now, x, z });
    if (this.alerts.length > 5) this.alerts.length = 5;
    if (x >= 0) this.input.lastAlert = { x, z };
    this.input.dirty = true;
  }

  private onEvents(events: SimEvent[]): void {
    const s = this.simulation;
    const me = this.localPlayer;
    const obs = this.view.observer;
    if (this.fast) return;
    this.renderer.handleEvents(events, this.view);
    if (this.backdrop) {
      for (const ev of events) if (ev.t === 'fire' && ev.fx !== 'tool') { this.focusX += (ev.sx - this.focusX) * 0.08; this.focusZ += (ev.sz - this.focusZ) * 0.08; this.focusAge = 0; }
      return;
    }
    const ps = s.players[me];
    const vis = (x: number, z: number) => obs || ps.visible[s.visIndex(x, z)] > 0;
    for (const ev of events) {
      switch (ev.t) {
        case 'fire':
          if (vis(ev.sx, ev.sz)) { this.audio.play(ev.fx === 'tool' ? 'tool' : ev.fx, ev.sx, ev.sz); if (ev.fx !== 'tool') this.heat = Math.min(12, this.heat + 0.18); }
          break;
        case 'impact': if (ev.splash > 0 && vis(ev.x, ev.z)) this.audio.play(ev.fx === 'eruption' ? 'eruption' : 'boom', ev.x, ev.z); break;
        case 'death': {
          if (ev.killer === -2) break;
          const d = s.defs[ev.def];
          if (d.cls === 'resource' || d.faction === 'neutral') break;
          if (vis(ev.x, ev.z) || ev.owner === me) this.audio.play(d.cls === 'structure' ? 'collapse' : d.faction === 'chorus' ? 'death_bio' : 'death_mech', ev.x, ev.z);
          if (ev.owner === me && d.cls === 'structure') this.addAlert(`${d.name} destroyed`, 'attack', ev.x, ev.z);
          break;
        }
        case 'placed': if (ev.owner === me) this.audio.play('place', s.x[ev.id], s.z[ev.id]); break;
        case 'built': if (ev.owner === me && !obs) { this.audio.ui('built'); this.addAlert(`${s.defs[ev.def].name} complete`, 'good', s.x[ev.id], s.z[ev.id]); } break;
        case 'trained': if (ev.owner === me && !obs) this.audio.ui('trained'); break;
        case 'research': if (ev.owner === me && !obs) { this.audio.ui('research'); this.addAlert(`${TECH_DEFS[ev.tech].name} researched`, 'good'); } break;
        case 'ability': if (vis(ev.x, ev.z)) this.audio.play(ev.ab === 'mend' ? 'mend' : 'ability', ev.x, ev.z); break;
        case 'beam': if (s.alive[ev.from] && vis(s.x[ev.from], s.z[ev.from])) this.audio.play('heal', s.x[ev.from], s.z[ev.from]); break;
        case 'alert': {
          if (ev.owner !== me || obs) break;
          let text = ALERT_TEXT[ev.kind];
          if (ev.kind === 'supply') text = ps.supplyCap >= 120 ? 'Supply limit reached' : `Supply blocked - build a ${s.defs.find((d) => d.id === FACTIONS[ps.faction].supply)?.name}`;
          this.addAlert(text, ev.kind === 'attack' ? 'attack' : 'warn', ev.x, ev.z);
          this.audio.ui(ev.kind === 'attack' ? 'alert_attack' : ev.kind === 'supply' || ev.kind === 'depleted' ? 'alert' : 'error');
          break;
        }
        case 'captured': if (!obs) { this.audio.ui('capture'); this.addAlert(ev.owner === me ? 'Watch Pylon captured' : 'Enemy captured a Watch Pylon', ev.owner === me ? 'good' : 'warn', s.x[ev.id], s.z[ev.id]); } break;
        case 'salvage': if (ev.owner === me && !obs) { this.audio.ui('salvage'); this.addAlert('Salvage recovered: +100 ore, +25 flux', 'good', ev.x, ev.z); } break;
        case 'pulse': this.audio.ui('pulse'); this.addAlert('Reveal pulse from the ravine core', 'info', 80, 80); break;
        case 'gameover': if (this.mode === 'play') this.audio.ui(ev.winner === me ? 'victory' : 'defeat'); break;
      }
    }
  }

  private finish(): void {
    const s = this.simulation;
    let replay: ReplayData | null = null;
    if (this.mode === 'play') {
      replay = { v: PROTOCOL_VERSION, build: BUILD_VERSION, config: this.opts.config, commands: this.commands, hashes: this.hashes, endTick: s.tick, winner: s.winner, recordedAt: new Date().toISOString() };
    }
    this.opts.onEnd({
      mode: this.mode === 'replay' ? 'replay' : this.opts.config.mode, winner: s.winner, localPlayer: this.localPlayer, durationTicks: s.tick,
      config: this.opts.config, stats: s.players.map((p) => p.stats), replay,
      replayVerified: this.replay ? this.replayOk && s.winner === this.replay.winner && this.replayHashIdx > 0 : null,
    });
  }

  surrender(): void { this.issue({ k: 'surrender' }); }

  /** Debug/automation: run ticks synchronously without rendering their effects. */
  debugAdvance(ticks: number): void {
    this.fast = true;
    for (let i = 0; i < ticks && !this.ended; i++) this.stepOnce();
    this.fast = false;
    this.input.dirty = true;
  }

  /** Debug/automation: hand the local side to the AI (unattended captures only; not recorded as player commands). */
  debugAutopilot(on: boolean): void {
    this.simulation.thinkers[this.localPlayer] = on ? new AIController(this.simulation, this.localPlayer) : null;
  }

  dispose(): void {
    this.disposed = true;
    this.input.detach();
    this.audio.stopMusic();
    if (activeSession === this) activeSession = null;
    this.overlayCtx?.clearRect(0, 0, this.overlay.width, this.overlay.height);
    if (!this.backdrop) setState({ hud: null, perf: null });
  }

  // ------------------------------------------------------------------ HUD read model
  private pushHud(): void {
    const s = this.simulation;
    const me = this.localPlayer;
    const ps = s.players[me];
    const input = this.input;
    const icons = getState().icons;
    // selection summary
    const sel = input.selection.filter((e) => s.alive[e]);
    const groupsMap = new Map<number, number>();
    for (const e of sel) groupsMap.set(s.def[e], (groupsMap.get(s.def[e]) ?? 0) + 1);
    const card = input.buildCard();
    const activeDef = sel.length > 0 && s.owner[sel[0]] === me ? input.subgroupDef() : -1;
    const groups: SelGroup[] = [...groupsMap.entries()].map(([di, n]) => ({ def: s.defs[di].id, name: s.defs[di].name, count: n, icon: icons[s.defs[di].id] ?? '', active: di === activeDef }));
    let single: SelSingle | null = null;
    if (sel.length === 1 || groups.length === 1) {
      const e = sel[0];
      const d = s.d(e);
      const o = s.owner[e];
      const queue: QueueView[] = [];
      if (o === me && d.cls === 'structure') {
        const pauseReason = queuePauseReason(s, e);
        s.queue[e].forEach((q, i) => {
          const name = q.kind === 'unit' ? s.defs[q.def].name : TECH_DEFS[q.def].name;
          queue.push({ name, icon: q.kind === 'unit' ? icons[s.defs[q.def].id] ?? '' : '', progress: q.progress / q.total, paused: i === 0 ? pauseReason : '' });
        });
      }
      let status = '';
      if (d.cls === 'unit') status = o === me || this.view.observer ? orderLabel(s, e) : '';
      else if (s.flags[e] & FL_CONSTRUCTING) status = `Under construction ${Math.round(s.progress[e] * 100)}%`;
      else if (d.id === 'watch_pylon') status = s.capOwner[e] < 0 ? 'Unclaimed' : s.capOwner[e] === me ? 'Held by you' : 'Held by the enemy';
      else if (d.cls === 'structure' && queue.length > 0) status = queue[0].paused || `Producing ${queue[0].name}`;
      const res = d.id === 'ore' ? s.amount[e] : d.id === 'vent' ? s.amount[e] : d.tap && s.link[e] >= 0 ? s.amount[s.link[e]] : -1;
      single = {
        id: e, name: sel.length > 1 ? `${d.name} x${sel.length}` : d.name, icon: icons[d.id] ?? '',
        owner: o === NEUTRAL ? 'Neutral' : s.cfg.players[o].name, ownerKind: o === NEUTRAL ? 'neutral' : o === me ? 'self' : 'enemy',
        hp: Math.max(0, Math.ceil(s.hp[e])), maxHp: d.hp, shield: Math.round(s.shield[e]), maxShield: d.shield, energy: Math.round(s.energy[e]), maxEnergy: d.energy,
        role: d.role, status, stats: d.cls === 'resource' || d.faction === 'neutral' ? [] : statLines(d).slice(0, 2), tags: d.tags,
        queue, constructing: s.flags[e] & FL_CONSTRUCTING ? s.progress[e] : -1, resource: res,
      };
    }
    // economy
    let idle = 0;
    const saturation: { workers: number; ideal: number }[] = [];
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] !== me) continue;
      const d = s.d(e);
      if (d.worker && s.orders[e].length === 0) idle++;
      if (d.hq && !(s.flags[e] & FL_CONSTRUCTING)) {
        let seams = 0, w = 0;
        for (const r of s.ids) {
          if (!s.alive[r] || s.d(r).id !== 'ore') continue;
          if (Math.abs(s.x[r] - s.x[e]) < 14 && Math.abs(s.z[r] - s.z[e]) < 14) { seams++; w += s.assigned[r]; }
        }
        saturation.push({ workers: w, ideal: seams * 2 });
      }
    }
    const now = this.wall;
    this.alerts = this.alerts.filter((a) => now - a.t < 7);
    const tut = this.tutorial ? this.tutorial.view() : null;
    const enemyHq = s.defs.find((d) => d.id === FACTIONS[s.cfg.players[1 - me].faction].hq)?.name ?? 'headquarters';
    const hud: HudState = {
      time: fmtTime(s.tick), ore: Math.floor(ps.ore), flux: Math.floor(ps.flux), supplyUsed: ps.supplyUsed, supplyCap: ps.supplyCap, workers: ps.workers, idleWorkers: idle,
      saturation,
      objective: this.mode === 'replay' ? 'Replay' : this.mode === 'spectate' ? 'Spectating AI match' : tut ? tut.title : `Destroy every enemy ${enemyHq}`,
      selCount: sel.length, groups, single, card,
      alerts: this.alerts.slice(),
      mode: input.mode, modeHint: input.modeHint(),
      controlGroups: input.groups.map((g) => g.filter((e) => s.alive[e]).length),
      replay: this.mode !== 'play' ? { speed: this.speed, tick: s.tick, endTick: this.replay?.endTick ?? 0, syncOk: this.replayOk, paused: this.paused } : null,
      tutorial: tut,
      endgame: s.tick >= ENDGAME_TICK,
      faction: ps.faction,
      toast: this.wall < this.toastUntil ? this.toastText : '',
    };
    const patch: Parameters<typeof setState>[0] = { hud, minimapTick: getState().minimapTick + 1 };
    if (this.perfOn) {
      const r = this.renderer.stats;
      patch.perf = { fps: Math.round(this.fps), frameMs: Math.round(r.frameMs * 10) / 10, simMs: Math.round(this.simMs * 100) / 100, drawCalls: r.drawCalls, triangles: r.triangles, entities: s.ids.length, tick: s.tick, ai: s.thinkers.map((t, i) => (t ? `P${i + 1}: ${t.label()}` : '')).filter(Boolean).join(' | '), paths: s.pathfinder.searches, hash: s.hash().toString(16) };
    }
    setState(patch);
  }
}
