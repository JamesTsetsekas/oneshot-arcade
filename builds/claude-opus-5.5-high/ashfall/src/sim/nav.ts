import type { Vec2 } from "../core/math";

export interface NavGrid { w: number; h: number; cells: Uint8Array }

export function isOpen(g: NavGrid, cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= g.w || cy >= g.h) return false;
  const c = g.cells[cy * g.w + cx];
  return c === 1 || c === 2;
}

export function openAt(g: NavGrid, x: number, y: number): boolean {
  return isOpen(g, Math.floor(x), Math.floor(y));
}

/** Clearance-aware point test: a circle of radius r centered at (x,y) only overlaps open cells. */
export function circleFree(g: NavGrid, x: number, y: number, r: number): boolean {
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  for (let cy = y0; cy <= y1; cy++)
    for (let cx = x0; cx <= x1; cx++) {
      if (isOpen(g, cx, cy)) continue;
      // closest point of cell to circle center
      const nx = Math.max(cx, Math.min(x, cx + 1)), ny = Math.max(cy, Math.min(y, cy + 1));
      if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < r * r) return false;
    }
  return true;
}

/** Line of sight with a radius buffer: samples along the segment. */
export function lineClear(g: NavGrid, ax: number, ay: number, bx: number, by: number, r = 0): boolean {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / 0.35));
  const nx = d > 0 ? -(by - ay) / d : 0, ny = d > 0 ? (bx - ax) / d : 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    if (!openAt(g, x, y)) return false;
    if (r > 0 && (!openAt(g, x + nx * r, y + ny * r) || !openAt(g, x - nx * r, y - ny * r))) return false;
  }
  return true;
}

/** Nearest open cell center to (x,y) by BFS ring search within maxR. */
export function nearestOpen(g: NavGrid, x: number, y: number, maxR = 8): Vec2 | null {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (isOpen(g, cx, cy)) return { x, y };
  let best: Vec2 | null = null, bestD = Infinity;
  for (let r = 1; r <= maxR; r++) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!isOpen(g, cx + dx, cy + dy)) continue;
        const px = cx + dx + 0.5, py = cy + dy + 0.5;
        const dd = (px - x) ** 2 + (py - y) ** 2;
        if (dd < bestD) { bestD = dd; best = { x: px, y: py }; }
      }
    if (best) return best;
  }
  return null;
}

// Binary heap for A*
class Heap {
  ids: number[] = [];
  f: Float64Array;
  constructor(n: number) { this.f = new Float64Array(n); }
  push(id: number, f: number) {
    this.f[id] = f;
    const a = this.ids; a.push(id);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[a[p]] <= this.f[a[i]]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop(): number {
    const a = this.ids; const top = a[0]; const last = a.pop()!;
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < a.length && this.f[a[l]] < this.f[a[m]]) m = l;
        if (r < a.length && this.f[a[r]] < this.f[a[m]]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.ids.length; }
}

let scratchG: Float64Array | null = null;
let scratchFrom: Int32Array | null = null;
let scratchStamp: Uint32Array | null = null;
let stamp = 1;

/** 8-directional A* without corner cutting, then string-pulled. Returns waypoints (excluding start) or null. */
export function findPath(g: NavGrid, sx: number, sy: number, tx: number, ty: number, maxNodes = 12000, clearance = 0.35): Vec2[] | null {
  const n = g.w * g.h;
  if (!scratchG || scratchG.length < n) { scratchG = new Float64Array(n); scratchFrom = new Int32Array(n); scratchStamp = new Uint32Array(n); }
  const G = scratchG, from = scratchFrom!, st = scratchStamp!;
  stamp++;
  if (stamp > 0xfffffff0) { st.fill(0); stamp = 1; }
  const s = Math.floor(sy) * g.w + Math.floor(sx);
  const t = Math.floor(ty) * g.w + Math.floor(tx);
  if (!isOpen(g, Math.floor(tx), Math.floor(ty))) return null;
  if (s === t) return [{ x: tx, y: ty }];
  const tcx = t % g.w, tcy = (t / g.w) | 0;
  const h = (id: number) => {
    const dx = Math.abs((id % g.w) - tcx), dy = Math.abs(((id / g.w) | 0) - tcy);
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  };
  const heap = new Heap(n);
  G[s] = 0; from[s] = -1; st[s] = stamp;
  heap.push(s, h(s));
  const closed = new Set<number>();
  let found = false, expanded = 0;
  while (heap.size) {
    const cur = heap.pop();
    if (cur === t) { found = true; break; }
    if (closed.has(cur)) continue;
    closed.add(cur);
    if (++expanded > maxNodes) break;
    const cx = cur % g.w, cy = (cur / g.w) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!isOpen(g, nx, ny)) continue;
        if (dx && dy && (!isOpen(g, cx + dx, cy) || !isOpen(g, cx, cy + dy))) continue;
        const nid = ny * g.w + nx;
        if (closed.has(nid)) continue;
        const cost = G[cur] + (dx && dy ? Math.SQRT2 : 1);
        if (st[nid] !== stamp || cost < G[nid]) {
          st[nid] = stamp; G[nid] = cost; from[nid] = cur;
          heap.push(nid, cost + h(nid));
        }
      }
  }
  if (!found) return null;
  const cellsPath: Vec2[] = [];
  for (let c = t; c !== -1 && c !== s; c = from[c]) cellsPath.push({ x: (c % g.w) + 0.5, y: ((c / g.w) | 0) + 0.5 });
  cellsPath.reverse();
  cellsPath[cellsPath.length - 1] = { x: tx, y: ty };
  // string pulling
  const out: Vec2[] = [];
  let ax = sx, ay = sy, i = 0;
  while (i < cellsPath.length) {
    let j = cellsPath.length - 1;
    while (j > i && !lineClear(g, ax, ay, cellsPath[j].x, cellsPath[j].y, clearance)) j--;
    out.push(cellsPath[j]);
    ax = cellsPath[j].x; ay = cellsPath[j].y;
    i = j + 1;
  }
  return out;
}

/** Flood-fill reachability from a point; returns a Uint8Array mask of reachable cells. */
export function floodReach(g: NavGrid, sx: number, sy: number): Uint8Array {
  const mask = new Uint8Array(g.w * g.h);
  const start = Math.floor(sy) * g.w + Math.floor(sx);
  if (!isOpen(g, Math.floor(sx), Math.floor(sy))) return mask;
  const q = [start]; mask[start] = 1;
  while (q.length) {
    const c = q.pop()!;
    const cx = c % g.w, cy = (c / g.w) | 0;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of nb) {
      const nx = cx + dx, ny = cy + dy;
      if (!isOpen(g, nx, ny)) continue;
      const id = ny * g.w + nx;
      if (mask[id]) continue;
      mask[id] = 1; q.push(id);
    }
  }
  return mask;
}
