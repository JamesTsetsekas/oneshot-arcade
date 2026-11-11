/** Deterministic seeded RNG (mulberry32) with labelled forks so loot, layout and combat streams never interfere. */
export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const hashSeed = (seed: number, label: string) => hashStr(`${seed >>> 0}:${label}`);
export class Rng {
  private s: number;
  constructor(seed: number) { this.s = (seed >>> 0) || 0x9e3779b9; }
  get state() { return this.s; }
  set state(v: number) { this.s = v >>> 0; }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) { return a + (b - a) * this.next(); }
  int(a: number, b: number) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p: number) { return this.next() < p; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  weighted<T>(arr: readonly T[], w: (t: T) => number): T {
    let total = 0;
    for (const a of arr) total += w(a);
    let r = this.next() * total;
    for (const a of arr) { r -= w(a); if (r <= 0) return a; }
    return arr[arr.length - 1];
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  fork(label: string) { return new Rng(hashSeed(this.s, label)); }
}
