// simulation-core: deterministic fixed-step (20 Hz) simulation. No rendering, no wall-clock time.
import { allDefs, allUpgrades, defIndex, factions, upgradeIndex, secToTicks, SIM_HZ, type FactionDef } from '../data';
import { Ext, TD } from './ext';
import { buildMap, heightAt, MAP_SIZE, type GameMap } from './map';
import { Nav } from './nav';
import { castVision, commitExplored, FOG_VISIBLE } from './vision';
import { Ord, type Command, type Effect, type Order, type PlayerStats, type Projectile, type QItem, type SimConfig, type SimEvent } from './types';
import { updateUnit, separateUnits } from './units';
import { nudgeOut } from './move';
import { updateStructure, stepProjectiles, stepEffects } from './combat';
import { createAI, type AIController } from '../ai/ai';

export const LATE_GAME_TICK = 18 * 60 * SIM_HZ;
const HB = 36; // hash buckets per axis (cell size 4)

export interface Player {
  id: number;
  faction: FactionDef;
  ore: number;
  flux: number;
  supplyUsed: number;
  supplyCap: number;
  upg: Uint8Array;
  vis: Uint8Array;
  seen: Uint8Array;
  stats: PlayerStats;
  ai: AIController | null;
  alive: boolean;
  atkBonus: number;
  armorBonus: number;
  alertT: number;
  unlocks: Set<string>;
}

export interface PlaceResult { ok: boolean; reason: string; ox: number; oy: number; w: number; h: number; vent: number }

export class Sim {
  cfg: SimConfig;
  map: GameMap;
  nav: Nav;
  tick = 0;
  cap = 2048;
  x = new Float32Array(this.cap);
  y = new Float32Array(this.cap);
  px = new Float32Array(this.cap);
  py = new Float32Array(this.cap);
  face = new Float32Array(this.cap);
  hp = new Float32Array(this.cap);
  owner = new Int8Array(this.cap);
  type = new Uint16Array(this.cap);
  alive = new Uint8Array(this.cap);
  ext: Ext[] = [];
  ids: number[] = [];
  nextId = 0;
  players: Player[] = [];
  projectiles: Projectile[] = [];
  effects: Effect[] = [];
  events: SimEvent[] = [];
  winner = -1;
  over = false;
  rngState: number;
  hashes: Array<[number, number]> = [];
  log: Command[] = [];
  queue: Command[] = [];
  seq = 0;
  hashHead = new Int32Array(HB * HB);
  hashNext = new Int32Array(this.cap);
  projId = 0;
  pulseUntil = 0;
  /** extra victory / mode hooks */
  tutorialDummyOwner = -1;
  /** optional section timers (tools/profile.ts) */
  prof: Record<string, number> | null = null;
  private lap(k: string, t0: number): number { const t = performance.now(); if (this.prof) this.prof[k] = (this.prof[k] ?? 0) + (t - t0); return t; }

  constructor(cfg: SimConfig) {
    this.cfg = cfg;
    this.rngState = cfg.seed >>> 0 || 1;
    this.map = buildMap();
    this.nav = new Nav(this.map);
    const N = this.map.size;
    for (let p = 0; p < 2; p++) {
      const f = factions[cfg.factions[p]];
      this.players.push({
        id: p, faction: f, ore: cfg.startOre ?? 300, flux: 0, supplyUsed: 0, supplyCap: 0,
        upg: new Uint8Array(allUpgrades.length), vis: new Uint8Array(N * N), seen: new Uint8Array(N * N),
        stats: { ore: 0, flux: 0, created: 0, lost: 0, killed: 0, structures: 0, structuresLost: 0, workersMax: 0, firstExpandTick: -1, armySamples: [], econSamples: [], timeline: [] },
        ai: null, alive: true, atkBonus: 0, armorBonus: 0, alertT: -9999, unlocks: new Set(),
      });
    }
    this.spawnMapEntities();
    for (let p = 0; p < 2; p++) this.spawnStart(p);
    for (let p = 0; p < 2; p++) {
      const d = cfg.ai[p];
      if (d) this.players[p].ai = createAI(this, p, d, !!cfg.passiveAi && p === 1);
    }
    this.updateVision();
  }

  // ---------- rng ----------
  rand(): number {
    let t = (this.rngState += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- entity management ----------
  private grow() {
    const nc = this.cap * 2;
    const g = <T extends Float32Array | Int8Array | Uint16Array | Uint8Array | Int32Array>(a: T): T => {
      const b = new (a.constructor as new (n: number) => T)(nc);
      b.set(a);
      return b;
    };
    this.x = g(this.x); this.y = g(this.y); this.px = g(this.px); this.py = g(this.py); this.face = g(this.face); this.hp = g(this.hp);
    this.owner = g(this.owner); this.type = g(this.type); this.alive = g(this.alive); this.hashNext = g(this.hashNext);
    this.cap = nc;
  }

  spawn(typeIdx: number, owner: number, x: number, y: number, o: { done?: boolean; face?: number; amount?: number; ox?: number; oy?: number; w?: number; h?: number } = {}): number {
    if (this.nextId >= this.cap) this.grow();
    const id = this.nextId++;
    const td = TD[typeIdx];
    const e = new Ext();
    this.ext[id] = e;
    this.type[id] = typeIdx;
    this.owner[id] = owner;
    this.alive[id] = 1;
    this.x[id] = this.px[id] = x;
    this.y[id] = this.py[id] = y;
    this.face[id] = o.face ?? 0;
    this.hp[id] = td.maxHp;
    e.born = this.tick;
    e.energy = td.maxEnergy * 0.5;
    e.shield = td.def.shield ?? 0;
    e.homeX = x; e.homeY = y;
    if (td.isStruct || td.isNeutral) {
      const w = o.w ?? td.w, h = o.h ?? td.h;
      e.fw = w; e.fh = h;
      e.ox = o.ox ?? Math.round(x - w / 2);
      e.oy = o.oy ?? Math.round(y - h / 2);
      this.x[id] = this.px[id] = e.ox + w / 2;
      this.y[id] = this.py[id] = e.oy + h / 2;
      this.nav.setFootprint(e.ox, e.oy, w, h, 1);
      if (td.isStruct) {
        e.done = o.done !== false;
        if (!e.done) { e.total = Math.round(td.buildT * this.players[owner].faction.buildTimeMult); e.prog = 0; this.hp[id] = Math.max(8, td.maxHp * 0.1); }
        if (td.def.turret) this.face[id] = Math.atan2(MAP_SIZE / 2 - this.y[id], MAP_SIZE / 2 - this.x[id]);
      }
      if (td.isNeutral) {
        e.amount = e.maxAmount = o.amount ?? 0;
        if (td.def.id === 'watch_pylon') e.capOwner = -1;
      }
    }
    this.ids.push(id);
    if (owner >= 0) {
      const st = this.players[owner].stats;
      if (td.isUnit) { st.created++; if (td.isWorker) { /* workersMax tracked in sampling */ } }
      else if (td.isStruct) st.structures++;
    }
    return id;
  }

  kill(id: number, killer: number) {
    if (!this.alive[id]) return;
    const td = TD[this.type[id]];
    const e = this.ext[id];
    this.alive[id] = 0;
    this.hp[id] = 0;
    const own = this.owner[id];
    if (td.isStruct || td.isNeutral) {
      this.nav.setFootprint(e.ox, e.oy, e.fw, e.fh, -1);
    }
    this.events.push({ k: 'death', tick: this.tick, owner: own, x: this.x[id], y: this.y[id], id, a: this.type[id], b: this.face[id] });
    if (own >= 0) {
      const p = this.players[own];
      if (td.isUnit) p.stats.lost++;
      else if (td.isStruct) {
        p.stats.structuresLost++;
        p.stats.timeline.push({ tick: this.tick, text: `${td.def.name} destroyed`, kind: 'loss' });
      }
      if (killer >= 0 && killer !== own) this.players[killer].stats.killed++;
    }
    // free reservations on nodes
    if (td.isWorker && e.node >= 0 && this.ext[e.node] && this.ext[e.node].res === id) this.ext[e.node].res = -1;
  }

  // ---------- queries ----------
  def(id: number) { return TD[this.type[id]].def; }
  td(id: number) { return TD[this.type[id]]; }
  isEnemy(a: number, b: number) { const oa = this.owner[a], ob = this.owner[b]; return oa !== ob && oa >= 0 && ob >= 0; }
  cellIdx(x: number, y: number) {
    const N = this.map.size;
    return Math.min(N - 1, Math.max(0, Math.floor(y))) * N + Math.min(N - 1, Math.max(0, Math.floor(x)));
  }
  visibleTo(owner: number, id: number): boolean {
    if (owner < 0) return true;
    if (this.owner[id] === owner) return true;
    if (this.pulseActive()) return true;
    return this.players[owner].vis[this.cellIdx(this.x[id], this.y[id])] === FOG_VISIBLE;
  }
  cellVisible(owner: number, x: number, y: number) { return this.players[owner].vis[this.cellIdx(x, y)] === FOG_VISIBLE; }
  pulseActive() { return this.tick < this.pulseUntil; }
  countOf(owner: number, defId: string, doneOnly = true): number {
    const di = defIndex[defId];
    let n = 0;
    for (const id of this.ids) if (this.alive[id] && this.owner[id] === owner && this.type[id] === di && (!doneOnly || this.ext[id].done)) n++;
    return n;
  }
  hasBuilding(owner: number, defId: string): boolean {
    const di = defIndex[defId];
    for (const id of this.ids) if (this.alive[id] && this.owner[id] === owner && this.type[id] === di && this.ext[id].done) return true;
    return false;
  }
  hasUnlock(owner: number, key: string) { return this.players[owner].unlocks.has(key); }
  /** requirements (buildings and upgrades) satisfied? returns missing name or '' */
  missingReq(owner: number, requires?: string[]): string {
    if (!requires) return '';
    for (const r of requires) {
      if (r in upgradeIndex) {
        if (!this.players[owner].upg[upgradeIndex[r]]) return allUpgrades[upgradeIndex[r]].name;
      } else if (!this.hasBuilding(owner, r)) return allDefs[defIndex[r]].name;
    }
    return '';
  }

  rebuildHash() {
    this.hashHead.fill(-1);
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      const c = this.hashCell(this.x[id], this.y[id]);
      this.hashNext[id] = this.hashHead[c];
      this.hashHead[c] = id;
    }
  }
  private hashCell(x: number, y: number) {
    const hx = Math.min(HB - 1, Math.max(0, (x / 4) | 0)), hy = Math.min(HB - 1, Math.max(0, (y / 4) | 0));
    return hy * HB + hx;
  }
  /** iterate alive entities within radius r of (x,y); callback receives id. */
  near(x: number, y: number, r: number, fn: (id: number) => void) {
    const x0 = Math.max(0, ((x - r) / 4) | 0), x1 = Math.min(HB - 1, ((x + r) / 4) | 0);
    const y0 = Math.max(0, ((y - r) / 4) | 0), y1 = Math.min(HB - 1, ((y + r) / 4) | 0);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      for (let id = this.hashHead[cy * HB + cx]; id >= 0; id = this.hashNext[id]) {
        if (this.alive[id]) fn(id);
      }
    }
  }

  groundHeight(x: number, y: number) { return heightAt(this.map, x, y); }

  // ---------- setup ----------
  private spawnMapEntities() {
    const m = this.map;
    for (const r of m.resources) {
      const di = defIndex[r.kind === 'ore' ? 'ore_seam' : 'flux_vent'];
      this.spawn(di, -1, r.x, r.y, { amount: r.amount, ox: Math.round(r.x - r.w / 2), oy: Math.round(r.y - r.h / 2), w: r.w, h: r.h });
    }
    for (const p of m.pylons) this.spawn(defIndex['watch_pylon'], -1, p.x, p.y, {});
    for (const p of m.pods) this.spawn(defIndex['salvage_pod'], -1, p.x, p.y, {});
    for (const b of m.barriers) this.spawn(defIndex['crystal_barrier'], -1, b.x + b.w / 2, b.y + b.h / 2, { ox: b.x, oy: b.y, w: b.w, h: b.h });
  }

  private spawnStart(p: number) {
    const f = this.players[p].faction;
    const s = this.map.starts[p];
    const hall = this.spawn(defIndex[f.hall], p, s.x, s.y, {});
    const cx = this.x[hall], cy = this.y[hall];
    const mid = MAP_SIZE / 2;
    let ux = mid - cy, uy = mid - cx; // placeholder, fixed below
    ux = mid - cx; uy = mid - cy;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul; uy /= ul;
    // face the hall's "front" toward the middle of the map
    const baseX = cx + ux * 4.6, baseY = cy + uy * 4.6;
    const perpX = -uy, perpY = ux;
    const workers: number[] = [];
    const tut = this.cfg.mode === 'tutorial';
    const nWorkers = tut && p === 1 ? 3 : 6;
    for (let i = 0; i < nWorkers; i++) {
      const off = (i - 2.5) * 1.15;
      const w = this.spawn(defIndex[f.worker], p, baseX + perpX * off, baseY + perpY * off, { face: Math.atan2(uy, ux) });
      workers.push(w);
    }
    if (!(tut && p === 1)) this.spawn(defIndex[f.scout], p, baseX + perpX * 4.6, baseY + perpY * 4.6, { face: Math.atan2(uy, ux) });
    if (!tut) for (const w of workers) this.orderGatherNearest(w, hall);
    if (tut && p === 1) {
      // a small passive outpost for the tutorial's final objective
      for (let i = 0; i < 4; i++) this.spawn(defIndex['thornling'], p, baseX + perpX * (i - 1.5) * 1.3 + ux * 3, baseY + perpY * (i - 1.5) * 1.3 + uy * 3, { face: Math.atan2(uy, ux) });
      const pod = this.spawn(defIndex['needle_pod'], p, cx + ux * 9 + perpX * 4, cy + uy * 9 + perpY * 4, { done: true });
      void pod;
      this.spawn(defIndex['root_node'], p, cx - ux * 8 + perpX * 7, cy - uy * 8 + perpY * 7, { done: true });
    }
    this.ensureOpen(p);
    this.updateSupply();
    this.recordTimeline(p, 'Match start', 'start');
  }

  /** make sure spawned units do not stand on blocked cells */
  private ensureOpen(p: number) {
    for (const id of this.ids) {
      if (this.owner[id] !== p || !TD[this.type[id]].isUnit) continue;
      nudgeOut(this, id);
    }
  }

  orderGatherNearest(worker: number, near: number) {
    let best = -1, bd = 1e9;
    const hx = this.x[near], hy = this.y[near];
    for (const id of this.ids) {
      if (!this.alive[id] || this.owner[id] !== -1) continue;
      const di = this.type[id];
      if (di !== defIndex['ore_seam']) continue;
      const e = this.ext[id];
      if (e.amount <= 0) continue;
      const d = (this.x[id] - hx) ** 2 + (this.y[id] - hy) ** 2;
      if (d < bd) { bd = d; best = id; }
    }
    if (best >= 0) this.ext[worker].orders = [{ k: Ord.Gather, x: this.x[best], y: this.y[best], t: best, p: 0, r: 0, a: 0, b: 0 }];
  }

  recordTimeline(p: number, text: string, kind: string) {
    this.players[p].stats.timeline.push({ tick: this.tick, text, kind });
  }

  // ---------- command handling ----------
  /** Enqueue a command for a future tick (network-style). */
  submit(cmd: Command) {
    cmd.seq = this.seq++;
    cmd.tick = Math.max(cmd.tick ?? 0, this.tick + 1);
    this.queue.push(cmd);
  }
  /** Immediate application (AI and local UI with zero input delay). Logged for replays when `record`. */
  issue(cmd: Command, record = true) {
    cmd.seq = this.seq++;
    cmd.tick = this.tick;
    if (record) this.log.push(cmd);
    this.applyCommand(cmd);
  }

  private newOrder(k: Order['k'], x = 0, y = 0, t = -1, p = 0, r = 0.6): Order {
    return { k, x, y, t, p, r, a: x, b: y };
  }

  applyCommand(cmd: Command) {
    const pl = this.players[cmd.player];
    if (!pl || !pl.alive || this.over) return;
    switch (cmd.c) {
      case 'order': this.applyOrderCommand(cmd); break;
      case 'train': this.train(cmd.player, cmd.target ?? -1, cmd.param ?? -1); break;
      case 'research': this.research(cmd.player, cmd.target ?? -1, cmd.param ?? -1); break;
      case 'cancel': this.cancelQueue(cmd.player, cmd.target ?? -1, cmd.param ?? 0); break;
      case 'rally': {
        for (const id of cmd.ids ?? []) {
          if (!this.alive[id] || this.owner[id] !== cmd.player || !TD[this.type[id]].isStruct) continue;
          const e = this.ext[id];
          e.hasRally = true; e.rallyX = cmd.x ?? this.x[id]; e.rallyY = cmd.y ?? this.y[id]; e.rallyT = cmd.target ?? -1;
        }
        break;
      }
      case 'surrender': this.defeat(cmd.player); break;
    }
  }

  private applyOrderCommand(cmd: Command) {
    const ids = cmd.ids ?? [];
    const ord = cmd.ord!;
    const x = cmd.x ?? 0, y = cmd.y ?? 0, t = cmd.target ?? -1;
    let n = 0;
    // build orders go to a single (nearest) worker; formation slots for group moves
    if (ord === 'build') {
      const di = cmd.param ?? -1;
      if (di < 0 || !allDefs[di]) return;
      const td = TD[di];
      const f = this.players[cmd.player].faction;
      if (!td.isStruct || !f.structures.includes(td.def.id)) return;
      if (this.missingReq(cmd.player, td.def.requires)) { this.alert(cmd.player, 'invalid', x, y, `Requires ${this.missingReq(cmd.player, td.def.requires)}`); return; }
      const pl = this.players[cmd.player];
      if (pl.ore < td.def.cost.ore || pl.flux < td.def.cost.flux) { this.alert(cmd.player, 'invalid', x, y, pl.ore < td.def.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); return; }
      let best = -1, bd = 1e9;
      for (const id of ids) {
        if (!this.alive[id] || this.owner[id] !== cmd.player || !TD[this.type[id]].isWorker) continue;
        const e = this.ext[id];
        const d = Math.hypot(this.x[id] - x, this.y[id] - y) + (e.orders.length ? 8 : 0);
        if (d < bd) { bd = d; best = id; }
      }
      if (best < 0) return;
      const chk = this.canPlace(cmd.player, di, x, y);
      if (!chk.ok) { this.alert(cmd.player, 'invalid', x, y, chk.reason); return; }
      const e = this.ext[best];
      const o = this.newOrder(Ord.Build, chk.ox + chk.w / 2, chk.oy + chk.h / 2, -1, di, td.w / 2 + 1.1);
      this.pushOrder(best, o, !!cmd.queue);
      void e;
      return;
    }
    const movers: number[] = [];
    for (const id of ids) {
      if (!this.alive[id] || this.owner[id] !== cmd.player) continue;
      if (!TD[this.type[id]].isUnit) continue;
      movers.push(id);
    }
    if (!movers.length) return;
    const slots = (ord === 'move' || ord === 'attackMove' || ord === 'patrol') && movers.length > 1 ? this.formationSlots(x, y, movers.length, movers) : null;
    for (let i = 0; i < movers.length; i++) {
      const id = movers[i];
      const e = this.ext[id];
      const sx = slots ? slots[i].x : x, sy = slots ? slots[i].y : y;
      let o: Order | null = null;
      switch (ord) {
        case 'move': o = this.newOrder(Ord.Move, sx, sy, -1, cmd.force ? 1 : 0, slots ? 0.55 : 0.5); break;
        case 'attackMove': o = this.newOrder(Ord.AttackMove, sx, sy, -1, 0, slots ? 0.9 : 0.6); break;
        case 'patrol': o = this.newOrder(Ord.Patrol, sx, sy, -1, 0, 0.9); o.a = this.x[id]; o.b = this.y[id]; break;
        case 'attack': if (t >= 0 && this.alive[t]) o = this.newOrder(Ord.Attack, this.x[t], this.y[t], t, 0, 0); break;
        case 'stop': e.orders = []; e.target = -1; e.wind = 0; if (e.mode && TD[this.type[id]].def.id !== 'bulwark') { /* keep curl */ } continue;
        case 'hold': e.orders = [this.newOrder(Ord.Hold, this.x[id], this.y[id], -1, 0, 0)]; e.target = -1; continue;
        case 'gather': {
          if (!TD[this.type[id]].isWorker || t < 0 || !this.alive[t]) continue;
          o = this.newOrder(Ord.Gather, this.x[t], this.y[t], t, 0, 0);
          break;
        }
        case 'repair': {
          if (!TD[this.type[id]].isWorker || t < 0 || !this.alive[t] || this.owner[t] !== cmd.player) continue;
          const tgt = this.ext[t];
          if (TD[this.type[t]].isStruct && !tgt.done) o = this.newOrder(Ord.Resume, this.x[t], this.y[t], t, 0, 0);
          else if (this.players[cmd.player].faction.buildMode === 'attend') o = this.newOrder(Ord.Repair, this.x[t], this.y[t], t, 0, 0);
          break;
        }
        case 'capture': if (t >= 0 && this.alive[t] && TD[this.type[t]].def.id === 'watch_pylon') o = this.newOrder(Ord.Capture, this.x[t], this.y[t], t, 0, 0); break;
        case 'ability': {
          const td = TD[this.type[id]];
          const ab = td.def.abilities?.[cmd.param ?? 0];
          if (!ab) continue;
          if (ab.target === 'toggle') { this.toggleAbility(id); n++; continue; }
          o = this.newOrder(Ord.Ability, x, y, t, cmd.param ?? 0, 0);
          break;
        }
      }
      if (!o) continue;
      n++;
      this.pushOrder(id, o, !!cmd.queue);
    }
    if (n > 0 && cmd.player === 0) this.events.push({ k: 'order', tick: this.tick, owner: cmd.player, x, y, a: ord === 'attack' || ord === 'attackMove' ? 1 : 0 });
  }

  pushOrder(id: number, o: Order, queue: boolean) {
    const e = this.ext[id];
    const td = TD[this.type[id]];
    if (!queue) {
      // new order cancels construction attendance etc.
      e.orders.length = 0;
      e.target = -1;
      e.wind = 0;
      e.gkey = -1;
      e.stuck = 0;
      e.hasSlot = false;
      if (o.k === Ord.Move || o.k === Ord.Gather || o.k === Ord.AttackMove) {
        if (td.def.id === 'bulwark') e.mode = 0;
        if (td.def.id === 'carapace_guard') e.mode = 0;
      }
      if (e.wph === 1 && e.node >= 0 && this.ext[e.node]?.res === id) this.ext[e.node].res = -1;
      e.wph = 0;
      if (o.k !== Ord.Gather) e.node = o.k === Ord.Build ? e.node : -1;
      if (e.chT > 0) e.chT = 0;
    }
    if (e.orders.length < 24) e.orders.push(o);
  }

  toggleAbility(id: number) {
    const e = this.ext[id];
    const td = TD[this.type[id]];
    if (td.def.id === 'bulwark' || td.def.id === 'carapace_guard') {
      if (e.mode > 0) e.mode = 0;
      else if (this.tick >= e.silUntil) { e.mode = 1; e.orders = []; e.target = -1; }
    }
  }

  /** sensible formation slots on walkable cells around a point; faster/bigger units get the outer ring */
  formationSlots(x: number, y: number, n: number, ids: number[]): Array<{ x: number; y: number }> {
    const target = this.nav.nearestWalkable(x, y, 10) ?? { x, y };
    const out: Array<{ x: number; y: number }> = [];
    const spacing = 1.5;
    // spiral rings
    out.push({ x: target.x, y: target.y });
    let ring = 1;
    while (out.length < n && ring < 14) {
      const count = Math.max(6, Math.round((2 * Math.PI * ring * spacing) / spacing));
      for (let k = 0; k < count && out.length < n + 20; k++) {
        const a = (k / count) * Math.PI * 2 + ring * 0.7;
        const px = target.x + Math.cos(a) * ring * spacing, py = target.y + Math.sin(a) * ring * spacing;
        if (this.nav.fits(px, py, 0.5) && this.nav.clear(target.x, target.y, px, py, 0.4)) out.push({ x: px, y: py });
      }
      ring++;
    }
    while (out.length < n) out.push({ x: target.x, y: target.y });
    // greedy assignment: nearest unit to nearest slot, deterministic order
    const res: Array<{ x: number; y: number }> = new Array(n);
    const used = new Array(out.length).fill(false);
    const order = ids.map((id, i) => i).sort((a, b) => {
      const da = (this.x[ids[a]] - target.x) ** 2 + (this.y[ids[a]] - target.y) ** 2;
      const db = (this.x[ids[b]] - target.x) ** 2 + (this.y[ids[b]] - target.y) ** 2;
      return da - db || ids[a] - ids[b];
    });
    for (const i of order) {
      let bi = -1, bd = 1e12;
      for (let s = 0; s < Math.min(out.length, n + 12); s++) {
        if (used[s]) continue;
        const d = (this.x[ids[i]] - out[s].x) ** 2 + (this.y[ids[i]] - out[s].y) ** 2 + s * 0.4;
        if (d < bd) { bd = d; bi = s; }
      }
      used[bi] = true;
      res[i] = out[bi];
    }
    return res;
  }

  // ---------- placement ----------
  canPlace(owner: number, defIdx: number, cx: number, cy: number): PlaceResult {
    const td = TD[defIdx];
    const w = td.w, h = td.h;
    let ox = Math.round(cx - w / 2), oy = Math.round(cy - h / 2);
    const N = this.map.size;
    const res = (ok: boolean, reason: string, vent = -1): PlaceResult => ({ ok, reason, ox, oy, w, h, vent });
    if (td.def.onVent) {
      let best = -1, bd = 4.5;
      for (const id of this.ids) {
        if (!this.alive[id] || this.type[id] !== defIndex['flux_vent']) continue;
        const d = Math.hypot(this.x[id] - cx, this.y[id] - cy);
        if (d < bd) { bd = d; best = id; }
      }
      if (best < 0) return res(false, 'Must be built on a Flux Vent');
      const v = this.ext[best];
      ox = v.ox; oy = v.oy;
      // a vent is occupied by the tap that stands on it; the vent footprint itself must be unoccupied by anything else
      for (const id of this.ids) {
        if (!this.alive[id] || id === best) continue;
        if (TD[this.type[id]].isStruct && this.type[id] !== defIndex['flux_vent'] && Math.hypot(this.x[id] - this.x[best], this.y[id] - this.y[best]) < 1.5) return res(false, 'Vent already tapped', best);
      }
      const near = this.nearestField(owner, this.x[best], this.y[best]);
      if (!near) return res(false, 'Outside construction field', best);
      return res(true, '', best);
    }
    if (ox < 1 || oy < 1 || ox + w > N - 1 || oy + h > N - 1) return res(false, 'Out of bounds');
    for (let yy = oy; yy < oy + h; yy++) for (let xx = ox; xx < ox + w; xx++) {
      const i = yy * N + xx;
      if (this.map.blocked[i] || this.map.chasm[i]) return res(false, 'Terrain blocked');
      if (this.nav.occ[i]) return res(false, 'Blocked by another object');
    }
    if (td.isHall) {
      let ok = false;
      for (const s of this.map.sites) if (Math.hypot(s.x - (ox + w / 2), s.y - (oy + h / 2)) <= 5.5) ok = true;
      if (!ok) return res(false, 'Core must be built on an expansion site');
      for (const id of this.ids) if (this.alive[id] && TD[this.type[id]].isHall && Math.hypot(this.x[id] - (ox + w / 2), this.y[id] - (oy + h / 2)) < 12) return res(false, 'Too close to another core');
      return res(true, '');
    }
    if (!this.nearestField(owner, ox + w / 2, oy + h / 2)) return res(false, 'Outside construction field');
    // keep a gap from resource nodes so mining routes stay open
    for (const id of this.ids) {
      if (!this.alive[id] || this.owner[id] !== -1) continue;
      const t = this.type[id];
      if (t !== defIndex['ore_seam'] && t !== defIndex['flux_vent']) continue;
      if (Math.hypot(this.x[id] - (ox + w / 2), this.y[id] - (oy + h / 2)) < w / 2 + 2.6) return res(false, 'Too close to a resource node');
    }
    return res(true, '');
  }

  private nearestField(owner: number, x: number, y: number): boolean {
    for (const id of this.ids) {
      if (!this.alive[id] || this.owner[id] !== owner) continue;
      const td = TD[this.type[id]];
      if (!td.isStruct || !td.def.field || !this.ext[id].done) continue;
      if (Math.hypot(this.x[id] - x, this.y[id] - y) <= td.def.field) return true;
    }
    return false;
  }
  fieldRadiusFor(owner: number): Array<{ x: number; y: number; r: number }> {
    const out: Array<{ x: number; y: number; r: number }> = [];
    for (const id of this.ids) {
      if (!this.alive[id] || this.owner[id] !== owner) continue;
      const td = TD[this.type[id]];
      if (td.isStruct && td.def.field && this.ext[id].done) out.push({ x: this.x[id], y: this.y[id], r: td.def.field });
    }
    return out;
  }

  /** Begin constructing a structure (called when a worker reaches the site). Returns structure id or -1. */
  placeStructure(owner: number, defIdx: number, x: number, y: number, worker: number): number {
    const chk = this.canPlace(owner, defIdx, x, y);
    const td = TD[defIdx];
    const pl = this.players[owner];
    if (!chk.ok) { this.alert(owner, 'invalid', x, y, chk.reason); return -1; }
    if (pl.ore < td.def.cost.ore || pl.flux < td.def.cost.flux) { this.alert(owner, 'invalid', x, y, 'Not enough resources'); return -1; }
    pl.ore -= td.def.cost.ore;
    pl.flux -= td.def.cost.flux;
    // nudge any ground units off the footprint
    const id = this.spawn(defIdx, owner, chk.ox + chk.w / 2, chk.oy + chk.h / 2, { done: false, ox: chk.ox, oy: chk.oy, w: chk.w, h: chk.h });
    const e = this.ext[id];
    e.builder = worker;
    for (const u of this.ids) {
      if (!this.alive[u] || !TD[this.type[u]].isUnit || TD[this.type[u]].isHover) continue;
      if (!this.nav.fits(this.x[u], this.y[u], 0.15)) nudgeOut(this, u);
    }
    this.events.push({ k: 'placed', tick: this.tick, owner, x: this.x[id], y: this.y[id], id, a: defIdx });
    if (td.isHall && this.players[owner].stats.firstExpandTick < 0 && this.countOf(owner, td.def.id, false) > 1) {
      this.players[owner].stats.firstExpandTick = this.tick;
      this.recordTimeline(owner, 'Expansion started', 'expand');
    }
    return id;
  }

  completeStructure(id: number) {
    const e = this.ext[id];
    e.done = true;
    e.prog = e.total;
    this.hp[id] = TD[this.type[id]].maxHp;
    const o = this.owner[id];
    this.events.push({ k: 'built', tick: this.tick, owner: o, x: this.x[id], y: this.y[id], id, a: this.type[id] });
    this.recordTimeline(o, `${TD[this.type[id]].def.name} completed`, 'build');
    this.updateSupply();
    this.alert(o, 'built', this.x[id], this.y[id], `${TD[this.type[id]].def.name} complete`);
  }

  // ---------- production ----------
  train(owner: number, bid: number, defIdx: number) {
    if (bid < 0 || !this.alive[bid] || this.owner[bid] !== owner) return;
    const b = this.ext[bid];
    const btd = TD[this.type[bid]];
    if (!btd.isStruct || !b.done || !allDefs[defIdx]) return;
    const def = allDefs[defIdx];
    if (!btd.def.produces?.includes(def.id)) return;
    const pl = this.players[owner];
    const miss = this.missingReq(owner, def.requires);
    if (miss) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], `Requires ${miss}`); return; }
    if (b.q.length >= 5) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], 'Queue full'); return; }
    if (pl.ore < def.cost.ore) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], 'Not enough Prism Ore'); return; }
    if (pl.flux < def.cost.flux) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], 'Not enough Flux'); return; }
    pl.ore -= def.cost.ore;
    pl.flux -= def.cost.flux;
    const total = secToTicks(def.buildTime);
    b.q.push({ kind: 'unit', idx: defIdx, left: total, total, started: false, paused: '' });
  }

  research(owner: number, bid: number, upIdx: number) {
    if (bid < 0 || !this.alive[bid] || this.owner[bid] !== owner) return;
    const b = this.ext[bid];
    const btd = TD[this.type[bid]];
    const up = allUpgrades[upIdx];
    if (!up || !btd.isStruct || !b.done || !btd.def.researches?.includes(up.id)) return;
    const pl = this.players[owner];
    if (pl.upg[upIdx]) return;
    for (const id of this.ids) if (this.alive[id] && this.owner[id] === owner) for (const q of this.ext[id].q) if (q.kind === 'research' && q.idx === upIdx) return;
    const miss = this.missingReq(owner, up.requires);
    if (miss) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], `Requires ${miss}`); return; }
    if (b.q.length >= 5) return;
    if (pl.ore < up.cost.ore || pl.flux < up.cost.flux) { this.alert(owner, 'invalid', this.x[bid], this.y[bid], pl.ore < up.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); return; }
    pl.ore -= up.cost.ore; pl.flux -= up.cost.flux;
    const total = secToTicks(up.time);
    b.q.push({ kind: 'research', idx: upIdx, left: total, total, started: true, paused: '' });
  }

  cancelQueue(owner: number, bid: number, index: number) {
    if (bid < 0 || !this.alive[bid] || this.owner[bid] !== owner) return;
    const b = this.ext[bid];
    const td = TD[this.type[bid]];
    if (index < 0 || !b.done) {
      if (!b.done && td.isStruct) {
        const pl = this.players[owner];
        pl.ore += Math.floor(td.def.cost.ore * 0.75);
        pl.flux += Math.floor(td.def.cost.flux * 0.75);
        b.q = [];
        this.alive[bid] = 0;
        this.nav.setFootprint(b.ox, b.oy, b.fw, b.fh, -1);
        this.events.push({ k: 'death', tick: this.tick, owner, x: this.x[bid], y: this.y[bid], id: bid, a: this.type[bid], text: 'cancel' });
        this.players[owner].stats.structures--;
      }
      return;
    }
    const q = b.q[index];
    if (!q) return;
    const pl = this.players[owner];
    if (q.kind === 'unit') { const d = allDefs[q.idx]; pl.ore += d.cost.ore; pl.flux += d.cost.flux; }
    else { const u = allUpgrades[q.idx]; pl.ore += u.cost.ore; pl.flux += u.cost.flux; }
    b.q.splice(index, 1);
  }

  private updateProduction() {
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      const td = TD[this.type[id]];
      if (!td.isStruct) continue;
      const e = this.ext[id];
      if (!e.done || !e.q.length) continue;
      const o = this.owner[id];
      const pl = this.players[o];
      const q = e.q[0];
      if (q.kind === 'unit') {
        const d = allDefs[q.idx];
        const miss = this.missingReq(o, d.requires);
        if (miss) { q.paused = 'requires'; continue; }
        if (!q.started) {
          if (pl.supplyUsed + d.supply > pl.supplyCap) { q.paused = 'supply'; if (o === 0) this.supplyAlert(o, id); continue; }
          q.started = true;
          pl.supplyUsed += d.supply;
        }
        q.paused = '';
      }
      q.left--;
      if (q.left <= 0) {
        e.q.shift();
        if (q.kind === 'unit') this.finishUnit(id, q.idx);
        else this.finishResearch(o, q.idx);
      }
    }
  }
  private supplyAlert(o: number, id: number) {
    this.alert(o, 'supply', this.x[id], this.y[id], 'Supply blocked: build more supply');
  }

  private finishUnit(bid: number, defIdx: number) {
    const e = this.ext[bid];
    const o = this.owner[bid];
    const td = TD[defIdx];
    const bx = this.x[bid], by = this.y[bid];
    // spawn point: nearest free ring cell towards rally / map centre
    const tx = e.hasRally ? e.rallyX : MAP_SIZE / 2, ty = e.hasRally ? e.rallyY : MAP_SIZE / 2;
    const ang = Math.atan2(ty - by, tx - bx);
    const half = e.fw / 2 + td.def.radius + 0.3;
    let sx = bx + Math.cos(ang) * half, sy = by + Math.sin(ang) * half;
    if (!td.isHover && !this.nav.fits(sx, sy, td.def.radius * 0.6)) {
      const nw = this.nav.nearestWalkable(sx, sy, 8);
      if (nw) { sx = nw.x; sy = nw.y; }
    }
    const id = this.spawn(defIdx, o, sx, sy, { face: ang });
    this.events.push({ k: 'trained', tick: this.tick, owner: o, x: sx, y: sy, id, a: defIdx });
    this.alert(o, 'trained', sx, sy, `${td.def.name} ready`);
    if (td.isWorker && !e.hasRally) {
      // convenience: new workers from an un-rallied hall start mining the closest seam
      const n = this.nearestNode(bx, by, 'ore_seam');
      if (n >= 0 && Math.hypot(this.x[n] - bx, this.y[n] - by) < 20) this.ext[id].orders.push(this.newOrder(Ord.Gather, this.x[n], this.y[n], n, 0, 0));
    }
    if (e.hasRally) {
      const ue = this.ext[id];
      if (e.rallyT >= 0 && this.alive[e.rallyT] && TD[this.type[e.rallyT]].isNeutral && td.isWorker) {
        ue.orders.push(this.newOrder(Ord.Gather, this.x[e.rallyT], this.y[e.rallyT], e.rallyT, 0, 0));
      } else if (td.isWorker && this.rallyOnOre(e)) {
        const node = this.nearestNode(e.rallyX, e.rallyY, 'ore_seam');
        if (node >= 0) ue.orders.push(this.newOrder(Ord.Gather, this.x[node], this.y[node], node, 0, 0));
      } else {
        ue.orders.push(this.newOrder(Ord.Move, e.rallyX, e.rallyY, -1, 0, 0.8));
      }
    }
  }
  private rallyOnOre(e: Ext): boolean {
    const n = this.nearestNode(e.rallyX, e.rallyY, 'ore_seam');
    return n >= 0 && Math.hypot(this.x[n] - e.rallyX, this.y[n] - e.rallyY) < 3;
  }
  nearestNode(x: number, y: number, kind: 'ore_seam' | 'flux_vent'): number {
    let best = -1, bd = 1e9;
    const di = defIndex[kind];
    for (const id of this.ids) {
      if (!this.alive[id] || this.type[id] !== di) continue;
      if (this.ext[id].amount <= 0) continue;
      const d = (this.x[id] - x) ** 2 + (this.y[id] - y) ** 2;
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  private finishResearch(o: number, upIdx: number) {
    const pl = this.players[o];
    const u = allUpgrades[upIdx];
    pl.upg[upIdx] = 1;
    if (u.effect.kind === 'unlock' && u.effect.key) pl.unlocks.add(u.effect.key);
    this.recomputeUpgrades(o);
    this.events.push({ k: 'researched', tick: this.tick, owner: o, x: 0, y: 0, text: u.name, a: upIdx });
    this.recordTimeline(o, `Research: ${u.name}`, 'tech');
    this.alert(o, 'researched', 0, 0, `${u.name} researched`);
  }
  recomputeUpgrades(o: number) {
    const pl = this.players[o];
    let a = 0, r = 0;
    allUpgrades.forEach((u, i) => {
      if (!pl.upg[i]) return;
      if (u.effect.kind === 'attack') a += u.effect.amount;
      if (u.effect.kind === 'armor') r += u.effect.amount;
    });
    pl.atkBonus = a;
    pl.armorBonus = r;
  }

  // ---------- alerts ----------
  alert(owner: number, kind: string, x: number, y: number, text: string) {
    this.events.push({ k: kind === 'invalid' ? 'invalid' : 'alert', tick: this.tick, owner, x, y, text, vis: kind });
  }

  // ---------- supply ----------
  updateSupply() {
    for (const pl of this.players) { pl.supplyUsed = 0; pl.supplyCap = 0; }
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      const o = this.owner[id];
      if (o < 0) continue;
      const td = TD[this.type[id]];
      const pl = this.players[o];
      if (td.isUnit) pl.supplyUsed += td.def.supply;
      else if (td.isStruct) {
        const e = this.ext[id];
        if (e.done && td.def.supplyProvided) pl.supplyCap += td.def.supplyProvided;
        for (const q of e.q) if (q.kind === 'unit' && q.started) pl.supplyUsed += allDefs[q.idx].supply;
      }
    }
    for (const pl of this.players) pl.supplyCap = Math.min(200, pl.supplyCap);
  }

  // ---------- vision ----------
  updateVision() {
    const m = this.map;
    for (const pl of this.players) {
      pl.vis.fill(0);
    }
    const pulse = this.pulseActive();
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      const o = this.owner[id];
      let owners: number[];
      if (o >= 0) owners = [o];
      else if (TD[this.type[id]].def.id === 'watch_pylon' && this.ext[id].capOwner >= 0 && !this.pylonContested(id)) owners = [this.ext[id].capOwner];
      else continue;
      const td = TD[this.type[id]];
      let sight = td.def.sight;
      if (td.isStruct && !this.ext[id].done) sight = Math.min(sight, 4);
      for (const ow of owners) castVision(m, this.players[ow].vis, this.x[id], this.y[id], sight, td.isHover);
    }
    for (const ef of this.effects) {
      if (ef.kind === 'spike' && this.tick < ef.end) castVision(m, this.players[ef.owner].vis, ef.x, ef.y, ef.r, true);
    }
    for (const pl of this.players) {
      if (pulse) pl.vis.fill(FOG_VISIBLE);
      commitExplored(pl.vis, pl.seen);
    }
  }
  pylonContested(id: number): boolean {
    const e = this.ext[id];
    let friendly = 0, foe = 0;
    this.near(this.x[id], this.y[id], 6, (u) => {
      if (!TD[this.type[u]].isUnit) return;
      if (this.owner[u] === e.capOwner) friendly++; else if (this.owner[u] >= 0) foe++;
    });
    return foe > 0 && friendly === 0;
  }

  // ---------- main step ----------
  step() {
    if (this.over) return;
    this.tick++;
    const t = this.tick;
    for (const id of this.ids) { this.px[id] = this.x[id]; this.py[id] = this.y[id]; }
    this.nav.budget = 3;
    // scheduled commands
    if (this.queue.length) {
      const due = this.queue.filter((c) => (c.tick ?? 0) <= t).sort((a, b) => (a.tick! - b.tick!) || (a.seq! - b.seq!));
      this.queue = this.queue.filter((c) => (c.tick ?? 0) > t);
      for (const c of due) { this.log.push(c); this.applyCommand(c); }
    }
    let T = this.prof ? performance.now() : 0;
    this.rebuildHash();
    if (this.prof) T = this.lap('hash', T);
    for (const pl of this.players) if (pl.ai && pl.alive) pl.ai.update(this);
    if (this.prof) T = this.lap('ai', T);
    this.updateProduction();
    const list = this.ids.slice();
    for (const id of list) {
      if (!this.alive[id]) continue;
      const td = TD[this.type[id]];
      if (td.isUnit) updateUnit(this, id);
      else if (td.isStruct) updateStructure(this, id);
      else this.updateNeutral(id);
    }
    if (this.prof) T = this.lap('units', T);
    stepProjectiles(this);
    stepEffects(this);
    this.rebuildHash();
    if (this.prof) T = this.lap('proj', T);
    separateUnits(this);
    if (this.prof) T = this.lap('separate', T);
    // late game
    if (t >= LATE_GAME_TICK && (t - LATE_GAME_TICK) % (90 * SIM_HZ) === 0) {
      this.pulseUntil = t + 2 * SIM_HZ;
      this.events.push({ k: 'alert', tick: t, owner: -1, x: MAP_SIZE / 2, y: MAP_SIZE / 2, text: 'Reveal pulse', vis: 'pulse' });
    }
    if (t % 4 === 0 || this.pulseActive()) this.updateVision();
    if (this.prof) T = this.lap('vision', T);
    if (t % 5 === 0) this.updateSupply();
    // compact
    let w = 0;
    for (let i = 0; i < this.ids.length; i++) if (this.alive[this.ids[i]]) this.ids[w++] = this.ids[i];
    this.ids.length = w;
    if (t % 200 === 0) this.sampleStats();
    if (t % 100 === 0) this.hashes.push([t, this.stateHash()]);
    this.checkVictory();
  }

  private updateNeutral(id: number) {
    const td = TD[this.type[id]];
    const e = this.ext[id];
    if (td.def.id === 'salvage_pod') {
      let who = -1;
      this.near(this.x[id], this.y[id], 1.8, (u) => { if (who < 0 && TD[this.type[u]].isUnit && this.owner[u] >= 0) who = this.owner[u]; });
      if (who >= 0) {
        this.players[who].ore += 100; this.players[who].flux += 40;
        this.players[who].stats.ore += 100; this.players[who].stats.flux += 40;
        this.alive[id] = 0;
        this.nav.setFootprint(e.ox, e.oy, e.fw, e.fh, -1);
        this.events.push({ k: 'pod', tick: this.tick, owner: who, x: this.x[id], y: this.y[id] });
        this.alert(who, 'pod', this.x[id], this.y[id], 'Salvage pod: +100 Ore, +40 Flux');
        this.recordTimeline(who, 'Salvage pod collected', 'pod');
      }
    }
    if (td.def.id === 'watch_pylon' && e.capOwner >= 0 && this.tick % 10 === 0) {
      // keeps owner as long as it's not recaptured
    }
  }

  private sampleStats() {
    for (const pl of this.players) {
      let army = 0, workers = 0;
      for (const id of this.ids) {
        if (!this.alive[id] || this.owner[id] !== pl.id) continue;
        const td = TD[this.type[id]];
        if (td.isUnit && !td.isWorker) army += td.def.cost.ore + td.def.cost.flux;
        if (td.isWorker) workers++;
      }
      pl.stats.armySamples.push(army);
      pl.stats.econSamples.push(pl.stats.ore + pl.stats.flux);
      pl.stats.workersMax = Math.max(pl.stats.workersMax, workers);
    }
  }

  defeat(p: number) {
    const pl = this.players[p];
    if (!pl.alive) return;
    pl.alive = false;
    this.recordTimeline(p, 'Defeated', 'end');
    if (!this.cfg.noVictory) {
      this.over = true;
      this.winner = 1 - p;
      this.events.push({ k: 'victory', tick: this.tick, owner: this.winner, x: 0, y: 0 });
      this.recordTimeline(this.winner, 'Victory', 'end');
    }
  }

  private checkVictory() {
    if (this.over) return;
    for (const pl of this.players) {
      if (!pl.alive) continue;
      let halls = 0;
      for (const id of this.ids) if (this.alive[id] && this.owner[id] === pl.id && TD[this.type[id]].isHall) halls++;
      if (halls === 0) { this.defeat(pl.id); return; }
    }
  }

  stateHash(): number {
    let h = 2166136261 >>> 0;
    const mix = (v: number) => { h = Math.imul(h ^ (v | 0), 16777619) >>> 0; };
    mix(this.tick);
    for (const id of this.ids) {
      if (!this.alive[id]) continue;
      mix(id); mix(this.type[id]); mix(this.owner[id]);
      mix(Math.round(this.x[id] * 64)); mix(Math.round(this.y[id] * 64)); mix(Math.round(this.hp[id] * 8));
    }
    for (const pl of this.players) { mix(Math.round(pl.ore)); mix(Math.round(pl.flux)); mix(pl.supplyUsed); }
    mix(this.rngState);
    return h >>> 0;
  }

  // ---------- helpers for UI ----------
  /** queue item description for UI */
  queueInfo(id: number): QItem[] { return this.ext[id].q; }
  gatherBonus(): number { return this.tick >= LATE_GAME_TICK ? 1.15 : 1; }
  seconds() { return this.tick / SIM_HZ; }
}
