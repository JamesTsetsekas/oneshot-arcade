// Small deterministic math helpers shared by the simulation. No DOM, no Babylon.

export const TAU = Math.PI * 2;
export const KMH = 3.6;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}
export function approach(v: number, target: number, maxDelta: number): number {
  if (v < target) return Math.min(target, v + maxDelta);
  return Math.max(target, v - maxDelta);
}
export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}
export function dist(ax: number, az: number, bx: number, bz: number): number {
  return Math.sqrt(dist2(ax, az, bx, bz));
}
/** Forward vector for a heading (yaw). yaw = 0 faces +z, positive yaw turns toward +x. */
export function fwdX(yaw: number): number { return Math.sin(yaw); }
export function fwdZ(yaw: number): number { return Math.cos(yaw); }
export function headingOf(dx: number, dz: number): number { return Math.atan2(dx, dz); }

/** Closest point parameter t in [0,1] of P onto segment AB. */
export function segT(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  if (l2 < 1e-9) return 0;
  return clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1);
}
export function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const t = segT(px, pz, ax, az, bx, bz);
  return dist(px, pz, ax + (bx - ax) * t, az + (bz - az) * t);
}
/** 2D segment intersection test (proper or touching). */
export function segmentsCross(
  ax: number, az: number, bx: number, bz: number,
  cx: number, cz: number, dx: number, dz: number,
): boolean {
  const d1 = cross(cx, cz, dx, dz, ax, az);
  const d2 = cross(cx, cz, dx, dz, bx, bz);
  const d3 = cross(ax, az, bx, bz, cx, cz);
  const d4 = cross(ax, az, bx, bz, dx, dz);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function cross(ax: number, az: number, bx: number, bz: number, px: number, pz: number): number {
  return (bx - ax) * (pz - az) - (bz - az) * (px - ax);
}

/** FNV-1a style hash over numbers, used for determinism checks. */
export function hashNumbers(nums: ArrayLike<number>, seed = 2166136261): number {
  let h = seed >>> 0;
  const buf = new Float64Array(1);
  const bytes = new Uint8Array(buf.buffer);
  for (let i = 0; i < nums.length; i++) {
    buf[0] = Math.round(nums[i] * 1e6) / 1e6;
    for (let j = 0; j < 8; j++) {
      h ^= bytes[j];
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}
