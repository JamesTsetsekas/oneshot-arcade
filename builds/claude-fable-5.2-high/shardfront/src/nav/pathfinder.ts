// navigation: deterministic grid A* with string-pulling over a dynamic occupancy grid.
// The grid is owned by the simulation; this class only reads it.

const SQRT2 = 1.4142135623730951;

export class Pathfinder {
  readonly size: number;
  readonly blocked: Uint8Array;
  private g: Float32Array;
  private f: Float32Array;
  private parent: Int32Array;
  private stamp: Uint32Array;
  private closed: Uint32Array;
  private heap: number[] = [];
  private searchId = 0;
  /** statistics for the debug panel / benchmarks */
  searches = 0;
  expanded = 0;

  constructor(size: number, blocked: Uint8Array) {
    this.size = size;
    this.blocked = blocked;
    const n = size * size;
    this.g = new Float32Array(n);
    this.f = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.stamp = new Uint32Array(n);
    this.closed = new Uint32Array(n);
  }

  isFree(x: number, z: number): boolean {
    const S = this.size;
    if (x < 0 || z < 0 || x >= S || z >= S) return false;
    return this.blocked[(z | 0) * S + (x | 0)] === 0;
  }

  /** Nearest unblocked cell index to a point (spiral search), or -1. */
  nearestFree(x: number, z: number, maxR = 12): number {
    const S = this.size;
    const cx = Math.min(S - 1, Math.max(0, x | 0)), cz = Math.min(S - 1, Math.max(0, z | 0));
    if (this.blocked[cz * S + cx] === 0) return cz * S + cx;
    let best = -1, bestD = 1e9;
    for (let r = 1; r <= maxR; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const nx = cx + dx, nz = cz + dz;
          if (nx < 0 || nz < 0 || nx >= S || nz >= S) continue;
          if (this.blocked[nz * S + nx] !== 0) continue;
          const ddx = nx + 0.5 - x, ddz = nz + 0.5 - z;
          const d = ddx * ddx + ddz * ddz;
          if (d < bestD) { bestD = d; best = nz * S + nx; }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  /** True when a unit can walk the straight segment (sampled with a small lateral margin). */
  lineFree(x0: number, z0: number, x1: number, z1: number, margin = 0.42): boolean {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1e-4) return this.isFree(x0, z0);
    const steps = Math.ceil(len / 0.45);
    const nx = (-dz / len) * margin, nz = (dx / len) * margin;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + dx * t, z = z0 + dz * t;
      if (!this.isFree(x, z) || !this.isFree(x + nx, z + nz) || !this.isFree(x - nx, z - nz)) return false;
    }
    return true;
  }

  private push(i: number): void {
    const h = this.heap, f = this.f;
    let k = h.length;
    h.push(i);
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (f[h[p]] <= f[i]) break;
      h[k] = h[p]; k = p;
    }
    h[k] = i;
  }

  private pop(): number {
    const h = this.heap, f = this.f;
    const top = h[0];
    const last = h.pop() as number;
    const n = h.length;
    if (n > 0) {
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= n) break;
        if (c + 1 < n && f[h[c + 1]] < f[h[c]]) c++;
        if (f[h[c]] >= f[last]) break;
        h[k] = h[c]; k = c;
      }
      h[k] = last;
    }
    return top;
  }

  /**
   * Find a path from (sx,sz) to within `reach` of the square of half-extent `half` centred on (gx,gz).
   * Returns a flat [x,z,...] waypoint list (start excluded). Unreachable goals return the best partial path.
   */
  findPath(sx: number, sz: number, gx: number, gz: number, half = 0, reach = 0, maxExpand = 14000): number[] {
    const S = this.size, blocked = this.blocked;
    this.searches++;
    const start = this.nearestFree(sx, sz, 8);
    if (start < 0) return [];
    let goalCell = -1;
    const useReach = half > 0 || reach > 0.8;
    const reachR = Math.max(reach * 0.85, 0.75);
    if (!useReach) {
      gx = Math.min(S - 0.01, Math.max(0, gx)); gz = Math.min(S - 0.01, Math.max(0, gz));
      goalCell = this.nearestFree(gx, gz, 14);
      if (goalCell < 0) return [];
      const gcx = goalCell % S, gcz = (goalCell / S) | 0;
      if ((gx | 0) !== gcx || (gz | 0) !== gcz) { gx = gcx + 0.5; gz = gcz + 0.5; }
      if (goalCell === start) return [gx, gz];
    }
    const id = ++this.searchId;
    const g = this.g, f = this.f, parent = this.parent, stamp = this.stamp, closed = this.closed;
    this.heap.length = 0;
    const hCost = (i: number): number => {
      const dx = Math.abs((i % S) + 0.5 - gx), dz = Math.abs(((i / S) | 0) + 0.5 - gz);
      const a = Math.max(0, dx - half), b = Math.max(0, dz - half);
      return (a > b ? a + b * (SQRT2 - 1) : b + a * (SQRT2 - 1)) * 1.001;
    };
    g[start] = 0; f[start] = hCost(start); parent[start] = -1; stamp[start] = id;
    this.push(start);
    let best = start, bestH = f[start], found = -1, count = 0;
    while (this.heap.length > 0) {
      const cur = this.pop();
      if (closed[cur] === id) continue;
      closed[cur] = id;
      const cx = cur % S, cz = (cur / S) | 0;
      if (useReach) {
        const a = Math.max(0, Math.abs(cx + 0.5 - gx) - half), b = Math.max(0, Math.abs(cz + 0.5 - gz) - half);
        if (a * a + b * b <= reachR * reachR) { found = cur; break; }
      } else if (cur === goalCell) { found = cur; break; }
      const hh = f[cur] - g[cur];
      if (hh < bestH) { bestH = hh; best = cur; }
      if (++count > maxExpand) break;
      for (let dz = -1; dz <= 1; dz++) {
        const nz = cz + dz;
        if (nz < 0 || nz >= S) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dz === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= S) continue;
          const ni = nz * S + nx;
          if (blocked[ni] !== 0 || closed[ni] === id) continue;
          if (dx !== 0 && dz !== 0 && (blocked[cz * S + nx] !== 0 || blocked[nz * S + cx] !== 0)) continue;
          const ng = g[cur] + (dx !== 0 && dz !== 0 ? SQRT2 : 1);
          if (stamp[ni] !== id || ng < g[ni]) {
            g[ni] = ng; f[ni] = ng + hCost(ni); parent[ni] = cur; stamp[ni] = id;
            this.push(ni);
          }
        }
      }
    }
    this.expanded += count;
    const end = found >= 0 ? found : best;
    // reconstruct cell centres
    const cells: number[] = [];
    for (let c = end; c !== -1 && c !== start; c = parent[c]) cells.push(c);
    cells.reverse();
    if (cells.length === 0) return found >= 0 && !useReach ? [gx, gz] : [];
    const pts: number[] = [];
    for (const c of cells) pts.push((c % S) + 0.5, ((c / S) | 0) + 0.5);
    if (found >= 0 && !useReach) { pts[pts.length - 2] = gx; pts[pts.length - 1] = gz; }
    // string pulling
    const out: number[] = [];
    let ax = sx, az = sz;
    if (!this.isFree(ax, az)) { ax = (start % S) + 0.5; az = ((start / S) | 0) + 0.5; out.push(ax, az); }
    const n = pts.length / 2;
    let i = 0;
    while (i < n) {
      let j = Math.min(n - 1, i + 18);
      while (j > i && !this.lineFree(ax, az, pts[j * 2], pts[j * 2 + 1])) j--;
      ax = pts[j * 2]; az = pts[j * 2 + 1];
      out.push(ax, az);
      i = j + 1;
    }
    return out;
  }

  /** Path length helper used by map-fairness validation. */
  pathLength(sx: number, sz: number, gx: number, gz: number, half = 0, reach = 0): number {
    const p = this.findPath(sx, sz, gx, gz, half, reach, 60000);
    let len = 0, x = sx, z = sz;
    for (let i = 0; i < p.length; i += 2) {
      len += Math.sqrt((p[i] - x) ** 2 + (p[i + 1] - z) ** 2);
      x = p[i]; z = p[i + 1];
    }
    return len;
  }
}
