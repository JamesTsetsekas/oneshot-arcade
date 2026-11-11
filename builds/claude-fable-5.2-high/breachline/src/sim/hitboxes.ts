// shared-simulation: analytic player hit zones (so lag-compensated rewinds need no physics state).
import { MOVE } from '../content/tuning';

export const ZONE_HEAD = 0, ZONE_UPPER = 1, ZONE_LOWER = 2, ZONE_LIMB = 3;
export const ZONE_NAMES = ['Head', 'Upper torso', 'Lower torso', 'Limb'];
const CROUCH_K = MOVE.crouchH / MOVE.standH;

export function stanceScale(crouchT: number): number { return 1 - crouchT * (1 - CROUCH_K); }
export function eyeHeight(crouchT: number): number { return MOVE.eyeStand + (MOVE.eyeCrouch - MOVE.eyeStand) * crouchT; }
export function chestHeight(crouchT: number): number { return 1.25 * stanceScale(crouchT); }
export function headHeight(crouchT: number): number { return 1.6 * stanceScale(crouchT); }

function raySphere(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cy: number, cz: number, r: number): number {
  const mx = ox - cx, my = oy - cy, mz = oz - cz;
  const b = mx * dx + my * dy + mz * dz;
  const c = mx * mx + my * my + mz * mz - r * r;
  if (c > 0 && b > 0) return -1;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc);
  return t < 0 ? 0 : t;
}

/** Ray vs vertical capsule (segment from y0 to y1 at cx,cz with radius r). Returns distance or -1. */
function rayCapsuleY(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cz: number, y0: number, y1: number, r: number): number {
  const mx = ox - cx, mz = oz - cz;
  const a = dx * dx + dz * dz;
  let best = -1;
  if (a > 1e-9) {
    const b = mx * dx + mz * dz;
    const c = mx * mx + mz * mz - r * r;
    const disc = b * b - a * c;
    if (disc < 0) return -1;
    let t = (-b - Math.sqrt(disc)) / a;
    if (t < 0) t = c <= 0 ? 0 : -1;
    if (t >= 0) {
      const y = oy + dy * t;
      if (y >= y0 && y <= y1) return t;
    }
  }
  const t0 = raySphere(ox, oy, oz, dx, dy, dz, cx, y0, cz, r);
  const t1 = raySphere(ox, oy, oz, dx, dy, dz, cx, y1, cz, r);
  if (t0 >= 0) best = t0;
  if (t1 >= 0 && (best < 0 || t1 < best)) best = t1;
  return best;
}

export interface PlayerRayHit { t: number; zone: number }
const out: PlayerRayHit = { t: 0, zone: 0 };

/** Tests a ray against a player's hit zones (feet at px,py,pz). Head and torso take priority over the limb shell. */
export function rayVsPlayer(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, px: number, py: number, pz: number, crouchT: number, maxT: number): PlayerRayHit | null {
  // broad reject against the bounding capsule
  const k = stanceScale(crouchT);
  const broad = rayCapsuleY(ox, oy, oz, dx, dy, dz, px, pz, py + 0.3, py + 1.55 * k, 0.5);
  if (broad < 0 || broad > maxT) return null;
  let t = raySphere(ox, oy, oz, dx, dy, dz, px, py + 1.6 * k, pz, 0.17);
  if (t >= 0 && t <= maxT) { out.t = t; out.zone = ZONE_HEAD; return out; }
  // one torso capsule; the entry height splits it into upper and lower torso
  t = rayCapsuleY(ox, oy, oz, dx, dy, dz, px, pz, py + 0.86 * k, py + 1.38 * k, 0.24);
  if (t >= 0 && t <= maxT) { out.t = t; out.zone = oy + dy * t - py >= 1.1 * k ? ZONE_UPPER : ZONE_LOWER; return out; }
  t = rayCapsuleY(ox, oy, oz, dx, dy, dz, px, pz, py + 1.0 * k, py + 1.36 * k, 0.4);
  const t2 = rayCapsuleY(ox, oy, oz, dx, dy, dz, px, pz, py + 0.24 * k, py + 0.8 * k, 0.26);
  if (t < 0 || (t2 >= 0 && t2 < t)) t = t2;
  if (t >= 0 && t <= maxT) { out.t = t; out.zone = ZONE_LIMB; return out; }
  return null;
}

/** Ray vs sphere helper for devices (drones, pods, mines). */
export function rayVsSphere(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cy: number, cz: number, r: number, maxT: number): number {
  const t = raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r);
  return t >= 0 && t <= maxT ? t : -1;
}

/** Distance from point to segment a->b (used for smoke line-of-sight blocking). */
export function segPointDist(ax: number, ay: number, az: number, bx: number, by: number, bz: number, px: number, py: number, pz: number): number {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = len2 > 1e-9 ? ((px - ax) * abx + (py - ay) * aby + (pz - az) * abz) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + abx * t - px, cy = ay + aby * t - py, cz = az + abz * t - pz;
  return Math.sqrt(cx * cx + cy * cy + cz * cz);
}
