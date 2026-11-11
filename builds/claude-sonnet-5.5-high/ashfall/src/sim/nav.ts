// Grid collision, line of sight and A* navigation. Pure functions, no DOM.
import type { Vec2 } from './types';

export const FLOOR = 0;
export const WALL = 1; // blocks movement + sight
export const SOLID = 2; // blocks movement only (props)

export interface Grid {
  w: number;
  h: number;
  cells: Uint8Array;
}

export function makeGrid(w: number, h: number, fill = WALL): Grid {
  return { w, h, cells: new Uint8Array(w * h).fill(fill) };
}

export function cellAt(g: Grid, cx: number, cz: number): number {
  if (cx < 0 || cz < 0 || cx >= g.w || cz >= g.h) return WALL;
  return g.cells[cz * g.w + cx];
}

export function blockedCell(g: Grid, cx: number, cz: number): boolean {
  return cellAt(g, cx, cz) !== FLOOR;
}

export function circleBlocked(g: Grid, x: number, z: number, r: number): boolean {
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r);
  const z0 = Math.floor(z - r);
  const z1 = Math.floor(z + r);
  for (let cz = z0; cz <= z1; cz++) {
    for (let cx = x0; cx <= x1; cx++) {
      if (cellAt(g, cx, cz) === FLOOR) continue;
      const nx = Math.max(cx, Math.min(x, cx + 1));
      const nz = Math.max(cz, Math.min(z, cz + 1));
      const dx = x - nx;
      const dz = z - nz;
      if (dx * dx + dz * dz < r * r) return true;
    }
  }
  return false;
}

/** Move a circle with axis-separated sliding. Returns new position and whether it was blocked. */
export function moveCircle(g: Grid, x: number, z: number, dx: number, dz: number, r: number): { x: number; z: number; hit: boolean } {
  let hit = false;
  let nx = x;
  let nz = z;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / 0.25));
  const sx = dx / steps;
  const sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    if (!circleBlocked(g, nx + sx, nz, r)) nx += sx;
    else if (sx !== 0) hit = true;
    if (!circleBlocked(g, nx, nz + sz, r)) nz += sz;
    else if (sz !== 0) hit = true;
  }
  return { x: nx, z: nz, hit };
}

/** Find a nearby unblocked position for a circle (used after teleports and spawns). */
export function depenetrate(g: Grid, x: number, z: number, r: number): Vec2 {
  if (!circleBlocked(g, x, z, r)) return { x, z };
  for (let ring = 1; ring < 14; ring++) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const tx = x + Math.cos(ang) * ring * 0.4;
      const tz = z + Math.sin(ang) * ring * 0.4;
      if (!circleBlocked(g, tx, tz, r)) return { x: tx, z: tz };
    }
  }
  return { x, z };
}

/** True when a line (or fat ray when r>0) crosses no blocker; sightOnly checks WALL cells only. */
export function lineClear(g: Grid, x0: number, z0: number, x1: number, z1: number, r = 0, sightOnly = false): boolean {
  const dist = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(1, Math.ceil(dist / 0.3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (sightOnly) {
      if (cellAt(g, Math.floor(x), Math.floor(z)) === WALL) return false;
    } else if (r > 0 ? circleBlocked(g, x, z, r) : blockedCell(g, Math.floor(x), Math.floor(z))) return false;
  }
  return true;
}

export function nearestWalkable(g: Grid, x: number, z: number, maxR: number): (Vec2 & { dist: number }) | null {
  if (!blockedCell(g, Math.floor(x), Math.floor(z))) return { x, z, dist: 0 };
  let best: (Vec2 & { dist: number }) | null = null;
  const R = Math.ceil(maxR);
  const cx = Math.floor(x);
  const cz = Math.floor(z);
  for (let dz = -R; dz <= R; dz++) {
    for (let dx = -R; dx <= R; dx++) {
      const tx = cx + dx;
      const tz = cz + dz;
      if (blockedCell(g, tx, tz)) continue;
      const px = tx + 0.5;
      const pz = tz + 0.5;
      const d = Math.hypot(px - x, pz - z);
      if (d <= maxR && (!best || d < best.dist)) best = { x: px, z: pz, dist: d };
    }
  }
  return best;
}

class MinHeap {
  keys: number[] = [];
  vals: number[] = [];
  get size() {
    return this.keys.length;
  }
  push(k: number, v: number) {
    const ks = this.keys;
    const vs = this.vals;
    let i = ks.length;
    ks.push(k);
    vs.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (ks[p] <= ks[i]) break;
      [ks[p], ks[i]] = [ks[i], ks[p]];
      [vs[p], vs[i]] = [vs[i], vs[p]];
      i = p;
    }
  }
  pop(): number {
    const ks = this.keys;
    const vs = this.vals;
    const top = vs[0];
    const lk = ks.pop()!;
    const lv = vs.pop()!;
    if (ks.length > 0) {
      ks[0] = lk;
      vs[0] = lv;
      let i = 0;
      const n = ks.length;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < n && ks[l] < ks[m]) m = l;
        if (r < n && ks[r] < ks[m]) m = r;
        if (m === i) break;
        [ks[m], ks[i]] = [ks[i], ks[m]];
        [vs[m], vs[i]] = [vs[i], vs[m]];
        i = m;
      }
    }
    return top;
  }
}

const NB: number[][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** A* over cell centres with string-pulling smoothing. Returns waypoints (excluding the start). */
export function findPath(g: Grid, sx: number, sz: number, tx: number, tz: number, radius = 0.42): Vec2[] | null {
  const scx = Math.floor(sx);
  const scz = Math.floor(sz);
  const tcx = Math.floor(tx);
  const tcz = Math.floor(tz);
  if (blockedCell(g, tcx, tcz)) return null;
  if (lineClear(g, sx, sz, tx, tz, radius)) return [{ x: tx, z: tz }];
  const w = g.w;
  const n = w * g.h;
  const gScore = new Float32Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap();
  const start = scz * w + scx;
  const goal = tcz * w + tcx;
  gScore[start] = 0;
  heap.push(0, start);
  let found = false;
  let guard = 0;
  while (heap.size > 0 && guard++ < 30000) {
    const cur = heap.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) {
      found = true;
      break;
    }
    const cx = cur % w;
    const cz = (cur / w) | 0;
    for (const [dx, dz, c] of NB) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (blockedCell(g, nx, nz)) continue;
      if (dx !== 0 && dz !== 0 && (blockedCell(g, cx + dx, cz) || blockedCell(g, cx, cz + dz))) continue;
      const ni = nz * w + nx;
      if (closed[ni]) continue;
      const ng = gScore[cur] + c;
      if (ng < gScore[ni]) {
        gScore[ni] = ng;
        from[ni] = cur;
        const h = Math.hypot(tcx - nx, tcz - nz);
        heap.push(ng + h, ni);
      }
    }
  }
  if (!found) return null;
  const raw: Vec2[] = [];
  let c = goal;
  while (c !== start && c !== -1) {
    raw.push({ x: (c % w) + 0.5, z: ((c / w) | 0) + 0.5 });
    c = from[c];
  }
  raw.reverse();
  if (raw.length === 0) return [{ x: tx, z: tz }];
  raw[raw.length - 1] = { x: tx, z: tz };
  const out: Vec2[] = [];
  let ax = sx;
  let az = sz;
  let i = 0;
  while (i < raw.length) {
    let far = i;
    for (let j = raw.length - 1; j > i; j--) {
      if (lineClear(g, ax, az, raw[j].x, raw[j].z, radius)) {
        far = j;
        break;
      }
    }
    out.push(raw[far]);
    ax = raw[far].x;
    az = raw[far].z;
    i = far + 1;
  }
  return out;
}

export function pathLength(g: Grid, ax: number, az: number, bx: number, bz: number): number {
  const p = findPath(g, ax, az, bx, bz, 0.3);
  if (!p) return Infinity;
  let len = 0;
  let px = ax;
  let pz = az;
  for (const q of p) {
    len += Math.hypot(q.x - px, q.z - pz);
    px = q.x;
    pz = q.z;
  }
  return len;
}

/** Flood fill (4-connected) from a point; returns a reachability marker array. */
export function flood(g: Grid, sx: number, sz: number): Uint8Array {
  const seen = new Uint8Array(g.w * g.h);
  const stack: number[] = [];
  if (blockedCell(g, Math.floor(sx), Math.floor(sz))) return seen;
  const s = Math.floor(sz) * g.w + Math.floor(sx);
  seen[s] = 1;
  stack.push(s);
  while (stack.length) {
    const c = stack.pop()!;
    const cx = c % g.w;
    const cz = (c / g.w) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = cx + NB[k][0];
      const nz = cz + NB[k][1];
      if (blockedCell(g, nx, nz)) continue;
      const ni = nz * g.w + nx;
      if (!seen[ni]) {
        seen[ni] = 1;
        stack.push(ni);
      }
    }
  }
  return seen;
}
