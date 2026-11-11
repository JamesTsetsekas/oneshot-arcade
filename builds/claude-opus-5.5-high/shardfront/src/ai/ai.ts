// Server-compatible utility AI. It perceives the match only through its player's fog-filtered
// view (visible entities + last-known structure memory), keeps confidence-decaying memory of
// enemy sightings, and acts exclusively by issuing protocol commands — the same path a human
// client uses. Hard AI decides faster and micro-manages better; it never gets extra resources
// or vision.

import { FACTIONS, STRUCTURES, TECHS, UNITS, buildPalette, type FactionId } from '../faction-data';
import type { Sim } from '../simulation-core/sim';
import { Kind } from '../simulation-core/types';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type StrategicState =
  | 'Opening' | 'Establish Economy' | 'Scout' | 'Defend Threat' | 'Harass' | 'Expand' | 'Tech' | 'Assemble' | 'Attack' | 'Recover' | 'Final Push';
type SquadState = 'rally' | 'approach' | 'engage' | 'kite' | 'retreat' | 'reinforce' | 'regroup';

interface Memory { id: number; def: string; kind: number; x: number; y: number; seenTick: number; structure: boolean }

const PROFILE: Record<Difficulty, { cadence: number; maxWorkers: number; attackValue: number; expandWorkers: number; techAt: number; upgrades: boolean; harass: boolean; micro: boolean; scoutAt: number; counter: boolean }> = {
  easy: { cadence: 34, maxWorkers: 16, attackValue: 1100, expandWorkers: 15, techAt: 20 * 60 * 8, upgrades: false, harass: false, micro: false, scoutAt: 20 * 120, counter: false },
  normal: { cadence: 16, maxWorkers: 38, attackValue: 1500, expandWorkers: 15, techAt: 20 * 60 * 3.6, upgrades: true, harass: false, micro: true, scoutAt: 20 * 25, counter: true },
  hard: { cadence: 8, maxWorkers: 46, attackValue: 1700, expandWorkers: 14, techAt: 20 * 60 * 3.1, upgrades: true, harass: true, micro: true, scoutAt: 20 * 20, counter: true },
};

export class AIController {
  readonly sim: Sim;
  readonly player: number;
  readonly difficulty: Difficulty;
  readonly faction: FactionId;
  state: StrategicState = 'Opening';
  squad: SquadState = 'rally';
  memory = new Map<number, Memory>();
  private lastDecision = -999;
  private scoutSent = 0;
  private scoutId = -1;
  private attackTarget: { x: number; y: number } | null = null;
  private recoverUntil = 0;
  private harassIds: number[] = [];
  private evacuated = new Set<number>();
  private buildingCooldown = new Map<string, number>();
  private wavesSent = 0;
  log: string[] = [];

  constructor(sim: Sim, player: number, difficulty: Difficulty) {
    this.sim = sim;
    this.player = player;
    this.difficulty = difficulty;
    this.faction = sim.players[player].faction;
  }

  private get prof() { return PROFILE[this.difficulty]; }
  private get me() { return this.sim.players[this.player]; }
  private get enemy() { return 1 - this.player; }

  update() {
    const sim = this.sim;
    if (sim.over || this.me.defeated) return;
    if (sim.tick - this.lastDecision < this.prof.cadence) return;
    this.lastDecision = sim.tick;
    this.perceive();
    this.chooseState();
    this.economy();
    this.buildPlanner();
    this.production();
    this.research();
    this.scouting();
    this.army();
  }

  // ------------------------------------------------------------ perception (fog-respecting)
  private perceive() {
    const sim = this.sim;
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.owner[id] !== this.enemy) continue;
      const k = sim.kind[id];
      if (k !== Kind.Unit && k !== Kind.Structure) continue;
      if (!sim.isVisibleTo(this.player, id)) continue;
      this.memory.set(id, { id, def: sim.defName(id), kind: k, x: sim.x[id], y: sim.y[id], seenTick: sim.tick, structure: k === Kind.Structure });
    }
    // forget: units decay quickly; structures are verified against the fog-of-war memory
    const ghosts = this.me.ghosts;
    for (const [id, m] of this.memory) {
      const age = sim.tick - m.seenTick;
      if (m.structure) { if (!ghosts.has(id) && !(sim.alive[id] && sim.isVisibleTo(this.player, id))) this.memory.delete(id); }
      else if (age > 20 * 90) this.memory.delete(id);
    }
  }
  /** confidence in a memory record: 1 when seen now, decaying over ~45 s for mobile units */
  confidence(m: Memory): number {
    const age = this.sim.tick - m.seenTick;
    return m.structure ? Math.max(0.3, 1 - age / (20 * 600)) : Math.exp(-age / (20 * 45));
  }
  private knownEnemyTags(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const m of this.memory.values()) {
      if (m.structure) continue;
      const ud = UNITS[m.def];
      if (!ud || ud.worker) continue;
      const c = this.confidence(m);
      for (const t of ud.tags) out[t] = (out[t] ?? 0) + c * (ud.cost.ore + ud.cost.flux) / 100;
    }
    return out;
  }
  private visibleThreatNearBase(): { x: number; y: number; value: number } | null {
    const sim = this.sim;
    const mine = sim.structuresOf(this.player);
    let best: { x: number; y: number; value: number } | null = null;
    for (const m of this.memory.values()) {
      if (m.structure || sim.tick - m.seenTick > 40) continue;
      const ud = UNITS[m.def];
      if (!ud || ud.worker) continue;
      let near = false;
      for (const s of mine) if (Math.hypot(sim.x[s] - m.x, sim.y[s] - m.y) < 16) { near = true; break; }
      if (!near) continue;
      const v = ud.cost.ore + ud.cost.flux;
      if (!best) best = { x: m.x, y: m.y, value: v };
      else { best.value += v; }
    }
    return best;
  }

  // ------------------------------------------------------------ strategy
  private armyUnits(): number[] {
    return this.sim.unitsOf(this.player).filter((u) => { const d = this.sim.udef(u); return !d.worker && u !== this.scoutId && !this.harassIds.includes(u); });
  }
  private armyValue(ids = this.armyUnits()): number {
    let v = 0;
    for (const u of ids) { const d = this.sim.udef(u); v += d.cost.ore + d.cost.flux; }
    return v;
  }
  private workers(): number[] { return this.sim.unitsOf(this.player).filter((u) => this.sim.udef(u).worker); }
  private hqs(): number[] { return this.sim.structuresOf(this.player).filter((s) => this.sim.sdef(s).isHQ); }
  private count(def: string, includeQueued = true): number {
    const sim = this.sim;
    let c = 0;
    for (const s of sim.structuresOf(this.player)) {
      if (sim.sdef(s).id === def) c++;
      if (includeQueued) for (const q of sim.ext[s].queue) if (q.def === def) c++;
    }
    for (const u of sim.unitsOf(this.player)) {
      if (sim.udef(u).id === def) c++;
      if (includeQueued) { const o = sim.ext[u].orders.find((o) => o.t === 'build' && o.def === def); if (o) c++; }
    }
    return c;
  }

  private chooseState() {
    const sim = this.sim;
    const t = sim.tick;
    const threat = this.visibleThreatNearBase();
    const army = this.armyValue();
    let s: StrategicState;
    if (threat && threat.value > 120) s = 'Defend Threat';
    else if (t > 20 * 60 * 16) s = 'Final Push';
    else if (t < this.recoverUntil) s = 'Recover';
    else if (this.state === 'Attack' && army > 300) s = 'Attack';
    else if (army >= this.attackThreshold()) s = 'Attack';
    else if (t < 20 * 75) s = 'Opening';
    else if (this.workers().length < 14) s = 'Establish Economy';
    else if (this.hqs().length < 2 && this.workers().length >= this.prof.expandWorkers) s = 'Expand';
    else if (this.prof.harass && t > 20 * 60 * 5 && this.harassIds.length === 0 && army > 600) s = 'Harass';
    else if (t > this.prof.techAt && this.count(FACTIONS[this.faction].tech) === 0) s = 'Tech';
    else s = 'Assemble';
    if (s !== this.state) { this.log.push(`${t}:${s}`); if (this.log.length > 40) this.log.shift(); }
    this.state = s;
  }
  private attackThreshold(): number {
    const minutes = this.sim.tick / 1200;
    // threshold rises slowly so later attacks are larger
    return this.prof.attackValue + minutes * (this.difficulty === 'easy' ? 40 : 90) + this.wavesSent * 150;
  }

  // ------------------------------------------------------------ economy
  private economy() {
    const sim = this.sim;
    const f = FACTIONS[this.faction];
    const workers = this.workers();
    const hqs = this.hqs().filter((h) => sim.built[h]);
    const extractors = sim.structuresOf(this.player).filter((s) => sim.sdef(s).isExtractor && sim.built[s] && sim.ext[s].amount > 0);
    const want = Math.min(this.prof.maxWorkers, hqs.length * 15 + extractors.length * 3 + 2);
    // train workers
    if (workers.length + this.count(f.worker, true) - workers.length < want) {
      for (const h of hqs) {
        if (sim.ext[h].queue.length === 0 && this.me.ore >= 50 && this.me.supplyUsed < this.me.supplyCap) {
          sim.issue({ player: this.player, kind: 'train', ids: [h], def: f.worker });
          break;
        }
      }
    }
    // assign flux workers (3 per extractor)
    for (const ex of extractors) {
      const assigned = workers.filter((w) => { const o = sim.ext[w].orders[0]; return o?.t === 'gather' && o.target === ex; });
      if (assigned.length < 3) {
        const cand = workers.find((w) => { const o = sim.ext[w].orders[0]; return o?.t === 'gather' && sim.kind[o.target] === Kind.Ore && sim.ext[w].carryAmount === 0 && Math.hypot(sim.x[w] - sim.x[ex], sim.y[w] - sim.y[ex]) < 16; });
        if (cand !== undefined) sim.issue({ player: this.player, kind: 'gather', ids: [cand], target: ex });
      }
    }
    // idle workers -> least saturated base with ore
    const econ = sim.baseEconomy(this.player).filter((b) => b.ideal > 0 && sim.built[b.hq]);
    for (const w of workers) {
      if (this.evacuated.has(w)) continue;
      const e = sim.ext[w];
      if (e.orders.length) continue;
      econ.sort((a, b) => a.workers / a.ideal - b.workers / b.ideal);
      const base = econ[0];
      if (!base) break;
      const ore = this.nearestOre(base.x, base.y);
      if (ore > 0) { sim.issue({ player: this.player, kind: 'gather', ids: [w], target: ore }); base.workers++; }
    }
    // transfer from oversaturated to undersaturated bases
    if (econ.length >= 2 && sim.tick % (this.prof.cadence * 6) < this.prof.cadence) {
      econ.sort((a, b) => b.workers / b.ideal - a.workers / a.ideal);
      const over = econ[0], under = econ[econ.length - 1];
      if (over.workers > over.ideal + 1 && under.workers < under.ideal - 1) {
        const mover = workers.find((w) => { const o = sim.ext[w].orders[0]; return o?.t === 'gather' && sim.kind[o.target] === Kind.Ore && Math.hypot(sim.x[o.target] - over.x, sim.y[o.target] - over.y) < 13; });
        const ore = this.nearestOre(under.x, under.y);
        if (mover !== undefined && ore > 0) sim.issue({ player: this.player, kind: 'gather', ids: [mover], target: ore });
      }
    }
    // evacuate workers from credible raids, return when the threat falls
    const threat = this.visibleThreatNearBase();
    const defenders = this.armyValue();
    if (threat && threat.value > 150 && defenders < threat.value * 0.5) {
      for (const w of workers) {
        if (Math.hypot(sim.x[w] - threat.x, sim.y[w] - threat.y) < 9 && !this.evacuated.has(w)) {
          const safe = hqs.find((h) => Math.hypot(sim.x[h] - threat.x, sim.y[h] - threat.y) > 25) ?? -1;
          const sx = safe > 0 ? sim.x[safe] : sim.x[w] + (sim.x[w] - threat.x);
          const sy = safe > 0 ? sim.y[safe] : sim.y[w] + (sim.y[w] - threat.y);
          sim.issue({ player: this.player, kind: 'move', ids: [w], x: sx, y: sy });
          this.evacuated.add(w);
        }
      }
    } else if (this.evacuated.size) {
      for (const w of this.evacuated) if (sim.alive[w]) sim.ext[w].orders = sim.ext[w].orders.filter((o) => o.t !== 'move');
      this.evacuated.clear();
    }
    // Helix: repair damaged priority structures when calm
    if (this.faction === 'helix' && !threat) {
      for (const s of sim.structuresOf(this.player)) {
        if (!sim.built[s] || sim.hp[s] > sim.maxHp[s] * 0.75) continue;
        const d = sim.sdef(s);
        if (!(d.isHQ || d.trains.length || d.weapon)) continue;
        const already = workers.some((w) => sim.ext[w].orders[0]?.t === 'repair');
        if (already) break;
        const w = this.pickBuilder(sim.x[s], sim.y[s]);
        if (w > 0) sim.issue({ player: this.player, kind: 'repair', ids: [w], target: s, queued: false });
        break;
      }
    }
    // Helix: resume abandoned constructions
    if (this.faction === 'helix') {
      for (const s of sim.structuresOf(this.player)) {
        if (sim.built[s]) continue;
        const b = sim.ext[s].builder;
        if (b > 0 && sim.alive[b] && sim.ext[b].buildSite === s) continue;
        const w = this.pickBuilder(sim.x[s], sim.y[s]);
        if (w > 0) sim.issue({ player: this.player, kind: 'repair', ids: [w], target: s });
        break;
      }
    }
  }

  private nearestOre(x: number, y: number): number {
    const sim = this.sim;
    let best = -1, bd = 1e9;
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.kind[id] !== Kind.Ore || sim.ext[id].amount <= 0) continue;
      const d = Math.hypot(sim.x[id] - x, sim.y[id] - y);
      if (d < bd && d < 14) { bd = d; best = id; }
    }
    return best;
  }

  private pickBuilder(x: number, y: number): number {
    const sim = this.sim;
    let best = -1, bd = 1e9;
    for (const w of this.workers()) {
      if (this.evacuated.has(w)) continue;
      const e = sim.ext[w];
      const o = e.orders[0];
      if (o && o.t !== 'gather') continue;
      if (e.carryAmount > 0 && e.phase === 'toDrop') continue;
      if (o?.t === 'gather' && sim.kind[o.target] === Kind.Structure) continue; // keep flux workers
      const d = Math.hypot(sim.x[w] - x, sim.y[w] - y);
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }

  // ------------------------------------------------------------ construction planning
  private buildPlanner() {
    const sim = this.sim;
    const f = FACTIONS[this.faction];
    const me = this.me;
    const t = sim.tick;
    const workers = this.workers().length;
    const prodCount = this.count(f.production);
    const prodBuilt = sim.structuresOf(this.player, f.production).filter((s) => sim.built[s]).length;
    const techCount = this.count(f.tech);
    const hqs = this.hqs();
    const extractors = this.count(f.extractor);
    const pendingSupply = sim.structuresOf(this.player, f.supplyStructure).filter((s) => !sim.built[s]).length + this.workers().filter((w) => sim.ext[w].orders.some((o) => o.t === 'build' && o.def === f.supplyStructure)).length;
    const buffer = 2 + prodBuilt * 2 + hqs.length;
    // 1) supply
    if (me.supplyCap < 100 && me.supplyCap + pendingSupply * 8 - me.supplyUsed <= buffer && pendingSupply < 1 + Math.floor(prodBuilt / 2)) {
      if (this.tryBuild(f.supplyStructure)) return;
      return; // save for supply
    }
    // 2) first production
    if (prodCount === 0 && (workers >= 9 || t > 20 * 70)) { this.tryBuild(f.production); return; }
    // 3) first extractor
    if (extractors === 0 && prodCount > 0) { if (this.tryBuild(f.extractor)) return; }
    // 4) expansion
    const expandDue = hqs.length < 2 ? workers >= this.prof.expandWorkers : (hqs.length < 3 && t > 20 * 60 * 11 && workers >= 30 && this.difficulty !== 'easy');
    const mainLow = this.mainOreFraction() < 0.35;
    if ((expandDue || mainLow) && hqs.length < 4 && this.count(f.hq) === hqs.length) { if (this.tryBuild(f.hq)) return; if (me.ore < 450) return; }
    // 5) tech
    if (techCount === 0 && prodBuilt > 0 && t > this.prof.techAt) { if (this.tryBuild(f.tech)) return; }
    // 6) extractors at other bases
    const builtHQ = hqs.filter((h) => sim.built[h]).length;
    if (extractors < builtHQ && extractors < 3 && t > 20 * 60 * 4) { if (this.tryBuild(f.extractor)) return; }
    // 7) more production
    const wantProd = Math.min(this.difficulty === 'easy' ? 2 : 4, 1 + Math.floor(workers / 11));
    if (prodCount < wantProd && me.ore > 250) { if (this.tryBuild(f.production)) return; }
    // 8) defenses when threatened or as hard-AI insurance at expansions
    const defCount = this.count(f.defense);
    const wantDef = (this.state === 'Defend Threat' ? 1 : 0) + (this.difficulty === 'hard' && hqs.length >= 2 ? 2 : this.difficulty === 'normal' && hqs.length >= 2 ? 1 : 0);
    if (prodBuilt > 0 && defCount < wantDef && me.ore > 200) { this.tryBuild(f.defense); }
  }

  private mainOreFraction(): number {
    const sim = this.sim;
    let left = 0, max = 0;
    for (let id = 1; id < sim.nextId; id++) {
      if (sim.kind[id] !== Kind.Ore) continue;
      if (Math.hypot(sim.x[id] - this.me.startX, sim.y[id] - this.me.startY) > 14) continue;
      max += sim.ext[id].maxAmount;
      if (sim.alive[id]) left += sim.ext[id].amount;
    }
    return max ? left / max : 0;
  }

  private tryBuild(defId: string): boolean {
    const sim = this.sim;
    const d = STRUCTURES[defId];
    const me = this.me;
    if ((this.buildingCooldown.get(defId) ?? 0) > sim.tick) return false;
    if (me.ore < d.cost.ore || me.flux < d.cost.flux) return false;
    if (sim.missingRequirements(this.player, d.requires).length) return false;
    const spot = this.findSpot(defId);
    if (!spot) { this.buildingCooldown.set(defId, sim.tick + 200); return false; }
    const w = this.pickBuilder(spot.tx + d.size / 2, spot.ty + d.size / 2);
    if (w < 0) return false;
    sim.issue({ player: this.player, kind: 'build', ids: [w], def: defId, x: spot.tx, y: spot.ty });
    this.buildingCooldown.set(defId, sim.tick + 60);
    return true;
  }

  private findSpot(defId: string): { tx: number; ty: number } | null {
    const sim = this.sim;
    const d = STRUCTURES[defId];
    const n = sim.map.size;
    if (d.isExtractor) {
      // free vent nearest to one of our built HQs
      let best: { tx: number; ty: number } | null = null, bd = 1e9;
      for (let id = 1; id < sim.nextId; id++) {
        if (!sim.alive[id] || sim.kind[id] !== Kind.Vent) continue;
        for (const h of this.hqs()) {
          if (!sim.built[h]) continue;
          const dd = Math.hypot(sim.x[id] - sim.x[h], sim.y[id] - sim.y[h]);
          if (dd < 14 && dd < bd) {
            const tx = Math.round(sim.x[id] - 1.5), ty = Math.round(sim.y[id] - 1.5);
            if (sim.checkPlacement(this.player, defId, tx, ty).ok) { bd = dd; best = { tx, ty }; }
          }
        }
      }
      return best;
    }
    if (d.isHQ) {
      // next expansion: closest free base spot to our start by ground distance proxy
      const spots = sim.map.bases.filter((b) => b.kind !== 'center' && b.kind !== 'main' || (b.kind === 'main' && b.owner === this.player));
      const taken = (b: { x: number; y: number }) => {
        for (let id = 1; id < sim.nextId; id++) if (sim.alive[id] && sim.kind[id] === Kind.Structure && sim.sdef(id).isHQ && Math.hypot(sim.x[id] - b.x, sim.y[id] - b.y) < 6) return true;
        for (const m of this.memory.values()) if (m.structure && STRUCTURES[m.def]?.isHQ && Math.hypot(m.x - b.x, m.y - b.y) < 6) return true;
        return false;
      };
      const cand = spots.filter((b) => !taken(b)).sort((a, b) => Math.hypot(a.x - this.me.startX, a.y - this.me.startY) - Math.hypot(b.x - this.me.startX, b.y - this.me.startY));
      for (const b of cand) {
        for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) {
          const tx = Math.round(b.x - d.size / 2) + ox, ty = Math.round(b.y - d.size / 2) + oy;
          if (sim.checkPlacement(this.player, defId, tx, ty).ok) return { tx, ty };
        }
      }
      return null;
    }
    // general structures: spiral around a built HQ (main first, then natural), away from ore
    const hqs = this.hqs().filter((h) => sim.built[h]);
    const anchors = defId === FACTIONS[this.faction].defense && hqs.length > 1 ? hqs.slice(1).concat(hqs[0]) : hqs;
    for (const h of anchors) {
      const hx = sim.x[h], hy = sim.y[h];
      // direction away from the ore line
      let ox = 0, oy = 0, cnt = 0;
      for (let id = 1; id < sim.nextId; id++) if (sim.alive[id] && sim.kind[id] === Kind.Ore && Math.hypot(sim.x[id] - hx, sim.y[id] - hy) < 12) { ox += sim.x[id] - hx; oy += sim.y[id] - hy; cnt++; }
      const ol = Math.hypot(ox, oy) || 1;
      const awayX = cnt ? -ox / ol : 0, awayY = cnt ? -oy / ol : 0;
      const cands: { tx: number; ty: number; score: number }[] = [];
      for (let r = 5; r <= 13; r++) for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        const cx = hx + Math.cos(ang) * r, cy = hy + Math.sin(ang) * r;
        const dot = (Math.cos(ang) * awayX + Math.sin(ang) * awayY);
        let score = r * 0.5 - dot * 3;
        if (d.weapon) score = -dot * 2 + Math.abs(r - 8); // defenses toward the front
        cands.push({ tx: Math.round(cx - d.size / 2), ty: Math.round(cy - d.size / 2), score });
      }
      cands.sort((a, b) => a.score - b.score);
      for (const c of cands) {
        if (!sim.checkPlacement(this.player, defId, c.tx, c.ty).ok) continue;
        // keep one free cell around the footprint so bases never wall themselves in
        let clear = true;
        for (let y = c.ty - 1; y <= c.ty + d.size && clear; y++) for (let x = c.tx - 1; x <= c.tx + d.size; x++) {
          if (x < 0 || y < 0 || x >= n || y >= n) { clear = false; break; }
          if (y >= c.ty && y < c.ty + d.size && x >= c.tx && x < c.tx + d.size) continue;
          if (!sim.nav.passable(x, y)) { clear = false; break; }
        }
        if (clear) return { tx: c.tx, ty: c.ty };
      }
    }
    return null;
  }

  // ------------------------------------------------------------ production & composition
  private composition(): Record<string, number> {
    const tags = this.knownEnemyTags();
    const light = tags.Light ?? 0, armored = tags.Armored ?? 0, mech = tags.Mechanical ?? 0, bio = tags.Biological ?? 0;
    const counter = this.prof.counter;
    const late = this.sim.tick > 20 * 60 * 9;
    if (this.faction === 'helix') {
      return {
        bulwark: 4 + (counter ? light * 0.6 : 0),
        arc_lancer: 1.5 + (counter ? armored * 0.8 : 0),
        kestrel: this.sim.tick < 20 * 60 * 5 ? 0.6 : 0.2,
        mender_rig: 0.8,
        mortar_crawler: 1 + (counter && this.memoryDefenses() > 1 ? 1.5 : 0),
        aegis_frame: late ? 1.2 + (counter ? bio * 0.1 : 0) : 0,
      };
    }
    return {
      thornling: 3 + (counter ? mech * 0.3 + armored * 0.3 : 0),
      sporecaster: 3 + (counter ? light * 0.5 : 0),
      carapace_guard: 1.2 + (counter ? (tags.Mechanical ?? 0) * 0.2 : 0),
      glimmerwing: this.sim.tick < 20 * 60 * 6 ? 0.3 : 0.15,
      bloom_sage: 0.7,
      rift_stag: 0.9 + (counter && this.memoryDefenses() > 1 ? 1.2 : 0),
      crownbeast: late ? 1.2 : 0,
    };
  }
  private memoryDefenses(): number {
    let c = 0;
    for (const m of this.memory.values()) if (m.structure && STRUCTURES[m.def]?.weapon) c++;
    return c;
  }

  private production() {
    const sim = this.sim;
    const f = FACTIONS[this.faction];
    const me = this.me;
    // keep a reserve for planned structures (supply, expansion)
    const reserve = this.state === 'Expand' && this.count(f.hq) === this.hqs().length ? 380 : 0;
    const prods = sim.structuresOf(this.player, f.production).filter((s) => sim.built[s] && sim.ext[s].queue.length < 2);
    if (!prods.length) return;
    const comp = this.composition();
    const current: Record<string, number> = {};
    let total = 0;
    for (const u of this.armyUnits()) { const id = sim.udef(u).id; current[id] = (current[id] ?? 0) + 1; total++; }
    for (const s of sim.structuresOf(this.player, f.production)) for (const q of sim.ext[s].queue) { current[q.def] = (current[q.def] ?? 0) + 1; total++; }
    const wTotal = Object.values(comp).reduce((a, b) => a + b, 0);
    for (const p of prods) {
      let best = '', bestDef = -1e9;
      for (const [def, w] of Object.entries(comp)) {
        if (w <= 0) continue;
        const ud = UNITS[def];
        if (sim.missingRequirements(this.player, ud.requires).length) continue;
        const want = (w / wTotal) * (total + 1);
        const deficit = want - (current[def] ?? 0);
        if (deficit > bestDef) { bestDef = deficit; best = def; }
      }
      if (!best) return;
      const ud = UNITS[best];
      if (me.ore - reserve < ud.cost.ore || me.flux < ud.cost.flux) {
        // fall back to a cheap ore-only unit if flux is the bottleneck
        const cheap = Object.keys(comp).find((d) => UNITS[d].cost.flux === 0 && comp[d] > 0.5 && !sim.missingRequirements(this.player, UNITS[d].requires).length);
        if (cheap && me.ore - reserve >= UNITS[cheap].cost.ore && me.flux < ud.cost.flux) {
          sim.issue({ player: this.player, kind: 'train', ids: [p], def: cheap });
          current[cheap] = (current[cheap] ?? 0) + 1; total++;
        }
        continue;
      }
      if (me.supplyUsed + ud.supply > me.supplyCap) return;
      sim.issue({ player: this.player, kind: 'train', ids: [p], def: best });
      current[best] = (current[best] ?? 0) + 1; total++;
      // rally production toward the army rally point
      const r = this.rallyPoint();
      if (!sim.ext[p].hasRally) sim.issue({ player: this.player, kind: 'rally', ids: [p], x: r.x, y: r.y });
    }
  }

  private research() {
    if (!this.prof.upgrades && this.sim.tick < 20 * 60 * 10) return;
    const sim = this.sim;
    const f = FACTIONS[this.faction];
    const techs = sim.structuresOf(this.player, f.tech).filter((s) => sim.built[s] && sim.ext[s].queue.length === 0);
    if (!techs.length) return;
    const me = this.me;
    const order = [`${this.faction}_attack_1`, `${this.faction}_armor_1`, this.faction === 'helix' ? 'aegis_protocol' : 'crown_rite', `${this.faction}_attack_2`, `${this.faction}_armor_2`, `${this.faction}_attack_3`, `${this.faction}_armor_3`];
    for (const tid of order) {
      const td = TECHS[tid];
      if (me.techs.has(tid) || sim.isResearching(this.player, tid)) continue;
      if (sim.missingRequirements(this.player, td.requires).length) continue;
      if (td.effect.unlock && sim.tick < 20 * 60 * 7) continue;
      if (me.ore < td.cost.ore + 100 || me.flux < td.cost.flux) return;
      sim.issue({ player: this.player, kind: 'research', ids: [techs[0]], def: tid });
      return;
    }
  }

  // ------------------------------------------------------------ scouting
  private scouting() {
    const sim = this.sim;
    if (sim.tick < this.prof.scoutAt) return;
    const f = FACTIONS[this.faction];
    if (this.scoutId > 0 && !sim.alive[this.scoutId]) this.scoutId = -1;
    if (this.scoutId < 0) {
      const s = sim.unitsOf(this.player, f.scout)[0];
      if (s === undefined) return;
      this.scoutId = s;
    }
    const e = sim.ext[this.scoutId];
    const due = this.scoutSent === 0 || (sim.tick - this.scoutSent > 20 * 150 && this.difficulty !== 'easy');
    if (!due || e.orders.length) return;
    this.scoutSent = sim.tick;
    const es = sim.players[this.enemy];
    const nat = sim.map.bases.filter((b) => b.kind === 'natural').sort((a, b) => Math.hypot(a.x - es.startX, a.y - es.startY) - Math.hypot(b.x - es.startX, b.y - es.startY))[0];
    const side = sim.map.bases.filter((b) => b.kind === 'side').sort((a, b) => Math.hypot(a.x - es.startX, a.y - es.startY) - Math.hypot(b.x - es.startX, b.y - es.startY));
    const route = [{ x: es.startX + 3, y: es.startY + 3 }, { x: nat.x, y: nat.y }, ...side.map((b) => ({ x: b.x, y: b.y }))];
    route.forEach((p, i) => sim.issue({ player: this.player, kind: 'move', ids: [this.scoutId], x: p.x, y: p.y, queued: i > 0 }));
    const r = this.rallyPoint();
    sim.issue({ player: this.player, kind: 'move', ids: [this.scoutId], x: r.x, y: r.y, queued: true });
  }

  // ------------------------------------------------------------ army control
  rallyPoint(): { x: number; y: number } {
    const sim = this.sim;
    const hqs = this.hqs();
    // in front of the most forward base, toward the map center
    let bx = this.me.startX, by = this.me.startY, best = 1e9;
    const c = sim.map.size / 2;
    for (const h of hqs) { const d = Math.hypot(sim.x[h] - c, sim.y[h] - c); if (d < best) { best = d; bx = sim.x[h]; by = sim.y[h]; } }
    const dx = c - bx, dy = c - by, l = Math.hypot(dx, dy) || 1;
    let x = bx + (dx / l) * 11, y = by + (dy / l) * 11;
    const cell = sim.nav.nearestPassable(Math.floor(x), Math.floor(y), 10);
    if (cell >= 0) { x = (cell % sim.map.size) + 0.5; y = ((cell / sim.map.size) | 0) + 0.5; }
    return { x, y };
  }

  private pickAttackTarget(): { x: number; y: number } {
    const sim = this.sim;
    // nearest remembered enemy structure (fog memory), else the enemy start location
    let best: { x: number; y: number } | null = null, bd = 1e9;
    const r = this.rallyPoint();
    for (const m of this.memory.values()) {
      if (!m.structure) continue;
      const d = Math.hypot(m.x - r.x, m.y - r.y) - (STRUCTURES[m.def]?.isHQ ? 8 : 0);
      if (d < bd) { bd = d; best = { x: m.x, y: m.y }; }
    }
    if (best) return best;
    const es = sim.players[this.enemy];
    return { x: es.startX, y: es.startY };
  }

  private localStrength(x: number, y: number, r: number): { mine: number; theirs: number } {
    const sim = this.sim;
    let mine = 0, theirs = 0;
    sim.spatial.query(x, y, r, (j) => {
      if (!sim.alive[j] || Math.hypot(sim.x[j] - x, sim.y[j] - y) > r) return;
      const k = sim.kind[j];
      let v = 0;
      if (k === Kind.Unit) { const d = sim.udef(j); if (d.worker || !d.weapon && !d.abilities.length) return; v = (d.cost.ore + d.cost.flux) * (sim.hp[j] / sim.maxHp[j]); }
      else if (k === Kind.Structure && sim.built[j] && sim.sdef(j).weapon) v = 250;
      else return;
      if (sim.owner[j] === this.player) mine += v;
      else if (sim.owner[j] === this.enemy && sim.isVisibleTo(this.player, j)) theirs += v;
    });
    return { mine, theirs };
  }

  private army() {
    const sim = this.sim;
    const army = this.armyUnits();
    if (!army.length) return;
    const rally = this.rallyPoint();
    let cx = 0, cy = 0;
    for (const u of army) { cx += sim.x[u]; cy += sim.y[u]; }
    cx /= army.length; cy /= army.length;
    const idle = army.filter((u) => sim.ext[u].orders.length === 0);
    const P = this.player;

    switch (this.state) {
      case 'Defend Threat': {
        const th = this.visibleThreatNearBase();
        if (th) {
          this.squad = 'engage';
          const movers = army.filter((u) => { const o = sim.ext[u].orders[0]; return !o || o.t !== 'move' || !o.attack || Math.hypot(o.x - th.x, o.y - th.y) > 6; });
          if (movers.length) sim.issue({ player: P, kind: 'attackMove', ids: movers, x: th.x, y: th.y });
          if (this.faction === 'helix') this.braceBulwarks(army, th.x, th.y);
        }
        break;
      }
      case 'Attack': case 'Final Push': {
        const target = this.pickAttackTarget();
        const reissue = !this.attackTarget || Math.hypot(this.attackTarget.x - target.x, this.attackTarget.y - target.y) > 4 || sim.tick % 200 < this.prof.cadence;
        if (!this.attackTarget) { this.wavesSent++; sim.addTimeline(P, 'AI launched an attack', 'combat'); }
        this.attackTarget = target;
        this.squad = 'approach';
        // retreat check (not in final push)
        const ls = this.localStrength(cx, cy, 12);
        if (this.state !== 'Final Push' && this.prof.micro && ls.theirs > ls.mine * 1.6 && ls.theirs > 300) {
          this.squad = 'retreat';
          sim.issue({ player: P, kind: 'move', ids: army, x: rally.x, y: rally.y });
          this.attackTarget = null;
          this.recoverUntil = sim.tick + 20 * 30;
          this.log.push(`${sim.tick}:retreat`);
          break;
        }
        if (ls.theirs > 0) this.squad = 'engage';
        // regroup stragglers: units far behind the centroid catch up first
        if (reissue || idle.length) {
          const far = army.filter((u) => Math.hypot(sim.x[u] - cx, sim.y[u] - cy) > 14);
          const near = army.filter((u) => !far.includes(u));
          if (near.length) sim.issue({ player: P, kind: 'attackMove', ids: near, x: target.x, y: target.y });
          if (far.length) { sim.issue({ player: P, kind: 'attackMove', ids: far, x: cx, y: cy }); sim.issue({ player: P, kind: 'attackMove', ids: far, x: target.x, y: target.y, queued: true }); }
        }
        break;
      }
      case 'Harass': {
        const fast = army.filter((u) => ['kestrel', 'thornling', 'glimmerwing'].includes(sim.udef(u).id) && sim.udef(u).weapon).slice(0, 6);
        if (fast.length >= 3) {
          this.harassIds = fast;
          const es = sim.players[this.enemy];
          const nat = sim.map.bases.filter((b) => b.kind === 'natural').sort((a, b) => Math.hypot(a.x - es.startX, a.y - es.startY) - Math.hypot(b.x - es.startX, b.y - es.startY))[0];
          // take the alternate back path toward the natural's ore line
          sim.issue({ player: P, kind: 'attackMove', ids: fast, x: nat.x, y: nat.y + (nat.y > 72 ? 6 : -6) });
          sim.addTimeline(P, 'AI sent a harassment squad', 'combat');
        }
        break;
      }
      default: {
        this.attackTarget = null;
        this.squad = idle.length ? 'regroup' : 'rally';
        const away = army.filter((u) => sim.ext[u].orders.length === 0 && Math.hypot(sim.x[u] - rally.x, sim.y[u] - rally.y) > 7);
        if (away.length) sim.issue({ player: P, kind: 'attackMove', ids: away, x: rally.x, y: rally.y });
      }
    }
    // harass squad upkeep: retreat when hurt, release when dead
    this.harassIds = this.harassIds.filter((u) => sim.alive[u]);
    if (this.harassIds.length && this.harassIds.every((u) => sim.ext[u].orders.length === 0)) {
      sim.issue({ player: P, kind: 'attackMove', ids: this.harassIds, x: rally.x, y: rally.y });
      this.harassIds = [];
    }
    for (const u of this.harassIds) if (sim.hp[u] < sim.maxHp[u] * 0.4) sim.issue({ player: P, kind: 'move', ids: [u], x: rally.x, y: rally.y });
    if (this.prof.micro) this.micro(army);
  }

  private braceBulwarks(army: number[], x: number, y: number) {
    const sim = this.sim;
    for (const u of army) {
      if (sim.udef(u).id !== 'bulwark') continue;
      const e = sim.ext[u];
      const d = Math.hypot(sim.x[u] - x, sim.y[u] - y);
      if (!e.braced && d < 8 && sim.tick - e.lastDamageTick < 40) sim.issue({ player: this.player, kind: 'ability', ids: [u], def: 'brace' });
    }
  }

  private micro(army: number[]) {
    const sim = this.sim;
    const P = this.player;
    const rally = this.rallyPoint();
    for (const u of army) {
      const d = sim.udef(u);
      const e = sim.ext[u];
      // kite: badly hurt ranged units step back toward the rally point (Hard also on Normal at lower threshold)
      const kiteAt = this.difficulty === 'hard' ? 0.35 : 0.22;
      if (d.weapon && d.weapon.range >= 4 && sim.hp[u] < sim.maxHp[u] * kiteAt && sim.tick - e.lastDamageTick < 20 && !e.braced) {
        const dx = rally.x - sim.x[u], dy = rally.y - sim.y[u], l = Math.hypot(dx, dy) || 1;
        sim.issue({ player: P, kind: 'move', ids: [u], x: sim.x[u] + (dx / l) * 5, y: sim.y[u] + (dy / l) * 5 });
        sim.issue({ player: P, kind: 'attackMove', ids: [u], x: sim.x[u], y: sim.y[u], queued: true });
      }
      // unbrace when nothing is around
      if (e.braced && sim.tick - e.lastDamageTick > 120 && sim.tick - e.lastAttackTick > 120 && this.state !== 'Defend Threat') sim.issue({ player: P, kind: 'ability', ids: [u], def: 'brace' });
      // carapace curl under heavy fire, uncurl when calm
      if (d.id === 'carapace_guard') {
        if (!e.curled && sim.hp[u] < sim.maxHp[u] * 0.35 && sim.tick - e.lastDamageTick < 10) sim.issue({ player: P, kind: 'ability', ids: [u], def: 'curl' });
        else if (e.curled && sim.tick - e.lastDamageTick > 50) sim.issue({ player: P, kind: 'ability', ids: [u], def: 'curl' });
      }
      // bloom sage: mend a damaged cluster, silence an enemy cluster
      if (d.id === 'bloom_sage' && sim.tick >= e.silencedUntil) {
        if (e.energy >= 75 && (e.abilityReady.silence_patch ?? 0) <= sim.tick) {
          const t = acquireNearestEnemy(sim, u, 8);
          if (t > 0) { sim.issue({ player: P, kind: 'ability', ids: [u], def: 'silence_patch', x: sim.x[t], y: sim.y[t] }); continue; }
        }
        if (e.energy >= 50 && (e.abilityReady.mend_spores ?? 0) <= sim.tick) {
          let hurt = -1;
          sim.spatial.query(sim.x[u], sim.y[u], 7, (j) => { if (hurt < 0 && sim.alive[j] && sim.kind[j] === Kind.Unit && sim.owner[j] === P && sim.hp[j] < sim.maxHp[j] * 0.6) hurt = j; });
          if (hurt > 0) sim.issue({ player: P, kind: 'ability', ids: [u], def: 'mend_spores', x: sim.x[hurt], y: sim.y[hurt] });
        }
      }
    }
    // kestrel sensor spikes ahead of an attack
    if (this.attackTarget) {
      const k = army.find((u) => sim.udef(u).id === 'kestrel' && (sim.ext[u].abilityReady.sensor_spike ?? 0) <= sim.tick);
      if (k !== undefined) {
        const dx = this.attackTarget.x - sim.x[k], dy = this.attackTarget.y - sim.y[k], l = Math.hypot(dx, dy) || 1;
        if (l > 10) sim.issue({ player: P, kind: 'ability', ids: [k], def: 'sensor_spike', x: sim.x[k] + (dx / l) * 8, y: sim.y[k] + (dy / l) * 8 });
      }
    }
  }
}

function acquireNearestEnemy(sim: Sim, u: number, r: number): number {
  let best = -1, bd = 1e9;
  sim.spatial.query(sim.x[u], sim.y[u], r, (j) => {
    if (!sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] === sim.owner[u] || sim.owner[j] < 0) return;
    if (!sim.isVisibleTo(sim.owner[u], j)) return;
    const d = Math.hypot(sim.x[j] - sim.x[u], sim.y[j] - sim.y[u]);
    if (d < bd && d <= r) { bd = d; best = j; }
  });
  return best;
}

void buildPalette;
