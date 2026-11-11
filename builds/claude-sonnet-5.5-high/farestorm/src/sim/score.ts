/**
 * Pulse (style multiplier), chain banking and the Tailwind meter. Consumes typed award calls only:
 * it never looks at transforms. Anti-farm rules live here so they can be unit-tested in isolation.
 */
import { RULES, type StyleCategory } from './rules';

export interface Award {
  category: StyleCategory;
  base: number;
  points: number; // after falloff and multiplier
  mult: number;
  falloff: number;
}

export class ScoreState {
  energy = 0;
  tier = 0;
  chainTimer = 0;
  chainPoints = 0;
  chainEvents = 0;
  lastCategory: StyleCategory | null = null;
  sameCount = 0;
  bankedTips = 0; // tips banked this trip (survive until delivery)
  totalTips = 0;
  tailwind = 0;
  bestTier = 0;
  bestChain = 0;
  trip = { drift: 0, air: 0, collisions: 0, bestTier: 0, landmarks: new Set<number>() };

  get mult(): number {
    return RULES.pulse.mults[this.tier];
  }
  get active(): boolean {
    return this.chainTimer > 0;
  }
  get pending(): number {
    return this.bankedTips + this.chainPoints;
  }

  resetTrip(): void {
    this.bankedTips = 0;
    this.trip = { drift: 0, air: 0, collisions: 0, bestTier: 0, landmarks: new Set<number>() };
  }

  private tierFor(energy: number): number {
    let t = 0;
    for (let i = 0; i < RULES.pulse.tiers.length; i++) if (energy >= RULES.pulse.tiers[i]) t = i;
    return t;
  }

  /** Award style points for a category. Repeating the same category yields diminishing returns. */
  award(category: StyleCategory, base: number, boosting = false): Award {
    if (category === this.lastCategory) this.sameCount++;
    else { this.sameCount = 0; this.lastCategory = category; }
    const falloff = Math.max(RULES.pulse.minFalloff, Math.pow(RULES.pulse.sameCategoryFalloff, this.sameCount));
    const mult = this.mult;
    const points = Math.round(base * falloff * mult);
    this.energy += falloff;
    this.tier = this.tierFor(this.energy);
    this.bestTier = Math.max(this.bestTier, this.tier);
    this.trip.bestTier = Math.max(this.trip.bestTier, this.tier);
    this.chainTimer = RULES.pulse.decay;
    this.chainPoints += points;
    this.chainEvents++;
    this.bestChain = Math.max(this.bestChain, this.chainPoints);
    if (category === 'drift') this.trip.drift += points;
    if (category === 'air') this.trip.air += points;
    if (!boosting) this.tailwind = Math.min(1, this.tailwind + points * RULES.tailwind.chargePerPoint);
    return { category, base, points, mult, falloff };
  }

  /** end the chain, banking its points as trip tips */
  bank(): number {
    const p = this.chainPoints;
    this.bankedTips += p;
    this.totalTips += p;
    this.chainPoints = 0;
    this.chainEvents = 0;
    this.energy = 0;
    this.tier = 0;
    this.chainTimer = 0;
    this.lastCategory = null;
    this.sameCount = 0;
    return p;
  }

  tick(dt: number): number {
    if (this.chainTimer > 0) {
      this.chainTimer -= dt;
      if (this.chainTimer <= 0) return this.bank();
    }
    return 0;
  }

  /** collisions: minor loses one tier, hard crash forfeits the chain. Returns 'none' | 'tier' | 'break'. */
  collide(impact: number): 'none' | 'tier' | 'break' {
    if (impact >= RULES.collision.hardSpeed) {
      const had = this.chainPoints > 0 || this.tier > 0;
      this.chainPoints = 0;
      this.chainEvents = 0;
      this.energy = 0;
      this.tier = 0;
      this.chainTimer = 0;
      this.lastCategory = null;
      this.sameCount = 0;
      this.trip.collisions++;
      return had ? 'break' : 'none';
    }
    if (impact >= RULES.collision.minorSpeed) {
      this.trip.collisions++;
      if (this.tier > 0) {
        this.tier--;
        this.energy = RULES.pulse.tiers[this.tier];
        return 'tier';
      }
      return 'none';
    }
    return 'none';
  }

  addTailwind(amount: number): void {
    this.tailwind = Math.min(1, this.tailwind + amount);
  }
}

export function rankFor(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  const r = RULES.rank;
  return score >= r.S ? 'S' : score >= r.A ? 'A' : score >= r.B ? 'B' : score >= r.C ? 'C' : 'D';
}
