// Navigation grid generated automatically from the collision boxes (1 m cells, 2.5D heights, step limits).
// Bots path with A* and string-pull the result. The map scanner reuses it for route-time and stuck-point checks.

import { MOVEMENT as M } from '../content/economy';
import { bodyBlocked, supportHeight } from './collision';
import { MAP_HEIGHT, MAP_WIDTH } from './map';
import { Vec3 } from './math';

export const NAV_CELL = 1;
export const NAV_W = MAP_WIDTH / NAV_CELL;
export const NAV_H = MAP_HEIGHT / NAV_CELL;
const NAV_R = 0.28;

export const floorY = new Float32Array(NAV_W * NAV_H);
export const walkable = new Uint8Array(NAV_W * NAV_H);
const wallPenalty = new Float32Array(NAV_W * NAV_H);

const idx = (c: number, r: number) => r * NAV_W + c;

function buildNav(): void {
  for (let r = 0; r < NAV_H; r++) {
    for (let c = 0; c < NAV_W; c++) {
      const x = (c + 0.5) * NAV_CELL, z = (r + 0.5) * NAV_CELL;
      const fy = supportHeight(x, z, 0.25, 1.9, 0.02, true);
      floorY[idx(c, r)] = fy;
      walkable[idx(c, r)] = bodyBlocked(x, fy, z, NAV_R, M.standHeight) ? 0 : 1;
    }
  }
  for (let r = 0; r < NAV_H; r++) {
    for (let c = 0; c < NAV_W; c++) {
      if (!walkable[idx(c, r)]) continue;
      let pen = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= NAV_W || nr >= NAV_H || !walkable[idx(nc, nr)]) pen += 0.35;
      }
      wallPenalty[idx(c, r)] = pen;
    }
  }
}
buildNav();

function edgeOk(c0: number, r0: number, c1: number, r1: number): boolean {
  const a = idx(c0, r0), b = idx(c1, r1);
  if (!walkable[a] || !walkable[b]) return false;
  const dy = floorY[b] - floorY[a];
  if (Math.abs(dy) > M.stepHeight + 0.02 && dy > 0) return false;
  if (dy < -1.2) return false; // do not drop off tall ledges on purpose
  if (c0 !== c1 && r0 !== r1) {
    if (!walkable[idx(c1, r0)] || !walkable[idx(c0, r1)]) return false;
  }
  const mx = ((c0 + c1) / 2 + 0.5) * NAV_CELL, mz = ((r0 + r1) / 2 + 0.5) * NAV_CELL;
  const my = Math.max(floorY[a], floorY[b]);
  return !bodyBlocked(mx, my, mz, NAV_R, M.standHeight);
}

export function cellOf(x: number, z: number): [number, number] {
  return [Math.min(NAV_W - 1, Math.max(0, Math.floor(x / NAV_CELL))), Math.min(NAV_H - 1, Math.max(0, Math.floor(z / NAV_CELL)))];
}

export function isWalkableAt(x: number, z: number): boolean {
  const [c, r] = cellOf(x, z);
  return walkable[idx(c, r)] === 1;
}

export function floorAt(x: number, z: number): number {
  const [c, r] = cellOf(x, z);
  return floorY[idx(c, r)];
}

/** Closest walkable cell to a world point (spiral search). */
export function nearestWalkable(x: number, z: number): [number, number] | null {
  const [c0, r0] = cellOf(x, z);
  if (walkable[idx(c0, r0)]) return [c0, r0];
  for (let rad = 1; rad < 8; rad++) {
    let best: [number, number] | null = null;
    let bd = Infinity;
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
        const c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= NAV_W || r >= NAV_H || !walkable[idx(c, r)]) continue;
        const d = dc * dc + dr * dr;
        if (d < bd) { bd = d; best = [c, r]; }
      }
    }
    if (best) return best;
  }
  return null;
}

class MinHeap {
  keys: number[] = [];
  vals: number[] = [];
  get size(): number { return this.keys.length; }
  push(k: number, v: number): void {
    const keys = this.keys, vals = this.vals;
    let i = keys.length;
    keys.push(k); vals.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= keys[i]) break;
      [keys[p], keys[i]] = [keys[i], keys[p]];
      [vals[p], vals[i]] = [vals[i], vals[p]];
      i = p;
    }
  }
  pop(): number {
    const keys = this.keys, vals = this.vals;
    const top = vals[0];
    const lk = keys.pop()!, lv = vals.pop()!;
    if (keys.length) {
      keys[0] = lk; vals[0] = lv;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < keys.length && keys[l] < keys[m]) m = l;
        if (r < keys.length && keys[r] < keys[m]) m = r;
        if (m === i) break;
        [keys[m], keys[i]] = [keys[i], keys[m]];
        [vals[m], vals[i]] = [vals[i], vals[m]];
        i = m;
      }
    }
    return top;
  }
}

const gScore = new Float32Array(NAV_W * NAV_H);
const came = new Int32Array(NAV_W * NAV_H);
const closed = new Uint8Array(NAV_W * NAV_H);

const N8: Array<[number, number, number]> = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [-1, 1, 1.4142], [1, -1, 1.4142], [-1, -1, 1.4142],
];

export interface PathOptions {
  /** Extra cost for stepping into a cell (world coordinates). */
  extraCost?: (x: number, z: number) => number;
}

/** Raw cell path (list of cell centres). */
export function findCellPath(from: Vec3, to: Vec3, opts: PathOptions = {}): Vec3[] | null {
  const s = nearestWalkable(from.x, from.z), g = nearestWalkable(to.x, to.z);
  if (!s || !g) return null;
  const sIdx = idx(s[0], s[1]), gIdx = idx(g[0], g[1]);
  gScore.fill(Infinity);
  closed.fill(0);
  came.fill(-1);
  const heap = new MinHeap();
  gScore[sIdx] = 0;
  heap.push(0, sIdx);
  const gc = g[0], gr = g[1];
  let found = false;
  while (heap.size) {
    const cur = heap.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === gIdx) { found = true; break; }
    const cc = cur % NAV_W, cr = (cur / NAV_W) | 0;
    for (const [dc, dr, cost] of N8) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nr < 0 || nc >= NAV_W || nr >= NAV_H) continue;
      const ni = idx(nc, nr);
      if (closed[ni] || !edgeOk(cc, cr, nc, nr)) continue;
      let step = cost + wallPenalty[ni];
      if (opts.extraCost) step += opts.extraCost((nc + 0.5) * NAV_CELL, (nr + 0.5) * NAV_CELL);
      const ng = gScore[cur] + step;
      if (ng < gScore[ni]) {
        gScore[ni] = ng;
        came[ni] = cur;
        const h = Math.hypot(nc - gc, nr - gr);
        heap.push(ng + h, ni);
      }
    }
  }
  if (!found) return null;
  const out: Vec3[] = [];
  let cur = gIdx;
  while (cur !== -1) {
    const c = cur % NAV_W, r = (cur / NAV_W) | 0;
    out.push({ x: (c + 0.5) * NAV_CELL, y: floorY[cur], z: (r + 0.5) * NAV_CELL });
    cur = came[cur];
  }
  out.reverse();
  return out;
}

/** True if a body can walk the straight segment (used for string pulling). */
export function straightWalkable(a: Vec3, b: Vec3): boolean {
  const dx = b.x - a.x, dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.ceil(len / 0.3));
  let prevY = floorAt(a.x, a.z);
  for (let i = 1; i <= n; i++) {
    const x = a.x + (dx * i) / n, z = a.z + (dz * i) / n;
    const [c, r] = cellOf(x, z);
    if (!walkable[idx(c, r)]) return false;
    const fy = floorY[idx(c, r)];
    if (fy - prevY > M.stepHeight + 0.02 || prevY - fy > 1.2) return false;
    if (bodyBlocked(x, Math.max(fy, prevY), z, 0.3, M.standHeight)) return false;
    prevY = fy;
  }
  return true;
}

/** A* path with string pulling. First point is the next waypoint (the start is excluded). */
export function findPath(from: Vec3, to: Vec3, opts: PathOptions = {}): Vec3[] | null {
  const raw = findCellPath(from, to, opts);
  if (!raw) return null;
  const pts: Vec3[] = [{ x: from.x, y: from.y, z: from.z }, ...raw.slice(1)];
  const out: Vec3[] = [];
  let anchor = 0;
  while (anchor < pts.length - 1) {
    let far = anchor + 1;
    for (let j = pts.length - 1; j > anchor + 1; j--) {
      if (straightWalkable(pts[anchor], pts[j])) { far = j; break; }
    }
    out.push(pts[far]);
    anchor = far;
  }
  // Replace the final cell centre by the exact goal if it is walkable.
  if (out.length) {
    const last = out[out.length - 1];
    if (Math.hypot(last.x - to.x, last.z - to.z) < 1.5 && isWalkableAt(to.x, to.z)) {
      out[out.length - 1] = { x: to.x, y: floorAt(to.x, to.z), z: to.z };
    }
  }
  return out;
}

export function pathLength(path: Vec3[], from: Vec3): number {
  let len = 0;
  let px = from.x, pz = from.z;
  for (const p of path) { len += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; }
  return len;
}

/** Number of walkable cells (for scanner). */
export function walkableCount(): number {
  let n = 0;
  for (let i = 0; i < walkable.length; i++) n += walkable[i];
  return n;
}
