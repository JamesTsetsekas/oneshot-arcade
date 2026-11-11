/** Shared third-person camera model. The server uses it to derive the aim ray; the client renders from it. */
import { MOVE } from '../shared/content';
import { dirFromYawPitch, rightFromYaw, type Vec3 } from '../shared/math';
import type { World } from './world';
import type { Player } from './types';
import { playerHeight } from './movement';

export const CAMERA = { boom: 3.1, shoulder: 0.55, height: 0.35 };

export function eyeHeight(p: Player): number {
  if (p.mode === 'swim') return 0.8;
  if (p.sliding) return 0.85;
  if (p.crouching) return 1.15;
  return 1.62;
}

export interface CameraPose { pos: Vec3; dir: Vec3; pivot: Vec3; boom: number }

export function cameraPose(w: World, p: Player, adsBoom: number): CameraPose {
  const yaw = p.yaw + p.recoilY * 0.0175;
  const pitch = Math.max(-1.45, Math.min(1.45, p.pitch + p.recoilP * 0.0175));
  const dir = dirFromYawPitch(yaw, pitch);
  const right = rightFromYaw(p.yaw);
  const boom = CAMERA.boom + (adsBoom - CAMERA.boom) * p.adsT;
  const side = CAMERA.shoulder * p.shoulder * (1 - 0.25 * p.adsT);
  const pivot = { x: p.x, y: p.y + eyeHeight(p) + CAMERA.height * 0.55, z: p.z };
  // desired camera position behind and to the shoulder
  let dx = -dir.x * boom + right.x * side;
  let dy = -dir.y * boom + CAMERA.height * 0.45;
  let dz = -dir.z * boom + right.z * side;
  const dl = Math.hypot(dx, dy, dz);
  dx /= dl; dy /= dl; dz /= dl;
  // camera collision: pull the camera in along the boom
  let len = dl;
  const t = w.raycast(pivot.x, pivot.y, pivot.z, dx, dy, dz, dl + 0.3, true);
  if (t >= 0) len = Math.max(0.5, t - 0.3);
  return {
    pos: { x: pivot.x + dx * len, y: pivot.y + dy * len, z: pivot.z + dz * len },
    dir, pivot, boom,
  };
}

export function muzzlePos(p: Player): Vec3 {
  const right = rightFromYaw(p.yaw);
  const fwd = dirFromYawPitch(p.yaw, 0);
  const h = eyeHeight(p) - 0.2;
  return { x: p.x + right.x * 0.28 * p.shoulder + fwd.x * 0.55, y: p.y + h, z: p.z + right.z * 0.28 * p.shoulder + fwd.z * 0.55 };
}

export { playerHeight, MOVE };
