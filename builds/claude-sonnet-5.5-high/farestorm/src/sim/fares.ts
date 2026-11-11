/** Passenger candidates: generation, distribution, par/patience maths. */
import { ARCHETYPES } from './data';
import { RULES, type Tier } from './rules';
import { Rng } from './rng';
import { clamp, dist } from './math';
import type { Destination, RoadPoint, World } from './world';

export interface Fare {
  id: number;
  archetype: number;
  pickup: RoadPoint;
  dest: Destination;
  tier: Tier;
  par: number;
  limit: number;
  pathLen: number;
  base: number;
  age: number;
}

export function parFor(pathLen: number): number {
  const p = RULES.par;
  return clamp(Math.round(pathLen * p.perMeter + p.base), p.min, p.max);
}
export function tierFor(par: number): Tier {
  return par < RULES.tierPar.short ? 'short' : par < RULES.tierPar.medium ? 'medium' : 'long';
}
export function baseFareFor(tier: Tier, pathLen: number): number {
  return Math.round(RULES.fareBase[tier] + pathLen * RULES.farePerMeter);
}

export class FareManager {
  candidates: Fare[] = [];
  private rng: Rng;
  private nextId = 1;
  recent: number[] = [];
  constructor(private world: World, seed: number, public count = 6) {
    this.rng = new Rng(seed);
  }

  /** Build a fare from a pickup spot to a destination of the desired tier (best effort). */
  make(px: number, pz: number, wantTier: Tier, taken: RoadPoint[]): Fare | null {
    const w = this.world;
    for (let attempt = 0; attempt < 40; attempt++) {
      const spot = this.rng.pick(w.pickupSpots);
      const d = dist(spot.x, spot.z, px, pz);
      const near = wantTier === 'short' ? 60 : 50;
      const far = wantTier === 'short' ? 360 : wantTier === 'medium' ? 480 : 600;
      if (d < near || d > far) continue;
      if (taken.some((t) => dist(t.x, t.z, spot.x, spot.z) < 45)) continue;
      const dests = this.rng.shuffle(w.destinations.slice());
      for (const dest of dests) {
        if (this.recent.includes(dest.id)) continue;
        if (dist(dest.x, dest.z, spot.x, spot.z) < 90) continue;
        const L = w.pathLength(spot, dest.point);
        const par = parFor(L);
        if (tierFor(par) !== wantTier) continue;
        return {
          id: this.nextId++, archetype: this.rng.int(0, ARCHETYPES.length - 1), pickup: spot, dest, tier: wantTier, par,
          limit: Math.round(par * RULES.patienceFactor), pathLen: L, base: baseFareFor(wantTier, L), age: 0,
        };
      }
    }
    return null;
  }

  /** Keep at least `count` candidates alive with a short/medium/long mix, close to the player. */
  refill(px: number, pz: number): void {
    // drop candidates that are far away (re-roll them near the player)
    this.candidates = this.candidates.filter((c) => dist(c.pickup.x, c.pickup.z, px, pz) < 720);
    const need = this.count - this.candidates.length;
    for (let k = 0; k < need; k++) {
      const tiers = this.candidates.map((c) => c.tier);
      const want: Tier = !tiers.includes('short') ? 'short' : !tiers.includes('medium') ? 'medium' : !tiers.includes('long') ? 'long' : this.rng.chance(0.45) ? 'short' : this.rng.chance(0.6) ? 'medium' : 'long';
      const f = this.make(px, pz, want, this.candidates.map((c) => c.pickup)) ?? this.make(px, pz, 'short', this.candidates.map((c) => c.pickup)) ?? this.make(px, pz, 'medium', this.candidates.map((c) => c.pickup));
      if (f) this.candidates.push(f);
    }
  }

  clear(): void {
    this.candidates = [];
  }

  take(f: Fare): void {
    this.candidates = this.candidates.filter((c) => c !== f);
    this.recent.push(f.dest.id);
    if (this.recent.length > 4) this.recent.shift();
  }
}
