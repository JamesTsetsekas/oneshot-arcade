// shared-content: movement constants, storm phases, loot tables, match rules.
import type { ItemId } from "./items";
import type { AmmoType, WeaponId } from "./weapons";

export const MOVE = {
  walk: 4.8,
  run: 5.8,
  sprint: 7.3,
  crouch: 2.8,
  sprintEnergy: 5, // seconds of sprint
  sprintRegenDelay: 1.25,
  sprintRegenTime: 3.5, // seconds from empty to full
  slideMinSpeed: 5.5,
  slideDuration: 1.0,
  slideMaxDuration: 2.4,
  slideGate: 1.2,
  slideBoost: 1.12,
  gravity: 22,
  jumpSpeed: 6.66, // ~0.9 m apex with 30 Hz semi-implicit integration
  mantleMin: 0.6,
  mantleMax: 1.5,
  swimDepth: 1.1,
  swim: 4.2,
  swimSprint: 5.2,
  fallSafeSpeed: 17,
  fallDamagePerSpeed: 5.5,
  zipSpeed: 13,
  ascendSpeed: 6,
  ventPower: 30,
  freefallTerminal: 36,
  freefallDive: 56,
  freefallSteer: 20,
  glideSpeed: 19,
  glideDiveSpeed: 25,
  glideSink: 7,
  glideDiveSink: 16,
  autoDeployHeight: 75,
  redeployClearance: 10,
  radius: 0.4,
  height: 1.8,
  crouchHeight: 1.2,
  step: 0.45,
  eye: 1.55,
  eyeCrouch: 1.0,
} as const;

export const CAMERA = {
  boom: 3.1,
  shoulder: 0.55,
  height: 0.35,
  hfovDefault: 90,
} as const;

export const SKIFF = { altitude: 300, speed: 34 } as const;
export const STAGING_SECONDS = 35;
export const SEATS = 24;
export const INTEREST_RADIUS = 240;
export const LOOT_INTEREST_RADIUS = 90;

export interface StormPhase {
  /** Seconds the field holds before moving. */
  wait: number;
  /** Seconds the contraction takes. */
  shrink: number;
  fromR: number;
  toR: number;
  /** Health damage per second outside the field during this phase. */
  dps: number;
  moving?: boolean;
}

/** Calmfield schedule from the brief. Index 0 is the staging "whole island" phase. */
export const STORM_PHASES: readonly StormPhase[] = [
  { wait: 90, shrink: 0, fromR: 430, toR: 430, dps: 0 },
  { wait: 0, shrink: 120, fromR: 430, toR: 320, dps: 1 },
  { wait: 70, shrink: 90, fromR: 320, toR: 210, dps: 2 },
  { wait: 55, shrink: 75, fromR: 210, toR: 125, dps: 4 },
  { wait: 40, shrink: 60, fromR: 125, toR: 70, dps: 7 },
  { wait: 30, shrink: 45, fromR: 70, toR: 35, dps: 10 },
  // Endgame: moving 30 m field, three 45-second legs, then final collapse.
  { wait: 0, shrink: 45, fromR: 35, toR: 30, dps: 12, moving: true },
  { wait: 0, shrink: 45, fromR: 30, toR: 30, dps: 12, moving: true },
  { wait: 0, shrink: 45, fromR: 30, toR: 30, dps: 12, moving: true },
  { wait: 0, shrink: 40, fromR: 30, toR: 0, dps: 14 },
];

export type Pace = "standard" | "blitz";
export const PACE_SCALE: Record<Pace, number> = { standard: 1, blitz: 0.4 };

// ---- Loot tables ----

export const WEAPON_WEIGHTS: Record<WeaponId, number> = {
  wayfarer: 16, tempest: 12, breakwater: 12, coil: 9, needler: 13, sundial: 9, longwake: 4, harbor: 16, gale: 3,
};

/** Rarity weights by location tier (index = tier 1..4; tier 4 is vault / capsule / caravan). */
export const RARITY_WEIGHTS: Record<number, readonly number[]> = {
  1: [60, 30, 9, 1, 0],
  2: [45, 33, 17, 5, 0],
  3: [32, 34, 24, 10, 0],
  4: [0, 14, 40, 34, 12],
};

export const FLOOR_CATEGORY_WEIGHTS = { weapon: 36, ammo: 22, heal: 16, shield: 13, utility: 13 } as const;
export type LootCategory = keyof typeof FLOOR_CATEGORY_WEIGHTS;

export const HEAL_WEIGHTS: readonly [ItemId, number][] = [["injector", 75], ["trauma", 25]];
export const SHIELD_WEIGHTS: readonly [ItemId, number][] = [["flask", 72], ["cell", 28]];
export const UTILITY_WEIGHTS: readonly [ItemId, number][] = [["mist", 26], ["grapple", 26], ["beacon", 20], ["orb", 28]];
export const AMMO_WEIGHTS: readonly [AmmoType, number][] = [["light", 46], ["shell", 24], ["heavy", 22], ["charge", 8]];

/** Stack size a world pickup of each item spawns with. */
export const ITEM_SPAWN_COUNT: Record<ItemId, number> = {
  injector: 2, trauma: 1, flask: 2, cell: 1, mist: 1, grapple: 3, beacon: 1, orb: 2,
};

export const CHEST_OPEN_RANGE = 2.8;
export const PICKUP_RANGE = 2.8;
export const AUTO_AMMO_RANGE = 1.7;
export const SWAP_HOLD_SECONDS = 0.3;
export const KILL_CREDIT_WINDOW = 12;
export const LAG_COMP_MAX = 0.18;
export const MELEE_DAMAGE = 25;
export const MELEE_RANGE = 2.3;
export const MELEE_COOLDOWN = 0.6;
export const HEAT_CHANNEL_DPS = 14;
