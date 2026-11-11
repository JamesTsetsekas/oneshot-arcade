// Deterministic utility projectile physics, shared by the server, bots (throw solver)
// and the Practice trajectory preview so all three agree exactly.
import { UTILITY, UTIL_TUNING, type UtilityId } from '../content/rules';
import { F_SOLID, MATS, newHit, type CollisionWorld } from '../map/world';
import { dirFromAngles, v3 } from '../shared/math';

export interface Projectile {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rest: boolean;
  bounces: number;
}

const R = 0.07;
const hit = newHit();
const tmp = v3();

export function throwVelocity(yaw: number, pitch: number, lob: boolean, pvx: number, pvy: number, pvz: number, out: Projectile): void {
  dirFromAngles(yaw, pitch, tmp);
  const sp = lob ? UTIL_TUNING.lobSpeed : UTIL_TUNING.throwSpeed;
  out.vx = tmp.x * sp + pvx * 0.6;
  out.vy = tmp.y * sp + (lob ? 1.6 : 2.4) + Math.max(0, pvy) * 0.5;
  out.vz = tmp.z * sp + pvz * 0.6;
}

/** Advances a projectile one fixed step. Returns the surface normal Y if it bounced this step, else null. */
export function stepProjectile(w: CollisionWorld, g: Projectile, type: UtilityId, dt: number): { ny: number; mat: string } | null {
  if (g.rest) return null;
  g.vy -= UTIL_TUNING.gravity * dt;
  const dx = g.vx * dt;
  const dy = g.vy * dt;
  const dz = g.vz * dt;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-7) return null;
  const ix = dx / len;
  const iy = dy / len;
  const iz = dz / len;
  if (w.raycast(g.x, g.y, g.z, ix, iy, iz, len + R, F_SOLID, false, hit) && hit.box) {
    const t = Math.max(0, hit.t - R);
    g.x += ix * t;
    g.y += iy * t;
    g.z += iz * t;
    const e = UTILITY[type].restitution * MATS[hit.box.mat].bounce;
    const vn = g.vx * hit.nx + g.vy * hit.ny + g.vz * hit.nz;
    // split into normal and tangential parts
    const nxv = hit.nx * vn;
    const nyv = hit.ny * vn;
    const nzv = hit.nz * vn;
    const fr = 0.72;
    g.vx = (g.vx - nxv) * fr - nxv * e;
    g.vy = (g.vy - nyv) * fr - nyv * e;
    g.vz = (g.vz - nzv) * fr - nzv * e;
    g.bounces++;
    const speed = Math.hypot(g.vx, g.vy, g.vz);
    if (hit.ny > 0.7 && (speed < 1.3 || type === 'pulse')) {
      g.rest = true;
      g.vx = g.vy = g.vz = 0;
    } else if (type === 'pulse') {
      // shards stick to the first surface they touch
      g.rest = true;
      g.vx = g.vy = g.vz = 0;
    }
    return { ny: hit.ny, mat: hit.box.mat };
  }
  g.x += dx;
  g.y += dy;
  g.z += dz;
  return null;
}

/** Simulates a throw and returns sampled points (used by the Practice preview and the bot throw solver). */
export function simulateThrow(
  w: CollisionWorld,
  type: UtilityId,
  ox: number,
  oy: number,
  oz: number,
  yaw: number,
  pitch: number,
  lob: boolean,
  dt: number,
  maxTime: number,
  every = 2,
): { points: number[]; endX: number; endY: number; endZ: number; time: number } {
  const g: Projectile = { x: ox, y: oy, z: oz, vx: 0, vy: 0, vz: 0, rest: false, bounces: 0 };
  throwVelocity(yaw, pitch, lob, 0, 0, 0, g);
  const points: number[] = [g.x, g.y, g.z];
  const fuse = UTILITY[type].fuse;
  let t = 0;
  let i = 0;
  while (t < maxTime) {
    const b = stepProjectile(w, g, type, dt);
    t += dt;
    i++;
    if (i % every === 0) points.push(g.x, g.y, g.z);
    if (g.rest) break;
    if ((type === 'flash' || type === 'frag') && t >= fuse) break;
    if (type === 'thermite' && ((b && b.ny > 0.5) || t >= fuse)) break;
    if (type === 'veil' && t >= 3.5) break;
  }
  points.push(g.x, g.y, g.z);
  return { points, endX: g.x, endY: g.y, endZ: g.z, time: t };
}
