// Small, allocation-light math helpers shared by simulation and rendering.
// Convention: x = east, z = north, y = up. Yaw 0 faces +z; forward = (sin yaw, cos yaw).

export interface V2 { x: number; z: number }
export interface V3 { x: number; y: number; z: number }

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const wrapAngle = (a: number) => {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
};
export const angleTo = (from: number, to: number) => wrapAngle(to - from);
export const approach = (v: number, target: number, maxDelta: number) =>
  v < target ? Math.min(v + maxDelta, target) : Math.max(v - maxDelta, target);
export const dist2 = (ax: number, az: number, bx: number, bz: number) => {
  const dx = ax - bx, dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
};
export const distSq2 = (ax: number, az: number, bx: number, bz: number) => {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
};
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
export const fwdX = (yaw: number) => Math.sin(yaw);
export const fwdZ = (yaw: number) => Math.cos(yaw);
export const expDecay = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

/** Deterministic PRNG (mulberry32). */
export class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 0x9e3779b9; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) { return a + (b - a) * this.next(); }
  int(a: number, bInclusive: number) { return a + Math.floor(this.next() * (bInclusive - a + 1)); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number) { return this.next() < p; }
  get state() { return this.s; }
  set state(v: number) { this.s = v >>> 0; }
}

export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Closest point on segment AB to P; returns t in [0,1]. */
export function segT(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  if (l2 < 1e-9) return 0;
  return clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1);
}

export function pointSegDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const t = segT(px, pz, ax, az, bx, bz);
  return dist2(px, pz, ax + (bx - ax) * t, az + (bz - az) * t);
}

export function fmtTime(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r < 10 ? "0" : ""}${r.toFixed(1)}`;
}

export function fmtClock(hours: number) {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}`;
}
