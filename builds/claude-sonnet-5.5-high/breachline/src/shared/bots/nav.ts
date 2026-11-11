// Navigation graph baked from the collision world (lattice nodes + swept-body edges), A* pathing, and hold-angle interest nodes.
import { CollisionWorld } from "../sim/collision";
import type { Vec3 } from "../math";

export interface NavNode {
  id: number;
  x: number;
  z: number;
  links: number[];
  costs: number[];
  coverScore: number; // number of blocked neighbours (cover adjacency)
  bestYaw: number; // longest open view direction
  bestLen: number;
  indoor: boolean;
}

export interface NavGraph {
  nodes: NavNode[];
  lattice: Int32Array; // index by lattice cell -> node id or -1
  minX: number; minZ: number; step: number; w: number; h: number;
  nearest(x: number, z: number): number;
}

const STEP = 2;
const MIN_X = -56, MAX_X = 56, MIN_Z = -36, MAX_Z = 38;
const NODE_HALF = 0.42;
const cache = new WeakMap<object, NavGraph>();

/** Swept-walk test: body of half-width hw can walk straight from a to b on flat ground. */
export function walkClear(col: CollisionWorld, ax: number, az: number, bx: number, bz: number, hw = 0.4): boolean {
  const d = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(d / 0.4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (col.blocked(ax + (bx - ax) * t, 0.05, az + (bz - az) * t, hw, 1.8)) return false;
  }
  return true;
}

export function getNav(col: CollisionWorld): NavGraph {
  const hit = cache.get(col.map);
  if (hit) return hit;
  const nav = buildNav(col);
  cache.set(col.map, nav);
  return nav;
}

function buildNav(col: CollisionWorld): NavGraph {
  const w = (MAX_X - MIN_X) / STEP + 1;
  const h = (MAX_Z - MIN_Z) / STEP + 1;
  const lattice = new Int32Array(w * h).fill(-1);
  const nodes: NavNode[] = [];
  for (let iz = 0; iz < h; iz++) for (let ix = 0; ix < w; ix++) {
    const x = MIN_X + ix * STEP, z = MIN_Z + iz * STEP;
    if (col.blocked(x, 0.05, z, NODE_HALF, 1.8)) continue;
    if (z < -36.5 || z > 38.5) continue;
    lattice[iz * w + ix] = nodes.length;
    nodes.push({ id: nodes.length, x, z, links: [], costs: [], coverScore: 0, bestYaw: 0, bestLen: 0, indoor: col.map.indoorAt(x, z) });
  }
  for (const n of nodes) {
    const ix = Math.round((n.x - MIN_X) / STEP), iz = Math.round((n.z - MIN_Z) / STEP);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const jx = ix + dx, jz = iz + dz;
      if (jx < 0 || jz < 0 || jx >= w || jz >= h) continue;
      const m = lattice[jz * w + jx];
      if (m < 0) continue;
      const o = nodes[m];
      if (!walkClear(col, n.x, n.z, o.x, o.z, 0.4)) continue;
      n.links.push(m);
      n.costs.push(Math.hypot(dx, dz) * STEP);
    }
    // cover adjacency + best view direction
    let cs = 0;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      if (col.blocked(n.x + Math.sin(a) * 1.3, 0.05, n.z + Math.cos(a) * 1.3, 0.2, 1.2)) cs++;
    }
    n.coverScore = cs;
    let bestLen = 0, bestYaw = 0;
    const o: Vec3 = { x: n.x, y: 1.6, z: n.z };
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const d = { x: Math.sin(a), y: 0, z: Math.cos(a) };
      const r = col.raycast(o, d, 60, true);
      const len = r ? r.t : 60;
      if (len > bestLen) { bestLen = len; bestYaw = a; }
    }
    n.bestLen = bestLen; n.bestYaw = bestYaw;
  }
  const nearest = (x: number, z: number): number => {
    const ix = Math.round((x - MIN_X) / STEP), iz = Math.round((z - MIN_Z) / STEP);
    let best = -1, bd = Infinity;
    for (let r = 0; r <= 4 && best < 0; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const jx = ix + dx, jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= w || jz >= h) continue;
        const m = lattice[jz * w + jx];
        if (m < 0) continue;
        const d = Math.hypot(nodes[m].x - x, nodes[m].z - z);
        if (d < bd) { bd = d; best = m; }
      }
    }
    return best;
  };
  return { nodes, lattice, minX: MIN_X, minZ: MIN_Z, step: STEP, w, h, nearest };
}

/** A* over the nav graph. `extraCost(node)` lets bots avoid heat (recent deaths) and add route diversity. */
export function findPath(nav: NavGraph, from: number, to: number, extraCost?: (n: NavNode) => number): number[] | null {
  if (from < 0 || to < 0) return null;
  if (from === to) return [from];
  const n = nav.nodes.length;
  const g = new Float32Array(n).fill(Infinity);
  const f = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const goal = nav.nodes[to];
  // simple binary heap
  const heap: number[] = [];
  const push = (id: number) => {
    heap.push(id);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (f[heap[p]] <= f[heap[i]]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l;
        if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  g[from] = 0;
  f[from] = Math.hypot(nav.nodes[from].x - goal.x, nav.nodes[from].z - goal.z);
  push(from);
  while (heap.length) {
    const cur = pop();
    if (closed[cur]) continue;
    if (cur === to) {
      const path: number[] = [];
      let c = to;
      while (c !== -1) { path.push(c); c = came[c]; }
      return path.reverse();
    }
    closed[cur] = 1;
    const nd = nav.nodes[cur];
    for (let k = 0; k < nd.links.length; k++) {
      const m = nd.links[k];
      if (closed[m]) continue;
      const mn = nav.nodes[m];
      const ng = g[cur] + nd.costs[k] + (extraCost ? extraCost(mn) : 0);
      if (ng < g[m]) {
        g[m] = ng;
        came[m] = cur;
        f[m] = ng + Math.hypot(mn.x - goal.x, mn.z - goal.z);
        push(m);
      }
    }
  }
  return null;
}

export function pathLength(nav: NavGraph, path: number[]): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += Math.hypot(nav.nodes[path[i]].x - nav.nodes[path[i - 1]].x, nav.nodes[path[i]].z - nav.nodes[path[i - 1]].z);
  return d;
}
