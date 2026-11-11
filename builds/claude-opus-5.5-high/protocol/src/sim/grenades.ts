// Deterministic fixed-step grenade ballistics with swept collision and
// material restitution. The same function drives the authoritative room and
// the Practice trajectory preview, so they match exactly at zero latency.

import { MATERIALS } from '../map/annex';
import type { GameMap } from '../map/runtime';
import { dirFromAngles, type Vec3 } from './math';
import { eyeHeight } from './movement';

export const GRENADE = {
  gravity: 15,
  radius: 0.07,
  strongSpeed: 16.5,
  lobSpeed: 7.5,
  upBias: 1.6,
  friction: 0.72,
  restSpeed: 0.9,
  maxAirTime: 8,
};

export interface GrenadeBody {
  pos: Vec3;
  vel: Vec3;
  rest: boolean;
  bounces: number;
}

export interface BounceInfo {
  mat: string;
  speed: number;
  x: number;
  y: number;
  z: number;
}

/** Advance one tick. Returns bounce info if it hit something this tick. */
export function stepGrenade(map: GameMap, g: GrenadeBody, dt: number): BounceInfo | null {
  if (g.rest) return null;
  g.vel.y -= GRENADE.gravity * dt;
  let remaining = dt;
  let bounce: BounceInfo | null = null;
  for (let iter = 0; iter < 3 && remaining > 1e-6; iter++) {
    const mx = g.vel.x * remaining;
    const my = g.vel.y * remaining;
    const mz = g.vel.z * remaining;
    const len = Math.hypot(mx, my, mz);
    if (len < 1e-7) break;
    const d = { x: mx / len, y: my / len, z: mz / len };
    const hit = map.raycast(g.pos, d, len + GRENADE.radius);
    if (!hit) {
      g.pos.x += mx;
      g.pos.y += my;
      g.pos.z += mz;
      break;
    }
    const travel = Math.max(0, hit.t - GRENADE.radius);
    g.pos.x += d.x * travel;
    g.pos.y += d.y * travel;
    g.pos.z += d.z * travel;
    const frac = len > 0 ? travel / len : 1;
    remaining *= 1 - frac;
    const mat = MATERIALS[map.boxes[hit.box].mat];
    const e = mat.restitution;
    const vn = g.vel.x * hit.nx + g.vel.y * hit.ny + g.vel.z * hit.nz;
    // reflect normal component, damp tangential
    const vnx = vn * hit.nx;
    const vny = vn * hit.ny;
    const vnz = vn * hit.nz;
    g.vel.x = (g.vel.x - vnx) * GRENADE.friction - vnx * e;
    g.vel.y = (g.vel.y - vny) * GRENADE.friction - vny * e;
    g.vel.z = (g.vel.z - vnz) * GRENADE.friction - vnz * e;
    g.pos.x += hit.nx * 0.005;
    g.pos.y += hit.ny * 0.005;
    g.pos.z += hit.nz * 0.005;
    g.bounces++;
    const speed = Math.hypot(g.vel.x, g.vel.y, g.vel.z);
    bounce = { mat: mat.id, speed: Math.abs(vn), x: g.pos.x, y: g.pos.y, z: g.pos.z };
    if ((hit.ny > 0.7 && speed < GRENADE.restSpeed) || speed < 0.25) {
      g.vel.x = g.vel.y = g.vel.z = 0;
      g.rest = true;
      break;
    }
  }
  return bounce;
}

/** Initial throw state from a player's eye and view. */
export function throwState(
  pos: Vec3,
  vel: Vec3,
  crouchAmt: number,
  yaw: number,
  pitch: number,
  lob: boolean,
  map: GameMap,
): GrenadeBody {
  const eye = { x: pos.x, y: pos.y + eyeHeight(crouchAmt), z: pos.z };
  const d = dirFromAngles(yaw, pitch);
  // spawn slightly in front of the eye, but never inside geometry
  const ahead = map.raycast(eye, d, 0.45);
  const off = ahead ? Math.max(0, ahead.t - 0.12) : 0.4;
  const start = { x: eye.x + d.x * off, y: eye.y + d.y * off - 0.05, z: eye.z + d.z * off };
  const sp = lob ? GRENADE.lobSpeed : GRENADE.strongSpeed;
  return {
    pos: start,
    vel: {
      x: d.x * sp + vel.x * 0.5,
      y: d.y * sp + GRENADE.upBias + Math.max(0, vel.y) * 0.5,
      z: d.z * sp + vel.z * 0.5,
    },
    rest: false,
    bounces: 0,
  };
}

/** Simulate a full trajectory (preview / bot grenade library). */
export function simulateTrajectory(map: GameMap, body: GrenadeBody, dt: number, maxTime: number): Vec3[] {
  const g: GrenadeBody = { pos: { ...body.pos }, vel: { ...body.vel }, rest: false, bounces: 0 };
  const pts: Vec3[] = [{ ...g.pos }];
  const steps = Math.ceil(maxTime / dt);
  for (let i = 0; i < steps && !g.rest; i++) {
    stepGrenade(map, g, dt);
    pts.push({ ...g.pos });
  }
  return pts;
}
