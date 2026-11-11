// Civilian traffic: lane-graph drivers on the shared vehicle physics, signal/priority handling,
// obstacle and pedestrian yielding, emergency pull-over, panic, recovery, and out-of-sight
// spawn/despawn. Also streams parked cars from the district's parking spots.
import type { Sim } from '../game-session/sim';
import { Vehicle, steerToward, driveToSpeed } from '../vehicles/vehicle';
import { VEHICLES, TRAFFIC_TYPES } from '../vehicles/specs';
import { Lane, roadLanes, lanePoint, laneProject, nearestLane, laneRoute, DIR_YAW } from '../world/roads';
import { Intersection, surfaceY } from '../world/district';
import { parkSpots, ParkSpot } from '../world/lots';
import { clamp, hash2, angleDiff, segParam, Rng } from '../core/math';

export type TrafficState = 'Cruise' | 'Follow' | 'StopSignal' | 'YieldCrosswalk' | 'Turn' | 'ChangeLane' | 'Park' | 'PullOut'
  | 'AvoidObstacle' | 'Panic' | 'Flee' | 'PullOverEmergency' | 'CollisionRecovery' | 'Despawn';
const PROFILES = [
  { name: 'cautious', speed: 0.86, T: 1.6, s0: 3.2, horn: 9 },
  { name: 'normal', speed: 1.0, T: 1.25, s0: 2.6, horn: 6 },
  { name: 'impatient', speed: 1.12, T: 0.95, s0: 2.1, horn: 3 },
];
const _pt = { x: 0, z: 0, yaw: 0 }, _pt2 = { x: 0, z: 0, yaw: 0 }, _pr = { s: 0, lat: 0 };

/** Tracks progress along lanes/connectors and yields look-ahead points. Shared with police and missions. */
export class LaneFollower {
  s = 0; lat = 0; next: Lane | null = null; route: Lane[] | null = null; ri = 0; finished = false;
  constructor(public lane: Lane, s = 0) { this.s = s; }
  setRoute(route: Lane[]) {
    this.route = route; this.ri = 0; this.finished = false;
    if (route.length && route[0] !== this.lane) { this.lane = route[0]; }
    this.next = route[1] ?? null;
  }
  pickNext(rng: Rng, preferStraight = 0.62) {
    if (this.route) { this.next = this.route[this.ri + 1] ?? null; return; }
    const l = this.lane;
    if (l.kind === 'conn') { this.next = l.next[0]; return; }
    if (!l.next.length) { this.next = null; return; }
    const straight = l.next.find((c) => c.turn === 'S');
    this.next = straight && rng.chance(preferStraight) ? straight : rng.pick(l.next);
  }
  /** Re-project onto the path and advance to the next element when the current one is finished. */
  update(x: number, z: number, rng: Rng): boolean {
    laneProject(this.lane, x, z, _pr);
    this.s = _pr.s; this.lat = _pr.lat;
    let advanced = false;
    if (this.route && this.next && this.next === this.lane.adjacent) { this.lane = this.next; this.ri++; this.next = this.route[this.ri + 1] ?? null; laneProject(this.lane, x, z, _pr); this.s = _pr.s; this.lat = _pr.lat; }
    if (this.s >= this.lane.len - 0.6) {
      if (!this.next) this.pickNext(rng);
      if (this.next) {
        this.lane = this.next; if (this.route) this.ri++;
        this.next = null; this.pickNext(rng);
        laneProject(this.lane, x, z, _pr); this.s = _pr.s; this.lat = _pr.lat; advanced = true;
      } else this.finished = true;
    } else if (!this.next) this.pickNext(rng);
    return advanced;
  }
  /** Point `dist` metres ahead along lane -> next -> the element after. */
  ahead(dist: number, out: { x: number; z: number; yaw: number }) {
    let l: Lane | null = this.lane, s = this.s + dist, hop = 0;
    let nxt: Lane | null = this.next;
    while (l && s > l.len && nxt && hop < 3) {
      s -= l.len; l = nxt; hop++;
      nxt = this.route ? this.route[this.ri + hop + 1] ?? null : l.kind === 'conn' ? l.next[0] : l.next.find((c) => c.turn === 'S') ?? l.next[0] ?? null;
    }
    return lanePoint(l!, s, out);
  }
  get distToEnd() { return this.lane.len - this.s; }
}

export interface Driver {
  v: Vehicle; f: LaneFollower; profile: number; state: TrafficState; kind: 'civilian' | 'mission' | 'rival' | 'police';
  stuckT: number; blockedT: number; panicT: number; recoverT: number; hornT: number; offT: number;
  gap: number; leadSpeed: number; pedAhead: boolean; holds: Intersection | null; holdT: number; tickOff: number;
  speedMul: number; ignoreSignals: boolean; flee: boolean; pullOver: boolean; staticBlock: boolean; chase: boolean; repathT: number;
}

export class Traffic {
  drivers: Driver[] = [];
  private byVeh = new Map<number, Driver>();
  private occ = new Map<number, { d: Driver; axis: 0 | 1; turn: string; dir: number; t: number }[]>();
  density = 22;
  private spawnT = 0; private parkT = 0;
  private spotState = new Map<number, { v: Vehicle | null; taken: boolean }>();
  private everOccupied = new Set<number>();
  enabled = true; private force = false;
  constructor(public sim: Sim) {
    sim.bus.on('noise', (n) => {
      if (n.kind !== 'gunshot') return;
      for (const d of this.drivers) if (d.kind === 'civilian' && Math.hypot(d.v.x - n.x, d.v.z - n.z) < Math.min(n.radius, 55)) this.panic(d, 14);
    });
    sim.bus.on('vehicleImpact', (e) => {
      const d = this.drivers.find((dd) => dd.v.id === e.vehicleId);
      if (!d) return;
      const pv = sim.player.vehicle;
      const byPlayer = !!pv && Math.hypot(pv.x - d.v.x, pv.z - d.v.z) < 8 && sim.time - pv.lastImpactTime < 0.3;
      if (d.kind !== 'civilian') return;
      if (byPlayer && e.dv > 3.5) {
        sim.police.crime('propertyDamage', d.v.x, d.v.z, { vehicle: pv! });
        const r = sim.rng.next();
        if (r < 0.45) this.panic(d, 16); else if (r < 0.7 && d.v.speedAbs < 6) this.ejectDriver(d.v, true); else d.recoverT = 2.5;
      } else d.recoverT = Math.max(d.recoverT, 1.8);
    });
  }
  driverOf(v: Vehicle) { return this.byVeh.get(v.id) ?? null; }
  wasOccupied(v: Vehicle) { return this.everOccupied.has(v.id); }
  panic(d: Driver, secs: number) { d.panicT = Math.max(d.panicT, secs); d.flee = true; }
  onVehicleShot(v: Vehicle) { const d = this.byVeh.get(v.id); if (d && d.kind === 'civilian') { if (this.sim.rng.chance(0.5)) this.panic(d, 18); else this.ejectDriver(v, true); } }

  addDriver(v: Vehicle, lane: Lane, s: number, kind: Driver['kind'] = 'civilian'): Driver {
    const f = new LaneFollower(lane, s);
    f.pickNext(this.sim.rng);
    const d: Driver = {
      v, f, profile: kind === 'civilian' ? this.sim.rng.int(0, 2) : 2, state: 'Cruise', kind, stuckT: 0, blockedT: 0, panicT: 0, recoverT: 0, hornT: 0, offT: 0,
      gap: 99, leadSpeed: 0, pedAhead: false, holds: null, holdT: 0, tickOff: this.sim.rng.int(0, 2), speedMul: 1, ignoreSignals: false, flee: false, pullOver: false, staticBlock: false, chase: false, repathT: 0,
    };
    v.driver = kind; v.wake(); this.everOccupied.add(v.id);
    this.drivers.push(d); this.byVeh.set(v.id, d);
    return d;
  }
  removeDriver(d: Driver) {
    const i = this.drivers.indexOf(d);
    if (i >= 0) this.drivers.splice(i, 1);
    this.byVeh.delete(d.v.id); this.release(d);
    if (d.v.driver === d.kind) d.v.driver = 'none';
  }
  ejectDriverSilent(v: Vehicle) { const d = this.byVeh.get(v.id); if (d) this.removeDriver(d); }
  /** Mission-reserved drivers: a fleeing van that still stops for obstacles, or a rival that hunts the player. */
  addScripted(v: Vehicle, mode: 'flee' | 'chase'): Driver | null {
    const nl = nearestLane(v.x, v.z, v.yaw);
    if (!nl) return null;
    const d = this.addDriver(v, nl.lane, nl.s, mode === 'chase' ? 'rival' : 'mission');
    d.ignoreSignals = true; d.speedMul = mode === 'chase' ? 1.9 : 1.3; d.chase = mode === 'chase';
    return d;
  }
  private chaseStep(d: Driver, dt: number) {
    const sim = this.sim, p = sim.player, v = d.v, dist = Math.hypot(p.x - v.x, p.z - v.z);
    d.repathT -= dt;
    if (d.repathT <= 0 || d.f.finished) {
      d.repathT = 1.5;
      const nl = nearestLane(v.x, v.z, v.yaw), start = nl && Math.abs(nl.lat) < 6 ? nl.lane : d.f.lane;
      d.f.lane = start; d.f.setRoute(laneRoute(start, p.x, p.z));
    }
    if (dist < 45 && !p.downed && sim.phys.los(v.x, v.y + 1, v.z, p.x, p.y + 1, p.z)) {
      const pv = p.vehicle;
      v.ctl.steer = steerToward(v, p.x + (pv ? pv.vx : 0) * 0.4, p.z + (pv ? pv.vz : 0) * 0.4);
      driveToSpeed(v, clamp(p.speed + 6 + dist * 0.2, 8, v.spec.topSpeed * 0.85));
    }
  }
  /** The driver gets out (carjacked, bailed, or abandoned a wreck) and becomes a pedestrian. */
  ejectDriver(v: Vehicle, byPlayer: boolean) {
    const d = this.byVeh.get(v.id);
    if (!d) { if (v.driver !== 'player') v.driver = 'none'; return; }
    this.removeDriver(d);
    v.ctl.throttle = 0; v.ctl.steer = 0; v.hazard = true;
    if (d.kind === 'civilian' || d.kind === 'mission' || d.kind === 'rival') {
      const p = this.sim.player.body;
      const side = (p.x - v.x) * Math.cos(v.yaw) - (p.z - v.z) * Math.sin(v.yaw) > 0 ? -1 : 1; // opposite the player
      const door = v.doorPos({ x: 0, y: 0, z: 0 }, v.isMoto ? side : side);
      this.sim.peds.spawnEjected(door.x, door.z, byPlayer, d.kind !== 'civilian');
    }
  }

  private release(d: Driver) {
    if (!d.holds) return;
    const list = this.occ.get(d.holds.id);
    if (list) { const i = list.findIndex((o) => o.d === d); if (i >= 0) list.splice(i, 1); }
    d.holds = null;
  }
  /** Intersection priority: compatible movements share the box, conflicting ones wait. */
  private mayEnter(d: Driver, it: Intersection, conn: Lane): boolean {
    let list = this.occ.get(it.id);
    if (!list) { list = []; this.occ.set(it.id, list); }
    const axis: 0 | 1 = conn.dir === 0 || conn.dir === 2 ? 0 : 1;
    for (let i = list.length - 1; i >= 0; i--) if (this.sim.time - list[i].t > 14 || !this.byVeh.has(list[i].d.v.id)) list.splice(i, 1);
    for (const o of list) {
      if (o.d === d) return true;
      if (o.axis !== axis) return false;
      if (o.dir !== conn.dir && (o.turn === 'L' || conn.turn === 'L')) return false;
    }
    list.push({ d, axis, turn: conn.turn, dir: conn.dir, t: this.sim.time });
    d.holds = it; d.holdT = this.sim.time;
    return true;
  }

  /** Distance along the driver's path to the nearest obstacle in its corridor (vehicles, people). */
  private perceive(d: Driver) {
    const sim = this.sim, v = d.v, f = d.f;
    const look = clamp(8 + v.speedAbs * 2.2, 12, 42);
    const n = 5;
    const px: number[] = [v.x], pz: number[] = [v.z];
    for (let k = 1; k <= n; k++) { f.ahead((look * k) / n, _pt); px.push(_pt.x); pz.push(_pt.z); }
    let gap = 99, lead = 0, ped = false, stat = false;
    const hl = v.spec.length / 2, fy = Math.sin(v.yaw), fzz = Math.cos(v.yaw);
    const test = (ox: number, oz: number, rad: number, ovx: number, ovz: number, isPed: boolean, oLen: number) => {
      const ddx = ox - v.x, ddz = oz - v.z;
      if (ddx * ddx + ddz * ddz > (look + 6) * (look + 6)) return;
      let acc = 0;
      for (let k = 0; k < n; k++) {
        const ax = px[k], az = pz[k], bx = px[k + 1], bz = pz[k + 1];
        const segLen = Math.hypot(bx - ax, bz - az);
        const t = segParam(ox, oz, ax, az, bx, bz);
        const qx = ax + (bx - ax) * t, qz = az + (bz - az) * t;
        if (Math.hypot(ox - qx, oz - qz) < rad) {
          if (k === 0 && t <= 0 && ddx * fy + ddz * fzz < 0) return; // behind us
          const dist = acc + segLen * t - hl - oLen;
          if (dist < gap) { gap = Math.max(0, dist); lead = Math.max(0, ovx * fy + ovz * fzz); ped = isPed; stat = !isPed && Math.hypot(ovx, ovz) < 0.4; }
          return;
        }
        acc += segLen;
      }
    };
    for (const o of sim.vehicles.list) {
      if (o === v) continue;
      test(o.x, o.z, (v.spec.width + o.spec.width) / 2 + 0.45, o.vx, o.vz, false, o.spec.length / 2);
    }
    const pl = sim.player;
    if (!pl.vehicle) test(pl.body.x, pl.body.z, v.spec.width / 2 + 0.7, pl.body.vx, pl.body.vz, true, 0.3);
    for (const p of sim.peds.list) if (!p.gone) test(p.x, p.z, v.spec.width / 2 + (p.crossing ? 1.1 : 0.55), 0, 0, true, 0.3);
    for (const a of sim.actors.list) if (!a.inVehicle && !a.dead) test(a.body.x, a.body.z, v.spec.width / 2 + 0.6, 0, 0, true, 0.3);
    d.gap = gap; d.leadSpeed = lead; d.pedAhead = ped && gap < 30; d.staticBlock = stat && gap < 12;
  }

  private stepDriver(d: Driver, dt: number) {
    const sim = this.sim, v = d.v, f = d.f, prof = PROFILES[d.profile];
    if (v.stalled || v.submerged) { if (d.kind === 'police') this.removeDriver(d); else this.ejectDriver(v, false); return; }
    const adv = f.update(v.x, v.z, sim.rng);
    if (adv && d.holds && f.lane.kind === 'lane') this.release(d);
    if (d.holds && sim.time - d.holdT > 14) this.release(d);
    if (f.finished) { d.state = 'Despawn'; return; }
    if ((sim.tick + d.tickOff) % 3 === 0) this.perceive(d);
    d.panicT -= dt; d.recoverT -= dt; d.hornT -= dt;
    if (d.panicT <= 0 && d.kind === 'civilian') d.flee = false;

    const lane = f.lane;
    let v0 = lane.speed * prof.speed * d.speedMul * (1 - 0.12 * sim.weather.wetness);
    if (d.flee) v0 *= 1.55;
    // slow for an upcoming turn
    if (lane.kind === 'lane' && f.next && f.next.turn !== 'S' && f.distToEnd < 22) v0 = Math.min(v0, Math.max(f.next.speed, f.next.speed + (f.distToEnd - 4) * 0.5));
    let state: TrafficState = lane.kind === 'conn' && lane.turn !== 'S' ? 'Turn' : 'Cruise';
    let stopDist = 999;
    const ignoreSig = d.ignoreSignals || d.flee;
    // signals + intersection priority at the end of a road lane
    if (lane.kind === 'lane' && lane.toInter && f.next) {
      const de = f.distToEnd - v.spec.length / 2 - 0.8;
      if (de < 30) {
        const light = ignoreSig ? 'green' : sim.signals.laneLight(lane);
        const comfortStop = (v.speed * v.speed) / (2 * 3.2);
        let go = light === 'green' || (light === 'yellow' && de < comfortStop * 0.8);
        if (go && de < 16 && !d.holds) go = d.flee || this.mayEnter(d, lane.toInter, f.next);
        else if (go && de >= 16) go = true;
        if (!go) { stopDist = Math.max(0, de); state = light === 'green' ? 'Follow' : 'StopSignal'; }
      }
    }
    // emergency vehicles: pull to the kerb and wait
    d.pullOver = false;
    if (d.kind === 'civilian' && lane.kind === 'lane' && !d.flee) {
      for (const pu of sim.police.units) {
        const pv = pu.vehicle;
        if (!pv || !pv.siren || pv.driver !== 'police') continue;
        const dx = pv.x - v.x, dz = pv.z - v.z, dist = Math.hypot(dx, dz);
        if (dist < 55 && pv.speedAbs > 4 && (pv.vx * -dx + pv.vz * -dz) > 0) { d.pullOver = true; break; }
      }
    }
    // IDM car following against the nearest constraint
    const a = 2.4, b = 3.2, sp = Math.max(0, v.speed);
    let acc = a * (1 - Math.pow(sp / Math.max(v0, 0.1), 4));
    const constrain = (gap: number, vl: number) => {
      const sStar = prof.s0 + Math.max(0, sp * prof.T + (sp * (sp - vl)) / (2 * Math.sqrt(a * b)));
      const g = Math.max(gap, 0.3);
      acc = Math.min(acc, a * (1 - Math.pow(sp / Math.max(v0, 0.1), 4) - (sStar / g) * (sStar / g)));
    };
    if (stopDist < 900) constrain(stopDist + 1.6, 0);
    if (d.gap < 90 && !(d.flee && d.pedAhead === false && d.gap > 4)) {
      constrain(d.gap, d.leadSpeed);
      if (state === 'Cruise' && d.gap < 28) state = d.pedAhead ? 'YieldCrosswalk' : 'Follow';
    }
    let target = clamp(sp + acc * 0.9, 0, v0 * 1.05);
    if ((d.gap < 1.4 && !d.flee) || stopDist < 0.6) target = 0;
    if (d.pullOver) { target = 0; state = 'PullOverEmergency'; }
    if (d.recoverT > 0) { target = 0; state = 'CollisionRecovery'; }
    if (d.flee) state = d.panicT > 8 ? 'Panic' : 'Flee';

    // blocked handling: horn, lane change, give up out of sight
    if (sp < 0.4 && target < 0.5 && state !== 'StopSignal' && state !== 'PullOverEmergency') d.blockedT += dt; else d.blockedT = Math.max(0, d.blockedT - dt * 2);
    if (d.blockedT > prof.horn && d.hornT <= 0 && d.staticBlock) { d.hornT = 5 + sim.rng.next() * 4; sim.bus.emit('sfx', { name: 'horn_ai', x: v.x, y: v.y + 1, z: v.z }); }
    if (d.staticBlock && d.blockedT > 3.5 && lane.kind === 'lane' && lane.adjacent && !f.route) {
      const adj = lane.adjacent; laneProject(adj, v.x, v.z, _pr);
      let free = true;
      for (const o of sim.vehicles.list) { if (o === v) continue; laneProject(adj, o.x, o.z, _pr); const ds = _pr.s - f.s; if (Math.abs(_pr.lat) < 1.6 && ds > -10 && ds < 14 && Math.hypot(o.x - v.x, o.z - v.z) < 22) { free = false; break; } }
      if (free) { f.lane = adj; f.next = null; f.pickNext(sim.rng); d.blockedT = 0; d.gap = 99; state = 'ChangeLane'; }
    } else if (d.staticBlock && d.blockedT > 2) state = 'AvoidObstacle';

    // steering: pure pursuit on the path (shifted right while pulling over)
    const ld = clamp(3.2 + sp * 0.55, 4, 12);
    f.ahead(ld, _pt2);
    let tx = _pt2.x, tz = _pt2.z;
    if (d.pullOver) { tx += Math.cos(_pt2.yaw) * 1.5; tz -= Math.sin(_pt2.yaw) * 1.5; }
    v.ctl.steer = steerToward(v, tx, tz);
    v.ctl.handbrake = false;
    driveToSpeed(v, target);

    // off-route recovery: adopt whichever lane matches where the car now points
    const headErr = Math.abs(angleDiff(_pt2.yaw, v.yaw));
    if (Math.abs(f.lat) > 3.6 || headErr > 1.4) {
      d.offT += dt;
      if (d.offT > 1.2 && !f.route) {
        const nl = nearestLane(v.x, v.z, v.yaw);
        if (nl && Math.abs(nl.lat) < 7 && nl.lane !== f.lane) { this.release(d); f.lane = nl.lane; f.s = nl.s; f.next = null; f.pickNext(sim.rng); d.offT = 0; }
      }
    } else d.offT = 0;
    if ((sp < 0.3 && state !== 'StopSignal' && state !== 'Follow' && state !== 'YieldCrosswalk' && state !== 'PullOverEmergency') || v.upY < 0.5) d.stuckT += dt; else d.stuckT = Math.max(0, d.stuckT - dt);
    d.state = state;
  }

  private nearCount(x: number, z: number, r: number) {
    let n = 0;
    for (const v of this.sim.vehicles.list) if (Math.abs(v.x - x) < r && Math.abs(v.z - z) < r) n++;
    return n;
  }
  /** Spawn one civilian vehicle on a lane the player cannot currently see. */
  private trySpawn() {
    const sim = this.sim, px = sim.player.x, pz = sim.player.z;
    for (let attempt = 0; attempt < 6; attempt++) {
      const lane = sim.rng.pick(roadLanes);
      let s = sim.rng.range(4, Math.max(5, lane.len - 12));
      if (lane.portalStart && sim.rng.chance(0.6)) s = 3; // enter the district through a tunnel mouth
      lanePoint(lane, s, _pt);
      const dist = Math.hypot(_pt.x - px, _pt.z - pz);
      if (dist < (this.force ? 28 : 65) || dist > 190) continue;
      const y = surfaceY(_pt.x, _pt.z);
      if (!this.force && !(lane.portalStart && s < 5) && sim.isVisible(_pt.x, y + 1, _pt.z)) continue;
      let clear = true;
      for (const o of sim.vehicles.list) if (Math.hypot(o.x - _pt.x, o.z - _pt.z) < 14) { clear = false; break; }
      if (!clear) continue;
      let total = 0; for (const id of TRAFFIC_TYPES) total += VEHICLES[id].traffic;
      let r = sim.rng.next() * total, type = TRAFFIC_TYPES[0];
      for (const id of TRAFFIC_TYPES) { r -= VEHICLES[id].traffic; if (r <= 0) { type = id; break; } }
      const spec = VEHICLES[type];
      const v = sim.vehicles.spawn(type, _pt.x, _pt.z, DIR_YAW[lane.dir], sim.rng.pick(spec.colors), y);
      const sp = lane.speed * 0.7;
      v.body.setLinvel({ x: Math.sin(v.yaw) * sp, y: 0, z: Math.cos(v.yaw) * sp }, true);
      this.addDriver(v, lane, s);
      return;
    }
  }
  private updateParked() {
    const sim = this.sim, px = sim.player.x, pz = sim.player.z;
    let active = 0;
    for (const st of this.spotState.values()) if (st.v) active++;
    for (const sp of parkSpots) {
      const d = Math.hypot(sp.x - px, sp.z - pz);
      let st = this.spotState.get(sp.id);
      if (d < 130 && !st) {
        const h = hash2(sp.id, 17, 3);
        const occupied = sp.reserved ? h < 0.6 : h < (sp.lot ? 0.42 : 0.3);
        st = { v: null, taken: !occupied };
        this.spotState.set(sp.id, st);
      }
      if (!st) continue;
      if (!st.v && !st.taken && d < 125 && active < 34 && (sim.time < 1 || d > 50 || !sim.isVisible(sp.x, 1, sp.z))) {
        if (this.nearCount(sp.x, sp.z, 3.2) === 0) { st.v = this.spawnParked(sp); active++; } else st.taken = true;
      } else if (st.v) {
        const v = st.v;
        const moved = Math.hypot(v.x - sp.x, v.z - sp.z) > 2 || v.driver !== 'none' || v.everDriven;
        if (moved) { st.v = null; st.taken = true; v.parkSpotId = -1; }
        else if (d > 160) { sim.vehicles.remove(v); st.v = null; }
      }
    }
  }
  private spawnParked(sp: ParkSpot): Vehicle {
    const sim = this.sim, h = hash2(sp.id, 5, 9);
    let type = sp.reserved ? 'warden' : TRAFFIC_TYPES[Math.floor(h * TRAFFIC_TYPES.length)];
    if (!sp.reserved && h > 0.93) type = 'cutlass';
    const spec = VEHICLES[type];
    const v = sim.vehicles.spawn(type, sp.x, sp.z, sp.yaw, spec.colors[Math.floor(hash2(sp.id, 2, 1) * spec.colors.length)], surfaceY(sp.x, sp.z));
    v.locked = !sp.reserved && hash2(sp.id, 8, 4) < 0.15; v.parkSpotId = sp.id;
    return v;
  }

  update(dt: number) {
    const sim = this.sim;
    for (let i = this.drivers.length - 1; i >= 0; i--) {
      const d = this.drivers[i];
      this.stepDriver(d, dt);
      if (!this.byVeh.has(d.v.id)) continue; // ejected during the step
      if (d.chase) this.chaseStep(d, dt);
      if (d.kind !== 'civilian') continue;
      const dist = Math.hypot(d.v.x - sim.player.x, d.v.z - sim.player.z);
      const hidden = dist > 75 && !sim.isVisible(d.v.x, d.v.y + 1, d.v.z);
      if (d.state === 'Despawn' || (dist > 215 && hidden) || (d.stuckT > 16 && hidden) || d.v.y < -12) {
        this.removeDriver(d); sim.vehicles.remove(d.v);
      }
    }
    // abandoned, undriven wrecks are towed once nobody is looking
    if (sim.tick % 60 === 0) {
      for (const v of [...sim.vehicles.list]) {
        if (v.driver !== 'none' || v.persistent || v.parkSpotId >= 0 || v.ref) continue;
        const dist = Math.hypot(v.x - sim.player.x, v.z - sim.player.z);
        if (dist > 90 && !sim.isVisible(v.x, v.y + 1, v.z)) sim.vehicles.remove(v);
      }
    }
    if (!this.enabled) return;
    this.spawnT -= dt;
    const civ = this.drivers.reduce((n, d) => n + (d.kind === 'civilian' ? 1 : 0), 0);
    if (this.spawnT <= 0 && civ < this.density) { this.spawnT = sim.time < 2 ? 0 : 0.2; this.trySpawn(); }
    this.parkT -= dt;
    if (this.parkT <= 0) { this.parkT = 0.5; this.updateParked(); }
  }
  /** Fill the streets immediately (new game / load), ignoring visibility. */
  prewarm() {
    this.force = true;
    for (let k = 0; k < 400 && this.drivers.length < this.density; k++) this.trySpawn();
    this.force = false;
    this.updateParked();
  }
}
