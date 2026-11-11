// simulation-core: bookkeeping (supply, saturation), production/construction, fog-of-war vision,
// neutral objectives, endgame rules, statistics and victory.
import { DEF_INDEX, TECH_DEFS } from '../data/defs';
import { MAP_SIZE, VIS_CELL, VIS_SIZE } from '../world/map';
import {
  DECISION_TICK, ENDGAME_TICK, FL_CONSTRUCTING, NEUTRAL, OT_CONSTRUCT, OT_GATHER, PULSE_PERIOD, SUPPLY_MAX, TICK_RATE,
  newOrder, type Sim,
} from './sim';
import { findNode } from './units';

/** Recount derived per-tick values. Recounting (rather than incrementally tracking) keeps the state self-healing. */
export function updateBookkeeping(s: Sim): void {
  const ids = s.ids;
  for (const p of s.players) { p.supplyUsed = 0; p.supplyCap = 0; p.workers = 0; p.armyValue = 0; p.armySupply = 0; }
  for (let i = 0; i < ids.length; i++) { const e = ids[i]; s.miners[e] = 0; s.assigned[e] = 0; s.builders[e] = 0; }
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const o = s.owner[e];
    if (o >= 2) continue;
    const d = s.defs[s.def[e]];
    const ps = s.players[o];
    if (d.cls === 'unit') {
      ps.supplyUsed += d.supply;
      if (d.worker) {
        ps.workers++;
        const ord = s.orders[e][0];
        if (ord && ord.t === OT_GATHER && ord.target >= 0 && s.alive[ord.target]) {
          if (s.assigned[ord.target] < 250) s.assigned[ord.target]++;
          if (s.wstate[e] === 1) s.miners[ord.target]++;
        }
      } else if (!d.scout) { ps.armyValue += d.ore + d.flux; ps.armySupply += d.supply; }
    } else if (d.cls === 'structure') {
      if (!(s.flags[e] & FL_CONSTRUCTING)) ps.supplyCap += d.supplyProvided;
      const q = s.queue[e];
      for (let k = 0; k < q.length; k++) if (q[k].kind === 'unit' && q[k].started) ps.supplyUsed += s.defs[q[k].def].supply;
    }
  }
  for (const p of s.players) if (p.supplyCap > SUPPLY_MAX) p.supplyCap = SUPPLY_MAX;
}

function completeStructure(s: Sim, e: number): void {
  const d = s.defs[s.def[e]];
  const o = s.owner[e];
  s.flags[e] &= ~FL_CONSTRUCTING;
  s.progress[e] = 1;
  const ps = s.players[o];
  ps.stats.structuresBuilt++;
  s.events.push({ t: 'built', id: e, owner: o, def: s.def[e] });
  if (d.hq) {
    if (ps.stats.firstExpansionTick < 0) ps.stats.firstExpansionTick = s.tick;
    ps.stats.timeline.push({ t: s.tick, text: `Expansion established (${d.name})` });
  } else if (d.researches.length > 0) ps.stats.timeline.push({ t: s.tick, text: `${d.name} online` });
  // builders that were assembling it look for more work nearby
  for (const id of s.ids) {
    if (!s.alive[id] || s.owner[id] !== o) continue;
    const ord = s.orders[id][0];
    if (ord && ord.t === OT_CONSTRUCT && ord.target === e) {
      s.finishOrder(id);
      if (s.orders[id].length === 0 && d.tap) {
        const g = newOrder(OT_GATHER, s.x[e], s.z[e], e);
        s.orders[id].push(g);
      }
    }
  }
}

export function spawnTrained(s: Sim, src: number, defIdx: number): number {
  const d = s.defs[defIdx];
  const o = s.owner[src];
  const half = s.half(src);
  let tx = s.rallyX[src], tz = s.rallyZ[src];
  const hasRally = !Number.isNaN(tx);
  if (!hasRally) { tx = MAP_SIZE / 2; tz = MAP_SIZE / 2; }
  let dx = tx - s.x[src], dz = tz - s.z[src];
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  dx /= len; dz /= len;
  // exit on the side of the footprint facing the rally point
  const k = (half + d.radius + 0.6) / Math.max(Math.abs(dx), Math.abs(dz), 0.001);
  const u = s.spawnUnitNear(defIdx, o, s.x[src] + dx * Math.min(k, half * 1.5 + 1.5), s.z[src] + dz * Math.min(k, half * 1.5 + 1.5));
  s.fx[u] = dx; s.fz[u] = dz;
  const ps = s.players[o];
  ps.stats.unitsCreated++;
  s.events.push({ t: 'trained', id: u, owner: o, def: defIdx });
  const rt = s.rallyTarget[src];
  if (d.worker) {
    let node = -1;
    if (hasRally && rt >= 0 && s.alive[rt]) {
      const rd = s.defs[s.def[rt]];
      if (rd.id === 'ore' || (rd.tap && s.owner[rt] === o)) node = rt;
    }
    if (node < 0 && !hasRally) node = findNode(s, u, s.x[src], s.z[src], true, 16);
    if (node >= 0) { s.orders[u].push(newOrder(OT_GATHER, s.x[node], s.z[node], node)); return u; }
  }
  if (hasRally) s.applyCommand(o, { k: 'move', ids: [u], x: tx, z: tz });
  else {
    // step clear of the exit so the next unit has room
    s.applyCommand(o, { k: 'move', ids: [u], x: s.x[u] + dx * 2.5, z: s.z[u] + dz * 2.5 });
  }
  ps.stats.commands--; // internal order, not a player command
  return u;
}

export function updateProduction(s: Sim): void {
  const ids = s.ids;
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'structure') continue;
    const o = s.owner[e];
    const ps = s.players[o];
    if (s.flags[e] & FL_CONSTRUCTING) {
      // Directorate structures need Fabricators on site; Chorus growths mature on their own
      const n = ps.faction === 'chorus' ? 1 : s.builders[e];
      if (n > 0) {
        const rate = (1 + 0.5 * Math.min(3, n - 1)) / (d.buildTime * TICK_RATE);
        s.progress[e] += rate;
        s.hp[e] = Math.min(d.hp, s.hp[e] + d.hp * 0.9 * rate);
        if (s.progress[e] >= 1) completeStructure(s, e);
      }
      continue;
    }
    const q = s.queue[e];
    if (q.length === 0) continue;
    const it = q[0];
    if (!it.started) {
      if (it.kind === 'unit') {
        const sup = s.defs[it.def].supply;
        if (ps.supplyUsed + sup > ps.supplyCap) {
          if (s.tick - ps.lastSupplyAlert > 300) { ps.lastSupplyAlert = s.tick; s.alert(o, 'supply', s.x[e], s.z[e]); }
          continue;
        }
        ps.supplyUsed += sup;
      }
      it.started = true;
    }
    it.progress++;
    if (it.progress >= it.total) {
      q.shift();
      if (it.kind === 'unit') spawnTrained(s, e, it.def);
      else {
        const t = TECH_DEFS[it.def];
        ps.tech[it.def] = 2;
        if (t.kind === 'attack') ps.atkLevel = Math.max(ps.atkLevel, t.level);
        else if (t.kind === 'armor') ps.armLevel = Math.max(ps.armLevel, t.level);
        ps.stats.timeline.push({ t: s.tick, text: `Researched ${t.name}` });
        s.events.push({ t: 'research', owner: o, tech: it.def });
      }
    }
  }
}

/** Why the head of a structure's queue is not progressing ('' when it is). */
export function queuePauseReason(s: Sim, e: number): string {
  const q = s.queue[e];
  if (q.length === 0 || q[0].started) return '';
  if (q[0].kind === 'unit') {
    const ps = s.players[s.owner[e]];
    if (ps.supplyUsed + s.defs[q[0].def].supply > ps.supplyCap) return ps.supplyCap >= SUPPLY_MAX ? 'Supply limit reached' : 'Supply blocked - build more supply';
  }
  return '';
}

// ---------------------------------------------------------------------- vision
interface RayTable { n: number; off: Int16Array; rayStart: Int32Array; rays: Int16Array }
const rayTables = new Map<number, RayTable>();

function rayTable(r: number): RayTable {
  let t = rayTables.get(r);
  if (t) return t;
  const off: number[] = [], rayStart: number[] = [], rays: number[] = [];
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r + r) continue;
      off.push(dx, dz);
      rayStart.push(rays.length / 2);
      const steps = Math.max(Math.abs(dx), Math.abs(dz));
      for (let k = 1; k < steps; k++) rays.push(Math.round((dx * k) / steps), Math.round((dz * k) / steps));
    }
  }
  rayStart.push(rays.length / 2);
  t = { n: off.length / 2, off: Int16Array.from(off), rayStart: Int32Array.from(rayStart), rays: Int16Array.from(rays) };
  rayTables.set(r, t);
  return t;
}

function stamp(s: Sim, vis: Uint8Array, x: number, z: number, sight: number, elev: number): void {
  const r = Math.max(1, Math.round(sight / VIS_CELL));
  const t = rayTable(r);
  const vx = Math.min(VIS_SIZE - 1, Math.max(0, (x / VIS_CELL) | 0)), vz = Math.min(VIS_SIZE - 1, Math.max(0, (z / VIS_CELL) | 0));
  const ve = s.map.visElev, vb = s.map.visBrush;
  for (let i = 0; i < t.n; i++) {
    const dx = t.off[i * 2], dz = t.off[i * 2 + 1];
    const cx = vx + dx, cz = vz + dz;
    if (cx < 0 || cz < 0 || cx >= VIS_SIZE || cz >= VIS_SIZE) continue;
    const ci = cz * VIS_SIZE + cx;
    if (vis[ci]) continue;
    const near = dx >= -1 && dx <= 1 && dz >= -1 && dz <= 1;
    if (!near) {
      const ce = ve[ci];
      if (ce > elev && ce !== 3) continue;
      if (vb[ci]) continue;
      let blockedRay = false;
      for (let k = t.rayStart[i]; k < t.rayStart[i + 1]; k++) {
        const rx = t.rays[k * 2], rz = t.rays[k * 2 + 1];
        const ri = (vz + rz) * VIS_SIZE + vx + rx;
        if (ve[ri] > elev || (vb[ri] && (rx < -1 || rx > 1 || rz < -1 || rz > 1))) { blockedRay = true; break; }
      }
      if (blockedRay) continue;
    }
    vis[ci] = 1;
  }
}

export function updateVision(s: Sim, initial: boolean): void {
  const pulse = s.tick < s.revealUntil;
  for (let p = 0; p < 2; p++) s.players[p].visible.fill(pulse ? 1 : 0);
  const ids = s.ids;
  const PYLON = DEF_INDEX.watch_pylon;
  if (!pulse) {
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!s.alive[e]) continue;
      let o = s.owner[e];
      const d = s.defs[s.def[e]];
      let sight = d.sight;
      let elev = 3;
      if (o === NEUTRAL) {
        if (s.def[e] !== PYLON || s.capOwner[e] < 0) continue;
        o = s.capOwner[e];
      } else {
        if (sight <= 0) continue;
        const ce = s.map.elev[Math.min(MAP_SIZE - 1, s.z[e] | 0) * MAP_SIZE + Math.min(MAP_SIZE - 1, s.x[e] | 0)];
        elev = d.hover ? 3 : d.cls === 'structure' ? Math.min(2, ce + 1) : ce;
        if (ce >= 2 && d.cls === 'unit') sight += 2; // high ground bonus
        if (s.flags[e] & FL_CONSTRUCTING) sight = 4;
      }
      stamp(s, s.players[o].visible, s.x[e], s.z[e], sight, elev);
    }
    for (const fx of s.effects) if (fx.k === 'spike') stamp(s, s.players[fx.owner].visible, fx.x, fx.z, fx.r, 3);
  }
  // explored memory + last-known enemy structure ghosts
  for (let p = 0; p < 2; p++) {
    const ps = s.players[p];
    const vis = ps.visible, exp = ps.explored;
    for (let i = 0; i < vis.length; i++) if (vis[i]) exp[i] = 1;
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!s.alive[e] || s.owner[e] === p) continue;
      const d = s.defs[s.def[e]];
      if (d.cls !== 'structure' && d.id !== 'barrier') continue;
      if (s.owner[e] === NEUTRAL && d.id !== 'barrier') continue;
      if (d.id === 'barrier') continue;
      if (vis[s.visIndex(s.x[e], s.z[e])]) {
        const g = ps.ghosts.get(e);
        if (g) { g.tick = s.tick; g.hpFrac = s.hp[e] / d.hp; }
        else ps.ghosts.set(e, { id: e, def: s.def[e], owner: s.owner[e], x: s.x[e], z: s.z[e], tick: s.tick, hpFrac: s.hp[e] / d.hp });
      }
    }
    if (ps.ghosts.size > 0) {
      for (const [id, g] of ps.ghosts) {
        if ((!s.alive[id] || s.def[id] !== g.def || s.owner[id] !== g.owner) && vis[s.visIndex(g.x, g.z)]) ps.ghosts.delete(id);
      }
    }
  }
  void initial;
}

// ---------------------------------------------------------------------- neutral objectives, endgame, stats, victory
export function updateWorldObjects(s: Sim): void {
  const tick = s.tick;
  const ids = s.ids;
  const PYLON = DEF_INDEX.watch_pylon, POD = DEF_INDEX.pod;
  const out = s.scratch;
  if (tick % 2 === 0) {
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!s.alive[e]) continue;
      if (s.def[e] === PYLON) {
        const n = s.query(s.x[e], s.z[e], 4.5, out);
        let c0 = 0, c1 = 0;
        for (let k = 0; k < n; k++) {
          const o = out[k];
          if (!s.alive[o] || s.owner[o] >= 2 || s.defs[s.def[o]].cls !== 'unit') continue;
          const dx = s.x[o] - s.x[e], dz = s.z[o] - s.z[e];
          if (dx * dx + dz * dz > 3.6 * 3.6) continue;
          if (s.owner[o] === 0) c0++; else c1++;
        }
        const who = c0 > 0 && c1 === 0 ? 0 : c1 > 0 && c0 === 0 ? 1 : -1;
        if (who >= 0 && s.capOwner[e] !== who) {
          if (s.capBy[e] !== who) { s.capBy[e] = who; s.capProgress[e] = 0; }
          s.capProgress[e] += 2;
          if (s.capProgress[e] >= 60) {
            s.capOwner[e] = who; s.capProgress[e] = 0; s.capBy[e] = -1;
            s.events.push({ t: 'captured', id: e, owner: who });
            s.players[who].stats.timeline.push({ t: tick, text: 'Captured a Watch Pylon' });
          }
        } else if (s.capProgress[e] > 0) {
          s.capProgress[e] = Math.max(0, s.capProgress[e] - 2);
          if (s.capProgress[e] === 0) s.capBy[e] = -1;
        }
      } else if (s.def[e] === POD && tick % 4 === 0) {
        const n = s.query(s.x[e], s.z[e], 3, out);
        for (let k = 0; k < n; k++) {
          const o = out[k];
          if (!s.alive[o] || s.owner[o] >= 2) continue;
          const od = s.defs[s.def[o]];
          if (od.cls !== 'unit' || od.hover) continue;
          const dx = s.x[o] - s.x[e], dz = s.z[o] - s.z[e];
          if (dx * dx + dz * dz > 1.8 * 1.8) continue;
          const ps = s.players[s.owner[o]];
          ps.ore += 100; ps.flux += 25;
          ps.stats.oreCollected += 100; ps.stats.fluxCollected += 25;
          s.events.push({ t: 'salvage', owner: s.owner[o], x: s.x[e], z: s.z[e] });
          s.kill(e, -1, true);
          break;
        }
      }
    }
  }
  // endgame: periodic map-wide reveal pulse from the neutral centre (harvest bonus applied on deposit)
  if (tick >= ENDGAME_TICK && (tick - ENDGAME_TICK) % PULSE_PERIOD === 0) {
    s.revealUntil = tick + 5 * TICK_RATE;
    s.events.push({ t: 'pulse' });
  }
  // last-resort verdict so no match can stall forever (announced five minutes ahead by the HUD)
  if (tick === DECISION_TICK) {
    const value = [0, 0];
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (!s.alive[e] || s.owner[e] > 1) continue;
      const d = s.defs[s.def[e]];
      value[s.owner[e]] += (d.ore + d.flux) * Math.max(0, s.hp[e] / d.hp);
    }
    for (let p = 0; p < 2; p++) value[p] += s.players[p].ore + s.players[p].flux;
    for (let p = 0; p < 2; p++) s.players[p].stats.timeline.push({ t: tick, text: `Decision at 35:00 - surviving force value ${Math.round(value[p])}` });
    s.endMatch(value[1] > value[0] ? 1 : 0);
    return;
  }
  // statistics samples every 10 s
  if (tick % 200 === 0) {
    for (const ps of s.players) ps.stats.samples.push({ t: tick, army: ps.armyValue, workers: ps.workers, income: Math.round(ps.stats.oreCollected + ps.stats.fluxCollected) });
  }
  // victory: a player with no headquarters (complete or under construction) is eliminated
  if (tick % 10 === 5) {
    const hq = [0, 0];
    for (let i = 0; i < ids.length; i++) {
      const e = ids[i];
      if (s.alive[e] && s.owner[e] < 2 && s.defs[s.def[e]].hq) hq[s.owner[e]]++;
    }
    if (hq[0] === 0 && hq[1] === 0) s.endMatch(1);
    else if (hq[0] === 0) s.endMatch(1);
    else if (hq[1] === 0) s.endMatch(0);
  }
}
