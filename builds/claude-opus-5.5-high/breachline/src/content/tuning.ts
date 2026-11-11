// Data-driven tuning targets. Values come from the Breachline brief and are the
// single source of truth for both the authoritative room and client feedback.
export const CONTENT_VERSION = "k17-tc-1";

export const MOVE = {
  standSpeed: 5.2,
  crouchSpeed: 2.8,
  sprintSpeed: 7.1,
  groundAccel: 32,
  groundDecel: 38,
  airControl: 0.2,
  gravity: 18,
  jumpApex: 0.85,
  get jumpVel() { return Math.sqrt(2 * this.gravity * this.jumpApex); },
  sprintDelay: 0.12,
  radius: 0.34,
  standHeight: 1.8,
  crouchHeight: 1.25,
  eyeStand: 1.68,
  eyeCrouch: 1.15,
  stepHeight: 0.45,
  mantleMin: 0.6,
  mantleMax: 1.35,
  mantleTime: 0.38,
  mantleReach: 0.75,
  maxFallSpeed: 30,
};

export const COMBAT = {
  maxHealth: 100,
  regenDelay: 5.0,
  regenRate: 22,
  spawnProtectTime: 2.0,
  spawnProtectMove: 5.0,
  assistWindow: 8,
  assistMinDamage: 20,
  meleeDamage: 55,
  meleeRange: 2.1,
  meleeConeDeg: 38,
  meleeTime: 0.55,
  meleeHitAt: 0.12,
  meleeLungeMax: 1.2,
  respawnDelay: 3.0,
  recapTime: 2.5,
  lagCompMaxMs: 200,
};

export const MATCH = {
  scoreLimit: 75,
  timeLimit: 8 * 60,
  warmup: 8,
  suddenDeathTime: 60,
  suddenDeathTarget: 5,
  postMatch: 25,
  teamSize: 6,
  tickRate: 60,
  snapshotRate: 20,
};

export const MOMENTUM = {
  kill: 1,
  assist: 0.5,
  supportDestroyed: 1,
  tiers: [3, 5, 8] as const,
};

export const SCORE = {
  kill: 100,
  assist: 50,
  headshot: 25,
  supportDestroyed: 75,
  supportKill: 50,
  equipmentAssist: 25,
  revenge: 25,
  longshot: 25,
  firstBlood: 50,
};
