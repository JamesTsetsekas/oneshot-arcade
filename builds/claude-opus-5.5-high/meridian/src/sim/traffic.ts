// Civilian traffic: lane-following "rails" drivers using IDM car-following, synchronized
// signals, left-turn yield, emergency pull-over and panic. Contact with physics bodies
// hands the car to full dynamics, where it recovers and rejoins its lane or is abandoned.
// Parked cars fill lots and courtyards; spawning/despawning only happens out of view.

import { clamp, dist2, Rng, wrapAngle } from "../core/math";
import { makePoly, polyAt, type Lane, type Poly } from "../world/roadgraph";
import { Vehicle, type VehicleModel } from "./vehicle";
import { Character } from "./character";
import { DriveAI } from "./drive-ai";
import type { Game } from "./game";
import { CELL } from "../world/district";

export type TrafficState = "Cruise" | "Follow" | "StopSignal" | "Yield" | "Turn" | "PullOverEmergency" | "Panic" | "CollisionRecovery" | "Rejoin" | "Abandoned";
type Profile = "cautious" | "normal" | "impatient";

export interface TrafficBrain {
  lane: Lane;
  s: number;
  poly: Poly;
  conn: boolean;
  next: Lane | null;
  speed: number;
  profile: Profile;
  T: number;
  vmul: number;
  wait: number;
  honkCd: number;
  pull: number;
  offset: number;
  panic: number;
  state: TrafficState;
  recover: number;
  ai: DriveAI | null;
  ignoreId: number;
  ignoreT: number;
}

const MODELS: [VehicleModel, number][] = [["pella", 28], ["varro", 28], ["osprey", 14], ["brava", 8], ["hauler", 12], ["kestrel", 4], ["vanta", 3]];

function pickModel(r: Rng): VehicleModel {
  let t = r.next() * MODELS.reduce((a, b) => a + b[1], 0);
  for (const [m, w] of MODELS) { t -= w; if (t <= 0) return m; }
  return "varro";
}

export interface ParkSpot { x: number; z: number; yaw: number; model: VehicleModel; locked: boolean; seed: number; vehicle: Vehicle | null; taken: boolean }

const tmp = { x: 0, z: 0, dx: 0, dz: 0 };

export class TrafficSystem {
  brains = new Map<number, TrafficBrain>();
  spots: ParkSpot[] = [];
  private rng: Rng;
  spawnCd = 0;
  /** stats for tests/debug */
  redViolations = 0;

  constructor(private g: Game) {
    this.rng = new Rng(4242);
    this.buildSpots();
  }

  private buildSpots() {
    const d = this.g.d;
    const r = new Rng(77);
    const want = 140;
    let tries = 0;
    const authored: [number, number, number][] = [
      [-64, 97, Math.PI / 2], [-150, -364, Math.PI / 2], [-140, -355, 0], [276, -116, Math.PI], [284, -116, Math.PI],
      [-250, -125, 0], [-246, -125, 0], [235, -295, Math.PI / 2], [262, -295, Math.PI / 2], [60, -150, 0],
    ];
    for (const [x, z, yaw] of authored) this.spots.push({ x, z, yaw, model: pickModel(r), locked: false, seed: r.int(0, 1e6), vehicle: null, taken: false });
    while (this.spots.length < want && tries++ < 6000) {
      const b = d.blocks[r.int(0, d.blocks.length - 1)];
      if (b.kind === "edge") continue;
      const x = r.range(b.x0 + 3, b.x1 - 3), z = r.range(b.z0 + 3, b.z1 - 3);
      const yaw = r.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
      const res = this.g.world.query(x - 3.2, z - 3.2, x + 3.2, z + 3.2);
      if (res.length) continue;
      if (d.reserved.some((q) => x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2)) continue;
      if (d.interiors.some((q) => x > q.x0 - 4 && x < q.x1 + 4 && z > q.z0 - 4 && z < q.z1 + 4)) continue;
      if (this.spots.some((s) => dist2(s.x, s.z, x, z) < 7)) continue;
      if (d.props.some((p) => dist2(p.x, p.z, x, z) < 3)) continue;
      if (this.g.waterAt(x, z) !== null) continue;
      this.spots.push({ x, z, yaw, model: pickModel(r), locked: r.chance(0.3), seed: r.int(0, 1e6), vehicle: null, taken: false });
    }
  }

  get density() { return this.g.settings.trafficDensity; }

  makeDriver(v: Vehicle) {
    const c = new Character("civilian", "commuter", this.g.makeLook("commuter", this.rng), v.x, v.z, v.y);
    c.vehicle = v;
    v.crew = [c];
    v.driver = c.id;
    return c;
  }

  spawnOnLane(lane: Lane, s: number, model?: VehicleModel): Vehicle {
    const poly = makePoly([lane.x0, lane.z0, lane.x1, lane.z1]);
    polyAt(poly, s, tmp);
    const v = new Vehicle(model ?? pickModel(this.rng), tmp.x, tmp.z, Math.atan2(tmp.dx, tmp.dz), this.rng.int(0, 1e6));
    v.mode = "rails";
    v.role = "civilian";
    v.y = this.g.heightAt(v.x, v.z);
    v.savePrev();
    const prof: Profile = this.rng.pick(["cautious", "normal", "normal", "impatient"] as Profile[]);
    const sp = lane.speed * 0.7;
    v.vx = tmp.dx * sp; v.vz = tmp.dz * sp;
    this.brains.set(v.id, {
      lane, s, poly, conn: false, next: null, speed: sp, profile: prof,
      T: prof === "cautious" ? 1.7 : prof === "impatient" ? 0.95 : 1.3,
      vmul: prof === "cautious" ? 0.88 : prof === "impatient" ? 1.1 : 1,
      wait: 0, honkCd: 0, pull: 0, offset: 0, panic: 0, state: "Cruise", recover: 0, ai: null, ignoreId: 0, ignoreT: 0,
    });
    this.makeDriver(v);
    this.g.addVehicle(v);
    return v;
  }

  /** Initial population around a point (used on load). */
  populate(cx: number, cz: number) {
    const target = Math.round(26 * this.density);
    let n = 0, tries = 0;
    while (n < target && tries++ < 400) {
      const lane = this.g.roads.lanes[this.rng.int(0, this.g.roads.lanes.length - 1)];
      const s = this.rng.range(2, Math.max(3, lane.length - 2));
      const x = lane.x0 + lane.dx * s, z = lane.z0 + lane.dz * s;
      const d = dist2(x, z, cx, cz);
      if (d < 25 || d > 230) continue;
      if (this.g.vehicles.some((v) => dist2(v.x, v.z, x, z) < 14)) continue;
      this.spawnOnLane(lane, s);
      n++;
    }
  }

  update(dt: number) {
    const g = this.g;
    const P = g.focus;
    // ---- despawn far / abandoned out of view
    for (const v of g.vehicles) {
      if (!v.despawnable || v.driver === "player") continue;
      if (v.role !== "civilian" && v.role !== "parked") continue;
      const d = dist2(v.x, v.z, P.x, P.z);
      const brain = this.brains.get(v.id);
      const far = d > 260 || (d > 150 && !g.isVisible(v.x, v.y + 1, v.z, 3));
      if (v.role === "parked") {
        if (d > 240 && !g.isVisible(v.x, v.y + 1, v.z, 3)) this.removeVehicle(v);
        continue;
      }
      if (far || (brain?.state === "Abandoned" && d > 70 && !g.isVisible(v.x, v.y + 1, v.z, 3))) this.removeVehicle(v);
    }
    // ---- spawn
    this.spawnCd -= dt;
    const target = Math.round(26 * this.density);
    const active = g.vehicles.filter((v) => v.role === "civilian" && this.brains.has(v.id)).length;
    if (active < target && this.spawnCd <= 0) {
      this.spawnCd = 0.25;
      for (let k = 0; k < 6; k++) {
        const lane = g.roads.lanes[this.rng.int(0, g.roads.lanes.length - 1)];
        if (lane.length < 12) continue;
        const s = this.rng.range(2, lane.length * 0.5);
        const x = lane.x0 + lane.dx * s, z = lane.z0 + lane.dz * s;
        const d = dist2(x, z, P.x, P.z);
        if (d < 90 || d > 220) continue;
        if (g.isVisible(x, g.heightAt(x, z) + 1, z, 4) && d < 200) continue;
        if (g.vehicles.some((v) => dist2(v.x, v.z, x, z) < 16)) continue;
        this.spawnOnLane(lane, s);
        break;
      }
    }
    // ---- parked cars streamed by distance
    for (let i = 0; i < this.spots.length; i++) {
      const sp = this.spots[i];
      if (sp.taken) continue;
      const d = dist2(sp.x, sp.z, P.x, P.z);
      if (!sp.vehicle && d < 170 && (d > 90 || !g.isVisible(sp.x, g.heightAt(sp.x, sp.z) + 1, sp.z, 3) || g.time < 1)) {
        if (g.vehicles.some((v) => dist2(v.x, v.z, sp.x, sp.z) < 4)) continue;
        const v = new Vehicle(sp.model, sp.x, sp.z, sp.yaw, sp.seed);
        v.role = "parked"; v.mode = "physics"; v.locked = sp.locked; v.parkedSpot = i;
        v.y = g.heightAt(v.x, v.z); v.savePrev();
        sp.vehicle = v;
        g.addVehicle(v);
      }
    }

    // ---- drive
    for (const v of g.vehicles) {
      const b = this.brains.get(v.id);
      if (!b) continue;
      if (v.mode === "rails") this.driveRails(v, b, dt);
      else this.drivePhysics(v, b, dt);
    }
  }

  removeVehicle(v: Vehicle) {
    this.brains.delete(v.id);
    if (v.parkedSpot >= 0) {
      const sp = this.spots[v.parkedSpot];
      if (sp && sp.vehicle === v) sp.vehicle = null;
    }
    this.g.removeVehicle(v);
  }

  /** A traffic car was hit/disturbed: switch to full physics. */
  disturb(v: Vehicle) {
    const b = this.brains.get(v.id);
    if (!b || v.mode === "physics") return;
    v.mode = "physics";
    b.state = "CollisionRecovery";
    b.recover = 2 + this.rng.next() * 1.5;
    v.hazard = true;
  }

  /** Player takes the car: driver leaves. */
  release(v: Vehicle) {
    this.brains.delete(v.id);
    v.mode = "physics";
    if (v.parkedSpot >= 0) { const sp = this.spots[v.parkedSpot]; if (sp) { sp.taken = true; sp.vehicle = null; } v.parkedSpot = -1; }
  }

  private pickNext(l: Lane): Lane | null {
    const opts = this.g.roads.nextLanes(l);
    if (!opts.length) {
      // dead end fallback: any outgoing lane
      const n = this.g.roads.nodes[l.to];
      const any = n.out.map((id) => this.g.roads.lanes[id]);
      return any.length ? any[this.rng.int(0, any.length - 1)] : null;
    }
    // weight straight higher
    const w = opts.map((m) => (this.g.roads.turnOf(l, m) === "straight" ? 2.2 : 1));
    let t = this.rng.next() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < opts.length; i++) { t -= w[i]; if (t <= 0) return opts[i]; }
    return opts[0];
  }

  /** Distance to nearest obstacle ahead along heading (vehicles, characters). */
  probe(v: Vehicle, range: number, b: TrafficBrain | null): { dist: number; speed: number; id: number; lateral: number } {
    const g = this.g;
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    const rx = fz, rz = -fx;
    let best = { dist: Infinity, speed: 0, id: 0, lateral: 0 };
    for (const o of g.vehicles) {
      if (o === v) continue;
      const dx = o.x - v.x, dz = o.z - v.z;
      if (Math.abs(dx) > range + 6 || Math.abs(dz) > range + 6) continue;
      const lf = dx * fx + dz * fz, lr = dx * rx + dz * rz;
      if (lf <= 0 || lf > range + o.hl) continue;
      // lateral extent of other along my right axis
      const ofx = Math.sin(o.yaw), ofz = Math.cos(o.yaw);
      const ext = Math.abs(ofx * rx + ofz * rz) * o.hl + Math.abs(ofz * rx - ofx * rz) * o.hw;
      if (Math.abs(lr) > v.hw + ext + 0.35) continue;
      if (b && b.ignoreT > 0 && b.ignoreId === o.id) continue;
      const gap = lf - v.hl - (Math.abs(ofx * fx + ofz * fz) * o.hl + Math.abs(ofz * fx - ofx * fz) * o.hw);
      if (gap < best.dist) best = { dist: gap, speed: Math.max(0, o.vx * fx + o.vz * fz), id: o.id, lateral: lr };
    }
    const chars = g.charsNear(v.x, v.z, range + 4);
    for (const c of chars) {
      if (c.vehicle || !c.alive && c.status !== "dead") continue;
      const dx = c.x - v.x, dz = c.z - v.z;
      const lf = dx * fx + dz * fz, lr = dx * rx + dz * rz;
      if (lf <= 0 || lf > range) continue;
      if (Math.abs(lr) > v.hw + 0.8) continue;
      const gap = lf - v.hl - 0.4;
      if (gap < best.dist) best = { dist: gap, speed: 0, id: -1, lateral: lr };
    }
    return best;
  }

  private driveRails(v: Vehicle, b: TrafficBrain, dt: number) {
    const g = this.g;
    const roads = g.roads;
    if (b.honkCd > 0) b.honkCd -= dt;
    if (b.panic > 0) b.panic -= dt;
    if (b.ignoreT > 0) b.ignoreT -= dt;

    // choose next lane early
    if (!b.conn && !b.next && b.s > b.lane.length - 45) b.next = this.pickNext(b.lane);

    // desired speed
    let v0 = b.lane.speed * b.vmul * (b.panic > 0 ? 1.3 : 1) * (g.weather.wet > 0.5 ? 0.9 : 1);
    if (b.conn && b.next) {
      const t = roads.turnOf(b.lane, b.next);
      if (t === "right") v0 = Math.min(v0, 6);
      else if (t === "left") v0 = Math.min(v0, 7.5);
    }
    let stopGap = Infinity;
    let state: TrafficState = b.conn ? "Turn" : "Cruise";
    if (!b.conn) {
      const toEnd = b.lane.length - b.s;
      const node = roads.nodes[b.lane.to];
      if (node.signal && toEnd < 60) {
        const st = roads.signal(node.id, b.lane.axis, g.time);
        const canStop = toEnd > (b.speed * b.speed) / (2 * 4.5) + 0.5;
        if (st === "red" || (st === "yellow" && canStop)) { stopGap = toEnd - 0.6; state = "StopSignal"; }
      }
      // left turn yield: oncoming traffic about to enter
      if (b.next && roads.turnOf(b.lane, b.next) === "left" && toEnd < 25 && stopGap === Infinity) {
        if (this.oncoming(v, b)) { stopGap = toEnd - 0.6; state = "Yield"; }
      }
      // don't block the box if the exit lane start is jammed
      if (b.next && toEnd < 12 && stopGap === Infinity) {
        const nx = b.next.x0, nz = b.next.z0;
        for (const o of g.vehicles) if (o !== v && o.speed < 1 && dist2(o.x, o.z, nx, nz) < 6) { stopGap = Math.min(stopGap, toEnd - 0.6); state = "Yield"; break; }
      }
    }
    // emergency pull over: siren vehicle behind and approaching
    let pull = false;
    for (const o of g.vehicles) {
      if (!o.siren || o === v) continue;
      const dx = v.x - o.x, dz = v.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d > 40) continue;
      const ofx = Math.sin(o.yaw), ofz = Math.cos(o.yaw);
      if ((dx * ofx + dz * ofz) / d > 0.6 && o.speed > 4) { pull = true; break; }
    }
    if (pull) { b.pull = 4; }
    if (b.pull > 0) {
      b.pull -= dt;
      state = "PullOverEmergency";
      v0 = Math.min(v0, 3);
    }
    const targetOffset = b.pull > 0 && !b.conn ? 1.3 : 0;
    b.offset += (targetOffset - b.offset) * Math.min(1, 1.5 * dt);
    if (b.panic > 0 && state === "Cruise") state = "Panic";

    // leader
    const range = 8 + b.speed * 2.6;
    const lead = this.probe(v, range, b);
    let gap = Math.min(lead.dist, stopGap);
    let dv = gap === lead.dist ? b.speed - lead.speed : b.speed;
    if (lead.dist < range && state === "Cruise") state = "Follow";
    // waiting on a blocker that isn't in our lane path -> deadlock breaker
    if (b.speed < 0.3 && lead.dist < 6 && stopGap === Infinity) {
      b.wait += dt;
      const limit = b.profile === "impatient" ? 1.2 : 2.5;
      if (b.wait > limit && b.honkCd <= 0 && (lead.id === g.playerVehicleId() || lead.id === -1)) {
        g.emit({ type: "horn", x: v.x, y: v.y, z: v.z, id: v.id });
        b.honkCd = 3 + this.rng.next() * 3;
      }
      if (b.wait > 9 && lead.id > 0 && Math.abs(lead.lateral) > 1.0) { b.ignoreId = lead.id; b.ignoreT = 4; b.wait = 0; }
    } else b.wait = Math.max(0, b.wait - dt);

    // IDM
    const amax = b.profile === "impatient" ? 2.4 : 1.9, bc = 3.2, s0 = 2.2;
    const vv = b.speed;
    const sStar = s0 + vv * b.T + (vv * dv) / (2 * Math.sqrt(amax * bc));
    let acc = amax * (1 - Math.pow(vv / Math.max(1, v0), 4));
    if (gap < Infinity) acc -= amax * Math.pow(Math.max(0, sStar) / Math.max(0.1, gap), 2);
    acc = clamp(acc, -9, amax);
    b.speed = Math.max(0, b.speed + acc * dt);
    if (gap < 0.3) b.speed = 0;

    const prevConn = b.conn, prevLane = b.lane;
    b.s += b.speed * dt;
    while (b.s >= b.poly.length) {
      b.s -= b.poly.length;
      if (!b.conn) {
        if (!b.next) b.next = this.pickNext(b.lane);
        if (!b.next) { b.s = b.poly.length; b.speed = 0; break; }
        // track red-light violations (should stay zero)
        const node = roads.nodes[b.lane.to];
        if (node.signal && roads.signal(node.id, b.lane.axis, g.time) === "red") this.redViolations++;
        b.poly = roads.connector(b.lane, b.next);
        b.conn = true;
      } else {
        b.lane = b.next!;
        b.next = null;
        b.poly = makePoly([b.lane.x0, b.lane.z0, b.lane.x1, b.lane.z1]);
        b.conn = false;
      }
    }
    void prevConn; void prevLane;
    polyAt(b.poly, b.s, tmp);
    const rx = tmp.dz, rz = -tmp.dx;
    const nx = tmp.x + rx * b.offset, nz = tmp.z + rz * b.offset;
    const yaw = Math.atan2(tmp.dx, tmp.dz);
    const dyaw = wrapAngle(yaw - v.yaw);
    v.yaw += dyaw * Math.min(1, 14 * dt);
    v.w = dyaw / Math.max(dt, 1e-3) * Math.min(1, 14 * dt);
    v.vx = (nx - v.x) / dt; v.vz = (nz - v.z) / dt;
    if (Math.hypot(v.vx, v.vz) > 40) { v.vx = tmp.dx * b.speed; v.vz = tmp.dz * b.speed; }
    v.x = nx; v.z = nz;
    v.alignToGround(g.vehEnv);
    v.wheelSpin += (b.speed / 0.33) * dt;
    v.lastALong = acc;
    v.lastALat = b.speed * v.w;
    v.updateSuspension(dt, g.vehEnv);
    v.rpm = 0.2 + 0.6 * clamp(b.speed / 20, 0, 1);
    v.brakeIn = acc < -1 ? 1 : 0;
    b.state = state;
  }

  private oncoming(v: Vehicle, b: TrafficBrain): boolean {
    const node = this.g.roads.nodes[b.lane.to];
    for (const o of this.g.vehicles) {
      if (o === v) continue;
      const d = dist2(o.x, o.z, node.x, node.z);
      if (d > 34 || o.speed < 1.5) continue;
      const ofx = Math.sin(o.yaw), ofz = Math.cos(o.yaw);
      // heading opposite to us and moving toward the node
      if (ofx * b.lane.dx + ofz * b.lane.dz > -0.7) continue;
      const tx = node.x - o.x, tz = node.z - o.z;
      if (tx * ofx + tz * ofz < -2) continue;
      return true;
    }
    return false;
  }

  private drivePhysics(v: Vehicle, b: TrafficBrain, dt: number) {
    const g = this.g;
    const driver = v.crew[0] as Character | undefined;
    if (!driver || v.driver !== driver.id) { b.state = "Abandoned"; g.stepVehicle(v, dt, { throttle: 0, brake: 1, steer: 0, handbrake: true }); return; }
    if (b.state === "CollisionRecovery") {
      b.recover -= dt;
      g.stepVehicle(v, dt, { throttle: 0, brake: 1, steer: 0, handbrake: false });
      if (b.recover <= 0) {
        if (v.stalled || v.health < 20 || v.sinking) { this.abandon(v, b); return; }
        b.state = "Rejoin"; b.recover = 15; b.ai = new DriveAI();
      }
      return;
    }
    if (b.state === "Rejoin") {
      b.recover -= dt;
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const near = g.roads.nearestLane(v.x, v.z, fx, fz, 25);
      if (!near || b.recover <= 0) { this.abandon(v, b); return; }
      const l = near.lane;
      const s1 = Math.min(l.length, near.s + 25);
      const route = [v.x, v.z, l.x0 + l.dx * Math.min(l.length, near.s + 8), l.z0 + l.dz * Math.min(l.length, near.s + 8), l.x0 + l.dx * s1, l.z0 + l.dz * s1];
      const ctl = b.ai!.update(v, dt, { route, maxSpeed: 7 }, (x, z, dx, dz) => this.probeFrom(v, x, z, dx, dz));
      g.stepVehicle(v, dt, ctl);
      const align = Math.abs(wrapAngle(v.yaw - Math.atan2(l.dx, l.dz)));
      if (near.d < 0.9 && align < 0.2 && near.s < l.length - 4) {
        // back on rails
        v.mode = "rails"; v.hazard = false;
        b.lane = l; b.s = near.s; b.poly = makePoly([l.x0, l.z0, l.x1, l.z1]); b.conn = false; b.next = null;
        b.speed = Math.max(0, v.fwdSpeed); b.state = "Cruise"; b.ai = null;
      }
      return;
    }
    // abandoned: sit
    g.stepVehicle(v, dt, { throttle: 0, brake: 1, steer: 0, handbrake: true });
  }

  private abandon(v: Vehicle, b: TrafficBrain) {
    b.state = "Abandoned";
    v.hazard = true;
    const driver = v.crew[0] as Character | undefined;
    if (driver && v.driver === driver.id) {
      v.driver = null; v.crew = [];
      this.g.peds.adoptFromVehicle(driver, v, false);
    }
    v.role = "parked";
  }

  probeFrom(v: Vehicle, _x: number, _z: number, _dx: number, _dz: number) {
    return this.probe(v, 18, null).dist;
  }

  /** Called on gunfire/explosions near traffic. */
  panicNear(x: number, z: number, r: number) {
    for (const v of this.g.vehicles) {
      const b = this.brains.get(v.id);
      if (!b) continue;
      if (dist2(v.x, v.z, x, z) < r) {
        if (b.panic <= 0 && b.honkCd <= 0 && this.rng.chance(0.5)) { this.g.emit({ type: "horn", x: v.x, y: v.y, z: v.z, id: v.id }); b.honkCd = 4; }
        b.panic = 8;
      }
    }
  }

  stateOf(v: Vehicle) { return this.brains.get(v.id)?.state; }

  /** Cells overlapping current traffic (debug heat map). */
  heat(): Map<number, number> {
    const m = new Map<number, number>();
    for (const v of this.g.vehicles) {
      const k = Math.floor((v.x + 450) / CELL) + Math.floor((v.z + 450) / CELL) * 9;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }
}
