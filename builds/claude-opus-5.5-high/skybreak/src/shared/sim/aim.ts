// Camera rig + aim geometry shared by the client camera and the server's
// authoritative aim resolution (camera ray -> target point -> muzzle check).

import { MOVE } from '../content/rules';
import { V3 } from '../math';

export const BOOM_HIP = 3.1;
export const SHOULDER = 0.55;
export const CAM_HEIGHT = 0.35;

export interface Rig { origin: V3; dir: V3; pivot: V3; right: V3 }

export function pivotHeight(crouch: boolean) {
  return crouch ? 1.05 : MOVE.eyeHeight - 0.05;
}

export function cameraRig(x: number, y: number, z: number, yaw: number, pitch: number, crouch: boolean, boom: number, shoulderSide: number): Rig {
  const cp = Math.cos(pitch);
  const dir = { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: Math.cos(yaw) * cp };
  const right = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
  const pivot = { x, y: y + pivotHeight(crouch), z };
  const origin = {
    x: pivot.x + right.x * SHOULDER * shoulderSide - dir.x * boom,
    y: pivot.y + CAM_HEIGHT - dir.y * boom,
    z: pivot.z + right.z * SHOULDER * shoulderSide - dir.z * boom,
  };
  return { origin, dir, pivot, right };
}

/** Point on the camera ray closest to the pivot: ray tests start here so
 *  geometry behind the player never blocks the aim. */
export function aimRayStart(r: Rig): V3 {
  const t = (r.pivot.x - r.origin.x) * r.dir.x + (r.pivot.y - r.origin.y) * r.dir.y + (r.pivot.z - r.origin.z) * r.dir.z;
  return { x: r.origin.x + r.dir.x * t, y: r.origin.y + r.dir.y * t, z: r.origin.z + r.dir.z * t };
}

export function muzzle(x: number, y: number, z: number, yaw: number, pitch: number, crouch: boolean): V3 {
  const cp = Math.cos(pitch);
  const fx = Math.sin(yaw) * cp, fy = Math.sin(pitch), fz = Math.cos(yaw) * cp;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const h = crouch ? 0.95 : 1.4;
  return { x: x + rx * 0.28 + fx * 0.7, y: y + h + fy * 0.7, z: z + rz * 0.28 + fz * 0.7 };
}

/** Rotate a direction by a random cone offset. u,v in [0,1). */
export function coneDir(d: V3, halfAngleDeg: number, u: number, v: number): V3 {
  if (halfAngleDeg <= 0) return d;
  const a = (halfAngleDeg * Math.PI / 180) * Math.sqrt(u);
  const phi = v * Math.PI * 2;
  // orthonormal basis
  const up = Math.abs(d.y) < 0.95 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  let rx = up.y * d.z - up.z * d.y, ry = up.z * d.x - up.x * d.z, rz = up.x * d.y - up.y * d.x;
  const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const ux = d.y * rz - d.z * ry, uy = d.z * rx - d.x * rz, uz = d.x * ry - d.y * rx;
  const s = Math.sin(a), c = Math.cos(a);
  const cx = Math.cos(phi) * s, cy = Math.sin(phi) * s;
  return { x: d.x * c + rx * cx + ux * cy, y: d.y * c + ry * cx + uy * cy, z: d.z * c + rz * cx + uz * cy };
}
