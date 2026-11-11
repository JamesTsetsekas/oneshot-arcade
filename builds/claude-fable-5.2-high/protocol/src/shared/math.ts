// Small, allocation-light math helpers shared by simulation, bots and client.

export interface V3 {
  x: number;
  y: number;
  z: number;
}

export const v3 = (x = 0, y = 0, z = 0): V3 => ({ x, y, z });
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const dist2d = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);
export const dist3 = (a: V3, b: V3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Wrap an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  a = a % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  else if (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleLerp(a: number, b: number, t: number): number {
  return a + wrapAngle(b - a) * t;
}

/** Forward vector for yaw (around +Y, 0 = +Z, positive turns toward +X) and pitch (positive = up). */
export function dirFromAngles(yaw: number, pitch: number, out: V3 = v3()): V3 {
  const cp = Math.cos(pitch);
  out.x = Math.sin(yaw) * cp;
  out.y = Math.sin(pitch);
  out.z = Math.cos(yaw) * cp;
  return out;
}

export function yawTo(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

export function pitchTo(from: V3, to: V3): number {
  const d = Math.hypot(to.x - from.x, to.z - from.z);
  return Math.atan2(to.y - from.y, d);
}

/** Deterministic 32-bit hash of integers; used to seed per-shot spread and other reproducible rolls. */
export function hash32(a: number, b = 0, c = 0, d = 0): number {
  let h = 0x811c9dc5 ^ (a | 0);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= b | 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= c | 0;
  h = Math.imul(h ^ (h >>> 16), 0x27d4eb2f);
  h ^= d | 0;
  h = Math.imul(h ^ (h >>> 15), 0x165667b1);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic PRNG (mulberry32). All simulation randomness flows through instances of this. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 0x9e3779b9;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** Approximate standard normal. */
  gauss(): number {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.2247;
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }
  get state(): number {
    return this.s;
  }
}

export const DEG = Math.PI / 180;
