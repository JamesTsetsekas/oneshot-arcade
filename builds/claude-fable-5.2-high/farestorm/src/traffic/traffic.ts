// Lane-graph traffic. Agents follow lanes, obey signals, keep gaps, react to the taxi, and turn into
// free rigid bodies when struck before recovering to their lane or despawning out of sight.
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { PhysicsWorld, G_STATIC, G_TAXI, G_TRAFFIC, groups, DT } from '../physics/physicsWorld';
import { WorldModel, RoadEdge } from '../world/model';
import { Rng, V3, Quat, clamp, lerp, quatLookDir, distToSeg } from '../core/math';

const G_STRUCK = 0x0008;
const LANE_GROUPS = groups(G_TRAFFIC, G_TAXI | G_STRUCK);
const STRUCK_GROUPS = groups(G_TRAFFIC | G_STRUCK, G_TAXI | G_STATIC | G_TRAFFIC | G_STRUCK);

export interface Lane {
  id: number;
  edge: number;
  dir: number;
  idx: number;
  x0: number; z0: number; x1: number; z1: number;
  ux: number; uz: number;
  len: number;
  from: number; to: number;
  next: number[];
  speed: number;
  axisNS: boolean;
  narrow: boolean;
  tA: number; tB: number; // edge parameter at lane start/end
}

export interface VehicleType {
  name: string;
  half: V3;
  mass: number;
  speedMul: number;
  weight: number;
}
export const VEHICLE_TYPES: VehicleType[] = [
  { name: 'hatch', half: { x: 0.86, y: 0.68, z: 1.85 }, mass: 950, speedMul: 1.05, weight: 3 },
  { name: 'sedan', half: { x: 0.9, y: 0.66, z: 2.2 }, mass: 1250, speedMul: 1.0, weight: 3 },
  { name: 'van', half: { x: 1.0, y: 1.0, z: 2.5 }, mass: 2100, speedMul: 0.92, weight: 2 },
  { name: 'pickup', half: { x: 0.95, y: 0.78, z: 2.55 }, mass: 1750, speedMul: 0.97, weight: 2 },
  { name: 'tram-bus', half: { x: 1.25, y: 1.45, z: 5.3 }, mass: 6800, speedMul: 0.82, weight: 1 },
];
export const TRAFFIC_COLOR_COUNT = 6;

export type AgentState = 'lane' | 'cross' | 'struck' | 'recover';
export interface Agent {
  id: number;
  type: number;
  color: number;
  state: AgentState;
  lane: number;
  nextLane: number;
  s: number;
  speed: number;
  cruise: number;
  body: RAPIER_NS.RigidBody;
  collider: RAPIER_NS.Collider;
  x: number; y: number; z: number; q: Quat;
  px: number; py: number; pz: number; pq: Quat;
  // crossing bezier
  cx0: number; cz0: number; cx1: number; cz1: number; cx2: number; cz2: number; cy0: number; cy2: number;
  clen: number; ct: number;
  timer: number;
  nmCooldown: number;
  aheadPrev: number;
  cmd: V3;
  braking: boolean;
  hitByTaxi: boolean;
}

export type TrafficEvent =
  | { type: 'nearMiss'; agent: number; gap: number; oncoming: boolean }
  | { type: 'trafficHit'; agent: number; mass: number };

export interface TaxiProbe {
  pos: V3;
  vel: V3;
  speed: number;
  halfW: number;
}

const CYCLE = 22;
/** 0 = green, 1 = amber, 2 = red for the given approach axis at a signalised node. */
export function signalState(nodeId: number, axisNS: boolean, time: number): number {
  const t = (time + nodeId * 7.3) % CYCLE;
  const local = axisNS ? t : (t + CYCLE / 2) % CYCLE;
  if (local < 7) return 0;
  if (local < 9) return 1;
  return 2;
}

export const DENSITY_COUNTS = { low: 26, medium: 40, high: 54 } as const;
export type TrafficDensity = keyof typeof DENSITY_COUNTS | 'off';

export class Traffic {
  lanes: Lane[] = [];
  agents: Agent[] = [];
  events: TrafficEvent[] = [];
  time = 0;
  private rng: Rng;
  private laneWeights: number[] = [];
  private totalWeight = 0;
  private target: number;
  private laneAgents: Agent[][] = [];

  constructor(private phys: PhysicsWorld, private model: WorldModel, seed: number, density: TrafficDensity) {
    this.rng = new Rng(seed ^ 0x51ed270b);
    this.target = density === 'off' ? 0 : DENSITY_COUNTS[density];
    this.buildLanes();
  }

  private buildLanes(): void {
    const m = this.model;
    const byNodeEdge = new Map<string, number[]>(); // "node:edge" -> lanes leaving node along edge
    for (const e of m.edges) {
      for (const dir of [1, -1]) {
        const from = dir > 0 ? e.a : e.b, to = dir > 0 ? e.b : e.a;
        const nf = m.nodes[from], nt = m.nodes[to];
        const ux = e.dx * dir, uz = e.dz * dir;
        const usable = e.len - nf.clear - nt.clear;
        if (usable < 0.2) continue;
        e.info.laneOffsets.forEach((off, idx) => {
          const rx = uz, rz = -ux;
          const id = this.lanes.length;
          const x0 = nf.x + ux * nf.clear + rx * off, z0 = nf.z + uz * nf.clear + rz * off;
          const x1 = nt.x - ux * nt.clear + rx * off, z1 = nt.z - uz * nt.clear + rz * off;
          const tStart = nf.clear / e.len, tEnd = 1 - nt.clear / e.len;
          this.lanes.push({
            id, edge: e.id, dir, idx, x0, z0, x1, z1, ux, uz, len: usable, from, to, next: [], speed: e.info.speed,
            axisNS: Math.abs(uz) >= Math.abs(ux), narrow: e.cls === 'narrow',
            tA: dir > 0 ? tStart : 1 - tStart, tB: dir > 0 ? tEnd : 1 - tEnd,
          });
          const key = `${from}:${e.id}`;
          if (!byNodeEdge.has(key)) byNodeEdge.set(key, []);
          byNodeEdge.get(key)!.push(id);
        });
      }
    }
    for (const l of this.lanes) {
      const node = m.nodes[l.to];
      for (const eid of node.edges) {
        if (eid === l.edge) continue;
        const out = byNodeEdge.get(`${l.to}:${eid}`);
        if (out && out.length) l.next.push(out[Math.min(l.idx, out.length - 1)]);
      }
      const w = l.len * (l.narrow ? 0.3 : 1);
      this.laneWeights.push(w);
      this.totalWeight += w;
      this.laneAgents.push([]);
    }
  }

  private laneY(l: Lane, s: number, x: number, z: number): number {
    const e = this.model.edges[l.edge];
    return e.structure ? lerp(e.ya, e.yb, lerp(l.tA, l.tB, s / l.len)) : this.model.heightAt(x, z);
  }
  lanePoint(l: Lane, s: number): V3 {
    const x = l.x0 + l.ux * s, z = l.z0 + l.uz * s;
    return { x, y: this.laneY(l, s, x, z), z };
  }

  private pickLane(): Lane {
    let r = this.rng.next() * this.totalWeight;
    for (let i = 0; i < this.lanes.length; i++) { r -= this.laneWeights[i]; if (r <= 0) return this.lanes[i]; }
    return this.lanes[this.lanes.length - 1];
  }
  private pickNext(a: Agent, l: Lane): number {
    if (l.next.length === 0) return -1;
    const opts = a.type === 4 ? l.next.filter((n) => !this.lanes[n].narrow) : l.next;
    const pool = opts.length ? opts : l.next;
    // Prefer continuing straight.
    let best = pool[0], bestDot = -2;
    for (const n of pool) { const nl = this.lanes[n]; const d = nl.ux * l.ux + nl.uz * l.uz; if (d > bestDot) { bestDot = d; best = n; } }
    return this.rng.chance(0.55) ? best : this.rng.pick(pool);
  }

  /** Create the initial population around the taxi. */
  populate(taxi: V3): void {
    const R = this.phys.R;
    for (let i = 0; i < this.target; i++) {
      let ti = 0;
      let r = this.rng.next() * VEHICLE_TYPES.reduce((s, t) => s + t.weight, 0);
      for (let k = 0; k < VEHICLE_TYPES.length; k++) { r -= VEHICLE_TYPES[k].weight; if (r <= 0) { ti = k; break; } }
      const vt = VEHICLE_TYPES[ti];
      const body = this.phys.world.createRigidBody(R.RigidBodyDesc.dynamic().setCanSleep(false).setGravityScale(0).setAngularDamping(1.2).setLinearDamping(0.1));
      const collider = this.phys.world.createCollider(
        R.ColliderDesc.cuboid(vt.half.x, vt.half.y, vt.half.z).setMass(vt.mass).setFriction(0.5).setRestitution(0.15).setCollisionGroups(LANE_GROUPS), body,
      );
      const a: Agent = {
        id: i, type: ti, color: this.rng.int(TRAFFIC_COLOR_COUNT), state: 'lane', lane: 0, nextLane: -1, s: 0, speed: 0,
        cruise: this.rng.range(0.82, 1.16) * vt.speedMul, body, collider, x: 0, y: 0, z: 0, q: { x: 0, y: 0, z: 0, w: 1 },
        px: 0, py: 0, pz: 0, pq: { x: 0, y: 0, z: 0, w: 1 }, cx0: 0, cz0: 0, cx1: 0, cz1: 0, cx2: 0, cz2: 0, cy0: 0, cy2: 0, clen: 1, ct: 0,
        timer: 0, nmCooldown: 0, aheadPrev: 0, cmd: { x: 0, y: 0, z: 0 }, braking: false, hitByTaxi: false,
      };
      this.agents.push(a);
      this.place(a, taxi, 45, 320, null);
    }
  }

  /** Put an agent on a random lane within [minDist, maxDist] of the taxi (and out of its forward view when close). */
  private place(a: Agent, taxi: V3, minDist: number, maxDist: number, taxiFwd: V3 | null): void {
    for (let tries = 0; tries < 40; tries++) {
      const l = this.pickLane();
      if (a.type === 4 && l.narrow) continue;
      const s = this.rng.range(2, Math.max(2.5, l.len - 2));
      const p = this.lanePoint(l, s);
      const dx = p.x - taxi.x, dz = p.z - taxi.z;
      const d = Math.hypot(dx, dz);
      if (d < minDist || d > maxDist) continue;
      if (taxiFwd && d < 170 && dx * taxiFwd.x + dz * taxiFwd.z > 0) continue; // never pop in ahead of the taxi
      let clash = false;
      for (const o of this.agents) if (o !== a && o.lane === l.id && Math.abs(o.s - s) < 16) clash = true;
      if (clash) continue;
      a.lane = l.id; a.s = s; a.state = 'lane'; a.speed = l.speed * a.cruise * 0.8; a.nextLane = this.pickNext(a, l);
      const vt = VEHICLE_TYPES[a.type];
      a.x = p.x; a.y = p.y + vt.half.y + 0.28; a.z = p.z;
      a.q = quatLookDir({ x: l.ux, y: 0, z: l.uz });
      a.px = a.x; a.py = a.y; a.pz = a.z; a.pq = a.q;
      a.body.setTranslation({ x: a.x, y: a.y, z: a.z }, true);
      a.body.setRotation(a.q, true);
      a.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      a.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      a.body.setGravityScale(0, true);
      a.collider.setCollisionGroups(LANE_GROUPS);
      a.timer = 0; a.nmCooldown = 0; a.aheadPrev = 0; a.hitByTaxi = false;
      return;
    }
    // Could not find a slot: park far below the world until next attempt.
    a.state = 'recover'; a.timer = 0.5;
  }

  /** Advance lane logic and command body velocities. Call before PhysicsWorld.step(). */
  preStep(taxi: TaxiProbe): void {
    const dt = DT;
    this.time += dt;
    for (const arr of this.laneAgents) arr.length = 0;
    for (const a of this.agents) if (a.state === 'lane') this.laneAgents[a.lane].push(a);
    const tvx = taxi.vel.x, tvz = taxi.vel.z;
    const tFwd = taxi.speed > 2 ? { x: tvx / taxi.speed, y: 0, z: tvz / taxi.speed } : null;
    for (const a of this.agents) {
      a.px = a.x; a.py = a.y; a.pz = a.z; a.pq = a.q;
      a.nmCooldown = Math.max(0, a.nmCooldown - dt);
      const vt = VEHICLE_TYPES[a.type];
      const dTaxi = Math.hypot(a.x - taxi.pos.x, a.z - taxi.pos.z);
      if (a.state === 'struck') {
        a.timer -= dt;
        if (a.timer <= 0 || a.y < -4) {
          if (dTaxi > 60 || a.y < -4) this.place(a, taxi.pos, 130, 320, tFwd);
          else { a.state = 'recover'; a.timer = 1.4; this.snapToNearestLane(a); }
        }
        continue;
      }
      if (a.state === 'recover') {
        a.timer -= dt;
        if (a.lane < 0 || a.timer <= -3) { this.place(a, taxi.pos, 130, 320, tFwd); continue; }
        // Ease back onto the lane.
        const l = this.lanes[a.lane];
        const p = this.lanePoint(l, a.s);
        const k = 4;
        const tq = quatLookDir({ x: l.ux, y: 0, z: l.uz });
        a.cmd = { x: (p.x - a.x) * k, y: (p.y + vt.half.y + 0.28 - a.y) * k, z: (p.z - a.z) * k };
        a.body.setLinvel(a.cmd, true);
        a.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        const cur = a.body.rotation();
        const t = 0.12;
        const dotq = cur.x * tq.x + cur.y * tq.y + cur.z * tq.z + cur.w * tq.w;
        const sg = dotq < 0 ? -1 : 1;
        const nq = { x: cur.x + (tq.x * sg - cur.x) * t, y: cur.y + (tq.y * sg - cur.y) * t, z: cur.z + (tq.z * sg - cur.z) * t, w: cur.w + (tq.w * sg - cur.w) * t };
        const nl = Math.hypot(nq.x, nq.y, nq.z, nq.w);
        a.body.setRotation({ x: nq.x / nl, y: nq.y / nl, z: nq.z / nl, w: nq.w / nl }, true);
        if (a.timer <= 0 && Math.hypot(p.x - a.x, p.z - a.z) < 0.6) {
          a.state = 'lane'; a.speed = 0; a.body.setGravityScale(0, true); a.collider.setCollisionGroups(LANE_GROUPS);
          a.nextLane = this.pickNext(a, l);
        }
        continue;
      }
      if (dTaxi > 345) { this.place(a, taxi.pos, 130, 320, tFwd); continue; }

      let target: V3; let tangent: V3;
      if (a.state === 'lane') {
        const l = this.lanes[a.lane];
        let vWant = l.speed * a.cruise;
        let gap = Infinity;
        for (const o of this.laneAgents[a.lane]) {
          if (o === a || o.s <= a.s) continue;
          gap = Math.min(gap, o.s - a.s - VEHICLE_TYPES[o.type].half.z - vt.half.z);
        }
        const toEnd = l.len - a.s;
        const node = this.model.nodes[l.to];
        // Signals: stop at the line on red (amber if far enough to stop comfortably).
        if (node.signal && node.clear > 0) {
          const st = signalState(node.id, l.axisNS, this.time);
          if (st === 2 || (st === 1 && toEnd > 9)) gap = Math.min(gap, toEnd - vt.half.z - 0.5);
        }
        // Queue behind vehicles that already entered the next lane.
        if (a.nextLane >= 0 && toEnd < 30) {
          for (const o of this.laneAgents[a.nextLane]) gap = Math.min(gap, toEnd + this.model.nodes[l.to].clear * 1.4 + o.s - VEHICLE_TYPES[o.type].half.z - vt.half.z);
        }
        // React to the taxi if it is in our lane ahead and slower.
        const rx = taxi.pos.x - a.x, rz = taxi.pos.z - a.z;
        const along = rx * l.ux + rz * l.uz, lateral = Math.abs(rx * l.uz - rz * l.ux);
        if (along > 0 && along < 34 && lateral < 2.4 && Math.abs(taxi.pos.y - a.y) < 4) {
          const tAlong = tvx * l.ux + tvz * l.uz;
          if (tAlong < a.speed) gap = Math.min(gap, along - vt.half.z - 2.6);
        }
        if (gap < Infinity) vWant = Math.min(vWant, Math.sqrt(Math.max(0, 2 * 4.5 * (gap - 2.5))));
        if (toEnd < 14 && a.nextLane >= 0) {
          const nl = this.lanes[a.nextLane];
          if (nl.ux * l.ux + nl.uz * l.uz < 0.7) vWant = Math.min(vWant, 7.5); // slow for turns
        }
        const acc = clamp((vWant - a.speed) * 2.4, -9.5, 2.6);
        a.braking = acc < -1.5;
        a.speed = Math.max(0, a.speed + acc * dt);
        a.s += a.speed * dt;
        if (a.s >= l.len) {
          if (a.nextLane < 0) { this.place(a, taxi.pos, 130, 320, tFwd); continue; }
          const nl = this.lanes[a.nextLane];
          const chord = Math.hypot(nl.x0 - l.x1, nl.z0 - l.z1);
          if (chord < 0.8) { a.lane = nl.id; a.s = a.s - l.len; a.nextLane = this.pickNext(a, nl); }
          else {
            a.state = 'cross';
            a.cx0 = l.x1; a.cz0 = l.z1; a.cx2 = nl.x0; a.cz2 = nl.z0;
            // Control point: intersection of the two lane lines, or the chord midpoint when nearly parallel.
            const det = l.ux * nl.uz - l.uz * nl.ux;
            if (Math.abs(det) > 0.2) {
              const t = ((nl.x0 - l.x1) * nl.uz - (nl.z0 - l.z1) * nl.ux) / det;
              a.cx1 = l.x1 + l.ux * t; a.cz1 = l.z1 + l.uz * t;
            } else { a.cx1 = (l.x1 + nl.x0) / 2; a.cz1 = (l.z1 + nl.z0) / 2; }
            a.cy0 = this.laneY(l, l.len, l.x1, l.z1); a.cy2 = this.laneY(nl, 0, nl.x0, nl.z0);
            a.clen = Math.max(1, (chord + Math.hypot(a.cx1 - a.cx0, a.cz1 - a.cz0) + Math.hypot(a.cx2 - a.cx1, a.cz2 - a.cz1)) / 2);
            a.ct = 0;
          }
        }
      }
      if (a.state === 'cross') {
        a.speed = clamp(a.speed + 2 * dt, 4, 9.5);
        a.ct += (a.speed * dt) / a.clen;
        if (a.ct >= 1) {
          const nl = this.lanes[a.nextLane];
          a.state = 'lane'; a.lane = nl.id; a.s = 0; a.nextLane = this.pickNext(a, nl);
        }
      }
      if (a.state === 'lane') {
        const l = this.lanes[a.lane];
        target = this.lanePoint(l, a.s);
        const ahead = this.lanePoint(l, Math.min(l.len, a.s + 2));
        tangent = { x: l.ux, y: (ahead.y - target.y) / 2, z: l.uz };
      } else {
        const t = a.ct, u = 1 - t;
        const x = u * u * a.cx0 + 2 * u * t * a.cx1 + t * t * a.cx2, z = u * u * a.cz0 + 2 * u * t * a.cz1 + t * t * a.cz2;
        target = { x, y: lerp(a.cy0, a.cy2, t), z };
        tangent = { x: 2 * u * (a.cx1 - a.cx0) + 2 * t * (a.cx2 - a.cx1), y: 0, z: 2 * u * (a.cz1 - a.cz0) + 2 * t * (a.cz2 - a.cz1) };
        if (Math.hypot(tangent.x, tangent.z) < 1e-3) tangent = { x: this.lanes[a.nextLane].ux, y: 0, z: this.lanes[a.nextLane].uz };
      }
      target.y += vt.half.y + 0.28;
      a.cmd = { x: (target.x - a.x) / dt, y: (target.y - a.y) / dt, z: (target.z - a.z) / dt };
      const cl = Math.hypot(a.cmd.x, a.cmd.y, a.cmd.z);
      if (cl > 40) { a.cmd.x *= 40 / cl; a.cmd.y *= 40 / cl; a.cmd.z *= 40 / cl; }
      a.body.setLinvel(a.cmd, true);
      a.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      a.body.setRotation(quatLookDir(tangent), true);
    }
  }

  private snapToNearestLane(a: Agent): void {
    let best = -1, bd = Infinity, bs = 0;
    for (const l of this.lanes) {
      if (a.type === 4 && l.narrow) continue;
      const [d, t] = distToSeg(a.x, a.z, l.x0, l.z0, l.x1, l.z1);
      if (d < bd) {
        const e = this.model.edges[l.edge];
        const y = e.structure ? lerp(e.ya, e.yb, lerp(l.tA, l.tB, t)) : this.model.heightAt(a.x, a.z);
        if (Math.abs(y - a.y) > 6) continue;
        bd = d; best = l.id; bs = t * l.len;
      }
    }
    a.lane = bd < 40 ? best : -1;
    a.s = bs;
    a.body.setGravityScale(0, true);
  }

  /** Read back bodies, detect strikes and near misses. Call after PhysicsWorld.step(). */
  postStep(taxi: TaxiProbe): void {
    const tspeed = taxi.speed;
    const dirx = tspeed > 1 ? taxi.vel.x / tspeed : 0, dirz = tspeed > 1 ? taxi.vel.z / tspeed : 0;
    for (const a of this.agents) {
      const t = a.body.translation(), q = a.body.rotation();
      a.x = t.x; a.y = t.y; a.z = t.z;
      a.q = { x: q.x, y: q.y, z: q.z, w: q.w };
      const relx = a.x - taxi.pos.x, relz = a.z - taxi.pos.z;
      const d = Math.hypot(relx, relz);
      if (a.state === 'lane' || a.state === 'cross') {
        const v = a.body.linvel();
        const dv = Math.hypot(v.x - a.cmd.x, v.y - a.cmd.y, v.z - a.cmd.z);
        if (dv > 0.9) {
          let byTaxi = d < 9 + VEHICLE_TYPES[a.type].half.z;
          let cause = byTaxi;
          if (!cause) for (const o of this.agents) if (o !== a && o.state === 'struck' && Math.hypot(o.x - a.x, o.z - a.z) < 9) cause = true;
          if (cause) {
            a.state = 'struck'; a.timer = 2.4; a.hitByTaxi = byTaxi; a.nmCooldown = 6;
            a.body.setGravityScale(1, true);
            a.collider.setCollisionGroups(STRUCK_GROUPS);
            if (byTaxi) this.events.push({ type: 'trafficHit', agent: a.id, mass: VEHICLE_TYPES[a.type].mass });
            continue;
          }
        }
        // Near miss: the taxi passes the vehicle closely at speed.
        if (d < 16 && tspeed > 1) {
          const ahead = relx * dirx + relz * dirz;
          if (a.aheadPrev > 0 && ahead <= 0 && a.nmCooldown <= 0 && tspeed > 50 / 3.6 && Math.abs(a.y - taxi.pos.y) < 2.5) {
            const lateral = Math.abs(relx * dirz - relz * dirx);
            const vt = VEHICLE_TYPES[a.type];
            const fx = 2 * (a.q.x * a.q.z + a.q.w * a.q.y), fz = 1 - 2 * (a.q.x * a.q.x + a.q.y * a.q.y);
            const cosA = Math.abs(fx * dirx + fz * dirz);
            const halfAcross = vt.half.x * cosA + vt.half.z * Math.sqrt(Math.max(0, 1 - cosA * cosA));
            const gap = lateral - taxi.halfW - halfAcross;
            if (gap < 1.7) {
              a.nmCooldown = 5;
              const av = a.body.linvel();
              this.events.push({ type: 'nearMiss', agent: a.id, gap, oncoming: av.x * dirx + av.z * dirz < -2 });
            }
          }
          a.aheadPrev = ahead;
        } else a.aheadPrev = 0;
      }
    }
  }

  drainEvents(): TrafficEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
  /** Lane direction info for oncoming detection: lanes of an edge travelling in direction `dir`. */
  edgeOf(l: Lane): RoadEdge {
    return this.model.edges[l.edge];
  }
}
