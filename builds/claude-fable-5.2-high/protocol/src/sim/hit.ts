// Player hit volumes. They depend only on position and the quantized crouch fraction,
// so the server, lag compensation and tests all agree on them. Cosmetic animation never affects hits.
import { PLAYER } from '../content/rules';
import { eyeHeight } from './movement';

export type HitZone = 'head' | 'chest' | 'abdomen' | 'arm' | 'leg';

export interface Pose {
  x: number;
  y: number;
  z: number;
  crouch: number;
}

export const ZONE_MULT: Record<HitZone, number> = { head: 1, chest: 1, abdomen: 1.1, arm: 0.85, leg: 0.75 };

function rayCylinder(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cz: number, r: number, y0: number, y1: number): number {
  const fx = ox - cx;
  const fz = oz - cz;
  const a = dx * dx + dz * dz;
  let tA = -Infinity;
  let tB = Infinity;
  if (a < 1e-9) {
    if (fx * fx + fz * fz > r * r) return Infinity;
  } else {
    const b = fx * dx + fz * dz;
    const c = fx * fx + fz * fz - r * r;
    const disc = b * b - a * c;
    if (disc < 0) return Infinity;
    const s = Math.sqrt(disc);
    tA = (-b - s) / a;
    tB = (-b + s) / a;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < y0 || oy > y1) return Infinity;
  } else {
    let ta = (y0 - oy) / dy;
    let tb = (y1 - oy) / dy;
    if (ta > tb) {
      const s = ta;
      ta = tb;
      tb = s;
    }
    if (ta > tA) tA = ta;
    if (tb < tB) tB = tb;
  }
  if (tA > tB || tB < 0) return Infinity;
  return tA < 0 ? 0 : tA;
}

export function raySphere(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cy: number, cz: number, r: number): number {
  const fx = ox - cx;
  const fy = oy - cy;
  const fz = oz - cz;
  const b = fx * dx + fy * dy + fz * dz;
  const c = fx * fx + fy * fy + fz * fz - r * r;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const s = Math.sqrt(disc);
  const t0 = -b - s;
  if (t0 >= 0) return t0;
  return -b + s >= 0 ? 0 : Infinity;
}

export interface BodyDims {
  legTop: number;
  neck: number;
  headY: number;
}

export function bodyDims(crouch: number): BodyDims {
  return {
    legTop: 0.85 - 0.33 * crouch,
    // the torso meets the bottom of the head sphere so there is no gap at the neck
    neck: 1.51 - 0.5 * crouch,
    headY: eyeHeight(crouch) + 0.02,
  };
}

export const HEAD_RADIUS = 0.135;
export const TORSO_RADIUS = 0.19;
export const ARM_RADIUS = PLAYER.halfWidth - 0.01;
export const LEG_RADIUS = 0.2;

export interface PlayerHit {
  t: number;
  zone: HitZone;
}

/** Ray vs. a player's hit volumes. Direction must be normalized. */
export function rayVsPlayer(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, p: Pose, out: PlayerHit): boolean {
  const d = bodyDims(p.crouch);
  let best = Infinity;
  let zone: HitZone = 'chest';
  const th = raySphere(ox, oy, oz, dx, dy, dz, p.x, p.y + d.headY, p.z, HEAD_RADIUS);
  if (th < best) {
    best = th;
    zone = 'head';
  }
  const tt = rayCylinder(ox, oy, oz, dx, dy, dz, p.x, p.z, TORSO_RADIUS, p.y + d.legTop, p.y + d.neck);
  if (tt < Infinity) {
    if (tt < best) {
      best = tt;
      const hy = oy + dy * tt - p.y;
      zone = hy > d.legTop + (d.neck - d.legTop) * 0.42 ? 'chest' : 'abdomen';
    }
  } else {
    const ta = rayCylinder(ox, oy, oz, dx, dy, dz, p.x, p.z, ARM_RADIUS, p.y + d.legTop + 0.22, p.y + d.neck - 0.03);
    if (ta < best) {
      best = ta;
      zone = 'arm';
    }
  }
  const tl = rayCylinder(ox, oy, oz, dx, dy, dz, p.x, p.z, LEG_RADIUS, p.y, p.y + d.legTop);
  if (tl < best) {
    best = tl;
    zone = 'leg';
  }
  if (best === Infinity) return false;
  out.t = best;
  out.zone = zone;
  return true;
}
