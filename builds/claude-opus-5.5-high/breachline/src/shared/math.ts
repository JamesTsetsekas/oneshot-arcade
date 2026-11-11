// Pure math helpers shared by client and authoritative simulation.
// No rendering imports are allowed in src/shared, src/content or src/server.

export interface Vec3 { x: number; y: number; z: number }

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const vcopy = (a: Vec3): Vec3 => ({ x: a.x, y: a.y, z: a.z });
export const vset = (o: Vec3, x: number, y: number, z: number): Vec3 => { o.x = x; o.y = y; o.z = z; return o; };
export const vadd = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const vsub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const vscale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const vmad = (a: Vec3, b: Vec3, s: number): Vec3 => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
export const vdot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const vlen = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const vdist = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const vdist2d = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.z - b.z);
export const vnorm = (a: Vec3): Vec3 => { const l = vlen(a) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
export const vlerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
export const vcross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
export const DEG = Math.PI / 180;

/** Wrap angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * View convention (matches a left-handed, y-up renderer):
 * yaw 0 looks +Z, positive yaw turns toward +X; positive pitch looks DOWN.
 */
export function viewDir(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: -Math.sin(pitch), z: Math.cos(yaw) * cp };
}
export function flatForward(yaw: number): Vec3 { return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) }; }
export function flatRight(yaw: number): Vec3 { return { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) }; }
export function yawPitchTo(from: Vec3, to: Vec3): { yaw: number; pitch: number } {
  const d = vsub(to, from);
  const yaw = Math.atan2(d.x, d.z);
  const pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z));
  return { yaw, pitch };
}

/** Deterministic seeded RNG (mulberry32). Used for spread seeds, bots and spawn tests. */
export class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 0x9e3779b9; }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo: number, hi: number): number { return lo + (hi - lo) * this.next(); }
  int(lo: number, hiExcl: number): number { return Math.floor(this.range(lo, hiExcl)); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number): boolean { return this.next() < p; }
  /** Approx gaussian in [-1,1]-ish (sum of uniforms). */
  gauss(): number { return (this.next() + this.next() + this.next() - 1.5) / 1.5; }
}

/** Hash a few ints into a 32-bit seed (for per-shot spread seeds). */
export function hashSeed(a: number, b: number, c = 0): number {
  let h = 2166136261 ^ a;
  h = Math.imul(h ^ b, 16777619);
  h = Math.imul(h ^ c, 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}

/** Horizontal FOV (degrees) at a given aspect to vertical FOV (radians). */
export function hfovToVfov(hfovDeg: number, aspect: number): number {
  return 2 * Math.atan(Math.tan((hfovDeg * DEG) / 2) / aspect);
}
