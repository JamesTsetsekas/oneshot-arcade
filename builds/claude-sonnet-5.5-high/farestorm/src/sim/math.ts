export const TAU = Math.PI * 2;
export const KMH = 3.6;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const saturate = (v: number) => clamp(v, 0, 1);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}
/** frame-rate independent exponential approach */
export const damp = (cur: number, target: number, rate: number, dt: number) =>
  target + (cur - target) * Math.exp(-rate * dt);
export const dist2 = (ax: number, az: number, bx: number, bz: number) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};
export const dist = (ax: number, az: number, bx: number, bz: number) => Math.sqrt(dist2(ax, az, bx, bz));
export function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const l2 = abx * abx + abz * abz;
  const t = l2 === 0 ? 0 : clamp(((px - ax) * abx + (pz - az) * abz) / l2, 0, 1);
  return dist(px, pz, ax + abx * t, az + abz * t);
}
export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
