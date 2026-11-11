export interface V2 { x: number; z: number }

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const wrapAngle = (a: number): number => {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
};
export const angleDiff = (from: number, to: number): number => wrapAngle(to - from);
export const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(bx - ax, bz - az);
export const dist2 = (ax: number, az: number, bx: number, bz: number): number => (bx - ax) ** 2 + (bz - az) ** 2;
/** Heading 0 = +Z (north), increasing toward +X (right turn). */
export const fwd = (h: number): V2 => ({ x: Math.sin(h), z: Math.cos(h) });
export const rgt = (h: number): V2 => ({ x: Math.cos(h), z: -Math.sin(h) });
export const headingTo = (dx: number, dz: number): number => Math.atan2(dx, dz);
export const approach = (v: number, target: number, maxDelta: number): number =>
  v < target ? Math.min(v + maxDelta, target) : Math.max(v - maxDelta, target);
export const damp = (cur: number, target: number, rate: number, dt: number): number =>
  lerp(cur, target, 1 - Math.exp(-rate * dt));
export const dampAngle = (cur: number, target: number, rate: number, dt: number): number =>
  cur + angleDiff(cur, target) * (1 - Math.exp(-rate * dt));

/** Ray (o + t*d) vs axis aligned box in xz, returns entry t or -1. */
export function rayAabb(ox: number, oz: number, dx: number, dz: number, minX: number, maxX: number, minZ: number, maxZ: number, maxT: number): number {
  let t0 = 0;
  let t1 = maxT;
  if (Math.abs(dx) < 1e-9) {
    if (ox < minX || ox > maxX) return -1;
  } else {
    let a = (minX - ox) / dx;
    let b = (maxX - ox) / dx;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return -1;
  }
  if (Math.abs(dz) < 1e-9) {
    if (oz < minZ || oz > maxZ) return -1;
  } else {
    let a = (minZ - oz) / dz;
    let b = (maxZ - oz) / dz;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return -1;
  }
  return t0;
}

/** Distance along a ray (xz) to a circle, or -1. */
export function rayCircle(ox: number, oz: number, dx: number, dz: number, cx: number, cz: number, r: number, maxT: number): number {
  const fx = ox - cx;
  const fz = oz - cz;
  const b = fx * dx + fz * dz;
  const c = fx * fx + fz * fz - r * r;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc);
  if (t < 0 || t > maxT) return c < 0 ? 0 : -1;
  return t;
}
