import { Vec3 } from "./math";

export type MaterialTag =
  | "concrete" | "composite" | "metal" | "orange" | "glass" | "grate" | "crate" | "container"
  | "rock" | "cyan" | "roof" | "pipe" | "clip" | "sand" | "graphite" | "tile";

/** Thin materials can be penetrated by bullets with remaining penetration energy. */
export const THIN_MATERIALS: Partial<Record<MaterialTag, number>> = {
  glass: 0.05, grate: 0.1, crate: 0.35, container: 0.3, metal: 0.45, pipe: 0.4,
};

export interface Box {
  id: number;
  min: Vec3;
  max: Vec3;
  mat: MaterialTag;
  /** Penetration cost if thin; undefined = structural (never penetrable). */
  pen?: number;
  breakable?: boolean;
  active: boolean;
  /** Invisible player clip: blocks movement only. */
  clip?: boolean;
  /** Does not block sight (glass). */
  seeThrough?: boolean;
  /** Visual-only flags for renderer. */
  color?: string;
  roofOf?: string;
}

export interface RayHit { t: number; box: Box; normal: Vec3; point: Vec3 }

export function rayAabb(o: Vec3, d: Vec3, min: Vec3, max: Vec3, maxT: number): { t: number; axis: number; sign: number } | null {
  let tmin = 0, tmax = maxT, axis = -1, sign = 0;
  const oa = [o.x, o.y, o.z], da = [d.x, d.y, d.z], mn = [min.x, min.y, min.z], mx = [max.x, max.y, max.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(da[i]) < 1e-9) {
      if (oa[i] < mn[i] || oa[i] > mx[i]) return null;
    } else {
      const inv = 1 / da[i];
      let t1 = (mn[i] - oa[i]) * inv, t2 = (mx[i] - oa[i]) * inv;
      let s = -1;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s = 1; }
      if (t1 > tmin) { tmin = t1; axis = i; sign = s; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
  }
  if (axis === -1) return { t: 0, axis: 1, sign: 1 }; // origin inside
  return { t: tmin, axis, sign };
}

const CELL = 4;

export class CollisionWorld {
  boxes: Box[] = [];
  private grid = new Map<number, number[]>();
  private stamp = 0;
  private stamps: number[] = [];
  bounds = { minX: -60, maxX: 60, minZ: -50, maxZ: 50 };

  constructor(boxes: Box[]) {
    this.boxes = boxes;
    this.stamps = new Array(boxes.length).fill(0);
    boxes.forEach((b, i) => {
      for (let cx = Math.floor(b.min.x / CELL); cx <= Math.floor(b.max.x / CELL); cx++)
        for (let cz = Math.floor(b.min.z / CELL); cz <= Math.floor(b.max.z / CELL); cz++) {
          const k = this.key(cx, cz);
          let arr = this.grid.get(k);
          if (!arr) { arr = []; this.grid.set(k, arr); }
          arr.push(i);
        }
    });
  }

  private key(cx: number, cz: number) { return (cx + 1000) * 4000 + (cz + 1000); }

  /** Visit boxes whose cells overlap the given xz rectangle. */
  query(minX: number, minZ: number, maxX: number, maxZ: number, out: Box[]): Box[] {
    out.length = 0;
    this.stamp++;
    for (let cx = Math.floor(minX / CELL); cx <= Math.floor(maxX / CELL); cx++)
      for (let cz = Math.floor(minZ / CELL); cz <= Math.floor(maxZ / CELL); cz++) {
        const arr = this.grid.get(this.key(cx, cz));
        if (!arr) continue;
        for (const i of arr) {
          if (this.stamps[i] === this.stamp) continue;
          this.stamps[i] = this.stamp;
          const b = this.boxes[i];
          if (b.active) out.push(b);
        }
      }
    return out;
  }

  private tmp: Box[] = [];

  /** True if the AABB overlaps any active solid box. */
  overlaps(min: Vec3, max: Vec3, includeClip = true): boolean {
    const list = this.query(min.x, min.z, max.x, max.z, this.tmp);
    for (const b of list) {
      if (!includeClip && b.clip) continue;
      if (min.x < b.max.x && max.x > b.min.x && min.y < b.max.y && max.y > b.min.y && min.z < b.max.z && max.z > b.min.z) return true;
    }
    return false;
  }

  /** Collect overlapping boxes. */
  overlapping(min: Vec3, max: Vec3, out: Box[]): Box[] {
    const list = this.query(min.x, min.z, max.x, max.z, []);
    out.length = 0;
    for (const b of list) {
      if (min.x < b.max.x && max.x > b.min.x && min.y < b.max.y && max.y > b.min.y && min.z < b.max.z && max.z > b.min.z) out.push(b);
    }
    return out;
  }

  /** Highest walkable surface at (x,z) not above yTop (within radius footprint). Returns -Infinity if none. */
  floorAt(x: number, z: number, yTop: number, r = 0.05): number {
    const list = this.query(x - r, z - r, x + r, z + r, this.tmp);
    let best = -Infinity;
    for (const b of list) {
      if (b.clip) continue;
      if (x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z) {
        if (b.max.y <= yTop + 1e-4 && b.max.y > best) best = b.max.y;
      }
    }
    return best;
  }

  /** Is there any solid box above this point (roof / overhead cover)? */
  hasRoof(p: Vec3, maxUp = 40): boolean {
    const list = this.query(p.x, p.z, p.x, p.z, this.tmp);
    for (const b of list) {
      if (b.clip) continue;
      if (p.x >= b.min.x && p.x <= b.max.x && p.z >= b.min.z && p.z <= b.max.z && b.min.y > p.y + 0.2 && b.min.y < p.y + maxUp) return true;
    }
    return false;
  }

  /** Nearest hit along a ray. sight=true skips see-through boxes; clip boxes never stop rays. */
  raycast(o: Vec3, d: Vec3, maxT: number, sight = false): RayHit | null {
    let best: RayHit | null = null;
    let bestT = maxT;
    for (const b of this.boxes) {
      if (!b.active || b.clip) continue;
      if (sight && b.seeThrough) continue;
      const h = rayAabb(o, d, b.min, b.max, bestT);
      if (h && h.t < bestT) {
        bestT = h.t;
        const n = { x: 0, y: 0, z: 0 };
        if (h.axis === 0) n.x = h.sign; else if (h.axis === 1) n.y = h.sign; else n.z = h.sign;
        best = { t: h.t, box: b, normal: n, point: { x: o.x + d.x * h.t, y: o.y + d.y * h.t, z: o.z + d.z * h.t } };
      }
    }
    return best;
  }

  /** All hits along a ray sorted by distance, with exit distance (for penetration). */
  raycastAll(o: Vec3, d: Vec3, maxT: number): { t: number; tExit: number; box: Box; normal: Vec3 }[] {
    const out: { t: number; tExit: number; box: Box; normal: Vec3 }[] = [];
    for (const b of this.boxes) {
      if (!b.active || b.clip) continue;
      const h = rayAabb(o, d, b.min, b.max, maxT);
      if (!h) continue;
      // exit: cast from far side backwards
      const far = { x: o.x + d.x * maxT, y: o.y + d.y * maxT, z: o.z + d.z * maxT };
      const back = rayAabb(far, { x: -d.x, y: -d.y, z: -d.z }, b.min, b.max, maxT);
      const tExit = back ? maxT - back.t : h.t;
      const n = { x: 0, y: 0, z: 0 };
      if (h.axis === 0) n.x = h.sign; else if (h.axis === 1) n.y = h.sign; else n.z = h.sign;
      out.push({ t: h.t, tExit, box: b, normal: n });
    }
    out.sort((a, b) => a.t - b.t);
    return out;
  }

  /** Line of sight between two points (ignores see-through glass). */
  lineOfSight(a: Vec3, b: Vec3): boolean {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return true;
    const d = { x: dx / len, y: dy / len, z: dz / len };
    return this.raycast(a, d, len - 0.05, true) === null;
  }
}

/** Does segment a→b pass through a sphere (obscurant volumes)? */
export function segmentSphere(a: Vec3, b: Vec3, c: Vec3, r: number): boolean {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const acx = c.x - a.x, acy = c.y - a.y, acz = c.z - a.z;
  const ab2 = abx * abx + aby * aby + abz * abz;
  let t = ab2 > 0 ? (acx * abx + acy * aby + acz * abz) / ab2 : 0;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + abx * t - c.x, py = a.y + aby * t - c.y, pz = a.z + abz * t - c.z;
  return px * px + py * py + pz * pz <= r * r;
}
