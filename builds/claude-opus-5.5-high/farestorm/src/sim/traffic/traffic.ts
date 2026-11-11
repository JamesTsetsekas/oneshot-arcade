// Lane-graph traffic: signals, following, lane changes, turning, horn reactions, knock + recovery,
// and spawn/despawn around the player that avoids popping into view.

import { clamp, dist, wrapAngle } from "../math";
import { Rng } from "../rng";
import type { World } from "../world/city";
import type { RoadEdge } from "../world/types";
import { obbOverlap } from "../vehicle/vehicle";

export interface TrafficType {
  id: string;
  len: number;
  wid: number;
  height: number;
  mass: number;
  speedMul: number;
}

export const TRAFFIC_TYPES: TrafficType[] = [
  { id: "compact", len: 3.7, wid: 1.7, height: 1.45, mass: 1000, speedMul: 1.02 },
  { id: "hatch", len: 4.1, wid: 1.78, height: 1.5, mass: 1150, speedMul: 1.0 },
  { id: "sedan", len: 4.6, wid: 1.85, height: 1.42, mass: 1400, speedMul: 1.05 },
  { id: "wagon", len: 4.8, wid: 1.88, height: 1.55, mass: 1500, speedMul: 0.98 },
  { id: "van", len: 5.2, wid: 2.0, height: 2.2, mass: 2200, speedMul: 0.92 },
  { id: "pickup", len: 5.3, wid: 2.0, height: 1.8, mass: 2100, speedMul: 0.96 },
  { id: "bus", len: 11, wid: 2.5, height: 3.1, mass: 9000, speedMul: 0.82 },
  { id: "truck", len: 8, wid: 2.4, height: 3.0, mass: 7000, speedMul: 0.85 },
];
export const TRAFFIC_COLORS = [
  "#f4f1e6", "#e63946", "#2a9d8f", "#264653", "#f4a261", "#8ecae6", "#ffb703", "#6d597a", "#b5e48c", "#ff7096",
  "#3a86ff", "#adb5bd", "#1b263b",
];

export type AgentMode = "lane" | "turn" | "knocked" | "recover";

export interface Agent {
  id: number;
  active: boolean;
  type: number;
  color: number;
  mode: AgentMode;
  edge: number;
  dir: 1 | -1;
  lane: number;
  s: number;
  laneLen: number;
  // turn bezier
  tx0: number; tz0: number; tx1: number; tz1: number; tx2: number; tz2: number; tLen: number; tT: number;
  nextEdge: number; nextDir: 1 | -1; nextLane: number;
  x: number; z: number; y: number; yaw: number;
  px: number; pz: number; pyaw: number; py: number;
  speed: number;
  profile: number;
  vx: number; vz: number; yawRate: number;
  knockTime: number;
  rx: number; rz: number; ryaw: number; rT: number;
  offset: number; offsetTarget: number; swerveTime: number;
  laneChangeCooldown: number;
  wait: number;
  ghost: number;
  braking: boolean;
  // style detector scratch (owned by session)
  nearArmed: boolean; nearCooldown: number; nearMin: number; nearTouched: boolean;
}

const PHASE = 22;
export function signalState(world: World, node: number, axis: 0 | 1, time: number): "green" | "yellow" | "red" {
  const n = world.nodes[node];
  if (!n.signal) return "green";
  const t = (time + n.signalOffset) % PHASE;
  if (axis === 0) return t < 9 ? "green" : t < 11 ? "yellow" : "red";
  return t >= 11 && t < 20 ? "green" : t >= 20 ? "yellow" : "red";
}

export class Traffic {
  agents: Agent[] = [];
  private rng: Rng;
  private junction: number[];
  target = 40;
  time = 0;
  private spawnCooldown = 0;

  constructor(private world: World, seed: number, max = 60) {
    this.rng = new Rng(seed);
    this.junction = world.nodes.map((n) => {
      let m = 0;
      for (const e of n.edges) m = Math.max(m, world.edges[e].halfWidth);
      return m + 3;
    });
    for (let i = 0; i < max; i++) this.agents.push(this.blank(i));
  }

  private blank(id: number): Agent {
    return {
      id, active: false, type: 0, color: 0, mode: "lane", edge: 0, dir: 1, lane: 0, s: 0, laneLen: 1,
      tx0: 0, tz0: 0, tx1: 0, tz1: 0, tx2: 0, tz2: 0, tLen: 1, tT: 0, nextEdge: 0, nextDir: 1, nextLane: 0,
      x: 0, z: 0, y: 0, yaw: 0, px: 0, pz: 0, pyaw: 0, py: 0, speed: 0, profile: 1, vx: 0, vz: 0, yawRate: 0, knockTime: 0,
      rx: 0, rz: 0, ryaw: 0, rT: 0, offset: 0, offsetTarget: 0, swerveTime: 0, laneChangeCooldown: 0, wait: 0, ghost: 0, braking: false,
      nearArmed: false, nearCooldown: 0, nearMin: 99, nearTouched: false,
    };
  }

  // ------------------------------------------------------------ lane geometry
  laneStart(e: RoadEdge, dir: 1 | -1): number {
    return this.junction[dir > 0 ? e.a : e.b];
  }
  lanePoint(e: RoadEdge, dir: 1 | -1, lane: number, s: number, offset = 0): [number, number, number] {
    const S = this.world.nodes[dir > 0 ? e.a : e.b];
    const dx = e.dx * dir, dz = e.dz * dir;
    const along = this.laneStart(e, dir) + s;
    const lat = (lane + 0.5) * e.laneWidth + offset;
    return [S.x + dx * along + dz * lat, S.z + dz * along - dx * lat, Math.atan2(dx, dz)];
  }
  laneLength(e: RoadEdge, dir: 1 | -1): number {
    return Math.max(2, e.length - this.junction[e.a] - this.junction[e.b]);
  }

  private place(a: Agent, edge: RoadEdge, dir: 1 | -1, lane: number, s: number) {
    a.mode = "lane";
    a.edge = edge.id;
    a.dir = dir;
    a.lane = Math.min(lane, edge.lanes - 1);
    a.laneLen = this.laneLength(edge, dir);
    a.s = clamp(s, 0, a.laneLen);
    a.offset = 0;
    a.offsetTarget = 0;
    const [x, z, yaw] = this.lanePoint(edge, dir, a.lane, a.s);
    a.x = a.px = x;
    a.z = a.pz = z;
    a.yaw = a.pyaw = yaw;
    a.y = a.py = this.world.heightAt(x, z);
    a.speed = edge.speed * a.profile * TRAFFIC_TYPES[a.type].speedMul * 0.8;
  }

  // ------------------------------------------------------------ spawn
  private trySpawn(px: number, pz: number, pyaw: number, initial: boolean): boolean {
    const a = this.agents.find((g) => !g.active);
    if (!a) return false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const e = this.world.edges[this.rng.int(0, this.world.edges.length)];
      const dir: 1 | -1 = this.rng.chance(0.5) ? 1 : -1;
      const lane = this.rng.int(0, e.lanes);
      const len = this.laneLength(e, dir);
      const s = this.rng.range(0, len);
      const [x, z] = this.lanePoint(e, dir, lane, s);
      const d = dist(x, z, px, pz);
      const minD = initial ? 45 : 140;
      if (d < minD || d > 300) continue;
      const fx = Math.sin(pyaw), fz = Math.cos(pyaw);
      const dot = ((x - px) * fx + (z - pz) * fz) / d;
      if (!initial && d < 230 && dot > -0.2) continue; // never pop into view
      if (initial && d < 120 && dot > 0.5) continue;
      let clear = true;
      for (const o of this.agents) if (o.active && dist(o.x, o.z, x, z) < 16) { clear = false; break; }
      if (!clear) continue;
      const r = this.rng.next();
      a.type = r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.6 ? 2 : r < 0.72 ? 3 : r < 0.82 ? 4 : r < 0.9 ? 5 : r < 0.95 ? 6 : 7;
      if (e.kind === "cobble" && a.type >= 6) a.type = 1;
      a.color = this.rng.int(0, TRAFFIC_COLORS.length);
      a.profile = this.rng.range(0.85, 1.12);
      a.active = true;
      a.wait = 0;
      a.ghost = 0;
      a.knockTime = 0;
      a.nearArmed = false;
      a.nearCooldown = 0;
      a.nearTouched = false;
      a.swerveTime = 0;
      this.place(a, e, dir, lane, s);
      return true;
    }
    return false;
  }

  fill(px: number, pz: number, pyaw: number) {
    for (let i = 0; i < this.target * 3 && this.activeCount() < this.target; i++) this.trySpawn(px, pz, pyaw, true);
  }

  activeCount(): number {
    let n = 0;
    for (const a of this.agents) if (a.active) n++;
    return n;
  }

  // ------------------------------------------------------------ step
  step(dt: number, player: { x: number; z: number; yaw: number; vx: number; vz: number; len: number; wid: number; horn: boolean }) {
    this.time += dt;
    // despawn far agents
    for (const a of this.agents) {
      if (!a.active) continue;
      const d = dist(a.x, a.z, player.x, player.z);
      if (d > 330 || (a.mode === "knocked" && a.knockTime > 12 && d > 60)) a.active = false;
    }
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0 && this.activeCount() < this.target) {
      this.trySpawn(player.x, player.z, player.yaw, false);
      this.spawnCooldown = 0.12;
    }
    const pfx = Math.sin(player.yaw), pfz = Math.cos(player.yaw);
    for (const a of this.agents) {
      if (!a.active) continue;
      a.px = a.x; a.pz = a.z; a.pyaw = a.yaw; a.py = a.y;
      if (a.nearCooldown > 0) a.nearCooldown -= dt;
      if (a.laneChangeCooldown > 0) a.laneChangeCooldown -= dt;
      if (player.horn) {
        const rx = a.x - player.x, rz = a.z - player.z;
        const along = rx * pfx + rz * pfz;
        const lat = rx * pfz - rz * pfx;
        if (along > 0 && along < 32 && Math.abs(lat) < 4 && (a.mode === "lane" || a.mode === "turn")) {
          a.swerveTime = 2.5;
        }
      }
      if (a.mode === "knocked") this.stepKnocked(a, dt);
      else if (a.mode === "recover") this.stepRecover(a, dt);
      else this.stepDriving(a, dt, player);
      a.y = this.world.heightAt(a.x, a.z);
    }
  }

  private leaderGap(a: Agent, player: { x: number; z: number; len: number; vx: number; vz: number }): number {
    const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    const T = TRAFFIC_TYPES[a.type];
    let gap = 1e9;
    if (a.ghost > 0) return gap;
    for (const o of this.agents) {
      if (!o.active || o === a) continue;
      const rx = o.x - a.x, rz = o.z - a.z;
      const along = rx * fx + rz * fz;
      if (along <= 0 || along > 36) continue;
      const lat = Math.abs(rx * fz - rz * fx);
      const ow = TRAFFIC_TYPES[o.type];
      if (lat > (T.wid + ow.wid) / 2 + 0.5) continue;
      const hd = Math.cos(wrapAngle(o.yaw - a.yaw));
      if (hd < 0.2 && o.mode !== "knocked" && along > 12) continue; // oncoming in other lane
      const g = along - (T.len + ow.len) / 2;
      if (g < gap) gap = g;
    }
    // the player taxi
    const rx = player.x - a.x, rz = player.z - a.z;
    const along = rx * fx + rz * fz;
    if (along > 0 && along < 30) {
      const lat = Math.abs(rx * fz - rz * fx);
      if (lat < T.wid / 2 + 1.6) {
        const g = along - (T.len + player.len) / 2;
        if (g < gap) gap = g;
      }
    }
    return gap;
  }

  private stepDriving(a: Agent, dt: number, player: { x: number; z: number; len: number; vx: number; vz: number; yaw: number }) {
    const e = this.world.edges[a.edge];
    const T = TRAFFIC_TYPES[a.type];
    let target = e.speed * a.profile * T.speedMul;
    if (a.mode === "turn") target = Math.min(target, 8.5);
    if (a.swerveTime > 0) {
      a.swerveTime -= dt;
      a.offsetTarget = e.lanes > 1 && a.lane === 0 ? 0 : 1.2;
      target *= 1.12;
    } else if (a.mode === "lane" && Math.abs(a.offsetTarget) > 0 && Math.abs(a.offsetTarget) < 2) a.offsetTarget = 0;

    // signal stop line
    if (a.mode === "lane") {
      const endNode = a.dir > 0 ? e.b : e.a;
      const sig = signalState(this.world, endNode, e.axis, this.time);
      const toStop = a.laneLen - a.s - 1;
      if (sig !== "green") {
        const need = (a.speed * a.speed) / (2 * 5);
        if (sig === "red" || toStop > need * 0.6 + 2) {
          const vStop = Math.sqrt(Math.max(0, 2 * 4.5 * Math.max(0, toStop)));
          target = Math.min(target, vStop);
        }
      }
    }
    const gap = this.leaderGap(a, player);
    if (gap < 40) target = Math.min(target, Math.max(0, (gap - 2.5) * 0.9));
    a.braking = target < a.speed - 0.5;
    const accel = target > a.speed ? 2.6 : 9;
    a.speed += clamp(target - a.speed, -accel * dt, accel * dt);
    if (a.speed < 0.3) a.wait += dt;
    else a.wait = Math.max(0, a.wait - dt);
    // deadlock breaker: if stuck a long time and not at a red light, ghost through for a moment
    if (a.wait > 5 && a.ghost <= 0) {
      a.ghost = 1.8;
      a.wait = 0;
    }
    if (a.ghost > 0) a.ghost -= dt;

    // lane change on multi-lane roads when blocked
    if (a.mode === "lane" && e.lanes > 1 && gap < 14 && a.speed < target + 1 && a.laneChangeCooldown <= 0 && a.s < a.laneLen - 30) {
      a.lane = a.lane === 0 ? 1 : 0;
      a.offset += (a.lane === 1 ? -1 : 1) * e.laneWidth; // keep position continuous, blend toward new lane
      a.laneChangeCooldown = 6;
    }
    a.offset += clamp(a.offsetTarget - a.offset, -1.6 * dt, 1.6 * dt);

    if (a.mode === "lane") {
      a.s += a.speed * dt;
      if (a.s >= a.laneLen) {
        this.beginTurn(a);
      } else {
        const [x, z, yaw] = this.lanePoint(e, a.dir, a.lane, a.s, a.offset);
        a.x = x; a.z = z; a.yaw = yaw;
      }
    }
    if (a.mode === "turn") {
      a.tT += (a.speed * dt) / a.tLen;
      if (a.tT >= 1) {
        const ne = this.world.edges[a.nextEdge];
        a.mode = "lane";
        a.edge = ne.id;
        a.dir = a.nextDir;
        a.lane = a.nextLane;
        a.laneLen = this.laneLength(ne, a.dir);
        a.s = 0;
        const [x, z, yaw] = this.lanePoint(ne, a.dir, a.lane, 0, a.offset);
        a.x = x; a.z = z; a.yaw = yaw;
      } else {
        const t = a.tT, u = 1 - t;
        a.x = u * u * a.tx0 + 2 * u * t * a.tx1 + t * t * a.tx2;
        a.z = u * u * a.tz0 + 2 * u * t * a.tz1 + t * t * a.tz2;
        const dx = 2 * u * (a.tx1 - a.tx0) + 2 * t * (a.tx2 - a.tx1);
        const dz = 2 * u * (a.tz1 - a.tz0) + 2 * t * (a.tz2 - a.tz1);
        a.yaw = Math.atan2(dx, dz);
      }
    }
  }

  private beginTurn(a: Agent) {
    const e = this.world.edges[a.edge];
    const node = a.dir > 0 ? e.b : e.a;
    const n = this.world.nodes[node];
    let options = n.edges.filter((id) => id !== e.id);
    if (options.length === 0) options = [e.id];
    const nextId = options[this.rng.int(0, options.length)];
    const ne = this.world.edges[nextId];
    const nextDir: 1 | -1 = ne.a === node ? 1 : -1;
    const nextLane = Math.min(a.lane, ne.lanes - 1);
    const [x0, z0] = this.lanePoint(e, a.dir, a.lane, a.laneLen, a.offset);
    const [x2, z2] = this.lanePoint(ne, nextDir, nextLane, 0, 0);
    const d0x = e.dx * a.dir, d0z = e.dz * a.dir;
    const d2x = ne.dx * nextDir, d2z = ne.dz * nextDir;
    // control point = intersection of the two lane lines
    const den = d0x * d2z - d0z * d2x;
    let cx = (x0 + x2) / 2, cz = (z0 + z2) / 2;
    if (Math.abs(den) > 0.2) {
      const t = ((x2 - x0) * d2z - (z2 - z0) * d2x) / den;
      cx = x0 + d0x * t;
      cz = z0 + d0z * t;
    }
    a.tx0 = x0; a.tz0 = z0; a.tx1 = cx; a.tz1 = cz; a.tx2 = x2; a.tz2 = z2;
    a.tLen = Math.max(1, (dist(x0, z0, cx, cz) + dist(cx, cz, x2, z2) + dist(x0, z0, x2, z2)) / 2);
    a.tT = 0;
    a.nextEdge = nextId;
    a.nextDir = nextDir;
    a.nextLane = nextLane;
    a.mode = "turn";
    a.offsetTarget = 0;
  }

  /** Apply a collision impulse from the player. Returns nothing; agent switches to knocked mode. */
  knock(a: Agent, dvx: number, dvz: number, spin: number) {
    if (a.mode !== "knocked") {
      a.vx = Math.sin(a.yaw) * a.speed;
      a.vz = Math.cos(a.yaw) * a.speed;
      a.yawRate = 0;
    }
    a.mode = "knocked";
    a.knockTime = 0;
    a.vx += dvx;
    a.vz += dvz;
    a.yawRate = clamp(a.yawRate + spin, -2.5, 2.5);
  }

  private scratch: import("../world/types").Collider[] = [];
  private ov = { depth: 0, nx: 0, nz: 0, sep: 0 };

  private stepKnocked(a: Agent, dt: number) {
    a.knockTime += dt;
    const sp = Math.hypot(a.vx, a.vz);
    if (sp > 0) {
      const ns = Math.max(0, sp - 7 * dt);
      a.vx *= ns / sp;
      a.vz *= ns / sp;
    }
    a.yawRate *= Math.exp(-2.5 * dt);
    a.x += a.vx * dt;
    a.z += a.vz * dt;
    a.yaw = wrapAngle(a.yaw + a.yawRate * dt);
    const T = TRAFFIC_TYPES[a.type];
    this.world.collidersNear(a.x, a.z, this.scratch);
    for (const c of this.scratch) {
      const y = this.world.heightAt(a.x, a.z);
      if (y + 0.3 > c.maxY || y + T.height < c.minY) continue;
      if (obbOverlap(a.x, a.z, T.wid / 2, T.len / 2, a.yaw, c.cx, c.cz, c.hx, c.hz, c.yaw, this.ov)) {
        a.x += this.ov.nx * this.ov.depth;
        a.z += this.ov.nz * this.ov.depth;
        const vn = a.vx * this.ov.nx + a.vz * this.ov.nz;
        if (vn < 0) {
          a.vx -= 1.3 * vn * this.ov.nx;
          a.vz -= 1.3 * vn * this.ov.nz;
        }
      }
    }
    if (a.knockTime > 1.4 && Math.hypot(a.vx, a.vz) < 1.2) {
      const ne = this.world.nearestEdge(a.x, a.z);
      if (!ne || ne.dist > 18) {
        a.knockTime = Math.max(a.knockTime, 12); // stranded: despawn when out of sight
        return;
      }
      const e = ne.edge;
      const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
      const dir: 1 | -1 = fx * e.dx + fz * e.dz >= 0 ? 1 : -1;
      const len = this.laneLength(e, dir);
      const sAlong = dir > 0 ? ne.t * e.length - this.junction[e.a] : (1 - ne.t) * e.length - this.junction[e.b];
      a.mode = "recover";
      a.rx = a.x; a.rz = a.z; a.ryaw = a.yaw; a.rT = 0;
      a.edge = e.id;
      a.dir = dir;
      a.lane = 0;
      a.laneLen = len;
      a.s = clamp(sAlong, 0, len - 1);
      a.speed = 0;
      a.offset = 0;
      a.offsetTarget = 0;
    }
  }

  private stepRecover(a: Agent, dt: number) {
    a.rT += dt / 1.5;
    const e = this.world.edges[a.edge];
    const [x, z, yaw] = this.lanePoint(e, a.dir, a.lane, a.s);
    const t = clamp(a.rT, 0, 1);
    const k = t * t * (3 - 2 * t);
    a.x = a.rx + (x - a.rx) * k;
    a.z = a.rz + (z - a.rz) * k;
    a.yaw = a.ryaw + wrapAngle(yaw - a.ryaw) * k;
    if (a.rT >= 1) {
      a.mode = "lane";
      a.speed = 2;
    }
  }
}
