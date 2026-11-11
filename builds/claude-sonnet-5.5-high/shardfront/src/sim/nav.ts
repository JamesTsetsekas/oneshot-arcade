// navigation: dynamic occupancy grid, cached flow fields (Dijkstra distance fields) and walkability queries.
import type { GameMap } from './map';

const INF = 65535;
const DIRS: Array<[number, number, number]> = [
  [1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [-1, 1, 14], [1, -1, 14], [-1, -1, 14],
];

export interface Field { cost: Uint16Array; ver: number; used: number }

/** binary min-heap over packed keys (cost * 32768 + cell) held in one typed array */
class MinHeap {
  a = new Float64Array(1 << 17);
  size = 0;
  clear() { this.size = 0; }
  push(v: number) {
    if (this.size >= this.a.length) { const b = new Float64Array(this.a.length * 2); b.set(this.a); this.a = b; }
    const a = this.a;
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p] <= v) break;
      a[i] = a[p]; i = p;
    }
    a[i] = v;
  }
  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a[--this.size];
    const n = this.size;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && a[c + 1] < a[c]) c++;
        if (a[c] >= last) break;
        a[i] = a[c]; i = c;
      }
      a[i] = last;
    }
    return top;
  }
}

export class Nav {
  readonly n: number;
  /** dynamic occupancy count (structures, resource nodes, barriers) */
  occ: Uint8Array;
  version = 1;
  private fields = new Map<number, Field>();
  private heap = new MinHeap();
  budget = 0;
  counter = 0;
  constructor(public map: GameMap) {
    this.n = map.size;
    this.occ = new Uint8Array(this.n * this.n);
  }

  walkable(i: number): boolean {
    return !this.map.blocked[i] && !this.map.chasm[i] && !this.occ[i];
  }
  walkableXY(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return false;
    return this.walkable(Math.floor(y) * this.n + Math.floor(x));
  }
  staticWalkable(i: number): boolean { return !this.map.blocked[i] && !this.map.chasm[i]; }

  setFootprint(ox: number, oy: number, w: number, h: number, delta: 1 | -1) {
    for (let y = oy; y < oy + h; y++) for (let x = ox; x < ox + w; x++) {
      if (x < 0 || y < 0 || x >= this.n || y >= this.n) continue;
      const i = y * this.n + x;
      this.occ[i] = Math.max(0, this.occ[i] + delta);
    }
    this.version++;
  }

  /** circle (radius r) fits at x,y against static+dynamic blockers */
  fits(x: number, y: number, r: number): boolean {
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return false;
      if (!this.walkable(cy * this.n + cx)) return false;
    }
    return true;
  }

  /** straight-line walkability (sampled) */
  clear(ax: number, ay: number, bx: number, by: number, r = 0.35): boolean {
    const dx = bx - ax, dy = by - ay;
    const d = Math.hypot(dx, dy);
    const steps = Math.ceil(d / 0.6);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.fits(ax + dx * t, ay + dy * t, r)) return false;
    }
    return true;
  }

  nearestWalkable(x: number, y: number, maxR = 12): { x: number; y: number } | null {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (this.walkableXY(x, y)) return { x, y };
    for (let r = 1; r <= maxR; r++) {
      let best: { x: number; y: number } | null = null;
      let bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const xx = cx + dx, yy = cy + dy;
        if (xx < 0 || yy < 0 || xx >= this.n || yy >= this.n) continue;
        if (!this.walkable(yy * this.n + xx)) continue;
        const d = (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2;
        if (d < bd) { bd = d; best = { x: xx + 0.5, y: yy + 0.5 }; }
      }
      if (best) return best;
    }
    return null;
  }

  /** cells in a one-cell ring around a footprint that are walkable */
  ringCells(ox: number, oy: number, w: number, h: number): number[] {
    const out: number[] = [];
    for (let y = oy - 1; y <= oy + h; y++) for (let x = ox - 1; x <= ox + w; x++) {
      if (x >= ox && x < ox + w && y >= oy && y < oy + h) continue;
      if (x < 0 || y < 0 || x >= this.n || y >= this.n) continue;
      const i = y * this.n + x;
      if (this.walkable(i)) out.push(i);
    }
    return out;
  }

  /** Get (or compute within budget) a distance field for the given key / goal cells. */
  getField(key: number, goals: () => number[]): Field | null {
    const f = this.fields.get(key);
    if (f && f.ver === this.version) { f.used = ++this.counter; return f; }
    if (this.budget <= 0) return f ?? null; // stale field is better than nothing
    this.budget--;
    const g = goals();
    if (g.length === 0) return null;
    const nf = this.compute(g);
    nf.used = ++this.counter;
    this.fields.set(key, nf);
    if (this.fields.size > 72) {
      let oldest = -1, ou = Infinity;
      for (const [k, v] of this.fields) if (v.used < ou) { ou = v.used; oldest = k; }
      this.fields.delete(oldest);
    }
    return nf;
  }

  invalidate(key: number) { this.fields.delete(key); }

  private compute(goals: number[]): Field {
    const n = this.n;
    const cost = new Uint16Array(n * n).fill(INF);
    const h = this.heap;
    h.clear();
    for (const g of goals) { cost[g] = 0; h.push(g); }
    const map = this.map, occ = this.occ;
    while (h.size) {
      const packed = h.pop();
      const key0 = Math.floor(packed / 32768);
      const cur = packed - key0 * 32768;
      if (key0 > cost[cur]) continue;
      const cx = cur % n, cy = (cur / n) | 0;
      for (let d = 0; d < 8; d++) {
        const dx = DIRS[d][0], dy = DIRS[d][1];
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const ni = ny * n + nx;
        if (map.blocked[ni] || map.chasm[ni] || occ[ni]) continue;
        if (dx !== 0 && dy !== 0) {
          const a = cy * n + nx, b = ny * n + cx;
          if (map.blocked[a] || map.chasm[a] || occ[a] || map.blocked[b] || map.chasm[b] || occ[b]) continue;
        }
        // keep paths away from walls a little
        let pen = 0;
        if (nx > 0 && (map.blocked[ni - 1] || map.chasm[ni - 1] || occ[ni - 1])) pen += 3;
        if (nx < n - 1 && (map.blocked[ni + 1] || map.chasm[ni + 1] || occ[ni + 1])) pen += 3;
        if (ny > 0 && (map.blocked[ni - n] || map.chasm[ni - n] || occ[ni - n])) pen += 3;
        if (ny < n - 1 && (map.blocked[ni + n] || map.chasm[ni + n] || occ[ni + n])) pen += 3;
        const nc = key0 + DIRS[d][2] + pen;
        if (nc < cost[ni]) { cost[ni] = nc; h.push(nc * 32768 + ni); }
      }
    }
    return { cost, ver: this.version, used: 0 };
  }

  /** Direction (unit vector) towards lower cost; looks a couple of cells ahead for smoother motion. Returns null if no gradient. */
  dir(f: Field, x: number, y: number, out: { x: number; y: number }): boolean {
    const n = this.n;
    let cx = Math.min(n - 1, Math.max(0, Math.floor(x))), cy = Math.min(n - 1, Math.max(0, Math.floor(y)));
    let cur = f.cost[cy * n + cx];
    // unit may sit on a (now) blocked cell with INF cost: find the cheapest neighbour anyway
    let tx = x, ty = y;
    let moved = false;
    for (let step = 0; step < 3; step++) {
      let bc = cur, bx = cx, by = cy;
      for (let d = 0; d < 8; d++) {
        const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const c = f.cost[ny * n + nx];
        if (c < bc) {
          if (DIRS[d][0] !== 0 && DIRS[d][1] !== 0) {
            if (f.cost[cy * n + nx] >= INF || f.cost[ny * n + cx] >= INF) continue;
          }
          bc = c; bx = nx; by = ny;
        }
      }
      if (bx === cx && by === cy) break;
      const ttx = bx + 0.5, tty = by + 0.5;
      if (step > 0 && !this.clear(x, y, ttx, tty, 0.3)) break; // cannot cut the corner: aim at the previous cell
      cx = bx; cy = by; cur = bc;
      tx = ttx; ty = tty;
      moved = true;
    }
    if (!moved) return false;
    const dx = tx - x, dy = ty - y;
    const d = Math.hypot(dx, dy) || 1;
    out.x = dx / d; out.y = dy / d;
    return true;
  }
}
