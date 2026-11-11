// Navigation for server bots. Two levels:
//  - fine: 1 m grid flood-filled through the *real* collision rules (step height, wall clearance, wading/swim),
//          so every walkable cell is provably reachable from the island interior;
//  - coarse: 16 m grid used to plan long routes, refined with bounded fine A* toward the next waypoint.
import type { World } from "./collision";

export const NAV_HALF = 640;
const N = NAV_HALF * 2;
const CO = 16;
const CN = N / CO;

export const NavFlag = { None: 0, Walk: 1, Swim: 2 } as const;

class Heap {
  private ids: Int32Array;
  private keys: Float32Array;
  size = 0;
  constructor(cap: number) {
    this.ids = new Int32Array(cap);
    this.keys = new Float32Array(cap);
  }
  clear(): void {
    this.size = 0;
  }
  push(id: number, key: number): void {
    if (this.size >= this.ids.length) {
      const ni = new Int32Array(this.ids.length * 2);
      ni.set(this.ids);
      this.ids = ni;
      const nk = new Float32Array(this.keys.length * 2);
      nk.set(this.keys);
      this.keys = nk;
    }
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p]! <= key) break;
      this.ids[i] = this.ids[p]!;
      this.keys[i] = this.keys[p]!;
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }
  pop(): number {
    const top = this.ids[0]!;
    const n = --this.size;
    if (n > 0) {
      const id = this.ids[n]!,
        key = this.keys[n]!;
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= n) break;
        if (c + 1 < n && this.keys[c + 1]! < this.keys[c]!) c++;
        if (this.keys[c]! >= key) break;
        this.ids[i] = this.ids[c]!;
        this.keys[i] = this.keys[c]!;
        i = c;
      }
      this.ids[i] = id;
      this.keys[i] = key;
    }
    return top;
  }
}

export class NavGrid {
  readonly flags = new Uint8Array(N * N);
  readonly h = new Float32Array(N * N);
  private gen = new Uint32Array(N * N);
  private g = new Float32Array(N * N);
  private parent = new Int32Array(N * N);
  private curGen = 0;
  private heap = new Heap(4096);
  private coarseCost = new Float32Array(CN * CN);
  private coarseRep = new Int32Array(CN * CN).fill(-1);
  walkCount = 0;

  constructor(private world: World, seeds: [number, number][], private avoid: { x: number; z: number; hx: number; hz: number; yaw: number }[] = []) {
    this.flood(seeds);
    this.buildCoarse();
  }

  private ci(x: number): number {
    return Math.floor(x + NAV_HALF);
  }
  inBounds(x: number, z: number): boolean {
    return x > -NAV_HALF + 1 && x < NAV_HALF - 1 && z > -NAV_HALF + 1 && z < NAV_HALF - 1;
  }
  index(x: number, z: number): number {
    return this.ci(z) * N + this.ci(x);
  }
  cellX(i: number): number {
    return (i % N) - NAV_HALF + 0.5;
  }
  cellZ(i: number): number {
    return Math.floor(i / N) - NAV_HALF + 0.5;
  }
  flagAt(x: number, z: number): number {
    if (!this.inBounds(x, z)) return 0;
    return this.flags[this.index(x, z)]!;
  }
  walkableAt(x: number, z: number): boolean {
    return this.flagAt(x, z) === NavFlag.Walk;
  }
  heightAt(x: number, z: number): number {
    if (!this.inBounds(x, z)) return 0;
    return this.h[this.index(x, z)]!;
  }

  private flood(seeds: [number, number][]): void {
    const w = this.world;
    const queue = new Int32Array(N * N);
    let head = 0,
      tail = 0;
    for (const [sx, sz] of seeds) {
      // find a free dry cell near the seed
      for (let r = 0; r < 40; r += 2) {
        let placed = false;
        for (let a = 0; a < 8 && !placed; a++) {
          const x = sx + Math.sin(a * 0.785) * r,
            z = sz + Math.cos(a * 0.785) * r;
          if (!this.inBounds(x, z)) continue;
          const th = w.terrain(x, z);
          if (th < 0.5 || w.blocked(x, z, 0.45, th + 0.5, th + 1.7)) continue;
          const i = this.index(x, z);
          if (!this.flags[i]) {
            this.flags[i] = NavFlag.Walk;
            this.h[i] = th;
            queue[tail++] = i;
          }
          placed = true;
        }
        if (placed) break;
      }
    }
    const dirs = [1, -1, N, -N];
    while (head < tail) {
      const cur = queue[head++]!;
      const curSwim = this.flags[cur] === NavFlag.Swim;
      const curH = curSwim ? -0.75 : this.h[cur]!;
      const cx = cur % N,
        cz = (cur / N) | 0;
      for (let d = 0; d < 4; d++) {
        const ni = cur + dirs[d]!;
        const nx = ni % N,
          nz = (ni / N) | 0;
        if (nx < 1 || nz < 1 || nx >= N - 1 || nz >= N - 1) continue;
        if (Math.abs(nx - cx) + Math.abs(nz - cz) !== 1) continue;
        if (this.flags[ni]) continue;
        const x = nx - NAV_HALF + 0.5,
          z = nz - NAV_HALF + 0.5;
        const th = w.terrain(x, z);
        let nh = th;
        let boxSupport = false;
        const dense = w.hasBoxesNear(x, z);
        if (dense) {
          nh = w.support(x, z, 0.3, curH + 0.5);
          boxSupport = w.supportBox >= 0;
        }
        if (nh < -1.1) {
          // deep water: swim cell
          if (curH > 0.6) continue;
          if (dense && w.blocked(x, z, 0.42, -1.0, 0.6)) continue;
          this.flags[ni] = NavFlag.Swim;
          this.h[ni] = -1.2;
          queue[tail++] = ni;
          continue;
        }
        const up = nh - curH;
        if (up > (boxSupport ? 0.5 : 0.95) || up < -0.95) continue;
        if (dense && w.blocked(x, z, 0.42, nh + 0.5, nh + 1.7)) continue;
        let hazard = false;
        for (const hz of this.avoid) {
          const ddx = x - hz.x,
            ddz = z - hz.z;
          if (Math.abs(ddx) > 40 || Math.abs(ddz) > 40) continue;
          const c = Math.cos(hz.yaw),
            s = Math.sin(hz.yaw);
          if (Math.abs(ddx * c - ddz * s) < hz.hx + 0.6 && Math.abs(ddx * s + ddz * c) < hz.hz + 0.6 && Math.abs(nh - w.terrain(x, z)) < 0.2) hazard = true;
        }
        if (hazard) continue;
        this.flags[ni] = NavFlag.Walk;
        this.h[ni] = nh;
        queue[tail++] = ni;
      }
    }
    let count = 0;
    for (let i = 0; i < this.flags.length; i++) if (this.flags[i] === NavFlag.Walk) count++;
    this.walkCount = count;
  }

  private buildCoarse(): void {
    for (let cz = 0; cz < CN; cz++)
      for (let cx = 0; cx < CN; cx++) {
        let walk = 0,
          swim = 0;
        let best = -1,
          bestD = 1e9;
        for (let dz = 0; dz < CO; dz++)
          for (let dx = 0; dx < CO; dx++) {
            const i = (cz * CO + dz) * N + cx * CO + dx;
            const f = this.flags[i]!;
            if (f === NavFlag.Walk) {
              walk++;
              const d = Math.abs(dx - 7.5) + Math.abs(dz - 7.5);
              if (d < bestD) {
                bestD = d;
                best = i;
              }
            } else if (f === NavFlag.Swim) {
              swim++;
              if (best < 0) best = i;
            }
          }
        const frac = (walk + swim * 0.25) / (CO * CO);
        const c = cz * CN + cx;
        this.coarseCost[c] = frac < 0.12 ? Infinity : 1 / Math.min(1, frac + 0.15);
        this.coarseRep[c] = best;
      }
  }

  /** Nearest walkable (dry) cell centre within maxR metres, or null. */
  nearestWalkable(x: number, z: number, maxR: number, allowSwim = false): [number, number] | null {
    if (!this.inBounds(x, z)) {
      const k = (NAV_HALF - 2) / Math.max(Math.abs(x), Math.abs(z));
      x *= k;
      z *= k;
    }
    const ok = (f: number): boolean => f === NavFlag.Walk || (allowSwim && f === NavFlag.Swim);
    const bx = this.ci(x),
      bz = this.ci(z);
    if (ok(this.flags[bz * N + bx]!)) return [bx - NAV_HALF + 0.5, bz - NAV_HALF + 0.5];
    for (let r = 1; r <= maxR; r++) {
      let best = -1,
        bd = 1e9;
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const xx = bx + dx,
            zz = bz + dz;
          if (xx < 1 || zz < 1 || xx >= N - 1 || zz >= N - 1) continue;
          if (ok(this.flags[zz * N + xx]!)) {
            const d = dx * dx + dz * dz;
            if (d < bd) {
              bd = d;
              best = zz * N + xx;
            }
          }
        }
      if (best >= 0) return [this.cellX(best), this.cellZ(best)];
    }
    return null;
  }

  private edgeOk(a: number, b: number): boolean {
    const fb = this.flags[b]!;
    if (!fb) return false;
    const fa = this.flags[a]!;
    if (fa === NavFlag.Swim || fb === NavFlag.Swim) return true;
    return Math.abs(this.h[a]! - this.h[b]!) <= 1.0;
  }

  /** True when a straight walk between two points stays on connected walkable cells. */
  lineWalkable(ax: number, az: number, bx: number, bz: number): boolean {
    const dx = bx - ax,
      dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) return true;
    const steps = Math.ceil(len / 0.45);
    const px = (-dz / len) * 0.38,
      pz = (dx / len) * 0.38;
    let prev = this.index(ax, az);
    if (!this.flags[prev]) return false;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = ax + dx * t,
        z = az + dz * t;
      if (!this.inBounds(x, z)) return false;
      const i = this.index(x, z);
      if (i !== prev) {
        if (!this.edgeOk(prev, i)) return false;
        prev = i;
      }
      if (!this.flags[this.index(x + px, z + pz)] || !this.flags[this.index(x - px, z - pz)]) return false;
    }
    return true;
  }

  /**
   * Bounded A* on the fine grid. Returns smoothed waypoints as a flat [x,z,...] array (excluding the start),
   * or null if no path was found within the expansion budget.
   */
  finePath(sx: number, sz: number, gx: number, gz: number, maxExpand = 9000): number[] | null {
    const s = this.nearestWalkable(sx, sz, 5, true);
    const gl = this.nearestWalkable(gx, gz, 8, true);
    if (!s || !gl) return null;
    const start = this.index(s[0], s[1]);
    const goal = this.index(gl[0], gl[1]);
    if (start === goal) return [gl[0], gl[1]];
    const gen = ++this.curGen;
    const heap = this.heap;
    heap.clear();
    const gxi = goal % N,
      gzi = (goal / N) | 0;
    const hfun = (i: number): number => {
      const dx = Math.abs((i % N) - gxi),
        dz = Math.abs(((i / N) | 0) - gzi);
      return (dx > dz ? dx + dz * 0.4142 : dz + dx * 0.4142) * 1.02;
    };
    this.gen[start] = gen;
    this.g[start] = 0;
    this.parent[start] = -1;
    heap.push(start, hfun(start));
    let expanded = 0;
    let found = false;
    const flags = this.flags;
    while (heap.size > 0) {
      const cur = heap.pop();
      if (cur === goal) {
        found = true;
        break;
      }
      if (++expanded > maxExpand) break;
      const gc = this.g[cur]!;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const ni = cur + dz * N + dx;
          if (ni < 0 || ni >= N * N || !flags[ni]) continue;
          if (!this.edgeOk(cur, ni)) continue;
          if (dx && dz) {
            // no corner cutting
            if (!this.edgeOk(cur, cur + dx) || !this.edgeOk(cur, cur + dz * N)) continue;
          }
          const cost = (dx && dz ? 1.4142 : 1) * (flags[ni] === NavFlag.Swim ? 2.6 : 1);
          const ng = gc + cost;
          if (this.gen[ni] === gen && this.g[ni]! <= ng) continue;
          this.gen[ni] = gen;
          this.g[ni] = ng;
          this.parent[ni] = cur;
          heap.push(ni, ng + hfun(ni));
        }
    }
    if (!found) return null;
    const cells: number[] = [];
    for (let c = goal; c !== -1; c = this.parent[c]!) cells.push(c);
    cells.reverse();
    // string pulling
    const out: number[] = [];
    let anchor = 0;
    while (anchor < cells.length - 1) {
      let far = anchor + 1;
      const ax = this.cellX(cells[anchor]!),
        az = this.cellZ(cells[anchor]!);
      for (let j = Math.min(cells.length - 1, anchor + 40); j > anchor + 1; j--) {
        if (this.lineWalkable(ax, az, this.cellX(cells[j]!), this.cellZ(cells[j]!))) {
          far = j;
          break;
        }
      }
      out.push(this.cellX(cells[far]!), this.cellZ(cells[far]!));
      anchor = far;
    }
    return out;
  }

  /** Long-range plan on the coarse grid: flat [x,z,...] of representative waypoints, or null. */
  coarsePath(sx: number, sz: number, gx: number, gz: number): number[] | null {
    const cc = (v: number): number => Math.max(0, Math.min(CN - 1, Math.floor((v + NAV_HALF) / CO)));
    const start = cc(sz) * CN + cc(sx);
    const goal = cc(gz) * CN + cc(gx);
    const g = new Float32Array(CN * CN).fill(Infinity);
    const parent = new Int32Array(CN * CN).fill(-1);
    const heap = new Heap(256);
    g[start] = 0;
    heap.push(start, 0);
    const gxi = goal % CN,
      gzi = (goal / CN) | 0;
    let found = false;
    while (heap.size > 0) {
      const cur = heap.pop();
      if (cur === goal) {
        found = true;
        break;
      }
      const cx = cur % CN,
        cz = (cur / CN) | 0;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const nx = cx + dx,
            nz = cz + dz;
          if (nx < 0 || nz < 0 || nx >= CN || nz >= CN) continue;
          const ni = nz * CN + nx;
          let cost = this.coarseCost[ni]!;
          if (cost === Infinity) {
            if (ni !== goal) continue;
            cost = 4;
          }
          const ng = g[cur]! + cost * (dx && dz ? 1.4142 : 1);
          if (ng >= g[ni]!) continue;
          g[ni] = ng;
          parent[ni] = cur;
          heap.push(ni, ng + Math.hypot(nx - gxi, nz - gzi));
        }
    }
    if (!found) return null;
    const out: number[] = [];
    const chain: number[] = [];
    for (let c = goal; c !== -1 && c !== start; c = parent[c]!) chain.push(c);
    chain.reverse();
    for (const c of chain) {
      const rep = this.coarseRep[c]!;
      if (rep >= 0) out.push(this.cellX(rep), this.cellZ(rep));
    }
    return out;
  }
}
