// ai: server-compatible utility AI. It issues the same validated commands a player does, reads only its own
// entities, currently visible enemies and its fog-limited memory (ghost records) - no resource or vision cheats.
import { DEF_INDEX, FACTIONS, TECH_DEFS, TECH_INDEX, type FactionInfo } from '../data/defs';
import type { EntityDef } from '../data/types';
import type { Command, Difficulty } from '../net/protocol';
import {
  ENDGAME_TICK, FL_CONSTRUCTING, OT_AMOVE, OT_BUILD, OT_CONSTRUCT, OT_GATHER, OT_MOVE, PLACE_OK, SUPPLY_MAX, TICK_RATE,
  type Sim, type Thinker,
} from '../sim/sim';
import { MAP_SIZE } from '../world/map';

export type StrategicState = 'Opening' | 'Establish Economy' | 'Scout' | 'Defend Threat' | 'Harass' | 'Expand' | 'Tech' | 'Assemble' | 'Attack' | 'Recover' | 'Final Push';

interface Tuning {
  cadence: number; maxWorkers: number; maxBases: number; maxProduction: number;
  firstWave: number; waveGrow: number; retreat: boolean; scout: boolean; harass: boolean;
  expandAt: number; techAt: number; queueDepth: number; fluxWorkers: number; counters: boolean; reinforce: number;
}

const TUNING: Record<Difficulty, Tuning> = {
  easy: { cadence: 40, maxWorkers: 16, maxBases: 2, maxProduction: 2, firstWave: 14, waveGrow: 5, retreat: false, scout: false, harass: false, expandAt: 540, techAt: 420, queueDepth: 1, fluxWorkers: 2, counters: false, reinforce: 0 },
  normal: { cadence: 20, maxWorkers: 30, maxBases: 3, maxProduction: 3, firstWave: 16, waveGrow: 6, retreat: true, scout: true, harass: false, expandAt: 210, techAt: 270, queueDepth: 1, fluxWorkers: 3, counters: true, reinforce: 6 },
  hard: { cadence: 10, maxWorkers: 40, maxBases: 3, maxProduction: 4, firstWave: 14, waveGrow: 8, retreat: true, scout: true, harass: true, expandAt: 150, techAt: 225, queueDepth: 2, fluxWorkers: 3, counters: true, reinforce: 8 },
};

const DIRS: [number, number][] = [];
for (let i = 0; i < 16; i++) DIRS.push([Math.round(Math.cos((i * Math.PI) / 8) * 1000) / 1000, Math.round(Math.sin((i * Math.PI) / 8) * 1000) / 1000]);

interface Base { hq: number; x: number; z: number; complete: boolean; seams: number[]; assigned: number; oreLeft: number }

export class AIController implements Thinker {
  readonly player: number;
  readonly enemy: number;
  readonly diff: Difficulty;
  private t: Tuning;
  private f: FactionInfo;
  state: StrategicState = 'Opening';
  private mode: 'rally' | 'attack' = 'rally';
  private waveThreshold: number;
  private attackers = new Set<number>();
  private harassers = new Set<number>();
  private lastHarass = 0;
  private attackX = 0; private attackZ = 0;
  private searchIdx = 0;
  private scoutIdx = 0;
  private scoutWaitUntil = 0;
  private lastScoutBuilt = 0;
  private fleeing = new Map<number, number>();
  private lastThreatTick = -10000;
  /** decayed memory of enemy composition by tag */
  private enemyTags = { Light: 0, Armored: 0, Massive: 0, Hover: 0, defenses: 0 };
  private enemyArmySeen = 0;
  private expandWorker = -1;
  private expandSite = -1;
  private wavesSent = 0;
  private jitter: Record<string, number> = {};
  private reserved: { x: number; z: number; h: number; until: number }[] = [];

  constructor(sim: Sim, player: number) {
    this.player = player;
    this.enemy = 1 - player;
    this.diff = sim.cfg.players[player].difficulty;
    this.t = TUNING[this.diff];
    this.f = FACTIONS[sim.cfg.players[player].faction];
    // seed-driven personality so different seeds play out differently
    this.t = { ...this.t };
    this.waveThreshold = this.t.firstWave + Math.floor(sim.random() * 5) - 2;
    this.t.expandAt += Math.round((sim.random() - 0.5) * 50);
    this.t.techAt += Math.round((sim.random() - 0.5) * 50);
    for (const d of sim.defs) if (d.cls === 'unit') this.jitter[d.id] = 0.85 + sim.random() * 0.3;
  }

  label(): string { return this.state; }

  private cmd(s: Sim, c: Command): boolean { return s.applyCommand(this.player, c); }

  think(s: Sim): void {
    if ((s.tick + this.player * 3) % this.t.cadence !== 0) return;
    const me = this.player;
    const ps = s.players[me];
    const f = this.f;
    const secs = s.tick / TICK_RATE;
    // ---------------------------------------------------------------- census (own entities only)
    const workers: number[] = [], army: number[] = [], scouts: number[] = [];
    const complete: Record<string, number[]> = {}, building: Record<string, number[]> = {};
    const pending: Record<string, number> = {};
    const unitCount: Record<string, number> = {};
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] !== me) continue;
      const d = s.defs[s.def[e]];
      if (d.cls === 'unit') {
        unitCount[d.id] = (unitCount[d.id] ?? 0) + 1;
        if (d.worker) {
          workers.push(e);
          for (const o of s.orders[e]) if (o.t === OT_BUILD) pending[s.defs[o.def].id] = (pending[s.defs[o.def].id] ?? 0) + 1;
        } else if (d.scout) scouts.push(e);
        else army.push(e);
      } else if (d.cls === 'structure') {
        const bucket = s.flags[e] & FL_CONSTRUCTING ? building : complete;
        (bucket[d.id] ??= []).push(e);
        for (const q of s.queue[e]) if (q.kind === 'unit') unitCount[s.defs[q.def].id] = (unitCount[s.defs[q.def].id] ?? 0) + 1;
      }
    }
    const count = (id: string) => (complete[id]?.length ?? 0) + (building[id]?.length ?? 0) + (pending[id] ?? 0);
    const done = (id: string) => complete[id]?.length ?? 0;
    const hqs = complete[f.hq] ?? [];
    if (hqs.length === 0 && (building[f.hq]?.length ?? 0) === 0) return;
    const ORE = DEF_INDEX.ore, VENT = DEF_INDEX.vent;
    const bases: Base[] = [];
    for (const hq of [...hqs, ...(building[f.hq] ?? [])]) {
      const b: Base = { hq, x: s.x[hq], z: s.z[hq], complete: !(s.flags[hq] & FL_CONSTRUCTING), seams: [], assigned: 0, oreLeft: 0 };
      for (const id of s.ids) {
        if (!s.alive[id] || s.def[id] !== ORE) continue;
        if (Math.abs(s.x[id] - b.x) < 14 && Math.abs(s.z[id] - b.z) < 14) { b.seams.push(id); b.assigned += s.assigned[id]; b.oreLeft += s.amount[id]; }
      }
      bases.push(b);
    }
    bases.sort((a, b) => a.hq - b.hq);
    const main = bases[0];
    const liveBases = bases.filter((b) => b.complete);

    // ---------------------------------------------------------------- perception (visible enemies + decaying memory)
    const decay = Math.pow(0.985, this.t.cadence / 20);
    this.enemyTags.Light *= decay; this.enemyTags.Armored *= decay; this.enemyTags.Massive *= decay; this.enemyTags.Hover *= decay;
    this.enemyArmySeen *= decay;
    let seenL = 0, seenA = 0, seenM = 0, seenH = 0, seenValue = 0;
    let threatX = 0, threatZ = 0, threatN = 0, threatValue = 0;
    const visEnemies: number[] = [];
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] !== this.enemy) continue;
      const d = s.defs[s.def[e]];
      if (d.cls !== 'unit' || !s.isVisibleTo(me, e)) continue;
      visEnemies.push(e);
      if (d.worker) continue;
      if (d.tags.includes('Light')) seenL++;
      if (d.tags.includes('Armored')) seenA++;
      if (d.tags.includes('Massive')) seenM++;
      if (d.hover) seenH++;
      if (!d.scout) seenValue += d.ore + d.flux;
      if (!d.weapon && !d.energy) continue;
      // threat = an armed enemy close to one of my structures
      let near = false;
      for (const b of bases) if (Math.abs(s.x[e] - b.x) < 26 && Math.abs(s.z[e] - b.z) < 26) { near = true; break; }
      if (near && !d.scout) { threatX += s.x[e]; threatZ += s.z[e]; threatN++; threatValue += d.ore + d.flux; }
    }
    this.enemyTags.Light = Math.max(this.enemyTags.Light, seenL);
    this.enemyTags.Armored = Math.max(this.enemyTags.Armored, seenA);
    this.enemyTags.Massive = Math.max(this.enemyTags.Massive, seenM);
    this.enemyTags.Hover = Math.max(this.enemyTags.Hover, seenH);
    this.enemyArmySeen = Math.max(this.enemyArmySeen, seenValue);
    let knownDefenses = 0, knownHQ = 0;
    for (const g of ps.ghosts.values()) {
      const gd = s.defs[g.def];
      if (gd.weapon) knownDefenses++;
      if (gd.hq) knownHQ++;
    }
    this.enemyTags.defenses = knownDefenses;
    const underThreat = threatN > 0;
    if (underThreat) { threatX /= threatN; threatZ /= threatN; this.lastThreatTick = s.tick; }

    const afford = (d: { ore: number; flux: number }) => ps.ore >= d.ore && ps.flux >= d.flux;
    let reserveOre = 0;

    // ---------------------------------------------------------------- economy: idle workers, saturation, flux
    const taps = (complete[f.tap] ?? []).filter((t) => s.link[t] >= 0 && s.amount[s.link[t]] > 0);
    const baseForWork = (): Base | null => {
      let best: Base | null = null, bestR = 1e9;
      for (const b of liveBases) {
        if (b.seams.length === 0) continue;
        const r = b.assigned / (b.seams.length * 2);
        if (r < bestR) { bestR = r; best = b; }
      }
      return best;
    };
    const seamFor = (b: Base, w: number): number => {
      let best = -1, bestScore = 1e9;
      for (const id of b.seams) {
        const sc = s.assigned[id] * 50 + Math.abs(s.x[id] - s.x[w]) + Math.abs(s.z[id] - s.z[w]);
        if (sc < bestScore) { bestScore = sc; best = id; }
      }
      return best;
    };
    for (const w of workers) {
      if (this.fleeing.has(w)) continue;
      if (s.orders[w].length > 0 || w === this.expandWorker) continue;
      const b = baseForWork();
      if (!b) break;
      const seam = seamFor(b, w);
      if (seam >= 0 && this.cmd(s, { k: 'gather', ids: [w], target: seam })) { b.assigned++; s.assigned[seam]++; }
    }
    // transfer from over- to under-saturated bases
    if (liveBases.length > 1) {
      const over = liveBases.find((b) => b.assigned > b.seams.length * 2 + 1);
      const under = liveBases.find((b) => b.seams.length > 0 && b.assigned < b.seams.length * 2 - 1);
      if (over && under && over !== under) {
        let moved = 0;
        for (const w of workers) {
          if (moved >= 3) break;
          const o = s.orders[w][0];
          if (!o || o.t !== OT_GATHER || s.carry[w] > 0 || !over.seams.includes(o.target)) continue;
          const seam = seamFor(under, w);
          if (seam >= 0 && this.cmd(s, { k: 'gather', ids: [w], target: seam })) { moved++; s.assigned[seam]++; }
        }
      }
    }
    for (const tap of taps) {
      if (s.assigned[tap] >= this.t.fluxWorkers) continue;
      let best = -1, bestD = 1e9;
      for (const w of workers) {
        const o = s.orders[w][0];
        if (!o || o.t !== OT_GATHER || s.def[o.target] !== ORE || s.carry[w] > 0 || s.wstate[w] === 1) continue;
        const dd = Math.abs(s.x[w] - s.x[tap]) + Math.abs(s.z[w] - s.z[tap]);
        if (dd < bestD) { bestD = dd; best = w; }
      }
      if (best >= 0 && bestD < 40) { this.cmd(s, { k: 'gather', ids: [best], target: tap }); s.assigned[tap]++; }
    }
    // worker production
    let wantWorkers = 2;
    for (const b of liveBases) wantWorkers += Math.min(b.seams.length * 2, 16);
    wantWorkers = Math.min(this.t.maxWorkers, wantWorkers + taps.length * this.t.fluxWorkers);
    const workerDef = s.defs[DEF_INDEX[f.worker]];
    let workerTotal = unitCount[f.worker] ?? 0;
    for (const hq of hqs) {
      if (workerTotal >= wantWorkers) break;
      if (s.queue[hq].length >= 1 + (this.diff === 'hard' ? 1 : 0)) continue;
      if (afford(workerDef) && this.cmd(s, { k: 'train', id: hq, def: f.worker })) workerTotal++;
    }

    // ---------------------------------------------------------------- construction
    const pickBuilder = (x: number, z: number): number => {
      let best = -1, bestD = 1e9;
      for (const w of workers) {
        if (this.fleeing.has(w) || w === this.expandWorker) continue;
        const o = s.orders[w][0];
        if (o && (o.t === OT_BUILD || o.t === OT_CONSTRUCT)) continue;
        if (o && o.t === OT_GATHER && o.def === 1) continue; // leave flux workers alone
        const dd = Math.abs(s.x[w] - x) + Math.abs(s.z[w] - z) + (s.carry[w] > 0 ? 6 : 0);
        if (dd < bestD) { bestD = dd; best = w; }
      }
      return best;
    };
    const findSpot = (defId: string, b: Base, minR: number, maxR: number, biasX: number, biasZ: number): { x: number; z: number } | null => {
      const di = DEF_INDEX[defId];
      const d = s.defs[di];
      const h = d.footprint / 2;
      let best: { x: number; z: number } | null = null, bestScore = 1e9;
      for (let r = minR; r <= maxR; r += 2) {
        for (let k = 0; k < 16; k++) {
          const x = Math.round(b.x + DIRS[k][0] * r), z = Math.round(b.z + DIRS[k][1] * r);
          if (s.canPlace(me, di, x, z) !== PLACE_OK) continue;
          // keep a two-cell lane around the footprint, stay out of the harvest lines and off spots already promised
          let ok = true;
          for (const rsv of this.reserved) if (Math.abs(rsv.x - x) < h + rsv.h + 2 && Math.abs(rsv.z - z) < h + rsv.h + 2) { ok = false; break; }
          if (!ok) continue;
          for (let cz = z - h - 2; cz < z + h + 2 && ok; cz++) for (let cx = x - h - 2; cx < x + h + 2; cx++) {
            if (cx < 0 || cz < 0 || cx >= MAP_SIZE || cz >= MAP_SIZE) { ok = false; break; }
            if (s.blocked[cz * MAP_SIZE + cx] === 2) { ok = false; break; }
          }
          if (!ok) continue;
          for (const bb of bases) {
            for (const id of s.ids) {
              if (!s.alive[id] || (s.def[id] !== ORE && s.def[id] !== VENT)) continue;
              if (Math.abs(s.x[id] - bb.x) > 15 || Math.abs(s.z[id] - bb.z) > 15) continue;
              // distance from candidate to the segment hq -> resource
              const ax = bb.x, az = bb.z, bx = s.x[id], bz = s.z[id];
              const vx = bx - ax, vz = bz - az;
              const tt = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
              const px = ax + vx * tt - x, pz = az + vz * tt - z;
              if (px * px + pz * pz < (h + 2.5) * (h + 2.5)) { ok = false; break; }
            }
            if (!ok) break;
          }
          if (!ok) continue;
          const score = r - (DIRS[k][0] * biasX + DIRS[k][1] * biasZ) * 4;
          if (score < bestScore) { bestScore = score; best = { x, z }; }
        }
        if (best && r >= minR + 4) break;
      }
      return best;
    };
    const toCenter = (b: Base): [number, number] => {
      const dx = MAP_SIZE / 2 - b.x, dz = MAP_SIZE / 2 - b.z;
      const l = Math.sqrt(dx * dx + dz * dz) || 1;
      return [dx / l, dz / l];
    };
    let builtThisThink = false;
    this.reserved = this.reserved.filter((r) => r.until > s.tick);
    const tryBuild = (defId: string, b: Base | undefined, minR = 7, maxR = 17, toward = 1): boolean => {
      if (builtThisThink || !b || !b.complete) return false;
      const d = s.defs[DEF_INDEX[defId]];
      if (s.missingPrereq(me, d)) return false;
      if (!afford(d)) { reserveOre = Math.max(reserveOre, d.ore); return false; }
      const [cx, cz] = toCenter(b);
      const spot = findSpot(defId, b, minR, maxR, cx * toward, cz * toward);
      if (!spot) return false;
      const w = pickBuilder(spot.x, spot.z);
      if (w < 0) return false;
      if (this.cmd(s, { k: 'build', ids: [w], def: defId, x: spot.x, z: spot.z })) { builtThisThink = true; this.reserved.push({ x: spot.x, z: spot.z, h: d.footprint / 2, until: s.tick + 900 }); return true; }
      return false;
    };

    const prodCount = count(f.production);
    const headroom = ps.supplyCap - ps.supplyUsed;
    const prodSites = done(f.production) + hqs.length;
    // supply
    if (ps.supplyCap < SUPPLY_MAX && headroom <= 2 + prodSites * (this.diff === 'easy' ? 1 : 2)) {
      const inProgress = (building[f.supply]?.length ?? 0) + (pending[f.supply] ?? 0);
      if (inProgress < (ps.supplyUsed > 50 && this.diff !== 'easy' ? 2 : 1)) {
        const b = liveBases[(done(f.supply) + inProgress) % Math.max(1, liveBases.length)] ?? main;
        if (tryBuild(f.supply, b, 8, 18, -0.3)) this.state = 'Establish Economy';
      }
    }
    // flux taps on free vents next to finished bases
    const wantTaps = prodCount === 0 ? 0 : count(f.tech) > 0 || secs > this.t.techAt ? 3 : 1;
    if (!builtThisThink && count(f.tap) < wantTaps && done(f.supply) > 0) {
      const tapDef = s.defs[DEF_INDEX[f.tap]];
      if (afford(tapDef)) {
        outer: for (const b of liveBases) {
          for (const id of s.ids) {
            if (!s.alive[id] || s.def[id] !== VENT || s.link[id] >= 0 || s.amount[id] <= 0) continue;
            if (Math.abs(s.x[id] - b.x) > 16 || Math.abs(s.z[id] - b.z) > 16) continue;
            if (s.canPlace(me, DEF_INDEX[f.tap], s.x[id], s.z[id]) !== PLACE_OK) continue;
            const w = pickBuilder(s.x[id], s.z[id]);
            if (w >= 0 && this.cmd(s, { k: 'build', ids: [w], def: f.tap, x: s.x[id], z: s.z[id] })) { builtThisThink = true; break outer; }
          }
        }
      }
    }
    const armySupply = ps.armySupply;
    // first production
    if (done(f.supply) > 0 && prodCount === 0) { if (tryBuild(f.production, main, 9, 19)) this.state = 'Establish Economy'; }
    // expansion
    const baseCount = count(f.hq);
    const lowOre = main && main.oreLeft < 3500;
    const wantExpand = baseCount < this.t.maxBases && prodCount > 0 && !underThreat &&
      ((baseCount === 1 && (secs > this.t.expandAt || armySupply >= 10)) || (baseCount >= 2 && (secs > this.t.expandAt * 3.2 || lowOre) && armySupply >= 12));
    if (wantExpand && !builtThisThink) this.expand(s, workers, afford, (v) => { reserveOre = Math.max(reserveOre, v); });
    else if (!wantExpand && this.expandWorker >= 0) { this.expandWorker = -1; this.expandSite = -1; }
    // tech + more production + defenses
    if (prodCount > 0 && count(f.tap) > 0 && count(f.tech) === 0 && secs > this.t.techAt && (baseCount > 1 || secs > this.t.techAt + 90)) {
      if (tryBuild(f.tech, main, 9, 21)) this.state = 'Tech';
    }
    if (prodCount > 0 && prodCount < this.t.maxProduction && done(f.production) === prodCount) {
      const incomeOK = ps.ore > 260 + prodCount * 90 || (baseCount > prodCount && ps.ore > 200);
      if (incomeOK && (liveBases.length >= prodCount || ps.ore > 450)) tryBuild(f.production, main, 9, 23);
    }
    if (this.diff !== 'easy' && prodCount > 0 && secs > 240) {
      const wantDef = Math.min(liveBases.length + (this.lastThreatTick > 0 ? 1 : 0), 4);
      if (count(f.defense) < wantDef && ps.ore > 250) {
        const b = liveBases[count(f.defense) % liveBases.length];
        tryBuild(f.defense, b, 7, 13, 1.5);
      }
    }
    // repairs (Directorate): send a worker to badly damaged structures once the area is quiet
    if (f.id === 'helix' && this.diff !== 'easy' && !underThreat && s.tick % (this.t.cadence * 4) === 0) {
      for (const list of Object.values(complete)) for (const st of list) {
        if (s.hp[st] < s.d(st).hp * 0.6 && s.tick - s.lastHit[st] > 200) {
          const w = pickBuilder(s.x[st], s.z[st]);
          if (w >= 0) this.cmd(s, { k: 'repair', ids: [w], target: st });
        }
      }
    }

    // ---------------------------------------------------------------- research
    const techB = complete[f.tech]?.[0];
    if (techB !== undefined && s.queue[techB].length === 0) {
      const order = this.diff === 'easy' ? ['atk1'] : ['atk1', 'arm1', 't2', 'atk2', 'arm2', 'atk3', 'arm3'];
      for (const key of order) {
        const id = `${f.id}_${key}`;
        const ti = TECH_INDEX[id];
        if (ps.tech[ti] !== 0) continue;
        if (s.missingTechPrereq(me, ti)) continue;
        const td = TECH_DEFS[ti];
        if (ps.ore >= td.ore + reserveOre * 0.5 && ps.flux >= td.flux) { if (this.cmd(s, { k: 'research', id: techB, tech: id })) this.state = 'Tech'; }
        break;
      }
    }

    // ---------------------------------------------------------------- army production
    const weights = this.compositionWeights(army.length);
    const saving = reserveOre > 0 && !underThreat && armySupply >= 6;
    for (const pb of complete[f.production] ?? []) {
      if (s.queue[pb].length >= this.t.queueDepth + (ps.ore > 500 ? 1 : 0)) continue;
      if (ps.supplyUsed >= ps.supplyCap && ps.supplyCap >= SUPPLY_MAX) break;
      let best: EntityDef | null = null, bestR = 1e9, fallback: EntityDef | null = null, fbR = 1e9;
      for (const uid of s.d(pb).trains) {
        const ud = s.defs[DEF_INDEX[uid]];
        const wgt = weights[uid] ?? 0;
        if (wgt <= 0 || s.missingPrereq(me, ud)) continue;
        const r = ((unitCount[uid] ?? 0) * ud.supply + 0.5) / wgt;
        if (r < bestR) { bestR = r; best = ud; }
        if (afford(ud) && r < fbR) { fbR = r; fallback = ud; }
      }
      let pick = best && afford(best) ? best : null;
      // do not stall on flux-heavy picks forever
      if (!pick && fallback && (ps.ore > 220 || underThreat)) pick = fallback;
      if (!pick) continue;
      if (saving && ps.ore - pick.ore < reserveOre) continue;
      if (this.cmd(s, { k: 'train', id: pb, def: pick.id })) unitCount[pick.id] = (unitCount[pick.id] ?? 0) + 1;
    }

    // ---------------------------------------------------------------- scouting
    this.runScouts(s, scouts, hqs, afford, secs);

    // ---------------------------------------------------------------- worker safety
    this.protectWorkers(s, workers, visEnemies, bases, underThreat);

    // ---------------------------------------------------------------- military
    this.runArmy(s, army, bases, underThreat, threatX, threatZ, threatValue, knownHQ, secs);
    if (!underThreat && this.mode === 'rally' && this.state !== 'Recover') {
      if (secs < 80) this.state = 'Opening';
      else if (this.state === 'Defend Threat' || this.state === 'Attack') this.state = 'Assemble';
      else if (armySupply >= this.waveThreshold * 0.6) this.state = 'Assemble';
    }
  }

  private compositionWeights(armySize: number): Record<string, number> {
    const w = this.baseWeights(armySize);
    for (const k of Object.keys(w)) w[k] *= this.jitter[k] ?? 1;
    return w;
  }

  private baseWeights(armySize: number): Record<string, number> {
    const t = this.enemyTags;
    const total = t.Light + t.Armored + t.Massive + 0.01;
    const armored = this.t.counters ? (t.Armored + t.Massive) / total : 0;
    const light = this.t.counters ? t.Light / total : 0;
    const known = this.t.counters && total > 1.5;
    const siege = this.t.counters && t.defenses >= 2 ? 2.2 : 1;
    if (this.f.id === 'helix') {
      return {
        bulwark: 5 * (known ? 1 + light * 0.8 : 1), lancer: 2.2 * (known ? 1 + armored * 2.2 : 1),
        mender: armySize >= 6 ? 1 : 0, mortar: 1.4 * siege, aegis: 2,
      };
    }
    return {
      thornling: 3.5 * (known ? 1 + armored * 0.6 : 1), sporecaster: 4.5 * (known ? 1 + light * 0.4 : 1), carapace: 3.2 * (known ? 1 + light * 1.2 : 1),
      sage: armySize >= 6 ? 1 : 0, stag: 1.4 * siege, crownbeast: 2 * (known ? 1 + armored * 1.2 : 1),
    };
  }

  private expand(s: Sim, workers: number[], afford: (d: { ore: number; flux: number }) => boolean, reserve: (v: number) => void): void {
    const me = this.player;
    const ps = s.players[me];
    const hqDef = s.defs[DEF_INDEX[this.f.hq]];
    const sites = s.map.sites;
    const home = s.map.starts[me];
    // nearest free site (by distance from home) with no known structure on it
    let best = -1, bestD = 1e9;
    for (let i = 0; i < sites.length; i++) {
      const st = sites[i];
      if (st.kind === 'center' || st.kind === 'main') continue;
      let taken = false;
      for (const e of s.ids) {
        if (!s.alive[e] || s.owner[e] !== me || !s.d(e).hq) continue;
        if (Math.abs(s.x[e] - st.x) < 10 && Math.abs(s.z[e] - st.z) < 10) { taken = true; break; }
      }
      for (const g of ps.ghosts.values()) if (Math.abs(g.x - st.x) < 12 && Math.abs(g.z - st.z) < 12) { taken = true; break; }
      if (taken) continue;
      let ore = 0;
      for (const e of s.ids) if (s.alive[e] && s.d(e).id === 'ore' && Math.abs(s.x[e] - st.x) < 14 && Math.abs(s.z[e] - st.z) < 14) ore += s.amount[e];
      if (ps.explored[s.visIndex(st.x, st.z)] && ore < 1500) continue;
      const dd = Math.abs(st.x - home.x) + Math.abs(st.z - home.z) + (st.owner === me ? 0 : 60);
      if (dd < bestD) { bestD = dd; best = i; }
    }
    if (best < 0) return;
    this.state = 'Expand';
    const st = sites[best];
    if (!afford(hqDef)) reserve(hqDef.ore);
    if (ps.ore < hqDef.ore * 0.6) return;
    if (this.expandWorker < 0 || !s.alive[this.expandWorker] || this.expandSite !== best) {
      let w = -1, wd = 1e9;
      for (const c of workers) {
        const o = s.orders[c][0];
        if (o && o.t !== OT_GATHER) continue;
        if (o && o.def === 1) continue;
        const dd = Math.abs(s.x[c] - st.x) + Math.abs(s.z[c] - st.z);
        if (dd < wd) { wd = dd; w = c; }
      }
      if (w < 0) return;
      this.expandWorker = w; this.expandSite = best;
      this.cmd(s, { k: 'move', ids: [w], x: st.x, z: st.z - 5 });
      return;
    }
    const w = this.expandWorker;
    if (!afford(hqDef)) return;
    if (s.canPlace(me, DEF_INDEX[this.f.hq], st.x, st.z) === PLACE_OK) {
      if (this.cmd(s, { k: 'build', ids: [w], def: this.f.hq, x: st.x, z: st.z })) { this.expandWorker = -1; this.expandSite = -1; }
    } else if (s.orders[w].length === 0 && ps.explored[s.visIndex(st.x, st.z)]) {
      // explored but blocked (e.g. a unit standing there or an enemy structure): try a nudged spot, else give up on this worker
      for (const [ox, oz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
        if (s.canPlace(me, DEF_INDEX[this.f.hq], st.x + ox, st.z + oz) === PLACE_OK && this.cmd(s, { k: 'build', ids: [w], def: this.f.hq, x: st.x + ox, z: st.z + oz })) break;
      }
      this.expandWorker = -1; this.expandSite = -1;
    } else if (s.orders[w].length === 0) {
      this.cmd(s, { k: 'move', ids: [w], x: st.x, z: st.z - 5 });
    }
  }

  private runScouts(s: Sim, scouts: number[], hqs: number[], afford: (d: { ore: number; flux: number }) => boolean, secs: number): void {
    if (!this.t.scout) return;
    const me = this.player;
    const sites = s.map.sites;
    const mine = me === 0 ? 0 : 3, theirs = me === 0 ? 3 : 0;
    const pyl = s.map.pylons[me];
    const route = [
      sites[mine + 1], sites[theirs + 1], sites[theirs], pyl, sites[mine + 2], sites[6], sites[theirs + 2], sites[theirs + 1], s.map.pylons[1 - me], sites[theirs],
    ];
    if (scouts.length === 0) {
      if (secs > 240 && s.tick - this.lastScoutBuilt > 240 * TICK_RATE && hqs.length > 0) {
        const sd = s.defs[DEF_INDEX[this.f.scout]];
        if (afford(sd) && this.cmd(s, { k: 'train', id: hqs[0], def: this.f.scout })) this.lastScoutBuilt = s.tick;
      }
      return;
    }
    const sc = scouts[0];
    if (this.state === 'Opening' || this.state === 'Establish Economy') if (secs > 20 && secs < 150) this.state = 'Scout';
    // under fire: fall back home, then resume
    if (s.tick - s.lastHit[sc] < 30 && s.hp[sc] < s.d(sc).hp * 0.7) {
      const home = s.map.starts[me];
      this.cmd(s, { k: 'move', ids: [sc], x: home.x, z: home.z });
      this.scoutWaitUntil = s.tick + 200;
      this.scoutIdx++;
      return;
    }
    if (s.orders[sc].length > 0 || s.tick < this.scoutWaitUntil) return;
    const wp = route[this.scoutIdx % route.length];
    const dx = wp.x - s.x[sc], dz = wp.z - s.z[sc];
    if (dx * dx + dz * dz < 5 * 5) {
      // arrived: dwell briefly (long enough to capture a pylon), then move on
      this.scoutIdx++;
      this.scoutWaitUntil = s.tick + 70;
      return;
    }
    // ground scouts cannot enter blocked cells: aim slightly off-centre of structures/pylons
    this.cmd(s, { k: 'move', ids: [sc], x: wp.x + 2.5, z: wp.z + 2.5 });
  }

  private protectWorkers(s: Sim, workers: number[], visEnemies: number[], bases: Base[], underThreat: boolean): void {
    if (this.diff === 'easy') return;
    const me = this.player;
    if (underThreat) {
      const armed = visEnemies.filter((e) => !!s.d(e).weapon && !s.d(e).worker && !s.d(e).scout);
      if (armed.length >= 2) {
        for (const w of workers) {
          if (this.fleeing.has(w)) continue;
          let danger = false;
          for (const e of armed) if (Math.abs(s.x[e] - s.x[w]) < 8 && Math.abs(s.z[e] - s.z[w]) < 8) { danger = true; break; }
          if (!danger) continue;
          // run to the farthest base from the raid (or away along the threat vector)
          let bx = s.x[w], bz = s.z[w], bd = -1;
          for (const b of bases) {
            const dd = Math.abs(b.x - s.x[armed[0]]) + Math.abs(b.z - s.z[armed[0]]);
            if (dd > bd) { bd = dd; bx = b.x; bz = b.z; }
          }
          const ax = s.x[w] - s.x[armed[0]], az = s.z[w] - s.z[armed[0]];
          const al = Math.sqrt(ax * ax + az * az) || 1;
          const tx = bd > 40 ? bx : s.x[w] + (ax / al) * 14, tz = bd > 40 ? bz + 6 : s.z[w] + (az / al) * 14;
          if (this.cmd(s, { k: 'move', ids: [w], x: Math.min(MAP_SIZE - 6, Math.max(6, tx)), z: Math.min(MAP_SIZE - 6, Math.max(6, tz)) })) this.fleeing.set(w, s.tick);
        }
      }
    }
    if (this.fleeing.size > 0 && s.tick - this.lastThreatTick > 100) {
      // threat has passed: evacuated workers go back to work (idle workers are re-assigned next think)
      for (const w of this.fleeing.keys()) if (s.alive[w] && s.owner[w] === me) this.cmd(s, { k: 'stop', ids: [w] });
      this.fleeing.clear();
    }
  }

  private runArmy(s: Sim, army: number[], bases: Base[], underThreat: boolean, tx: number, tz: number, threatValue: number, knownHQ: number, secs: number): void {
    const me = this.player;
    const ps = s.players[me];
    // endgame: commit. No more retreats, small waves leave immediately, and a side that has run dry sends everything.
    const late = s.tick >= ENDGAME_TICK;
    if (late) this.waveThreshold = Math.min(this.waveThreshold, 8);
    let oreLeft = 0;
    for (const b of bases) oreLeft += b.oreLeft;
    if (late && oreLeft < 200 && ps.ore < 150) {
      for (const e of s.ids) if (s.alive[e] && s.owner[e] === me && s.d(e).worker && !army.includes(e)) army.push(e);
    }
    if (army.length === 0) { this.attackers.clear(); this.harassers.clear(); if (this.mode === 'attack') { this.mode = 'rally'; this.waveThreshold = Math.min(70, this.waveThreshold + 4); } return; }
    for (const id of this.attackers) if (!s.alive[id] || s.owner[id] !== me) this.attackers.delete(id);
    for (const id of this.harassers) if (!s.alive[id] || s.owner[id] !== me) this.harassers.delete(id);
    // forward-most base decides the rally point
    let fwd = bases[0], fd = 1e9;
    for (const b of bases) {
      if (!b.complete) continue;
      const dd = Math.abs(b.x - MAP_SIZE / 2) + Math.abs(b.z - MAP_SIZE / 2);
      if (dd < fd) { fd = dd; fwd = b; }
    }
    const cdx = MAP_SIZE / 2 - fwd.x, cdz = MAP_SIZE / 2 - fwd.z;
    const cl = Math.sqrt(cdx * cdx + cdz * cdz) || 1;
    const rallyX = fwd.x + (cdx / cl) * 14, rallyZ = fwd.z + (cdz / cl) * 14;
    const sendAmove = (ids: number[], x: number, z: number) => {
      const need = ids.filter((e) => {
        const o = s.orders[e][0];
        if (!o) return true;
        if (o.t !== OT_AMOVE) return s.target[e] < 0;
        return Math.abs(o.x - x) + Math.abs(o.z - z) > 9;
      });
      if (need.length > 0) this.cmd(s, { k: 'amove', ids: need, x, z });
    };

    // --- defend
    if (underThreat) {
      this.state = 'Defend Threat';
      const defenders = army.filter((e) => !this.harassers.has(e) && (this.mode !== 'attack' || !this.attackers.has(e) || threatValue > 300));
      if (this.mode === 'attack' && threatValue > 300 && this.t.retreat) { this.mode = 'rally'; this.attackers.clear(); }
      sendAmove(defenders, tx, tz);
      return;
    }

    const home = army.filter((e) => !this.attackers.has(e) && !this.harassers.has(e));
    let homeSupply = 0;
    for (const e of home) homeSupply += s.d(e).supply;

    // --- harass (hard): a few fast units raid the enemy natural's harvest line
    if (this.t.harass && this.mode === 'rally' && this.harassers.size === 0 && secs > 270 && s.tick - this.lastHarass > 150 * TICK_RATE && homeSupply >= 10) {
      const fast = home.filter((e) => s.d(e).speed >= 3.3 && s.d(e).supply <= 2 && !!s.d(e).weapon).slice(0, 4);
      if (fast.length >= 3) {
        for (const e of fast) this.harassers.add(e);
        this.lastHarass = s.tick;
        const site = s.map.sites[(me === 0 ? 3 : 0) + 1];
        this.cmd(s, { k: 'amove', ids: fast, x: site.x, z: site.z + (me === 0 ? -8 : 8) });
        this.state = 'Harass';
      }
    }
    if (this.harassers.size > 0) {
      const hs = [...this.harassers];
      const idle = hs.every((e) => s.orders[e].length === 0 && s.target[e] < 0);
      if (idle || s.tick - this.lastHarass > 80 * TICK_RATE) {
        if (s.tick - this.lastHarass > 80 * TICK_RATE || idle) { this.cmd(s, { k: 'move', ids: hs, x: rallyX, z: rallyZ }); this.harassers.clear(); }
      }
    }

    if (this.mode === 'rally') {
      const idle = home.filter((e) => s.orders[e].length === 0 && s.target[e] < 0 && Math.abs(s.x[e] - rallyX) + Math.abs(s.z[e] - rallyZ) > 12);
      if (idle.length > 0) this.cmd(s, { k: 'amove', ids: idle, x: rallyX, z: rallyZ });
      const maxed = ps.supplyUsed >= SUPPLY_MAX - 8;
      if (homeSupply >= this.waveThreshold || maxed || (secs > 900 && homeSupply >= 10)) {
        this.mode = 'attack';
        this.wavesSent++;
        for (const e of home) this.attackers.add(e);
        this.pickAttackTarget(s, knownHQ);
        this.state = 'Attack';
      }
      return;
    }

    // --- attack
    this.state = knownHQ === 0 && ps.explored[s.visIndex(s.map.starts[this.enemy].x, s.map.starts[this.enemy].z)] ? 'Final Push' : 'Attack';
    const atk = [...this.attackers];
    if (atk.length === 0) {
      this.mode = 'rally';
      this.waveThreshold = Math.min(70, this.waveThreshold + this.t.waveGrow);
      this.state = 'Recover';
      return;
    }
    let cx = 0, cz = 0, mySupply = 0;
    for (const e of atk) { cx += s.x[e]; cz += s.z[e]; mySupply += s.d(e).supply; }
    cx /= atk.length; cz /= atk.length;
    // reinforcements leave in groups rather than trickling
    if (homeSupply >= Math.max(1, this.t.reinforce)) for (const e of home) this.attackers.add(e);
    // retreat when clearly outmatched near the front
    if (this.t.retreat && !late) {
      let myVal = 0, enVal = 0;
      for (const e of atk) if (Math.abs(s.x[e] - cx) < 16 && Math.abs(s.z[e] - cz) < 16) myVal += (s.d(e).ore + s.d(e).flux) * (0.4 + 0.6 * (s.hp[e] / s.d(e).hp));
      for (const e of s.ids) {
        if (!s.alive[e] || s.owner[e] !== this.enemy || !s.isVisibleTo(me, e)) continue;
        const d = s.d(e);
        if (Math.abs(s.x[e] - cx) > 18 || Math.abs(s.z[e] - cz) > 18) continue;
        if (d.cls === 'unit' && !d.worker && !d.scout) enVal += (d.ore + d.flux) * (0.4 + 0.6 * (s.hp[e] / d.hp));
        else if (d.cls === 'structure' && d.weapon) enVal += 180;
      }
      if (enVal > myVal * 1.7 && myVal > 0 && ps.supplyUsed < SUPPLY_MAX - 12) {
        this.cmd(s, { k: 'move', ids: atk, x: rallyX, z: rallyZ });
        this.attackers.clear();
        this.mode = 'rally';
        this.waveThreshold = Math.min(70, Math.max(this.waveThreshold, mySupply) + this.t.waveGrow);
        this.state = 'Recover';
        return;
      }
    }
    // re-evaluate the objective: nearest known enemy structure, else search expansion sites
    this.pickAttackTarget(s, knownHQ, cx, cz);
    sendAmove(atk, this.attackX, this.attackZ);
  }

  private pickAttackTarget(s: Sim, knownHQ: number, cx?: number, cz?: number): void {
    const me = this.player;
    const ps = s.players[me];
    if (cx === undefined || cz === undefined) { cx = s.map.starts[me].x; cz = s.map.starts[me].z; }
    let best: { x: number; z: number } | null = null, bestScore = 1e9;
    for (const g of ps.ghosts.values()) {
      // confidence decays with the age of the sighting
      const age = (s.tick - g.tick) / TICK_RATE;
      const conf = Math.exp(-age / 240);
      const gd = s.defs[g.def];
      const score = (Math.abs(g.x - cx) + Math.abs(g.z - cz)) * (1.6 - conf) - (gd.hq ? 10 : 0);
      if (score < bestScore) { bestScore = score; best = { x: g.x, z: g.z }; }
    }
    if (!best) {
      const start = s.map.starts[this.enemy];
      const startSeen = ps.visible[s.visIndex(start.x, start.z)] > 0;
      if (!ps.explored[s.visIndex(start.x, start.z)] || (!startSeen && knownHQ === 0 && this.searchIdx === 0)) best = start;
      else {
        // search: cycle through expansion sites until something is found
        const sites = s.map.sites;
        const st = sites[this.searchIdx % sites.length];
        if (Math.abs(st.x - cx) + Math.abs(st.z - cz) < 12 || ps.visible[s.visIndex(st.x, st.z)]) this.searchIdx++;
        const nx = sites[this.searchIdx % sites.length];
        best = { x: nx.x, z: nx.z };
      }
    }
    // aim next to (not inside) the footprint so paths resolve cleanly
    this.attackX = best.x; this.attackZ = best.z;
  }
}

/** Attach AI controllers to every AI-controlled player of a simulation. */
export function attachAI(sim: Sim): void {
  for (let p = 0; p < 2; p++) if (sim.cfg.players[p].controller === 'ai') sim.thinkers[p] = new AIController(sim, p);
}

export { OT_MOVE };
