// Match rules, economy numbers and utility/equipment tables. Every replay/match record carries RULESET_VERSION.

export const RULESET_VERSION = 'lp-rules-2026.11.1';
export const TICK_RATE = 64;
export const DT = 1 / TICK_RATE;
export const SNAPSHOT_EVERY = 2; // world snapshots at 32 Hz

export type UtilityId = 'veil' | 'flash' | 'thermite' | 'pulse' | 'frag';

export interface UtilityDef {
  id: UtilityId;
  name: string;
  price: number;
  cap: number;
  desc: string;
  fuse: number;
  restitution: number;
}

export const UTILITY: Record<UtilityId, UtilityDef> = {
  veil: {
    id: 'veil',
    name: 'Veil Canister',
    price: 300,
    cap: 1,
    desc: 'Opaque sight-blocking cloud for 17 s once it settles.',
    fuse: 1.3,
    restitution: 0.42,
  },
  flash: {
    id: 'flash',
    name: 'Arc Flash',
    price: 200,
    cap: 2,
    desc: 'Blinds anyone looking at the burst with line of sight.',
    fuse: 1.5,
    restitution: 0.5,
  },
  thermite: {
    id: 'thermite',
    name: 'Thermite Vial',
    price: 450,
    cap: 1,
    desc: 'Burning floor area that denies a position for 7 s.',
    fuse: 2.2,
    restitution: 0.2,
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse Shard',
    price: 350,
    cap: 1,
    desc: 'Two motion pings that reveal a coarse direction wedge.',
    fuse: 1.0,
    restitution: 0.15,
  },
  frag: {
    id: 'frag',
    name: 'Fragment Charge',
    price: 300,
    cap: 1,
    desc: 'Lethal blast with falloff. Cover blocks it.',
    fuse: 1.9,
    restitution: 0.45,
  },
};

export const UTILITY_LIST: UtilityDef[] = Object.values(UTILITY);
export const MAX_UTILITY = 4;

export const UTIL_TUNING = {
  veilRadius: 3.7,
  veilBloom: 0.9,
  veilDuration: 17,
  flashMaxDuration: 3.2,
  flashRange: 26,
  thermiteRadius: 2.9,
  thermiteDuration: 7,
  thermiteDps: 38,
  pulseRadius: 13,
  pulseDelays: [1.2, 3.4],
  pulseHp: 20,
  fragRadius: 7.5,
  fragDamage: 118,
  throwSpeed: 18.5,
  lobSpeed: 9,
  gravity: 15,
};

export type EquipId = 'vest' | 'vesthelm' | 'kit';

export const EQUIPMENT: Record<EquipId, { id: EquipId; name: string; price: number; desc: string }> = {
  vest: { id: 'vest', name: 'Vest', price: 650, desc: '100 armor. Absorbs part of torso and arm damage.' },
  vesthelm: { id: 'vesthelm', name: 'Vest + Helmet', price: 1000, desc: 'Vest plus head protection.' },
  kit: { id: 'kit', name: 'Disarm Kit', price: 400, desc: 'Custodians only. Disarm in 5 s instead of 8 s.' },
};

export interface Ruleset {
  version: string;
  name: string;
  roundsToWin: number;
  swapAfter: number;
  maxRounds: number;
  warmupTime: number;
  buyTime: number;
  roundTime: number;
  spikeTime: number;
  plantTime: number;
  defuseTime: number;
  defuseKitTime: number;
  roundEndTime: number;
  startMoney: number;
  maxMoney: number;
  winReward: number;
  lossBase: number;
  lossStep: number;
  lossMax: number;
  plantPersonal: number;
  plantTeam: number;
  defusePersonal: number;
  /** reward for attackers who survive a time-expiry loss without arming */
  saveReward: number;
  friendlyFire: boolean;
  /** Practice flags */
  infiniteMoney: boolean;
  buyAnywhere: boolean;
  trajectoryPreview: boolean;
}

export const RULES_FULL: Ruleset = {
  version: RULESET_VERSION,
  name: 'Unranked - full match',
  roundsToWin: 9,
  swapAfter: 8,
  maxRounds: 20,
  warmupTime: 4,
  buyTime: 20,
  roundTime: 105,
  spikeTime: 35,
  plantTime: 3.2,
  defuseTime: 8,
  defuseKitTime: 5,
  roundEndTime: 5,
  startMoney: 800,
  maxMoney: 12000,
  winReward: 3000,
  lossBase: 1900,
  lossStep: 400,
  lossMax: 3100,
  plantPersonal: 300,
  plantTeam: 600,
  defusePersonal: 300,
  saveReward: 900,
  friendlyFire: false,
  infiniteMoney: false,
  buyAnywhere: false,
  trajectoryPreview: false,
};

export const RULES_QUICK: Ruleset = {
  ...RULES_FULL,
  name: 'Unranked - quick match',
  roundsToWin: 5,
  swapAfter: 4,
  maxRounds: 12,
};

export const RULES_PRACTICE: Ruleset = {
  ...RULES_FULL,
  name: 'Practice',
  roundsToWin: 99,
  swapAfter: 999,
  maxRounds: 999,
  buyTime: 8,
  roundTime: 600,
  infiniteMoney: true,
  buyAnywhere: true,
  trajectoryPreview: true,
};

/** Loss reward for a team that has now lost `streak` rounds in a row (streak >= 1). */
export function lossReward(rules: Ruleset, streak: number): number {
  return Math.min(rules.lossMax, rules.lossBase + rules.lossStep * Math.max(0, streak - 1));
}

/** Fixed, readable Cipher beep schedule: seconds between beeps given seconds remaining. */
export function beepInterval(remaining: number): number {
  if (remaining > 20) return 1.0;
  if (remaining > 10) return 0.5;
  if (remaining > 5) return 0.25;
  return 0.125;
}

export const PLAYER = {
  halfWidth: 0.3,
  standHeight: 1.78,
  crouchHeight: 1.25,
  standEye: 1.62,
  crouchEye: 1.1,
  stepHeight: 0.3,
  gravity: 20,
  jumpHeight: 0.78,
  accel: 24,
  counterDecel: 30,
  friction: 18,
  airAccel: 5,
  walkMul: 0.52,
  crouchMul: 0.4,
  crouchTime: 0.18,
  useRange: 1.9,
};

export const BOT_NAMES = [
  'Vega', 'Orrin', 'Sable', 'Quill', 'Marlo', 'Tamsin', 'Ibex', 'Corvin', 'Nyx', 'Halden',
  'Rue', 'Pike', 'Juno', 'Brant', 'Lark', 'Odell', 'Wren', 'Castor',
];
