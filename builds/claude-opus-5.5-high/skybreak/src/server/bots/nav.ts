// Bot navigation: a 1m walk-height grid baked once from collision data, with
// windowed A* for local paths and straight-line legs for long rotations.

import { CollisionWorld } from '../../shared/world/collision';
import { WATER_LEVEL, WORLD_HALF } from '../../shared/world/island';

export const NAV_RES = 1;
export const NAV_N = (WORLD_HALF * 2) / NAV_RES;

export class NavGrid {
  walk: Float32Array;
  blocked: Uint8Array;
  private g: Float32Array;
  private parent: Int32Array;
  private seen: Uint32Array;
  private closed: Uint32Array;
  private gen = 1;
  private heap: Int32Array;
  private heapF: Float32Array;

  constructor(public w: CollisionWorld) {
    const N = NAV_N;
    this.walk = new Float32Array(N * N);
    this.blocked = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      this.walk[j * N + i] = w.terrain(-WORLD_HALF + i + 0.5, -WORLD_HALF + j + 0.5);
    }
    const boxes = w.island.boxes;
    // pass 1: ground-level walkable surfaces
    for (const b of boxes) {
      if (b.kind !== 'foundation' && b.kind !== 'floor' && b.kind !== 'stair') continue;
      this.raster(b, (idx) => {
        const t = this.walk[idx];
        if (b.kind === 'floor' && b.minY > t + 1.5) return; // elevated floors
        if (b.maxY > t) this.walk[idx] = b.maxY;
      });
    }
    // pass 2: blockers at body height
    for (const b of boxes) {
      if (b.kind === 'stair' || b.kind === 'foundation') continue;
      this.raster(b, (idx) => {
        const h = this.walk[idx];
        if (b.minY < h + 1.6 && b.maxY > h + 0.5) this.blocked[idx] = 1;
      });
    }
    // inflate blockers slightly so bodies (r=0.35) do not clip corners
    const inflated = this.blocked.slice();
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
      const k = j * N + i;
      if (this.blocked[k]) continue;
      // only inflate diagonally-adjacent corner cases: keep 1-cell door gaps open
      const n = this.blocked[k - 1] + this.blocked[k + 1] + this.blocked[k - N] + this.blocked[k + N];
      if (n >= 3) inflated[k] = 1;
    }
    this.blocked = inflated;
    const size = 200 * 200;
    this.g = new Float32Array(N * N);
    this.parent = new Int32Array(N * N);
    this.seen = new Uint32Array(N * N);
    this.closed = new Uint32Array(N * N);
    this.heap = new Int32Array(size * 4);
    this.heapF = new Float32Array(size * 4);
  }

  private raster(b: { minX: number; maxX: number; minZ: number; maxZ: number }, fn: (idx: number) => void) {
    const N = NAV_N;
    const i0 = Math.max(0, Math.floor(b.minX + WORLD_HALF)), i1 = Math.min(N - 1, Math.floor(b.maxX + WORLD_HALF - 1e-3));
    const j0 = Math.max(0, Math.floor(b.minZ + WORLD_HALF)), j1 = Math.min(N - 1, Math.floor(b.maxZ + WORLD_HALF - 1e-3));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      // require the cell centre to be inside the box footprint (keeps thin walls 1 cell wide)
      const cx = i - WORLD_HALF + 0.5, cz = j - WORLD_HALF + 0.5;
      const pad = 0.35;
      if (cx < b.minX - pad || cx > b.maxX + pad || cz < b.minZ - pad || cz > b.maxZ + pad) continue;
      fn(j * N + i);
    }
  }

  idx(x: number, z: number) {
    const i = Math.max(0, Math.min(NAV_N - 1, Math.floor(x + WORLD_HALF)));
    const j = Math.max(0, Math.min(NAV_N - 1, Math.floor(z + WORLD_HALF)));
    return j * NAV_N + i;
  }

  passable(x: number, z: number) {
    return !this.blocked[this.idx(x, z)];
  }

  /** Windowed A*. Returns world-space waypoints (excluding start). */
  path(sx: number, sz: number, gx: number, gz: number, maxExpand = 7000): { x: number; z: number }[] {
    const N = NAV_N;
    const start = this.idx(sx, sz);
    let goal = this.idx(gx, gz);
    if (this.blocked[goal]) goal = this.nearestFree(goal);
    if (goal < 0) return [];
    const gen = ++this.gen;
    const gi = goal % N, gj = (goal / N) | 0;
    const minI = Math.min(start % N, gi) - 40, maxI = Math.max(start % N, gi) + 40;
    const minJ = Math.min((start / N) | 0, gj) - 40, maxJ = Math.max((start / N) | 0, gj) + 40;
    let hn = 0;
    const push = (node: number, f: number) => {
      let i = hn++;
      this.heap[i] = node; this.heapF[i] = f;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.heapF[p] <= this.heapF[i]) break;
        const tn = this.heap[p], tf = this.heapF[p];
        this.heap[p] = this.heap[i]; this.heapF[p] = this.heapF[i];
        this.heap[i] = tn; this.heapF[i] = tf;
        i = p;
      }
    };
    const pop = () => {
      const top = this.heap[0];
      hn--;
      this.heap[0] = this.heap[hn]; this.heapF[0] = this.heapF[hn];
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < hn && this.heapF[l] < this.heapF[m]) m = l;
        if (r < hn && this.heapF[r] < this.heapF[m]) m = r;
        if (m === i) break;
        const tn = this.heap[m], tf = this.heapF[m];
        this.heap[m] = this.heap[i]; this.heapF[m] = this.heapF[i];
        this.heap[i] = tn; this.heapF[i] = tf;
        i = m;
      }
      return top;
    };
    const h = (n: number) => {
      const dx = Math.abs((n % N) - gi), dz = Math.abs(((n / N) | 0) - gj);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    this.g[start] = 0; this.seen[start] = gen; this.parent[start] = -1;
    push(start, h(start));
    let best = start, bestH = h(start);
    let expanded = 0;
    const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (hn > 0 && expanded < maxExpand && hn < this.heap.length - 8) {
      const cur = pop();
      if (this.closed[cur] === gen) continue;
      this.closed[cur] = gen;
      expanded++;
      if (cur === goal) { best = cur; break; }
      const ci = cur % N, cj = (cur / N) | 0;
      const ch = this.walk[cur];
      const hh = h(cur);
      if (hh < bestH) { bestH = hh; best = cur; }
      for (const [di, dj, cost] of DIRS) {
        const ni = ci + di, nj = cj + dj;
        if (ni < minI || ni > maxI || nj < minJ || nj > maxJ || ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        const nb = nj * N + ni;
        if (this.blocked[nb] || this.closed[nb] === gen) continue;
        if (di !== 0 && dj !== 0 && (this.blocked[cj * N + ni] || this.blocked[nj * N + ci])) continue;
        const nh = this.walk[nb];
        const dh = nh - ch;
        if (dh > 1.5) continue; // unclimbable
        let c = cost;
        if (dh > 0.45) c += 3; // needs a mantle
        if (dh < -4) c += 6; // drop
        if (nh < WATER_LEVEL - 1.1) c *= 2.2; // swimming
        const ng = this.g[cur] + c;
        if (this.seen[nb] === gen && ng >= this.g[nb]) continue;
        this.seen[nb] = gen;
        this.g[nb] = ng;
        this.parent[nb] = cur;
        push(nb, ng + h(nb) * 1.15);
      }
    }
    const out: { x: number; z: number }[] = [];
    let n = best;
    let guard = 0;
    while (n !== start && n >= 0 && guard++ < 5000) {
      out.push({ x: (n % N) - WORLD_HALF + 0.5, z: ((n / N) | 0) - WORLD_HALF + 0.5 });
      n = this.parent[n];
    }
    out.reverse();
    // thin the path: keep every 3rd point plus last
    const thin: { x: number; z: number }[] = [];
    for (let i = 0; i < out.length; i++) if (i % 3 === 2 || i === out.length - 1) thin.push(out[i]);
    return thin;
  }

  nearestFree(idx: number): number {
    const N = NAV_N;
    const ci = idx % N, cj = (idx / N) | 0;
    for (let r = 1; r < 6; r++) {
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        const i = ci + di, j = cj + dj;
        if (i < 0 || j < 0 || i >= N || j >= N) continue;
        const k = j * N + i;
        if (!this.blocked[k]) return k;
      }
    }
    return -1;
  }
}

let cachedNav: NavGrid | null = null;
export function getNav(w: CollisionWorld) {
  if (!cachedNav || cachedNav.w !== w) cachedNav = new NavGrid(w);
  return cachedNav;
}
