// Query-driven collision against the static map boxes. Bodies are axis-aligned boxes (footprint half-width x height);
// all queries are deterministic and allocation-light so the same code can run on a server tick.

import { Box, BOXES, MATERIALS, boxesInRect, MAP_WIDTH, MAP_HEIGHT } from './map';
import { Vec3 } from './math';

const EPS = 1e-4;

/** True if a body box centred (x,z) standing on y with the given half-width and height overlaps any map box. */
export function bodyBlocked(x: number, y: number, z: number, hw: number, h: number): boolean {
  const list = boxesInRect(x - hw, z - hw, x + hw, z + hw);
  for (const b of list) {
    if (x + hw > b.x0 + EPS && x - hw < b.x1 - EPS && z + hw > b.z0 + EPS && z - hw < b.z1 - EPS && y + h > b.y0 + EPS && y < b.y1 - EPS) return true;
  }
  return false;
}

/** Highest box top at or below `maxY` under the footprint. 0 is the world floor. */
export function supportHeight(x: number, z: number, hw: number, maxY: number, footprintShrink = 0.02, platformsOnly = false): number {
  let best = 0;
  const e = hw - footprintShrink;
  const list = boxesInRect(x - e, z - e, x + e, z + e);
  for (const b of list) {
    if (x + e > b.x0 && x - e < b.x1 && z + e > b.z0 && z - e < b.z1 && b.y1 <= maxY + EPS && b.y1 > best) {
      // A lintel (y0 > 0) is not a floor.
      if (b.y0 > 0.05) continue;
      if (platformsOnly && b.mat !== 'platform') continue;
      best = b.y1;
    }
  }
  return best;
}

export interface RayHit {
  box: Box;
  /** Entry distance along the ray. */
  t0: number;
  /** Exit distance along the ray. */
  t1: number;
}

/** Slab test of a ray (unit direction) against a box. Returns [tEnter, tExit] or null. */
export function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, b: Box, maxT: number): [number, number] | null {
  return rayBounds(ox, oy, oz, dx, dy, dz, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, maxT);
}

/** Slab test against raw bounds (allocation-free apart from the result tuple). */
export function rayBounds(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, bx0: number, by0: number, bz0: number, bx1: number, by1: number, bz1: number, maxT: number): [number, number] | null {
  const b = { x0: bx0, y0: by0, z0: bz0, x1: bx1, y1: by1, z1: bz1 };
  let tmin = 0, tmax = maxT;
  // x
  if (Math.abs(dx) < 1e-9) { if (ox < b.x0 || ox > b.x1) return null; } else {
    let t1 = (b.x0 - ox) / dx, t2 = (b.x1 - ox) / dx;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) { if (oy < b.y0 || oy > b.y1) return null; } else {
    let t1 = (b.y0 - oy) / dy, t2 = (b.y1 - oy) / dy;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (Math.abs(dz) < 1e-9) { if (oz < b.z0 || oz > b.z1) return null; } else {
    let t1 = (b.z0 - oz) / dz, t2 = (b.z1 - oz) / dz;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return [tmin, tmax];
}

/** All map boxes crossed by the ray, sorted by entry distance. */
export function raycastAll(o: Vec3, d: Vec3, maxDist: number): RayHit[] {
  const hits: RayHit[] = [];
  // Broad-phase on the xz bounding rect of the segment.
  const ex = o.x + d.x * maxDist, ez = o.z + d.z * maxDist;
  const x0 = Math.max(0, Math.min(o.x, ex)), x1 = Math.min(MAP_WIDTH, Math.max(o.x, ex));
  const z0 = Math.max(0, Math.min(o.z, ez)), z1 = Math.min(MAP_HEIGHT, Math.max(o.z, ez));
  const list = (x1 - x0) * (z1 - z0) > 900 ? BOXES : boxesInRect(x0, z0, x1, z1);
  for (const b of list) {
    const r = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, b, maxDist);
    if (r) hits.push({ box: b, t0: r[0], t1: r[1] });
  }
  hits.sort((a, b) => a.t0 - b.t0);
  return hits;
}

/** First box hit, or null. */
export function raycastFirst(o: Vec3, d: Vec3, maxDist: number): RayHit | null {
  let best: RayHit | null = null;
  const all = raycastAll(o, d, maxDist);
  if (all.length) best = all[0];
  return best;
}

/** True if no opaque box lies between a and b (glass and the like do not block sight). */
export function lineOfSight(a: Vec3, b: Vec3): boolean {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return true;
  const d = { x: dx / len, y: dy / len, z: dz / len };
  const hits = raycastAll(a, d, len);
  for (const h of hits) {
    if (!MATERIALS[h.box.mat].opaque) continue;
    if (h.t1 - h.t0 < 1e-4) continue;
    return false;
  }
  return true;
}

/** Thickness-weighted obstruction along a segment ignoring penetrable surfaces entirely: true if any hard blocker. */
export function hardBlocked(a: Vec3, b: Vec3): boolean {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return false;
  const d = { x: dx / len, y: dy / len, z: dz / len };
  const hits = raycastAll(a, d, len);
  for (const h of hits) if (!isFinite(MATERIALS[h.box.mat].cost)) return true;
  return false;
}

/** Sphere (radius r) swept from a to b against map boxes. Returns the first hit fraction and normal, or null. */
export function sweepSphere(a: Vec3, b: Vec3, r: number): { t: number; nx: number; ny: number; nz: number; box: Box } | null {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-9) return null;
  const x0 = Math.min(a.x, b.x) - r, x1 = Math.max(a.x, b.x) + r;
  const z0 = Math.min(a.z, b.z) - r, z1 = Math.max(a.z, b.z) + r;
  const list = boxesInRect(x0, z0, x1, z1);
  let best: { t: number; nx: number; ny: number; nz: number; box: Box } | null = null;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  for (const bx of list) {
    // Inflate the box by r and ray test (Minkowski sum approximation with an AABB; fine for blocky geometry).
    const inf = { x0: bx.x0 - r, x1: bx.x1 + r, y0: bx.y0 - r, y1: bx.y1 + r, z0: bx.z0 - r, z1: bx.z1 + r };
    const hit = rayBounds(a.x, a.y, a.z, ux, uy, uz, inf.x0, inf.y0, inf.z0, inf.x1, inf.y1, inf.z1, len);
    if (!hit) continue;
    const t = hit[0];
    if (t > len || (best && t / len >= best.t)) continue;
    const px = a.x + ux * t, py = a.y + uy * t, pz = a.z + uz * t;
    // Normal: the axis whose inflated face is closest to the contact point.
    const dxs = [Math.abs(px - inf.x0), Math.abs(px - inf.x1)];
    const dys = [Math.abs(py - inf.y0), Math.abs(py - inf.y1)];
    const dzs = [Math.abs(pz - inf.z0), Math.abs(pz - inf.z1)];
    const mx = Math.min(dxs[0], dxs[1]), my = Math.min(dys[0], dys[1]), mz = Math.min(dzs[0], dzs[1]);
    let nx = 0, ny = 0, nz = 0;
    if (mx <= my && mx <= mz) nx = dxs[0] < dxs[1] ? -1 : 1;
    else if (my <= mz) ny = dys[0] < dys[1] ? -1 : 1;
    else nz = dzs[0] < dzs[1] ? -1 : 1;
    best = { t: t / len, nx, ny, nz, box: bx };
  }
  return best;
}
