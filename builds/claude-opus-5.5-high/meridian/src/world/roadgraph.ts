// Road lane graph, traffic signals, GPS routing and the pedestrian sidewalk graph.
// Always loaded; small enough (81 intersections) that queries run on the main thread
// well under budget (A* < 0.1 ms), so worker offload is deferred (see report).

import {
  X_LINES, Z_LINES, LANE_W, SIDEWALK, hasEdgeEW, hasEdgeNS, xHalfW, zHalfW, xLanes, zLanes,
} from "./district";
import { dist2, segT } from "../core/math";
import type { StaticWorld } from "./collision";

export type Axis = "ns" | "ew";

export interface RNode {
  id: number; i: number; j: number; x: number; z: number;
  signal: boolean;
  /** half width of the N-S road and E-W road through this node */
  hwNS: number; hwEW: number;
  out: number[]; // lane ids leaving
  inc: number[]; // lane ids arriving
  nbrs: { node: number; len: number; edge: number }[];
}

export interface REdge { id: number; a: number; b: number; axis: Axis; lanes: number; hw: number; arterial: boolean }

export interface Lane {
  id: number; edge: number; from: number; to: number; axis: Axis;
  dx: number; dz: number; idx: number; count: number;
  x0: number; z0: number; x1: number; z1: number; length: number; speed: number;
}

export interface Poly { pts: number[]; cum: number[]; length: number }

export function makePoly(pts: number[]): Poly {
  const cum = [0];
  for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + dist2(pts[i - 2], pts[i - 1], pts[i], pts[i + 1]));
  return { pts, cum, length: cum[cum.length - 1] };
}

export function polyAt(p: Poly, s: number, out: { x: number; z: number; dx: number; dz: number }) {
  const n = p.cum.length;
  if (s <= 0) s = 0;
  if (s >= p.length) s = p.length - 1e-6;
  let k = 1;
  while (k < n - 1 && p.cum[k] < s) k++;
  const s0 = p.cum[k - 1], s1 = p.cum[k];
  const t = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
  const ax = p.pts[(k - 1) * 2], az = p.pts[(k - 1) * 2 + 1], bx = p.pts[k * 2], bz = p.pts[k * 2 + 1];
  out.x = ax + (bx - ax) * t; out.z = az + (bz - az) * t;
  const l = Math.hypot(bx - ax, bz - az) || 1;
  out.dx = (bx - ax) / l; out.dz = (bz - az) / l;
  return out;
}

export type Turn = "left" | "right" | "straight";

export interface PedNode { id: number; x: number; z: number; edges: PedEdge[]; poi?: string }
export interface PedEdge { to: number; len: number; cross?: { node: number; axis: Axis } }

export const SIGNAL_CYCLE = 34;

export class RoadGraph {
  nodes: RNode[] = [];
  edges: REdge[] = [];
  lanes: Lane[] = [];
  ped: PedNode[] = [];
  private nodeAt = new Map<string, number>();
  private pedKey = new Map<string, number>();
  overrides = new Map<number, { axis: Axis; until: number }>();

  constructor() {
    for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
      const has = hasEdgeNS(i, j) || hasEdgeNS(i, j - 1) || hasEdgeEW(i, j) || hasEdgeEW(i - 1, j);
      if (!has) continue;
      const id = this.nodes.length;
      const nsArms = (hasEdgeNS(i, j) ? 1 : 0) + (hasEdgeNS(i, j - 1) ? 1 : 0);
      const ewArms = (hasEdgeEW(i, j) ? 1 : 0) + (hasEdgeEW(i - 1, j) ? 1 : 0);
      this.nodes.push({
        id, i, j, x: X_LINES[i], z: Z_LINES[j], signal: nsArms + ewArms >= 3,
        hwNS: nsArms ? xHalfW(i) : 0, hwEW: ewArms ? zHalfW(j) : 0, out: [], inc: [], nbrs: [],
      });
      this.nodeAt.set(`${i},${j}`, id);
    }
    const addEdge = (a: number, b: number, axis: Axis, lanes: number, hw: number) => {
      const e: REdge = { id: this.edges.length, a, b, axis, lanes, hw, arterial: lanes > 1 };
      this.edges.push(e);
      const A = this.nodes[a], B = this.nodes[b];
      const len = dist2(A.x, A.z, B.x, B.z);
      A.nbrs.push({ node: b, len, edge: e.id });
      B.nbrs.push({ node: a, len, edge: e.id });
      for (const [from, to] of [[a, b], [b, a]] as const) {
        const F = this.nodes[from], T = this.nodes[to];
        const dx = (T.x - F.x) / len, dz = (T.z - F.z) / len;
        const rx = dz, rz = -dx;
        const crossF = axis === "ns" ? F.hwEW : F.hwNS;
        const crossT = axis === "ns" ? T.hwEW : T.hwNS;
        for (let k = 0; k < lanes; k++) {
          const off = (k + 0.5) * LANE_W;
          const s0 = crossF + 3.2, s1 = crossT + 3.2;
          const lane: Lane = {
            id: this.lanes.length, edge: e.id, from, to, axis, dx, dz, idx: k, count: lanes,
            x0: F.x + dx * s0 + rx * off, z0: F.z + dz * s0 + rz * off,
            x1: T.x - dx * s1 + rx * off, z1: T.z - dz * s1 + rz * off,
            length: len - s0 - s1, speed: lanes > 1 ? 15 : 11.5,
          };
          this.lanes.push(lane);
          F.out.push(lane.id); T.inc.push(lane.id);
        }
      }
    };
    for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) if (hasEdgeNS(i, j)) {
      addEdge(this.nodeAt.get(`${i},${j}`)!, this.nodeAt.get(`${i},${j + 1}`)!, "ns", xLanes(i), xHalfW(i));
    }
    for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) if (hasEdgeEW(i, j)) {
      addEdge(this.nodeAt.get(`${i},${j}`)!, this.nodeAt.get(`${i + 1},${j}`)!, "ew", zLanes(j), zHalfW(j));
    }
    this.buildPedGraph();
  }

  node(i: number, j: number) { const id = this.nodeAt.get(`${i},${j}`); return id === undefined ? undefined : this.nodes[id]; }

  // ------------------------------------------------------------ signals

  /** Returns "green" | "yellow" | "red" for traffic travelling along `axis` at node. */
  signal(nodeId: number, axis: Axis, t: number): "green" | "yellow" | "red" {
    const n = this.nodes[nodeId];
    if (!n.signal) return "green";
    const ov = this.overrides.get(nodeId);
    if (ov && ov.until > t) return ov.axis === axis ? "green" : "red";
    const ph = (t + (n.i * 4 + n.j * 6)) % SIGNAL_CYCLE;
    if (axis === "ns") return ph < 13 ? "green" : ph < 16 ? "yellow" : "red";
    return ph >= 17 && ph < 30 ? "green" : ph >= 30 && ph < 33 ? "yellow" : "red";
  }

  /** Pedestrians crossing *over* a road of `roadAxis` may walk when the parallel (other) axis is green. */
  pedWalk(nodeId: number, roadAxis: Axis, t: number): boolean {
    const n = this.nodes[nodeId];
    if (!n.signal) return true;
    const parallel: Axis = roadAxis === "ns" ? "ew" : "ns";
    const ov = this.overrides.get(nodeId);
    if (ov && ov.until > t) return ov.axis === parallel;
    const ph = (t + (n.i * 4 + n.j * 6)) % SIGNAL_CYCLE;
    return parallel === "ns" ? ph < 9 : ph >= 17 && ph < 26;
  }

  /** Narrow mission API: request a green phase for an axis at a node (clamped to 20 s). */
  requestPhase(nodeId: number, axis: Axis, now: number, duration: number) {
    this.overrides.set(nodeId, { axis, until: now + Math.min(20, Math.max(1, duration)) });
  }

  // ------------------------------------------------------------ lanes / turns

  turnOf(a: Lane, b: Lane): Turn {
    const c = a.dx * b.dz - a.dz * b.dx;
    if (Math.abs(c) < 0.3) return "straight";
    return c < 0 ? "right" : "left";
  }

  /** Candidate next lanes when leaving lane `l` (no U-turns unless dead end). */
  nextLanes(l: Lane): Lane[] {
    const n = this.nodes[l.to];
    const res: Lane[] = [];
    for (const id of n.out) {
      const m = this.lanes[id];
      if (m.to === l.from && n.out.length > l.count) continue;
      const t = this.turnOf(l, m);
      if (t === "right" && l.idx !== l.count - 1) continue;
      if (t === "right" && m.idx !== m.count - 1) continue;
      if (t === "left" && l.idx !== 0) continue;
      if (t === "left" && m.idx !== 0) continue;
      if (t === "straight" && Math.min(l.idx, m.count - 1) !== m.idx) continue;
      if (dist2(l.x1, l.z1, m.x0, m.z0) < 1) continue;
      res.push(m);
    }
    return res;
  }

  connector(a: Lane, b: Lane): Poly {
    const p0x = a.x1, p0z = a.z1, p2x = b.x0, p2z = b.z0;
    let p1x = (p0x + p2x) / 2, p1z = (p0z + p2z) / 2;
    const den = a.dx * b.dz - a.dz * b.dx;
    if (Math.abs(den) > 0.3) {
      const t = ((p2x - p0x) * b.dz - (p2z - p0z) * b.dx) / den;
      p1x = p0x + a.dx * t; p1z = p0z + a.dz * t;
    }
    const pts: number[] = [];
    const N = 8;
    for (let k = 0; k <= N; k++) {
      const t = k / N, u = 1 - t;
      pts.push(u * u * p0x + 2 * u * t * p1x + t * t * p2x, u * u * p0z + 2 * u * t * p1z + t * t * p2z);
    }
    return makePoly(pts);
  }

  lanePoly(l: Lane): Poly { return makePoly([l.x0, l.z0, l.x1, l.z1]); }

  /** Nearest lane & distance along it. */
  nearestLane(x: number, z: number, headingX?: number, headingZ?: number, maxDist = 30): { lane: Lane; s: number; d: number } | null {
    let best: { lane: Lane; s: number; d: number } | null = null;
    for (const l of this.lanes) {
      if (headingX !== undefined && headingZ !== undefined && l.dx * headingX + l.dz * headingZ < 0.3) continue;
      const t = segT(x, z, l.x0, l.z0, l.x1, l.z1);
      const px = l.x0 + (l.x1 - l.x0) * t, pz = l.z0 + (l.z1 - l.z0) * t;
      const d = dist2(x, z, px, pz);
      if (d < maxDist && (!best || d < best.d)) best = { lane: l, s: t * l.length, d };
    }
    return best;
  }

  nearestNode(x: number, z: number): RNode {
    let best = this.nodes[0], bd = Infinity;
    for (const n of this.nodes) {
      const d = dist2(x, z, n.x, n.z);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  /** Closest point on any road centerline (for GPS projection). */
  nearestRoadPoint(x: number, z: number) {
    let best = { x, z, d: Infinity, edge: -1 };
    for (const e of this.edges) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      const t = segT(x, z, A.x, A.z, B.x, B.z);
      const px = A.x + (B.x - A.x) * t, pz = A.z + (B.z - A.z) * t;
      const d = dist2(x, z, px, pz);
      if (d < best.d) best = { x: px, z: pz, d, edge: e.id };
    }
    return best;
  }

  /** A* over intersections. Returns node id list. */
  route(fromNode: number, toNode: number): number[] {
    if (fromNode === toNode) return [fromNode];
    const N = this.nodes.length;
    const g = new Float64Array(N).fill(Infinity);
    const f = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const T = this.nodes[toNode];
    g[fromNode] = 0;
    f[fromNode] = dist2(this.nodes[fromNode].x, this.nodes[fromNode].z, T.x, T.z);
    const open = [fromNode];
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const cur = open.splice(bi, 1)[0];
      if (cur === toNode) break;
      closed[cur] = 1;
      for (const nb of this.nodes[cur].nbrs) {
        if (closed[nb.node]) continue;
        const e = this.edges[nb.edge];
        const cost = nb.len * (e.arterial ? 0.85 : 1);
        const ng = g[cur] + cost;
        if (ng < g[nb.node]) {
          g[nb.node] = ng;
          prev[nb.node] = cur;
          f[nb.node] = ng + dist2(this.nodes[nb.node].x, this.nodes[nb.node].z, T.x, T.z) * 0.85;
          if (!open.includes(nb.node)) open.push(nb.node);
        }
      }
    }
    if (prev[toNode] === -1) return [];
    const path = [toNode];
    let c = toNode;
    while (c !== fromNode) { c = prev[c]; path.push(c); }
    return path.reverse();
  }

  /** GPS polyline from a world position to a target position following roads. */
  gpsRoute(sx: number, sz: number, tx: number, tz: number): number[] {
    const sp = this.nearestRoadPoint(sx, sz);
    const tp = this.nearestRoadPoint(tx, tz);
    const se = this.edges[sp.edge], te = this.edges[tp.edge];
    // choose best endpoints of start/end edges
    let bestPath: number[] = [], bestLen = Infinity;
    for (const a of [se.a, se.b]) for (const b of [te.a, te.b]) {
      const p = this.route(a, b);
      if (!p.length) continue;
      let L = dist2(sp.x, sp.z, this.nodes[a].x, this.nodes[a].z) + dist2(tp.x, tp.z, this.nodes[b].x, this.nodes[b].z);
      for (let k = 1; k < p.length; k++) L += dist2(this.nodes[p[k - 1]].x, this.nodes[p[k - 1]].z, this.nodes[p[k]].x, this.nodes[p[k]].z);
      if (L < bestLen) { bestLen = L; bestPath = p; }
    }
    const pts = [sx, sz, sp.x, sp.z];
    if (se.id === te.id) { pts.push(tp.x, tp.z, tx, tz); return pts; }
    for (const id of bestPath) pts.push(this.nodes[id].x, this.nodes[id].z);
    pts.push(tp.x, tp.z, tx, tz);
    return pts;
  }

  // ------------------------------------------------------------ pedestrian graph

  private pedNode(x: number, z: number, poi?: string): number {
    const k = `${Math.round(x * 2)},${Math.round(z * 2)}`;
    const ex = this.pedKey.get(k);
    if (ex !== undefined) return ex;
    const id = this.ped.length;
    this.ped.push({ id, x, z, edges: [], poi });
    this.pedKey.set(k, id);
    return id;
  }
  private pedLink(a: number, b: number, cross?: { node: number; axis: Axis }) {
    if (a === b) return;
    const A = this.ped[a], B = this.ped[b];
    if (A.edges.some((e) => e.to === b)) return;
    const len = dist2(A.x, A.z, B.x, B.z);
    A.edges.push({ to: b, len, cross });
    B.edges.push({ to: a, len, cross });
  }

  private buildPedGraph() {
    const sw = SIDEWALK / 2;
    const strip = (ax: number, az: number, bx: number, bz: number) => {
      // subdivide long strips so spawn points/route choices are dense
      const L = dist2(ax, az, bx, bz);
      const n = Math.max(1, Math.round(L / 25));
      let prev = this.pedNode(ax, az);
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const id = this.pedNode(ax + (bx - ax) * t, az + (bz - az) * t);
        this.pedLink(prev, id);
        prev = id;
      }
    };
    for (const e of this.edges) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      for (const s of [-1, 1]) {
        if (e.axis === "ns") {
          const x = A.x + s * (e.hw + sw);
          const armA = s > 0 ? hasEdgeEW(A.i, A.j) : hasEdgeEW(A.i - 1, A.j);
          const armB = s > 0 ? hasEdgeEW(B.i, B.j) : hasEdgeEW(B.i - 1, B.j);
          const za = A.z + (armA ? A.hwEW + sw : 0), zb = B.z - (armB ? B.hwEW + sw : 0);
          strip(x, za, x, zb);
        } else {
          const z = A.z + s * (e.hw + sw);
          const armA = s > 0 ? hasEdgeNS(A.i, A.j) : hasEdgeNS(A.i, A.j - 1);
          const armB = s > 0 ? hasEdgeNS(B.i, B.j) : hasEdgeNS(B.i, B.j - 1);
          const xa = A.x + (armA ? A.hwNS + sw : 0), xb = B.x - (armB ? B.hwNS + sw : 0);
          strip(xa, z, xb, z);
        }
      }
    }
    // crosswalks at each intersection arm
    for (const n of this.nodes) {
      const arms: [boolean, Axis, number][] = [
        [hasEdgeNS(n.i, n.j), "ns", 1], [hasEdgeNS(n.i, n.j - 1), "ns", -1],
        [hasEdgeEW(n.i, n.j), "ew", 1], [hasEdgeEW(n.i - 1, n.j), "ew", -1],
      ];
      for (const [has, axis, s] of arms) {
        if (!has) continue;
        if (axis === "ns") {
          const z = n.z + s * (n.hwEW + sw);
          const xl = n.x - (n.hwNS + sw), xr = n.x + (n.hwNS + sw);
          const a = this.findPed(xl, z, 0.8), b = this.findPed(xr, z, 0.8);
          if (a !== -1 && b !== -1) this.pedLink(a, b, { node: n.id, axis: "ns" });
        } else {
          const x = n.x + s * (n.hwNS + sw);
          const zb = n.z - (n.hwEW + sw), zt = n.z + (n.hwEW + sw);
          const a = this.findPed(x, zb, 0.8), b = this.findPed(x, zt, 0.8);
          if (a !== -1 && b !== -1) this.pedLink(a, b, { node: n.id, axis: "ew" });
        }
      }
    }
  }

  findPed(x: number, z: number, tol: number): number {
    let best = -1, bd = tol;
    for (const p of this.ped) {
      const d = dist2(x, z, p.x, p.z);
      if (d <= bd) { bd = d; best = p.id; }
    }
    return best;
  }

  nearestPed(x: number, z: number): number {
    let best = 0, bd = Infinity;
    for (const p of this.ped) {
      const d = (x - p.x) ** 2 + (z - p.z) ** 2;
      if (d < bd) { bd = d; best = p.id; }
    }
    return best;
  }

  /** Add a point of interest connected to nearby ped nodes if line of sight is clear. */
  addPoi(x: number, z: number, poi: string, world: StaticWorld, radius = 30): number {
    const id = this.pedNode(x, z, poi);
    this.ped[id].poi = poi;
    const cands = this.ped.filter((p) => p.id !== id && dist2(p.x, p.z, x, z) < radius)
      .sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z)).slice(0, 3);
    for (const c of cands) {
      if (world.raycast(x, 1, z, c.x - x, 0, c.z - z, 1)) continue;
      this.pedLink(id, c.id);
    }
    return id;
  }

  pedRoute(from: number, to: number): number[] {
    if (from === to) return [from];
    const N = this.ped.length;
    const g = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const T = this.ped[to];
    g[from] = 0;
    const open: number[] = [from];
    const f = new Float64Array(N).fill(Infinity);
    f[from] = dist2(this.ped[from].x, this.ped[from].z, T.x, T.z);
    let iter = 0;
    while (open.length && iter++ < 4000) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const cur = open.splice(bi, 1)[0];
      if (cur === to) break;
      closed[cur] = 1;
      for (const e of this.ped[cur].edges) {
        if (closed[e.to]) continue;
        const ng = g[cur] + e.len + (e.cross ? 6 : 0);
        if (ng < g[e.to]) {
          g[e.to] = ng; prev[e.to] = cur;
          f[e.to] = ng + dist2(this.ped[e.to].x, this.ped[e.to].z, T.x, T.z);
          if (!open.includes(e.to)) open.push(e.to);
        }
      }
    }
    if (prev[to] === -1) return [];
    const path = [to];
    let c = to;
    while (c !== from) { c = prev[c]; path.push(c); }
    return path.reverse();
  }
}
