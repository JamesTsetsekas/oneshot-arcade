// Navigation: static region labelling, dynamic occupancy, cached flow fields (one integration
// field per goal shared by every unit heading there), line-of-sight string pulling, and a
// spatial hash for local avoidance queries.

import { F_WALK } from '../world/map';

export class NavGrid {
  readonly n: number;
  readonly staticWalk: Uint8Array;
  /** dynamic occupancy: entity id + 1 occupying a cell (structures, resources, barriers) */
  readonly occ: Int32Array;
  /** static connected-component label per walkable cell (precomputed regions) */
  readonly region: Int32Array;
  version = 0;
  private cache = new Map<string, { version: number; field: Float32Array; used: number }>();
  private useCounter = 0;
  stats = { fieldsBuilt: 0, cacheHits: 0, lastBuildMs: 0 };

  constructor(n: number, flags: Uint8Array) {
    this.n = n;
    this.staticWalk = new Uint8Array(n * n);
    for (let i = 0; i < n * n; i++) this.staticWalk[i] = flags[i] & F_WALK ? 1 : 0;
    this.occ = new Int32Array(n * n);
    this.region = new Int32Array(n * n).fill(-1);
    this.labelRegions();
  }

  private labelRegions() {
    const n = this.n;
    let label = 0;
    const stack: number[] = [];
    for (let i = 0; i < n * n; i++) {
      if (!this.staticWalk[i] || this.region[i] >= 0) continue;
      this.region[i] = label;
      stack.push(i);
      while (stack.length) {
        const c = stack.pop()!;
        const x = c % n, y = (c / n) | 0;
        if (x > 0) this.visit(c - 1, label, stack);
        if (x < n - 1) this.visit(c + 1, label, stack);
        if (y > 0) this.visit(c - n, label, stack);
        if (y < n - 1) this.visit(c + n, label, stack);
      }
      label++;
    }
  }
  private visit(c: number, label: number, stack: number[]) {
    if (this.staticWalk[c] && this.region[c] < 0) { this.region[c] = label; stack.push(c); }
  }

  passable(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return false;
    const i = cy * this.n + cx;
    return this.staticWalk[i] === 1 && this.occ[i] === 0;
  }
  passableW(x: number, y: number): boolean { return this.passable(Math.floor(x), Math.floor(y)); }

  setOcc(cells: number[], value: number) {
    for (const c of cells) this.occ[c] = value;
    this.version++; // localized change; fields are lazily rebuilt only for goals still in use
  }

  /** nearest passable cell to (cx,cy) via expanding rings */
  nearestPassable(cx: number, cy: number, maxR = 20): number {
    cx = Math.max(0, Math.min(this.n - 1, cx)); cy = Math.max(0, Math.min(this.n - 1, cy));
    if (this.passable(cx, cy)) return cy * this.n + cx;
    for (let r = 1; r <= maxR; r++) {
      let best = -1, bestD = 1e9;
      for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
        if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
        const x = cx + ox, y = cy + oy;
        if (this.passable(x, y)) { const d = ox * ox + oy * oy; if (d < bestD) { bestD = d; best = y * this.n + x; } }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  /** Field for a goal key; seeds are the goal cells. */
  field(key: string, seeds: () => number[]): Float32Array | null {
    const hit = this.cache.get(key);
    if (hit && hit.version === this.version) { hit.used = ++this.useCounter; this.stats.cacheHits++; return hit.field; }
    const s = seeds().filter((c) => c >= 0);
    if (!s.length) return null;
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const field = hit && hit.field.length === this.n * this.n ? hit.field : new Float32Array(this.n * this.n);
    this.integrate(field, s);
    this.stats.fieldsBuilt++;
    this.stats.lastBuildMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
    this.cache.set(key, { version: this.version, field, used: ++this.useCounter });
    if (this.cache.size > 64) {
      let oldK = '', oldU = Infinity;
      for (const [k, v] of this.cache) if (v.used < oldU) { oldU = v.used; oldK = k; }
      this.cache.delete(oldK);
    }
    return field;
  }

  // Dijkstra over 8-connected grid without corner cutting. Binary heap on typed arrays.
  private heapI = new Int32Array(1 << 18);
  private heapD = new Float32Array(1 << 18);
  private integrate(field: Float32Array, seeds: number[]) {
    const n = this.n;
    field.fill(Infinity);
    let size = 0;
    const hi = this.heapI, hd = this.heapD;
    const push = (i: number, d: number) => {
      let k = size++;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (hd[p] <= d) break;
        hi[k] = hi[p]; hd[k] = hd[p]; k = p;
      }
      hi[k] = i; hd[k] = d;
    };
    const pop = () => {
      const top = hi[0];
      const li = hi[--size], ld = hd[size];
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= size) break;
        if (c + 1 < size && hd[c + 1] < hd[c]) c++;
        if (hd[c] >= ld) break;
        hi[k] = hi[c]; hd[k] = hd[c]; k = c;
      }
      hi[k] = li; hd[k] = ld;
      return top;
    };
    for (const s of seeds) { field[s] = 0; push(s, 0); }
    const walk = this.staticWalk, occ = this.occ;
    while (size > 0) {
      const d0 = hd[0];
      const c = pop();
      if (d0 > field[c]) continue;
      const x = c % n, y = (c / n) | 0;
      for (let oy = -1; oy <= 1; oy++) {
        const yy = y + oy;
        if (yy < 0 || yy >= n) continue;
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const xx = x + ox;
          if (xx < 0 || xx >= n) continue;
          const j = yy * n + xx;
          if (!walk[j] || occ[j]) continue;
          let cost = 1;
          if (ox && oy) {
            const a = y * n + xx, b = yy * n + x;
            if (!walk[a] || occ[a] || !walk[b] || occ[b]) continue;
            cost = 1.41421;
          }
          const nd = d0 + cost;
          if (nd < field[j]) { field[j] = nd; if (size < hi.length) push(j, nd); }
        }
      }
    }
  }

  /** Line of sight for ground movement between two world points (cell DDA). */
  lineClear(x0: number, y0: number, x1: number, y1: number): boolean {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(len * 2.5);
    if (steps === 0) return true;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const x = x0 + dx * t, y = y0 + dy * t;
      if (!this.passableW(x, y)) return false;
      // keep a little clearance for unit bodies
      if (!this.passableW(x + 0.3, y) || !this.passableW(x - 0.3, y) || !this.passableW(x, y + 0.3) || !this.passableW(x, y - 0.3)) return false;
    }
    return true;
  }

  /**
   * Steering target for a unit at (x,y) following `field`: walk downhill a few cells and pick
   * the farthest one reachable in a straight line (cheap string pulling).
   */
  steer(field: Float32Array, x: number, y: number, out: { x: number; y: number }): boolean {
    const n = this.n;
    let cx = Math.floor(x), cy = Math.floor(y);
    let c = cy * n + cx;
    if (cx < 0 || cy < 0 || cx >= n || cy >= n) return false;
    if (!Number.isFinite(field[c])) {
      // standing in an unreachable/blocked cell: step to best neighbor
      let best = -1, bd = Infinity;
      for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
        const xx = cx + ox, yy = cy + oy;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const v = field[yy * n + xx] + Math.hypot(ox, oy) * 0.5;
        if (v < bd) { bd = v; best = yy * n + xx; }
      }
      if (best < 0 || !Number.isFinite(bd)) return false;
      out.x = (best % n) + 0.5; out.y = ((best / n) | 0) + 0.5;
      return true;
    }
    let tx = x, ty = y;
    for (let step = 0; step < 7; step++) {
      if (field[c] === 0) { tx = cx + 0.5; ty = cy + 0.5; break; }
      let best = c, bd = field[c];
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const xx = cx + ox, yy = cy + oy;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const j = yy * n + xx;
        if (field[j] < bd) { bd = field[j]; best = j; }
      }
      if (best === c) break;
      c = best; cx = c % n; cy = (c / n) | 0;
      const px = cx + 0.5, py = cy + 0.5;
      if (step === 0 || this.lineClear(x, y, px, py)) { tx = px; ty = py; } else break;
    }
    out.x = tx; out.y = ty;
    return true;
  }
}

/** Uniform-grid spatial hash rebuilt each tick. Linked lists in typed arrays (no allocation). */
export class SpatialHash {
  readonly cell: number;
  readonly dim: number;
  readonly head: Int32Array;
  readonly next: Int32Array;
  constructor(worldSize: number, cell: number, capacity: number) {
    this.cell = cell;
    this.dim = Math.ceil(worldSize / cell);
    this.head = new Int32Array(this.dim * this.dim).fill(-1);
    this.next = new Int32Array(capacity).fill(-1);
  }
  clear() { this.head.fill(-1); }
  insert(id: number, x: number, y: number) {
    const cx = Math.max(0, Math.min(this.dim - 1, Math.floor(x / this.cell)));
    const cy = Math.max(0, Math.min(this.dim - 1, Math.floor(y / this.cell)));
    const b = cy * this.dim + cx;
    this.next[id] = this.head[b];
    this.head[b] = id;
  }
  /** Calls fn for every id in buckets overlapping the circle (caller filters exact distance). */
  query(x: number, y: number, r: number, fn: (id: number) => void) {
    const c = this.cell, d = this.dim;
    const x0 = Math.max(0, Math.floor((x - r) / c)), x1 = Math.min(d - 1, Math.floor((x + r) / c));
    const y0 = Math.max(0, Math.floor((y - r) / c)), y1 = Math.min(d - 1, Math.floor((y + r) / c));
    for (let by = y0; by <= y1; by++) for (let bx = x0; bx <= x1; bx++) {
      for (let id = this.head[by * d + bx]; id >= 0; id = this.next[id]) fn(id);
    }
  }
}
