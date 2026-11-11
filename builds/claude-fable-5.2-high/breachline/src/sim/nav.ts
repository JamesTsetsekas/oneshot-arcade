// shared-simulation: layered navigation grid baked from map collision data (pure math; no physics engine needed).
// Each XZ cell can hold several walkable layers (tunnel floor, deck, catwalk). Used by server bots and map-metric tests.
import { MapDef, Solid, solidTopAt } from '../content/mapTypes';
import { MOVE } from '../content/tuning';

const CELL = 0.5;
const AGENT_R = 0.42;
const STEP = 0.45;
const HEAD = 1.75;
const BUCKET = 4;

const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DZ = [0, 0, 1, -1, 1, -1, 1, -1];

export interface NavPoint { x: number; y: number; z: number }

export class NavGrid {
  readonly cell = CELL;
  readonly nx: number;
  readonly nz: number;
  readonly ox: number;
  readonly oz: number;
  /** node -> position */
  nodeX: Float32Array = new Float32Array(0);
  nodeY: Float32Array = new Float32Array(0);
  nodeZ: Float32Array = new Float32Array(0);
  /** 8 neighbours per node (-1 = none) */
  nbr: Int32Array = new Int32Array(0);
  /** cell -> node ids */
  cellNodes: Int32Array[] = [];
  count = 0;
  // A* scratch
  private g: Float32Array = new Float32Array(0);
  private parent: Int32Array = new Int32Array(0);
  private stamp: Uint32Array = new Uint32Array(0);
  private closed: Uint32Array = new Uint32Array(0);
  private runId = 0;
  private heap: number[] = [];
  private heapF: number[] = [];

  private constructor(map: MapDef) {
    this.ox = map.bounds.minX;
    this.oz = map.bounds.minZ;
    this.nx = Math.ceil((map.bounds.maxX - map.bounds.minX) / CELL);
    this.nz = Math.ceil((map.bounds.maxZ - map.bounds.minZ) / CELL);
  }

  static bake(map: MapDef): NavGrid {
    const nav = new NavGrid(map);
    nav.build(map);
    return nav;
  }

  private build(map: MapDef): void {
    const { nx, nz, ox, oz } = this;
    // spatial buckets of solids
    const bnx = Math.ceil((nx * CELL) / BUCKET) + 1, bnz = Math.ceil((nz * CELL) / BUCKET) + 1;
    const buckets: number[][] = Array.from({ length: bnx * bnz }, () => []);
    map.solids.forEach((s, i) => {
      const bx0 = Math.max(0, Math.floor((s.min[0] - AGENT_R - ox) / BUCKET)), bx1 = Math.min(bnx - 1, Math.floor((s.max[0] + AGENT_R - ox) / BUCKET));
      const bz0 = Math.max(0, Math.floor((s.min[2] - AGENT_R - oz) / BUCKET)), bz1 = Math.min(bnz - 1, Math.floor((s.max[2] + AGENT_R - oz) / BUCKET));
      for (let bz = bz0; bz <= bz1; bz++) for (let bx = bx0; bx <= bx1; bx++) buckets[bz * bnx + bx].push(i);
    });
    const xs: number[] = [], ys: number[] = [], zs: number[] = [];
    const cells: number[][] = Array.from({ length: nx * nz }, () => []);
    const tops: number[] = [];
    for (let cz = 0; cz < nz; cz++) {
      for (let cx = 0; cx < nx; cx++) {
        const x = ox + (cx + 0.5) * CELL, z = oz + (cz + 0.5) * CELL;
        const list = buckets[Math.floor((z - oz) / BUCKET) * bnx + Math.floor((x - ox) / BUCKET)];
        tops.length = 0;
        for (const si of list) {
          const s = map.solids[si];
          if (s.mat === 'boundary' || s.mat === 'glass' || s.mat === 'rail') continue;
          if (!footprintContains(s, x, z)) continue;
          if (Math.min(s.max[0] - s.min[0], s.max[2] - s.min[2]) < 0.6) continue; // do not walk along wall tops / sheet rails
          const y = solidTopAt(s, x, z);
          if (y > 12) continue;
          let dup = false;
          for (const t of tops) if (Math.abs(t - y) < 0.05) { dup = true; break; }
          if (!dup) tops.push(y);
        }
        for (const y of tops) {
          let blocked = false;
          for (const si of list) {
            if (columnHits(map.solids[si], x, z, y + STEP, y + HEAD)) { blocked = true; break; }
          }
          if (blocked) continue;
          cells[cz * nx + cx].push(xs.length);
          xs.push(x); ys.push(y); zs.push(z);
        }
      }
    }
    // neighbours
    const n0 = xs.length;
    const nbr0 = new Int32Array(n0 * 8).fill(-1);
    const find = (cx: number, cz: number, y: number, tol: number): number => {
      if (cx < 0 || cz < 0 || cx >= nx || cz >= nz) return -1;
      let best = -1, bd = tol;
      for (const id of cells[cz * nx + cx]) {
        const d = Math.abs(ys[id] - y);
        if (d <= bd) { bd = d; best = id; }
      }
      return best;
    };
    for (let cz = 0; cz < nz; cz++) {
      for (let cx = 0; cx < nx; cx++) {
        for (const id of cells[cz * nx + cx]) {
          for (let d = 0; d < 4; d++) nbr0[id * 8 + d] = find(cx + DX[d], cz + DZ[d], ys[id], STEP);
        }
      }
    }
    for (let cz = 0; cz < nz; cz++) {
      for (let cx = 0; cx < nx; cx++) {
        for (const id of cells[cz * nx + cx]) {
          for (let d = 4; d < 8; d++) {
            const a = find(cx + DX[d], cz, ys[id], STEP), b = find(cx, cz + DZ[d], ys[id], STEP);
            if (a < 0 || b < 0) continue;
            nbr0[id * 8 + d] = find(cx + DX[d], cz + DZ[d], ys[id], STEP * 1.3);
          }
        }
      }
    }
    // keep only the largest connected component so every node is mutually reachable
    const comp = new Int32Array(n0).fill(-1);
    let bestComp = -1, bestSize = 0, nComp = 0;
    const stack: number[] = [];
    for (let i = 0; i < n0; i++) {
      if (comp[i] >= 0) continue;
      let size = 0;
      stack.push(i); comp[i] = nComp;
      while (stack.length) {
        const n = stack.pop()!;
        size++;
        for (let d = 0; d < 8; d++) {
          const m = nbr0[n * 8 + d];
          if (m >= 0 && comp[m] < 0) { comp[m] = nComp; stack.push(m); }
        }
      }
      if (size > bestSize) { bestSize = size; bestComp = nComp; }
      nComp++;
    }
    const remap = new Int32Array(n0).fill(-1);
    let n = 0;
    for (let i = 0; i < n0; i++) if (comp[i] === bestComp) remap[i] = n++;
    this.count = n;
    this.nodeX = new Float32Array(n); this.nodeY = new Float32Array(n); this.nodeZ = new Float32Array(n);
    this.nbr = new Int32Array(n * 8).fill(-1);
    for (let i = 0; i < n0; i++) {
      const j = remap[i];
      if (j < 0) continue;
      this.nodeX[j] = xs[i]; this.nodeY[j] = ys[i]; this.nodeZ[j] = zs[i];
      for (let d = 0; d < 8; d++) { const m = nbr0[i * 8 + d]; this.nbr[j * 8 + d] = m >= 0 ? remap[m] : -1; }
    }
    this.cellNodes = cells.map((c) => Int32Array.from(c.map((i) => remap[i]).filter((i) => i >= 0)));
    this.g = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.stamp = new Uint32Array(n);
    this.closed = new Uint32Array(n);
  }

  private cellOf(x: number, z: number): number {
    const cx = Math.floor((x - this.ox) / CELL), cz = Math.floor((z - this.oz) / CELL);
    if (cx < 0 || cz < 0 || cx >= this.nx || cz >= this.nz) return -1;
    return cz * this.nx + cx;
  }

  /** Node in the cell under (x,z) whose height is within tol of y, or -1. */
  nodeExact(x: number, y: number, z: number, tol = 0.7): number {
    const c = this.cellOf(x, z);
    if (c < 0) return -1;
    let best = -1, bd = tol;
    const arr = this.cellNodes[c];
    for (let i = 0; i < arr.length; i++) {
      const d = Math.abs(this.nodeY[arr[i]] - y);
      if (d <= bd) { bd = d; best = arr[i]; }
    }
    return best;
  }

  /** Nearest node to a world position (searches outward a few cells; prefers similar height). */
  nearest(x: number, y: number, z: number, maxR = 6): number {
    const exact = this.nodeExact(x, y, z, 0.9);
    if (exact >= 0) return exact;
    const cx0 = Math.floor((x - this.ox) / CELL), cz0 = Math.floor((z - this.oz) / CELL);
    let best = -1, bd = Infinity;
    const maxRing = Math.ceil(maxR / CELL);
    for (let r = 0; r <= maxRing; r++) {
      if (best >= 0 && r * CELL > Math.sqrt(bd) + CELL) break;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const cx = cx0 + dx, cz = cz0 + dz;
          if (cx < 0 || cz < 0 || cx >= this.nx || cz >= this.nz) continue;
          const arr = this.cellNodes[cz * this.nx + cx];
          for (let i = 0; i < arr.length; i++) {
            const id = arr[i];
            const ddx = this.nodeX[id] - x, ddy = (this.nodeY[id] - y) * 2.2, ddz = this.nodeZ[id] - z;
            const d = ddx * ddx + ddy * ddy + ddz * ddz;
            if (d < bd) { bd = d; best = id; }
          }
        }
      }
    }
    return best;
  }

  point(node: number): NavPoint { return { x: this.nodeX[node], y: this.nodeY[node], z: this.nodeZ[node] }; }

  /** A* over the grid. extraCost lets bots avoid danger heat. Returns node ids from start to goal, or null. */
  findPath(start: number, goal: number, extraCost?: (x: number, z: number) => number, maxExpand = 40000): number[] | null {
    if (start < 0 || goal < 0) return null;
    if (start === goal) return [start];
    const run = ++this.runId;
    const { g, parent, stamp, closed, nodeX, nodeY, nodeZ, nbr } = this;
    const heap = this.heap, heapF = this.heapF;
    heap.length = 0; heapF.length = 0;
    const gx = nodeX[goal], gy = nodeY[goal], gz = nodeZ[goal];
    const h = (n: number): number => {
      const dx = Math.abs(nodeX[n] - gx), dz = Math.abs(nodeZ[n] - gz);
      return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz) + Math.abs(nodeY[n] - gy) * 1.5;
    };
    const push = (n: number, f: number) => {
      let i = heap.length;
      heap.push(n); heapF.push(f);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heapF[p] <= f) break;
        heap[i] = heap[p]; heapF[i] = heapF[p];
        i = p;
      }
      heap[i] = n; heapF[i] = f;
    };
    const pop = (): number => {
      const top = heap[0];
      const n = heap.pop()!, f = heapF.pop()!;
      const len = heap.length;
      if (len > 0) {
        let i = 0;
        for (;;) {
          let c = i * 2 + 1;
          if (c >= len) break;
          if (c + 1 < len && heapF[c + 1] < heapF[c]) c++;
          if (heapF[c] >= f) break;
          heap[i] = heap[c]; heapF[i] = heapF[c];
          i = c;
        }
        heap[i] = n; heapF[i] = f;
      }
      return top;
    };
    g[start] = 0; parent[start] = -1; stamp[start] = run;
    push(start, h(start));
    let expanded = 0;
    while (heap.length) {
      const cur = pop();
      if (closed[cur] === run) continue;
      closed[cur] = run;
      if (cur === goal) {
        const path: number[] = [];
        for (let n = cur; n >= 0; n = parent[n]) path.push(n);
        return path.reverse();
      }
      if (++expanded > maxExpand) return null;
      const base = cur * 8;
      for (let d = 0; d < 8; d++) {
        const m = nbr[base + d];
        if (m < 0 || closed[m] === run) continue;
        let step = d < 4 ? CELL : CELL * Math.SQRT2;
        step += Math.abs(nodeY[m] - nodeY[cur]) * 0.5;
        if (extraCost) step += extraCost(nodeX[m], nodeZ[m]) * CELL;
        const ng = g[cur] + step;
        if (stamp[m] !== run || ng < g[m]) {
          g[m] = ng; parent[m] = cur; stamp[m] = run;
          push(m, ng + h(m));
        }
      }
    }
    return null;
  }

  /** Straight walkable line between two nodes (stays on connected, clearance-checked cells). */
  lineWalkable(a: number, b: number): boolean {
    const ax = this.nodeX[a], az = this.nodeZ[a], bx = this.nodeX[b], bz = this.nodeZ[b];
    const dx = bx - ax, dz = bz - az;
    const len = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.ceil(len / 0.2);
    let y = this.nodeY[a];
    let prev = a;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const n = this.nodeExact(ax + dx * t, y, az + dz * t, 0.5);
      if (n < 0) return false;
      if (n !== prev) {
        // must be a real neighbour link (prevents cutting across unlinked height seams and diagonal corner cuts)
        let linked = false;
        for (let d = 0; d < 8; d++) if (this.nbr[prev * 8 + d] === n) { linked = true; break; }
        if (!linked) return false;
        prev = n;
      }
      y = this.nodeY[n];
    }
    return prev === b;
  }

  /** String-pull a node path into a short list of waypoints. */
  smooth(path: number[]): NavPoint[] {
    const out: NavPoint[] = [];
    let i = 0;
    while (i < path.length - 1) {
      let j = Math.min(path.length - 1, i + 40);
      while (j > i + 1 && !this.lineWalkable(path[i], path[j])) j = i + Math.max(1, Math.floor((j - i) * 0.6));
      out.push(this.point(path[j]));
      i = j;
    }
    if (out.length === 0 && path.length) out.push(this.point(path[path.length - 1]));
    return out;
  }

  /** Path length in metres along a node path. */
  pathLength(path: number[]): number {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      len += Math.hypot(this.nodeX[b] - this.nodeX[a], this.nodeZ[b] - this.nodeZ[a], this.nodeY[b] - this.nodeY[a]);
    }
    return len;
  }

  isWalkable(x: number, y: number, z: number): boolean { return this.nodeExact(x, y, z, 0.7) >= 0; }

  /** Random node within [rMin, rMax] metres (XZ) of a point. u1,u2 are uniform randoms. */
  randomNear(x: number, y: number, z: number, rMin: number, rMax: number, u1: number, u2: number): number {
    const ang = u1 * Math.PI * 2, r = rMin + (rMax - rMin) * u2;
    return this.nearest(x + Math.cos(ang) * r, y, z + Math.sin(ang) * r, 3);
  }
}

function footprintContains(s: Solid, x: number, z: number): boolean {
  if (x < s.min[0] || x > s.max[0] || z < s.min[2] || z > s.max[2]) return false;
  if (s.kind === 'cyl') {
    const cx = (s.min[0] + s.max[0]) / 2, cz = (s.min[2] + s.max[2]) / 2, r = (s.max[0] - s.min[0]) / 2;
    return (x - cx) * (x - cx) + (z - cz) * (z - cz) <= r * r;
  }
  return true;
}

/** Does a solid intersect the agent column (square of half-width AGENT_R) between y0 and y1? */
function columnHits(s: Solid, x: number, z: number, y0: number, y1: number): boolean {
  if (s.min[1] >= y1 || s.max[1] <= y0) return false;
  const ax0 = x - AGENT_R, ax1 = x + AGENT_R, az0 = z - AGENT_R, az1 = z + AGENT_R;
  if (s.max[0] <= ax0 || s.min[0] >= ax1 || s.max[2] <= az0 || s.min[2] >= az1) return false;
  if (s.kind === 'box') return true;
  if (s.kind === 'cyl') {
    const cx = (s.min[0] + s.max[0]) / 2, cz = (s.min[2] + s.max[2]) / 2, r = (s.max[0] - s.min[0]) / 2;
    const nxp = Math.max(ax0, Math.min(cx, ax1)), nzp = Math.max(az0, Math.min(cz, az1));
    return (nxp - cx) * (nxp - cx) + (nzp - cz) * (nzp - cz) < r * r;
  }
  // ramp: highest surface point inside the overlap rectangle
  const ox0 = Math.max(ax0, s.min[0]), ox1 = Math.min(ax1, s.max[0]), oz0 = Math.max(az0, s.min[2]), oz1 = Math.min(az1, s.max[2]);
  const top = Math.max(solidTopAt(s, ox0, oz0), solidTopAt(s, ox1, oz0), solidTopAt(s, ox0, oz1), solidTopAt(s, ox1, oz1));
  return top > y0;
}

export const NAV_AGENT_HEIGHT = MOVE.standH;
