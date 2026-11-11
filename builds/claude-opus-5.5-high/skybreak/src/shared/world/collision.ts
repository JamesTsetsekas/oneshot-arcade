// Simplified static collision shared by server simulation and client camera:
// heightfield + axis-aligned boxes in a uniform spatial hash. Also provides
// raycasts (terrain march + slab tests) used for hitscan, LOS and camera.

import { Box, IslandData, sampleGrid, WATER_LEVEL, WORLD_HALF } from './island';
import { V3 } from '../math';

const CELL = 16;
const GW = Math.ceil((WORLD_HALF * 2 + 200) / CELL);
const OFF = WORLD_HALF + 100;

export interface RayHit { t: number; x: number; y: number; z: number; nx: number; ny: number; nz: number; box: Box | null }

export class CollisionWorld {
  readonly cells: Int32Array[];
  private stamp: Uint32Array;
  private stampId = 1;
  constructor(public island: IslandData) {
    const lists: number[][] = Array.from({ length: GW * GW }, () => []);
    island.boxes.forEach((b, i) => {
      const x0 = this.cx(b.minX), x1 = this.cx(b.maxX), z0 = this.cx(b.minZ), z1 = this.cx(b.maxZ);
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) lists[z * GW + x].push(i);
    });
    this.cells = lists.map((l) => Int32Array.from(l));
    this.stamp = new Uint32Array(island.boxes.length);
  }
  private cx(v: number) {
    return Math.max(0, Math.min(GW - 1, Math.floor((v + OFF) / CELL)));
  }

  terrain(x: number, z: number) {
    return sampleGrid(this.island.heights, x, z);
  }

  /** Iterate boxes overlapping an XZ rectangle. */
  query(minX: number, minZ: number, maxX: number, maxZ: number, fn: (b: Box) => void) {
    const id = ++this.stampId;
    if (id >= 0xfffffff0) { this.stamp.fill(0); this.stampId = 1; }
    const x0 = this.cx(minX), x1 = this.cx(maxX), z0 = this.cx(minZ), z1 = this.cx(maxZ);
    const boxes = this.island.boxes;
    for (let gz = z0; gz <= z1; gz++) for (let gx = x0; gx <= x1; gx++) {
      const list = this.cells[gz * GW + gx];
      for (let k = 0; k < list.length; k++) {
        const bi = list[k];
        if (this.stamp[bi] === id) continue;
        this.stamp[bi] = id;
        const b = boxes[bi];
        if (b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ) continue;
        fn(b);
      }
    }
  }

  /** Highest walkable surface under a footprint whose top is <= maxY. */
  support(x: number, z: number, r: number, maxY: number): number {
    let h = this.terrain(x, z);
    this.query(x - r, z - r, x + r, z + r, (b) => {
      if (b.maxY <= maxY && b.maxY > h) h = b.maxY;
    });
    return h;
  }

  /** True if an upright capsule-ish AABB at (x, feetY, z) overlaps any box. */
  blocked(x: number, y: number, z: number, r: number, height: number): Box | null {
    let hit: Box | null = null;
    this.query(x - r, z - r, x + r, z + r, (b) => {
      if (hit) return;
      if (b.maxY > y + 0.01 && b.minY < y + height) hit = b;
    });
    return hit;
  }

  waterDepth(x: number, z: number, feetY: number): number {
    const floor = this.support(x, z, 0.2, feetY + 0.5);
    return WATER_LEVEL - floor;
  }

  /** Raycast against terrain and boxes. Direction must be normalised. */
  raycast(o: V3, d: V3, maxDist: number, ignoreTrees = false): RayHit | null {
    let best: RayHit | null = null;
    let bestT = maxDist;
    // boxes: walk the grid along the ray
    const stepLen = CELL * 0.5;
    const steps = Math.ceil(maxDist / stepLen) + 1;
    const id = ++this.stampId;
    const boxes = this.island.boxes;
    let lastCell = -1;
    for (let s = 0; s <= steps; s++) {
      const t = Math.min(s * stepLen, maxDist);
      if (t > bestT + CELL) break;
      const px = o.x + d.x * t, pz = o.z + d.z * t;
      // check the 3x3 neighbourhood lazily: current cell plus neighbours when near an edge
      const gx = this.cx(px), gz = this.cx(pz);
      const cellId = gz * GW + gx;
      if (cellId === lastCell) continue;
      lastCell = cellId;
      for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
        const cx = gx + ox, cz = gz + oz;
        if (cx < 0 || cz < 0 || cx >= GW || cz >= GW) continue;
        const list = this.cells[cz * GW + cx];
        for (let k = 0; k < list.length; k++) {
          const bi = list[k];
          if (this.stamp[bi] === id) continue;
          this.stamp[bi] = id;
          const b = boxes[bi];
          if (ignoreTrees && b.kind === 'tree') continue;
          const h = rayBox(o, d, b, bestT);
          if (h && h.t < bestT) { bestT = h.t; best = h; }
        }
      }
    }
    // terrain march (coarse then refine)
    const tt = this.rayTerrain(o, d, bestT);
    if (tt !== null && tt < bestT) {
      bestT = tt;
      const x = o.x + d.x * tt, z = o.z + d.z * tt;
      best = { t: tt, x, y: o.y + d.y * tt, z, nx: 0, ny: 1, nz: 0, box: null };
    }
    return best;
  }

  private rayTerrain(o: V3, d: V3, maxDist: number): number | null {
    const step = 1.5;
    let prevT = 0;
    let prevAbove = o.y - this.terrain(o.x, o.z);
    if (prevAbove < 0) return 0;
    for (let t = step; t <= maxDist + step; t += step) {
      const tc = Math.min(t, maxDist);
      const y = o.y + d.y * tc;
      const above = y - this.terrain(o.x + d.x * tc, o.z + d.z * tc);
      if (above < 0) {
        // binary refine
        let a = prevT, b = tc;
        for (let i = 0; i < 6; i++) {
          const m = (a + b) / 2;
          const ym = o.y + d.y * m;
          if (ym - this.terrain(o.x + d.x * m, o.z + d.z * m) < 0) b = m; else a = m;
        }
        return b;
      }
      prevT = tc;
      prevAbove = above;
      if (tc >= maxDist) break;
      // early out: ray far above terrain and climbing
      if (d.y > 0 && above > 120) break;
    }
    return null;
  }

  lineOfSight(a: V3, b: V3): boolean {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (L < 0.01) return true;
    const hit = this.raycast(a, { x: dx / L, y: dy / L, z: dz / L }, L - 0.05);
    return hit === null;
  }
}

export function rayBox(o: V3, d: V3, b: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }, maxT: number): RayHit | null {
  let tmin = 0, tmax = maxT;
  let nAxis = -1, nSign = 0;
  const axes: [number, number, number, number][] = [
    [o.x, d.x, b.minX, b.maxX],
    [o.y, d.y, b.minY, b.maxY],
    [o.z, d.z, b.minZ, b.maxZ],
  ];
  for (let a = 0; a < 3; a++) {
    const [oo, dd, lo, hi] = axes[a];
    if (Math.abs(dd) < 1e-9) {
      if (oo < lo || oo > hi) return null;
      continue;
    }
    let t1 = (lo - oo) / dd, t2 = (hi - oo) / dd;
    let s = -1;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s = 1; }
    if (t1 > tmin) { tmin = t1; nAxis = a; nSign = s; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (nAxis < 0) return null; // origin inside box
  return {
    t: tmin, x: o.x + d.x * tmin, y: o.y + d.y * tmin, z: o.z + d.z * tmin,
    nx: nAxis === 0 ? nSign : 0, ny: nAxis === 1 ? nSign : 0, nz: nAxis === 2 ? nSign : 0, box: b as Box,
  };
}

export function raySphere(o: V3, d: V3, c: V3, r: number, maxT: number): number | null {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
  const b = ox * d.x + oy * d.y + oz * d.z;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0 || t > maxT) return null;
  return t;
}

let sharedWorld: CollisionWorld | null = null;
export function getCollisionWorld(island: IslandData): CollisionWorld {
  if (!sharedWorld || sharedWorld.island !== island) sharedWorld = new CollisionWorld(island);
  return sharedWorld;
}
