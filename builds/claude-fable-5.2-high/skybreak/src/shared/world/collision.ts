// Lightweight world collision shared by the authoritative sim, bots, camera and tools.
// The gameplay world is a heightfield plus yaw-rotated boxes in a uniform grid. Render assets never appear here.

export const WORLD_HALF = 800;
const CELL = 8;
const GRID_N = (WORLD_HALF * 2) / CELL;

export const BoxFlag = { Solid: 1, NoRender: 2 } as const;
export const Surf = { Stone: 0, Wood: 1, Metal: 2, Fabric: 3 } as const;

export interface Box {
  x: number;
  y: number;
  z: number;
  hx: number;
  hy: number;
  hz: number;
  yaw: number;
  c: number;
  s: number;
  color: number;
  surf: number;
  flags: number;
}

export function makeBox(
  x: number, y: number, z: number, hx: number, hy: number, hz: number, yaw: number,
  color: number, surf: number, flags: number,
): Box {
  return { x, y, z, hx, hy, hz, yaw, c: Math.cos(yaw), s: Math.sin(yaw), color, surf, flags };
}

export class Heightfield {
  readonly n: number;
  readonly data: Float32Array;
  maxH = 0;
  constructor(readonly half: number, readonly cell: number) {
    this.n = Math.round((half * 2) / cell) + 1;
    this.data = new Float32Array(this.n * this.n);
  }
  height(x: number, z: number): number {
    const n = this.n;
    let fx = (x + this.half) / this.cell;
    let fz = (z + this.half) / this.cell;
    if (fx < 0) fx = 0;
    else if (fx > n - 1.001) fx = n - 1.001;
    if (fz < 0) fz = 0;
    else if (fz > n - 1.001) fz = n - 1.001;
    const ix = fx | 0,
      iz = fz | 0;
    const tx = fx - ix,
      tz = fz - iz;
    const i = iz * n + ix;
    const d = this.data;
    const a = d[i]!,
      b = d[i + 1]!,
      c = d[i + n]!,
      e = d[i + n + 1]!;
    return a + (b - a) * tx + (c - a) * tz + (a - b - c + e) * tx * tz;
  }
  /** Writes an (unnormalised y=2) terrain normal into out and returns normalised y. */
  normal(x: number, z: number, out: { x: number; y: number; z: number }): number {
    const e = 1.0;
    const nx = this.height(x - e, z) - this.height(x + e, z);
    const nz = this.height(x, z - e) - this.height(x, z + e);
    const ny = 2 * e;
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
    out.x = nx / l;
    out.y = ny / l;
    out.z = nz / l;
    return out.y;
  }
  computeMax(): void {
    let m = -1e9;
    for (let i = 0; i < this.data.length; i++) if (this.data[i]! > m) m = this.data[i]!;
    this.maxH = m;
  }
}

export interface RayHit {
  t: number;
  /** -1 none, -2 terrain, otherwise box index. */
  box: number;
}

export class World {
  readonly cells: Int32Array[];
  private stamp: Int32Array;
  private stampId = 1;
  supportBox = -1;
  outX = 0;
  outZ = 0;
  hitBox = -1;

  constructor(readonly hf: Heightfield, readonly boxes: Box[]) {
    const lists: number[][] = new Array(GRID_N * GRID_N);
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]!;
      const ex = Math.abs(b.hx * b.c) + Math.abs(b.hz * b.s) + 1.0;
      const ez = Math.abs(b.hx * b.s) + Math.abs(b.hz * b.c) + 1.0;
      const x0 = Math.max(0, Math.floor((b.x - ex + WORLD_HALF) / CELL));
      const x1 = Math.min(GRID_N - 1, Math.floor((b.x + ex + WORLD_HALF) / CELL));
      const z0 = Math.max(0, Math.floor((b.z - ez + WORLD_HALF) / CELL));
      const z1 = Math.min(GRID_N - 1, Math.floor((b.z + ez + WORLD_HALF) / CELL));
      for (let cz = z0; cz <= z1; cz++)
        for (let cx = x0; cx <= x1; cx++) {
          const k = cz * GRID_N + cx;
          (lists[k] ??= []).push(i);
        }
    }
    const empty = new Int32Array(0);
    this.cells = new Array(GRID_N * GRID_N);
    for (let k = 0; k < this.cells.length; k++) this.cells[k] = lists[k] ? Int32Array.from(lists[k]!) : empty;
    this.stamp = new Int32Array(boxes.length);
  }

  cellAt(x: number, z: number): Int32Array {
    const cx = Math.floor((x + WORLD_HALF) / CELL);
    const cz = Math.floor((z + WORLD_HALF) / CELL);
    if (cx < 0 || cz < 0 || cx >= GRID_N || cz >= GRID_N) return this.cells[0]!;
    return this.cells[cz * GRID_N + cx]!;
  }

  hasBoxesNear(x: number, z: number): boolean {
    return this.cellAt(x, z).length > 0;
  }

  terrain(x: number, z: number): number {
    return this.hf.height(x, z);
  }

  /** Distance from a point to the box footprint in XZ (0 inside). */
  private footDist(b: Box, x: number, z: number): number {
    const dx = x - b.x,
      dz = z - b.z;
    const lx = dx * b.c - dz * b.s;
    const lz = dx * b.s + dz * b.c;
    const ox = Math.abs(lx) - b.hx,
      oz = Math.abs(lz) - b.hz;
    if (ox <= 0 && oz <= 0) return 0;
    const ax = ox > 0 ? ox : 0,
      az = oz > 0 ? oz : 0;
    return Math.sqrt(ax * ax + az * az);
  }

  /**
   * Highest walkable surface at (x,z) not above maxTop: terrain or a box top under the footprint.
   * Sets supportBox to the box index, or -1 for terrain.
   */
  support(x: number, z: number, r: number, maxTop: number): number {
    let best = this.hf.height(x, z);
    this.supportBox = -1;
    const cell = this.cellAt(x, z);
    for (let i = 0; i < cell.length; i++) {
      const b = this.boxes[cell[i]!]!;
      const top = b.y + b.hy;
      if (top > maxTop || top <= best) continue;
      if (this.footDist(b, x, z) < r) {
        best = top;
        this.supportBox = cell[i]!;
      }
    }
    return best;
  }

  /** Pushes a vertical cylinder out of solid boxes spanning [y0,y1]. Result in outX/outZ. */
  resolve(x: number, z: number, r: number, y0: number, y1: number): boolean {
    let hit = false;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      const cell = this.cellAt(x, z);
      for (let i = 0; i < cell.length; i++) {
        const b = this.boxes[cell[i]!]!;
        if (b.y + b.hy <= y0 || b.y - b.hy >= y1) continue;
        const dx = x - b.x,
          dz = z - b.z;
        const lx = dx * b.c - dz * b.s;
        const lz = dx * b.s + dz * b.c;
        const ox = Math.abs(lx) - b.hx,
          oz = Math.abs(lz) - b.hz;
        if (ox >= r || oz >= r) continue;
        let px = 0,
          pz = 0;
        if (ox <= 0 && oz <= 0) {
          // centre inside: push along the shallowest axis
          if (ox > oz) px = (lx >= 0 ? 1 : -1) * (r - ox);
          else pz = (lz >= 0 ? 1 : -1) * (r - oz);
        } else if (ox > 0 && oz > 0) {
          const d = Math.sqrt(ox * ox + oz * oz);
          if (d >= r) continue;
          const k = (r - d) / d;
          px = (lx >= 0 ? ox : -ox) * k;
          pz = (lz >= 0 ? oz : -oz) * k;
        } else if (ox > 0) {
          px = (lx >= 0 ? 1 : -1) * (r - ox);
        } else {
          pz = (lz >= 0 ? 1 : -1) * (r - oz);
        }
        x += px * b.c + pz * b.s;
        z += -px * b.s + pz * b.c;
        moved = true;
        hit = true;
      }
      if (!moved) break;
    }
    this.outX = x;
    this.outZ = z;
    return hit;
  }

  /** True when a cylinder at (x,z) spanning [y0,y1] overlaps any solid box. */
  blocked(x: number, z: number, r: number, y0: number, y1: number): boolean {
    const cell = this.cellAt(x, z);
    for (let i = 0; i < cell.length; i++) {
      const b = this.boxes[cell[i]!]!;
      if (b.y + b.hy <= y0 || b.y - b.hy >= y1) continue;
      if (this.footDist(b, x, z) < r) return true;
    }
    return false;
  }

  /** Lowest box underside in (y0, y1] above the cylinder, or Infinity. */
  ceiling(x: number, z: number, r: number, y0: number, y1: number): number {
    let best = Infinity;
    const cell = this.cellAt(x, z);
    for (let i = 0; i < cell.length; i++) {
      const b = this.boxes[cell[i]!]!;
      const bottom = b.y - b.hy;
      if (bottom < y0 - 0.05 || bottom > y1 || bottom >= best) continue;
      if (this.footDist(b, x, z) < r) best = bottom;
    }
    return best;
  }

  private rayBox(b: Box, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): number {
    const rx = ox - b.x,
      rz = oz - b.z;
    const lox = rx * b.c - rz * b.s;
    const loz = rx * b.s + rz * b.c;
    const loy = oy - b.y;
    const ldx = dx * b.c - dz * b.s;
    const ldz = dx * b.s + dz * b.c;
    let t0 = 0,
      t1 = maxT;
    // x slab
    if (Math.abs(ldx) < 1e-9) {
      if (Math.abs(lox) > b.hx) return Infinity;
    } else {
      let a = (-b.hx - lox) / ldx,
        c = (b.hx - lox) / ldx;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
      if (t0 > t1) return Infinity;
    }
    if (Math.abs(dy) < 1e-9) {
      if (Math.abs(loy) > b.hy) return Infinity;
    } else {
      let a = (-b.hy - loy) / dy,
        c = (b.hy - loy) / dy;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
      if (t0 > t1) return Infinity;
    }
    if (Math.abs(ldz) < 1e-9) {
      if (Math.abs(loz) > b.hz) return Infinity;
    } else {
      let a = (-b.hz - loz) / ldz,
        c = (b.hz - loz) / ldz;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
      if (t0 > t1) return Infinity;
    }
    return t0;
  }

  /** Ray against terrain only. Direction must be normalised. */
  raycastTerrain(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): number {
    const hf = this.hf;
    if (dy >= 0 && oy > hf.maxH) return Infinity;
    let t = 0;
    let prevT = 0;
    let prevAbove = oy - hf.height(ox, oz);
    if (prevAbove < 0) return 0;
    while (t < maxT) {
      const step = Math.max(1.0, Math.min(6, prevAbove * 0.5));
      t = Math.min(maxT, t + step);
      const y = oy + dy * t;
      if (dy > 0 && y > hf.maxH) return Infinity;
      const above = y - hf.height(ox + dx * t, oz + dz * t);
      if (above < 0) {
        // bisection refine
        let a = prevT,
          b = t;
        for (let i = 0; i < 8; i++) {
          const m = (a + b) * 0.5;
          if (oy + dy * m - hf.height(ox + dx * m, oz + dz * m) < 0) b = m;
          else a = m;
        }
        return a;
      }
      prevT = t;
      prevAbove = above;
    }
    return Infinity;
  }

  /** Ray against solid boxes via grid DDA. Direction must be normalised. Sets hitBox. */
  raycastBoxes(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): number {
    const id = ++this.stampId;
    this.hitBox = -1;
    let cx = Math.floor((ox + WORLD_HALF) / CELL);
    let cz = Math.floor((oz + WORLD_HALF) / CELL);
    const stepX = dx > 0 ? 1 : -1,
      stepZ = dz > 0 ? 1 : -1;
    const invX = Math.abs(dx) > 1e-9 ? 1 / dx : Infinity;
    const invZ = Math.abs(dz) > 1e-9 ? 1 / dz : Infinity;
    let tMaxX = invX === Infinity ? Infinity : ((cx + (dx > 0 ? 1 : 0)) * CELL - WORLD_HALF - ox) * invX;
    let tMaxZ = invZ === Infinity ? Infinity : ((cz + (dz > 0 ? 1 : 0)) * CELL - WORLD_HALF - oz) * invZ;
    const tDX = invX === Infinity ? Infinity : CELL * Math.abs(invX);
    const tDZ = invZ === Infinity ? Infinity : CELL * Math.abs(invZ);
    let best = Infinity;
    for (let guard = 0; guard < 400; guard++) {
      if (cx >= 0 && cz >= 0 && cx < GRID_N && cz < GRID_N) {
        const cell = this.cells[cz * GRID_N + cx]!;
        for (let i = 0; i < cell.length; i++) {
          const bi = cell[i]!;
          if (this.stamp[bi] === id) continue;
          this.stamp[bi] = id;
          const t = this.rayBox(this.boxes[bi]!, ox, oy, oz, dx, dy, dz, best < maxT ? best : maxT);
          if (t < best) {
            best = t;
            this.hitBox = bi;
          }
        }
      }
      const tExit = tMaxX < tMaxZ ? tMaxX : tMaxZ;
      if (best <= tExit || tExit > maxT) break;
      if (tMaxX < tMaxZ) {
        cx += stepX;
        tMaxX += tDX;
      } else {
        cz += stepZ;
        tMaxZ += tDZ;
      }
    }
    return best;
  }

  /** Nearest world hit along a normalised ray, or Infinity. hitBox: -1 none, -2 terrain, else box index. */
  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): number {
    const tb = this.raycastBoxes(ox, oy, oz, dx, dy, dz, maxT);
    const bi = this.hitBox;
    const tt = this.raycastTerrain(ox, oy, oz, dx, dy, dz, tb < maxT ? tb : maxT);
    if (tt < tb) {
      this.hitBox = -2;
      return tt;
    }
    this.hitBox = tb === Infinity ? -1 : bi;
    return tb;
  }

  /** True when the segment between two points is unobstructed by terrain or boxes. */
  lineClear(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    let dx = bx - ax,
      dy = by - ay,
      dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return true;
    dx /= len;
    dy /= len;
    dz /= len;
    return this.raycast(ax, ay, az, dx, dy, dz, len) >= len - 0.01;
  }
}
