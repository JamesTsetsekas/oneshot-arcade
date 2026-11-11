// Static collision world: axis-aligned boxes in a uniform bucket grid.
// The exact same representation is used by the authoritative simulation, client prediction,
// bots, grenade physics and the baked-lighting pass, and is fingerprinted by `hash()`.
import { hash32 } from '../shared/math';

export const F_SOLID = 1; // blocks movement and grenades
export const F_OPAQUE = 2; // blocks vision
export const F_BULLET = 4; // interacts with bullets (may still be penetrable)
export const F_BARRIER = 8; // only active during the buy phase

export type MatId =
  | 'concrete'
  | 'panel'
  | 'glass'
  | 'metal'
  | 'wood'
  | 'soil'
  | 'foliage'
  | 'grate'
  | 'barrier'
  | 'trim';

export interface MatDef {
  /** penetration resistance per metre of thickness; Infinity = impenetrable */
  resist: number;
  flags: number;
  step: 'hard' | 'metal' | 'soft';
  /** restitution multiplier for grenades */
  bounce: number;
}

export const MATS: Record<MatId, MatDef> = {
  concrete: { resist: Infinity, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'hard', bounce: 1 },
  panel: { resist: 2.0, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'hard', bounce: 0.9 },
  glass: { resist: 1.4, flags: F_SOLID | F_BULLET, step: 'hard', bounce: 1 },
  metal: { resist: Infinity, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'metal', bounce: 1.1 },
  wood: { resist: 0.5, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'hard', bounce: 0.8 },
  soil: { resist: 0.85, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'soft', bounce: 0.4 },
  foliage: { resist: 0, flags: F_OPAQUE, step: 'soft', bounce: 0 },
  grate: { resist: Infinity, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'metal', bounce: 1.1 },
  barrier: { resist: Infinity, flags: F_SOLID | F_BARRIER, step: 'hard', bounce: 1 },
  trim: { resist: Infinity, flags: F_SOLID | F_OPAQUE | F_BULLET, step: 'hard', bounce: 1 },
};

export type BoxKind = 'wall' | 'floor' | 'ceil' | 'prop' | 'stair' | 'barrier';

export interface Box {
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  mat: MatId;
  flags: number;
  kind: BoxKind;
  /** optional render style tag for props */
  style?: string;
  idx: number;
}

export interface RayHit {
  t: number;
  tExit: number;
  box: Box | null;
  nx: number;
  ny: number;
  nz: number;
}

export const newHit = (): RayHit => ({ t: Infinity, tExit: Infinity, box: null, nx: 0, ny: 0, nz: 0 });

const CELL = 4;

export class CollisionWorld {
  boxes: Box[] = [];
  private nx: number;
  private nz: number;
  private buckets: number[][] = [];
  private stamp = new Int32Array(0);
  private stampId = 1;
  private scratch: Box[] = [];

  constructor(
    public sizeX: number,
    public sizeZ: number,
  ) {
    this.nx = Math.ceil(sizeX / CELL);
    this.nz = Math.ceil(sizeZ / CELL);
    for (let i = 0; i < this.nx * this.nz; i++) this.buckets.push([]);
  }

  add(b: Omit<Box, 'idx' | 'flags'> & { flags?: number }): Box {
    const box: Box = { ...b, flags: b.flags ?? MATS[b.mat].flags, idx: this.boxes.length };
    this.boxes.push(box);
    const ix0 = Math.max(0, Math.floor(box.x0 / CELL));
    const ix1 = Math.min(this.nx - 1, Math.floor((box.x1 - 1e-6) / CELL));
    const iz0 = Math.max(0, Math.floor(box.z0 / CELL));
    const iz1 = Math.min(this.nz - 1, Math.floor((box.z1 - 1e-6) / CELL));
    for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) this.buckets[iz * this.nx + ix].push(box.idx);
    return box;
  }

  finalize(): void {
    this.stamp = new Int32Array(this.boxes.length);
  }

  private nextStamp(): number {
    if (this.stamp.length !== this.boxes.length) this.stamp = new Int32Array(this.boxes.length);
    return ++this.stampId;
  }

  /** Collects boxes overlapping the AABB. Returns a shared scratch array: consume before the next query. */
  query(
    minx: number,
    miny: number,
    minz: number,
    maxx: number,
    maxy: number,
    maxz: number,
    mask: number,
    barriers: boolean,
    out?: Box[],
  ): Box[] {
    const res = out ?? this.scratch;
    res.length = 0;
    const id = this.nextStamp();
    const ix0 = Math.max(0, Math.floor(minx / CELL));
    const ix1 = Math.min(this.nx - 1, Math.floor(maxx / CELL));
    const iz0 = Math.max(0, Math.floor(minz / CELL));
    const iz1 = Math.min(this.nz - 1, Math.floor(maxz / CELL));
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const bucket = this.buckets[iz * this.nx + ix];
        for (let k = 0; k < bucket.length; k++) {
          const bi = bucket[k];
          if (this.stamp[bi] === id) continue;
          this.stamp[bi] = id;
          const b = this.boxes[bi];
          if (!(b.flags & mask)) continue;
          if (b.flags & F_BARRIER && !barriers) continue;
          if (b.x0 < maxx && b.x1 > minx && b.z0 < maxz && b.z1 > minz && b.y0 < maxy && b.y1 > miny) res.push(b);
        }
      }
    }
    return res;
  }

  overlaps(minx: number, miny: number, minz: number, maxx: number, maxy: number, maxz: number, mask: number, barriers: boolean): boolean {
    const id = this.nextStamp();
    const ix0 = Math.max(0, Math.floor(minx / CELL));
    const ix1 = Math.min(this.nx - 1, Math.floor(maxx / CELL));
    const iz0 = Math.max(0, Math.floor(minz / CELL));
    const iz1 = Math.min(this.nz - 1, Math.floor(maxz / CELL));
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const bucket = this.buckets[iz * this.nx + ix];
        for (let k = 0; k < bucket.length; k++) {
          const bi = bucket[k];
          if (this.stamp[bi] === id) continue;
          this.stamp[bi] = id;
          const b = this.boxes[bi];
          if (!(b.flags & mask)) continue;
          if (b.flags & F_BARRIER && !barriers) continue;
          if (b.x0 < maxx && b.x1 > minx && b.z0 < maxz && b.z1 > minz && b.y0 < maxy && b.y1 > miny) return true;
        }
      }
    }
    return false;
  }

  /**
   * Nearest box hit along a normalized ray. Boxes containing the origin are ignored.
   * Returns true and fills `hit` when something is hit before maxT.
   */
  raycast(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    maxT: number,
    mask: number,
    barriers: boolean,
    hit: RayHit,
  ): boolean {
    hit.t = maxT;
    hit.box = null;
    const id = this.nextStamp();
    let ix = Math.floor(ox / CELL);
    let iz = Math.floor(oz / CELL);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) {
      ix = Math.max(0, Math.min(this.nx - 1, ix));
      iz = Math.max(0, Math.min(this.nz - 1, iz));
    }
    const stepX = dx > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;
    const invX = Math.abs(dx) > 1e-9 ? 1 / dx : 0;
    const invY = Math.abs(dy) > 1e-9 ? 1 / dy : 0;
    const invZ = Math.abs(dz) > 1e-9 ? 1 / dz : 0;
    let tMaxX = invX !== 0 ? ((dx > 0 ? (ix + 1) * CELL : ix * CELL) - ox) * invX : Infinity;
    let tMaxZ = invZ !== 0 ? ((dz > 0 ? (iz + 1) * CELL : iz * CELL) - oz) * invZ : Infinity;
    const tDeltaX = invX !== 0 ? Math.abs(CELL * invX) : Infinity;
    const tDeltaZ = invZ !== 0 ? Math.abs(CELL * invZ) : Infinity;
    for (;;) {
      const bucket = this.buckets[iz * this.nx + ix];
      for (let k = 0; k < bucket.length; k++) {
        const bi = bucket[k];
        if (this.stamp[bi] === id) continue;
        this.stamp[bi] = id;
        const b = this.boxes[bi];
        if (!(b.flags & mask)) continue;
        if (b.flags & F_BARRIER && !barriers) continue;
        let t0 = -Infinity;
        let t1 = Infinity;
        let axis = 0;
        // X slab
        if (invX === 0) {
          if (ox <= b.x0 || ox >= b.x1) continue;
        } else {
          let ta = (b.x0 - ox) * invX;
          let tb = (b.x1 - ox) * invX;
          if (ta > tb) {
            const s = ta;
            ta = tb;
            tb = s;
          }
          t0 = ta;
          t1 = tb;
        }
        // Y slab
        if (invY === 0) {
          if (oy <= b.y0 || oy >= b.y1) continue;
        } else {
          let ta = (b.y0 - oy) * invY;
          let tb = (b.y1 - oy) * invY;
          if (ta > tb) {
            const s = ta;
            ta = tb;
            tb = s;
          }
          if (ta > t0) {
            t0 = ta;
            axis = 1;
          }
          if (tb < t1) t1 = tb;
        }
        // Z slab
        if (invZ === 0) {
          if (oz <= b.z0 || oz >= b.z1) continue;
        } else {
          let ta = (b.z0 - oz) * invZ;
          let tb = (b.z1 - oz) * invZ;
          if (ta > tb) {
            const s = ta;
            ta = tb;
            tb = s;
          }
          if (ta > t0) {
            t0 = ta;
            axis = 2;
          }
          if (tb < t1) t1 = tb;
        }
        if (t0 > t1 || t0 < 0 || t0 >= hit.t) continue;
        hit.t = t0;
        hit.tExit = t1;
        hit.box = b;
        hit.nx = axis === 0 ? (dx > 0 ? -1 : 1) : 0;
        hit.ny = axis === 1 ? (dy > 0 ? -1 : 1) : 0;
        hit.nz = axis === 2 ? (dz > 0 ? -1 : 1) : 0;
      }
      const tNext = tMaxX < tMaxZ ? tMaxX : tMaxZ;
      if (hit.t <= tNext || tNext >= maxT) break;
      if (tMaxX < tMaxZ) {
        ix += stepX;
        tMaxX += tDeltaX;
        if (ix < 0 || ix >= this.nx) break;
      } else {
        iz += stepZ;
        tMaxZ += tDeltaZ;
        if (iz < 0 || iz >= this.nz) break;
      }
    }
    return hit.box !== null;
  }

  private tmpHit: RayHit = newHit();

  /** True when nothing matching `mask` lies on the segment a->b. */
  segmentClear(ax: number, ay: number, az: number, bx: number, by: number, bz: number, mask: number): boolean {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return true;
    return !this.raycast(ax, ay, az, dx / len, dy / len, dz / len, len, mask, false, this.tmpHit);
  }

  /** Height of the highest solid surface below a point (or -Infinity). */
  groundBelow(x: number, y: number, z: number, maxDrop = 30): number {
    const h = this.tmpHit;
    if (this.raycast(x, y, z, 0, -1, 0, maxDrop, F_SOLID, false, h)) return y - h.t;
    return -Infinity;
  }

  /** Stable fingerprint of the collision representation (client and server must agree). */
  hash(): string {
    let h = 0x1234567;
    for (const b of this.boxes) {
      h = hash32(h, Math.round(b.x0 * 1000), Math.round(b.y0 * 1000), Math.round(b.z0 * 1000));
      h = hash32(h, Math.round(b.x1 * 1000), Math.round(b.y1 * 1000), Math.round(b.z1 * 1000));
      h = hash32(h, b.flags, b.mat.length, b.mat.charCodeAt(0));
    }
    return h.toString(16).padStart(8, '0');
  }
}
