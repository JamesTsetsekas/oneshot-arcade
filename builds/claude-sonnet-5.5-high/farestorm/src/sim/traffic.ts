/**
 * Lane-graph traffic. Agents follow right-hand lanes on the road grid, obey alternating signals,
 * brake for any vehicle (including the taxi) ahead of them, turn through intersections on bezier
 * arcs, become short-lived "wrecks" when struck, and respawn out of the player's sight.
 */
import { Rng } from './rng';
import { clamp, damp, dist, wrapAngle } from './math';
import type { World } from './world';

export const VEHICLE_TYPES = [
  { name: 'hatch', len: 3.8, wid: 1.75, mass: 950, weight: 0.3 },
  { name: 'sedan', len: 4.4, wid: 1.8, mass: 1250, weight: 0.35 },
  { name: 'van', len: 5.2, wid: 2.0, mass: 1900, weight: 0.15 },
  { name: 'truck', len: 7.2, wid: 2.4, mass: 5000, weight: 0.1 },
  { name: 'bus', len: 10.2, wid: 2.5, mass: 9000, weight: 0.1 },
];
export const TRAFFIC_COLORS = [0xf4efe6, 0x2f6bff, 0xff5e57, 0x19b3a6, 0xf2a93b, 0x7b8794, 0xa855f7, 0x7be0b0, 0xe8e0c8, 0x1f2a44];

export type AgentState = 'edge' | 'turn' | 'wreck';

export interface Agent {
  id: number;
  type: number;
  color: number;
  len: number;
  wid: number;
  mass: number;
  state: AgentState;
  from: number;
  to: number;
  s: number;
  turn: { p0x: number; p0z: number; p1x: number; p1z: number; p2x: number; p2z: number; len: number; t: number; to2: number; fromNode: number } | null;
  x: number;
  z: number;
  h: number;
  vx: number;
  vz: number;
  yaw: number;
  speed: number;
  v0: number;
  wait: number;
  shift: number;
  wreckTime: number;
  px: number;
  pz: number;
  ph: number;
  alive: boolean;
  fade: number; // 0..1 spawn/despawn fade (render)
  nearMissCd: number;
  honked: boolean;
}

export type TrafficEvent = { type: 'honk'; id: number } | { type: 'spawn'; id: number };

export function signalState(nodeId: number, axis: 'x' | 'z', t: number): 0 | 1 | 2 {
  const c = 14;
  const k = (t + nodeId * 2.3) % c;
  if (axis === 'x') return k < 5.5 ? 0 : k < 6.5 ? 1 : 2;
  const m = (k + 7) % c;
  return m < 5.5 ? 0 : m < 6.5 ? 1 : 2;
}

export class Traffic {
  agents: Agent[] = [];
  target = 44;
  private rng: Rng;
  private nextId = 1;
  time = 0;
  events: TrafficEvent[] = [];
  constructor(private world: World, seed: number, target = 44) {
    this.rng = new Rng(seed);
    this.target = target;
  }

  private crossHalf(node: number, axis: 'x' | 'z'): number {
    const n = this.world.nodes[node];
    // road crossing an edge that runs along `axis` has the other axis' width
    return (axis === 'x' ? this.world.wx[n.i] : this.world.wz[n.j]) / 2;
  }

  private edgeLen(a: number, b: number): number {
    const A = this.world.nodes[a], B = this.world.nodes[b];
    return Math.abs(A.x - B.x) + Math.abs(A.z - B.z);
  }

  private edgeAxis(a: number, b: number): 'x' | 'z' {
    return this.world.nodes[a].j === this.world.nodes[b].j ? 'x' : 'z';
  }

  private edgeWidth(a: number, b: number): number {
    const A = this.world.nodes[a];
    return this.edgeAxis(a, b) === 'x' ? this.world.wz[A.j] : this.world.wx[A.i];
  }

  /** place agent on an edge */
  private place(a: Agent): void {
    const A = this.world.nodes[a.from], B = this.world.nodes[a.to];
    const L = this.edgeLen(a.from, a.to);
    const dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
    const w = this.edgeWidth(a.from, a.to);
    const off = w / 4 + a.shift;
    a.x = A.x + dx * a.s + -dz * off;
    a.z = A.z + dz * a.s + dx * off;
    a.h = Math.atan2(dx, dz);
  }

  spawn(px: number, pz: number, pvx: number, pvz: number, minDist = 70, maxDist = 280): Agent | null {
    const w = this.world;
    for (let tries = 0; tries < 24; tries++) {
      const e = w.edges[this.rng.int(0, w.edges.length - 1)];
      const flip = this.rng.chance(0.5);
      const from = flip ? e.b : e.a, to = flip ? e.a : e.b;
      const ch = this.crossHalf(from, e.axis) + 4, ch2 = this.crossHalf(to, e.axis) + 8;
      if (e.len - ch - ch2 < 20) continue;
      const s = this.rng.range(ch, e.len - ch2);
      const probe = this.makeAgent(from, to, s);
      this.place(probe);
      const d = dist(probe.x, probe.z, px, pz);
      if (d < minDist || d > maxDist) continue;
      // never pop in front of the player's view cone
      const toX = probe.x - px, toZ = probe.z - pz;
      const sp = Math.hypot(pvx, pvz);
      if (sp > 2 && d < 130 && (toX * pvx + toZ * pvz) / (d * sp) > 0.35) continue;
      if (this.agents.some((o) => dist(o.x, o.z, probe.x, probe.z) < 16)) continue;
      probe.speed = probe.v0 * 0.8;
      this.agents.push(probe);
      this.events.push({ type: 'spawn', id: probe.id });
      return probe;
    }
    return null;
  }

  private makeAgent(from: number, to: number, s: number): Agent {
    const r = this.rng.next();
    let acc = 0, type = 1;
    for (let k = 0; k < VEHICLE_TYPES.length; k++) { acc += VEHICLE_TYPES[k].weight; if (r <= acc) { type = k; break; } }
    const vt = VEHICLE_TYPES[type];
    const boulevard = this.edgeWidth(from, to) >= 17;
    const base = type >= 3 ? 8.5 : 11;
    return {
      id: this.nextId++, type, color: this.rng.int(0, TRAFFIC_COLORS.length - 1), len: vt.len, wid: vt.wid, mass: vt.mass,
      state: 'edge', from, to, s, turn: null, x: 0, z: 0, h: 0, vx: 0, vz: 0, yaw: 0, speed: 0,
      v0: base + this.rng.range(-1.5, 3.5) + (boulevard ? 4 : 0), wait: 0, shift: 0, wreckTime: 0, px: 0, pz: 0, ph: 0, alive: true, fade: 0,
      nearMissCd: 0, honked: false,
    };
  }

  populate(px: number, pz: number): void {
    for (let i = 0; i < this.target * 3 && this.agents.length < this.target; i++) this.spawn(px, pz, 0, 0, 45, 330);
    for (const a of this.agents) { a.fade = 1; a.px = a.x; a.pz = a.z; a.ph = a.h; }
  }

  /** the lead obstacle (ahead in a narrow cone) as { gap, speed } */
  private leader(a: Agent, others: Agent[], player: { x: number; z: number; vx: number; vz: number; len: number }): { gap: number; speed: number; isPlayer: boolean } {
    const fx = Math.sin(a.h), fz = Math.cos(a.h);
    let gap = 1e9, speed = 0, isPlayer = false;
    const look = 8 + a.speed * 1.6;
    const consider = (ox: number, oz: number, ovx: number, ovz: number, olen: number, owid: number, pl: boolean) => {
      const dx = ox - a.x, dz = oz - a.z;
      const fd = dx * fx + dz * fz;
      if (fd <= 0.2 || fd > look + olen) return;
      const ld = Math.abs(dx * -fz + dz * fx);
      if (ld > (a.wid + owid) / 2 + 0.7) return;
      const g = fd - a.len / 2 - olen / 2;
      if (g < gap) { gap = g; speed = Math.max(0, ovx * fx + ovz * fz); isPlayer = pl; }
    };
    for (const o of others) {
      if (o === a || !o.alive) continue;
      const ovx = o.state === 'wreck' ? o.vx : Math.sin(o.h) * o.speed;
      const ovz = o.state === 'wreck' ? o.vz : Math.cos(o.h) * o.speed;
      consider(o.x, o.z, ovx, ovz, o.len, o.wid, false);
    }
    consider(player.x, player.z, player.vx, player.vz, player.len, 1.9, true);
    return { gap, speed, isPlayer };
  }

  update(dt: number, player: { x: number; z: number; vx: number; vz: number; len: number }): void {
    const w = this.world;
    this.time += dt;
    this.events.length = 0;
    for (const a of this.agents) { a.px = a.x; a.pz = a.z; a.ph = a.h; a.nearMissCd = Math.max(0, a.nearMissCd - dt); a.fade = Math.min(1, a.fade + dt * 2); }

    for (const a of this.agents) {
      if (!a.alive) continue;
      if (a.state === 'wreck') { this.updateWreck(a, dt); continue; }
      const ld = this.leader(a, this.agents, player);
      let target = a.v0;
      // signal stop line
      let stopGap = 1e9;
      if (a.state === 'edge') {
        const axis = this.edgeAxis(a.from, a.to);
        const L = this.edgeLen(a.from, a.to);
        const ch = this.crossHalf(a.to, axis);
        const stopS = L - ch - 3.2;
        const g = stopS - a.s;
        const sig = signalState(a.to, axis, this.time);
        if (g > -1 && g < 60 && (sig === 2 || (sig === 1 && g > a.speed * 1.4 + 3))) stopGap = g - a.len / 2 + 1.6;
        // slow for turns approaching an intersection
      }
      let gap = Math.min(ld.gap, stopGap);
      // deadlock breaker: after waiting a while, drift forward/creep and ignore the signal
      if (a.wait > 9 && ld.gap > 3.5) { gap = Math.min(ld.gap, 1e9); }
      if (a.wait > 4.5 && ld.isPlayer && ld.gap < 12 && !a.honked) { this.events.push({ type: 'honk', id: a.id }); a.honked = true; }
      if (gap < 1e8) {
        const follow = ld.gap <= stopGap ? ld.speed : 0;
        const safe = Math.sqrt(Math.max(0, follow * follow + 2 * 7 * Math.max(0, gap - 2.2)));
        target = Math.min(target, safe);
      }
      if (a.state === 'turn') target = Math.min(target, 7.5 + (a.type >= 3 ? -2 : 0));
      const acc = target > a.speed ? 3.2 : 11;
      a.speed += clamp(target - a.speed, -acc * dt, acc * dt);
      if (a.speed < 0.3 && gap < 6) a.wait += dt; else a.wait = Math.max(0, a.wait - dt * 2);
      if (a.wait > 4.5 && ld.isPlayer) a.shift = damp(a.shift, -3.1, 2.2, dt);
      else a.shift = damp(a.shift, 0, 1.6, dt);
      if (a.wait === 0) a.honked = false;

      if (a.state === 'edge') {
        a.s += a.speed * dt;
        const L = this.edgeLen(a.from, a.to);
        const axis = this.edgeAxis(a.from, a.to);
        const ch = this.crossHalf(a.to, axis);
        if (a.s >= L - ch - 0.5) this.beginTurn(a);
        else this.place(a);
      }
      if (a.state === 'turn') this.advanceTurn(a, dt);
    }

    // despawn far/old agents & refill
    const px = player.x, pz = player.z;
    for (const a of this.agents) {
      if (!a.alive) continue;
      const d = dist(a.x, a.z, px, pz);
      if (d > 360 && a.state !== 'wreck') a.alive = false;
      if (a.state === 'wreck' && (a.wreckTime > 6 || d > 300)) a.alive = false;
    }
    this.agents = this.agents.filter((a) => a.alive);
    let guard = 0;
    while (this.agents.length < this.target && guard++ < 2) {
      if (!this.spawn(px, pz, player.vx, player.vz)) break;
    }
    void w;
  }

  private beginTurn(a: Agent): void {
    const w = this.world;
    const B = w.nodes[a.to];
    const axis = this.edgeAxis(a.from, a.to);
    const A = w.nodes[a.from];
    const L = this.edgeLen(a.from, a.to);
    const d1x = (B.x - A.x) / L, d1z = (B.z - A.z) / L;
    // choose next node (no U-turns unless forced)
    const opts = w.adj[a.to].filter((n) => n !== a.from);
    const next = opts.length ? this.pickNext(opts, a, d1x, d1z) : a.from;
    const N = w.nodes[next];
    const L2 = this.edgeLen(a.to, next);
    const d2x = (N.x - B.x) / L2, d2z = (N.z - B.z) / L2;
    const axis2 = this.edgeAxis(a.to, next);
    const chIn = this.crossHalf(a.to, axis);
    const chOut = this.crossHalf(a.to, axis2);
    const wIn = this.edgeWidth(a.from, a.to) / 4, wOut = this.edgeWidth(a.to, next) / 4;
    const p0x = B.x - d1x * chIn + -d1z * wIn, p0z = B.z - d1z * chIn + d1x * wIn;
    const p2x = B.x + d2x * chOut + -d2z * wOut, p2z = B.z + d2z * chOut + d2x * wOut;
    let p1x: number, p1z: number;
    const dot = d1x * d2x + d1z * d2z;
    if (dot > 0.99) { p1x = (p0x + p2x) / 2; p1z = (p0z + p2z) / 2; }
    else if (dot < -0.99) { p1x = p0x + d1x * 6; p1z = p0z + d1z * 6; }
    else { const t = (p2x - p0x) * d1x + (p2z - p0z) * d1z; p1x = p0x + d1x * t; p1z = p0z + d1z * t; }
    const len = (Math.hypot(p1x - p0x, p1z - p0z) + Math.hypot(p2x - p1x, p2z - p1z)) * 0.5 + Math.hypot(p2x - p0x, p2z - p0z) * 0.5;
    a.state = 'turn';
    a.turn = { p0x, p0z, p1x, p1z, p2x, p2z, len, t: 0, to2: next, fromNode: a.to };
  }

  private pickNext(opts: number[], a: Agent, d1x: number, d1z: number): number {
    const w = this.world;
    const B = w.nodes[a.to];
    let best = opts[0], bw = -1;
    for (const n of opts) {
      const N = w.nodes[n];
      const L2 = this.edgeLen(a.to, n);
      const d2x = (N.x - B.x) / L2, d2z = (N.z - B.z) / L2;
      const dot = d1x * d2x + d1z * d2z;
      let wt = dot > 0.9 ? 3 : 1.4;
      wt *= 0.5 + this.rng.next();
      if (wt > bw) { bw = wt; best = n; }
    }
    return best;
  }

  private advanceTurn(a: Agent, dt: number): void {
    const t = a.turn!;
    t.t += (a.speed * dt) / Math.max(4, t.len);
    if (t.t >= 1) {
      a.state = 'edge';
      a.from = t.fromNode;
      a.to = t.to2;
      const axis = this.edgeAxis(a.from, a.to);
      a.s = this.crossHalf(a.from, axis) + 0.5;
      a.turn = null;
      this.place(a);
      return;
    }
    const u = t.t, v = 1 - u;
    a.x = v * v * t.p0x + 2 * v * u * t.p1x + u * u * t.p2x;
    a.z = v * v * t.p0z + 2 * v * u * t.p1z + u * u * t.p2z;
    const tx = 2 * v * (t.p1x - t.p0x) + 2 * u * (t.p2x - t.p1x);
    const tz = 2 * v * (t.p1z - t.p0z) + 2 * u * (t.p2z - t.p1z);
    if (Math.hypot(tx, tz) > 1e-4) a.h = Math.atan2(tx, tz);
  }

  /** a struck vehicle becomes a free body for a few seconds */
  strike(a: Agent, ivx: number, ivz: number): void {
    if (a.state !== 'wreck') {
      const sp = a.speed;
      a.vx = Math.sin(a.h) * sp;
      a.vz = Math.cos(a.h) * sp;
      a.state = 'wreck';
      a.wreckTime = 0;
      a.turn = null;
      a.speed = 0;
    }
    a.vx += ivx;
    a.vz += ivz;
  }

  private updateWreck(a: Agent, dt: number): void {
    a.wreckTime += dt;
    const sp = Math.hypot(a.vx, a.vz);
    const fr = sp > 0.01 ? Math.max(0, 1 - (7.5 * dt) / sp) : 0;
    a.vx *= fr; a.vz *= fr;
    a.x += a.vx * dt; a.z += a.vz * dt;
    a.yaw = damp(a.yaw, 0, 2.5, dt);
    a.h = wrapAngle(a.h + a.yaw * dt);
    const hit = this.world.hitTest(a.x, a.z, Math.min(a.len, 5) / 2);
    if (hit) {
      a.x += hit.nx * hit.pen; a.z += hit.nz * hit.pen;
      const vn = a.vx * hit.nx + a.vz * hit.nz;
      if (vn < 0) { a.vx -= 1.3 * vn * hit.nx; a.vz -= 1.3 * vn * hit.nz; }
    }
  }
}
