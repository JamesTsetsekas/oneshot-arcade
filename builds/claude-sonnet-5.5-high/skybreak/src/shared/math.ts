export interface Vec3 { x: number; y: number; z: number }

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const wrapAngle = (a: number): number => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
export const angleDiff = (from: number, to: number): number => wrapAngle(to - from);
export const dist2d = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);
export const dist3d = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Yaw 0 looks toward +Z. Positive yaw turns left (toward +X). Pitch positive looks up. */
export function dirFromYawPitch(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: Math.cos(yaw) * cp };
}
export function rightFromYaw(yaw: number): Vec3 {
  return { x: -Math.cos(yaw), y: 0, z: Math.sin(yaw) };
}
export function yawTo(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}
export function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
