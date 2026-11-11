// Ruleset, economy, utility and equipment content. Every replay/match record
// stores RULESET_VERSION so content changes are traceable.

export const RULESET_VERSION = 'lp-rules-0.3.0';
export const PROTOCOL_VERSION = 3;
export const TICK_RATE = 64;
export const DT = 1 / TICK_RATE;

export type UtilityId = 'veil' | 'flash' | 'thermite' | 'pulse' | 'frag';

export interface UtilityDef {
  id: UtilityId;
  name: string;
  blurb: string;
  price: number;
  cap: number;
  /** seconds after throw before detonation; for rest-triggered items it is a max */
  fuse: number;
  /** detonate when grenade comes to rest (smoke/thermite/pulse) */
  onRest: boolean;
  color: string;
}

export const UTILITY: Record<UtilityId, UtilityDef> = {
  veil: { id: 'veil', name: 'Veil Canister', blurb: 'Opaque vision-blocking volume for 17 s.', price: 300, cap: 1, fuse: 2.5, onRest: true, color: '#c8d2dc' },
  flash: { id: 'flash', name: 'Arc Flash', blurb: 'Line-of-sight blinding flash. Look away!', price: 200, cap: 2, fuse: 1.35, onRest: false, color: '#f4f0ff' },
  thermite: { id: 'thermite', name: 'Thermite Vial', blurb: 'Burns authored floor cells for 7 s.', price: 450, cap: 1, fuse: 2.2, onRest: true, color: '#ff7a2a' },
  pulse: { id: 'pulse', name: 'Pulse Shard', blurb: 'Two motion pings revealing coarse enemy direction.', price: 350, cap: 1, fuse: 3.0, onRest: true, color: '#6ff0ff' },
  frag: { id: 'frag', name: 'Fragment Charge', blurb: 'Lethal blast with falloff and cover occlusion.', price: 300, cap: 1, fuse: 1.7, onRest: false, color: '#9aa04a' },
};
export const UTILITY_IDS: UtilityId[] = ['veil', 'flash', 'thermite', 'pulse', 'frag'];
export const MAX_UTILITY = 4;

export const SMOKE = { radius: 4.3, duration: 17, bloomTime: 0.8 };
export const THERMITE = { radius: 3.2, duration: 7, dps: 42, cell: 0.5 };
export const PULSE = { radius: 15, pingTimes: [0.9, 3.4], wedges: 8, hp: 1 };
export const FRAG = { radius: 7.5, maxDamage: 98, armorPen: 0.6 };
export const FLASH = { maxBlind: 4.2, minBlind: 0.4, range: 32 };

export const ARMOR = { vest: 650, vestHelmet: 1000, helmetOnly: 350, kit: 400 };

export interface EconomyRules {
  start: number;
  cap: number;
  win: number;
  lossBase: number;
  lossStep: number;
  lossMax: number;
  plantPersonal: number;
  plantTeam: number;
  defusePersonal: number;
  /** multiplier on loss bonus for attackers still alive when time expires without an arm */
  timeoutSurvivorLossMult: number;
  overtimeMoney: number;
}

export const ECONOMY: EconomyRules = {
  start: 800,
  cap: 12000,
  win: 3000,
  lossBase: 1900,
  lossStep: 400,
  lossMax: 3100,
  plantPersonal: 300,
  plantTeam: 600,
  defusePersonal: 300,
  timeoutSurvivorLossMult: 0.4,
  overtimeMoney: 10000,
};

export interface MatchRules {
  id: string;
  label: string;
  winRounds: number;
  halfRounds: number;
  winBy: number;
  maxRounds: number;
  overtimeHalf: number;
  buyTime: number;
  roundTime: number;
  spikeTime: number;
  armTime: number;
  defuseTime: number;
  defuseKitTime: number;
  roundEndTime: number;
  halftimeExtra: number;
  practice: boolean;
  infiniteMoney: boolean;
}

export const RULES_STANDARD: MatchRules = {
  id: 'standard',
  label: 'Full match - first to 9',
  winRounds: 9,
  halfRounds: 8,
  winBy: 2,
  maxRounds: 20,
  overtimeHalf: 2,
  buyTime: 20,
  roundTime: 105,
  spikeTime: 35,
  armTime: 3.2,
  defuseTime: 8,
  defuseKitTime: 5,
  roundEndTime: 6,
  halftimeExtra: 4,
  practice: false,
  infiniteMoney: false,
};

export const RULES_QUICK: MatchRules = {
  ...RULES_STANDARD,
  id: 'quick',
  label: 'Quick match - first to 5',
  winRounds: 5,
  halfRounds: 4,
  maxRounds: 12,
  buyTime: 15,
};

export const RULES_PRACTICE: MatchRules = {
  ...RULES_STANDARD,
  id: 'practice',
  label: 'Practice range',
  winRounds: 999,
  halfRounds: 999,
  maxRounds: 9999,
  buyTime: 99999,
  roundTime: 99999,
  practice: true,
  infiniteMoney: true,
};

export const PLAYER = {
  height: 1.8,
  crouchHeight: 1.25,
  eye: 1.64,
  crouchEye: 1.12,
  radius: 0.32,
  gravity: 20,
  jumpApex: 0.78,
  accel: 24,
  decel: 30,
  airAccel: 5,
  walkMult: 0.52,
  crouchMult: 0.4,
  stepHeight: 0.45,
  crouchTransition: 0.14,
  maxCrouchTogglesPerSec: 4,
};

export function lossBonus(tier: number, e: EconomyRules = ECONOMY): number {
  if (tier <= 0) return e.lossBase;
  return Math.min(e.lossMax, e.lossBase + e.lossStep * (tier - 1));
}
