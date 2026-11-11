// Baked navigation graph generated from map collision (walkability-tested grid),
// plus A* with danger/heat costs. Used only by server-side bots.
import { CollisionWorld } from "../shared/collision";
import { fits, groundHeight } from "../shared/movement";
import { MOVE } from "../content/tuning";
import { Vec3 } from "../shared/math";

export interface NavNode { id: number; pos: Vec3; crouch: boolean; outdoor: boolean; cover: number; edges: { to: number; cost: number; crouch: boolean }[] }
export interface NavGraph { nodes: NavNode[]; cell: number; index: Map<number, number[]> }

const NAV_R = 0.3;
const cache = new Map<string, NavGraph>();

export function walkable(world: CollisionWorld, a: Vec3, b: Vec3): { ok: boolean; crouch: boolean } {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(d / 0.25));
  let y = a.y;
  let crouch = false;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    const floor = groundHeight(world, x, y + MOVE.stepHeight, z, MOVE.stepHeight * 2 + 0.05, 0, NAV_R);
    if (!isFinite(floor) || Math.abs(floor - y) > MOVE.stepHeight) return { ok: false, crouch };
    y = floor;
    if (!fits(world, x, y, z, MOVE.crouchHeight, NAV_R)) return { ok: false, crouch };
    if (!fits(world, x, y, z, MOVE.standHeight, NAV_R)) crouch = true;
  }
  return { ok: Math.abs(y - b.y) < 0.2, crouch };
}

export function buildNav(world: CollisionWorld, key: string, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }): NavGraph {
  const hit = cache.get(key);
  if (hit) return hit;
  const cell = 2.0;
  const nodes: NavNode[] = [];
  const index = new Map<number, number[]>();
  const k = (cx: number, cz: number) => (cx + 500) * 1000 + (cz + 500);
  const nx = Math.floor((bounds.maxX - bounds.minX) / cell), nz = Math.floor((bounds.maxZ - bounds.minZ) / cell);
  const offsets = [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6]];
  for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
    const cx = bounds.minX + (ix + 0.5) * cell, cz = bounds.minZ + (iz + 0.5) * cell;
    // candidate floor heights in column
    const tops = new Set<number>();
    for (const b of world.query(cx - 1, cz - 1, cx + 1, cz + 1, [])) {
      if (b.clip) continue;
      tops.add(Math.round(b.max.y * 1000) / 1000);
    }
    const list: number[] = [];
    for (const top of tops) {
      if (top < -4 || top > 9) continue;
      for (const [ox, oz] of offsets) {
        const x = cx + ox, z = cz + oz;
        const g = groundHeight(world, x, top + 0.01, z, 0.05, 0.01, NAV_R);
        if (!isFinite(g) || Math.abs(g - top) > 0.02) continue;
        if (!fits(world, x, top, z, MOVE.crouchHeight, NAV_R + 0.05)) continue;
        const crouch = !fits(world, x, top, z, MOVE.standHeight, NAV_R);
        const id = nodes.length;
        nodes.push({ id, pos: { x, y: top, z }, crouch, outdoor: !world.hasRoof({ x, y: top, z }), cover: 0, edges: [] });
        list.push(id);
        break;
      }
    }
    if (list.length) index.set(k(ix, iz), list);
  }
  // edges to 8-neighbours (both directions tested)
  for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
    const here = index.get(k(ix, iz));
    if (!here) continue;
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const there = index.get(k(ix + dx, iz + dz));
      if (!there) continue;
      for (const a of here) for (const b of there) {
        const A = nodes[a], Bn = nodes[b];
        if (Math.abs(A.pos.y - Bn.pos.y) > 1.6) continue;
        const w1 = walkable(world, A.pos, Bn.pos);
        if (!w1.ok) continue;
        const w2 = walkable(world, Bn.pos, A.pos);
        if (!w2.ok) continue;
        const d = Math.hypot(A.pos.x - Bn.pos.x, A.pos.y - Bn.pos.y, A.pos.z - Bn.pos.z);
        const crouch = w1.crouch || w2.crouch;
        const cost = d * (crouch ? 2 : 1);
        A.edges.push({ to: b, cost, crouch });
        Bn.edges.push({ to: a, cost, crouch });
      }
    }
  }
  // cover score: blocked directions at chest height
  for (const n of nodes) {
    let c = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const h = world.raycast({ x: n.pos.x, y: n.pos.y + 1.0, z: n.pos.z }, { x: dx, y: 0, z: dz }, 1.6);
      if (h) c++;
    }
    n.cover = c;
  }
  // prune isolated islands: keep largest connected component
  const comp = new Array(nodes.length).fill(-1);
  let best = -1, bestSize = 0, ci = 0;
  for (const n of nodes) {
    if (comp[n.id] !== -1) continue;
    const stack = [n.id]; comp[n.id] = ci; let size = 0;
    while (stack.length) { const c = stack.pop()!; size++; for (const e of nodes[c].edges) if (comp[e.to] === -1) { comp[e.to] = ci; stack.push(e.to); } }
    if (size > bestSize) { bestSize = size; best = ci; }
    ci++;
  }
  for (const n of nodes) if (comp[n.id] !== best) n.edges = [];
  const g: NavGraph = { nodes: nodes.map((n) => n), cell, index };
  (g as NavGraph & { main: number[] }).main = nodes.filter((n) => comp[n.id] === best).map((n) => n.id);
  cache.set(key, g);
  return g;
}

export function mainNodes(g: NavGraph): number[] { return (g as NavGraph & { main: number[] }).main; }

export function nearestNode(g: NavGraph, p: Vec3, maxD = 6): number {
  let best = -1, bd = Infinity;
  const cx = Math.floor((p.x + 57.5) / g.cell), cz = Math.floor((p.z + 47.5) / g.cell);
  for (let r = 0; r <= 3; r++) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const list = g.index.get((cx + dx + 500) * 1000 + (cz + dz + 500));
      if (!list) continue;
      for (const id of list) {
        const n = g.nodes[id];
        if (n.edges.length === 0) continue;
        const d = Math.hypot(n.pos.x - p.x, (n.pos.y - p.y) * 2.5, n.pos.z - p.z);
        if (d < bd) { bd = d; best = id; }
      }
    }
    if (best >= 0 && r >= 1) break;
  }
  return bd <= maxD ? best : best;
}

class Heap { a: { id: number; f: number }[] = [];
  push(id: number, f: number) { const a = this.a; a.push({ id, f }); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop(): number { const a = this.a; const top = a[0]; const last = a.pop()!; if (a.length) { a[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top.id; }
  get size() { return this.a.length; } }

/** A* returning node ids. extraCost lets bots avoid heat/danger. */
export function findPath(g: NavGraph, from: number, to: number, extraCost?: (n: NavNode) => number): number[] | null {
  if (from < 0 || to < 0) return null;
  if (from === to) return [from];
  const gS = new Map<number, number>(), came = new Map<number, number>();
  const goal = g.nodes[to].pos;
  const h = (id: number) => { const p = g.nodes[id].pos; return Math.hypot(p.x - goal.x, p.y - goal.y, p.z - goal.z); };
  const open = new Heap();
  gS.set(from, 0); open.push(from, h(from));
  const closed = new Set<number>();
  let iter = 0;
  while (open.size && iter++ < 8000) {
    const c = open.pop();
    if (c === to) {
      const path = [c]; let cur = c;
      while (came.has(cur)) { cur = came.get(cur)!; path.push(cur); }
      return path.reverse();
    }
    if (closed.has(c)) continue;
    closed.add(c);
    const gc = gS.get(c)!;
    for (const e of g.nodes[c].edges) {
      if (closed.has(e.to)) continue;
      const ng = gc + e.cost + (extraCost ? extraCost(g.nodes[e.to]) : 0);
      if (ng < (gS.get(e.to) ?? Infinity)) { gS.set(e.to, ng); came.set(e.to, c); open.push(e.to, ng + h(e.to)); }
    }
  }
  return null;
}
