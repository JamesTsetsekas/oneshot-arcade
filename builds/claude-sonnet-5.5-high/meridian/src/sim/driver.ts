import { clamp, wrapAngle, fwd } from '../core/math';
import type { V2 } from '../core/math';
import type { Vehicle, DriveInput } from './vehicle';
import type { Game } from './game';

/** Steering command (-1..1) that pure-pursues the point (tx,tz). */
export function pursueSteer(v: Vehicle, tx: number, tz: number): number {
  const dx = tx - v.x;
  const dz = tz - v.z;
  const ld = Math.max(Math.hypot(dx, dz), 2);
  const e = wrapAngle(Math.atan2(dx, dz) - v.heading);
  const delta = Math.atan((2 * v.def.wheelbase * Math.sin(e)) / ld);
  const speed = Math.abs(v.speed);
  const authority = 1 / (1 + (speed / v.def.steerFalloff) ** 2);
  const sgn = v.speed < -0.5 ? -1 : 1;
  return clamp((delta / (v.def.steerMax * authority)) * sgn * (Math.abs(e) > Math.PI / 2 ? 1 : 1), -1, 1);
}

/** Point `lookahead` metres along a polyline starting from index `from`. */
export function pointOnPath(path: V2[], from: number, x: number, z: number, lookahead: number): { x: number; z: number; idx: number } {
  let remaining = lookahead;
  let px = x;
  let pz = z;
  let i = from;
  while (i < path.length) {
    const d = Math.hypot(path[i].x - px, path[i].z - pz);
    if (d >= remaining) {
      const k = remaining / Math.max(d, 1e-6);
      return { x: px + (path[i].x - px) * k, z: pz + (path[i].z - pz) * k, idx: from };
    }
    remaining -= d;
    px = path[i].x;
    pz = path[i].z;
    i++;
  }
  return { x: px, z: pz, idx: from };
}

/** Distance along path from the vehicle to waypoint index `idx`. */
export function pathDistanceTo(path: V2[], from: number, idx: number, x: number, z: number): number {
  let d = 0;
  let px = x;
  let pz = z;
  for (let i = from; i <= idx && i < path.length; i++) {
    d += Math.hypot(path[i].x - px, path[i].z - pz);
    px = path[i].x;
    pz = path[i].z;
  }
  return d;
}

export interface Obstacle { gap: number; speed: number; kind: 'vehicle' | 'human' }

/** Closest thing in front of the vehicle within a corridor. */
export function obstacleAhead(g: Game, v: Vehicle, heading: number, reach: number, corridor: number): Obstacle | null {
  const f = fwd(heading);
  let best: Obstacle | null = null;
  const consider = (ox: number, oz: number, half: number, speed: number, kind: 'vehicle' | 'human', halfW = 0.4) => {
    const dx = ox - v.x;
    const dz = oz - v.z;
    const fd = dx * f.x + dz * f.z;
    if (fd < 0.2 || fd > reach + half + v.def.length * 0.5) return;
    const ld = Math.abs(dx * f.z - dz * f.x);
    if (ld > corridor + halfW) return;
    const gap = fd - half - v.def.length * 0.5;
    if (!best || gap < best.gap) best = { gap, speed, kind };
  };
  for (const o of g.vehicles) {
    if (o === v || !o.alive) continue;
    if (Math.abs(o.x - v.x) > reach + 6 || Math.abs(o.z - v.z) > reach + 6) continue;
    const os = (o.vx * f.x + o.vz * f.z);
    consider(o.x, o.z, o.def.length * 0.5, os, 'vehicle', o.def.width * 0.5);
  }
  const pl = g.player.human;
  if (pl.vehicleId === null) consider(pl.x, pl.z, 0.4, 0, 'human');
  for (const h of g.humans) {
    if (!h.alive || h.vehicleId !== null) continue;
    if (Math.abs(h.x - v.x) > reach + 2 || Math.abs(h.z - v.z) > reach + 2) continue;
    if (!g.world.isRoad(h.x, h.z)) continue;
    consider(h.x, h.z, 0.4, 0, 'human');
  }
  return best;
}

/** Convert a desired speed into a throttle/brake command. */
export function speedCommand(v: Vehicle, target: number): number {
  const err = target - v.speed;
  if (target <= 0.1) return v.speed > 0.5 ? -clamp(v.speed / 4, 0.25, 1) : 0;
  return clamp(err * 0.6, -1, 1);
}

export const idleInput = (): DriveInput => ({ throttle: 0, steer: 0, handbrake: true });
