/** Deterministic 32-bit RNG (mulberry32). State is a single uint32 so it snapshots trivially. */
export class Rng {
  state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  nextU32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  /** float in [0,1) derived from integer state (deterministic across runtimes) */
  next(): number { return this.nextU32() / 4294967296; }
  int(n: number): number { return this.nextU32() % n; }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
}

/** FNV-1a over 32-bit words */
export class Hasher {
  h = 0x811c9dc5;
  word(v: number) {
    v = v | 0;
    for (let i = 0; i < 4; i++) {
      this.h ^= (v >>> (i * 8)) & 0xff;
      this.h = Math.imul(this.h, 0x01000193) >>> 0;
    }
  }
  get value() { return this.h >>> 0; }
}
