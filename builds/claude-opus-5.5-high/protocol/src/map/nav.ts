// Navigation grid derived from the same collision source as movement.
// Used by bots (A*), the thermite surface cells, and the map analysis tests.

import type { GameMap } from './runtime';
import { PLAYER } from '../content/rules';

export class NavGrid {
  readonly map: GameMap;
  readonly nx: number;
  readonly nz: number;
  /** walkable floor height per cell, NaN = not walkable */
  readonly floor: Float32Array;
  /** un-eroded surface height per cell (thermite cells, floor queries) */
  readonly rawFloor: Float32Array;
  /** 1 = requires crouch */
  readonly crouch: Uint8Array;
  /** connected component id (largest is main) */
  readonly comp: Int32Array;
  mainComp = -1;
  private gScore: Float32Array;
  private came: Int32Array;
  private closed: Uint32Array;
  private openStamp: Uint32Array;
  private searchId = 1;

  constructor(map: GameMap) {
    this.map = map;
    this.nx = map.nx;
    this.nz = map.nz;
    const n = this.nx * this.nz;
    const raw = new Float32Array(n).fill(NaN);
    const crouch = new Uint8Array(n);
    const c = map.cell;
    const tmp: number[] = [];
    for (let i = 0; i < n; i++) {
      if (map.cellRegion[i] < 0) continue;
      const { x, z } = map.cellCenter(i);
      let floor = map.cellFloor[i];
      const ceil = map.cellCeil[i];
      // props overlapping the cell footprint
      const h = c * 0.5 - 0.02;
      map.queryAABB(x - h, floor + 0.02, z - h, x + h, floor + PLAYER.height, z + h, tmp);
      let blocked = false;
      let raised = floor;
      for (const bi of tmp) {
        const b = map.boxes[bi];
        if (b.kind !== 'prop') continue;
        if (b.maxY - floor <= PLAYER.stepHeight) raised = Math.max(raised, b.maxY);
        else blocked = true;
      }
      if (blocked) continue;
      floor = raised;
      const clear = ceil - floor;
      if (clear < PLAYER.crouchHeight + 0.02) continue;
      if (clear < PLAYER.height + 0.02) crouch[i] = 1;
      raw[i] = floor;
    }
    // erode against walls and tall rises
    const floorArr = new Float32Array(n).fill(NaN);
    for (let iz = 0; iz < this.nz; iz++)
      for (let ix = 0; ix < this.nx; ix++) {
        const i = iz * this.nx + ix;
        const f = raw[i];
        if (isNaN(f)) continue;
        let tight = false;
        for (let dz = -1; dz <= 1 && !tight; dz++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dz) continue;
            const jx = ix + dx;
            const jz = iz + dz;
            if (jx < 0 || jz < 0 || jx >= this.nx || jz >= this.nz) {
              tight = true;
              break;
            }
            const g = raw[jz * this.nx + jx];
            if (isNaN(g) || g - f > PLAYER.stepHeight + 0.01) {
              tight = true;
              break;
            }
          }
        if (!tight) floorArr[i] = f;
      }
    this.floor = floorArr;
    this.rawFloor = raw;
    this.crouch = crouch;
    this.gScore = new Float32Array(n);
    this.came = new Int32Array(n);
    this.closed = new Uint32Array(n);
    this.openStamp = new Uint32Array(n);
    this.comp = new Int32Array(n).fill(-1);
    this.labelComponents();
  }

  walkable(i: number): boolean {
    return i >= 0 && !isNaN(this.floor[i]);
  }

  /** can a walker move from cell a to adjacent cell b */
  canStep(a: number, b: number): boolean {
    const fa = this.floor[a];
    const fb = this.floor[b];
    if (isNaN(fa) || isNaN(fb)) return false;
    const dh = fb - fa;
    if (dh > PLAYER.stepHeight + 0.01) return false;
    if (dh < -4.5) return false;
    return true;
  }

  private labelComponents(): void {
    // components over bidirectional edges
    let id = 0;
    const sizes: number[] = [];
    const stack: number[] = [];
    for (let i = 0; i < this.floor.length; i++) {
      if (!this.walkable(i) || this.comp[i] >= 0) continue;
      let size = 0;
      stack.push(i);
      this.comp[i] = id;
      while (stack.length) {
        const a = stack.pop()!;
        size++;
        for (const b of this.neighbors4(a)) {
          if (this.comp[b] >= 0) continue;
          if (!this.canStep(a, b) || !this.canStep(b, a)) continue;
          this.comp[b] = id;
          stack.push(b);
        }
      }
      sizes.push(size);
      id++;
    }
    let best = 0;
    sizes.forEach((s, k) => {
      if (s > (sizes[best] ?? 0)) best = k;
    });
    this.mainComp = best;
  }

  private neighbors4(i: number): number[] {
    const ix = i % this.nx;
    const iz = (i / this.nx) | 0;
    const out: number[] = [];
    if (ix > 0) out.push(i - 1);
    if (ix < this.nx - 1) out.push(i + 1);
    if (iz > 0) out.push(i - this.nx);
    if (iz < this.nz - 1) out.push(i + this.nx);
    return out;
  }

  nearestWalkable(x: number, z: number, maxR = 12): number {
    const c = this.map.cellIndex(x, z);
    if (this.walkable(c)) return c;
    const ix0 = Math.floor((x - this.map.x0) / this.map.cell);
    const iz0 = Math.floor((z - this.map.z0) / this.map.cell);
    for (let r = 1; r <= maxR; r++) {
      let best = -1;
      let bestD = Infinity;
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const jx = ix0 + dx;
          const jz = iz0 + dz;
          if (jx < 0 || jz < 0 || jx >= this.nx || jz >= this.nz) continue;
          const j = jz * this.nx + jx;
          if (!this.walkable(j)) continue;
          const d = dx * dx + dz * dz;
          if (d < bestD) {
            bestD = d;
            best = j;
          }
        }
      if (best >= 0) return best;
    }
    return -1;
  }

  /** A* over 8-connected grid. Returns cell list from start to goal (inclusive) or null. */
  findPath(start: number, goal: number, maxIter = 60000): number[] | null {
    if (!this.walkable(start) || !this.walkable(goal)) return null;
    const sid = ++this.searchId;
    const nx = this.nx;
    const gx = goal % nx;
    const gz = (goal / nx) | 0;
    const heap = new MinHeap();
    this.gScore[start] = 0;
    this.came[start] = -1;
    this.openStamp[start] = sid;
    heap.push(start, this.h(start, gx, gz));
    let iter = 0;
    while (heap.size > 0 && iter++ < maxIter) {
      const cur = heap.pop();
      if (cur === goal) {
        const path: number[] = [];
        let k = cur;
        while (k >= 0) {
          path.push(k);
          k = this.came[k];
        }
        return path.reverse();
      }
      if (this.closed[cur] === sid) continue;
      this.closed[cur] = sid;
      const cx = cur % nx;
      const cz = (cur / nx) | 0;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const jx = cx + dx;
          const jz = cz + dz;
          if (jx < 0 || jz < 0 || jx >= nx || jz >= this.nz) continue;
          const j = jz * nx + jx;
          if (this.closed[j] === sid) continue;
          if (!this.canStep(cur, j)) continue;
          if (dx && dz) {
            // no corner cutting
            if (!this.canStep(cur, cz * nx + jx) || !this.canStep(cur, jz * nx + cx)) continue;
          }
          let cost = dx && dz ? 1.4142 : 1;
          if (this.crouch[j]) cost *= 2.4;
          const g = this.gScore[cur] + cost;
          if (this.openStamp[j] === sid && g >= this.gScore[j]) continue;
          this.openStamp[j] = sid;
          this.gScore[j] = g;
          this.came[j] = cur;
          heap.push(j, g + this.h(j, gx, gz));
        }
    }
    return null;
  }

  private h(i: number, gx: number, gz: number): number {
    const dx = Math.abs((i % this.nx) - gx);
    const dz = Math.abs(((i / this.nx) | 0) - gz);
    return dx + dz + (1.4142 - 2) * Math.min(dx, dz);
  }

  /** Path length in metres. */
  pathLength(path: number[]): number {
    let len = 0;
    for (let k = 1; k < path.length; k++) {
      const a = this.map.cellCenter(path[k - 1]);
      const b = this.map.cellCenter(path[k]);
      len += Math.hypot(a.x - b.x, a.z - b.z);
    }
    return len;
  }

  /** Straight-line walkability across cells (for path smoothing). */
  lineWalkable(ax: number, az: number, bx: number, bz: number): boolean {
    const dist = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(dist / 0.2));
    let prev = this.map.cellIndex(ax, az);
    if (!this.walkable(prev)) return false;
    const crouchStart = this.crouch[prev];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const c = this.map.cellIndex(x, z);
      if (c !== prev) {
        if (!this.canStep(prev, c)) return false;
        if (this.crouch[c] !== crouchStart) return false;
        // also check the side cells so the capsule fits
        prev = c;
      }
    }
    return true;
  }

  /** Smooth a cell path into world waypoints. */
  smooth(path: number[]): { x: number; z: number; y: number; crouch: boolean }[] {
    const pts = path.map((i) => {
      const c = this.map.cellCenter(i);
      return { x: c.x, z: c.z, y: this.floor[i], crouch: this.crouch[i] === 1 };
    });
    if (pts.length <= 2) return pts;
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = Math.min(pts.length - 1, i + 40);
      while (j > i + 1 && !this.lineWalkable(pts[i].x, pts[i].z, pts[j].x, pts[j].z)) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
}

class MinHeap {
  private items: number[] = [];
  private pri: number[] = [];
  get size(): number {
    return this.items.length;
  }
  push(item: number, p: number): void {
    const it = this.items;
    const pr = this.pri;
    it.push(item);
    pr.push(p);
    let k = it.length - 1;
    while (k > 0) {
      const parent = (k - 1) >> 1;
      if (pr[parent] <= pr[k]) break;
      [it[parent], it[k]] = [it[k], it[parent]];
      [pr[parent], pr[k]] = [pr[k], pr[parent]];
      k = parent;
    }
  }
  pop(): number {
    const it = this.items;
    const pr = this.pri;
    const top = it[0];
    const li = it.pop()!;
    const lp = pr.pop()!;
    if (it.length > 0) {
      it[0] = li;
      pr[0] = lp;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < it.length && pr[l] < pr[m]) m = l;
        if (r < it.length && pr[r] < pr[m]) m = r;
        if (m === k) break;
        [it[m], it[k]] = [it[k], it[m]];
        [pr[m], pr[k]] = [pr[k], pr[m]];
        k = m;
      }
    }
    return top;
  }
}
