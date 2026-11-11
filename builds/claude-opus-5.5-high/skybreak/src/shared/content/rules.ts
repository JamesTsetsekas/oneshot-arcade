// Match rules, storm phases and movement constants. Versioned so each match
// records the ruleset it ran with.

export const RULESET_VERSION = 'skybreak-rules-1.0.0';
export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;

export const MOVE = {
  walk: 4.8,
  run: 5.8,
  sprint: 7.3,
  crouch: 2.8,
  staminaMax: 5,
  staminaRegenDelay: 1.25,
  staminaRegenRate: 1.6,
  slideMinSpeed: 5.5,
  slideDuration: 1.0,
  slideGate: 1.2,
  slideBoost: 9.0,
  gravity: 22,
  jumpVel: 6.6, // apex ~0.9 m with gravity 22 at 30Hz integration
  mantleMin: 0.6,
  mantleMax: 1.5,
  stepHeight: 0.45,
  swimDepth: 1.1,
  swimSpeed: 4.2,
  swimSprint: 5.2,
  fallDamageSpeed: 15,
  fallDamagePerMs: 7,
  zipSpeed: 15,
  ascendSpeed: 8,
  freefallTerminal: 52,
  freefallDive: 68,
  freefallHoriz: 22,
  glideDescent: 7,
  glideDescentBrake: 5,
  glideSpeed: 21,
  glideAutoDeploy: 60, // metres above ground
  glideManualMin: 12,
  ventLaunch: 42,
  grappleSpeed: 30,
  grappleRange: 48,
  radius: 0.35,
  height: 1.8,
  crouchHeight: 1.2,
  eyeHeight: 1.6,
};

export const HEALTH_MAX = 100;
export const AEGIS_MAX = 50;
export const RESERVE_MAX = 50;
export const AEGIS_DELAY = 8;
export const AEGIS_RATE = 10;
export const ATTRIBUTION_WINDOW = 12;

export interface StormPhase {
  wait: number;
  shrink: number;
  radius: number; // target radius at end of shrink
  damage: number;
  moving?: boolean;
}

/** Calmfield phases from the brief. Phase 0 is the whole island for 90s. */
export const STORM_PHASES: readonly StormPhase[] = [
  { wait: 90, shrink: 0, radius: 430, damage: 1 }, // storm forms at 430m after 90s
  { wait: 0, shrink: 120, radius: 320, damage: 1 },
  { wait: 70, shrink: 90, radius: 210, damage: 2 },
  { wait: 55, shrink: 75, radius: 125, damage: 4 },
  { wait: 40, shrink: 60, radius: 70, damage: 7 },
  { wait: 30, shrink: 45, radius: 35, damage: 10 },
  // Endgame: moving 30m field, 45s legs, then final collapse.
  { wait: 15, shrink: 45, radius: 30, damage: 12, moving: true },
  { wait: 0, shrink: 45, radius: 30, damage: 12, moving: true },
  { wait: 0, shrink: 45, radius: 30, damage: 14, moving: true },
  { wait: 0, shrink: 45, radius: 0, damage: 16 },
];

export const STAGING_SECONDS = 35;
export const SKIFF_ALTITUDE = 320;
export const SKIFF_SPEED = 36;
export const MATCH_SEATS = 24;

export type MatchPace = 'standard' | 'short';
export const PACE_SCALE: Record<MatchPace, number> = { standard: 1, short: 0.45 };
