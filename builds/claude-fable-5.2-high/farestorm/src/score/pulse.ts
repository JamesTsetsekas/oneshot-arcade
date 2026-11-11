// Pulse chain, style categories and rank rules. Pure, fixed-step and deterministic: consumes typed
// gameplay events only and never inspects render state.
export const SCORE_RULES_VERSION = 2;

export type StyleCat =
  | 'nearMiss' | 'thread' | 'drift' | 'air' | 'oncoming' | 'shortcut' | 'cleanSector'
  | 'precision' | 'surge' | 'gripTurn' | 'cleanPickup' | 'sightsee';

export const STYLE_LABELS: Record<StyleCat, string> = {
  nearMiss: 'Near Miss', thread: 'Thread the Needle', drift: 'Drift', air: 'Airtime', oncoming: 'Against the Flow',
  shortcut: 'Shortcut', cleanSector: 'Clean Sector', precision: 'Precision Stop', surge: 'Surge Start',
  gripTurn: 'Grip Turn', cleanPickup: 'Clean Pickup', sightsee: 'Sightseeing',
};
/** Base Pulse charge units per category (before diminishing returns). */
export const STYLE_CHARGE: Record<StyleCat, number> = {
  nearMiss: 1, thread: 2, drift: 1, air: 1.5, oncoming: 0.7, shortcut: 2.5, cleanSector: 1.5,
  precision: 1, surge: 1, gripTurn: 1.5, cleanPickup: 1, sightsee: 0.5,
};

export const PULSE_MULTS = [1, 2, 3, 5];
export const PULSE_THRESHOLDS = [0, 3, 7, 13];
export const PULSE_DECAY_TIME = 3.5;
export const TAILWIND_PER_CHARGE = 0.055;

export interface PulseAward {
  points: number; // base points after diminishing returns
  mult: number;
  total: number; // points * mult
  charge: number;
  repeat: number;
  tierUp: boolean;
}

export class Pulse {
  tier = 0;
  charge = 0;
  idle = 0;
  chain = 0; // events in the current chain
  bestTier = 0;
  bestChain = 0;
  private lastCat: StyleCat | null = null;
  private repeat = 0;

  get mult(): number {
    return PULSE_MULTS[this.tier];
  }
  /** Progress 0..1 towards the next multiplier tier. */
  get progress(): number {
    if (this.tier >= PULSE_MULTS.length - 1) return 1;
    const lo = PULSE_THRESHOLDS[this.tier], hi = PULSE_THRESHOLDS[this.tier + 1];
    return Math.max(0, Math.min(1, (this.charge - lo) / (hi - lo)));
  }
  get active(): boolean {
    return this.chain > 0;
  }

  add(cat: StyleCat, basePoints: number, chargeScale = 1): PulseAward {
    if (cat === this.lastCat) this.repeat++;
    else { this.repeat = 0; this.lastCat = cat; }
    const chargeFactor = Math.max(0.12, Math.pow(0.6, this.repeat));
    const pointFactor = Math.max(0.4, Math.pow(0.8, this.repeat));
    const charge = STYLE_CHARGE[cat] * chargeScale * chargeFactor;
    this.charge += charge;
    this.chain++;
    this.idle = 0;
    let tierUp = false;
    while (this.tier < PULSE_MULTS.length - 1 && this.charge >= PULSE_THRESHOLDS[this.tier + 1]) { this.tier++; tierUp = true; }
    this.bestTier = Math.max(this.bestTier, this.tier);
    this.bestChain = Math.max(this.bestChain, this.chain);
    const points = Math.round(basePoints * pointFactor);
    return { points, mult: this.mult, total: points * this.mult, charge, repeat: this.repeat, tierUp };
  }

  /** Advance the decay clock. Returns 'down' when a tier is lost and 'end' when the chain expires. */
  update(dt: number): 'down' | 'end' | null {
    if (!this.active) return null;
    this.idle += dt;
    if (this.idle < PULSE_DECAY_TIME) return null;
    this.idle = 0;
    if (this.tier > 0) {
      this.tier--;
      this.charge = PULSE_THRESHOLDS[this.tier];
      return 'down';
    }
    this.reset();
    return 'end';
  }
  /** Soft collisions drop one tier; hard crashes reset the chain. */
  collision(hard: boolean): void {
    if (hard || this.tier === 0) { this.reset(); return; }
    this.tier--;
    this.charge = PULSE_THRESHOLDS[this.tier];
    this.idle = 0;
  }
  reset(): void {
    this.tier = 0; this.charge = 0; this.idle = 0; this.chain = 0; this.lastCat = null; this.repeat = 0;
  }
}

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';
export const RANK_THRESHOLDS: Record<string, [number, number, number, number]> = {
  arcade: [32000, 18000, 9000, 3500],
  quick: [60000, 36000, 20000, 9000],
};
export function rankFor(mode: string, score: number): Rank {
  const t = RANK_THRESHOLDS[mode] ?? RANK_THRESHOLDS.arcade;
  if (score >= t[0]) return 'S';
  if (score >= t[1]) return 'A';
  if (score >= t[2]) return 'B';
  if (score >= t[3]) return 'C';
  return 'D';
}
