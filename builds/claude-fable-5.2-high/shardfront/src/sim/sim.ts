// simulation-core: deterministic fixed-tick simulation. No DOM, no rendering, no wall-clock time.
// Hot per-entity state lives in structure-of-arrays typed buffers indexed by integer entity id.
import { ABILITY_BY_ID, DEF_INDEX, ENTITY_DEFS, FACTIONS, TECH_DEFS, TECH_INDEX } from '../data/defs';
import type { EntityDef, WeaponFx } from '../data/types';
import { F_BUILD, F_WALK, MAP_SIZE, VIS_CELL, VIS_SIZE, getMap, type GameMap } from '../world/map';
import { Pathfinder } from '../nav/pathfinder';
import type { Command, MatchConfig } from '../net/protocol';
import { integrateMovement, updateUnits } from './units';
import { updateCombatSystems } from './combat';
import { updateBookkeeping, updateProduction, updateVision, updateWorldObjects } from './systems';

export const TICK_RATE = 20;
export const DT = 1 / TICK_RATE;
export const MAX_ENT = 4096;
export const NEUTRAL = 2;
export const SUPPLY_MAX = 120;
export const ENDGAME_TICK = 18 * 60 * TICK_RATE;
export const PULSE_PERIOD = 90 * TICK_RATE;
/** safety net against true stalemates: at 35:00 the side with the greater surviving force value wins */
export const DECISION_TICK = 35 * 60 * TICK_RATE;
export const MAX_QUEUE = 5;

export const FL_CONSTRUCTING = 1;
export const FL_BRACED = 2;
export const FL_CURLED = 4;
export const FL_HOLD = 8;
export const FL_GHOST = 16;
export const FL_ANCHOR = 32;
export const FL_WORKING = 64;

export const OT_MOVE = 1;
export const OT_AMOVE = 2;
export const OT_ATTACK = 3;
export const OT_GATHER = 4;
export const OT_BUILD = 5;
export const OT_CONSTRUCT = 6;
export const OT_PATROL = 7;
export const OT_FOLLOW = 8;
export const OT_ABILITY = 9;

export interface Order { t: number; x: number; z: number; target: number; def: number; paid: boolean; x2: number; z2: number; ab: string }
export interface QueueItem { kind: 'unit' | 'tech'; def: number; progress: number; total: number; started: boolean }
export interface Ghost { id: number; def: number; owner: number; x: number; z: number; tick: number; hpFrac: number }
export interface Projectile { hitTick: number; target: number; gx: number; gz: number; dmg: number; def: number; owner: number; from: number; sx: number; sz: number }
export interface AreaEffect { k: 'mend' | 'spike'; x: number; z: number; r: number; owner: number; until: number }

export type AlertKind = 'attack' | 'supply' | 'ore' | 'flux' | 'depleted' | 'blocked' | 'prereq' | 'invalid' | 'queue' | 'cooldown' | 'energy';

export type SimEvent =
  | { t: 'fire'; id: number; target: number; fx: WeaponFx; sx: number; sz: number; tx: number; tz: number; travel: number; ground: boolean; owner: number }
  | { t: 'impact'; x: number; z: number; fx: WeaponFx; splash: number; owner: number }
  | { t: 'hit'; id: number; shield: boolean }
  | { t: 'death'; id: number; def: number; owner: number; x: number; z: number; fx: number; fz: number; killer: number }
  | { t: 'placed'; id: number; owner: number; def: number }
  | { t: 'built'; id: number; owner: number; def: number }
  | { t: 'trained'; id: number; owner: number; def: number }
  | { t: 'research'; owner: number; tech: number }
  | { t: 'alert'; owner: number; kind: AlertKind; x: number; z: number }
  | { t: 'telegraph'; x: number; z: number; r: number; ticks: number; owner: number }
  | { t: 'ability'; id: number; ab: string; x: number; z: number; owner: number }
  | { t: 'beam'; from: number; to: number }
  | { t: 'deposit'; id: number; owner: number; kind: number; amount: number }
  | { t: 'captured'; id: number; owner: number }
  | { t: 'salvage'; owner: number; x: number; z: number }
  | { t: 'pulse' }
  | { t: 'gameover'; winner: number };

export interface StatSample { t: number; army: number; workers: number; income: number }
export interface PlayerStats {
  oreCollected: number; fluxCollected: number;
  unitsCreated: number; unitsLost: number; unitsKilled: number;
  structuresBuilt: number; structuresLost: number; structuresRazed: number;
  firstExpansionTick: number;
  commands: number; rejected: number;
  samples: StatSample[];
  timeline: { t: number; text: string }[];
}

export interface PlayerState {
  faction: 'helix' | 'chorus';
  ore: number; flux: number;
  supplyUsed: number; supplyCap: number;
  workers: number; armyValue: number; armySupply: number;
  atkLevel: number; armLevel: number;
  /** 0 = unknown, 1 = researching, 2 = complete */
  tech: Uint8Array;
  visible: Uint8Array;
  explored: Uint8Array;
  ghosts: Map<number, Ghost>;
  stats: PlayerStats;
  lastAttackAlert: number;
  lastSupplyAlert: number;
}

export interface Thinker { think(sim: Sim): void; label(): string }

export const PLACE_OK = 0;
export const PLACE_TERRAIN = 1;
export const PLACE_OCCUPIED = 2;
export const PLACE_ZONE = 3;
export const PLACE_VENT = 4;
export const PLACE_UNEXPLORED = 5;
export const PLACE_REASONS = ['', 'Cannot build on this terrain', 'Location is occupied', 'Must be inside your construction field', 'Must be placed on a Flux vent', 'Location has not been explored'];

const HCELL = 4;
const HS = MAP_SIZE / HCELL;

function newOrder(t: number, x: number, z: number, target = -1): Order {
  return { t, x, z, target, def: -1, paid: false, x2: 0, z2: 0, ab: '' };
}

export class Sim {
  readonly cfg: MatchConfig;
  readonly map: GameMap;
  readonly defs = ENTITY_DEFS;
  tick = 0;
  rng: number;
  winner = -1;
  revealUntil = -1;

  // ---- structure-of-arrays entity state
  alive = new Uint8Array(MAX_ENT);
  def = new Uint16Array(MAX_ENT);
  owner = new Uint8Array(MAX_ENT);
  x = new Float32Array(MAX_ENT);
  z = new Float32Array(MAX_ENT);
  px = new Float32Array(MAX_ENT);
  pz = new Float32Array(MAX_ENT);
  fx = new Float32Array(MAX_ENT);
  fz = new Float32Array(MAX_ENT);
  vx = new Float32Array(MAX_ENT);
  vz = new Float32Array(MAX_ENT);
  hp = new Float32Array(MAX_ENT);
  shield = new Float32Array(MAX_ENT);
  energy = new Float32Array(MAX_ENT);
  flags = new Uint16Array(MAX_ENT);
  target = new Int32Array(MAX_ENT);
  cooldown = new Int16Array(MAX_ENT);
  windup = new Int16Array(MAX_ENT);
  lastHit = new Int32Array(MAX_ENT);
  lastFire = new Int32Array(MAX_ENT);
  lastAttacker = new Int32Array(MAX_ENT);
  slowUntil = new Int32Array(MAX_ENT);
  carry = new Float32Array(MAX_ENT);
  carryKind = new Uint8Array(MAX_ENT);
  progress = new Float32Array(MAX_ENT);
  amount = new Float32Array(MAX_ENT);
  abilityReady = new Int32Array(MAX_ENT);
  wstate = new Uint8Array(MAX_ENT);
  timer = new Int16Array(MAX_ENT);
  stuck = new Uint16Array(MAX_ENT);
  navOn = new Uint8Array(MAX_ENT);
  navGoalX = new Float32Array(MAX_ENT);
  navGoalZ = new Float32Array(MAX_ENT);
  repathAt = new Int32Array(MAX_ENT);
  navFail = new Uint8Array(MAX_ENT);
  anchorX = new Float32Array(MAX_ENT);
  anchorZ = new Float32Array(MAX_ENT);
  spawnTick = new Int32Array(MAX_ENT);
  miners = new Uint8Array(MAX_ENT);
  assigned = new Uint8Array(MAX_ENT);
  builders = new Uint8Array(MAX_ENT);
  capOwner = new Int8Array(MAX_ENT);
  capBy = new Int8Array(MAX_ENT);
  capProgress = new Int16Array(MAX_ENT);
  weldUntil = new Int32Array(MAX_ENT);
  link = new Int32Array(MAX_ENT);
  rallyX = new Float32Array(MAX_ENT);
  rallyZ = new Float32Array(MAX_ENT);
  rallyTarget = new Int32Array(MAX_ENT);
  pathI = new Int16Array(MAX_ENT);
  // ---- cold per-entity state
  orders: Order[][] = [];
  path: (number[] | null)[] = [];
  queue: QueueItem[][] = [];
  cells: (number[] | null)[] = [];

  ids: number[] = [];
  nextId = 0;
  players: PlayerState[];
  projectiles: Projectile[] = [];
  effects: AreaEffect[] = [];
  events: SimEvent[] = [];
  thinkers: (Thinker | null)[] = [null, null];
  pending: { tick: number; player: number; seq: number; cmd: Command }[] = [];

  readonly blocked: Uint8Array;
  readonly staticBlocked: Uint8Array;
  readonly pathfinder: Pathfinder;
  pathBudget = 0;
  // spatial hash
  private hashStart = new Int32Array(HS * HS + 1);
  private hashItems = new Int32Array(MAX_ENT);
  private hashCount = new Int32Array(HS * HS);
  scratch: number[] = [];
  private needCompact = false;

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.map = getMap();
    this.rng = (cfg.seed >>> 0) || 1;
    const n = MAP_SIZE * MAP_SIZE;
    this.staticBlocked = new Uint8Array(n);
    for (let i = 0; i < n; i++) this.staticBlocked[i] = this.map.flags[i] & F_WALK ? 0 : 1;
    this.blocked = new Uint8Array(this.staticBlocked);
    this.pathfinder = new Pathfinder(MAP_SIZE, this.blocked);
    this.lastHit.fill(-100000);
    this.lastFire.fill(-100000);
    this.players = cfg.players.map((p) => ({
      faction: p.faction, ore: 100, flux: 0, supplyUsed: 0, supplyCap: 0, workers: 0, armyValue: 0, armySupply: 0,
      atkLevel: 0, armLevel: 0, tech: new Uint8Array(TECH_DEFS.length),
      visible: new Uint8Array(VIS_SIZE * VIS_SIZE), explored: new Uint8Array(VIS_SIZE * VIS_SIZE),
      ghosts: new Map(),
      stats: { oreCollected: 0, fluxCollected: 0, unitsCreated: 0, unitsLost: 0, unitsKilled: 0, structuresBuilt: 0, structuresLost: 0, structuresRazed: 0, firstExpansionTick: -1, commands: 0, rejected: 0, samples: [], timeline: [] },
      lastAttackAlert: -10000, lastSupplyAlert: -10000,
    }));
    // the terrain of Glass Ravine is known to both sides; fog hides everything that lives on it
    for (const p of this.players) p.explored.fill(1);
    this.setupWorld();
  }

  // ------------------------------------------------------------------ setup
  private setupWorld(): void {
    const m = this.map;
    const ORE = DEF_INDEX.ore, VENT = DEF_INDEX.vent;
    for (const r of m.resources) {
      const e = this.spawn(r.kind === 'ore' ? ORE : VENT, NEUTRAL, r.x, r.z);
      this.amount[e] = r.amount;
    }
    for (const p of m.pylons) this.spawn(DEF_INDEX.watch_pylon, NEUTRAL, p.x, p.z);
    for (const b of m.barriers) this.spawn(DEF_INDEX.barrier, NEUTRAL, b.x, b.z, false, b.cells);
    for (const p of m.pods) this.spawn(DEF_INDEX.pod, NEUTRAL, p.x, p.z);
    const tutorial = this.cfg.mode === 'tutorial';
    for (let p = 0; p < 2; p++) {
      const f = FACTIONS[this.cfg.players[p].faction];
      let start = m.starts[p];
      if (tutorial && p === 1) start = { x: m.sites[2].x, z: m.sites[2].z };
      const hq = this.spawn(DEF_INDEX[f.hq], p, start.x, start.z);
      const toC = { x: MAP_SIZE / 2 - start.x, z: MAP_SIZE / 2 - start.z };
      const len = Math.sqrt(toC.x * toC.x + toC.z * toC.z) || 1;
      const dx = toC.x / len, dz = toC.z / len;
      if (tutorial && p === 1) {
        this.players[p].ore = 0;
        const guard = f.id === 'chorus' ? ['thornling', 'thornling', 'thornling', 'sporecaster', 'sporecaster'] : ['bulwark', 'bulwark', 'bulwark'];
        guard.forEach((g, i) => this.spawnUnitNear(DEF_INDEX[g], p, start.x + dx * 7 + (i - 2) * 1.6, start.z + dz * 7 - (i - 2) * 1.6));
        this.spawn(DEF_INDEX[f.defense], p, Math.round(start.x + dx * 6 - dz * 6), Math.round(start.z + dz * 6 + dx * 6));
        continue;
      }
      for (let i = 0; i < 6; i++) {
        this.spawnUnitNear(DEF_INDEX[f.worker], p, start.x + dx * 5.5 + (-dz) * (i - 2.5) * 1.4, start.z + dz * 5.5 + dx * (i - 2.5) * 1.4);
      }
      this.spawnUnitNear(DEF_INDEX[f.scout], p, start.x + dx * 8, start.z + dz * 8);
      void hq;
    }
    updateBookkeeping(this);
    updateVision(this, true);
  }

  // ------------------------------------------------------------------ rng (mulberry32)
  random(): number {
    let t = (this.rng += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ------------------------------------------------------------------ entity lifecycle
  spawn(defIdx: number, owner: number, x: number, z: number, constructing = false, cells?: number[]): number {
    let e = this.nextId;
    if (e >= MAX_ENT) {
      // slot reuse (rare): oldest dead slot, inserted in id order
      e = -1;
      for (let i = 0; i < MAX_ENT; i++) if (!this.alive[i] && this.tick - this.spawnTick[i] > 600) { e = i; break; }
      if (e < 0) throw new Error('entity capacity exhausted');
      let k = 0;
      while (k < this.ids.length && this.ids[k] < e) k++;
      this.ids.splice(k, 0, e);
    } else {
      this.nextId++;
      this.ids.push(e);
    }
    const d = this.defs[defIdx];
    this.alive[e] = 1; this.def[e] = defIdx; this.owner[e] = owner;
    this.x[e] = this.px[e] = x; this.z[e] = this.pz[e] = z;
    const toC = owner === 0 ? 1 : -1;
    this.fx[e] = 0.7071 * toC; this.fz[e] = -0.7071 * toC;
    this.vx[e] = this.vz[e] = 0;
    this.hp[e] = constructing ? d.hp * 0.1 : d.hp;
    this.shield[e] = d.shield; this.energy[e] = d.energy * 0.5;
    this.flags[e] = constructing ? FL_CONSTRUCTING : 0;
    this.target[e] = -1; this.cooldown[e] = 0; this.windup[e] = -1;
    this.lastHit[e] = -100000; this.lastFire[e] = -100000; this.lastAttacker[e] = -1; this.slowUntil[e] = 0;
    this.carry[e] = 0; this.carryKind[e] = 0; this.progress[e] = constructing ? 0 : 1; this.amount[e] = 0;
    this.abilityReady[e] = 0; this.wstate[e] = 0; this.timer[e] = 0; this.stuck[e] = 0;
    this.navOn[e] = 0; this.repathAt[e] = 0; this.navFail[e] = 0; this.anchorX[e] = x; this.anchorZ[e] = z;
    this.spawnTick[e] = this.tick; this.miners[e] = 0; this.assigned[e] = 0; this.builders[e] = 0;
    this.capOwner[e] = -1; this.capBy[e] = -1; this.capProgress[e] = 0; this.weldUntil[e] = 0; this.link[e] = -1;
    this.rallyX[e] = NaN; this.rallyZ[e] = NaN; this.rallyTarget[e] = -1; this.pathI[e] = 0;
    this.orders[e] = []; this.path[e] = null; this.queue[e] = [];
    let cl: number[] | null = cells ?? null;
    if (!cl && d.footprint > 0) {
      cl = [];
      const h = d.footprint / 2;
      for (let cz = z - h; cz < z + h; cz++) for (let cx = x - h; cx < x + h; cx++) cl.push(cz * MAP_SIZE + cx);
    }
    this.cells[e] = cl;
    if (cl) for (const c of cl) this.blocked[c] = 2;
    if (d.tap) {
      const v = this.ventAt(x, z);
      if (v >= 0) { this.link[e] = v; this.link[v] = e; }
    }
    return e;
  }

  /** Spawn a mobile unit at the nearest free spot to a point. */
  spawnUnitNear(defIdx: number, owner: number, x: number, z: number): number {
    const d = this.defs[defIdx];
    if (!d.hover) {
      const c = this.pathfinder.nearestFree(x, z, 16);
      if (c >= 0 && !this.pathfinder.isFree(x, z)) { x = (c % MAP_SIZE) + 0.5; z = ((c / MAP_SIZE) | 0) + 0.5; }
    }
    return this.spawn(defIdx, owner, x, z);
  }

  kill(e: number, killer = -1, silent = false): void {
    if (!this.alive[e]) return;
    const d = this.defs[this.def[e]];
    const o = this.owner[e];
    this.clearOrders(e);
    this.alive[e] = 0;
    this.spawnTick[e] = this.tick;
    this.needCompact = true;
    const cl = this.cells[e];
    if (cl) for (const c of cl) this.blocked[c] = this.staticBlocked[c];
    if (d.tap && this.link[e] >= 0) this.link[this.link[e]] = -1;
    if (o < 2 && !silent) {
      const ps = this.players[o].stats;
      const ko = killer >= 0 ? this.owner[killer] : -1;
      if (d.cls === 'unit') { ps.unitsLost++; if (ko >= 0 && ko < 2 && ko !== o) this.players[ko].stats.unitsKilled++; }
      else if (d.cls === 'structure') {
        ps.structuresLost++;
        if (ko >= 0 && ko < 2 && ko !== o) this.players[ko].stats.structuresRazed++;
        if (d.hq) for (let p = 0; p < 2; p++) this.players[p].stats.timeline.push({ t: this.tick, text: `${this.cfg.players[o].name} lost a ${d.name}` });
      }
    }
    this.events.push({ t: 'death', id: e, def: this.def[e], owner: o, x: this.x[e], z: this.z[e], fx: this.fx[e], fz: this.fz[e], killer: silent ? -2 : killer });
  }

  private compact(): void {
    if (!this.needCompact) return;
    const ids = this.ids;
    let k = 0;
    for (let i = 0; i < ids.length; i++) if (this.alive[ids[i]]) ids[k++] = ids[i];
    ids.length = k;
    this.needCompact = false;
  }

  // ------------------------------------------------------------------ helpers
  d(e: number): EntityDef { return this.defs[this.def[e]]; }

  isUnit(e: number): boolean { return this.defs[this.def[e]].cls === 'unit'; }

  half(e: number): number { return this.defs[this.def[e]].footprint / 2; }

  ventAt(x: number, z: number): number {
    const VENT = DEF_INDEX.vent;
    for (const id of this.ids) if (this.alive[id] && this.def[id] === VENT && this.x[id] === x && this.z[id] === z) return id;
    return -1;
  }

  visIndex(x: number, z: number): number {
    const vx = Math.min(VIS_SIZE - 1, Math.max(0, (x / VIS_CELL) | 0));
    const vz = Math.min(VIS_SIZE - 1, Math.max(0, (z / VIS_CELL) | 0));
    return vz * VIS_SIZE + vx;
  }

  isVisibleTo(player: number, e: number): boolean {
    if (this.owner[e] === player) return true;
    return this.players[player].visible[this.visIndex(this.x[e], this.z[e])] > 0;
  }

  /** distance from a point to an entity's body (square footprint or circle) */
  edgeDist(e: number, x: number, z: number): number {
    const d = this.defs[this.def[e]];
    const dx = Math.abs(x - this.x[e]), dz = Math.abs(z - this.z[e]);
    if (d.footprint > 0) {
      const h = d.footprint / 2;
      const a = Math.max(0, dx - h), b = Math.max(0, dz - h);
      return Math.sqrt(a * a + b * b);
    }
    return Math.max(0, Math.sqrt(dx * dx + dz * dz) - d.radius);
  }

  hasComplete(player: number, defId: string): boolean {
    const di = DEF_INDEX[defId];
    for (const id of this.ids) if (this.alive[id] && this.owner[id] === player && this.def[id] === di && !(this.flags[id] & FL_CONSTRUCTING)) return true;
    return false;
  }

  /** Whether a player currently satisfies a def's structure + tech prerequisites. Returns '' or the missing name. */
  missingPrereq(player: number, d: EntityDef): string {
    for (const r of d.requires) if (!this.hasComplete(player, r)) return this.defs[DEF_INDEX[r]].name;
    if (d.requiresTech && this.players[player].tech[TECH_INDEX[d.requiresTech]] !== 2) return TECH_DEFS[TECH_INDEX[d.requiresTech]].name;
    return '';
  }

  missingTechPrereq(player: number, ti: number): string {
    const t = TECH_DEFS[ti];
    const ps = this.players[player];
    if (t.requiresTech && ps.tech[TECH_INDEX[t.requiresTech]] !== 2) return TECH_DEFS[TECH_INDEX[t.requiresTech]].name;
    if (t.kind !== 'tier' && t.level > 1) {
      const prev = TECH_INDEX[`${t.faction}_${t.kind === 'attack' ? 'atk' : 'arm'}${t.level - 1}`];
      if (ps.tech[prev] !== 2) return TECH_DEFS[prev].name;
    }
    return '';
  }

  alert(owner: number, kind: AlertKind, x = -1, z = -1): void {
    if (owner < 2) this.events.push({ t: 'alert', owner, kind, x, z });
  }

  // ------------------------------------------------------------------ spatial hash
  rebuildHash(): void {
    const cnt = this.hashCount, start = this.hashStart, items = this.hashItems;
    cnt.fill(0);
    const ids = this.ids;
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!this.alive[e]) continue;
      const c = this.defs[this.def[e]].cls;
      if (c === 'resource') continue;
      cnt[this.hcell(this.x[e], this.z[e])]++;
    }
    let acc = 0;
    for (let i = 0; i < HS * HS; i++) { start[i] = acc; acc += cnt[i]; cnt[i] = 0; }
    start[HS * HS] = acc;
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!this.alive[e]) continue;
      if (this.defs[this.def[e]].cls === 'resource') continue;
      const h = this.hcell(this.x[e], this.z[e]);
      items[start[h] + cnt[h]++] = e;
    }
  }

  private hcell(x: number, z: number): number {
    const hx = Math.min(HS - 1, Math.max(0, (x / HCELL) | 0)), hz = Math.min(HS - 1, Math.max(0, (z / HCELL) | 0));
    return hz * HS + hx;
  }

  /** Collect candidate entity ids (units, structures, neutrals) within a radius into `out`; returns the count. Ids ascend within buckets. */
  query(x: number, z: number, r: number, out: number[]): number {
    const x0 = Math.max(0, ((x - r) / HCELL) | 0), x1 = Math.min(HS - 1, ((x + r) / HCELL) | 0);
    const z0 = Math.max(0, ((z - r) / HCELL) | 0), z1 = Math.min(HS - 1, ((z + r) / HCELL) | 0);
    let n = 0;
    for (let hz = z0; hz <= z1; hz++) {
      for (let hx = x0; hx <= x1; hx++) {
        const h = hz * HS + hx;
        for (let k = this.hashStart[h]; k < this.hashStart[h + 1]; k++) out[n++] = this.hashItems[k];
      }
    }
    return n;
  }

  // ------------------------------------------------------------------ orders
  clearOrders(e: number): void {
    const ords = this.orders[e];
    if (ords) {
      for (const o of ords) this.refundOrder(e, o);
      ords.length = 0;
    }
    this.wstate[e] = 0;
    this.windup[e] = -1;
    this.target[e] = -1;
    this.navOn[e] = 0;
    this.path[e] = null;
    this.navFail[e] = 0;
    this.stuck[e] = 0;
    this.anchorX[e] = this.x[e]; this.anchorZ[e] = this.z[e];
  }

  private refundOrder(e: number, o: Order): void {
    if (o.t === OT_BUILD && o.paid) {
      const d = this.defs[o.def];
      const p = this.players[this.owner[e]];
      p.ore += d.ore; p.flux += d.flux;
      o.paid = false;
    }
  }

  finishOrder(e: number): void {
    const ords = this.orders[e];
    const o = ords.shift();
    if (o) this.refundOrder(e, o);
    this.wstate[e] = 0;
    this.windup[e] = -1;
    this.target[e] = -1;
    this.navOn[e] = 0;
    this.path[e] = null;
    this.navFail[e] = 0;
    this.stuck[e] = 0;
    if (ords.length === 0) { this.anchorX[e] = this.x[e]; this.anchorZ[e] = this.z[e]; }
  }

  private giveOrder(e: number, o: Order, queue: boolean): void {
    if (!queue) {
      this.clearOrders(e);
      this.flags[e] &= ~(FL_HOLD | FL_CURLED);
    }
    if (this.orders[e].length < 16) this.orders[e].push(o);
    else this.refundOrder(e, o);
  }

  setNav(e: number, path: number[], gx: number, gz: number): void {
    this.path[e] = path; this.pathI[e] = 0; this.navOn[e] = 1; this.navGoalX[e] = gx; this.navGoalZ[e] = gz;
    this.repathAt[e] = this.tick + 20; this.stuck[e] = 0;
  }

  // ------------------------------------------------------------------ placement
  canPlace(player: number, defIdx: number, x: number, z: number, ignoreExplored = false): number {
    const d = this.defs[defIdx];
    const h = d.footprint / 2;
    if (!Number.isInteger(x) || !Number.isInteger(z)) return PLACE_TERRAIN;
    if (x - h < 1 || z - h < 1 || x + h > MAP_SIZE - 1 || z + h > MAP_SIZE - 1) return PLACE_TERRAIN;
    const ps = this.players[player];
    if (d.tap) {
      const v = this.ventAt(x, z);
      if (v < 0 || this.link[v] >= 0) return PLACE_VENT;
      if (!ignoreExplored && !ps.explored[this.visIndex(x, z)]) return PLACE_UNEXPLORED;
      for (let cz = z - h; cz < z + h; cz++) for (let cx = x - h; cx < x + h; cx++) if (this.blocked[cz * MAP_SIZE + cx]) return PLACE_OCCUPIED;
      return PLACE_OK;
    }
    for (let cz = z - h; cz < z + h; cz++) {
      for (let cx = x - h; cx < x + h; cx++) {
        const i = cz * MAP_SIZE + cx;
        if (!(this.map.flags[i] & F_BUILD)) return PLACE_TERRAIN;
        if (this.blocked[i]) return PLACE_OCCUPIED;
      }
    }
    if (!ignoreExplored && !ps.explored[this.visIndex(x, z)]) return PLACE_UNEXPLORED;
    const ORE = DEF_INDEX.ore, VENT = DEF_INDEX.vent;
    let inZone = !!d.hq;
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      const od = this.def[id];
      if (od === VENT) {
        if (Math.abs(this.x[id] - x) < h + 1 && Math.abs(this.z[id] - z) < h + 1) return PLACE_OCCUPIED;
        if (d.hq && Math.abs(this.x[id] - x) < h + 5 && Math.abs(this.z[id] - z) < h + 5) return PLACE_OCCUPIED;
      } else if (od === ORE) {
        if (d.hq && Math.abs(this.x[id] - x) < h + 5 && Math.abs(this.z[id] - z) < h + 5) return PLACE_OCCUPIED;
      } else if (!inZone && this.owner[id] === player && !(this.flags[id] & FL_CONSTRUCTING)) {
        const zr = this.defs[od].zone;
        if (zr > 0) {
          const dx = this.x[id] - x, dz = this.z[id] - z;
          if (dx * dx + dz * dz <= zr * zr) inZone = true;
        }
      }
    }
    return inZone ? PLACE_OK : PLACE_ZONE;
  }

  // ------------------------------------------------------------------ commands
  /** Schedule a command for a future tick (the intended-tick field of the protocol). */
  schedule(player: number, seq: number, tick: number, cmd: Command): void {
    this.pending.push({ tick: Math.max(tick, this.tick), player, seq, cmd });
  }

  private ownedUnits(player: number, ids: number[]): number[] {
    const out: number[] = [];
    for (const id of ids) {
      if (id >= 0 && id < MAX_ENT && this.alive[id] && this.owner[id] === player && this.defs[this.def[id]].cls === 'unit' && !out.includes(id)) out.push(id);
    }
    return out;
  }

  private ownedStructure(player: number, id: number): boolean {
    return Number.isInteger(id) && id >= 0 && id < MAX_ENT && !!this.alive[id] && this.owner[id] === player && this.defs[this.def[id]].cls === 'structure';
  }

  private validTargetId(t: number | undefined): t is number {
    return t !== undefined && Number.isInteger(t) && t >= 0 && t < MAX_ENT && !!this.alive[t];
  }

  /** Validate and apply a command. Returns false when the command is rejected. */
  applyCommand(player: number, cmd: Command): boolean {
    if (this.winner >= 0 || (player !== 0 && player !== 1)) return false;
    const ps = this.players[player];
    ps.stats.commands++;
    const ok = this.exec(player, cmd);
    if (!ok) ps.stats.rejected++;
    return ok;
  }

  private exec(player: number, cmd: Command): boolean {
    const ps = this.players[player];
    const inMap = (x: number, z: number) => Number.isFinite(x) && Number.isFinite(z) && x >= 0 && z >= 0 && x <= MAP_SIZE && z <= MAP_SIZE;
    switch (cmd.k) {
      case 'move': case 'amove': case 'patrol': {
        if (!inMap(cmd.x, cmd.z)) return false;
        const units = this.ownedUnits(player, cmd.ids);
        if (units.length === 0) return false;
        this.groupMove(units, cmd.x, cmd.z, cmd.k === 'move' ? OT_MOVE : cmd.k === 'amove' ? OT_AMOVE : OT_PATROL, !!cmd.q);
        return true;
      }
      case 'attack': {
        if (!this.validTargetId(cmd.target)) return false;
        const t = cmd.target;
        const td = this.d(t);
        if (this.owner[t] === player) return false;
        if (td.cls !== 'unit' && td.cls !== 'structure' && td.id !== 'barrier') return false;
        if (!this.isVisibleTo(player, t) && !ps.ghosts.has(t)) return false;
        const units = this.ownedUnits(player, cmd.ids);
        let any = false;
        for (const e of units) {
          const d = this.d(e);
          if (!d.weapon) { this.giveOrder(e, newOrder(OT_MOVE, this.x[t], this.z[t]), !!cmd.q); continue; }
          if (td.hover && !d.weapon.hitsHover) continue;
          this.giveOrder(e, newOrder(OT_ATTACK, this.x[t], this.z[t], t), !!cmd.q);
          any = true;
        }
        return any || units.length > 0;
      }
      case 'follow': {
        if (!this.validTargetId(cmd.target) || !this.isUnit(cmd.target)) return false;
        const units = this.ownedUnits(player, cmd.ids);
        for (const e of units) if (e !== cmd.target) this.giveOrder(e, newOrder(OT_FOLLOW, this.x[cmd.target], this.z[cmd.target], cmd.target), !!cmd.q);
        return units.length > 0;
      }
      case 'gather': {
        if (!this.validTargetId(cmd.target)) return false;
        const t = cmd.target;
        const td = this.d(t);
        const isOre = td.id === 'ore';
        const isTap = !!td.tap && this.owner[t] === player;
        if (!isOre && !isTap) return false;
        const units = this.ownedUnits(player, cmd.ids).filter((e) => this.d(e).worker);
        for (const e of units) {
          const keep = this.carry[e];
          this.giveOrder(e, newOrder(OT_GATHER, this.x[t], this.z[t], t), !!cmd.q);
          // a worker already carrying the matching resource returns it first
          if (!cmd.q && keep > 0 && this.carryKind[e] === (isOre ? 1 : 2)) this.wstate[e] = 2;
          else if (!cmd.q && keep > 0) { this.carry[e] = 0; this.carryKind[e] = 0; }
        }
        return units.length > 0;
      }
      case 'repair': {
        if (!this.validTargetId(cmd.target) || this.owner[cmd.target] !== player) return false;
        const t = cmd.target;
        const td = this.d(t);
        const constructing = !!(this.flags[t] & FL_CONSTRUCTING);
        const units = this.ownedUnits(player, cmd.ids).filter((e) => this.d(e).worker && e !== t);
        if (ps.faction !== 'helix') return false;
        if (!constructing && !td.tags.includes('Mechanical')) return false;
        for (const e of units) this.giveOrder(e, newOrder(OT_CONSTRUCT, this.x[t], this.z[t], t), !!cmd.q);
        return units.length > 0;
      }
      case 'build': {
        const di = DEF_INDEX[cmd.def];
        if (di === undefined) return false;
        const bd = this.defs[di];
        if (bd.cls !== 'structure' || bd.faction !== ps.faction) return false;
        const workers = this.ownedUnits(player, cmd.ids).filter((e) => this.d(e).worker);
        if (workers.length === 0) return false;
        const miss = this.missingPrereq(player, bd);
        if (miss) { this.alert(player, 'prereq'); return false; }
        const reason = this.canPlace(player, di, cmd.x, cmd.z);
        if (reason !== PLACE_OK) { this.alert(player, 'blocked', cmd.x, cmd.z); return false; }
        if (ps.ore < bd.ore) { this.alert(player, 'ore'); return false; }
        if (ps.flux < bd.flux) { this.alert(player, 'flux'); return false; }
        // nearest worker takes the job
        let best = workers[0], bestD = 1e9;
        for (const w of workers) {
          const dx = this.x[w] - cmd.x, dz = this.z[w] - cmd.z;
          const dd = dx * dx + dz * dz + (this.orders[w].some((o) => o.t === OT_BUILD) ? 400 : 0);
          if (dd < bestD) { bestD = dd; best = w; }
        }
        ps.ore -= bd.ore; ps.flux -= bd.flux;
        const o = newOrder(OT_BUILD, cmd.x, cmd.z);
        o.def = di; o.paid = true;
        this.giveOrder(best, o, !!cmd.q);
        return true;
      }
      case 'ability': {
        const ab = ABILITY_BY_ID[cmd.ability];
        if (!ab) return false;
        const units = this.ownedUnits(player, cmd.ids).filter((e) => this.d(e).ability === ab.id);
        if (units.length === 0) return false;
        if (ab.toggle) {
          const bit = ab.id === 'brace' ? FL_BRACED : FL_CURLED;
          // toggle as a group: if any unit is off, turn all on
          const anyOff = units.some((e) => !(this.flags[e] & bit));
          for (const e of units) {
            if (anyOff) this.flags[e] |= bit; else this.flags[e] &= ~bit;
            if (bit === FL_CURLED && anyOff) { this.clearOrders(e); this.vx[e] = this.vz[e] = 0; }
            this.events.push({ t: 'ability', id: e, ab: ab.id, x: this.x[e], z: this.z[e], owner: player });
          }
          return true;
        }
        if (ab.target === 'unit') {
          if (!this.validTargetId(cmd.target)) return false;
          const t = cmd.target;
          if (this.owner[t] !== player || this.d(t).cls !== 'structure') { this.alert(player, 'invalid'); return false; }
          if (ps.flux < ab.flux) { this.alert(player, 'flux'); return false; }
          // nearest ready caster
          let best = -1, bestD = 1e9;
          for (const e of units) {
            if (this.abilityReady[e] > this.tick) continue;
            const dd = (this.x[e] - this.x[t]) ** 2 + (this.z[e] - this.z[t]) ** 2;
            if (dd < bestD) { bestD = dd; best = e; }
          }
          if (best < 0) { this.alert(player, 'cooldown'); return false; }
          const o = newOrder(OT_ABILITY, this.x[t], this.z[t], t);
          o.ab = ab.id;
          this.giveOrder(best, o, !!cmd.q);
          return true;
        }
        if (cmd.x === undefined || cmd.z === undefined || !inMap(cmd.x, cmd.z)) return false;
        let best = -1, bestD = 1e9;
        for (const e of units) {
          if (this.abilityReady[e] > this.tick || this.energy[e] < ab.energy) continue;
          const dd = (this.x[e] - cmd.x) ** 2 + (this.z[e] - cmd.z) ** 2;
          if (dd < bestD) { bestD = dd; best = e; }
        }
        if (best < 0) { this.alert(player, ab.energy > 0 ? 'energy' : 'cooldown'); return false; }
        const o = newOrder(OT_ABILITY, cmd.x, cmd.z);
        o.ab = ab.id;
        this.giveOrder(best, o, !!cmd.q);
        return true;
      }
      case 'stop': case 'hold': {
        const units = this.ownedUnits(player, cmd.ids);
        for (const e of units) {
          this.clearOrders(e);
          this.flags[e] &= ~FL_HOLD;
          if (cmd.k === 'hold') this.flags[e] |= FL_HOLD;
        }
        return units.length > 0;
      }
      case 'train': {
        if (!this.ownedStructure(player, cmd.id)) return false;
        const sd = this.d(cmd.id);
        const di = DEF_INDEX[cmd.def];
        if (di === undefined || !sd.trains.includes(cmd.def) || (this.flags[cmd.id] & FL_CONSTRUCTING)) return false;
        const ud = this.defs[di];
        if (this.missingPrereq(player, ud)) { this.alert(player, 'prereq'); return false; }
        if (this.queue[cmd.id].length >= MAX_QUEUE) { this.alert(player, 'queue'); return false; }
        if (ps.ore < ud.ore) { this.alert(player, 'ore'); return false; }
        if (ps.flux < ud.flux) { this.alert(player, 'flux'); return false; }
        ps.ore -= ud.ore; ps.flux -= ud.flux;
        this.queue[cmd.id].push({ kind: 'unit', def: di, progress: 0, total: Math.round(ud.buildTime * TICK_RATE), started: false });
        return true;
      }
      case 'research': {
        if (!this.ownedStructure(player, cmd.id)) return false;
        const sd = this.d(cmd.id);
        const ti = TECH_INDEX[cmd.tech];
        if (ti === undefined || !sd.researches.includes(cmd.tech) || (this.flags[cmd.id] & FL_CONSTRUCTING)) return false;
        const td = TECH_DEFS[ti];
        if (ps.tech[ti] !== 0) return false;
        if (this.missingTechPrereq(player, ti)) { this.alert(player, 'prereq'); return false; }
        if (this.queue[cmd.id].length >= MAX_QUEUE) { this.alert(player, 'queue'); return false; }
        if (ps.ore < td.ore) { this.alert(player, 'ore'); return false; }
        if (ps.flux < td.flux) { this.alert(player, 'flux'); return false; }
        ps.ore -= td.ore; ps.flux -= td.flux;
        ps.tech[ti] = 1;
        this.queue[cmd.id].push({ kind: 'tech', def: ti, progress: 0, total: Math.round(td.time * TICK_RATE), started: false });
        return true;
      }
      case 'cancel': {
        if (!this.ownedStructure(player, cmd.id)) return false;
        const q = this.queue[cmd.id];
        const idx = cmd.index < 0 ? q.length - 1 : cmd.index;
        if (idx < 0 || idx >= q.length) return false;
        const it = q[idx];
        q.splice(idx, 1);
        if (it.kind === 'unit') { ps.ore += this.defs[it.def].ore; ps.flux += this.defs[it.def].flux; }
        else { ps.ore += TECH_DEFS[it.def].ore; ps.flux += TECH_DEFS[it.def].flux; ps.tech[it.def] = 0; }
        return true;
      }
      case 'cancelBuild': {
        if (!this.ownedStructure(player, cmd.id) || !(this.flags[cmd.id] & FL_CONSTRUCTING)) return false;
        const sd = this.d(cmd.id);
        ps.ore += Math.floor(sd.ore * 0.75); ps.flux += Math.floor(sd.flux * 0.75);
        this.kill(cmd.id, -1, true);
        return true;
      }
      case 'rally': {
        if (!inMap(cmd.x, cmd.z)) return false;
        let any = false;
        for (const id of cmd.ids) {
          if (!this.ownedStructure(player, id) || this.d(id).trains.length === 0) continue;
          this.rallyX[id] = cmd.x; this.rallyZ[id] = cmd.z;
          this.rallyTarget[id] = this.validTargetId(cmd.target) ? cmd.target : -1;
          any = true;
        }
        return any;
      }
      case 'surrender': {
        this.endMatch(1 - player);
        return true;
      }
    }
    return false;
  }

  /** Shared-corridor group move: one path for the group, relative formation offsets at the destination. */
  private groupMove(units: number[], x: number, z: number, type: number, queue: boolean): void {
    const n = units.length;
    let cx = 0, cz = 0;
    for (const e of units) { cx += this.x[e]; cz += this.z[e]; }
    cx /= n; cz /= n;
    let maxD = 0, leader = units[0], leadD = 1e9;
    for (const e of units) {
      const dx = this.x[e] - cx, dz = this.z[e] - cz;
      const dd = Math.sqrt(dx * dx + dz * dz);
      if (dd > maxD) maxD = dd;
      if (dd < leadD && !this.d(e).hover) { leadD = dd; leader = e; }
    }
    const R = Math.max(1.2, 1.05 * Math.sqrt(n));
    const scale = n === 1 ? 0 : maxD > R ? R / maxD : 1;
    const pf = this.pathfinder;
    let leaderPath: number[] | null = null;
    if (!queue && n > 1 && !this.d(leader).hover) {
      leaderPath = pf.findPath(this.x[leader], this.z[leader], x, z);
      if (leaderPath.length === 0) leaderPath = null;
    }
    for (const e of units) {
      const d = this.d(e);
      let gx = x + (this.x[e] - cx) * scale, gz = z + (this.z[e] - cz) * scale;
      if (!d.hover && (!pf.isFree(gx, gz) || !pf.lineFree(x, z, gx, gz, 0.2))) { gx = x; gz = z; }
      gx = Math.min(MAP_SIZE - 1, Math.max(1, gx)); gz = Math.min(MAP_SIZE - 1, Math.max(1, gz));
      const o = newOrder(type, gx, gz);
      if (type === OT_PATROL) { o.x2 = this.x[e]; o.z2 = this.z[e]; }
      this.giveOrder(e, o, queue);
      if (queue || !leaderPath || d.hover) continue;
      const lp = leaderPath;
      const m = lp.length / 2;
      let k = -1;
      if (e === leader) k = 0;
      else for (let j = Math.min(2, m - 1); j >= 0; j--) if (pf.lineFree(this.x[e], this.z[e], lp[j * 2], lp[j * 2 + 1])) { k = j; break; }
      if (k < 0) continue;
      const path = lp.slice(k * 2);
      path[path.length - 2] = gx; path[path.length - 1] = gz;
      this.setNav(e, path, gx, gz);
    }
  }

  endMatch(winner: number): void {
    if (this.winner >= 0) return;
    this.winner = winner;
    this.events.push({ t: 'gameover', winner });
  }

  // ------------------------------------------------------------------ tick
  step(): void {
    if (this.winner >= 0) return;
    this.events.length = 0;
    // 1. scheduled player commands for this tick, in deterministic order
    if (this.pending.length > 0) {
      const due = this.pending.filter((c) => c.tick <= this.tick);
      if (due.length > 0) {
        this.pending = this.pending.filter((c) => c.tick > this.tick);
        due.sort((a, b) => a.tick - b.tick || a.player - b.player || a.seq - b.seq);
        for (const c of due) this.applyCommand(c.player, c.cmd);
      }
    }
    // 2. server-side AI (same command path as players)
    for (let p = 0; p < 2; p++) this.thinkers[p]?.think(this);
    if (this.winner >= 0) return;
    this.px.set(this.x); this.pz.set(this.z);
    this.pathBudget = 28;
    this.rebuildHash();
    updateBookkeeping(this);
    updateUnits(this);
    updateProduction(this);
    updateCombatSystems(this);
    integrateMovement(this);
    updateWorldObjects(this);
    if (this.tick % 4 === 0) updateVision(this, false);
    this.compact();
    this.tick++;
  }

  // ------------------------------------------------------------------ state hash (FNV-1a over quantised state)
  hash(): number {
    let h = 0x811c9dc5;
    const mix = (v: number) => { h ^= v & 0xffff; h = Math.imul(h, 0x01000193); h ^= (v >>> 16) & 0xffff; h = Math.imul(h, 0x01000193); };
    mix(this.tick); mix(this.rng); mix(this.winner + 2);
    for (const p of this.players) { mix(Math.round(p.ore * 16)); mix(Math.round(p.flux * 16)); mix(p.supplyUsed); mix(p.atkLevel * 4 + p.armLevel); }
    for (const e of this.ids) {
      if (!this.alive[e]) continue;
      mix(e); mix(this.def[e] * 4 + this.owner[e]);
      mix(Math.round(this.x[e] * 256)); mix(Math.round(this.z[e] * 256));
      mix(Math.round(this.hp[e] * 16)); mix(this.flags[e]); mix(Math.round(this.amount[e]));
    }
    mix(this.projectiles.length);
    return h >>> 0;
  }
}

export { newOrder };
