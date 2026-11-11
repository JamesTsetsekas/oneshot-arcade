// Line-of-sight rules shared by bot perception and the per-client snapshot interest filter.
import { UTIL_TUNING } from '../content/rules';
import { F_OPAQUE, type CollisionWorld } from '../map/world';
import { bodyDims } from './hit';
import type { Player, Veil } from './state';

export function veilRadius(v: Veil, time: number): number {
  const age = time - v.start;
  if (age < 0 || time > v.end) return 0;
  const bloom = Math.min(1, age / UTIL_TUNING.veilBloom);
  return v.r * (0.25 + 0.75 * bloom);
}

/** True if the segment a->b passes through an active Veil volume. */
export function veilBlocks(veils: Veil[], time: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
  for (const v of veils) {
    const r = veilRadius(v, time);
    if (r <= 0) continue;
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const l2 = dx * dx + dy * dy + dz * dz;
    let t = l2 > 0 ? ((v.x - ax) * dx + (v.y - ay) * dy + (v.z - az) * dz) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t - v.x;
    const py = ay + dy * t - v.y;
    const pz = az + dz * t - v.z;
    if (px * px + py * py + pz * pz < r * r) return true;
  }
  return false;
}

export function lineOfSight(w: CollisionWorld, veils: Veil[], time: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
  if (veilBlocks(veils, time, ax, ay, az, bx, by, bz)) return false;
  return w.segmentClear(ax, ay, az, bx, by, bz, F_OPAQUE);
}

/**
 * Can an eye at (ex,ey,ez) see any part of the target? Samples head, chest, feet and both shoulders,
 * optionally led by the target's velocity so a peeking player does not pop in late.
 */
export function canSeePlayer(w: CollisionWorld, veils: Veil[], time: number, ex: number, ey: number, ez: number, target: Player, lead = 0): boolean {
  const m = target.move;
  const d = bodyDims(m.crouch);
  for (let pass = 0; pass < (lead > 0 ? 2 : 1); pass++) {
    const tx = m.x + (pass ? m.vx * lead : 0);
    const tz = m.z + (pass ? m.vz * lead : 0);
    const ty = m.y;
    if (lineOfSight(w, veils, time, ex, ey, ez, tx, ty + d.headY, tz)) return true;
    if (lineOfSight(w, veils, time, ex, ey, ez, tx, ty + d.neck - 0.25, tz)) return true;
    if (lineOfSight(w, veils, time, ex, ey, ez, tx, ty + 0.25, tz)) return true;
    // shoulders, perpendicular to the view line
    const dx = tx - ex;
    const dz = tz - ez;
    const l = Math.hypot(dx, dz) || 1;
    const px = (-dz / l) * 0.26;
    const pz = (dx / l) * 0.26;
    const sy = ty + d.neck - 0.15;
    if (lineOfSight(w, veils, time, ex, ey, ez, tx + px, sy, tz + pz)) return true;
    if (lineOfSight(w, veils, time, ex, ey, ez, tx - px, sy, tz - pz)) return true;
  }
  return false;
}
