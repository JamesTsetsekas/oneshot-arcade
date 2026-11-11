// map-runtime: turns the authored MapDef into the shared collision/ray/zone/
// callout representation used identically by the authoritative room, bots,
// the client and tests. The collision hash pins the exact box set.

import { MATERIALS, type MapDef, type MaterialId, type RegionDef, type ZoneDef } from './annex';
import type { Vec3 } from '../sim/math';
import { hashString } from '../sim/rng';

export type BoxKind = 'solid' | 'platform' | 'ceiling' | 'ground' | 'prop';

export interface Box {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  mat: MaterialId;
  kind: BoxKind;
}

export interface RayHit {
  t: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  box: number;
  /** distance along ray at which the ray leaves the hit box */
  tExit: number;
}

const BUCKET = 4;

export class GameMap {
  readonly def: MapDef;
  readonly cell: number;
  readonly nx: number;
  readonly nz: number;
  readonly x0: number;
  readonly z0: number;
  /** region index per cell, -1 = solid */
  readonly cellRegion: Int16Array;
  readonly cellFloor: Float32Array;
  readonly cellCeil: Float32Array;
  readonly boxes: Box[] = [];
  readonly hash: string;
  private bnx: number;
  private bnz: number;
  private buckets: number[][];
  private stamp: Uint32Array;
  private stampId = 1;

  constructor(def: MapDef) {
    this.def = def;
    this.cell = def.cell;
    const [bx0, bz0, bx1, bz1] = def.bounds;
    this.x0 = bx0;
    this.z0 = bz0;
    this.nx = Math.round((bx1 - bx0) / def.cell);
    this.nz = Math.round((bz1 - bz0) / def.cell);
    const n = this.nx * this.nz;
    this.cellRegion = new Int16Array(n).fill(-1);
    this.cellFloor = new Float32Array(n);
    this.cellCeil = new Float32Array(n).fill(Infinity);

    // Rasterize regions (later regions override earlier ones).
    def.regions.forEach((reg, ri) => {
      const [rx0, rz0, rx1, rz1] = reg.rect;
      for (let iz = 0; iz < this.nz; iz++) {
        const cz = bz0 + (iz + 0.5) * def.cell;
        if (cz < rz0 || cz > rz1) continue;
        for (let ix = 0; ix < this.nx; ix++) {
          const cx = bx0 + (ix + 0.5) * def.cell;
          if (cx < rx0 || cx > rx1) continue;
          const i = iz * this.nx + ix;
          this.cellRegion[i] = ri;
          this.cellFloor[i] = reg.floor;
          this.cellCeil[i] = reg.ceil ?? Infinity;
        }
      }
    });

    this.buildBoxes();
    this.bnx = Math.ceil((bx1 - bx0) / BUCKET);
    this.bnz = Math.ceil((bz1 - bz0) / BUCKET);
    this.buckets = Array.from({ length: this.bnx * this.bnz }, () => []);
    this.boxes.forEach((b, bi) => {
      const ix0 = Math.max(0, Math.floor((b.minX - bx0) / BUCKET));
      const ix1 = Math.min(this.bnx - 1, Math.floor((b.maxX - bx0 - 1e-6) / BUCKET));
      const iz0 = Math.max(0, Math.floor((b.minZ - bz0) / BUCKET));
      const iz1 = Math.min(this.bnz - 1, Math.floor((b.maxZ - bz0 - 1e-6) / BUCKET));
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) this.buckets[iz * this.bnx + ix].push(bi);
    });
    this.stamp = new Uint32Array(this.boxes.length);
    const sig = this.boxes
      .map((b) => `${b.minX},${b.minY},${b.minZ},${b.maxX},${b.maxY},${b.maxZ},${b.mat}`)
      .join(';');
    this.hash = `${def.id}@${def.version}:${hashString(sig).toString(16).padStart(8, '0')}`;
  }

  private buildBoxes(): void {
    const { def, nx, nz } = this;
    const c = def.cell;
    const top = def.solidTop;
    const [bx0, bz0, bx1, bz1] = def.bounds;
    // ground slab
    this.boxes.push({ minX: bx0, minY: -1, minZ: bz0, maxX: bx1, maxY: 0, maxZ: bz1, mat: 'ground', kind: 'ground' });
    // greedy rectangles by key
    const key = (i: number): string => {
      const reg = this.cellRegion[i];
      if (reg < 0) return 'S';
      const f = this.cellFloor[i];
      const ce = this.cellCeil[i];
      if (f <= 0 && !isFinite(ce)) return '';
      return `${f}|${ce}`;
    };
    const used = new Uint8Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const i = iz * nx + ix;
        if (used[i]) continue;
        const k = key(i);
        if (k === '') {
          used[i] = 1;
          continue;
        }
        let w = 1;
        while (ix + w < nx && !used[i + w] && key(i + w) === k) w++;
        let h = 1;
        outer: while (iz + h < nz) {
          for (let dx = 0; dx < w; dx++) {
            const j = (iz + h) * nx + ix + dx;
            if (used[j] || key(j) !== k) break outer;
          }
          h++;
        }
        for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) used[(iz + dz) * nx + ix + dx] = 1;
        const minX = bx0 + ix * c;
        const minZ = bz0 + iz * c;
        const maxX = minX + w * c;
        const maxZ = minZ + h * c;
        if (k === 'S') {
          this.boxes.push({ minX, minY: 0, minZ, maxX, maxY: top, maxZ, mat: 'concrete', kind: 'solid' });
        } else {
          const f = this.cellFloor[i];
          const ce = this.cellCeil[i];
          if (f > 0) this.boxes.push({ minX, minY: 0, minZ, maxX, maxY: f, maxZ, mat: 'concrete', kind: 'platform' });
          if (isFinite(ce)) this.boxes.push({ minX, minY: ce, minZ, maxX, maxY: top, maxZ, mat: 'panel', kind: 'ceiling' });
        }
      }
    }
    // outer frame so nothing escapes upward over the outer boundary
    void bz1;
    for (const pr of def.props) {
      const [x0, z0, x1, z1] = pr.rect;
      this.boxes.push({ minX: x0, minY: pr.y0, minZ: z0, maxX: x1, maxY: pr.y1, maxZ: z1, mat: pr.mat, kind: 'prop' });
    }
  }

  // ---------- grid helpers ----------
  cellIndex(x: number, z: number): number {
    const ix = Math.floor((x - this.x0) / this.cell);
    const iz = Math.floor((z - this.z0) / this.cell);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1;
    return iz * this.nx + ix;
  }
  cellCenter(i: number): { x: number; z: number } {
    const ix = i % this.nx;
    const iz = (i / this.nx) | 0;
    return { x: this.x0 + (ix + 0.5) * this.cell, z: this.z0 + (iz + 0.5) * this.cell };
  }
  regionAt(x: number, z: number): RegionDef | null {
    const i = this.cellIndex(x, z);
    if (i < 0) return null;
    const r = this.cellRegion[i];
    return r >= 0 ? this.def.regions[r] : null;
  }
  callout(x: number, z: number): string {
    return this.regionAt(x, z)?.callout ?? '';
  }
  regionById(id: string): RegionDef | undefined {
    return this.def.regions.find((r) => r.id === id);
  }
  inZone(z: ZoneDef, p: Vec3): boolean {
    const [x0, z0, x1, z1] = z.rect;
    return p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1 && p.y >= z.y0 && p.y <= z.y1;
  }
  vaultAt(p: Vec3): ZoneDef | null {
    for (const v of this.def.vaults) if (this.inZone(v, p)) return v;
    return null;
  }

  // ---------- spatial queries ----------
  /** Collect box indices overlapping an AABB. */
  queryAABB(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, out: number[]): number[] {
    out.length = 0;
    const sid = ++this.stampId;
    const ix0 = Math.max(0, Math.floor((minX - this.x0) / BUCKET));
    const ix1 = Math.min(this.bnx - 1, Math.floor((maxX - this.x0) / BUCKET));
    const iz0 = Math.max(0, Math.floor((minZ - this.z0) / BUCKET));
    const iz1 = Math.min(this.bnz - 1, Math.floor((maxZ - this.z0) / BUCKET));
    for (let iz = iz0; iz <= iz1; iz++)
      for (let ix = ix0; ix <= ix1; ix++) {
        for (const bi of this.buckets[iz * this.bnx + ix]) {
          if (this.stamp[bi] === sid) continue;
          this.stamp[bi] = sid;
          const b = this.boxes[bi];
          if (b.maxX <= minX || b.minX >= maxX || b.maxY <= minY || b.minY >= maxY || b.maxZ <= minZ || b.minZ >= maxZ) continue;
          out.push(bi);
        }
      }
    return out;
  }

  /**
   * Ray vs static world. dir must be normalized. Returns nearest hit within maxDist.
   * skipSeeThrough: ignore glass/rails (for line-of-sight).
   */
  raycast(o: Vec3, d: Vec3, maxDist: number, skipSeeThrough = false, ignoreBox = -1): RayHit | null {
    const sid = ++this.stampId;
    let best: RayHit | null = null;
    let bestT = maxDist;
    // 2D DDA over buckets
    let ix = Math.floor((o.x - this.x0) / BUCKET);
    let iz = Math.floor((o.z - this.z0) / BUCKET);
    const stepX = d.x > 0 ? 1 : -1;
    const stepZ = d.z > 0 ? 1 : -1;
    const invX = Math.abs(d.x) > 1e-12 ? 1 / d.x : Infinity;
    const invZ = Math.abs(d.z) > 1e-12 ? 1 / d.z : Infinity;
    const nextBX = this.x0 + (ix + (stepX > 0 ? 1 : 0)) * BUCKET;
    const nextBZ = this.z0 + (iz + (stepZ > 0 ? 1 : 0)) * BUCKET;
    let tMaxX = isFinite(invX) ? (nextBX - o.x) * invX : Infinity;
    let tMaxZ = isFinite(invZ) ? (nextBZ - o.z) * invZ : Infinity;
    const tDX = isFinite(invX) ? Math.abs(BUCKET * invX) : Infinity;
    const tDZ = isFinite(invZ) ? Math.abs(BUCKET * invZ) : Infinity;
    let tCur = 0;
    for (let guard = 0; guard < 256; guard++) {
      if (ix >= 0 && iz >= 0 && ix < this.bnx && iz < this.bnz) {
        for (const bi of this.buckets[iz * this.bnx + ix]) {
          if (this.stamp[bi] === sid || bi === ignoreBox) continue;
          this.stamp[bi] = sid;
          const b = this.boxes[bi];
          if (skipSeeThrough && MATERIALS[b.mat].seeThrough) continue;
          const h = rayBox(o, d, b, bestT);
          if (h) {
            bestT = h.t;
            h.box = bi;
            best = h;
          }
        }
      } else if (tCur > 0) {
        // left the map bounds
        if (ix < -1 || iz < -1 || ix > this.bnx || iz > this.bnz) break;
      }
      const tNext = Math.min(tMaxX, tMaxZ);
      if (tNext > bestT || tNext > maxDist) break;
      tCur = tNext;
      if (tMaxX < tMaxZ) {
        ix += stepX;
        tMaxX += tDX;
      } else {
        iz += stepZ;
        tMaxZ += tDZ;
      }
    }
    return best;
  }

  /** True if segment a->b is unobstructed by opaque world geometry. */
  lineClear(a: Vec3, b: Vec3, skipSeeThrough = true): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return true;
    const d = { x: dx / len, y: dy / len, z: dz / len };
    return this.raycast(a, d, len - 1e-3, skipSeeThrough) === null;
  }

  /** Floor height under a point (highest top surface at or below y+tolerance). */
  floorHeight(x: number, z: number, y: number, radius = 0.05): number {
    const out: number[] = [];
    this.queryAABB(x - radius, -2, z - radius, x + radius, y + 0.05, z + radius, out);
    let best = -1;
    for (const bi of out) {
      const b = this.boxes[bi];
      if (b.maxY <= y + 0.05 && b.maxY > best) best = b.maxY;
    }
    return best;
  }
}

/** Slab test. Returns entry hit with face normal, or null. */
export function rayBox(o: Vec3, d: Vec3, b: Box, maxT: number): RayHit | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  let nAxis = -1;
  let nSign = 0;
  const axes: [number, number, number, number][] = [
    [o.x, d.x, b.minX, b.maxX],
    [o.y, d.y, b.minY, b.maxY],
    [o.z, d.z, b.minZ, b.maxZ],
  ];
  for (let a = 0; a < 3; a++) {
    const [oa, da, mn, mx] = axes[a];
    if (Math.abs(da) < 1e-12) {
      if (oa < mn || oa > mx) return null;
      continue;
    }
    const inv = 1 / da;
    let t1 = (mn - oa) * inv;
    let t2 = (mx - oa) * inv;
    let sign = -1;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
      sign = 1;
    }
    if (t1 > tmin) {
      tmin = t1;
      nAxis = a;
      nSign = sign;
    }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (tmax < 0) return null;
  if (tmin < 0) {
    // origin inside box: treat as immediate hit leaving at tmax
    tmin = 0;
  }
  if (tmin > maxT) return null;
  const hit: RayHit = {
    t: tmin,
    x: o.x + d.x * tmin,
    y: o.y + d.y * tmin,
    z: o.z + d.z * tmin,
    nx: nAxis === 0 ? nSign : 0,
    ny: nAxis === 1 ? nSign : 0,
    nz: nAxis === 2 ? nSign : 0,
    box: -1,
    tExit: tmax,
  };
  return hit;
}

let cached: GameMap | null = null;
export function getMap(def: MapDef): GameMap {
  if (!cached || cached.def !== def) cached = new GameMap(def);
  return cached;
}
