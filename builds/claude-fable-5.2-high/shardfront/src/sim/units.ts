// simulation-core: per-unit order execution (move, attack-move, gather, build, repair, follow, abilities)
// plus steering, local separation and terrain collision. All iteration is in ascending entity-id order.
import { ABILITY_BY_ID, DEF_INDEX } from '../data/defs';
import type { EntityDef } from '../data/types';
import { MAP_SIZE } from '../world/map';
import {
  DT, ENDGAME_TICK, FL_ANCHOR, FL_BRACED, FL_CONSTRUCTING, FL_CURLED, FL_GHOST, FL_HOLD, FL_WORKING,
  OT_ABILITY, OT_AMOVE, OT_ATTACK, OT_BUILD, OT_CONSTRUCT, OT_FOLLOW, OT_GATHER, OT_MOVE, OT_PATROL,
  PLACE_OK, type Order, type Sim,
} from './sim';
import { acquireTarget, engage, isValidTarget } from './combat';

export const GATHER_TICKS = 32; // 1.6 s
export const ORE_LOAD = 5;
export const FLUX_LOAD = 4;

/** Steer toward a goal; returns true once within `reach` of the goal body (square of half-extent `half`). */
export function navTo(s: Sim, e: number, gx: number, gz: number, half: number, reach: number): boolean {
  const dx = Math.abs(gx - s.x[e]), dz = Math.abs(gz - s.z[e]);
  const a = Math.max(0, dx - half), b = Math.max(0, dz - half);
  if (a * a + b * b <= reach * reach) {
    s.navOn[e] = 0; s.path[e] = null; s.navFail[e] = 0;
    return true;
  }
  const moved = Math.abs(gx - s.navGoalX[e]) + Math.abs(gz - s.navGoalZ[e]);
  const need = !s.navOn[e] || (moved > 1.0 && s.tick >= s.repathAt[e]) || (s.stuck[e] > 50 && s.tick >= s.repathAt[e]);
  if (need) {
    const d = s.defs[s.def[e]];
    if (d.hover) {
      s.setNav(e, [gx, gz], gx, gz);
    } else if (s.pathBudget > 0) {
      s.pathBudget--;
      if (s.stuck[e] > 50) s.navFail[e]++;
      let p = s.pathfinder.findPath(s.x[e], s.z[e], gx, gz, half, reach);
      if (p.length === 0) p = [gx, gz];
      s.setNav(e, p, gx, gz);
      s.repathAt[e] = s.tick + 12 + (e % 7);
    } else if (!s.navOn[e]) {
      // out of path budget this tick: head straight for the goal and retry next tick
      s.path[e] = [gx, gz]; s.pathI[e] = 0; s.navOn[e] = 1;
      s.navGoalX[e] = gx + 100; s.navGoalZ[e] = gz; s.repathAt[e] = 0;
    }
  }
  return false;
}

function stopNav(s: Sim, e: number): void { s.navOn[e] = 0; s.path[e] = null; }

/** A unit that keeps bumping into its already-arrived neighbours near the goal counts as arrived. */
function crowdArrived(s: Sim, e: number, gx: number, gz: number): boolean {
  const st = s.stuck[e];
  if (st < 8) return false;
  const dx = gx - s.x[e], dz = gz - s.z[e];
  const lim = 1.2 + st * 0.06;
  return dx * dx + dz * dz < lim * lim;
}

function nearestDropoff(s: Sim, e: number): number {
  const o = s.owner[e];
  let best = -1, bestD = 1e18;
  for (const id of s.ids) {
    if (!s.alive[id] || s.owner[id] !== o) continue;
    const d = s.defs[s.def[id]];
    if (!d.dropoff || (s.flags[id] & FL_CONSTRUCTING)) continue;
    const dx = s.x[id] - s.x[e], dz = s.z[id] - s.z[e];
    const dd = dx * dx + dz * dz;
    if (dd < bestD) { bestD = dd; best = id; }
  }
  return best;
}

function nodeValid(s: Sim, e: number, node: number): boolean {
  if (node < 0 || !s.alive[node]) return false;
  const nd = s.defs[s.def[node]];
  if (nd.id === 'ore') return s.amount[node] > 0;
  if (nd.tap) return s.owner[node] === s.owner[e] && !(s.flags[node] & FL_CONSTRUCTING) && s.link[node] >= 0 && s.amount[s.link[node]] > 0;
  return false;
}

/** Find a harvest node of the same kind near a point: least-assigned first, then nearest. */
export function findNode(s: Sim, e: number, nx: number, nz: number, ore: boolean, radius: number): number {
  let best = -1, bestScore = 1e18;
  const ORE = DEF_INDEX.ore;
  for (const id of s.ids) {
    if (!s.alive[id]) continue;
    if (ore ? s.def[id] !== ORE : !s.defs[s.def[id]].tap) continue;
    if (!nodeValid(s, e, id)) continue;
    const dx = s.x[id] - nx, dz = s.z[id] - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 > radius * radius) continue;
    const wx = s.x[id] - s.x[e], wz = s.z[id] - s.z[e];
    const score = s.assigned[id] * 60 + Math.sqrt(wx * wx + wz * wz);
    if (score < bestScore) { bestScore = score; best = id; }
  }
  return best;
}

function updateGather(s: Sim, e: number, d: EntityDef, ord: Order): void {
  s.flags[e] |= FL_GHOST;
  if (s.carry[e] > 0 && s.wstate[e] === 2) {
    const hq = nearestDropoff(s, e);
    if (hq < 0) { stopNav(s, e); return; }
    if (navTo(s, e, s.x[hq], s.z[hq], s.half(hq), d.radius + 0.8)) {
      const ps = s.players[s.owner[e]];
      const amt = s.carry[e] * (s.tick >= ENDGAME_TICK ? 1.15 : 1);
      if (s.carryKind[e] === 1) { ps.ore += amt; ps.stats.oreCollected += amt; }
      else { ps.flux += amt; ps.stats.fluxCollected += amt; }
      s.events.push({ t: 'deposit', id: e, owner: s.owner[e], kind: s.carryKind[e], amount: amt });
      s.carry[e] = 0; s.carryKind[e] = 0; s.wstate[e] = 0;
    }
    return;
  }
  let node = ord.target;
  if (!nodeValid(s, e, node)) {
    const wasOre = node < 0 || !s.alive[node] ? ord.def !== 1 : s.defs[s.def[node]].id === 'ore';
    if (s.wstate[e] === 1) s.wstate[e] = 0;
    node = findNode(s, e, ord.x, ord.z, wasOre, 16);
    if (node < 0) {
      if (s.carry[e] > 0) { s.wstate[e] = 2; return; }
      s.finishOrder(e);
      return;
    }
    ord.target = node; ord.x = s.x[node]; ord.z = s.z[node];
    s.assigned[node]++;
  }
  const isTap = !!s.defs[s.def[node]].tap;
  ord.def = isTap ? 1 : 0;
  if (s.wstate[e] === 1) {
    s.flags[e] |= FL_ANCHOR | FL_WORKING;
    stopNav(s, e);
    face(s, e, s.x[node] - s.x[e], s.z[node] - s.z[e]);
    if (--s.timer[e] <= 0) {
      const src = isTap ? s.link[node] : node;
      const amt = Math.min(isTap ? FLUX_LOAD : ORE_LOAD, s.amount[src]);
      s.amount[src] -= amt;
      s.carry[e] = amt; s.carryKind[e] = isTap ? 2 : 1;
      s.wstate[e] = 2;
      if (s.amount[src] <= 0) {
        if (!isTap) {
          // last seam of a field: raise the depleted alert
          let left = 0;
          for (const id of s.ids) if (s.alive[id] && id !== node && s.def[id] === s.def[node] && Math.abs(s.x[id] - s.x[node]) < 20 && Math.abs(s.z[id] - s.z[node]) < 20) left++;
          if (left === 0) s.alert(s.owner[e], 'depleted', s.x[node], s.z[node]);
          s.kill(node);
        } else {
          s.alert(s.owner[e], 'depleted', s.x[node], s.z[node]);
        }
      }
    }
    return;
  }
  if (s.carry[e] >= (isTap ? FLUX_LOAD : ORE_LOAD) && s.carryKind[e] === (isTap ? 2 : 1)) { s.wstate[e] = 2; return; }
  if (navTo(s, e, s.x[node], s.z[node], 1, d.radius + 0.8)) {
    const cap = isTap ? 2 : 1;
    if (s.miners[node] < cap) {
      s.miners[node]++;
      s.wstate[e] = 1; s.timer[e] = GATHER_TICKS;
      s.carry[e] = 0;
    } else if (!isTap) {
      // seam busy: re-evaluate toward a free seam of the same field
      let alt = -1, bestScore = 1e18;
      for (const id of s.ids) {
        if (!s.alive[id] || s.def[id] !== s.def[node] || id === node || s.miners[id] > 0 || s.amount[id] <= 0) continue;
        const dx = s.x[id] - s.x[node], dz = s.z[id] - s.z[node];
        const d2 = dx * dx + dz * dz;
        if (d2 > 64) continue;
        const score = s.assigned[id] * 30 + d2;
        if (score < bestScore) { bestScore = score; alt = id; }
      }
      if (alt >= 0 && s.assigned[alt] < 2) {
        s.assigned[node]--; s.assigned[alt]++;
        ord.target = alt; ord.x = s.x[alt]; ord.z = s.z[alt];
      } else { s.flags[e] |= FL_WORKING; }
    }
  }
}

function updateBuild(s: Sim, e: number, d: EntityDef, ord: Order): void {
  const bd = s.defs[ord.def];
  // a builder that cannot reach its site within 45 s gives the job (and the money) back
  if (ord.z2 === 0) ord.z2 = s.tick + 1;
  else if (s.tick - ord.z2 > 900) { s.alert(s.owner[e], 'blocked', ord.x, ord.z); s.finishOrder(e); return; }
  if (navTo(s, e, ord.x, ord.z, bd.footprint / 2, d.radius + 1.1)) {
    const owner = s.owner[e];
    if (s.canPlace(owner, ord.def, ord.x, ord.z, true) !== PLACE_OK) {
      s.alert(owner, 'blocked', ord.x, ord.z);
      s.finishOrder(e); // refunds
      return;
    }
    const b = s.spawn(ord.def, owner, ord.x, ord.z, true);
    ord.paid = false;
    s.events.push({ t: 'placed', id: b, owner, def: ord.def });
    if (s.players[owner].faction === 'helix') {
      ord.t = OT_CONSTRUCT; ord.target = b;
    } else {
      s.finishOrder(e);
    }
  }
}

function updateConstruct(s: Sim, e: number, d: EntityDef, ord: Order): void {
  const t = ord.target;
  if (t < 0 || !s.alive[t] || s.owner[t] !== s.owner[e]) { s.finishOrder(e); return; }
  const td = s.defs[s.def[t]];
  const constructing = !!(s.flags[t] & FL_CONSTRUCTING);
  if (!constructing && s.hp[t] >= td.hp) { s.finishOrder(e); return; }
  const isStruct = td.cls === 'structure';
  if (navTo(s, e, s.x[t], s.z[t], isStruct ? td.footprint / 2 : 0, d.radius + (isStruct ? 1.1 : td.radius + 0.6))) {
    s.flags[e] |= FL_ANCHOR | FL_WORKING;
    face(s, e, s.x[t] - s.x[e], s.z[t] - s.z[e]);
    if (constructing) s.builders[t]++;
    else s.hp[t] = Math.min(td.hp, s.hp[t] + 0.6);
  }
}

function updateAbility(s: Sim, e: number, d: EntityDef, ord: Order): void {
  const ab = ABILITY_BY_ID[ord.ab];
  const owner = s.owner[e];
  const ps = s.players[owner];
  if (!ab || d.ability !== ab.id) { s.finishOrder(e); return; }
  if (ab.id === 'weld') {
    const t = ord.target;
    if (t < 0 || !s.alive[t] || s.owner[t] !== owner) { s.finishOrder(e); return; }
    if (navTo(s, e, s.x[t], s.z[t], s.half(t), ab.range)) {
      if (s.abilityReady[e] <= s.tick && ps.flux >= ab.flux) {
        ps.flux -= ab.flux;
        s.weldUntil[t] = s.tick + 80;
        s.abilityReady[e] = s.tick + ab.cooldown * 20;
        s.events.push({ t: 'ability', id: e, ab: ab.id, x: s.x[t], z: s.z[t], owner });
      } else s.alert(owner, ps.flux < ab.flux ? 'flux' : 'cooldown');
      s.finishOrder(e);
    }
    return;
  }
  if (navTo(s, e, ord.x, ord.z, 0, ab.range)) {
    if (s.abilityReady[e] <= s.tick && s.energy[e] >= ab.energy) {
      castPoint(s, e, ab.id, ord.x, ord.z);
    }
    s.finishOrder(e);
  }
}

export function castPoint(s: Sim, e: number, abId: string, x: number, z: number): void {
  const ab = ABILITY_BY_ID[abId];
  const owner = s.owner[e];
  s.energy[e] -= ab.energy;
  s.abilityReady[e] = s.tick + ab.cooldown * 20;
  if (abId === 'spike') s.effects.push({ k: 'spike', x, z, r: ab.radius, owner, until: s.tick + 600 });
  else if (abId === 'mend') s.effects.push({ k: 'mend', x, z, r: ab.radius, owner, until: s.tick + 80 });
  s.events.push({ t: 'ability', id: e, ab: abId, x, z, owner });
}

export function face(s: Sim, e: number, dx: number, dz: number, k = 0.4): void {
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 1e-4) return;
  dx /= len; dz /= len;
  let fx = s.fx[e], fz = s.fz[e];
  if (fx * dx + fz * dz < -0.95) { fx += -dz * 0.3; fz += dx * 0.3; }
  fx += (dx - fx) * k; fz += (dz - fz) * k;
  const l = Math.sqrt(fx * fx + fz * fz) || 1;
  s.fx[e] = fx / l; s.fz[e] = fz / l;
}

let engagedThisTick = false;
export function markEngaged(): void { engagedThisTick = true; }

/** Maintain an auto-acquired target and fight it. Returns true while engaged. */
function scanAndEngage(s: Sim, e: number, d: EntityDef, chase: boolean, leashX: number, leashZ: number, leash: number): boolean {
  let t = s.target[e];
  if (t >= 0) {
    if (!isValidTarget(s, e, d, t) || !s.isVisibleTo(s.owner[e], t)) t = -1;
    else {
      const dx = s.x[t] - leashX, dz = s.z[t] - leashZ;
      if (dx * dx + dz * dz > leash * leash) t = -1;
    }
  }
  if (t < 0 && s.windup[e] < 0 && (s.tick + e) % 6 === 0) {
    t = acquireTarget(s, e, d);
    // respond to an attacker outside normal acquisition range
    if (t < 0 && s.tick - s.lastHit[e] < 40) {
      const a = s.lastAttacker[e];
      if (a >= 0 && isValidTarget(s, e, d, a) && s.isVisibleTo(s.owner[e], a)) t = a;
    }
    if (t >= 0) {
      const dx = s.x[t] - leashX, dz = s.z[t] - leashZ;
      if (dx * dx + dz * dz > leash * leash) t = -1;
    }
  }
  s.target[e] = t;
  if (t < 0) return false;
  engage(s, e, d, t, chase);
  return true;
}

function updateUnit(s: Sim, e: number, d: EntityDef): void {
  s.flags[e] &= ~(FL_ANCHOR | FL_GHOST | FL_WORKING);
  if (s.cooldown[e] > 0) s.cooldown[e]--;
  engagedThisTick = false;
  const fl = s.flags[e];
  const ord = s.orders[e][0];
  if (fl & FL_CURLED) {
    stopNav(s, e);
    s.flags[e] |= FL_ANCHOR;
    s.windup[e] = -1;
    return;
  }
  if (!ord) {
    if (d.weapon && !d.worker) {
      const hold = !!(fl & FL_HOLD);
      const fought = scanAndEngage(s, e, d, !hold, s.anchorX[e], s.anchorZ[e], 20);
      if (s.navFail[e] > 2) { s.target[e] = -1; s.navFail[e] = 0; s.anchorX[e] = s.x[e]; s.anchorZ[e] = s.z[e]; }
      if (!fought) {
        const dx = s.anchorX[e] - s.x[e], dz = s.anchorZ[e] - s.z[e];
        if (dx * dx + dz * dz > 16 && !hold) navTo(s, e, s.anchorX[e], s.anchorZ[e], 0, 1.5);
        else stopNav(s, e);
      }
    } else stopNav(s, e);
    if (!engagedThisTick) s.windup[e] = -1;
    return;
  }
  if (s.navFail[e] > 3 && ord.t !== OT_MOVE && ord.t !== OT_AMOVE && ord.t !== OT_PATROL && ord.t !== OT_FOLLOW) {
    // navigation kept failing: give up on this order rather than loop forever
    s.finishOrder(e);
    return;
  }
  switch (ord.t) {
    case OT_MOVE:
      if (navTo(s, e, ord.x, ord.z, 0, 0.3) || crowdArrived(s, e, ord.x, ord.z) || s.navFail[e] > 3) s.finishOrder(e);
      break;
    case OT_AMOVE:
    case OT_PATROL: {
      if (d.weapon && !d.worker && scanAndEngage(s, e, d, true, s.x[e], s.z[e], d.weapon.range + 7)) break;
      if (navTo(s, e, ord.x, ord.z, 0, 0.3) || crowdArrived(s, e, ord.x, ord.z) || s.navFail[e] > 3) {
        if (ord.t === OT_PATROL) {
          const tx = ord.x, tz = ord.z;
          ord.x = ord.x2; ord.z = ord.z2; ord.x2 = tx; ord.z2 = tz;
          s.navOn[e] = 0; s.stuck[e] = 0; s.navFail[e] = 0;
        } else s.finishOrder(e);
      }
      break;
    }
    case OT_ATTACK: {
      const t = ord.target;
      if (!d.weapon || !isValidTarget(s, e, d, t)) { s.finishOrder(e); break; }
      if (!s.isVisibleTo(s.owner[e], t)) {
        if (navTo(s, e, ord.x, ord.z, 0, 1.5) || s.navFail[e] > 3) s.finishOrder(e);
        break;
      }
      ord.x = s.x[t]; ord.z = s.z[t];
      s.target[e] = t;
      engage(s, e, d, t, true);
      break;
    }
    case OT_GATHER: updateGather(s, e, d, ord); break;
    case OT_BUILD: updateBuild(s, e, d, ord); break;
    case OT_CONSTRUCT: updateConstruct(s, e, d, ord); break;
    case OT_FOLLOW: {
      const t = ord.target;
      if (t < 0 || !s.alive[t]) { s.finishOrder(e); break; }
      if (d.weapon && !d.worker && scanAndEngage(s, e, d, true, s.x[t], s.z[t], 12)) break;
      if (navTo(s, e, s.x[t], s.z[t], 0, 3.2)) stopNav(s, e);
      break;
    }
    case OT_ABILITY: updateAbility(s, e, d, ord); break;
    default: s.finishOrder(e);
  }
  if (!engagedThisTick) s.windup[e] = -1;
}

export function updateUnits(s: Sim): void {
  const ids = s.ids;
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'unit') continue;
    updateUnit(s, e, d);
  }
}

// ---------------------------------------------------------------------- movement integration
const sepX = new Float32Array(4096);
const sepZ = new Float32Array(4096);

let resX = 0, resZ = 0;
/**
 * Terrain/structure collision: clamp the unit's axis probes out of blocked cells so it slides along walls
 * (and self-corrects if something nudged it too close). Returns false when the centre would be inside a blocker.
 */
function resolveTerrain(s: Sim, x: number, z: number, r: number): boolean {
  const b = s.blocked, S = MAP_SIZE;
  if (x < 1.5) x = 1.5; else if (x > S - 1.5) x = S - 1.5;
  if (z < 1.5) z = 1.5; else if (z > S - 1.5) z = S - 1.5;
  if (b[(z | 0) * S + (x | 0)]) return false;
  const p = Math.min(r, 0.9) * 0.6;
  if (b[(z | 0) * S + ((x + p) | 0)]) x = ((x + p) | 0) - p - 0.002;
  else if (b[(z | 0) * S + ((x - p) | 0)]) x = ((x - p) | 0) + 1 + p + 0.002;
  if (b[((z + p) | 0) * S + (x | 0)]) z = ((z + p) | 0) - p - 0.002;
  else if (b[((z - p) | 0) * S + (x | 0)]) z = ((z - p) | 0) + 1 + p + 0.002;
  if (b[(z | 0) * S + (x | 0)]) return false;
  resX = x; resZ = z;
  return true;
}

export function speedOf(s: Sim, e: number, d: EntityDef): number {
  let sp = d.speed;
  const fl = s.flags[e];
  if (fl & FL_BRACED) sp *= 0.45;
  if (s.slowUntil[e] > s.tick) sp *= 0.7;
  if (d.id === 'thornling') {
    const t = s.target[e];
    if (t >= 0 && s.alive[t] && s.hp[t] < s.defs[s.def[t]].hp) sp *= 1.35;
  }
  return sp;
}

export function integrateMovement(s: Sim): void {
  const ids = s.ids;
  const out = s.scratch;
  // 1. separation (position-based, accumulated before being applied => order independent)
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    sepX[e] = 0; sepZ[e] = 0;
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'unit') continue;
    const fl = s.flags[e];
    if (fl & (FL_GHOST | FL_ANCHOR)) continue;
    const x = s.x[e], z = s.z[e], r = d.radius;
    const n = s.query(x, z, r + 1.6, out);
    for (let k = 0; k < n; k++) {
      const o = out[k];
      if (o === e || !s.alive[o]) continue;
      const od = s.defs[s.def[o]];
      if (od.cls !== 'unit' || !!od.hover !== !!d.hover) continue;
      const ofl = s.flags[o];
      if (ofl & FL_GHOST) continue;
      let dx = x - s.x[o], dz = z - s.z[o];
      const min = r + od.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) continue;
      let dist = Math.sqrt(d2);
      if (dist < 1e-3) {
        // coincident units: pick a deterministic direction that is exactly opposite for the two of them
        const lo = e < o ? e : o, hi = e < o ? o : e, sgn = e < o ? 1 : -1;
        dx = (((lo * 7 + hi * 3) % 5) - 1.5) * sgn; dz = (((lo * 3 + hi * 11) % 5) - 2.5) * sgn;
        dist = Math.sqrt(dx * dx + dz * dz);
      }
      const overlap = min - dist;
      // anchored neighbours do not yield, so we take the whole correction; idle units yield to movers
      let w = ofl & FL_ANCHOR ? 1 : 0.5;
      if (!(ofl & FL_ANCHOR)) {
        if (s.navOn[e] && !s.navOn[o]) w = 0.25; else if (!s.navOn[e] && s.navOn[o]) w = 0.75;
      }
      sepX[e] += (dx / dist) * overlap * w * 0.7;
      sepZ[e] += (dz / dist) * overlap * w * 0.7;
    }
  }
  // 2. steering + integration
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'unit') continue;
    const x = s.x[e], z = s.z[e];
    let wantX = 0, wantZ = 0, atEnd = false;
    const speed = speedOf(s, e, d);
    const path = s.path[e];
    const anchored = !!(s.flags[e] & FL_ANCHOR);
    if (s.navOn[e] && path && !anchored) {
      let pi = s.pathI[e];
      const last = path.length / 2 - 1;
      let tx = path[pi * 2], tz = path[pi * 2 + 1];
      let dx = tx - x, dz = tz - z;
      let dist = Math.sqrt(dx * dx + dz * dz);
      while (pi < last && dist < 0.75) {
        pi++; s.pathI[e] = pi;
        tx = path[pi * 2]; tz = path[pi * 2 + 1];
        dx = tx - x; dz = tz - z; dist = Math.sqrt(dx * dx + dz * dz);
      }
      if (dist <= 0.02 && pi >= last) atEnd = true;
      if (dist > 0.02) {
        const sp = Math.min(speed, dist / DT);
        wantX = (dx / dist) * sp; wantZ = (dz / dist) * sp;
        // blocked for a while: add a deterministic sidestep to slide around the obstacle
        if (s.stuck[e] > 6 && pi <= last) {
          const side = (e & 1 ? 1 : -1) * 0.6 * speed;
          wantX += (-dz / dist) * side; wantZ += (dx / dist) * side;
        }
      }
    }
    const acc = Math.max(8, d.speed * 6) * DT;
    let ax = wantX - s.vx[e], az = wantZ - s.vz[e];
    const al = Math.sqrt(ax * ax + az * az);
    if (al > acc) { ax = (ax / al) * acc; az = (az / al) * acc; }
    let vx = s.vx[e] + ax, vz = s.vz[e] + az;
    if (anchored) { vx = 0; vz = 0; }
    let sx = sepX[e], sz = sepZ[e];
    const sl = Math.sqrt(sx * sx + sz * sz);
    if (sl > 0.35) { sx = (sx / sl) * 0.35; sz = (sz / sl) * 0.35; }
    let nx = x + vx * DT + sx, nz = z + vz * DT + sz;
    if (d.hover) {
      nx = Math.min(MAP_SIZE - 4.5, Math.max(4.5, nx)); nz = Math.min(MAP_SIZE - 4.5, Math.max(4.5, nz));
    } else if (s.blocked[(z | 0) * MAP_SIZE + (x | 0)]) {
      // standing inside a blocker (e.g. a structure was just placed): escape toward the nearest free cell
      const c = s.pathfinder.nearestFree(x, z, 10);
      if (c >= 0) {
        const tx = (c % MAP_SIZE) + 0.5, tz = ((c / MAP_SIZE) | 0) + 0.5;
        const dx = tx - x, dz = tz - z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;
        const st = Math.min(dist, 6 * DT);
        nx = x + (dx / dist) * st; nz = z + (dz / dist) * st;
      } else { nx = x; nz = z; }
    } else if (resolveTerrain(s, nx, nz, d.radius)) { nx = resX; nz = resZ; }
    else if (resolveTerrain(s, nx, z, d.radius)) { nx = resX; nz = resZ; vz = 0; }
    else if (resolveTerrain(s, x, nz, d.radius)) { nx = resX; nz = resZ; vx = 0; }
    else { nx = x; nz = z; vx = 0; vz = 0; }
    // quantise positions so the state is reproducible and hashes are stable
    nx = Math.round(nx * 1024) / 1024; nz = Math.round(nz * 1024) / 1024;
    const mx = nx - x, mz = nz - z;
    s.x[e] = nx; s.z[e] = nz; s.vx[e] = vx; s.vz[e] = vz;
    if (s.navOn[e] && !anchored) {
      const want = Math.sqrt(wantX * wantX + wantZ * wantZ) * DT;
      if (atEnd || (want > 0.01 && mx * mx + mz * mz < want * want * 0.09)) { if (s.stuck[e] < 60000) s.stuck[e]++; }
      else {
        if (s.stuck[e] > 0) s.stuck[e] = s.stuck[e] > 2 ? s.stuck[e] - 2 : 0;
        if (s.navFail[e] > 0 && (s.tick + e) % 64 === 0) s.navFail[e]--;
      }
      if (wantX !== 0 || wantZ !== 0) face(s, e, wantX, wantZ, 0.35);
    }
  }
}

export function orderLabel(s: Sim, e: number): string {
  const o = s.orders[e][0];
  const fl = s.flags[e];
  if (fl & FL_CURLED) return 'Curled';
  if (!o) return s.target[e] >= 0 ? 'Engaging' : fl & FL_HOLD ? 'Holding position' : fl & FL_BRACED ? 'Braced' : 'Idle';
  switch (o.t) {
    case OT_MOVE: return s.stuck[e] > 40 ? 'Moving (path blocked)' : 'Moving';
    case OT_AMOVE: return s.target[e] >= 0 ? 'Engaging' : 'Attack-moving';
    case OT_PATROL: return 'Patrolling';
    case OT_ATTACK: return 'Attacking';
    case OT_GATHER: return s.wstate[e] === 1 ? 'Harvesting' : s.wstate[e] === 2 ? 'Returning cargo' : fl & FL_WORKING ? 'Waiting for seam' : 'Moving to harvest';
    case OT_BUILD: return 'Moving to build site';
    case OT_CONSTRUCT: return fl & FL_WORKING ? 'Working' : 'Moving to work site';
    case OT_FOLLOW: return 'Guarding';
    case OT_ABILITY: return 'Using ability';
  }
  return 'Idle';
}
