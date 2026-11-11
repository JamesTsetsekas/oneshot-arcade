// Pulse chain, Tailwind meter and fare/grade formulas. Pure fixed-step logic; versioned rules.

export const RULES_VERSION = 4;

export type StyleKind =
  | "nearMiss" | "thread" | "drift" | "air" | "oncoming" | "shortcut" | "cleanSector" | "precision" | "surge" | "gripTurn";

export const STYLE_LABEL: Record<StyleKind, string> = {
  nearMiss: "Close Shave",
  thread: "Needle Thread",
  drift: "Slide",
  air: "Airtime",
  oncoming: "Rush Lane",
  shortcut: "Shortcut",
  cleanSector: "Clean Sector",
  precision: "Pinpoint Stop",
  surge: "Surge Start",
  gripTurn: "Grip Turn",
};

export const TIER_THRESHOLDS = [0, 800, 2200, 4500];
export const TIER_MULTS = [1, 2, 3, 5];
export const CHAIN_TIMEOUT = 3.5;

export interface PulseResult {
  points: number;
  mult: number;
  tierUp: boolean;
  factor: number;
}

export class Pulse {
  charge = 0;
  tier = 0;
  count = 0;
  idle = 0;
  chainPoints = 0;
  bestChain = 0;
  bestChainPoints = 0;
  lastKind: StyleKind | null = null;
  repeat = 0;

  get mult(): number {
    return TIER_MULTS[this.tier];
  }
  get active(): boolean {
    return this.count > 0;
  }
  /** Fraction of the chain timer remaining (for HUD). */
  get timerFrac(): number {
    return this.count > 0 ? Math.max(0, 1 - this.idle / CHAIN_TIMEOUT) : 0;
  }
  /** Progress toward the next tier, 0..1 */
  get tierProgress(): number {
    if (this.tier >= TIER_THRESHOLDS.length - 1) return 1;
    const a = TIER_THRESHOLDS[this.tier], b = TIER_THRESHOLDS[this.tier + 1];
    return Math.max(0, Math.min(1, (this.charge - a) / (b - a)));
  }

  add(kind: StyleKind, base: number): PulseResult {
    if (kind === this.lastKind) this.repeat++;
    else this.repeat = 0;
    this.lastKind = kind;
    const factor = Math.max(0.12, Math.pow(0.55, this.repeat));
    const mult = this.mult;
    const points = Math.round(base * mult);
    this.charge += base * factor;
    this.count++;
    this.idle = 0;
    this.chainPoints += points;
    let tierUp = false;
    while (this.tier < TIER_THRESHOLDS.length - 1 && this.charge >= TIER_THRESHOLDS[this.tier + 1]) {
      this.tier++;
      tierUp = true;
    }
    if (this.count > this.bestChain) this.bestChain = this.count;
    if (this.chainPoints > this.bestChainPoints) this.bestChainPoints = this.chainPoints;
    return { points, mult, tierUp, factor };
  }

  /** Returns true when the chain expired this step. */
  step(dt: number): boolean {
    if (this.count === 0) return false;
    this.idle += dt;
    if (this.idle >= CHAIN_TIMEOUT) {
      this.reset();
      return true;
    }
    return false;
  }

  /** A bump drops one tier; a hard crash resets the chain. Returns what happened. */
  collide(hard: boolean): "none" | "drop" | "reset" {
    if (this.count === 0) return "none";
    if (hard || this.tier === 0) {
      this.reset();
      return "reset";
    }
    this.tier--;
    this.charge = TIER_THRESHOLDS[this.tier];
    return "drop";
  }

  reset() {
    this.charge = 0;
    this.tier = 0;
    this.count = 0;
    this.idle = 0;
    this.chainPoints = 0;
    this.lastKind = null;
    this.repeat = 0;
  }
}

export const BOOST_DURATION = 2.2;
export const BOOST_MIN = 0.3;

export class Tailwind {
  meter = 0.35; // 0..1, 1 = 2.2 s of boost
  active = false;
  activeTime = 0;

  charge(amount: number) {
    if (this.active) return; // cannot recharge while active
    this.meter = Math.min(1, this.meter + amount);
  }
  get ready(): boolean {
    return !this.active && this.meter >= BOOST_MIN;
  }
  /** Step with the boost button state. Returns "start" | "end" | null. */
  step(dt: number, held: boolean): "start" | "end" | null {
    if (!this.active) {
      if (held && this.meter >= BOOST_MIN) {
        this.active = true;
        this.activeTime = 0;
        return "start";
      }
      return null;
    }
    this.activeTime += dt;
    this.meter = Math.max(0, this.meter - dt / BOOST_DURATION);
    if (this.meter <= 0 || (!held && this.activeTime > 0.4)) {
      this.active = false;
      return "end";
    }
    return null;
  }
}

// ------------------------------------------------------------------ fares

export type FareTier = "short" | "medium" | "long" | "special";
export type Grade = "Blazing" | "Fast" | "Close" | "Late" | "Failed";

export const TIER_INFO: Record<FareTier, { label: string; color: string; shape: string; base: number; par: [number, number]; bonus: number }> = {
  short: { label: "Short hop", color: "#3ee06d", shape: "circle", base: 1000, par: [20, 35], bonus: 1 },
  medium: { label: "Cross-town", color: "#ffb02e", shape: "diamond", base: 1800, par: [35, 55], bonus: 2 },
  long: { label: "Long haul", color: "#ff3fb4", shape: "star", base: 3000, par: [55, 80], bonus: 3 },
  special: { label: "Special", color: "#2ee6ff", shape: "hexagon", base: 2400, par: [35, 70], bonus: 3 },
};

export const REF_SPEED = 17; // m/s used to derive par times from legal route length

export function tierForLength(len: number): Exclude<FareTier, "special"> {
  if (len < 430) return "short";
  if (len < 880) return "medium";
  return "long";
}

export function parTime(routeLen: number, tier: FareTier): number {
  const [lo, hi] = TIER_INFO[tier].par;
  return Math.round(Math.min(hi, Math.max(lo, routeLen / REF_SPEED + 6)));
}

export const PERSONAL_GRACE = 2;

/** Grade from remaining patience fraction. `over` = seconds past zero. */
export function gradeFor(timeLeft: number, par: number): Grade {
  const frac = timeLeft / par;
  if (frac >= 0.25) return "Blazing";
  if (frac >= 0.1) return "Fast";
  if (timeLeft > 0) return "Close";
  if (timeLeft > -PERSONAL_GRACE) return "Late";
  return "Failed";
}

export const GRADE_TIME_BONUS: Record<Grade, number> = { Blazing: 3, Fast: 2, Close: 1, Late: 0, Failed: 0 };
export const SHIFT_AWARD_CAP = 45;
/** Fraction of par credited to the shift clock (see ONESHOT-REPORT assumptions). */
export const PAR_CREDIT = 0.65;

export function shiftAward(grade: Grade, tier: FareTier, par: number): number {
  if (grade === "Failed") return 0;
  if (grade === "Late") return Math.min(SHIFT_AWARD_CAP, Math.round(par * 0.3));
  const raw = Math.round(par * PAR_CREDIT) + GRADE_TIME_BONUS[grade] + TIER_INFO[tier].bonus;
  return Math.min(SHIFT_AWARD_CAP, raw);
}

export interface FareBreakdown {
  base: number;
  time: number;
  tips: number;
  accuracy: number;
  discovery: number;
  preference: number;
  total: number;
}

export function fareBreakdown(opts: {
  tier: FareTier; grade: Grade; timeLeft: number; par: number; tips: number; precise: boolean; discovery: number;
  baseMul?: number; preference?: number;
}): FareBreakdown {
  const info = TIER_INFO[opts.tier];
  if (opts.grade === "Failed") {
    return { base: 0, time: 0, tips: Math.round(opts.tips * 0.5), accuracy: 0, discovery: opts.discovery, preference: 0, total: Math.round(opts.tips * 0.5) + opts.discovery };
  }
  const late = opts.grade === "Late";
  const base = Math.round(info.base * (late ? 0.5 : 1) * (opts.baseMul ?? 1));
  const time = late ? 0 : Math.round(Math.max(0, opts.timeLeft / opts.par) * info.base * 0.8);
  const accuracy = opts.precise ? 400 : 150;
  const preference = Math.round(opts.preference ?? 0);
  const tips = Math.round(opts.tips);
  const total = base + time + tips + accuracy + opts.discovery + preference;
  return { base, time, tips, accuracy, discovery: opts.discovery, preference, total };
}

export type Rank = "S" | "A" | "B" | "C" | "D";
export function rankFor(score: number, mode: "arcade" | "quick"): Rank {
  const t = mode === "arcade" ? [55000, 32000, 16000, 7000] : [60000, 38000, 20000, 9000];
  if (score >= t[0]) return "S";
  if (score >= t[1]) return "A";
  if (score >= t[2]) return "B";
  if (score >= t[3]) return "C";
  return "D";
}
