// game-server: authoritative Team Clash room. Runs headless (Web Worker for Practice, Node for tests or a
// hosted deployment). Owns movement, ammo, fire cadence, hits, damage, Momentum, support actions, spawns,
// score and the match clock. Never imports rendering or UI code.
import { K17 } from '../content/k17';
import { EQUIP_BY_ID, SUPPORT_BY_ID, SUPPORT_TUNING as ST } from '../content/kit';
import { BOT_LOADOUTS, Loadout, PRACTICE_RULESET, ResolvedLoadout, resolveLoadout, validateLoadout } from '../content/loadout';
import { MapDef, MATS, zoneAt } from '../content/mapTypes';
import { BOT_NAMES, BOT_SKILL, COMBAT, DT, MATCH, MOMENTUM, SCORE, SNAPSHOT_EVERY, TICK_RATE } from '../content/tuning';
import { damageAt, WEAPONS } from '../content/weapons';
import { encodeSnapshot, PF, SnapEntity, SnapPlayer, Snapshot, decodeCmd } from '../protocol/codec';
import { ClientMsg, ENT, GameEvent, HitRecord, MatchConfig, MatchResult, PHASE_LIVE, PHASE_POST, PHASE_SUDDEN, PHASE_WARMUP, Phase, PROTOCOL_VERSION, resultChecksum, RosterEntry, ServerMsg } from '../protocol/messages';
import { chestHeight, eyeHeight, headHeight, rayVsPlayer, rayVsSphere, segPointDist, ZONE_HEAD, ZONE_UPPER } from '../sim/hitboxes';
import { clamp, Rng, viewDir } from '../sim/math';
import { NavGrid } from '../sim/nav';
import type { Rapier } from '../sim/physics';
import { BTN, InputCmd, newPlayerState, PlayerState, recoilKick, SimEvent, StepCtx, stepPlayer } from '../sim/player';
import { World } from '../sim/world';
import { BotBrain } from './bots';
import { chooseSpawn, SpawnContext } from './spawn';

export interface DamageRec { tick: number; attacker: number; dmg: number; zone: number; src: string }

export interface SPlayer {
  id: number;
  name: string;
  team: 0 | 1;
  isBot: boolean;
  client: number;
  loadouts: Loadout[];
  loadoutIdx: number;
  nextLoadout: number;
  lo: ResolvedLoadout;
  st: PlayerState;
  alive: boolean;
  health: number;
  lastDmgTick: number;
  momentum: number;
  supports: number;
  supportsUsed: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  streak: number;
  bestStreak: number;
  devices: number;
  respawnT: number;
  protT: number;
  dmgLog: DamageRec[];
  flashT: number;
  revealUntil: number;
  markedUntil: number;
  lastFireTick: number;
  lastKillTick: number;
  multi: number;
  lastKiller: number;
  queue: InputCmd[];
  credit: number;
  backlog: number;
  ackSeq: number;
  lastCmd: InputCmd;
  hist: Float32Array; // ring of [x,y,z,crouchT] per tick
  tally: Map<string, { shots: number; hits: number; kills: number; headshots: number }>;
  adsKills: number;
  equipHits: number;
  districts: number;
  podTick: number;
  brain: BotBrain | null;
  events: GameEvent[];
  hadSpawn: boolean;
}

export interface Entity {
  id: number;
  type: number;
  team: 0 | 1;
  owner: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number;
  fuse: number;
  hp: number;
  yaw: number;
  stuck: boolean;
  phase: number;
  timer: number;
  dead: boolean;
  src: string;
  hits?: Map<number, number>;
}

export interface Noise { x: number; y: number; z: number; r: number; team: number; id: number; tick: number }

const HIST = 32;
const SURF_CODE: Record<string, number> = { concrete: 1, metal: 2, wood: 3, glass: 4, dirt: 5 };
const SURF_FLESH = 6;
const PEN_FACTOR = (cost: number): number => (cost < 0.1 ? 1 : cost < 0.5 ? 0.9 : cost < 0.9 ? 0.75 : cost < 1.2 ? 0.7 : 0.6);

export class Room {
  readonly map: MapDef = K17;
  readonly world: World;
  readonly nav: NavGrid;
  readonly rng: Rng;
  readonly cfg: MatchConfig;
  players: SPlayer[] = [];
  entities: Entity[] = [];
  noises: Noise[] = [];
  tickN = 0;
  phase: Phase = PHASE_WARMUP;
  phaseT = 0; // seconds remaining in the current phase
  scores: [number, number] = [0, 0];
  suddenTarget = 0;
  wentSudden = false;
  result: MatchResult | null = null;
  recentDeaths: { x: number; z: number; tick: number; team: number }[] = [];
  heat: [Float32Array, Float32Array];
  readonly heatNx: number;
  readonly heatNz: number;
  intel: [{ x: number; y: number; z: number; tick: number }[], { x: number; y: number; z: number; tick: number }[]] = [[], []];
  recon: [{ left: number; next: number }, { left: number; next: number }] = [{ left: 0, next: 0 }, { left: 0, next: 0 }];
  uplinkUntil: [number, number] = [0, 0];
  spawnAudit: string[] = [];
  firstBlood = false;
  droppedCmds = 0;
  liveTicks = 0;
  private nextEnt = 1;
  private send: (client: number, msg: ServerMsg, transfer?: ArrayBuffer[]) => void;
  private simEv: SimEvent[] = [];
  private ctx: StepCtx;
  private broadcastEv: GameEvent[] = [];
  private kick = { yaw: 0, pitch: 0 };
  private dir = { x: 0, y: 0, z: 0 };
  private glassCenters: { x: number; y: number; z: number }[] = [];
  private matchSerial: string;
  /** p95 bookkeeping for the tick budget benchmark */
  tickMs: number[] = [];

  constructor(R: Rapier, cfg: MatchConfig, send: (client: number, msg: ServerMsg, transfer?: ArrayBuffer[]) => void) {
    this.cfg = cfg;
    this.send = send;
    this.world = new World(R, this.map);
    this.nav = NavGrid.bake(this.map);
    this.rng = new Rng(cfg.seed);
    this.phaseT = cfg.warmup;
    this.heatNx = Math.ceil((this.map.bounds.maxX - this.map.bounds.minX) / 8);
    this.heatNz = Math.ceil((this.map.bounds.maxZ - this.map.bounds.minZ) / 8);
    this.heat = [new Float32Array(this.heatNx * this.heatNz), new Float32Array(this.heatNx * this.heatNz)];
    this.ctx = { world: this.world, lo: resolveLoadout(BOT_LOADOUTS[0]), id: 0, frozen: false, equipMult: 1, ev: this.simEv };
    for (const s of this.map.solids) if (s.glass !== undefined) this.glassCenters[s.glass] = { x: (s.min[0] + s.max[0]) / 2, y: (s.min[1] + s.max[1]) / 2, z: (s.min[2] + s.max[2]) / 2 };
    this.matchSerial = `${cfg.mapId}-${cfg.seed.toString(36)}-${Date.now().toString(36)}`;
  }

  // ------------------------------------------------------------------ roster
  private makePlayer(name: string, team: 0 | 1, isBot: boolean, client: number, loadouts: Loadout[], idx: number): SPlayer {
    const lo = resolveLoadout(loadouts[idx]);
    const p: SPlayer = {
      id: this.players.length, name, team, isBot, client, loadouts, loadoutIdx: idx, nextLoadout: idx, lo,
      st: newPlayerState(0, 0, 0, 0, lo), alive: false, health: COMBAT.maxHealth, lastDmgTick: -9999, momentum: 0, supports: 0, supportsUsed: 0,
      kills: 0, deaths: 0, assists: 0, score: 0, streak: 0, bestStreak: 0, devices: 0, respawnT: 0, protT: 0, dmgLog: [], flashT: 0,
      revealUntil: 0, markedUntil: 0, lastFireTick: -9999, lastKillTick: -9999, multi: 0, lastKiller: -1, queue: [], credit: 2, backlog: 0, ackSeq: 0,
      lastCmd: { seq: 0, rt: 0, mx: 0, mz: 0, yaw: 0, pitch: 0, buttons: 0, slot: 0, sel: 0 }, hist: new Float32Array(HIST * 4),
      tally: new Map(), adsKills: 0, equipHits: 0, districts: 0, podTick: -9999, brain: null, events: [], hadSpawn: false,
    };
    this.players.push(p);
    return p;
  }

  /** Validates and seats a human. Returns an error string on rejection. */
  addHuman(client: number, name: string, loadouts: Loadout[], idx: number): { ok: true; id: number } | { ok: false; code: 'loadout' | 'full'; detail: string } {
    if (!Array.isArray(loadouts) || loadouts.length < 1 || loadouts.length > 5) return { ok: false, code: 'loadout', detail: 'Expected 1-5 loadouts' };
    for (const l of loadouts) {
      const errs = validateLoadout(l, PRACTICE_RULESET);
      if (errs.length) return { ok: false, code: 'loadout', detail: errs[0] };
    }
    const team = this.cfg.humanTeam;
    if (this.players.filter((p) => p.team === team && !p.isBot).length >= this.cfg.teamSize) return { ok: false, code: 'full', detail: 'Team is full' };
    const clean = String(name).replace(/[^\w \-.]/g, '').slice(0, 16) || 'Operator';
    const p = this.makePlayer(clean, team, false, client, loadouts, clamp(idx | 0, 0, loadouts.length - 1));
    return { ok: true, id: p.id };
  }

  /** Fill every open seat with a bot and spawn everyone at their staging yard. */
  start(): void {
    const names = BOT_NAMES.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = this.rng.int(i + 1); [names[i], names[j]] = [names[j], names[i]]; }
    const taken = new Set(this.players.map((p) => p.name));
    let ni = 0;
    // both teams draw the same shuffled kit list so bot compositions are mirrored (fair) but vary per match
    const kits = BOT_LOADOUTS.slice();
    for (let i = kits.length - 1; i > 0; i--) { const j = this.rng.int(i + 1); [kits[i], kits[j]] = [kits[j], kits[i]]; }
    for (const team of [0, 1] as const) {
      let k = 0;
      while (this.players.filter((p) => p.team === team).length < this.cfg.teamSize) {
        while (taken.has(names[ni % names.length])) ni++;
        const kit = [kits[k++ % kits.length]];
        const p = this.makePlayer(names[ni++ % names.length], team, true, -1, kit, 0);
        p.brain = new BotBrain(this, p, BOT_SKILL[this.cfg.difficulty], new Rng(this.cfg.seed * 31 + p.id * 977 + 5));
      }
    }
    for (const p of this.players) this.spawn(p, true);
    for (const p of this.players) {
      if (p.isBot) continue;
      this.send(p.client, { m: 'welcome', version: PROTOCOL_VERSION, you: p.id, roster: this.roster(), config: this.cfg, tick: this.tickN });
    }
    this.announce('warmup');
    this.pushStats();
  }

  roster(): RosterEntry[] {
    return this.players.map((p) => ({ id: p.id, name: p.name, team: p.team, bot: p.isBot, primary: p.lo.weapons[0].def.id }));
  }

  onMessage(client: number, msg: ClientMsg): void {
    const p = this.players.find((q) => q.client === client && !q.isBot);
    if (!p) return;
    if (msg.m === 'cmd') {
      const c = decodeCmd(msg.data);
      if (!c) return;
      if (c.seq <= p.ackSeq || p.queue.length > 30) return; // stale or flooding
      p.queue.push(c);
    } else if (msg.m === 'loadout') {
      if (Number.isInteger(msg.index) && msg.index >= 0 && msg.index < p.loadouts.length) p.nextLoadout = msg.index;
    }
  }

  // ------------------------------------------------------------------ main tick
  tick(): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    this.tickN++;
    this.stepPhase();
    const frozen = this.phase === PHASE_WARMUP || this.phase === PHASE_POST;
    for (const p of this.players) {
      if (p.isBot) {
        if (p.alive && p.brain) this.runCmd(p, p.brain.think(), frozen);
      } else {
        // One command of budget per server tick, banked up to ~330 ms so a burst after packet delay drains at once
        // without ever letting a client run faster than real time on average.
        p.credit = Math.min(20, p.credit + 1);
        // A standing input backlog (server hitch, or a client clock running fast) would otherwise add permanent
        // input delay: once it has persisted for ~0.5 s, discard the oldest commands and acknowledge them.
        p.backlog = p.queue.length > 3 ? p.backlog + 1 : 0;
        if (p.backlog > 30) {
          const drop = p.queue.splice(0, p.queue.length - 1);
          p.ackSeq = drop[drop.length - 1].seq;
          p.backlog = 0;
          this.droppedCmds += drop.length;
        }
        let n = 0;
        while (p.queue.length && p.credit > 0 && n < 10) {
          const c = p.queue.shift()!;
          p.credit--; n++;
          p.ackSeq = c.seq;
          p.lastCmd = c;
          if (p.alive) this.runCmd(p, c, frozen);
        }
      }
    }
    this.stepEntities();
    this.stepSupport();
    for (const p of this.players) this.upkeep(p);
    if (this.tickN % TICK_RATE === 0) {
      for (const h of this.heat) for (let i = 0; i < h.length; i++) h[i] *= 0.97;
      const cut = this.tickN - 20 * TICK_RATE;
      if (this.recentDeaths.length && this.recentDeaths[0].tick < cut) this.recentDeaths = this.recentDeaths.filter((d) => d.tick >= cut);
      for (const t of [0, 1]) this.intel[t] = this.intel[t].filter((i) => this.tickN - i.tick < 6 * TICK_RATE);
    }
    if (this.noises.length > 48) this.noises.splice(0, this.noises.length - 48);
    if (this.tickN % SNAPSHOT_EVERY === 0) this.sendSnapshots();
    this.flushEvents();
    if (t0) {
      this.tickMs.push(performance.now() - t0);
      if (this.tickMs.length > 4000) this.tickMs.splice(0, 2000);
    }
  }

  private stepPhase(): void {
    if (this.phase === PHASE_POST) { this.phaseT = Math.max(0, this.phaseT - DT); return; }
    this.phaseT -= DT;
    if (this.phase === PHASE_WARMUP) {
      if (this.phaseT <= 0) {
        this.phase = PHASE_LIVE;
        this.phaseT = this.cfg.timeLimit;
        for (const p of this.players) { p.protT = COMBAT.spawnProtect; p.st.moved = 0; p.st.fired = 0; }
        this.broadcast({ e: 'phase', phase: PHASE_LIVE });
        this.announce('start');
      }
      return;
    }
    this.liveTicks++;
    const [a, b] = this.scores;
    if (this.phase === PHASE_LIVE) {
      if (a >= this.cfg.scoreLimit || b >= this.cfg.scoreLimit) return this.endMatch(a === b ? -1 : a > b ? 0 : 1);
      if (this.phaseT <= 0) {
        if (a !== b) return this.endMatch(a > b ? 0 : 1);
        this.phase = PHASE_SUDDEN;
        this.wentSudden = true;
        this.phaseT = MATCH.suddenDeath;
        this.suddenTarget = a + MATCH.suddenDeathPoints;
        this.broadcast({ e: 'phase', phase: PHASE_SUDDEN });
        this.announce('sudden');
      }
    } else if (this.phase === PHASE_SUDDEN) {
      if (a >= this.suddenTarget || b >= this.suddenTarget) return this.endMatch(a === b ? -1 : a > b ? 0 : 1);
      if (this.phaseT <= 0) return this.endMatch(a === b ? -1 : a > b ? 0 : 1);
    }
  }

  // ------------------------------------------------------------------ per-command simulation
  private runCmd(p: SPlayer, cmd: InputCmd, frozen: boolean): void {
    const prevBtn = p.st.btn;
    const ctx = this.ctx;
    ctx.lo = p.lo; ctx.id = p.id; ctx.frozen = frozen;
    ctx.equipMult = this.uplinkUntil[p.team] > this.tickN ? ST.uplinkRecharge : 1;
    this.simEv.length = 0;
    stepPlayer(p.st, cmd, ctx);
    for (let i = 0; i < this.simEv.length; i++) {
      const ev = this.simEv[i];
      if (ev.t === 'shot') this.resolveShot(p, ev, cmd.rt);
      else if (ev.t === 'melee') this.resolveMelee(p);
      else if (ev.t === 'throw') this.spawnThrown(p, ev);
    }
    if (frozen) return;
    const pressed = cmd.buttons & ~prevBtn;
    if (pressed & BTN.SUPPORT) this.trySupport(p, cmd.sel);
    if (pressed & BTN.PING) this.doPing(p);
    if (p.protT > 0 && (p.st.fired || p.st.moved > COMBAT.spawnProtectMove)) p.protT = 0;
  }

  private upkeep(p: SPlayer): void {
    const live = this.phase === PHASE_LIVE || this.phase === PHASE_SUDDEN;
    if (p.flashT > 0) p.flashT = Math.max(0, p.flashT - DT);
    if (p.alive) {
      if (p.protT > 0 && live) p.protT = Math.max(0, p.protT - DT);
      const delay = (COMBAT.regenDelay + p.lo.perks.regenDelayAdd) * TICK_RATE;
      if (p.health < COMBAT.maxHealth && this.tickN - p.lastDmgTick >= delay) p.health = Math.min(COMBAT.maxHealth, p.health + COMBAT.regenRate * DT);
      if (!p.isBot && this.tickN % 30 === 0) {
        const zn = zoneAt(this.map, p.st.px, p.st.py + 1, p.st.pz);
        if (zn && zn.district >= 0) p.districts |= 1 << zn.district;
      }
      // footstep noise for bot hearing (semantic radius; playback is client-side)
      if (this.tickN % 20 === p.id % 20 && p.st.grounded) {
        const sp = Math.hypot(p.st.vx, p.st.vz);
        const r = sp < 1 ? 0 : p.st.sprint ? 15 : p.st.crouch ? 4 : 9;
        if (r > 0) this.noises.push({ x: p.st.px, y: p.st.py, z: p.st.pz, r, team: p.team, id: p.id, tick: this.tickN });
      }
    } else if (live || this.phase === PHASE_WARMUP) {
      if (p.hadSpawn) {
        p.respawnT -= DT;
        if (p.respawnT <= 0) this.spawn(p, false);
      }
    }
    const i = (this.tickN % HIST) * 4;
    p.hist[i] = p.st.px; p.hist[i + 1] = p.st.py; p.hist[i + 2] = p.st.pz; p.hist[i + 3] = p.alive ? p.st.crouchT : -1;
  }

  /** Lag-compensated position `back` ticks ago (fractional). */
  private rewound(p: SPlayer, back: number, out: { x: number; y: number; z: number; c: number }): boolean {
    if (back <= 0.01) {
      out.x = p.st.px; out.y = p.st.py; out.z = p.st.pz; out.c = p.st.crouchT;
      return p.alive;
    }
    const tf = this.tickN - 1 - back; // history is recorded at end of tick
    const t0 = Math.floor(tf), f = tf - t0;
    const i0 = (((t0 % HIST) + HIST) % HIST) * 4, i1 = ((((t0 + 1) % HIST) + HIST) % HIST) * 4;
    const h = p.hist;
    if (h[i0 + 3] < 0 || h[i1 + 3] < 0) { out.x = p.st.px; out.y = p.st.py; out.z = p.st.pz; out.c = p.st.crouchT; return p.alive; }
    // do not interpolate across a respawn teleport
    if (Math.abs(h[i0] - h[i1]) + Math.abs(h[i0 + 2] - h[i1 + 2]) > 4) { out.x = h[i1]; out.y = h[i1 + 1]; out.z = h[i1 + 2]; out.c = h[i1 + 3]; return true; }
    out.x = h[i0] + (h[i1] - h[i0]) * f;
    out.y = h[i0 + 1] + (h[i1 + 1] - h[i0 + 1]) * f;
    out.z = h[i0 + 2] + (h[i1 + 2] - h[i0 + 2]) * f;
    out.c = h[i0 + 3] + (h[i1 + 3] - h[i0 + 3]) * f;
    return true;
  }

  private tallyOf(p: SPlayer, weapon: string) {
    let t = p.tally.get(weapon);
    if (!t) { t = { shots: 0, hits: 0, kills: 0, headshots: 0 }; p.tally.set(weapon, t); }
    return t;
  }

  private rw = { x: 0, y: 0, z: 0, c: 0 };

  private resolveShot(p: SPlayer, ev: Extract<SimEvent, { t: 'shot' }>, rt: number): void {
    const w = p.lo.weapons[ev.slot];
    const tally = this.tallyOf(p, w.def.id);
    tally.shots++;
    p.lastFireTick = this.tickN;
    if (!w.suppressed) p.revealUntil = Math.max(p.revealUntil, this.tickN + Math.round(1.6 * TICK_RATE));
    this.noises.push({ x: p.st.px, y: p.st.py, z: p.st.pz, r: w.suppressed ? 14 : 60, team: p.team, id: p.id, tick: this.tickN });
    if (p.isBot && p.brain) {
      recoilKick(w, ev.burst, ev.ads, p.st.crouch === 1, p.id, ev.seq, this.kick);
      p.brain.applyRecoil(this.kick.yaw, this.kick.pitch);
    }
    const back = p.isBot ? 0 : clamp(this.tickN - rt, 0, COMBAT.lagCompMaxTicks);
    const ends: number[] = [];
    const surf: number[] = [];
    const perVictim = new Map<number, { dmg: number; zone: number; dist: number }>();
    const rw = this.rw;
    for (let k = 0; k < ev.dirs.length; k += 3) {
      const dx = ev.dirs[k], dy = ev.dirs[k + 1], dz = ev.dirs[k + 2];
      const trace = this.world.traceBullet(ev.ox, ev.oy, ev.oz, dx, dy, dz, 220, w.def.penetration);
      let end = trace.end;
      let hitSurf = 0;
      if (trace.walls.length) {
        const last = trace.walls[trace.walls.length - 1];
        if (last.stopped) hitSurf = SURF_CODE[MATS[last.mat].surf] ?? 1;
      }
      // players
      let bestT = end, bestZone = -1, bestP: SPlayer | null = null;
      for (const q of this.players) {
        if (q.team === p.team || !q.alive) continue;
        if (!this.rewound(q, back, rw)) continue;
        const h = rayVsPlayer(ev.ox, ev.oy, ev.oz, dx, dy, dz, rw.x, rw.y, rw.z, rw.c, bestT);
        if (h && h.t < bestT) { bestT = h.t; bestZone = h.zone; bestP = q; }
      }
      // hostile devices
      let devT = bestT, dev: Entity | null = null;
      for (const e of this.entities) {
        if (e.dead || e.team === p.team || e.hp <= 0) continue;
        if (e.type !== ENT.DRONE && e.type !== ENT.POD && e.type !== ENT.MINE) continue;
        const r = e.type === ENT.DRONE ? 0.75 : e.type === ENT.POD ? 0.6 : 0.3;
        const t = rayVsSphere(ev.ox, ev.oy, ev.oz, dx, dy, dz, e.x, e.y + (e.type === ENT.POD ? 0.45 : 0), e.z, r, devT);
        if (t >= 0 && t < devT) { devT = t; dev = e; }
      }
      let factor = 1;
      const stopT = dev ? devT : bestT;
      for (const wall of trace.walls) {
        if (wall.stopped || wall.t > stopT) break;
        factor *= PEN_FACTOR(MATS[wall.mat].pen);
        if (wall.glass >= 0) this.breakGlass(wall.glass);
      }
      if (dev) {
        end = devT; hitSurf = 2;
        this.damageDevice(dev, damageAt(w, devT, 2) * factor, p);
      } else if (bestP) {
        end = bestT; hitSurf = SURF_FLESH;
        const dmg = damageAt(w, bestT, bestZone) * factor;
        const acc = perVictim.get(bestP.id);
        if (acc) { acc.dmg += dmg; acc.zone = Math.min(acc.zone, bestZone); }
        else perVictim.set(bestP.id, { dmg, zone: bestZone, dist: bestT });
      }
      ends.push(ev.ox + dx * end, ev.oy + dy * end, ev.oz + dz * end);
      surf.push(hitSurf);
    }
    if (perVictim.size) tally.hits++;
    const sx = p.st.px, sy = p.st.py + eyeHeight(p.st.crouchT), sz = p.st.pz;
    for (const [vid, acc] of perVictim) {
      this.applyDamage(this.players[vid], p, acc.dmg, w.def.id, acc.zone, sx, sy, sz, { dist: acc.dist, ads: ev.ads > 0.6 });
    }
    const msg: GameEvent = { e: 'shot', p: p.id, w: w.def.idx, sup: w.suppressed, o: [ev.ox, ev.oy, ev.oz], ends, surf };
    for (const q of this.players) if (!q.isBot && q.id !== p.id) q.events.push(msg);
  }

  private resolveMelee(p: SPlayer): void {
    this.broadcast({ e: 'melee', p: p.id });
    const ex = p.st.px, ey = p.st.py + eyeHeight(p.st.crouchT), ez = p.st.pz;
    viewDir(p.st.yaw, p.st.pitch, this.dir);
    let best: SPlayer | null = null, bd: number = COMBAT.meleeRange;
    for (const q of this.players) {
      if (q.team === p.team || !q.alive) continue;
      const cx = q.st.px - ex, cy = q.st.py + chestHeight(q.st.crouchT) - ey, cz = q.st.pz - ez;
      const d = Math.hypot(cx, cy, cz);
      if (d > bd || d < 1e-3) continue;
      if ((cx * this.dir.x + cy * this.dir.y + cz * this.dir.z) / d < COMBAT.meleeCos) continue;
      if (!this.world.clearLine(ex, ey, ez, q.st.px, q.st.py + chestHeight(q.st.crouchT), q.st.pz)) continue;
      best = q; bd = d;
    }
    if (best) this.applyDamage(best, p, COMBAT.meleeDamage, 'melee', ZONE_UPPER, ex, ey, ez, { dist: bd });
    // melee also breaks glass in reach
    const h = this.world.raycast(ex, ey, ez, this.dir.x, this.dir.y, this.dir.z, 2.0, 'bullet');
    if (h && h.solid >= 0) { const g = this.map.solids[h.solid].glass; if (g !== undefined) this.breakGlass(g); }
  }

  // ------------------------------------------------------------------ damage, kills, scoring
  applyDamage(v: SPlayer, attacker: SPlayer | null, amount: number, src: string, zone: number, ax: number, ay: number, az: number,
    opts: { dist?: number; ads?: boolean; support?: boolean; equip?: boolean } = {}): number {
    if (!v.alive || (this.phase !== PHASE_LIVE && this.phase !== PHASE_SUDDEN)) return 0;
    if (v.protT > 0) return 0;
    if (attacker && attacker !== v && attacker.team === v.team) return 0; // friendly fire off
    if (attacker === v) amount *= 0.6;
    if (amount <= 0) return 0;
    amount = Math.min(amount, v.health);
    v.health -= amount;
    v.lastDmgTick = this.tickN;
    v.dmgLog.push({ tick: this.tickN, attacker: attacker ? attacker.id : -1, dmg: amount, zone, src });
    const kill = v.health <= 0.001;
    if (!v.isBot) v.events.push({ e: 'dmg', amount, fx: ax, fy: ay, fz: az, health: Math.max(0, v.health), zone });
    if (v.brain && attacker && attacker !== v) v.brain.onDamaged(attacker, ax, ay, az);
    if (attacker && attacker !== v) {
      if (!attacker.isBot) attacker.events.push({ e: 'hit', victim: v.id, zone, dmg: amount, kill, x: v.st.px, y: v.st.py + chestHeight(v.st.crouchT), z: v.st.pz });
      if (opts.equip) attacker.equipHits++;
    }
    if (kill) this.kill(v, attacker, src, zone, opts);
    return amount;
  }

  private award(p: SPlayer, label: string, amount: number): void {
    p.score += amount;
    if (!p.isBot) p.events.push({ e: 'score', label, amount });
  }

  private addMomentum(p: SPlayer, amount: number): void {
    if (!p.alive) return;
    const prev = p.momentum;
    p.momentum = Math.min(MOMENTUM.tiers[2], p.momentum + amount);
    for (let i = 0; i < 3; i++) {
      if (prev < MOMENTUM.tiers[i] && p.momentum >= MOMENTUM.tiers[i] && !(p.supports & (1 << i))) {
        p.supports |= 1 << i;
        if (!p.isBot) p.events.push({ e: 'supportReady', tier: i });
      }
    }
  }

  private kill(v: SPlayer, killer: SPlayer | null, src: string, zone: number, opts: { dist?: number; ads?: boolean; support?: boolean; equip?: boolean }): void {
    v.alive = false;
    v.health = 0;
    v.deaths++;
    v.respawnT = COMBAT.respawnDelay;
    const endedStreak = v.streak;
    v.streak = 0;
    v.momentum = 0;
    v.st.vx = 0; v.st.vz = 0; v.st.cookT = -1;
    this.recentDeaths.push({ x: v.st.px, z: v.st.pz, tick: this.tickN, team: v.team });
    this.heatAdd(v.team, v.st.px, v.st.pz, 1);
    const head = zone === ZONE_HEAD && !opts.support && !opts.equip && src !== 'melee';
    const assists: number[] = [];
    const real = killer && killer !== v ? killer : null;
    if (real) {
      this.scores[real.team]++;
      real.kills++;
      real.streak++;
      real.bestStreak = Math.max(real.bestStreak, real.streak);
      v.lastKiller = real.id;
      this.award(real, 'Elimination', SCORE.kill);
      if (head) this.award(real, 'Headshot', SCORE.headshot);
      if (!opts.support && !opts.equip && (opts.dist ?? 0) > 45) this.award(real, 'Longshot', SCORE.longshot);
      if (!this.firstBlood) { this.firstBlood = true; this.award(real, 'First Contact', SCORE.firstContact); }
      if (real.lastKiller === v.id) { real.lastKiller = -1; this.award(real, 'Payback', SCORE.payback); }
      if (endedStreak >= 5) this.award(real, 'Momentum Break', SCORE.shutdown);
      real.multi = this.tickN - real.lastKillTick < 4 * TICK_RATE ? real.multi + 1 : 1;
      real.lastKillTick = this.tickN;
      if (real.multi === 2) this.award(real, 'Double', SCORE.double);
      else if (real.multi >= 3) this.award(real, 'Triple', SCORE.triple);
      if (!opts.support) this.addMomentum(real, MOMENTUM.kill); // support kills score but never extend Momentum
      const t = WEAPONS.find((w) => w.id === src) ? this.tallyOf(real, src) : null;
      if (t) { t.kills++; if (head) t.headshots++; }
      if (opts.ads && t) real.adsKills++;
      // assists: anyone else on the killer's team who damaged the victim recently
      const cut = this.tickN - COMBAT.assistWindow * TICK_RATE;
      for (const d of v.dmgLog) {
        if (d.tick < cut || d.attacker < 0 || d.attacker === real.id || assists.includes(d.attacker)) continue;
        const a = this.players[d.attacker];
        if (a.team !== real.team) continue;
        assists.push(a.id);
        a.assists++;
        this.award(a, 'Assist', SCORE.assist);
        this.addMomentum(a, MOMENTUM.assist);
      }
      if (this.uplinkUntil[real.team] > this.tickN) {
        for (const m of this.players) {
          if (m.team !== real.team || m === real || !m.alive || assists.includes(m.id)) continue;
          if (Math.hypot(m.st.px - real.st.px, m.st.pz - real.st.pz) > ST.uplinkShareRadius) continue;
          assists.push(m.id);
          m.assists++;
          this.award(m, 'Uplink Assist', SCORE.sharedAssist);
          this.addMomentum(m, MOMENTUM.assist);
        }
      }
      // ammo satchel for Scavenger Rig users on the killer's team
      if (this.players.some((m) => m.team === real.team && m.lo.perks.scavenger)) {
        this.addEntity(ENT.SATCHEL, real.team, real.id, v.st.px, v.st.py + 0.15, v.st.pz, 'satchel');
      }
      this.checkThresholds(real.team);
    }
    this.broadcast({ e: 'kill', killer: real ? real.id : v.id, victim: v.id, src, head, assists });
    if (!v.isBot) {
      const hits: HitRecord[] = v.dmgLog.slice(-8).map((d) => ({ t: (this.tickN - d.tick) / TICK_RATE, dmg: Math.round(d.dmg), zone: d.zone, src: d.src }));
      v.events.push({
        e: 'recap', killer: real ? real.id : v.id, src, dist: real ? Math.hypot(real.st.px - v.st.px, real.st.py - v.st.py, real.st.pz - v.st.pz) : 0, hits,
        kx: real ? real.st.px : v.st.px, ky: real ? real.st.py + 1.4 : v.st.py, kz: real ? real.st.pz : v.st.pz, killerHealth: real ? Math.ceil(real.health) : 0,
      });
    }
    this.pushStats();
  }

  private checkThresholds(team: number): void {
    const s = this.scores[team], lim = this.cfg.scoreLimit;
    const other = this.scores[1 - team];
    if (s === other + 1 && s > 1) this.announce('lead', team);
    if (s === Math.floor(lim * 0.5)) this.announce('half', team);
    if (s === lim - Math.min(10, Math.max(2, Math.floor(lim * 0.13)))) this.announce('near', team);
  }

  private heatAdd(team: number, x: number, z: number, v: number): void {
    const cx = clamp(Math.floor((x - this.map.bounds.minX) / 8), 0, this.heatNx - 1), cz = clamp(Math.floor((z - this.map.bounds.minZ) / 8), 0, this.heatNz - 1);
    this.heat[team][cz * this.heatNx + cx] += v;
  }
  heatAt(team: number, x: number, z: number): number {
    const cx = clamp(Math.floor((x - this.map.bounds.minX) / 8), 0, this.heatNx - 1), cz = clamp(Math.floor((z - this.map.bounds.minZ) / 8), 0, this.heatNz - 1);
    return this.heat[team][cz * this.heatNx + cx];
  }

  // ------------------------------------------------------------------ spawning
  private spawn(p: SPlayer, initial: boolean): void {
    let idx: number;
    let reason: string;
    if (initial) {
      const group = p.team === 0 ? 0 : 3;
      const pts = this.map.spawns.map((s, i) => ({ s, i })).filter((o) => o.s.group === group);
      const taken = this.players.filter((q) => q.team === p.team && q.alive).length;
      idx = pts[taken % pts.length].i;
      reason = `initial g${group}#${idx}`;
    } else {
      const ctx: SpawnContext = {
        team: p.team,
        enemies: this.players.filter((q) => q.alive && q.team !== p.team).map((q) => ({ x: q.st.px, y: q.st.py, z: q.st.pz })),
        mates: this.players.filter((q) => q.alive && q.team === p.team && q !== p).map((q) => ({ x: q.st.px, y: q.st.py, z: q.st.pz })),
        deaths: this.recentDeaths.filter((d) => d.team === p.team).map((d) => ({ x: d.x, z: d.z, age: (this.tickN - d.tick) / TICK_RATE })),
        dangers: this.dangerCircles(p.team),
        visible: (ax, ay, az, bx, by, bz) => this.world.visible(ax, ay, az, bx, by, bz),
        jitter: () => this.rng.next(),
      };
      const c = chooseSpawn(this.map.spawns, ctx);
      idx = c.index;
      reason = c.reason;
    }
    const sp = this.map.spawns[idx];
    p.loadoutIdx = p.nextLoadout;
    p.lo = resolveLoadout(p.loadouts[p.loadoutIdx]);
    const banked = { l: p.st.lethal, lr: p.st.lethalRe, t: p.st.tactical, tr: p.st.tacticalRe };
    p.st = newPlayerState(sp.x, sp.y + 0.03, sp.z, sp.yaw, p.lo);
    if (p.hadSpawn) { p.st.lethal = banked.l; p.st.lethalRe = banked.lr; p.st.tactical = banked.t; p.st.tacticalRe = banked.tr; if (banked.l < 1 && banked.lr < p.lo.lethal.recharge * 0.5) p.st.lethalRe = p.lo.lethal.recharge * 0.5; if (banked.t < 1 && banked.tr < p.lo.tactical.recharge * 0.5) p.st.tacticalRe = p.lo.tactical.recharge * 0.5; }
    p.hadSpawn = true;
    p.alive = true;
    p.health = COMBAT.maxHealth;
    p.protT = COMBAT.spawnProtect;
    p.dmgLog = [];
    p.flashT = 0;
    p.lastDmgTick = -9999;
    p.queue.length = 0;
    this.spawnAudit.push(`t${this.tickN} p${p.id} ${reason}`);
    if (this.spawnAudit.length > 200) this.spawnAudit.shift();
    p.brain?.onSpawn();
    this.broadcast({ e: 'spawn', id: p.id, yaw: sp.yaw, reason: p.isBot ? undefined : reason });
  }

  private dangerCircles(team: number): { x: number; z: number; r: number }[] {
    const out: { x: number; z: number; r: number }[] = [];
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e.type === ENT.FRAG || e.type === ENT.STICKY) out.push({ x: e.x, z: e.z, r: 7 });
      else if (e.team !== team && e.type === ENT.MORTAR) out.push({ x: e.x, z: e.z, r: ST.mortarRadius + 2 });
      else if (e.team !== team && e.type === ENT.MINE) out.push({ x: e.x, z: e.z, r: 5 });
      else if (e.team !== team && e.type === ENT.FLIGHT) {
        for (let d = 0; d <= ST.flightLength; d += 8) out.push({ x: e.x + Math.sin(e.yaw) * d, z: e.z + Math.cos(e.yaw) * d, r: ST.flightWidth });
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ equipment + devices
  private addEntity(type: number, team: 0 | 1, owner: number, x: number, y: number, z: number, src: string): Entity {
    const e: Entity = { id: this.nextEnt++, type, team, owner, x, y, z, vx: 0, vy: 0, vz: 0, age: 0, fuse: 0, hp: 0, yaw: 0, stuck: false, phase: 0, timer: 0, dead: false, src };
    if (this.nextEnt > 60000) this.nextEnt = 1;
    this.entities.push(e);
    return e;
  }

  private spawnThrown(p: SPlayer, ev: Extract<SimEvent, { t: 'throw' }>): void {
    const def = ev.kind === 'lethal' ? p.lo.lethal : p.lo.tactical;
    const type = { frag: ENT.FRAG, sticky: ENT.STICKY, mine: ENT.MINE, flash: ENT.FLASH, smoke: ENT.SMOKE_CAN, dart: ENT.DART }[def.id] ?? ENT.FRAG;
    if (type === ENT.MINE) {
      // one active mine per player
      for (const e of this.entities) if (e.type === ENT.MINE && e.owner === p.id) e.dead = true;
    }
    // if the hand is inside geometry (hugging a wall) start from the eye instead
    let ox = ev.ox, oy = ev.oy, oz = ev.oz;
    const ex = p.st.px, ey = p.st.py + eyeHeight(p.st.crouchT), ez = p.st.pz;
    if (!this.world.clearLine(ex, ey, ez, ox, oy, oz)) { ox = ex; oy = ey; oz = ez; }
    const e = this.addEntity(type, p.team, p.id, ox, oy, oz, def.id);
    e.vx = ev.vx; e.vy = ev.vy; e.vz = ev.vz;
    e.fuse = ev.fuse;
    e.yaw = p.st.yaw;
    e.hp = type === ENT.MINE ? ST.mineHp : 0;
    this.broadcast({ e: 'throw', p: p.id, kind: def.id });
  }

  private stepEntities(): void {
    const ents = this.entities;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead) continue;
      e.age += DT;
      switch (e.type) {
        case ENT.FRAG:
          this.fly(e, 14, false);
          e.fuse -= DT;
          if (e.fuse <= 0) { e.dead = true; this.explode(e.x, e.y, e.z, EQUIP_BY_ID.frag.radius, EQUIP_BY_ID.frag.damage, e.owner, 'frag', { equip: true }); }
          break;
        case ENT.STICKY:
          this.fly(e, 14, true);
          if (e.stuck) e.fuse -= DT;
          if (e.fuse <= 0 || e.age > 5) { e.dead = true; this.explode(e.x, e.y, e.z, EQUIP_BY_ID.sticky.radius, EQUIP_BY_ID.sticky.damage, e.owner, 'sticky', { equip: true }); }
          break;
        case ENT.FLASH:
          this.fly(e, 14, false);
          e.fuse -= DT;
          if (e.fuse <= 0) { e.dead = true; this.flashBurst(e); }
          break;
        case ENT.SMOKE_CAN:
          this.fly(e, 14, false);
          e.fuse -= DT;
          if (e.fuse <= 0) {
            e.dead = true;
            const s = this.addEntity(ENT.SMOKE, e.team, e.owner, e.x, e.y + 0.6, e.z, 'smoke');
            s.fuse = ST.smokeLife;
            this.broadcast({ e: 'explode', kind: 'smoke', x: e.x, y: e.y, z: e.z, r: EQUIP_BY_ID.smoke.radius });
          }
          break;
        case ENT.SMOKE:
          e.fuse -= DT;
          if (e.fuse <= 0) e.dead = true;
          break;
        case ENT.DART:
          this.fly(e, 5, true);
          if (e.stuck) {
            e.fuse += DT;
            e.timer -= DT;
            if (e.timer <= 0) {
              e.timer = ST.dartPulse;
              e.phase++;
              for (const q of this.players) {
                if (q.team === e.team || !q.alive) continue;
                if (Math.hypot(q.st.px - e.x, q.st.py - e.y, q.st.pz - e.z) > EQUIP_BY_ID.dart.radius) continue;
                if (Math.hypot(q.st.vx, q.st.vz) < 1) continue;
                q.revealUntil = Math.max(q.revealUntil, this.tickN + Math.round(ST.dartReveal * q.lo.perks.revealMul * TICK_RATE));
                const owner = this.players[e.owner];
                if (e.phase <= 1 && owner) owner.equipHits++;
                this.intel[e.team].push({ x: q.st.px, y: q.st.py, z: q.st.pz, tick: this.tickN });
              }
            }
            if (e.fuse > ST.dartLife) e.dead = true;
          } else if (e.age > 4) e.dead = true;
          break;
        case ENT.MINE:
          this.fly(e, 14, true);
          if (e.stuck) {
            e.timer += DT;
            if (e.timer > 1.0) {
              const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
              for (const q of this.players) {
                if (q.team === e.team || !q.alive || q.protT > 0) continue;
                const dx = q.st.px - e.x, dz = q.st.pz - e.z, dy = q.st.py + 0.9 - e.y;
                const d = Math.hypot(dx, dz);
                if (d > ST.mineRange || Math.abs(dy) > 2 || d < 0.01) continue;
                if ((dx * fx + dz * fz) / d < 0.8) continue;
                if (!this.world.clearLine(e.x, e.y + 0.2, e.z, q.st.px, q.st.py + 0.9, q.st.pz)) continue;
                e.dead = true;
                this.explode(e.x + fx * 1.2, e.y + 0.3, e.z + fz * 1.2, EQUIP_BY_ID.mine.radius, EQUIP_BY_ID.mine.damage, e.owner, 'mine', { equip: true });
                break;
              }
            }
            if (e.age > 120) e.dead = true;
          } else if (e.age > 4) e.dead = true;
          break;
        case ENT.POD: {
          if (e.age > ST.podLife) { e.dead = true; break; }
          for (const q of this.players) {
            if (q.team !== e.team || !q.alive) continue;
            if (this.tickN - q.podTick < ST.podCooldown * TICK_RATE) continue;
            if (Math.hypot(q.st.px - e.x, q.st.pz - e.z) > ST.podRadius || Math.abs(q.st.py - e.y) > 2) continue;
            const s = q.st, w0 = q.lo.weapons[0], w1 = q.lo.weapons[1];
            if (s.res0 >= w0.reserve && s.res1 >= w1.reserve && s.lethal >= 1 && s.tactical >= 1) continue;
            s.res0 = w0.reserve; s.res1 = w1.reserve; s.lethal = 1; s.tactical = 1;
            q.podTick = this.tickN;
            if (!q.isBot) q.events.push({ e: 'pickup', kind: 'pod' });
          }
          break;
        }
        case ENT.DRONE: {
          const owner = this.players[e.owner];
          if (e.age > ST.droneLife) { e.dead = true; this.broadcast({ e: 'support', kind: 'drone', team: e.team, owner: e.owner, phase: 'end', x: e.x, y: e.y, z: e.z }); break; }
          if (owner && owner.alive) {
            // trail the owner; stay below any roof
            const ceil = this.world.raycast(owner.st.px, owner.st.py + 1.9, owner.st.pz, 0, 1, 0, ST.droneHeight, 'bullet');
            const ty = owner.st.py + 1.9 + (ceil ? Math.max(0.4, ceil.t - 0.7) : ST.droneHeight - 1.9);
            const k = 1 - Math.exp(-2.2 * DT);
            e.x += (owner.st.px - e.x) * k; e.z += (owner.st.pz - e.z) * k; e.y += (ty - e.y) * k;
          }
          e.yaw += DT * 1.2;
          e.timer -= DT;
          if (e.timer <= 0) {
            e.timer = 0.4;
            for (const q of this.players) {
              if (q.team === e.team || !q.alive) continue;
              const cy = q.st.py + chestHeight(q.st.crouchT);
              if (Math.hypot(q.st.px - e.x, cy - e.y, q.st.pz - e.z) > ST.droneRange) continue;
              if (!this.world.visible(e.x, e.y, e.z, q.st.px, cy, q.st.pz) || this.smokeBlocks(e.x, e.y, e.z, q.st.px, cy, q.st.pz)) continue;
              const until = this.tickN + Math.round(1.3 * q.lo.perks.revealMul * TICK_RATE);
              q.markedUntil = Math.max(q.markedUntil, until);
              q.revealUntil = Math.max(q.revealUntil, until);
              this.intel[e.team].push({ x: q.st.px, y: q.st.py, z: q.st.pz, tick: this.tickN });
            }
          }
          break;
        }
        case ENT.SATCHEL:
          if (e.age > ST.satchelLife) { e.dead = true; break; }
          for (const q of this.players) {
            if (q.team !== e.team || !q.alive || !q.lo.perks.scavenger) continue;
            if (Math.hypot(q.st.px - e.x, q.st.pz - e.z) > 1.5 || Math.abs(q.st.py - e.y) > 1.8) continue;
            const s = q.st, w0 = q.lo.weapons[0], w1 = q.lo.weapons[1];
            s.res0 = Math.min(w0.reserve, s.res0 + w0.mag); s.res1 = Math.min(w1.reserve, s.res1 + w1.mag);
            e.dead = true;
            if (!q.isBot) q.events.push({ e: 'pickup', kind: 'satchel' });
            break;
          }
          break;
        case ENT.MORTAR:
          if (e.phase === 0 && e.age >= ST.mortarDelay) { e.phase = 1; this.mortarShell(e, 0); }
          else if (e.phase === 1 && e.age >= ST.mortarDelay + ST.mortarGap) { e.phase = 2; this.mortarShell(e, 1); }
          else if (e.phase === 2 && e.age >= ST.mortarDelay + ST.mortarGap + 0.6) e.dead = true;
          break;
        case ENT.FLIGHT:
          this.stepFlight(e);
          break;
      }
    }
    if (ents.some((e) => e.dead)) this.entities = ents.filter((e) => !e.dead);
  }

  /** Fixed-step projectile with continuous collision (ray along the motion segment). */
  private fly(e: Entity, gravity: number, stick: boolean): void {
    if (e.stuck) return;
    e.vy -= gravity * DT;
    const sp = Math.hypot(e.vx, e.vy, e.vz);
    if (sp < 1e-4) return;
    const len = sp * DT;
    const dx = e.vx / sp, dy = e.vy / sp, dz = e.vz / sp;
    const h = this.world.raycast(e.x, e.y, e.z, dx, dy, dz, len + 0.06, 'bullet');
    if (!h) { e.x += dx * len; e.y += dy * len; e.z += dz * len; return; }
    const adv = Math.max(0, h.t - 0.06);
    e.x += dx * adv; e.y += dy * adv; e.z += dz * adv;
    if (h.solid >= 0 && this.map.solids[h.solid].glass !== undefined && sp > 6) { this.breakGlass(this.map.solids[h.solid].glass!); return; }
    if (stick) {
      e.stuck = true;
      e.vx = e.vy = e.vz = 0;
      if (e.type === ENT.MINE && Math.abs(h.ny) < 0.5) { e.yaw = Math.atan2(h.nx, h.nz); }
      return;
    }
    const vn = e.vx * h.nx + e.vy * h.ny + e.vz * h.nz;
    let tx = e.vx - vn * h.nx, ty = e.vy - vn * h.ny, tz = e.vz - vn * h.nz;
    tx *= 0.72; ty *= 0.72; tz *= 0.72;
    e.vx = tx - vn * h.nx * 0.36; e.vy = ty - vn * h.ny * 0.36; e.vz = tz - vn * h.nz * 0.36;
    if (h.ny > 0.7 && Math.hypot(e.vx, e.vy, e.vz) < 1.4) { e.stuck = true; e.vx = e.vy = e.vz = 0; }
  }

  smokeBlocks(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    for (const e of this.entities) {
      if (e.type !== ENT.SMOKE || e.dead || e.age < 0.6) continue;
      if (segPointDist(ax, ay, az, bx, by, bz, e.x, e.y, e.z) < EQUIP_BY_ID.smoke.radius * 0.86) return true;
    }
    return false;
  }

  explode(x: number, y: number, z: number, radius: number, maxDmg: number, ownerId: number, src: string, opts: { equip?: boolean; support?: boolean }): void {
    this.broadcast({ e: 'explode', kind: src, x, y, z, r: radius });
    this.noises.push({ x, y, z, r: 70, team: -1, id: -1, tick: this.tickN });
    const owner = this.players[ownerId] ?? null;
    const by = y + 0.35;
    for (const q of this.players) {
      if (!q.alive) continue;
      const cy = q.st.py + chestHeight(q.st.crouchT);
      const d = Math.hypot(q.st.px - x, cy - by, q.st.pz - z);
      if (d >= radius) continue;
      const los = this.world.clearLine(x, by, z, q.st.px, cy, q.st.pz) || this.world.clearLine(x, by, z, q.st.px, q.st.py + headHeight(q.st.crouchT), q.st.pz) || this.world.clearLine(x, by + 0.6, z, q.st.px, q.st.py + 0.4, q.st.pz);
      if (!los) continue;
      const dmg = Math.max(12, maxDmg * (1 - Math.pow(d / radius, 1.25)));
      this.applyDamage(q, owner, dmg, src, ZONE_UPPER, x, by, z, { ...opts, dist: owner ? Math.hypot(owner.st.px - x, owner.st.pz - z) : 0 });
    }
    for (const e of this.entities) {
      if (e.dead || e.hp <= 0 || (owner && e.team === owner.team)) continue;
      if (Math.hypot(e.x - x, e.y - y, e.z - z) < radius) this.damageDevice(e, maxDmg, owner);
    }
    for (let g = 0; g < this.glassCenters.length; g++) {
      const c = this.glassCenters[g];
      if (c && Math.hypot(c.x - x, c.y - y, c.z - z) < radius * 0.8) this.breakGlass(g);
    }
  }

  private flashBurst(e: Entity): void {
    this.broadcast({ e: 'explode', kind: 'flash', x: e.x, y: e.y, z: e.z, r: 4 });
    this.noises.push({ x: e.x, y: e.y, z: e.z, r: 40, team: -1, id: -1, tick: this.tickN });
    const owner = this.players[e.owner];
    const R = EQUIP_BY_ID.flash.radius;
    for (const q of this.players) {
      if (!q.alive) continue;
      if (q.team === e.team && q.id !== e.owner) continue;
      const ey = q.st.py + eyeHeight(q.st.crouchT);
      const dx = e.x - q.st.px, dy = e.y - ey, dz = e.z - q.st.pz;
      const d = Math.hypot(dx, dy, dz);
      if (d > R || !this.world.visible(e.x, e.y + 0.1, e.z, q.st.px, ey, q.st.pz)) continue;
      viewDir(q.st.yaw, q.st.pitch, this.dir);
      const facing = d < 0.5 ? 1 : (dx * this.dir.x + dy * this.dir.y + dz * this.dir.z) / d;
      const f = clamp((facing + 0.35) / 1.35, 0.12, 1);
      const dur = 3.8 * f * (1 - (d / (R + 2)) * 0.75) * (q.id === e.owner ? 0.6 : 1);
      if (dur > q.flashT) q.flashT = dur;
      if (owner && q.team !== e.team && dur > 0.9) owner.equipHits++;
    }
  }

  private damageDevice(e: Entity, dmg: number, by: SPlayer | null): void {
    if (e.dead || e.hp <= 0) return;
    e.hp -= dmg;
    if (by && !by.isBot) by.events.push({ e: 'hit', victim: -1, zone: 2, dmg, kill: e.hp <= 0, x: e.x, y: e.y, z: e.z, device: true });
    if (e.hp > 0) return;
    e.dead = true;
    this.broadcast({ e: 'explode', kind: 'device', x: e.x, y: e.y, z: e.z, r: 1.5 });
    if (e.type === ENT.DRONE) this.broadcast({ e: 'support', kind: 'drone', team: e.team, owner: e.owner, phase: 'end', x: e.x, y: e.y, z: e.z });
    if (by && by.team !== e.team) {
      by.devices++;
      this.award(by, 'Device Down', SCORE.device);
      this.addMomentum(by, MOMENTUM.device);
    }
  }

  breakGlass(id: number): void {
    if (!this.world.breakGlass(id)) return;
    const c = this.glassCenters[id];
    this.broadcast({ e: 'glass', id, x: c.x, y: c.y, z: c.z });
    this.noises.push({ x: c.x, y: c.y, z: c.z, r: 25, team: -1, id: -1, tick: this.tickN });
  }

  // ------------------------------------------------------------------ Momentum support actions
  private trySupport(p: SPlayer, tier: number): void {
    if (!p.alive || tier < 0 || tier > 2 || !(p.supports & (1 << tier))) return;
    const def = SUPPORT_BY_ID[p.lo.supports[tier]];
    if (!def) return;
    const deny = (text: string) => { if (!p.isBot) p.events.push({ e: 'announce', key: 'supportDenied', text }); };
    const ex = p.st.px, ey = p.st.py + eyeHeight(p.st.crouchT), ez = p.st.pz;
    viewDir(p.st.yaw, p.st.pitch, this.dir);
    const d = this.dir;
    if (def.tier === 2 && this.tier8Active(p.team)) return deny('Another tier-8 action is already active for your team');
    switch (def.id) {
      case 'recon':
        this.recon[p.team] = { left: ST.reconPulses, next: this.tickN + 20 };
        break;
      case 'pod': {
        let x = ex + Math.sin(p.st.yaw) * 1.3, z = ez + Math.cos(p.st.yaw) * 1.3;
        if (!this.world.clearLine(ex, ey - 0.5, ez, x, ey - 0.5, z)) { x = ex; z = ez; }
        const g = this.world.raycast(x, ey - 0.4, z, 0, -1, 0, 6, 'bullet');
        const e = this.addEntity(ENT.POD, p.team, p.id, x, g ? ey - 0.4 - g.t : p.st.py, z, 'pod');
        e.hp = ST.podHp;
        break;
      }
      case 'drone': {
        const e = this.addEntity(ENT.DRONE, p.team, p.id, ex, ey + 0.6, ez, 'drone');
        e.hp = ST.droneHp;
        break;
      }
      case 'mortar': {
        const h = this.world.raycast(ex, ey, ez, d.x, d.y, d.z, 95, 'bullet');
        if (!h) return deny('No target surface in range');
        const tx = ex + d.x * h.t + h.nx * 0.3, ty = ey + d.y * h.t + h.ny * 0.3, tz = ez + d.z * h.t + h.nz * 0.3;
        const g = this.world.raycast(tx, ty, tz, 0, -1, 0, 12, 'bullet');
        const gy = g ? ty - g.t : ty;
        if (!this.world.skyOpen(tx, gy, tz)) return deny('Mortar Mark needs open sky above the target');
        const e = this.addEntity(ENT.MORTAR, p.team, p.id, tx, gy, tz, 'mortar');
        e.fuse = ST.mortarDelay;
        break;
      }
      case 'flight': {
        const h = this.world.raycast(ex, ey, ez, d.x, d.y, d.z, 60, 'bullet');
        const dist = h ? h.t : 14;
        const cx = ex + d.x * dist, cz = ez + d.z * dist;
        const fx = Math.sin(p.st.yaw), fz = Math.cos(p.st.yaw);
        const back = Math.min(10, dist);
        const e = this.addEntity(ENT.FLIGHT, p.team, p.id, cx - fx * back, 0, cz - fz * back, 'flight');
        e.yaw = p.st.yaw;
        e.hits = new Map();
        break;
      }
      case 'uplink':
        this.uplinkUntil[p.team] = this.tickN + ST.uplinkTime * TICK_RATE;
        break;
    }
    p.supports &= ~(1 << tier);
    p.supportsUsed++;
    this.award(p, def.name, 25);
    const last = this.entities[this.entities.length - 1];
    const targeted = def.id === 'mortar' || def.id === 'flight';
    this.broadcast({ e: 'support', kind: def.id, team: p.team, owner: p.id, phase: targeted ? 'warn' : 'start', x: targeted ? last.x : ex, y: targeted ? last.y : ey, z: targeted ? last.z : ez, yaw: p.st.yaw });
  }

  tier8Active(team: number): boolean {
    if (this.uplinkUntil[team] > this.tickN) return true;
    return this.entities.some((e) => !e.dead && e.type === ENT.FLIGHT && e.team === team);
  }

  private stepSupport(): void {
    for (const team of [0, 1] as const) {
      const r = this.recon[team];
      if (r.left > 0 && this.tickN >= r.next) {
        r.left--;
        r.next = this.tickN + Math.round(ST.reconInterval * TICK_RATE);
        for (const q of this.players) {
          if (q.team === team || !q.alive) continue;
          q.revealUntil = Math.max(q.revealUntil, this.tickN + Math.round(ST.reconReveal * q.lo.perks.revealMul * TICK_RATE));
          this.intel[team].push({ x: q.st.px, y: q.st.py, z: q.st.pz, tick: this.tickN });
        }
        this.broadcast({ e: 'support', kind: 'recon', team, owner: -1, phase: 'impact' });
      }
      if (this.uplinkUntil[team] && this.uplinkUntil[team] <= this.tickN) {
        this.uplinkUntil[team] = 0;
        this.broadcast({ e: 'support', kind: 'uplink', team, owner: -1, phase: 'end' });
      }
    }
  }

  private mortarShell(e: Entity, n: number): void {
    const ox = n === 0 ? 0 : this.rng.range(-2.2, 2.2), oz = n === 0 ? 0 : this.rng.range(-2.2, 2.2);
    let x = e.x + ox, z = e.z + oz;
    if (!this.world.skyOpen(x, e.y, z)) { x = e.x; z = e.z; }
    this.broadcast({ e: 'support', kind: 'mortar', team: e.team, owner: e.owner, phase: 'impact', x, y: e.y, z });
    this.explode(x, e.y + 0.2, z, ST.mortarRadius, ST.mortarDamage, e.owner, 'mortar', { support: true });
  }

  private stepFlight(e: Entity): void {
    const t = e.age - ST.flightDelay;
    if (t < 0) return;
    if (e.phase === 0) { e.phase = 1; this.broadcast({ e: 'support', kind: 'flight', team: e.team, owner: e.owner, phase: 'impact', x: e.x, y: e.y, z: e.z, yaw: e.yaw }); }
    if (t > ST.flightDuration + 0.4) { e.dead = true; this.broadcast({ e: 'support', kind: 'flight', team: e.team, owner: e.owner, phase: 'end' }); return; }
    const front = (Math.min(t, ST.flightDuration) / ST.flightDuration) * ST.flightLength;
    const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
    const owner = this.players[e.owner] ?? null;
    for (const q of this.players) {
      if (!q.alive || q.team === e.team) continue; // friendly-safe
      const rx = q.st.px - e.x, rz = q.st.pz - e.z;
      const along = rx * fx + rz * fz, lat = Math.abs(rx * fz - rz * fx);
      if (lat > ST.flightWidth / 2 || along < front - 9 || along > front + 1) continue;
      const hits = e.hits!.get(q.id) ?? 0;
      if (hits >= 2) continue;
      const lastKey = -1 - q.id;
      const lastT = e.hits!.get(lastKey) ?? -9;
      if (t - lastT < 0.22) continue;
      if (!this.world.skyOpen(q.st.px, q.st.py + 1.6, q.st.pz)) continue; // indoor counterplay
      e.hits!.set(q.id, hits + 1);
      e.hits!.set(lastKey, t);
      this.applyDamage(q, owner, ST.flightDamage, 'flight', ZONE_UPPER, q.st.px - fx * 20, q.st.py + 25, q.st.pz - fz * 20, { support: true });
    }
    for (const d of this.entities) {
      if (d.dead || d.hp <= 0 || d.team === e.team) continue;
      const rx = d.x - e.x, rz = d.z - e.z;
      const along = rx * fx + rz * fz, lat = Math.abs(rx * fz - rz * fx);
      if (lat < ST.flightWidth / 2 && along > front - 6 && along < front && this.world.skyOpen(d.x, d.y + 0.5, d.z)) this.damageDevice(d, 200, owner);
    }
  }

  private doPing(p: SPlayer): void {
    const ex = p.st.px, ey = p.st.py + eyeHeight(p.st.crouchT), ez = p.st.pz;
    viewDir(p.st.yaw, p.st.pitch, this.dir);
    const h = this.world.raycast(ex, ey, ez, this.dir.x, this.dir.y, this.dir.z, 120, 'bullet');
    const t = h ? h.t : 40;
    const x = ex + this.dir.x * t, y = ey + this.dir.y * t, z = ez + this.dir.z * t;
    const msg: GameEvent = { e: 'ping', p: p.id, x, y, z };
    for (const q of this.players) if (!q.isBot && q.team === p.team) q.events.push(msg);
    this.intel[p.team].push({ x, y: y - 1, z, tick: this.tickN }); // teammate pings feed bot perception
  }

  // ------------------------------------------------------------------ match end + results
  private endMatch(winner: -1 | 0 | 1): void {
    if (this.phase === PHASE_POST) return;
    this.phase = PHASE_POST;
    this.phaseT = MATCH.postMatch;
    const duration = this.liveTicks / TICK_RATE;
    this.broadcast({ e: 'phase', phase: PHASE_POST, winner });
    this.announce(winner < 0 ? 'draw' : 'win', winner < 0 ? undefined : winner);
    for (const p of this.players) {
      if (p.isBot) continue;
      const xp: { label: string; amount: number }[] = [{ label: 'Match score', amount: p.score }];
      if (winner === p.team) xp.push({ label: 'Victory', amount: SCORE.win });
      xp.push({ label: 'Match completion', amount: SCORE.completion });
      xp.push({ label: 'Time played', amount: Math.round((duration / 60) * SCORE.perMinute) });
      let districts = 0;
      for (let i = 0; i < 5; i++) if (p.districts & (1 << i)) districts++;
      const base: Omit<MatchResult, 'sig'> = {
        matchId: `${this.matchSerial}-p${p.id}`,
        winner, scores: [this.scores[0], this.scores[1]], duration, suddenDeath: this.wentSudden, mapId: this.map.id,
        players: this.players.map((q) => ({ id: q.id, name: q.name, team: q.team, bot: q.isBot, kills: q.kills, deaths: q.deaths, assists: q.assists, score: q.score, bestStreak: q.bestStreak, devices: q.devices, supportsUsed: q.supportsUsed })),
        you: {
          id: p.id, team: p.team,
          weapons: [...p.tally.entries()].map(([weapon, t]) => ({ weapon, ...t })),
          bestStreak: p.bestStreak, adsKills: p.adsKills, equipmentHits: p.equipHits, devicesDestroyed: p.devices, districtsVisited: districts, assists: p.assists,
          xp, xpTotal: xp.reduce((a, b) => a + b.amount, 0),
        },
      };
      const result: MatchResult = { ...base, sig: resultChecksum(base) };
      this.result = result;
      this.send(p.client, { m: 'result', result });
    }
    if (!this.result) {
      const base: Omit<MatchResult, 'sig'> = {
        matchId: `${this.matchSerial}-bots`, winner, scores: [this.scores[0], this.scores[1]], duration, suddenDeath: this.wentSudden, mapId: this.map.id,
        players: this.players.map((q) => ({ id: q.id, name: q.name, team: q.team, bot: q.isBot, kills: q.kills, deaths: q.deaths, assists: q.assists, score: q.score, bestStreak: q.bestStreak, devices: q.devices, supportsUsed: q.supportsUsed })),
        you: { id: -1, team: 0, weapons: [], bestStreak: 0, adsKills: 0, equipmentHits: 0, devicesDestroyed: 0, districtsVisited: 0, assists: 0, xp: [], xpTotal: 0 },
      };
      this.result = { ...base, sig: resultChecksum(base) };
    }
  }

  // ------------------------------------------------------------------ outbound
  private broadcast(ev: GameEvent): void { this.broadcastEv.push(ev); }
  private announce(key: string, team?: number): void { this.broadcast({ e: 'announce', key, team }); }

  private pushStats(): void {
    const rows: number[] = [];
    for (const p of this.players) rows.push(p.id, p.kills, p.deaths, p.assists, p.score);
    this.broadcast({ e: 'stats', rows });
  }

  private flushEvents(): void {
    const all = this.broadcastEv;
    for (const p of this.players) {
      if (p.isBot) continue;
      if (all.length === 0 && p.events.length === 0) continue;
      const list = all.length ? all.concat(p.events) : p.events.slice();
      p.events.length = 0;
      this.send(p.client, { m: 'events', list });
    }
    all.length = 0;
  }

  private sendSnapshots(): void {
    const ents: SnapEntity[] = [];
    for (const e of this.entities) {
      if (e.dead || ents.length >= 200) continue;
      let a = Math.round(((((e.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * 255);
      let b = 0;
      if (e.type === ENT.SMOKE) b = Math.round(clamp(e.fuse / ST.smokeLife, 0, 1) * 255);
      else if (e.type === ENT.MORTAR) b = Math.round(clamp(e.age / ST.mortarDelay, 0, 1) * 255);
      else if (e.type === ENT.FLIGHT) b = Math.round(clamp(e.age / ST.flightDelay, 0, 1) * 255);
      else if (e.type === ENT.DRONE) b = Math.round(clamp(1 - e.age / ST.droneLife, 0, 1) * 255);
      else if (e.type === ENT.POD) b = Math.round(clamp(1 - e.age / ST.podLife, 0, 1) * 255);
      else if (e.type === ENT.MINE) b = e.stuck && e.timer > 1 ? 1 : 0;
      else if (e.type === ENT.DART) { b = e.stuck ? 1 : 0; a = e.phase & 255; }
      ents.push({ id: e.id, type: e.type, team: e.team, owner: e.owner, x: e.x, y: e.y, z: e.z, a, b });
    }
    for (const me of this.players) {
      if (me.isBot) continue;
      const players: SnapPlayer[] = [];
      for (const q of this.players) {
        if (q === me) continue;
        const s = q.st;
        let flags = 0;
        if (q.alive) flags |= PF.ALIVE;
        if (s.crouch) flags |= PF.CROUCH;
        if (s.sprint) flags |= PF.SPRINT;
        if (s.adsT > 0.5) flags |= PF.ADS;
        if (s.reloadT >= 0) flags |= PF.RELOAD;
        if (q.protT > 0) flags |= PF.PROTECTED;
        if (q.team !== me.team) {
          if (q.revealUntil > this.tickN) flags |= PF.REVEALED;
          if (q.markedUntil > this.tickN) flags |= PF.MARKED;
        }
        players.push({ id: q.id, flags, x: s.px, y: s.py, z: s.pz, yaw: s.yaw, pitch: s.pitch, weapon: q.lo.weapons[s.slot].def.idx, health: q.team === me.team ? q.health : 0 });
      }
      const snap: Snapshot = {
        tick: this.tickN, ack: me.ackSeq, phase: this.phase, timeLeft: Math.max(0, this.phaseT), score0: this.scores[0], score1: this.scores[1], glass: this.world.glassMask,
        self: {
          alive: me.alive, state: me.st, health: me.health, momentum: me.momentum, supports: me.supports, flash: me.flashT, protect: me.protT > 0,
          respawnIn: me.alive ? 0 : Math.max(0, me.respawnT), revealed: me.revealUntil > this.tickN, uplink: this.uplinkUntil[me.team] > this.tickN,
          tier8Busy: this.tier8Active(me.team), loadout: me.loadoutIdx, streak: me.streak,
        },
        players, entities: ents,
      };
      const buf = encodeSnapshot(snap);
      this.send(me.client, { m: 'snap', data: buf }, [buf]);
    }
  }

  /** p95 of recent tick durations in milliseconds (tick-budget benchmark). */
  tickP95(): number {
    if (!this.tickMs.length) return 0;
    const s = this.tickMs.slice().sort((a, b) => a - b);
    return s[Math.floor(s.length * 0.95)];
  }
}
