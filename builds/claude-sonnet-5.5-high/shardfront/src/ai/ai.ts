// ai: server-compatible utility AI. It only reads what its own player may see (fog-filtered visibility grid + memory records)
// and acts exclusively through the same Command protocol as a human. No resource or vision cheats.
import { allDefs, defIndex, upgradeIndex, factions, type EntityDef } from '../data';
import { TD } from '../sim/ext';
import { FOG_VISIBLE } from '../sim/vision';
import { Ord } from '../sim/types';
import type { Sim } from '../sim/sim';

export interface AIController {
  update(sim: Sim): void;
  /** debug/UI: current strategic state */
  state: string;
}

interface Mem { id: number; def: number; x: number; y: number; tick: number; struct: boolean; owner: number }

interface Profile {
  cadence: number; workerTarget: number; attackSupply: number; expandAt: number; prodMax: number; defenseCount: number; retreatRatio: number; waveGrowth: number; techAt: number; scoutAt: number;
}
const PROFILES: Record<string, Profile> = {
  easy: { cadence: 40, workerTarget: 14, attackSupply: 58, expandAt: 330, prodMax: 3, defenseCount: 0, retreatRatio: 1.2, waveGrowth: 14, techAt: 300, scoutAt: 9999 },
  normal: { cadence: 20, workerTarget: 18, attackSupply: 44, expandAt: 190, prodMax: 5, defenseCount: 2, retreatRatio: 1.5, waveGrowth: 16, techAt: 190, scoutAt: 70 },
  hard: { cadence: 10, workerTarget: 22, attackSupply: 34, expandAt: 150, prodMax: 7, defenseCount: 3, retreatRatio: 1.8, waveGrowth: 22, techAt: 140, scoutAt: 40 },
};

export function createAI(sim: Sim, player: number, difficulty: string, passive: boolean): AIController {
  return new UtilityAI(sim, player, PROFILES[difficulty] ?? PROFILES.normal, passive);
}

class UtilityAI implements AIController {
  state = 'Opening';
  private mem = new Map<number, Mem>();
  private enemy: number;
  private nextThink: number;
  private attacking = false;
  private attackTarget: { x: number; y: number } | null = null;
  private waveSupply: number;
  private lastRetreat = -99999;
  private scouted = false;
  private scoutId = -1;
  private scoutStage = 0;
  private rally = { x: 0, y: 0 };
  private evacuating = false;
  private evacStart = 0;
  private noEvacUntil = 0;
  private lastWaveStart = 0;
  private sentRally = new Set<number>();

  constructor(sim: Sim, private p: number, private prof: Profile, private passive: boolean) {
    this.enemy = 1 - p;
    this.nextThink = 5 + p * 3;
    this.waveSupply = prof.attackSupply;
    const me = sim.map.starts[p];
    const mid = sim.map.size / 2;
    const dx = mid - me.x, dy = mid - me.y, dl = Math.hypot(dx, dy);
    const w = sim.nav.nearestWalkable(me.x + (dx / dl) * 24, me.y + (dy / dl) * 24, 10);
    this.rally = w ?? { x: me.x, y: me.y };
  }

  update(sim: Sim) {
    if (this.passive) return;
    if (sim.tick < this.nextThink) return;
    this.nextThink = sim.tick + this.prof.cadence;
    this.observe(sim);
    this.think(sim);
  }

  // ---------- perception (fog filtered) ----------
  private observe(sim: Sim) {
    const me = sim.players[this.p];
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const o = sim.owner[id];
      if (o !== this.enemy) continue;
      const ci = sim.cellIdx(sim.x[id], sim.y[id]);
      if (me.vis[ci] === FOG_VISIBLE) {
        const td = TD[sim.type[id]];
        this.mem.set(id, { id, def: sim.type[id], x: sim.x[id], y: sim.y[id], tick: sim.tick, struct: td.isStruct, owner: o });
      }
    }
    for (const [id, m] of this.mem) {
      // memory is only corrected by what the AI can currently see (no omniscient clean-up)
      const seenNow = me.vis[sim.cellIdx(m.x, m.y)] === FOG_VISIBLE;
      if (seenNow && sim.tick !== m.tick) {
        const here = sim.alive[id] && Math.hypot(sim.x[id] - m.x, sim.y[id] - m.y) < 1.5;
        if (!here) { this.mem.delete(id); continue; }
      }
      if (!m.struct && sim.tick - m.tick > 20 * 90) this.mem.delete(id);
    }
  }

  private visibleEnemies(sim: Sim): number[] {
    const out: number[] = [];
    const me = sim.players[this.p];
    for (const id of sim.ids) {
      if (!sim.alive[id] || sim.owner[id] !== this.enemy) continue;
      if (me.vis[sim.cellIdx(sim.x[id], sim.y[id])] === FOG_VISIBLE) out.push(id);
    }
    return out;
  }

  // ---------- decision making ----------
  private think(sim: Sim) {
    const p = this.p;
    const pl = sim.players[p];
    const f = pl.faction;
    const secs = sim.tick / 20;
    const own = sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === p);
    const workers = own.filter((id) => TD[sim.type[id]].isWorker);
    const halls = own.filter((id) => TD[sim.type[id]].isHall);
    const doneHalls = halls.filter((id) => sim.ext[id].done);
    if (!doneHalls.length && !halls.length) return;
    const structs = own.filter((id) => TD[sim.type[id]].isStruct);
    const cnt = (defId: string, done = false) => structs.filter((s) => sim.type[s] === defIndex[defId] && (!done || sim.ext[s].done)).length;
    // pending build orders (resources are paid on placement, so reserve them)
    let pendOre = 0, pendFlux = 0;
    const pendingDefs: number[] = [];
    for (const w of workers) {
      const o = sim.ext[w].orders[0];
      if (o && o.k === Ord.Build && o.t < 0) { pendOre += allDefs[o.p].cost.ore; pendFlux += allDefs[o.p].cost.flux; pendingDefs.push(o.p); }
      for (const q of sim.ext[w].orders.slice(1)) if (q.k === Ord.Build && q.t < 0) pendingDefs.push(q.p);
    }
    const pending = (defId: string) => pendingDefs.filter((d) => d === defIndex[defId]).length;
    const have = (defId: string) => cnt(defId) + pending(defId);
    const oreRaw = pl.ore - pendOre;
    let ore = oreRaw;
    let flux = pl.flux - pendFlux;
    // save for the expansion once it is due (production keeps going only from surplus)
    const hallCost0 = allDefs[defIndex[f.hall]].cost.ore;
    const expandDue = secs > this.prof.expandAt && halls.length < 2 && pendingDefs.indexOf(defIndex[f.hall]) < 0 && this.pickSite(sim, halls) !== null;
    if (expandDue) ore = Math.max(0, oreRaw - hallCost0);
    const main = halls[0];
    const mainPos = { x: sim.x[main], y: sim.y[main] };

    // --- threats and defense
    const vis = this.visibleEnemies(sim);
    const threats: number[] = [];
    for (const id of vis) {
      const td = TD[sim.type[id]];
      if (!td.isUnit) continue;
      for (const s of structs) {
        if (Math.hypot(sim.x[s] - sim.x[id], sim.y[s] - sim.y[id]) < 17) { threats.push(id); break; }
      }
    }
    const army = own.filter((id) => { const t = TD[sim.type[id]]; return t.isUnit && !t.isWorker && t.def.role !== 'scout'; });
    const armyValue = (ids: number[]) => ids.reduce((s, id) => s + TD[sim.type[id]].def.cost.ore + TD[sim.type[id]].def.cost.flux, 0);
    const armySupply = army.reduce((s, id) => s + TD[sim.type[id]].def.supply, 0);
    const combatThreats = threats.filter((id) => TD[sim.type[id]].canAttack);

    // --- workers
    this.manageWorkers(sim, workers, doneHalls, combatThreats, armyValue(army), armyValue(combatThreats));

    // --- supply
    const queuedSupply = 0;
    const supplyFree = pl.supplyCap - pl.supplyUsed - queuedSupply;
    const prodCount = structs.filter((s) => TD[sim.type[s]].def.role === 'production').length;
    const supplyBuilding = f.supply;
    const supplyInProgress = cnt(supplyBuilding) - cnt(supplyBuilding, true) + pending(supplyBuilding);
    const supplyCost = allDefs[defIndex[supplyBuilding]].cost.ore;
    const need = 3 + prodCount * 2 + Math.floor(armySupply / 20);
    if (supplyFree <= need && pl.supplyCap < 200 && supplyInProgress < (secs > 360 ? 2 : 1) && ore >= supplyCost) {
      if (this.build(sim, workers, supplyBuilding, doneHalls)) ore -= supplyCost;
    }

    // --- production buildings
    const prodId = f.basicProd;
    const prodDef = allDefs[defIndex[prodId]];
    const prodTotal = have(prodId);
    let prodTarget = Math.min(this.prof.prodMax, 1 + Math.floor(Math.max(0, secs - 45) / 110));
    if (doneHalls.length > 1) prodTarget = Math.min(this.prof.prodMax, prodTarget + 1);
    if (ore > 450) prodTarget = Math.min(this.prof.prodMax, prodTarget + 1);
    if (secs > 25 && prodTotal < prodTarget && ore >= prodDef.cost.ore && (pl.supplyCap - pl.supplyUsed >= 1 || supplyInProgress > 0 || secs > 60)) {
      if (this.build(sim, workers, prodId, doneHalls)) ore -= prodDef.cost.ore;
    }
    // --- flux taps
    const tapDef = allDefs[defIndex[f.tap]];
    const tapTarget = prodTotal >= 1 && secs > 60 ? Math.min(2 * doneHalls.length, 1 + Math.floor((secs - 60) / 100)) : 0;
    if (have(f.tap) < tapTarget && ore >= tapDef.cost.ore && this.canTap(sim)) {
      if (this.buildTap(sim, workers)) ore -= tapDef.cost.ore;
    }
    // --- tech
    const techDef = allDefs[defIndex[f.tech]];
    if (have(f.tech) < 1 && cnt(prodId, true) >= 1 && secs > this.prof.techAt && ore >= techDef.cost.ore && flux >= techDef.cost.flux && cnt(f.tap, true) >= 1) {
      if (this.build(sim, workers, f.tech, doneHalls)) { ore -= techDef.cost.ore; flux -= techDef.cost.flux; }
    }
    // --- expansion
    const hallDef = allDefs[defIndex[f.hall]];
    if (expandDue && oreRaw >= hallDef.cost.ore && !this.threatened(sim, combatThreats)) {
      const site = this.pickSite(sim, halls);
      if (site) {
        const w = this.pickBuilder(sim, workers, site.x, site.y);
        if (w >= 0) { sim.issue({ c: 'order', player: p, ord: 'build', ids: [w], x: site.x, y: site.y, param: defIndex[f.hall] }, false); }
      }
    }
    // --- defense structures at the natural / main
    const defDef = allDefs[defIndex[f.defense]];
    if (this.prof.defenseCount > 0 && halls.length >= 2 && have(f.defense) < this.prof.defenseCount * (halls.length - 1) + (secs > 500 ? 1 : 0) && ore >= defDef.cost.ore + 100 && cnt(prodId, true) > 0) {
      if (this.build(sim, workers, f.defense, doneHalls.slice(1).length ? doneHalls.slice(1) : doneHalls, true)) ore -= defDef.cost.ore;
    }

    // --- research
    this.research(sim, structs, ore, flux);

    // --- unit production
    this.produce(sim, structs, workers, doneHalls, ore, flux, armySupply);

    // --- army / scouting
    this.scout(sim, own);
    this.controlArmy(sim, army, armyValue, armySupply, combatThreats, mainPos, secs);
  }

  private threatened(sim: Sim, threats: number[]) { return threats.length > 0; }

  // ---------- economy ----------
  private manageWorkers(sim: Sim, workers: number[], halls: number[], threats: number[], myArmyValue: number, threatValue: number) {
    const p = this.p;
    const pl = sim.players[p];
    const f = pl.faction;
    if (!halls.length) return;
    // evacuation: credible raid and weak army
    const raiders = threats.filter((id) => {
      for (const h of halls) if (Math.hypot(sim.x[h] - sim.x[id], sim.y[h] - sim.y[id]) < 14) return true;
      return false;
    });
    const evac = raiders.length >= 2 && threatValue > myArmyValue * 0.9 && sim.tick >= this.noEvacUntil;
    if (evac && !this.evacuating) {
      this.evacuating = true;
      this.evacStart = sim.tick;
      const safe = halls[0];
      // only workers near the raiders run (to the main); the rest keep mining
      for (const w of workers) {
        if (sim.ext[w].orders[0]?.k === Ord.Build) continue;
        let near = false;
        for (const r of raiders) if (Math.hypot(sim.x[w] - sim.x[r], sim.y[w] - sim.y[r]) < 22) { near = true; break; }
        if (!near) continue;
        sim.issue({ c: 'order', player: p, ord: 'move', ids: [w], x: sim.x[safe] + 0.5, y: sim.y[safe] + 0.5 }, false);
      }
      return;
    }
    if (this.evacuating && (raiders.length === 0 || sim.tick - this.evacStart > 20 * 14)) {
      this.evacuating = false;
      if (raiders.length > 0) this.noEvacUntil = sim.tick + 20 * 30; // don't idle the economy for long
    }
    if (this.evacuating) return;

    // count assignment per node
    const assigned = new Map<number, number>();
    for (const w of workers) {
      const o = sim.ext[w].orders[0];
      if (o && o.k === Ord.Gather) assigned.set(o.t, (assigned.get(o.t) ?? 0) + 1);
    }
    // train workers
    let workerCount = workers.length;
    const queued = halls.reduce((s, h) => s + sim.ext[h].q.filter((q) => q.kind === 'unit').length, 0);
    workerCount += queued;
    const taps = sim.ids.filter((s) => sim.alive[s] && sim.owner[s] === p && sim.type[s] === defIndex[f.tap] && sim.ext[s].done);
    const target = Math.min(44, this.prof.workerTarget * Math.min(halls.length, 2) / (halls.length > 1 ? 1.4 : 1) + taps.length * 3);
    if (workerCount < target) {
      for (const h of halls) {
        if (sim.ext[h].q.length >= 2) continue;
        if (pl.ore >= 50 && workerCount < target) {
          sim.issue({ c: 'train', player: p, target: h, param: defIndex[f.worker] }, false);
          workerCount++;
        }
      }
    }
    // rally new workers onto ore
    for (const h of halls) {
      const e = sim.ext[h];
      if (!e.hasRally && !this.sentRally.has(h)) {
        this.sentRally.add(h);
        const n = sim.nearestNode(sim.x[h], sim.y[h], 'ore_seam');
        if (n >= 0) sim.issue({ c: 'rally', player: p, ids: [h], x: sim.x[n], y: sim.y[n] }, false);
      }
    }
    // assign idle workers
    const fluxNodes: number[] = [];
    for (const t of taps) {
      for (const n of sim.ids) {
        if (sim.alive[n] && sim.type[n] === defIndex['flux_vent'] && Math.abs(sim.x[n] - sim.x[t]) < 0.8 && Math.abs(sim.y[n] - sim.y[t]) < 0.8 && sim.ext[n].amount > 0) fluxNodes.push(n);
      }
    }
    const idle = workers.filter((w) => sim.ext[w].orders.length === 0 && sim.ext[w].carry >= 0 && sim.ext[w].chT === 0);
    for (const w of idle) {
      // flux first if under-saturated
      let node = -1;
      for (const n of fluxNodes) if ((assigned.get(n) ?? 0) < 3) { node = n; break; }
      if (node < 0) node = this.bestOre(sim, w, halls, assigned);
      if (node >= 0) {
        assigned.set(node, (assigned.get(node) ?? 0) + 1);
        sim.issue({ c: 'order', player: p, ord: 'gather', ids: [w], target: node }, false);
      }
    }
    // rebalance: if flux under-saturated and no idle, pull from ore gatherers once in a while
    for (const n of fluxNodes) {
      if ((assigned.get(n) ?? 0) < 3) {
        const cand = workers.find((w) => { const o = sim.ext[w].orders[0]; return o && o.k === Ord.Gather && sim.type[o.t] === defIndex['ore_seam'] && sim.ext[w].carry === 0; });
        if (cand !== undefined) {
          assigned.set(n, (assigned.get(n) ?? 0) + 1);
          sim.issue({ c: 'order', player: p, ord: 'gather', ids: [cand], target: n }, false);
        }
        break;
      }
    }
  }

  private bestOre(sim: Sim, w: number, halls: number[], assigned: Map<number, number>): number {
    let best = -1, bs = 1e9;
    for (const n of sim.ids) {
      if (!sim.alive[n] || sim.type[n] !== defIndex['ore_seam'] || sim.ext[n].amount <= 0) continue;
      let hd = 1e9;
      for (const h of halls) hd = Math.min(hd, Math.hypot(sim.x[h] - sim.x[n], sim.y[h] - sim.y[n]));
      if (hd > 16) continue;
      const a = assigned.get(n) ?? 0;
      const s = hd + a * 9 + Math.hypot(sim.x[w] - sim.x[n], sim.y[w] - sim.y[n]) * 0.15;
      if (s < bs) { bs = s; best = n; }
    }
    return best;
  }

  private canTap(sim: Sim): boolean { return this.freeVent(sim) >= 0; }
  private freeVent(sim: Sim): number {
    const p = this.p;
    const f = sim.players[p].faction;
    const tapIdx = defIndex[f.tap];
    let best = -1, bd = 1e9;
    const halls = sim.ids.filter((s) => sim.alive[s] && sim.owner[s] === p && TD[sim.type[s]].isHall && sim.ext[s].done);
    for (const v of sim.ids) {
      if (!sim.alive[v] || sim.type[v] !== defIndex['flux_vent']) continue;
      let taken = false;
      for (const s of sim.ids) if (sim.alive[s] && sim.type[s] === tapIdx && Math.abs(sim.x[s] - sim.x[v]) < 0.8 && Math.abs(sim.y[s] - sim.y[v]) < 0.8) taken = true;
      if (taken) continue;
      for (const h of halls) {
        const d = Math.hypot(sim.x[h] - sim.x[v], sim.y[h] - sim.y[v]);
        if (d < 15 && d < bd) { bd = d; best = v; }
      }
    }
    return best;
  }

  private buildTap(sim: Sim, workers: number[]): boolean {
    const v = this.freeVent(sim);
    if (v < 0) return false;
    const w = this.pickBuilder(sim, workers, sim.x[v], sim.y[v]);
    if (w < 0) return false;
    const f = sim.players[this.p].faction;
    sim.issue({ c: 'order', player: this.p, ord: 'build', ids: [w], x: sim.x[v], y: sim.y[v], param: defIndex[f.tap] }, false);
    return true;
  }

  private pickBuilder(sim: Sim, workers: number[], x: number, y: number): number {
    let best = -1, bd = 1e9;
    for (const w of workers) {
      const e = sim.ext[w];
      if (e.orders[0]?.k === Ord.Build || e.orders[0]?.k === Ord.Resume || e.chT > 0) continue;
      let d = Math.hypot(sim.x[w] - x, sim.y[w] - y);
      if (e.carry > 0) d += 12;
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }

  private build(sim: Sim, workers: number[], defId: string, nearHalls: number[], forward = false): boolean {
    const di = defIndex[defId];
    const td = TD[di];
    if (!nearHalls.length) return false;
    const hall = nearHalls[(sim.tick / 200 | 0) % nearHalls.length];
    const hx = sim.x[hall], hy = sim.y[hall];
    const mid = sim.map.size / 2;
    const toMid = Math.atan2(mid - hy, mid - hx);
    let best: { x: number; y: number } | null = null, bs = 1e9;
    for (let ring = 0; ring < 4; ring++) {
      const radius = (td.def.field ? 8 : 6) + ring * 2.5;
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const x = hx + Math.cos(a) * radius, y = hy + Math.sin(a) * radius;
        const chk = sim.canPlace(this.p, di, x, y);
        if (!chk.ok) continue;
        // keep a one-cell gap between structures to avoid walling workers in
        let crowd = 0;
        sim.near(x, y, 4, (s) => { if (TD[sim.type[s]].isStruct && sim.owner[s] === this.p) crowd++; });
        const dir = Math.abs(Math.atan2(Math.sin(a - toMid), Math.cos(a - toMid)));
        let score = radius * 1.0 + crowd * 3 + (forward ? dir * 4 : (Math.PI - dir) * 1.5);
        if (td.def.role === 'supply') score += (Math.PI - dir) * 2; // supply tucked away from the front
        if (score < bs) { bs = score; best = { x, y }; }
      }
      if (best) break;
    }
    if (!best) return false;
    const w = this.pickBuilder(sim, workers, best.x, best.y);
    if (w < 0) return false;
    sim.issue({ c: 'order', player: this.p, ord: 'build', ids: [w], x: best.x, y: best.y, param: di }, false);
    return true;
  }

  private pickSite(sim: Sim, halls: number[]): { x: number; y: number } | null {
    const me = sim.map.starts[this.p];
    const foe = sim.map.starts[this.enemy];
    let best: { x: number; y: number } | null = null, bd = 1e9;
    for (const s of sim.map.sites) {
      if (s.kind === 'main') continue;
      const dm = Math.hypot(s.x - me.x, s.y - me.y), df = Math.hypot(s.x - foe.x, s.y - foe.y);
      if (df < dm) continue;
      let taken = false;
      for (const h of sim.ids) if (sim.alive[h] && TD[sim.type[h]].isHall && Math.hypot(sim.x[h] - s.x, sim.y[h] - s.y) < 12) taken = true;
      if (taken) continue;
      if (dm < bd) { bd = dm; best = { x: s.x, y: s.y }; }
    }
    void halls;
    return best;
  }

  private research(sim: Sim, structs: number[], ore: number, flux: number) {
    const f = sim.players[this.p].faction;
    const pl = sim.players[this.p];
    const tech = structs.find((s) => sim.type[s] === defIndex[f.tech] && sim.ext[s].done);
    if (tech === undefined || sim.ext[tech].q.length > 0) return;
    // unlock heavy tech, then alternate attack / armor
    const order = [f.id === 'helix' ? 'heavy_chassis' : 'crown_rites', ...f.upgrades.filter((u) => u.includes('1')), ...f.upgrades.filter((u) => u.includes('2')), ...f.upgrades.filter((u) => u.includes('3'))];
    for (const u of order) {
      const ui = upgradeIndex[u];
      if (pl.upg[ui]) continue;
      sim.issue({ c: 'research', player: this.p, target: tech, param: ui }, false);
      return;
    }
    void ore; void flux;
  }

  private produce(sim: Sim, structs: number[], workers: number[], halls: number[], ore: number, flux: number, armySupply: number) {
    const p = this.p;
    const pl = sim.players[p];
    const f = pl.faction;
    const prods = structs.filter((s) => sim.type[s] === defIndex[f.basicProd] && sim.ext[s].done);
    if (!prods.length) return;
    // enemy composition from memory
    const tagCount: Record<string, number> = {};
    let total = 0;
    for (const m of this.mem.values()) {
      if (m.struct) continue;
      total++;
      for (const t of allDefs[m.def].tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
    }
    const frac = (t: string) => (total > 0 ? (tagCount[t] ?? 0) / total : 0);
    let supplyLeft = pl.supplyCap - pl.supplyUsed - prods.reduce((s, b) => s + sim.ext[b].q.filter((q) => q.kind === 'unit' && !q.started).length * 2, 0);
    // keep one scout alive
    const scouts = sim.ids.filter((s) => sim.alive[s] && sim.owner[s] === p && sim.type[s] === defIndex[f.scout]).length;
    for (const b of prods) {
      const q = sim.ext[b].q;
      if (q.length >= 2) continue;
      const cands: Array<{ d: EntityDef; w: number }> = [];
      for (const c of f.composition) {
        const d = allDefs[defIndex[c.id]];
        if (d.producedBy !== allDefs[sim.type[b]].id) continue;
        if (sim.missingReq(p, d.requires)) continue;
        if (d.cost.ore > ore || d.cost.flux > flux) continue;
        if (d.supply > supplyLeft) continue;
        let w = c.weight;
        if (d.weapon?.bonus) for (const [tag, v] of Object.entries(d.weapon.bonus)) if (tag !== 'Structure') w *= 1 + (v / d.weapon.damage) * frac(tag) * 2;
        if (d.role === 'scout') w = scouts < 1 && sim.tick / 20 > 100 ? 4 : 0;
        if (d.role === 'siege' && armySupply < 12) w *= 0.3;
        if (d.role === 'support' && armySupply < 14) w *= 0.2;
        cands.push({ d, w });
      }
      const sumW = cands.reduce((s, c) => s + c.w, 0);
      if (sumW <= 0) continue;
      let r = sim.rand() * sumW;
      let pick = cands[0];
      for (const c of cands) { r -= c.w; if (r <= 0) { pick = c; break; } }
      sim.issue({ c: 'train', player: p, target: b, param: defIndex[pick.d.id] }, false);
      ore -= pick.d.cost.ore; flux -= pick.d.cost.flux; supplyLeft -= pick.d.supply;
      if (!sim.ext[b].hasRally || !this.sentRally.has(b)) {
        this.sentRally.add(b);
        sim.issue({ c: 'rally', player: p, ids: [b], x: this.rally.x, y: this.rally.y }, false);
      }
    }
    void workers; void halls;
  }

  // ---------- scouting ----------
  private scout(sim: Sim, own: number[]) {
    if (sim.tick / 20 < this.prof.scoutAt) return;
    const f = sim.players[this.p].faction;
    let sc = this.scoutId;
    if (sc < 0 || !sim.alive[sc]) {
      sc = own.find((id) => sim.type[id] === defIndex[f.scout]) ?? -1;
      this.scoutId = sc;
      this.scoutStage = 0;
    }
    if (sc < 0) return;
    const e = sim.ext[sc];
    if (e.orders.length > 0) return;
    const foe = sim.map.starts[this.enemy];
    const wps = sim.map.sites.filter((s) => s.id.startsWith(this.enemy === 1 ? 'p1' : 'p0'));
    const route = [wps.find((s) => s.kind === 'natural'), wps.find((s) => s.kind === 'main') ?? { x: foe.x, y: foe.y }, wps.find((s) => s.kind === 'side')];
    const tgt = route[this.scoutStage % route.length] ?? { x: foe.x, y: foe.y };
    this.scoutStage++;
    const mid = sim.map.size / 2;
    const w = sim.nav.nearestWalkable(tgt.x + (mid - tgt.x) * 0.12, tgt.y + (mid - tgt.y) * 0.12, 10) ?? tgt;
    sim.issue({ c: 'order', player: this.p, ord: 'move', ids: [sc], x: w.x, y: w.y, force: true }, false);
    if (this.scoutStage >= 4) {
      const home = sim.map.starts[this.p];
      sim.issue({ c: 'order', player: this.p, ord: 'move', ids: [sc], x: this.rally.x, y: this.rally.y, queue: true }, false);
      void home;
      this.scoutStage = 0;
      this.scouted = true;
    }
  }

  // ---------- army ----------
  private controlArmy(sim: Sim, army: number[], valueOf: (ids: number[]) => number, armySupply: number, threats: number[], mainPos: { x: number; y: number }, secs: number) {
    const p = this.p;
    if (!army.length) { this.attacking = false; this.state = threats.length ? 'Defend Threat' : 'Establish Economy'; return; }
    // defend
    if (threats.length > 0) {
      let cx = 0, cy = 0;
      for (const t of threats) { cx += sim.x[t]; cy += sim.y[t]; }
      cx /= threats.length; cy /= threats.length;
      const tx = threats[0];
      const idleOrFar = army.filter((id) => {
        const o = sim.ext[id].orders[0];
        return !o || (o.k !== Ord.AttackMove) || Math.hypot(o.x - cx, o.y - cy) > 10;
      });
      if (idleOrFar.length) sim.issue({ c: 'order', player: p, ord: 'attackMove', ids: idleOrFar, x: sim.x[tx], y: sim.y[tx] }, false);
      this.state = 'Defend Threat';
      this.attacking = false;
      return;
    }
    // attack decision
    const cooldownOk = sim.tick - this.lastRetreat > 20 * 45;
    if (!this.attacking) {
      this.state = armySupply >= this.waveSupply * 0.75 ? 'Assemble' : 'Establish Economy';
      if (secs > 150 && sim.players[p].supplyUsed > 0 && armySupply >= (secs > 13 * 60 ? this.waveSupply * 0.6 : this.waveSupply) && (cooldownOk || secs > 16 * 60)) {
        this.attacking = true;
        this.lastWaveStart = sim.tick;
        this.waveSupply = Math.min(90, this.waveSupply + this.prof.waveGrowth);
        this.state = 'Attack';
        this.attackTarget = this.pickTarget(sim);
        const t = this.attackTarget;
        sim.issue({ c: 'order', player: p, ord: 'attackMove', ids: army, x: t.x, y: t.y }, false);
        return;
      }
      // gather at rally
      const stray = army.filter((id) => !sim.ext[id].orders.length && Math.hypot(sim.x[id] - this.rally.x, sim.y[id] - this.rally.y) > 7);
      if (stray.length) sim.issue({ c: 'order', player: p, ord: 'attackMove', ids: stray, x: this.rally.x, y: this.rally.y }, false);
      return;
    }
    // attacking: reassess
    this.state = secs > 20 * 60 ? 'Final Push' : 'Attack';
    let cx = 0, cy = 0;
    for (const a of army) { cx += sim.x[a]; cy += sim.y[a]; }
    cx /= army.length; cy /= army.length;
    const near: number[] = [];
    for (const id of this.visibleEnemies(sim)) {
      const td = TD[sim.type[id]];
      if (td.isUnit && td.canAttack && Math.hypot(sim.x[id] - cx, sim.y[id] - cy) < 16) near.push(id);
      if (td.isStruct && td.canAttack && Math.hypot(sim.x[id] - cx, sim.y[id] - cy) < 11) near.push(id);
    }
    const myVal = valueOf(army);
    const foeVal = valueOf(near);
    const lateBoost = secs > 14 * 60 ? 2.2 : 1; // no endless stand-offs: late game the AI commits
    if (foeVal > myVal * this.prof.retreatRatio * lateBoost && sim.tick - this.lastWaveStart > 20 * 12) {
      this.attacking = false;
      this.lastRetreat = sim.tick;
      this.state = 'Recover';
      sim.issue({ c: 'order', player: p, ord: 'move', ids: army, x: this.rally.x, y: this.rally.y, force: true }, false);
      return;
    }
    // re-target when the target area is cleared or units idle
    const t = this.attackTarget ?? this.pickTarget(sim);
    const idle = army.filter((id) => !sim.ext[id].orders.length);
    const next = this.pickTarget(sim);
    if (idle.length > 0 || Math.hypot(next.x - t.x, next.y - t.y) > 6) {
      this.attackTarget = next;
      const tgtIds = idle.length > army.length * 0.5 ? army : idle;
      sim.issue({ c: 'order', player: p, ord: 'attackMove', ids: tgtIds, x: next.x, y: next.y }, false);
    }
    if (armySupply < this.waveSupply * 0.25 && sim.tick - this.lastWaveStart > 20 * 20) { this.attacking = false; }
    void mainPos;
  }

  private pickTarget(sim: Sim): { x: number; y: number } {
    // nearest remembered enemy structure, preferring non-hall, else the enemy start position
    const me = sim.map.starts[this.p];
    let best: Mem | null = null, bd = 1e9;
    for (const m of this.mem.values()) {
      if (!m.struct) continue;
      const hall = TD[m.def].isHall;
      const d = Math.hypot(m.x - me.x, m.y - me.y) + (hall ? 40 : 0);
      if (d < bd) { bd = d; best = m; }
    }
    if (best) return { x: best.x, y: best.y };
    const foe = sim.map.starts[this.enemy];
    return { x: foe.x, y: foe.y };
  }
}

void factions;
