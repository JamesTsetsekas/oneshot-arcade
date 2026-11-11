// Economy, utility, armour and ruleset content. Pure data. RULESET_VERSION is stamped into every match record.

export const RULESET_VERSION = '2026.11.1-slice';

export type UtilityId = 'veil' | 'flash' | 'thermite' | 'pulse' | 'frag';

export interface UtilityDef {
  id: UtilityId;
  name: string;
  price: number;
  /** Per-type carry cap. */
  max: number;
  blurb: string;
  color: string;
}

export const UTILITY: Record<UtilityId, UtilityDef> = {
  veil: { id: 'veil', name: 'Veil Canister', price: 300, max: 1, blurb: 'Blooms into an opaque volume for 17 s.', color: '#9fb3c8' },
  flash: { id: 'flash', name: 'Arc Flash', price: 200, max: 2, blurb: 'Line-of-sight flash. Look away.', color: '#fff6c8' },
  thermite: { id: 'thermite', name: 'Thermite Vial', price: 450, max: 1, blurb: 'Burns authored floor cells for 7 s.', color: '#ff8a3c' },
  pulse: { id: 'pulse', name: 'Pulse Shard', price: 350, max: 1, blurb: 'Two motion pings reveal a coarse wedge of movement.', color: '#4de0ff' },
  frag: { id: 'frag', name: 'Fragment Charge', price: 300, max: 1, blurb: 'Lethal displacement grenade with falloff.', color: '#ff5d73' },
};

export const UTILITY_LIST = Object.values(UTILITY);
export const MAX_UTILITY = 4;

export const ARMOR = {
  vest: { name: 'Ablative Vest', price: 650 },
  vestHelmet: { name: 'Vest + Helmet', price: 1000 },
  helmetUpgrade: 350,
  kit: { name: 'Defuse Tool', price: 400 },
};

export const ECON = {
  startMoney: 800,
  cap: 12000,
  roundWin: 3000,
  lossBase: 1900,
  lossStep: 400,
  lossMaxTier: 3, // 1900, 2300, 2700, 3100
  armPersonal: 300,
  armTeam: 600,
  defusePersonal: 300,
  /** Attackers that lose by timer without ever arming get their loss reward reduced. */
  timeoutNoArmPenalty: 500,
};

export const PHASES = {
  warmup: 6,
  buy: 20,
  action: 105,
  armed: 35,
  roundEnd: 5,
  halftime: 7,
};

export const OBJECTIVE = {
  armTime: 3.2,
  defuseTime: 8,
  defuseTimeKit: 5,
  /** Distance within which a defuser must stand from the Spike. */
  defuseRange: 2.4,
  /** Beep interval while `remaining` seconds are left (fixed, readable schedule). */
  beepInterval(remaining: number): number {
    if (remaining > 10) return 1.0;
    if (remaining > 5) return 0.5;
    return 0.25;
  },
};

export interface RuleSet {
  id: 'quick' | 'full' | 'practice';
  name: string;
  /** Rounds required to win (also win-by-2). */
  winRounds: number;
  /** Rounds per half before the side swap. */
  halfRounds: number;
  /** Hard cap on total rounds; a tie at the cap is a draw. */
  maxRounds: number;
  winBy: number;
  blurb: string;
}

export const RULESETS: Record<'quick' | 'full' | 'practice', RuleSet> = {
  practice: { id: 'practice', name: 'Practice', winRounds: 99, halfRounds: 99, maxRounds: 400, winBy: 2, blurb: 'Endless rounds with unlimited money.' },
  quick: { id: 'quick', name: 'Quick Match', winRounds: 5, halfRounds: 4, maxRounds: 12, winBy: 2, blurb: 'First to 5, swap after 4. Around 10 minutes.' },
  full: { id: 'full', name: 'Full Match', winRounds: 9, halfRounds: 8, maxRounds: 20, winBy: 2, blurb: 'First to 9, swap after 8, win by 2, max 20 rounds. Around 25 minutes.' },
};

export const MOVEMENT = {
  tickRate: 64,
  accel: 24,
  decel: 30,
  airAccel: 5,
  gravity: 20,
  jumpSpeed: 5.6, // apex = v^2 / 2g = 0.784 m
  walkMul: 0.52,
  crouchMul: 0.4,
  halfWidth: 0.34,
  standHeight: 1.8,
  crouchHeight: 1.3,
  standEye: 1.62,
  crouchEye: 1.17,
  stepHeight: 0.46,
  crouchRate: 5.5,
  /** Below this horizontal speed the weapon reaches its tight stationary baseline. */
  accuracySpeed: 0.45,
};

export const HITBOX = {
  headRadius: 0.17,
};
