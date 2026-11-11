// Police response units: dispatch from valid portals, physical travel, vehicle pursuit, foot officers,
// shared-blackboard search, arrest negotiation, roadblocks and stand-down. Spawns are budgeted per incident.
import type { Sim } from '../game-session/sim';
import { Vehicle, steerToward, driveToSpeed } from '../vehicles/vehicle';
import { Driver } from '../traffic/traffic';
import { Actor } from '../character/actors';
import { roadLanes, lanePoint, laneRoute, nearestLane, routeNodes, DIR_YAW, Lane } from '../world/roads';
import { ANCHORS, surfaceY } from '../world/district';
import { angleDiff, clamp } from '../core/math';
import { RayHit } from '../physics/physics';

export type UnitState = 'Patrol' | 'Respond' | 'Pursue' | 'Search' | 'Dismounted' | 'Roadblock' | 'Return';
export interface Unit {
  id: number; vehicle: Vehicle | null; driver: Driver | null; officers: Actor[]; aboard: number;
  state: UnitState; tx: number; tz: number; repathT: number; sees: boolean; lastSeenT: number;
  searchNode: number; holdUntil: number; stuckT: number; ambient: boolean; done: boolean; directT: number;
}
export const UNIT_CAP = [1, 1, 2, 3, 4, 6];      // concurrent vehicles per tier
export const UNIT_BUDGET = [0, 2, 4, 7, 10, 14]; // total dispatched per incident
const _pt = { x: 0, z: 0, yaw: 0 };
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };
let nextUnit = 1;

export class Dispatch {
  private spawnCd = 0; private closeT = 0; private blockCd = 12; private patrolCd = 6;
  /** Search blackboard shared by all units: route node id -> last time it was checked. */
  searched = new Map<number, number>();
  enabled = true;
  constructor(public sim: Sim) {}
  get units() { return this.sim.police.units; }

  anyOfficerSees(x: number, y: number, z: number, range: number): boolean {
    const sim = this.sim;
    for (const u of this.units) {
      const v = u.vehicle;
      if (v && u.aboard > 0 && Math.hypot(v.x - x, v.z - z) < range && sim.losClear(v.x, v.y + 1.3, v.z, x, y, z)) return true;
      for (const a of u.officers) if (!a.disabled && !a.inVehicle && Math.hypot(a.x - x, a.z - z) < range && sim.losClear(a.x, a.y + 1.6, a.z, x, y, z)) return true;
    }
    return false;
  }

  private spawnUnit(ambient: boolean, nearX: number, nearZ: number): Unit | null {
    const sim = this.sim, p = sim.player;
    // valid entries: tunnel portals and the substation yard, out of the player's view
    let best: { lane: Lane; s: number } | null = null, bd = Infinity;
    for (const l of roadLanes) {
      if (!l.portalStart) continue;
      lanePoint(l, 3, _pt);
      const dp = Math.hypot(_pt.x - p.x, _pt.z - p.z);
      if (dp < 70) continue;
      const d = Math.hypot(_pt.x - nearX, _pt.z - nearZ) + (ambient ? sim.rng.next() * 400 : 0);
      if (d < bd) { bd = d; best = { lane: l, s: 3 }; }
    }
    const yard = nearestLane(ANCHORS.policeYard.x, ANCHORS.precinct.z - 12, Math.PI / 2);
    if (yard) {
      lanePoint(yard.lane, yard.s, _pt);
      const dp = Math.hypot(_pt.x - p.x, _pt.z - p.z), d = Math.hypot(_pt.x - nearX, _pt.z - nearZ) + (ambient ? sim.rng.next() * 400 : 0);
      if (dp > 90 && d < bd && !sim.isVisible(_pt.x, 1.2, _pt.z)) { bd = d; best = { lane: yard.lane, s: yard.s }; }
    }
    // out-of-sight patrol beats: a unit that was already working nearby streets
    for (let k = 0; k < 14; k++) {
      const l = sim.rng.pick(roadLanes), s = sim.rng.range(4, Math.max(5, l.len - 6));
      lanePoint(l, s, _pt);
      const dp = Math.hypot(_pt.x - p.x, _pt.z - p.z);
      if (dp < 125 || dp > 240 || sim.isVisible(_pt.x, 1.2, _pt.z)) continue;
      const d = Math.hypot(_pt.x - nearX, _pt.z - nearZ) + 40 + (ambient ? sim.rng.next() * 400 : 0);
      if (d < bd) { bd = d; best = { lane: l, s }; }
    }
    if (!best) return null;
    lanePoint(best.lane, best.s, _pt);
    for (const o of sim.vehicles.list) if (Math.hypot(o.x - _pt.x, o.z - _pt.z) < 9) return null;
    const v = sim.vehicles.spawn('warden', _pt.x, _pt.z, DIR_YAW[best.lane.dir], 0xf4f6f8, surfaceY(_pt.x, _pt.z));
    v.owned = false; v.persistent = true;
    const d = sim.traffic.addDriver(v, best.lane, best.s, 'police');
    const u: Unit = { id: nextUnit++, vehicle: v, driver: d, officers: [], aboard: 2, state: ambient ? 'Patrol' : 'Respond', tx: nearX, tz: nearZ, repathT: 0, sees: false, lastSeenT: -99, searchNode: -1, holdUntil: 0, stuckT: 0, ambient, done: false, directT: 0 };
    this.units.push(u);
    return u;
  }
  private dismount(u: Unit) {
    const sim = this.sim, v = u.vehicle!;
    if (u.aboard <= 0) return;
    for (let k = 0; k < u.aboard; k++) {
      const door = v.doorPos({ x: 0, y: 0, z: 0 }, k === 0 ? -1 : 1);
      const a = sim.actors.spawn('police', door.x, door.z, v.yaw);
      a.unit = u; a.lastSeenT = sim.time; u.officers.push(a);
    }
    u.aboard = 0; u.state = 'Dismounted';
    if (u.driver) { sim.traffic.removeDriver(u.driver); u.driver = null; }
    v.driver = 'none'; v.ctl.throttle = 0; v.ctl.steer = 0;
    sim.bus.emit('sfx', { name: 'door', x: v.x, y: v.y, z: v.z });
  }
  private board(u: Unit) {
    const sim = this.sim, v = u.vehicle;
    for (const a of [...u.officers]) {
      if (a.dead) { continue; }
      if (!v) { a.wantBoard = false; continue; }
      const near = Math.hypot(a.x - v.x, a.z - v.z) < 3.2;
      const unseen = !sim.isVisible(a.x, a.y + 1, a.z) && !sim.isVisible(v.x, v.y + 1, v.z);
      if (a.wantBoard && !a.disabled && (near || unseen)) { u.officers.splice(u.officers.indexOf(a), 1); sim.actors.remove(a); u.aboard++; }
    }
    if (v && u.aboard > 0 && u.officers.every((a) => a.dead || a.disabled) && !u.driver && !v.stalled && v.driver === 'none') {
      const nl = nearestLane(v.x, v.z, v.yaw);
      if (nl) { u.driver = sim.traffic.addDriver(v, nl.lane, nl.s, 'police'); u.state = 'Respond'; u.repathT = 0; }
    }
  }
  private pickSearchNode(u: Unit): number {
    const sim = this.sim, pol = sim.police, lk = pol.lastKnown;
    const px = lk.x + lk.vx * 5, pz = lk.z + lk.vz * 5;
    let best = -1, bs = Infinity;
    for (const n of routeNodes) {
      const d = Math.hypot(n.x - lk.x, n.z - lk.z);
      if (d > pol.searchR + 60) continue;
      const last = this.searched.get(n.id) ?? -999;
      const taken = this.units.some((o) => o !== u && o.searchNode === n.id);
      const score = Math.hypot(n.x - px, n.z - pz) * 0.6 + Math.hypot(n.x - u.vehicle!.x, n.z - u.vehicle!.z) * 0.4 + (sim.time - last < 40 ? 300 : 0) + (taken ? 200 : 0);
      if (score < bs) { bs = score; best = n.id; }
    }
    return best;
  }
  private route(u: Unit, tx: number, tz: number) {
    const d = u.driver; if (!d) return;
    const nl = nearestLane(u.vehicle!.x, u.vehicle!.z, u.vehicle!.yaw);
    const start = nl && Math.abs(nl.lat) < 6 ? nl.lane : d.f.lane;
    const r = laneRoute(start, tx, tz);
    d.f.lane = start; d.f.setRoute(r);
  }

  private updateUnit(u: Unit, dt: number) {
    const sim = this.sim, pol = sim.police, p = sim.player, v = u.vehicle;
    if (!v || !sim.vehicles.list.includes(v)) { u.vehicle = null; if (u.officers.length === 0) u.done = true; return; }
    const dist = Math.hypot(p.x - v.x, p.z - v.z);
    // vehicle-borne vision
    u.sees = false;
    if (u.aboard > 0 && !p.downed) {
      const range = 70 * (1 - 0.22 * sim.clock.night) * (sim.weather.raining ? 0.85 : 1);
      if (dist < range && (dist < 8 || Math.abs(angleDiff(Math.atan2(p.x - v.x, p.z - v.z), v.yaw)) < 1.95) && sim.losClear(v.x, v.y + 1.3, v.z, p.x, p.y + 1.2, p.z)) {
        u.sees = true;
        if (pol.recognises(dist)) { pol.sight('unit'); u.lastSeenT = sim.time; }
      }
      // an abandoned vehicle matching the description re-centres the search on foot
      if (pol.tier > 0 && pol.knownVehicleId >= 0 && (!p.vehicle || p.vehicle.id !== pol.knownVehicleId)) {
        const kv = sim.vehicles.list.find((c) => c.id === pol.knownVehicleId);
        if (kv && Math.hypot(kv.x - v.x, kv.z - v.z) < 24 && sim.losClear(v.x, v.y + 1.3, v.z, kv.x, kv.y + 1, kv.z)) {
          pol.knownVehicleId = -1;
          if (!pol.visible) { pol.lastKnown.x = kv.x; pol.lastKnown.z = kv.z; pol.searchR = 50; }
          sim.bus.emit('subtitle', { speaker: 'Dispatch', text: `Suspect vehicle located, abandoned. Suspect is on foot.`, dur: 3.5 });
        }
      }
    }
    v.siren = pol.tier >= 1 && u.state !== 'Return' && u.state !== 'Patrol' && (pol.status === 'Pursuit' || pol.status === 'Identified' || u.state === 'Respond' || u.state === 'Roadblock');
    if (u.state === 'Dismounted') {
      for (const a of u.officers) if (pol.tier === 0) a.wantBoard = true;
      if (p.vehicle && dist > 40) for (const a of u.officers) a.wantBoard = true;
      this.board(u);
      return;
    }
    if (u.state === 'Roadblock') {
      v.ctl.throttle = 0; v.ctl.brake = 1; v.ctl.handbrake = true;
      if (sim.time > u.holdUntil || pol.tier === 0) { v.ctl.handbrake = false; const nl = nearestLane(v.x, v.z); if (nl && !u.driver) u.driver = sim.traffic.addDriver(v, nl.lane, nl.s, 'police'); u.state = pol.tier === 0 ? 'Return' : 'Respond'; }
      return;
    }
    const d = u.driver;
    if (!d || !sim.traffic.driverOf(v)) { u.driver = null; if (v.stalled || v.submerged) { if (v.submerged) { u.aboard = 0; u.done = true; return; } this.dismount(u); return; } const nl = nearestLane(v.x, v.z, v.yaw); if (nl) u.driver = sim.traffic.addDriver(v, nl.lane, nl.s, 'police'); return; }
    if (v.speedAbs < 0.5) u.stuckT += dt; else u.stuckT = Math.max(0, u.stuckT - dt * 2);

    if (u.state === 'Patrol') {
      d.ignoreSignals = false; d.speedMul = 0.95; d.f.route = null;
      if (pol.tier > 0) u.state = 'Respond';
      if (dist > 260 && !sim.isVisible(v.x, v.y + 1, v.z)) this.retire(u);
      return;
    }
    if (u.state === 'Return') {
      d.ignoreSignals = false; d.speedMul = 1.0;
      if (pol.tier > 0) { u.state = 'Respond'; u.repathT = 0; return; }
      if (d.f.finished || d.state === 'Despawn' || (dist > 150 && !sim.isVisible(v.x, v.y + 1, v.z))) this.retire(u);
      return;
    }
    // Respond / Pursue / Search
    const fresh = sim.time - pol.lastKnown.t < 2 && pol.visible;
    d.ignoreSignals = true;
    if (fresh) {
      u.state = 'Pursue'; u.searchNode = -1;
      const onFoot = !p.vehicle;
      const direct = u.sees && dist < 60;
      if (direct && ((onFoot && dist < 15) || (!onFoot && p.vehicle!.speedAbs < 2.2 && dist < 11))) {
        // stop and get out for a foot arrest / firefight
        v.ctl.throttle = 0; v.ctl.brake = 1; v.ctl.steer = 0;
        if (v.speedAbs < 2) this.dismount(u);
        return;
      }
      if (direct && !this.blockedAhead(v)) {
        // direct pursuit steering with a short lead on the target
        u.directT += dt;
        const lead = clamp(dist / 28, 0.1, 0.9);
        const tx = p.x + pol.lastKnown.vx * lead, tz = p.z + pol.lastKnown.vz * lead;
        v.ctl.steer = steerToward(v, tx, tz);
        let want = clamp(p.speed + 5 + dist * 0.25, 9, v.spec.topSpeed * 0.9);
        if (pol.tier <= 2 && !onFoot && dist < 9) want = Math.min(want, p.speed * 0.95); // low tiers shadow rather than ram
        if (onFoot) want = Math.min(want, 6 + dist * 0.5);
        const turn = Math.abs(v.ctl.steer);
        if (turn > 0.6 && v.speed > 12) want = Math.min(want, 12);
        driveToSpeed(v, want);
        v.ctl.handbrake = turn > 0.95 && v.speed > 14;
        return;
      }
      u.directT = 0; d.speedMul = 2.0;
      u.repathT -= dt;
      if (u.repathT <= 0 || d.f.finished) { u.repathT = 1.2; this.route(u, p.x, p.z); }
      return;
    }
    // no fresh sight: head for the last known position, then sweep search points from the blackboard
    u.state = pol.status === 'Search' || pol.status === 'Cooling' ? 'Search' : 'Respond';
    d.speedMul = u.state === 'Search' ? 1.15 : 1.9;
    const lkDist = Math.hypot(pol.lastKnown.x - v.x, pol.lastKnown.z - v.z);
    if (u.state === 'Respond') {
      u.repathT -= dt;
      if (u.repathT <= 0 || d.f.finished) { u.repathT = 3; this.route(u, pol.lastKnown.x, pol.lastKnown.z); }
      if (lkDist < 22) { u.state = 'Search'; u.searchNode = -1; }
      return;
    }
    const node = u.searchNode >= 0 ? routeNodes[u.searchNode] : null;
    if (!node || Math.hypot(node.x - v.x, node.z - v.z) < 20 || d.f.finished || u.stuckT > 8) {
      if (node) this.searched.set(node.id, sim.time);
      u.searchNode = this.pickSearchNode(u); u.stuckT = 0;
      if (u.searchNode >= 0) this.route(u, routeNodes[u.searchNode].x, routeNodes[u.searchNode].z);
    }
  }
  private blockedAhead(v: Vehicle): boolean {
    const look = clamp(v.speedAbs * 0.9, 7, 22);
    return this.sim.phys.castWorld(v.x, v.y + 0.9, v.z, Math.sin(v.yaw), 0, Math.cos(v.yaw), look, _hit) && _hit.ny < 0.5;
  }
  private retire(u: Unit) {
    const sim = this.sim;
    if (u.driver) sim.traffic.removeDriver(u.driver);
    for (const a of u.officers) sim.actors.remove(a);
    if (u.vehicle && u.vehicle.driver !== 'player') sim.vehicles.remove(u.vehicle);
    else if (u.vehicle) u.vehicle.siren = false;
    u.vehicle = null; u.officers = []; u.done = true;
  }
  /** Alert over: units drive home (or vanish at once after an arrest, behind the fade). */
  standDown(immediate: boolean) {
    this.searched.clear(); this.closeT = 0;
    for (const u of this.units) {
      if (immediate) { this.retire(u); continue; }
      if (u.state === 'Dismounted') { for (const a of u.officers) a.wantBoard = true; continue; }
      if (u.state === 'Roadblock') continue;
      u.state = 'Return'; u.searchNode = -1;
      if (u.vehicle) u.vehicle.siren = false;
      if (u.driver && u.vehicle) {
        // leave through the nearest tunnel portal
        let best: Lane | null = null, bd = Infinity;
        for (const l of roadLanes) if (l.portalEnd) { const dd = Math.hypot(l.pts[2] - u.vehicle.x, l.pts[3] - u.vehicle.z); if (dd < bd) { bd = dd; best = l; } }
        if (best) this.route(u, best.pts[2], best.pts[3]);
      }
    }
    if (immediate) this.sim.police.units.length = 0;
  }
  private tryRoadblock() {
    const sim = this.sim, pol = sim.police, p = sim.player, pv = p.vehicle;
    if (!pv || pv.speedAbs < 9) return;
    const fx = p.x + pv.vx * 8, fz = p.z + pv.vz * 8;
    let best = null as (typeof routeNodes)[number] | null, bd = Infinity;
    for (const n of routeNodes) {
      if (!n.inter) continue;
      const dp = Math.hypot(n.x - p.x, n.z - p.z), df = Math.hypot(n.x - fx, n.z - fz);
      if (dp < 95 || dp > 220 || sim.isVisible(n.x, 1.5, n.z)) continue;
      if (df < bd) { bd = df; best = n; }
    }
    if (!best) return;
    const yaw = Math.atan2(p.x - best.x, p.z - best.z);
    for (let k = 0; k < 2; k++) {
      const off = (k === 0 ? -1 : 1) * 3.6;
      const x = best.x + Math.cos(yaw) * off, z = best.z - Math.sin(yaw) * off;
      if (sim.vehicles.list.some((o) => Math.hypot(o.x - x, o.z - z) < 6)) continue;
      const v = sim.vehicles.spawn('warden', x, z, yaw + Math.PI / 2 + (k ? 0.25 : -0.25), 0xf4f6f8, surfaceY(x, z));
      v.persistent = true; v.siren = true; v.driver = 'police'; v.ctl.handbrake = true; v.ctl.brake = 1;
      this.units.push({ id: nextUnit++, vehicle: v, driver: null, officers: [], aboard: 1, state: 'Roadblock', tx: x, tz: z, repathT: 0, sees: false, lastSeenT: -99, searchNode: -1, holdUntil: sim.time + 45, stuckT: 0, ambient: false, done: false, directT: 0 });
      pol.budgetUsed++;
    }
    sim.bus.emit('subtitle', { speaker: 'Dispatch', text: 'Units, set a block ahead of the suspect.', dur: 3 });
  }

  update(dt: number) {
    const sim = this.sim, pol = sim.police, p = sim.player;
    if (!this.enabled) return;
    this.spawnCd -= dt;
    const active = this.units.filter((u) => !u.done && u.state !== 'Return' && u.vehicle).length;
    if (pol.tier > 0) {
      if (active < UNIT_CAP[pol.tier] && pol.budgetUsed < UNIT_BUDGET[pol.tier] && this.spawnCd <= 0) {
        if (this.spawnUnit(false, pol.lastKnown.x, pol.lastKnown.z)) { pol.budgetUsed++; this.spawnCd = pol.tier >= 3 ? 3 : 5; } else this.spawnCd = 1;
      }
      if (pol.tier >= 3 && pol.status === 'Pursuit') { this.blockCd -= dt; if (this.blockCd <= 0 && pol.budgetUsed < UNIT_BUDGET[pol.tier] - 1) { this.blockCd = 26; this.tryRoadblock(); } }
    } else {
      // one ambient patrol car cruises the district and acts as a mobile observer
      this.patrolCd -= dt;
      if (this.patrolCd <= 0 && this.units.length === 0) { this.patrolCd = 20; this.spawnUnit(true, p.x + sim.rng.range(-200, 200), p.z + sim.rng.range(-200, 200)); }
    }
    for (const u of this.units) if (!u.done) this.updateUnit(u, dt);
    for (let i = this.units.length - 1; i >= 0; i--) if (this.units[i].done) this.units.splice(i, 1);

    // arrest negotiation at low tiers: an officer at arm's length for a moment starts a detain window
    let close = false, near = false;
    if (pol.tier >= 1 && pol.tier <= 2 && !p.downed) {
      const slow = p.speed < 2.6;
      for (const a of sim.actors.list) {
        if (a.faction !== 'police' || a.disabled) continue;
        const d = Math.hypot(a.x - p.x, a.z - p.z);
        if (d < 2.7 && slow) close = true;
        if (d < 6) near = true;
      }
    }
    if (close) this.closeT += dt; else this.closeT = Math.max(0, this.closeT - dt * 2);
    if (pol.tier > 2) pol.detain = 0;
    if (pol.detain <= 0 && this.closeT > 0.7) {
      pol.detain = 5; this.closeT = 0;
      sim.bus.emit('subtitle', { speaker: 'Officer', text: 'Stop. Hands where I can see them. You are being detained.', dur: 3.5 });
    } else if (pol.detain > 0) {
      pol.detain -= dt;
      if (!near || p.speed > 4.5) { pol.detain = 0; pol.crime('resistArrest', p.x, p.z, { source: 'police' }); sim.bus.emit('subtitle', { speaker: 'Officer', text: 'Suspect is running!', dur: 2.5 }); }
      else if (pol.detain <= 0) pol.arrest();
    }
  }
}
