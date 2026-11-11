// Deterministic, data-oriented RTS simulation. Hot per-entity numeric state is stored as
// structure-of-arrays (typed arrays indexed by integer entity id); variable-size state lives in
// `ext`. Everything advances in fixed 20 Hz ticks; no wall-clock time is read here. Positions are
// quantized to 1/1024 world units every tick so results are stable across runtimes.

import {
  ABILITIES, FACTIONS, NEUTRALS, STRUCTURES, STRUCTURE_IDS, TECHS, UNITS, UNIT_IDS,
  type FactionId, type StructureDef, type UnitDef, type WeaponDef,
} from '../faction-data';
import { createGlassRavine, F_BUILD, F_HOVER, type GameMap } from '../world/map';
import { NavGrid, SpatialHash } from '../navigation/nav';
import { COMMAND_QUOTA_PER_SEC, INPUT_DELAY_TICKS, type Command, type MatchSetup } from '../network-protocol/protocol';
import { Hasher, Rng } from './rng';
import { updateVision } from './vision';
import {
  Ext, Kind, MAX_ENTITIES, type AlertKind, type Ghost, type Order, type PlayerStats, type Projectile, type SimEvent,
  type TimelineEvent, type Zone,
} from './types';

export const TPS = 20;
export const LATE_GAME_TICK = 18 * 60 * TPS;
export const PULSE_PERIOD = 90 * TPS;
const Q = 1024;
// floor (not round) so quantization never pushes a position across an integer cell boundary
const quant = (v: number) => Math.floor(v * Q) / Q;

export interface PlayerState {
  id: number;
  faction: FactionId;
  name: string;
  ore: number;
  flux: number;
  supplyUsed: number;
  supplyCap: number;
  techs: Set<string>;
  attackLevel: number;
  armorLevel: number;
  defeated: boolean;
  stats: PlayerStats;
  visible: Uint8Array;
  explored: Uint8Array;
  ghosts: Map<number, Ghost>;
  cmdWindow: number[];
  lastAttackAlert: number;
  lastAttackX: number; lastAttackY: number;
  lastSupplyAlert: number;
  startX: number; startY: number;
}

export interface PlacementResult { ok: boolean; reason: string; cells: { c: number; ok: boolean }[] }

export class Sim {
  readonly map: GameMap;
  readonly nav: NavGrid;
  readonly rng: Rng;
  readonly setup: MatchSetup;
  tick = 0;
  nextId = 1;

  // ---- structure-of-arrays hot components ----
  readonly alive = new Uint8Array(MAX_ENTITIES);
  readonly kind = new Uint8Array(MAX_ENTITIES);
  readonly def = new Int16Array(MAX_ENTITIES);
  readonly owner = new Int8Array(MAX_ENTITIES);
  readonly x = new Float64Array(MAX_ENTITIES);
  readonly y = new Float64Array(MAX_ENTITIES);
  readonly px = new Float64Array(MAX_ENTITIES);
  readonly py = new Float64Array(MAX_ENTITIES);
  readonly fx = new Float32Array(MAX_ENTITIES);
  readonly fy = new Float32Array(MAX_ENTITIES);
  readonly hp = new Float64Array(MAX_ENTITIES);
  readonly maxHp = new Float32Array(MAX_ENTITIES);
  readonly radius = new Float32Array(MAX_ENTITIES);
  readonly built = new Uint8Array(MAX_ENTITIES);
  readonly progress = new Float64Array(MAX_ENTITIES);
  readonly cooldown = new Int32Array(MAX_ENTITIES);
  readonly moving = new Uint8Array(MAX_ENTITIES);
  ext: Ext[] = new Array(MAX_ENTITIES);
  private freeList: number[] = [];

  players: PlayerState[] = [];
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  events: SimEvent[] = [];
  timeline: TimelineEvent[] = [];
  pending: Command[] = [];
  /** accepted commands in execution order (replay log) */
  commandLog: Command[] = [];
  hashes: [number, number][] = [];
  pylonIds: number[] = [];
  podIds: number[] = [];
  barrierIds: number[] = [];
  revealUntil = 0;
  winner = -1;
  over = false;
  private seqCounter = 0;
  private groupCounter = 1;
  readonly spatial: SpatialHash;
  /** groupId -> spread radius used for arrival tolerance */
  groupSpread = new Map<number, number>();

  constructor(setup: MatchSetup) {
    this.setup = setup;
    this.map = createGlassRavine();
    this.nav = new NavGrid(this.map.size, this.map.flags);
    this.rng = new Rng(setup.seed);
    this.spatial = new SpatialHash(this.map.size, 4, MAX_ENTITIES);
    const n = this.map.size;
    setup.players.forEach((ps, i) => {
      this.players.push({
        id: i, faction: ps.faction, name: ps.name, ore: 150, flux: 0, supplyUsed: 0, supplyCap: 0,
        techs: new Set(), attackLevel: 0, armorLevel: 0, defeated: false,
        stats: { oreCollected: 0, fluxCollected: 0, unitsCreated: 0, unitsLost: 0, structuresBuilt: 0, structuresLost: 0, kills: 0, samples: [], expansions: [] },
        visible: new Uint8Array(n * n), explored: new Uint8Array(n * n), ghosts: new Map(), cmdWindow: [],
        lastAttackAlert: -9999, lastAttackX: 0, lastAttackY: 0, lastSupplyAlert: -9999,
        startX: this.map.starts[i].x, startY: this.map.starts[i].y,
      });
    });
    this.populate();
    this.recomputeSupply();
    updateVision(this);
  }

  // ------------------------------------------------------------------ defs
  udef(id: number): UnitDef { return UNITS[UNIT_IDS[this.def[id]]]; }
  sdef(id: number): StructureDef { return STRUCTURES[STRUCTURE_IDS[this.def[id]]]; }
  defName(id: number): string {
    const k = this.kind[id];
    if (k === Kind.Unit) return this.udef(id).id;
    if (k === Kind.Structure) return this.sdef(id).id;
    return ['none', 'unit', 'structure', 'ore', 'vent', 'pylon', 'barrier', 'pod', 'spike'][k];
  }
  weaponOf(id: number): WeaponDef | undefined {
    const k = this.kind[id];
    if (k === Kind.Unit) return this.udef(id).weapon;
    if (k === Kind.Structure && this.built[id]) return this.sdef(id).weapon;
    return undefined;
  }
  tagsOf(id: number): string[] {
    const k = this.kind[id];
    if (k === Kind.Unit) return this.udef(id).tags;
    if (k === Kind.Structure) return this.sdef(id).tags;
    if (k === Kind.Barrier) return ['Structure', 'Armored'];
    return ['Light'];
  }
  armorOf(id: number): number {
    const k = this.kind[id];
    if (k === Kind.Unit) return this.udef(id).armor;
    if (k === Kind.Structure) return this.sdef(id).armor;
    if (k === Kind.Barrier) return NEUTRALS.barrier.armor;
    return 0;
  }
  isHover(id: number) { return this.kind[id] === Kind.Unit && !!this.udef(id).hover; }

  // ------------------------------------------------------------------ entity lifecycle
  private alloc(): number {
    let id: number;
    if (this.nextId < MAX_ENTITIES) id = this.nextId++;
    else if (this.freeList.length) id = this.freeList.shift()!;
    else throw new Error('entity capacity exhausted');
    this.alive[id] = 1;
    this.ext[id] = new Ext();
    this.built[id] = 1;
    this.progress[id] = 1;
    this.cooldown[id] = 0;
    this.moving[id] = 0;
    this.fx[id] = 0; this.fy[id] = 1;
    return id;
  }

  spawnUnit(defId: string, owner: number, x: number, y: number): number {
    const d = UNITS[defId];
    const id = this.alloc();
    this.kind[id] = Kind.Unit;
    this.def[id] = UNIT_IDS.indexOf(defId);
    this.owner[id] = owner;
    if (!d.hover) {
      const c = this.nav.nearestPassable(Math.floor(x), Math.floor(y), 12);
      if (c >= 0 && !this.nav.passableW(x, y)) { x = (c % this.map.size) + 0.5; y = ((c / this.map.size) | 0) + 0.5; }
    }
    this.x[id] = this.px[id] = quant(x);
    this.y[id] = this.py[id] = quant(y);
    this.hp[id] = this.maxHp[id] = d.hp;
    this.radius[id] = d.radius;
    const e = this.ext[id];
    e.energy = d.energyStart ?? 0;
    if (defId === 'aegis_frame') e.shield = 160;
    // face toward map center
    const cx = this.map.size / 2 - x, cy = this.map.size / 2 - y;
    const l = Math.hypot(cx, cy) || 1;
    this.fx[id] = cx / l; this.fy[id] = cy / l;
    e.goalX = x; e.goalY = y;
    this.events.push({ type: 'spawn', id, owner, def: defId, x, y });
    return id;
  }

  footprint(tx: number, ty: number, size: number): number[] {
    const out: number[] = [];
    const n = this.map.size;
    for (let y = ty; y < ty + size; y++) for (let x = tx; x < tx + size; x++) out.push(y * n + x);
    return out;
  }

  spawnStructure(defId: string, owner: number, tx: number, ty: number, complete: boolean): number {
    const d = STRUCTURES[defId];
    const id = this.alloc();
    this.kind[id] = Kind.Structure;
    this.def[id] = STRUCTURE_IDS.indexOf(defId);
    this.owner[id] = owner;
    this.x[id] = this.px[id] = tx + d.size / 2;
    this.y[id] = this.py[id] = ty + d.size / 2;
    this.radius[id] = d.size / 2;
    this.maxHp[id] = d.hp;
    this.built[id] = complete ? 1 : 0;
    this.progress[id] = complete ? 1 : 0;
    this.hp[id] = complete ? d.hp : Math.max(1, d.hp * 0.1);
    const e = this.ext[id];
    e.cells = this.footprint(tx, ty, d.size);
    this.nav.setOcc(e.cells, id + 1);
    // sentries face the map center
    const cx = this.map.size / 2 - this.x[id], cy = this.map.size / 2 - this.y[id];
    const l = Math.hypot(cx, cy) || 1;
    e.cone = { x: cx / l, y: cy / l };
    this.fx[id] = e.cone.x; this.fy[id] = e.cone.y;
    // push units off the footprint
    for (let j = 1; j < this.nextId; j++) {
      if (!this.alive[j] || this.kind[j] !== Kind.Unit || this.isHover(j)) continue;
      const c = Math.floor(this.y[j]) * this.map.size + Math.floor(this.x[j]);
      if (e.cells.includes(c)) {
        const p = this.nav.nearestPassable(Math.floor(this.x[j]), Math.floor(this.y[j]), 10);
        if (p >= 0) { this.x[j] = (p % this.map.size) + 0.5; this.y[j] = ((p / this.map.size) | 0) + 0.5; }
      }
    }
    if (d.isExtractor) {
      // absorb the vent beneath
      for (let j = 1; j < this.nextId; j++) {
        if (this.alive[j] && this.kind[j] === Kind.Vent && Math.abs(this.x[j] - this.x[id]) < 1 && Math.abs(this.y[j] - this.y[id]) < 1) {
          e.amount = this.ext[j].amount; e.maxAmount = this.ext[j].maxAmount; e.base = this.ext[j].base;
          this.alive[j] = 0;
          this.events.push({ type: 'death', id: j, kind: 'silent' });
        }
      }
      this.nav.setOcc(e.cells, id + 1);
    }
    this.events.push({ type: 'spawn', id, owner, def: defId, x: this.x[id], y: this.y[id] });
    return id;
  }

  private spawnNeutral(kind: number, x: number, y: number, cells: number[], hp: number, r: number): number {
    const id = this.alloc();
    this.kind[id] = kind;
    this.owner[id] = -1;
    this.x[id] = this.px[id] = x; this.y[id] = this.py[id] = y;
    this.hp[id] = this.maxHp[id] = hp;
    this.radius[id] = r;
    this.ext[id].cells = cells;
    if (cells.length) this.nav.setOcc(cells, id + 1);
    return id;
  }

  private populate() {
    const m = this.map;
    for (const r of m.resources) {
      if (r.kind === 'ore') {
        const id = this.spawnNeutral(Kind.Ore, r.x + 0.5, r.y + 0.5, [r.y * m.size + r.x], 1, 0.8);
        this.ext[id].amount = this.ext[id].maxAmount = r.amount; this.ext[id].base = r.base;
      } else {
        const id = this.spawnNeutral(Kind.Vent, r.x + 0.5, r.y + 0.5, this.footprint(r.x - 1, r.y - 1, 3), 1, 1.5);
        this.ext[id].amount = this.ext[id].maxAmount = r.amount; this.ext[id].base = r.base;
      }
    }
    for (const p of m.pylons) this.pylonIds.push(this.spawnNeutral(Kind.Pylon, p.x + 0.5, p.y + 0.5, [p.y * m.size + p.x], 1, 0.8));
    for (const p of m.pods) this.podIds.push(this.spawnNeutral(Kind.Pod, p.x + 0.5, p.y + 0.5, [], 1, 0.6));
    for (const b of m.barriers) this.barrierIds.push(this.spawnNeutral(Kind.Barrier, b.x, b.y, b.cells, NEUTRALS.barrier.hp, 1.8));

    this.players.forEach((p, i) => {
      const f = FACTIONS[p.faction];
      const s = m.starts[i];
      const hqSize = STRUCTURES[f.hq].size;
      this.spawnStructure(f.hq, i, Math.round(s.x - hqSize / 2), Math.round(s.y - hqSize / 2), true);
      const toCenter = { x: m.size / 2 - s.x, y: m.size / 2 - s.y };
      const l = Math.hypot(toCenter.x, toCenter.y);
      const dx = toCenter.x / l, dy = toCenter.y / l;
      for (let k = 0; k < 6; k++) {
        const ang = (k - 2.5) * 0.45;
        const ux = dx * Math.cos(ang) - dy * Math.sin(ang), uy = dx * Math.sin(ang) + dy * Math.cos(ang);
        this.spawnUnit(f.worker, i, s.x + ux * 4.2, s.y + uy * 4.2);
      }
      this.spawnUnit(f.scout, i, s.x + dx * 5.5, s.y + dy * 5.5);
    });
  }

  kill(id: number, killerOwner = -1) {
    if (!this.alive[id]) return;
    const k = this.kind[id];
    const owner = this.owner[id];
    const e = this.ext[id];
    this.events.push({ type: 'death', id, owner, def: this.defName(id), x: this.x[id], y: this.y[id], kind: k === Kind.Structure ? 'structure' : k === Kind.Unit ? 'unit' : 'neutral' });
    this.alive[id] = 0;
    if (e.cells.length && (k === Kind.Structure || k === Kind.Barrier || k === Kind.Ore || k === Kind.Pylon || k === Kind.Vent)) this.nav.setOcc(e.cells, 0);
    if (k === Kind.Structure) {
      const d = this.sdef(id);
      if (owner >= 0) this.players[owner].stats.structuresLost++;
      if (d.isExtractor && e.amount > 0) {
        // the vent survives the extractor
        const vid = this.spawnNeutral(Kind.Vent, this.x[id], this.y[id], e.cells, 1, 1.5);
        this.ext[vid].amount = e.amount; this.ext[vid].maxAmount = e.maxAmount; this.ext[vid].base = e.base;
        this.events.push({ type: 'spawn', id: vid, owner: -1, def: 'vent', x: this.x[id], y: this.y[id] });
      }
      // refund queued items? (lost with the building, as in most RTS games)
      if (owner >= 0) this.addTimeline(owner, `${d.name} destroyed`, 'combat');
    } else if (k === Kind.Unit) {
      if (owner >= 0) this.players[owner].stats.unitsLost++;
      if (e.gatherNode >= 0 && this.alive[e.gatherNode] && this.ext[e.gatherNode].miner === id) this.ext[e.gatherNode].miner = -1;
    } else if (k === Kind.Barrier) {
      this.events.push({ type: 'barrier', id, x: this.x[id], y: this.y[id] });
      this.addTimeline(-1, 'A crystal barrier shattered: the lower route is open', 'map');
      for (const p of this.players) this.alert(p.id, 'info', 'Crystal barrier destroyed — central route open', this.x[id], this.y[id]);
    }
    if (killerOwner >= 0 && owner >= 0 && killerOwner !== owner) this.players[killerOwner].stats.kills++;
    e.deathTick = this.tick;
  }

  // ------------------------------------------------------------------ helpers
  dist(a: number, b: number) { return Math.hypot(this.x[a] - this.x[b], this.y[a] - this.y[b]); }
  /** distance between entity edges */
  edgeDist(a: number, b: number) {
    const kb = this.kind[b], ka = this.kind[a];
    if (kb === Kind.Structure || kb === Kind.Barrier) return Math.max(0, this.pointToFootprint(b, this.x[a], this.y[a]) - this.radius[a]);
    if (ka === Kind.Structure || ka === Kind.Barrier) return Math.max(0, this.pointToFootprint(a, this.x[b], this.y[b]) - this.radius[b]);
    return Math.max(0, this.dist(a, b) - this.radius[a] - this.radius[b]);
  }
  /** distance from a point to the solid footprint of a structure or barrier */
  pointToFootprint(id: number, x: number, y: number): number {
    if (this.kind[id] === Kind.Structure) {
      const h = this.sdef(id).size / 2;
      const dx = Math.max(Math.abs(x - this.x[id]) - h, 0), dy = Math.max(Math.abs(y - this.y[id]) - h, 0);
      return Math.hypot(dx, dy);
    }
    const n = this.map.size;
    let best = 1e9;
    for (const c of this.ext[id].cells) {
      const cx = (c % n) + 0.5, cy = ((c / n) | 0) + 0.5;
      const dx = Math.max(Math.abs(x - cx) - 0.5, 0), dy = Math.max(Math.abs(y - cy) - 0.5, 0);
      best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
  }

  alert(player: number, kind: AlertKind, text: string, x?: number, y?: number) {
    this.events.push({ type: 'alert', owner: player, kind, text, x, y });
  }
  addTimeline(player: number, text: string, kind: TimelineEvent['kind']) {
    this.timeline.push({ tick: this.tick, player, text, kind });
  }

  isVisibleTo(player: number, id: number): boolean {
    if (this.owner[id] === player) return true;
    const n = this.map.size;
    const c = Math.floor(this.y[id]) * n + Math.floor(this.x[id]);
    const pv = this.players[player].visible;
    if (this.kind[id] === Kind.Structure || this.kind[id] === Kind.Barrier) {
      // any footprint cell visible
      if (pv[c]) return true;
      const cells = this.ext[id].cells;
      for (let k = 0; k < cells.length; k += 2) if (pv[cells[k]]) return true;
      return false;
    }
    if (!pv[c]) return false;
    if (this.ext[id].cloaked) return this.detectedBy(player, this.x[id], this.y[id]);
    return true;
  }

  detectedBy(player: number, x: number, y: number): boolean {
    for (let j = 1; j < this.nextId; j++) {
      if (!this.alive[j] || this.owner[j] !== player) continue;
      let r = 0;
      if (this.kind[j] === Kind.Unit) r = this.udef(j).detector ?? 0;
      else if (this.kind[j] === Kind.Structure && this.built[j]) r = this.sdef(j).detector ?? 0;
      if (r > 0 && Math.hypot(this.x[j] - x, this.y[j] - y) <= r) return true;
    }
    return false;
  }

  hasRequirement(player: number, req: string): boolean {
    if (TECHS[req]) return this.players[player].techs.has(req);
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] && this.owner[id] === player && this.kind[id] === Kind.Structure && this.built[id] && STRUCTURE_IDS[this.def[id]] === req) return true;
    }
    return false;
  }
  missingRequirements(player: number, reqs: string[]): string[] {
    return reqs.filter((r) => !this.hasRequirement(player, r));
  }

  recomputeSupply() {
    for (const p of this.players) { p.supplyUsed = 0; p.supplyCap = 0; }
    for (let id = 1; id < this.nextId; id++) {
      if (!this.alive[id]) continue;
      const o = this.owner[id];
      if (o < 0) continue;
      const k = this.kind[id];
      if (k === Kind.Unit) this.players[o].supplyUsed += this.udef(id).supply;
      else if (k === Kind.Structure) {
        if (this.built[id]) this.players[o].supplyCap += this.sdef(id).supply;
        for (const q of this.ext[id].queue) if (q.started && q.kind === 'unit') this.players[o].supplyUsed += UNITS[q.def].supply;
      }
    }
    for (const p of this.players) p.supplyCap = Math.min(100, p.supplyCap);
  }

  inBuildZone(player: number, x: number, y: number): boolean {
    for (let id = 1; id < this.nextId; id++) {
      if (!this.alive[id] || this.owner[id] !== player || this.kind[id] !== Kind.Structure || !this.built[id]) continue;
      const r = this.sdef(id).zoneRadius;
      if (r && Math.hypot(this.x[id] - x, this.y[id] - y) <= r) return true;
    }
    return false;
  }

  /** Placement validation used by both the UI preview and command execution. */
  checkPlacement(player: number, defId: string, tx: number, ty: number, ignoreUnit = -1): PlacementResult {
    const d = STRUCTURES[defId];
    const n = this.map.size;
    const res: PlacementResult = { ok: true, reason: '', cells: [] };
    if (!d || d.faction !== this.players[player].faction) return { ok: false, reason: 'Unknown structure', cells: [] };
    const fail = (r: string) => { if (res.ok) { res.ok = false; res.reason = r; } };
    if (d.isExtractor) {
      // must sit exactly on a free vent
      let vent = -1;
      for (let id = 1; id < this.nextId; id++) {
        if (this.alive[id] && this.kind[id] === Kind.Vent && Math.abs(this.x[id] - (tx + 1.5)) < 0.01 && Math.abs(this.y[id] - (ty + 1.5)) < 0.01) vent = id;
      }
      for (const c of this.footprint(tx, ty, 3)) res.cells.push({ c, ok: vent >= 0 });
      if (vent < 0) fail('Must be placed on a Flux vent');
      else if (!this.players[player].explored[Math.floor(ty + 1) * n + tx + 1]) fail('Location unexplored');
      return res;
    }
    const cx = tx + d.size / 2, cy = ty + d.size / 2;
    for (let y = ty; y < ty + d.size; y++) for (let x = tx; x < tx + d.size; x++) {
      let ok = true;
      if (x < 2 || y < 2 || x >= n - 2 || y >= n - 2) { ok = false; fail('Out of bounds'); }
      else {
        const c = y * n + x;
        if (!(this.map.flags[c] & F_BUILD)) { ok = false; fail('Terrain is not buildable (slope, ramp, brush or void)'); }
        else if (this.nav.occ[c]) { ok = false; fail('Blocked by another object'); }
        else if (!this.players[player].explored[c]) { ok = false; fail('Location unexplored'); }
      }
      res.cells.push({ c: y * n + x, ok });
    }
    // keep clear of resource nodes so harvest lanes are not walled off
    const clearR = d.isHQ ? 4.2 : 2.5;
    for (let id = 1; id < this.nextId; id++) {
      const k = this.kind[id];
      if (!this.alive[id]) continue;
      if (k === Kind.Ore || k === Kind.Vent) {
        const ddx = Math.max(Math.abs(this.x[id] - cx) - d.size / 2, 0), ddy = Math.max(Math.abs(this.y[id] - cy) - d.size / 2, 0);
        if (Math.hypot(ddx, ddy) < clearR) fail('Too close to a resource node');
      } else if (k === Kind.Unit && id !== ignoreUnit && this.owner[id] !== player && !this.isHover(id)) {
        if (Math.abs(this.x[id] - cx) < d.size / 2 + 0.3 && Math.abs(this.y[id] - cy) < d.size / 2 + 0.3) fail('Enemy unit in the way');
      }
    }
    if (!d.isHQ && !this.inBuildZone(player, cx, cy)) fail(this.players[player].faction === 'helix' ? 'Outside the Grid construction field' : 'Outside the living root zone');
    if (res.ok) for (const c of res.cells) c.ok = true;
    return res;
  }

  /** snap a world point to the top-left cell of a structure footprint */
  snapFootprint(defId: string, x: number, y: number): { tx: number; ty: number } {
    const d = STRUCTURES[defId];
    if (d.isExtractor) {
      // snap to the nearest vent
      let best = -1, bd = 1e9;
      for (let id = 1; id < this.nextId; id++) {
        if (this.alive[id] && this.kind[id] === Kind.Vent) { const dd = Math.hypot(this.x[id] - x, this.y[id] - y); if (dd < bd) { bd = dd; best = id; } }
      }
      if (best >= 0 && bd < 5) return { tx: Math.round(this.x[best] - 1.5), ty: Math.round(this.y[best] - 1.5) };
    }
    return { tx: Math.round(x - d.size / 2), ty: Math.round(y - d.size / 2) };
  }

  // ------------------------------------------------------------------ commands
  /** Queue a command for its intended tick (client/AI entry point). Returns the command. */
  issue(c: Omit<Command, 'seq' | 'tick'> & { tick?: number }): Command {
    const cmd: Command = { ...c, seq: ++this.seqCounter, tick: Math.max(this.tick + 1, c.tick ?? this.tick + INPUT_DELAY_TICKS) } as Command;
    this.pending.push(cmd);
    return cmd;
  }
  /** Insert a pre-recorded command (replay). */
  inject(c: Command) { this.pending.push(c); }

  private applyCommands() {
    if (!this.pending.length) return;
    const now: Command[] = [];
    const later: Command[] = [];
    for (const c of this.pending) (c.tick <= this.tick ? now : later).push(c);
    this.pending = later;
    now.sort((a, b) => a.tick - b.tick || a.player - b.player || a.seq - b.seq);
    for (const c of now) {
      if (this.validateAndApply(c)) this.commandLog.push({ ...c, tick: this.tick });
    }
  }

  private validateAndApply(c: Command): boolean {
    const p = this.players[c.player];
    if (!p || p.defeated || this.over) return false;
    // command quota (rate limit)
    p.cmdWindow = p.cmdWindow.filter((t) => t > this.tick - TPS);
    if (p.cmdWindow.length >= COMMAND_QUOTA_PER_SEC) return false;
    p.cmdWindow.push(this.tick);
    // ownership validation
    const ids = c.ids.filter((id) => id > 0 && id < this.nextId && this.alive[id] && this.owner[id] === c.player);
    const units = ids.filter((id) => this.kind[id] === Kind.Unit);
    const structs = ids.filter((id) => this.kind[id] === Kind.Structure);
    const q = !!c.queued;
    switch (c.kind) {
      case 'move': case 'attackMove': case 'patrol': {
        if (c.x === undefined || c.y === undefined) return false;
        const x = Math.max(1, Math.min(this.map.size - 1, c.x)), y = Math.max(1, Math.min(this.map.size - 1, c.y));
        if (!units.length) { if (structs.length) this.setRally(structs, x, y, -1); return structs.length > 0; }
        this.groupMove(units, x, y, c.kind, q, !!c.force);
        return true;
      }
      case 'attack': {
        const t = c.target ?? -1;
        if (!units.length && !structs.length) return false;
        if (!(t > 0 && this.alive[t] && this.isVisibleTo(c.player, t))) return false;
        if (this.owner[t] === c.player) return false;
        for (const u of units) if (this.weaponOf(u)) this.pushOrder(u, { t: 'attack', target: t }, q);
        for (const s of structs) if (this.weaponOf(s)) this.ext[s].focusTarget = t;
        return true;
      }
      case 'gather': {
        const t = c.target ?? -1;
        if (!(t > 0 && this.alive[t])) return false;
        const k = this.kind[t];
        const ok = k === Kind.Ore || (k === Kind.Structure && this.owner[t] === c.player && this.sdef(t).isExtractor);
        if (!ok) return false;
        if (!units.length && structs.length) { this.setRally(structs, this.x[t], this.y[t], t); return true; }
        for (const u of units) {
          if (this.udef(u).worker) this.pushOrder(u, { t: 'gather', target: t }, q);
          else this.pushOrder(u, { t: 'move', x: this.x[t], y: this.y[t], attack: false, force: false }, q);
        }
        return true;
      }
      case 'build': {
        const d = c.def ? STRUCTURES[c.def] : undefined;
        if (!d || d.faction !== p.faction || c.x === undefined || c.y === undefined) return false;
        const worker = units.find((u) => this.udef(u).worker);
        if (worker === undefined) return false;
        const miss = this.missingRequirements(c.player, d.requires);
        if (miss.length) { this.alert(c.player, 'invalid', `Requires ${miss.map((m) => STRUCTURES[m]?.name ?? TECHS[m]?.name).join(', ')}`); return false; }
        if (p.ore < d.cost.ore || p.flux < d.cost.flux) { this.alert(c.player, 'resources', p.ore < d.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); return false; }
        const pl = this.checkPlacement(c.player, d.id, Math.round(c.x), Math.round(c.y), worker);
        if (!pl.ok) { this.alert(c.player, 'invalid', pl.reason); return false; }
        const e = this.ext[worker];
        if (!q && e.orders[0]?.t === 'gather') e.resumeGather = (e.orders[0] as { target: number }).target;
        else if (!q) e.resumeGather = -1;
        this.pushOrder(worker, { t: 'build', def: d.id, tx: Math.round(c.x), ty: Math.round(c.y) }, q);
        return true;
      }
      case 'train': {
        const ud = c.def ? UNITS[c.def] : undefined;
        if (!ud || ud.faction !== p.faction) return false;
        const cands = structs.filter((s) => this.built[s] && this.sdef(s).trains.includes(ud.id) && this.ext[s].queue.length < 5);
        if (!cands.length) return false;
        const miss = this.missingRequirements(c.player, ud.requires);
        if (miss.length) { this.alert(c.player, 'invalid', `Requires ${miss.map((m) => STRUCTURES[m]?.name ?? TECHS[m]?.name).join(', ')}`); return false; }
        if (p.ore < ud.cost.ore || p.flux < ud.cost.flux) { this.alert(c.player, 'resources', p.ore < ud.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); return false; }
        cands.sort((a, b) => this.ext[a].queue.length - this.ext[b].queue.length || a - b);
        const s = cands[0];
        p.ore -= ud.cost.ore; p.flux -= ud.cost.flux;
        this.ext[s].queue.push({ kind: 'unit', def: ud.id, progress: 0, total: ud.buildTime, started: false, paused: '' });
        this.events.push({ type: 'queued', id: s, owner: c.player, def: ud.id });
        return true;
      }
      case 'research': {
        const td = c.def ? TECHS[c.def] : undefined;
        if (!td || td.faction !== p.faction) return false;
        if (p.techs.has(td.id) || this.isResearching(c.player, td.id)) return false;
        const cands = structs.filter((s) => this.built[s] && this.sdef(s).researches.includes(td.id) && this.ext[s].queue.length < 5);
        if (!cands.length) return false;
        const miss = this.missingRequirements(c.player, td.requires).filter((m) => !this.isResearching(c.player, m) || true);
        if (miss.length) { this.alert(c.player, 'invalid', `Requires ${miss.map((m) => TECHS[m]?.name ?? m).join(', ')}`); return false; }
        if (p.ore < td.cost.ore || p.flux < td.cost.flux) { this.alert(c.player, 'resources', p.ore < td.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); return false; }
        cands.sort((a, b) => this.ext[a].queue.length - this.ext[b].queue.length || a - b);
        p.ore -= td.cost.ore; p.flux -= td.cost.flux;
        this.ext[cands[0]].queue.push({ kind: 'tech', def: td.id, progress: 0, total: td.time, started: false, paused: '' });
        this.events.push({ type: 'queued', id: cands[0], owner: c.player, def: td.id });
        return true;
      }
      case 'cancel': {
        const s = structs[0];
        if (s === undefined) return false;
        const e = this.ext[s];
        const d = this.sdef(s);
        if (!this.built[s]) {
          // cancel construction: 75% refund
          p.ore += Math.floor(d.cost.ore * 0.75); p.flux += Math.floor(d.cost.flux * 0.75);
          this.kill(s);
          this.players[c.player].stats.structuresLost--;
          return true;
        }
        const idx = c.index ?? e.queue.length - 1;
        const item = e.queue[idx];
        if (!item) return false;
        const cost = item.kind === 'unit' ? UNITS[item.def].cost : TECHS[item.def].cost;
        p.ore += cost.ore; p.flux += cost.flux;
        e.queue.splice(idx, 1);
        return true;
      }
      case 'rally': {
        if (!structs.length || c.x === undefined || c.y === undefined) return false;
        this.setRally(structs, c.x, c.y, c.target ?? -1);
        return true;
      }
      case 'stop': {
        for (const u of units) this.stopUnit(u);
        for (const s of structs) this.ext[s].focusTarget = -1;
        return units.length + structs.length > 0;
      }
      case 'hold': {
        for (const u of units) { this.stopUnit(u); this.ext[u].orders = [{ t: 'hold' }]; }
        return units.length > 0;
      }
      case 'guard': {
        const t = c.target ?? -1;
        if (!(t > 0 && this.alive[t] && this.owner[t] === c.player)) return false;
        for (const u of units) if (u !== t) this.pushOrder(u, { t: 'guard', target: t }, q);
        return true;
      }
      case 'repair': {
        const t = c.target ?? -1;
        if (!(t > 0 && this.alive[t] && this.owner[t] === c.player)) return false;
        const mech = this.tagsOf(t).includes('Mechanical');
        let any = false;
        for (const u of units) if (this.udef(u).id === 'fabricator' && mech && u !== t) { this.pushOrder(u, { t: 'repair', target: t }, q); any = true; }
        return any;
      }
      case 'capture': {
        const t = c.target ?? -1;
        if (!(t > 0 && this.alive[t] && this.kind[t] === Kind.Pylon)) return false;
        for (const u of units) this.pushOrder(u, { t: 'capture', target: t }, q);
        return units.length > 0;
      }
      case 'ability': {
        const ab = c.def ? ABILITIES[c.def] : undefined;
        if (!ab) return false;
        const casters = units.filter((u) => this.udef(u).abilities.includes(ab.id));
        if (!casters.length) return false;
        if (ab.target === 'toggle') {
          for (const u of casters) this.toggleAbility(u, ab.id);
          return true;
        }
        // only one caster per point/unit cast (the closest ready one), others ignore
        const tx = c.target !== undefined && this.alive[c.target] ? this.x[c.target] : c.x ?? 0;
        const ty = c.target !== undefined && this.alive[c.target] ? this.y[c.target] : c.y ?? 0;
        const ready = casters.filter((u) => (this.ext[u].abilityReady[ab.id] ?? 0) <= this.tick && this.ext[u].energy >= (ab.energy ?? 0));
        if (!ready.length) { this.alert(c.player, 'invalid', ab.energy ? 'Not enough energy' : 'Ability is cooling down'); return false; }
        ready.sort((a, b) => Math.hypot(this.x[a] - tx, this.y[a] - ty) - Math.hypot(this.x[b] - tx, this.y[b] - ty) || a - b);
        this.pushOrder(ready[0], { t: 'ability', ability: ab.id, x: c.x ?? tx, y: c.y ?? ty, target: c.target ?? -1 }, q);
        return true;
      }
      case 'surrender': {
        this.defeat(c.player);
        return true;
      }
    }
    return false;
  }

  isResearching(player: number, tech: string): boolean {
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] && this.owner[id] === player && this.kind[id] === Kind.Structure && this.ext[id].queue.some((q) => q.def === tech)) return true;
    }
    return false;
  }

  private setRally(structs: number[], x: number, y: number, target: number) {
    for (const s of structs) { const e = this.ext[s]; e.hasRally = true; e.rallyX = x; e.rallyY = y; e.rallyTarget = target; }
  }

  stopUnit(u: number) {
    const e = this.ext[u];
    this.releaseNode(u);
    e.orders = [];
    e.hasGoal = false;
    e.windup = 0;
    e.phase = 'none';
    e.focusTarget = -1;
  }
  private releaseNode(u: number) {
    const e = this.ext[u];
    if (e.gatherNode >= 0 && this.alive[e.gatherNode] && this.ext[e.gatherNode].miner === u) this.ext[e.gatherNode].miner = -1;
  }

  pushOrder(u: number, o: Order, queued: boolean) {
    const e = this.ext[u];
    if (!queued) {
      this.releaseNode(u);
      e.orders = [o];
      e.hasGoal = false;
      e.phase = 'none';
      e.windup = 0;
      e.focusTarget = -1;
      e.repaths = 0; e.pathFailed = false;
      if (o.t !== 'build') e.resumeGather = -1;
      if (e.braced && o.t !== 'attack' && o.t !== 'hold') this.toggleAbility(u, 'brace');
      if (e.curled && o.t !== 'hold') this.toggleAbility(u, 'curl');
    } else {
      if (e.orders.length >= 16) return;
      e.orders.push(o);
    }
  }

  private toggleAbility(u: number, ab: string) {
    const e = this.ext[u];
    if (e.toggleTicks > 0) return;
    if (this.tick < e.silencedUntil) return;
    if (ab === 'brace') { e.braced = !e.braced; e.toggleTicks = 15; e.hasGoal = false; }
    if (ab === 'curl') { e.curled = !e.curled; e.toggleTicks = 12; e.hasGoal = false; e.windup = 0; }
    this.events.push({ type: 'ability', id: u, owner: this.owner[u], kind: ab, value: (ab === 'brace' ? e.braced : e.curled) ? 1 : 0, x: this.x[u], y: this.y[u] });
  }

  /** shared-corridor group move: one flow field per destination, formation slots per unit */
  private groupMove(units: number[], x: number, y: number, kind: 'move' | 'attackMove' | 'patrol', queued: boolean, force: boolean) {
    const gid = this.groupCounter++;
    let cx = 0, cy = 0;
    for (const u of units) { cx += this.x[u]; cy += this.y[u]; }
    cx /= units.length; cy /= units.length;
    let maxR = 0;
    let area = 0;
    for (const u of units) { maxR = Math.max(maxR, Math.hypot(this.x[u] - cx, this.y[u] - cy)); area += (this.radius[u] * 2.2) ** 2; }
    const spread = Math.sqrt(area / Math.PI) + 0.6;
    const scale = maxR > spread ? spread / maxR : 1;
    this.groupSpread.set(gid, spread);
    const targetCell = this.nav.nearestPassable(Math.floor(x), Math.floor(y), 20);
    const n = this.map.size;
    const region = targetCell >= 0 ? this.nav.region[targetCell] : -1;
    for (const u of units) {
      let sx = x + (this.x[u] - cx) * scale;
      let sy = y + (this.y[u] - cy) * scale;
      if (units.length === 1) { sx = x; sy = y; }
      if (!this.isHover(u)) {
        const sc = Math.floor(sy) * n + Math.floor(sx);
        if (sx < 0 || sy < 0 || sx >= n || sy >= n || !this.nav.passableW(sx, sy) || this.nav.region[sc] !== region) {
          if (targetCell >= 0) { sx = (targetCell % n) + 0.5; sy = ((targetCell / n) | 0) + 0.5; } else { sx = x; sy = y; }
        }
      }
      // every unit in the group shares one flow field toward the group target cell (gc)
      const gc = units.length > 1 && targetCell >= 0 ? targetCell : undefined;
      const o: Order = kind === 'patrol'
        ? { t: 'patrol', x: sx, y: sy, ox: this.x[u], oy: this.y[u], gc }
        : { t: 'move', x: sx, y: sy, attack: kind === 'attackMove', force, gc };
      this.pushOrder(u, o, queued);
      if (!queued) this.ext[u].groupId = gid;
    }
    if (this.groupSpread.size > 256) { const k = this.groupSpread.keys().next().value; if (k !== undefined) this.groupSpread.delete(k); }
  }

  defeat(player: number) {
    const p = this.players[player];
    if (p.defeated) return;
    p.defeated = true;
    this.addTimeline(player, `${p.name} was defeated`, 'end');
    const remaining = this.players.filter((q) => !q.defeated);
    if (remaining.length <= 1 && !this.over) {
      this.over = true;
      this.winner = remaining.length ? remaining[0].id : -1;
      this.events.push({ type: 'gameover', owner: this.winner });
      this.sampleStats();
    }
  }

  // ------------------------------------------------------------------ tick
  step() {
    if (this.over) return;
    this.tick++;
    for (let id = 1; id < this.nextId; id++) { this.px[id] = this.x[id]; this.py[id] = this.y[id]; }
    this.applyCommands();
    this.rebuildSpatial();
    updateProduction(this);
    updateUnits(this);
    updateMovement(this);
    updateCombat(this);
    updateProjectiles(this);
    updateEffects(this);
    updateNeutrals(this);
    this.recomputeSupply();
    if (this.tick % 2 === 0) updateVision(this);
    if (this.tick >= LATE_GAME_TICK && (this.tick - LATE_GAME_TICK) % PULSE_PERIOD === 0) {
      this.revealUntil = this.tick + 60;
      this.events.push({ type: 'pulse', x: this.map.size / 2, y: this.map.size / 2 });
      if (this.tick === LATE_GAME_TICK) this.addTimeline(-1, 'Endgame: wells surge (+15% yield) and the center pulses every 90 s', 'map');
      for (const p of this.players) this.alert(p.id, 'info', 'Reveal pulse — the whole map is exposed', this.map.size / 2, this.map.size / 2);
    }
    if (this.tick % 20 === 0) this.checkVictory();
    if (this.tick % 200 === 0) this.sampleStats();
    if (this.tick % 100 === 0) this.hashes.push([this.tick, this.stateHash()]);
  }

  rebuildSpatial() {
    this.spatial.clear();
    for (let id = 1; id < this.nextId; id++) {
      if (!this.alive[id]) continue;
      const k = this.kind[id];
      if (k === Kind.Unit || k === Kind.Structure || k === Kind.Spike || k === Kind.Barrier) this.spatial.insert(id, this.x[id], this.y[id]);
    }
  }

  private checkVictory() {
    for (const p of this.players) {
      if (p.defeated) continue;
      let hq = 0;
      for (let id = 1; id < this.nextId; id++) {
        if (this.alive[id] && this.owner[id] === p.id && this.kind[id] === Kind.Structure && this.sdef(id).isHQ) hq++;
      }
      if (hq === 0) this.defeat(p.id);
    }
  }

  sampleStats() {
    for (const p of this.players) {
      let army = 0, workers = 0;
      for (let id = 1; id < this.nextId; id++) {
        if (!this.alive[id] || this.owner[id] !== p.id || this.kind[id] !== Kind.Unit) continue;
        const d = this.udef(id);
        if (d.worker) workers++; else army += d.cost.ore + d.cost.flux;
      }
      p.stats.samples.push({ tick: this.tick, army, workers, ore: p.stats.oreCollected, flux: p.stats.fluxCollected, supply: p.supplyUsed });
    }
  }

  stateHash(): number {
    const h = new Hasher();
    h.word(this.tick);
    for (let id = 1; id < this.nextId; id++) {
      if (!this.alive[id]) continue;
      h.word(id); h.word(this.kind[id]); h.word(this.def[id]); h.word(this.owner[id]);
      h.word(Math.round(this.x[id] * Q)); h.word(Math.round(this.y[id] * Q)); h.word(Math.round(this.hp[id] * 16));
    }
    for (const p of this.players) { h.word(Math.round(p.ore * 16)); h.word(Math.round(p.flux * 16)); h.word(p.techs.size); }
    h.word(this.projectiles.length);
    return h.value;
  }

  quantizePositions() {
    for (let id = 1; id < this.nextId; id++) {
      if (!this.alive[id]) continue;
      this.x[id] = quant(this.x[id]); this.y[id] = quant(this.y[id]);
      this.hp[id] = Math.round(this.hp[id] * 1024) / 1024;
    }
  }

  // ------------------------------------------------------------------ read models (UI / AI)
  structuresOf(player: number, defId?: string): number[] {
    const out: number[] = [];
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] && this.owner[id] === player && this.kind[id] === Kind.Structure && (!defId || STRUCTURE_IDS[this.def[id]] === defId)) out.push(id);
    }
    return out;
  }
  unitsOf(player: number, defId?: string): number[] {
    const out: number[] = [];
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] && this.owner[id] === player && this.kind[id] === Kind.Unit && (!defId || UNIT_IDS[this.def[id]] === defId)) out.push(id);
    }
    return out;
  }
  /** per-base economy read model: workers assigned, ideal saturation, efficiency */
  baseEconomy(player: number) {
    const out: { hq: number; x: number; y: number; workers: number; ideal: number; oreLeft: number; fluxWorkers: number; fluxIdeal: number; travel: number }[] = [];
    for (const hq of this.structuresOf(player)) {
      const d = this.sdef(hq);
      if (!d.isHQ) continue;
      let ideal = 0, oreLeft = 0, workers = 0, fluxWorkers = 0, fluxIdeal = 0, travelSum = 0, travelN = 0;
      for (let id = 1; id < this.nextId; id++) {
        if (!this.alive[id]) continue;
        const near = Math.hypot(this.x[id] - this.x[hq], this.y[id] - this.y[hq]) < 13;
        if (!near) continue;
        if (this.kind[id] === Kind.Ore) { ideal += 2; oreLeft += this.ext[id].amount; travelSum += Math.max(0, this.edgeDist(id, hq)); travelN++; }
        if (this.kind[id] === Kind.Structure && this.owner[id] === player && this.sdef(id).isExtractor && this.built[id]) fluxIdeal += 3;
      }
      for (const u of this.unitsOf(player)) {
        const e = this.ext[u];
        const o = e.orders[0];
        if (o?.t === 'gather' && this.alive[o.target] && Math.hypot(this.x[o.target] - this.x[hq], this.y[o.target] - this.y[hq]) < 13) {
          if (this.kind[o.target] === Kind.Ore) workers++; else fluxWorkers++;
        }
      }
      out.push({ hq, x: this.x[hq], y: this.y[hq], workers, ideal, oreLeft, fluxWorkers, fluxIdeal, travel: travelN ? travelSum / travelN : 0 });
    }
    return out;
  }
}

// late-bound system imports (avoid circular init order issues)
import { updateCombat, updateEffects, updateNeutrals, updateProjectiles } from './combat';
import { updateMovement } from './movement';
import { updateProduction, updateUnits } from './orders';
export { F_HOVER };
