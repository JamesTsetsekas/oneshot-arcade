import { clamp, fwd, rgt } from '../core/math';
import type { V2 } from '../core/math';
import type { Game } from './game';
import type { Lane } from './nav';
import { CIVILIAN_VEHICLES, VEHICLES, makeVehicle, stepVehicle } from './vehicle';
import type { Vehicle } from './vehicle';
import { obstacleAhead, pathDistanceTo, pointOnPath, pursueSteer, speedCommand } from './driver';

export type TrafficState = 'Cruise' | 'Follow' | 'StopSignal' | 'Turn' | 'Panic' | 'PullOverEmergency' | 'CollisionRecovery' | 'Despawn';
export type Profile = 'cautious' | 'normal' | 'impatient';

interface PathNode extends V2 { stop?: Lane }

export interface TrafficAI {
  vehicleId: number;
  lane: Lane;
  path: PathNode[];
  idx: number;
  state: TrafficState;
  profile: Profile;
  speedMul: number;
  stuckT: number;
  panicT: number;
  recoverT: number;
  honkCool: number;
  bias: number;
  fleeing: boolean;
}

const PROFILE_MUL: Record<Profile, number> = { cautious: 0.82, normal: 1, impatient: 1.12 };

export class TrafficSystem {
  ai = new Map<number, TrafficAI>();
  target = 22;
  parkedTarget = 34;
  private spawnT = 0;
  stats = { spawned: 0, despawned: 0, panics: 0 };

  count(): number { return this.ai.size; }

  /** Build an initial path on a lane starting at distance `s`. */
  private startPath(g: Game, lane: Lane, s: number): { path: PathNode[]; pos: V2 } {
    const d = lane.dir;
    const pos = { x: lane.p0.x + d.x * s, z: lane.p0.z + d.z * s };
    const path: PathNode[] = [{ x: lane.p1.x, z: lane.p1.z, stop: lane }];
    this.extend(g, path, lane, 3);
    return { path, pos };
  }

  /** Append the next `n` lane segments (choose turns) to a path. */
  private extend(g: Game, path: PathNode[], lane: Lane, n: number, lastLane?: { lane: Lane }): Lane {
    let cur = lane;
    for (let k = 0; k < n; k++) {
      const options = g.roads.next(cur);
      if (!options.length) break;
      // bias toward going straight
      const straight = options.filter((o) => o.dir.x === cur.dir.x && o.dir.z === cur.dir.z);
      const next = straight.length && g.rng.chance(0.55) ? straight[0] : g.rng.pick(options);
      const turn = g.roads.turnPath(cur, next);
      for (let i = 1; i < turn.length; i++) path.push({ x: turn[i].x, z: turn[i].z });
      path.push({ x: next.p1.x, z: next.p1.z, stop: next });
      cur = next;
    }
    if (lastLane) lastLane.lane = cur;
    return cur;
  }

  spawnTraffic(g: Game, lane: Lane, s: number, defId?: string, profile?: Profile): Vehicle | null {
    const { path, pos } = this.startPath(g, lane, s);
    const heading = Math.atan2(lane.dir.x, lane.dir.z);
    const def = VEHICLES[defId ?? g.rng.pick(CIVILIAN_VEHICLES)];
    const v = makeVehicle(def, pos.x, pos.z, heading, 'traffic');
    v.engineOn = true;
    v.driverId = -1;
    v.lights = g.hour < 6.5 || g.hour > 18.5;
    const sp = lane.limit * 0.8;
    v.vx = Math.sin(heading) * sp;
    v.vz = Math.cos(heading) * sp;
    v.speed = sp;
    g.vehicles.push(v);
    this.ai.set(v.id, {
      vehicleId: v.id, lane, path, idx: 0, state: 'Cruise', profile: profile ?? g.rng.pick<Profile>(['cautious', 'normal', 'normal', 'impatient']),
      speedMul: g.rng.range(0.92, 1.08), stuckT: 0, panicT: 0, recoverT: 0, honkCool: 0, bias: 0, fleeing: false,
    });
    this.stats.spawned++;
    return v;
  }

  /** Hand an arbitrary (mission) vehicle to the lane-follow AI, e.g. a fleeing van. */
  adopt(g: Game, v: Vehicle, flee = false): void {
    const near = g.roads.nearestLane(v.x, v.z);
    const path: PathNode[] = [{ x: near.lane.p1.x, z: near.lane.p1.z, stop: near.lane }];
    this.extend(g, path, near.lane, 4);
    v.engineOn = true;
    this.ai.set(v.id, {
      vehicleId: v.id, lane: near.lane, path, idx: 0, state: 'Cruise', profile: 'impatient', speedMul: 1.1,
      stuckT: 0, panicT: 0, recoverT: 0, honkCool: 0, bias: 0, fleeing: flee,
    });
  }

  release(vehicleId: number): void { this.ai.delete(vehicleId); }

  panic(vehicleId: number, seconds = 7): void {
    const a = this.ai.get(vehicleId);
    if (!a) return;
    if (a.state !== 'Panic') this.stats.panics++;
    a.panicT = Math.max(a.panicT, seconds);
  }

  update(g: Game, dt: number): void {
    const P = g.player.human;
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 0.35; this.maintain(g); }
    const sirenNear = g.vehicles.filter((v) => v.siren && v.alive && Math.hypot(v.x - P.x, v.z - P.z) < 110);
    for (const [id, a] of this.ai) {
      const v = g.vehicleById(id);
      if (!v || !v.alive) { this.ai.delete(id); continue; }
      if (v.driverId === 0) { this.ai.delete(id); continue; } // player took over
      this.driveOne(g, v, a, dt, sirenNear);
    }
  }

  private maintain(g: Game): void {
    const P = g.player.human;
    const cam = g.cam.pose;
    // despawn
    for (const [id, a] of this.ai) {
      const v = g.vehicleById(id);
      if (!v) { this.ai.delete(id); continue; }
      if (v.tag) continue; // mission vehicles are never culled here
      const d = Math.hypot(v.x - P.x, v.z - P.z);
      const unseen = d > 90 || !this.inView(cam, v.x, v.z);
      if (d > 185 || (d > 135 && unseen) || (a.stuckT > 30 && unseen) || (v.health <= 0 && unseen && d > 40)) { this.remove(g, v); }
    }
    // spawn
    let need = this.target - this.activeAmbient();
    let tries = 0;
    const speedBoost = Math.hypot(P.vx, P.vz) > 15 ? 20 : 0;
    while (need > 0 && tries++ < 14) {
      const lane = g.rng.pick(g.roads.lanes);
      const s = g.rng.range(0, lane.length);
      const x = lane.p0.x + lane.dir.x * s;
      const z = lane.p0.z + lane.dir.z * s;
      const d = Math.hypot(x - P.x, z - P.z);
      if (d < 62 + speedBoost || d > 118 + speedBoost) continue;
      if (this.inView(cam, x, z) && d < 110) continue;
      if (g.vehicles.some((o) => Math.hypot(o.x - x, o.z - z) < 11)) continue;
      // never spawn inside an intersection box
      if (s < 1 || s > lane.length - 8) continue;
      if (this.spawnTraffic(g, lane, s)) need--;
    }
    // parked cars
    const parked = g.vehicles.filter((v) => v.owner === 'parked');
    for (const v of parked) {
      const d = Math.hypot(v.x - P.x, v.z - P.z);
      if (d > 170 && !v.tag) this.remove(g, v);
    }
    let pn = this.parkedTarget - parked.length;
    tries = 0;
    while (pn > 0 && tries++ < 5) {
      const spot = g.rng.pick(g.world.parking);
      const d = Math.hypot(spot.x - P.x, spot.z - P.z);
      if (d < 35 || d > 145) continue;
      if (this.inView(cam, spot.x, spot.z) && d < 90) continue;
      if (g.vehicles.some((o) => Math.hypot(o.x - spot.x, o.z - spot.z) < 6)) continue;
      const defId = g.rng.pick(CIVILIAN_VEHICLES);
      const v = makeVehicle(VEHICLES[defId], spot.x, spot.z, spot.heading, 'parked');
      v.locked = g.rng.chance(0.22);
      g.vehicles.push(v);
      pn--;
    }
  }

  private activeAmbient(): number {
    let n = 0;
    for (const a of this.ai.values()) if (!a.fleeing) n++;
    return n;
  }

  inView(cam: { x: number; z: number; tx: number; tz: number; hfov: number }, x: number, z: number): boolean {
    const dx = x - cam.x;
    const dz = z - cam.z;
    const fx = cam.tx - cam.x;
    const fz = cam.tz - cam.z;
    const fl = Math.hypot(fx, fz) || 1;
    const dl = Math.hypot(dx, dz) || 1;
    const cos = (dx * fx + dz * fz) / (fl * dl);
    return cos > Math.cos(((cam.hfov * 0.5 + 18) * Math.PI) / 180);
  }

  remove(g: Game, v: Vehicle): void {
    this.ai.delete(v.id);
    v.alive = false;
    this.stats.despawned++;
    void g;
  }

  private driveOne(g: Game, v: Vehicle, a: TrafficAI, dt: number, sirens: Vehicle[]): void {
    const lane = a.lane;
    a.honkCool = Math.max(0, a.honkCool - dt);
    a.panicT = Math.max(0, a.panicT - dt);
    // advance waypoint index
    while (a.idx < a.path.length - 1 && Math.hypot(a.path[a.idx].x - v.x, a.path[a.idx].z - v.z) < 4.2) {
      const passed = a.path[a.idx];
      if (passed.stop) a.lane = passed.stop;
      a.idx++;
    }
    if (a.idx > 8) { a.path.splice(0, a.idx - 2); a.idx = 2; }
    if (a.path.length - a.idx < 6) this.extend(g, a.path, this.lastLane(a), 3);

    const speedAbs = Math.abs(v.speed);
    let state: TrafficState = 'Cruise';
    let vt = lane.limit * PROFILE_MUL[a.profile] * a.speedMul;
    if (a.fleeing) vt = 15;
    if (a.panicT > 0) { state = 'Panic'; vt *= 1.35; }

    // lookahead steer ------------------------------------------------------------------
    const L = clamp(5 + speedAbs * 0.55, 6, 20);
    const tp = pointOnPath(a.path, a.idx, v.x, v.z, L);
    let tx = tp.x;
    let tz = tp.z;
    // sharp turn ahead -> slow
    const nxt = a.path[Math.min(a.idx + 2, a.path.length - 1)];
    const hdgTo = Math.atan2(nxt.x - v.x, nxt.z - v.z);
    let turn = Math.abs(Math.atan2(Math.sin(hdgTo - v.heading), Math.cos(hdgTo - v.heading)));
    if (turn > 0.5) { vt = Math.min(vt, 8.5 - turn * 2); state = state === 'Cruise' ? 'Turn' : state; }

    // emergency vehicles: pull to the right and slow ------------------------------------
    let emergency = false;
    for (const s of sirens) {
      const d = Math.hypot(s.x - v.x, s.z - v.z);
      if (d < 55 && s !== v) emergency = true;
    }
    if (emergency && a.panicT <= 0 && !a.fleeing) {
      const r = rgt(v.heading);
      a.bias = clamp(a.bias + dt * 2, 0, 2.2);
      tx += r.x * a.bias;
      tz += r.z * a.bias;
      vt = Math.min(vt, 4.5);
      state = 'PullOverEmergency';
    } else a.bias = Math.max(0, a.bias - dt * 2);

    // signals ----------------------------------------------------------------------------
    if (a.panicT <= 0 || g.rng.chance(0.0)) {
      for (let i = a.idx; i < Math.min(a.path.length, a.idx + 4); i++) {
        const st = a.path[i].stop;
        if (!st) continue;
        const ds = pathDistanceTo(a.path, a.idx, i, v.x, v.z);
        const ph = g.signals.phase(g.t, st.axis);
        if (ds > 70) break;
        if (ph === 'red' || (ph === 'yellow' && ds > (speedAbs * speedAbs) / 9 + 3)) {
          vt = Math.min(vt, Math.sqrt(Math.max(0, 2 * 3.2 * (ds - 3.2))));
          if (vt < 1.2 || ds < 4) state = 'StopSignal';
        }
        break;
      }
    }

    // obstacles / following ------------------------------------------------------------------
    const reach = 7 + speedAbs * 1.4;
    const ob = obstacleAhead(g, v, v.heading, reach, v.def.width * 0.5 + 0.15);
    if (ob) {
      const safe = ob.kind === 'human' ? Math.max(0, (ob.gap - 3.5) * 1.1) : Math.max(0, Math.min(vt, ob.speed + (ob.gap - 4.0) * 0.55));
      if (safe < vt) { vt = safe; if (state === 'Cruise' || state === 'Turn') state = 'Follow'; }
      if (ob.gap < 5 && speedAbs < 0.8 && state !== 'StopSignal') {
        a.stuckT += dt;
        if (a.stuckT > 4.5 && a.honkCool <= 0 && a.profile !== 'cautious') { v.horn = 0.35; g.emit({ type: 'horn', id: v.id }); a.honkCool = 5; }
      }
    } else if (state !== 'StopSignal') a.stuckT = Math.max(0, a.stuckT - dt * 2);
    if (state === 'StopSignal') a.stuckT = Math.max(0, a.stuckT - dt);

    // collision recovery: back out when jammed ----------------------------------------------
    let throttle = speedCommand(v, vt);
    let steer = pursueSteer(v, tx, tz);
    if (a.recoverT > 0) {
      a.recoverT -= dt;
      throttle = -0.7;
      steer = -steer;
      state = 'CollisionRecovery';
    } else if (a.stuckT > 7 && ob && ob.gap < 3.5 && state !== 'StopSignal') {
      a.recoverT = 1.4;
      a.stuckT = 3;
    }
    if (v.health <= 0) { throttle = 0; }
    a.state = state;
    stepVehicle(v, { throttle, steer, handbrake: state === 'StopSignal' && speedAbs < 0.3 }, dt, g.world.surfaceAt(v.x, v.z));
    v.lights = g.hour < 6.5 || g.hour > 18.5;
    void fwd;
  }

  private lastLane(a: TrafficAI): Lane {
    for (let i = a.path.length - 1; i >= 0; i--) { const s = a.path[i].stop; if (s) return s; }
    return a.lane;
  }
}
