// content-data: global tuning tables. Everything gameplay-relevant is data-driven from here.
export const CONTENT_VERSION = 'k17-slice-1';
export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;
export const SNAPSHOT_EVERY = 3; // 20 Hz snapshots

export const MOVE = {
  walk: 5.2,
  crouch: 2.8,
  sprint: 7.1,
  accel: 32,
  decel: 38,
  airControl: 0.2,
  gravity: 20,
  jumpApex: 0.85,
  sprintDelay: 0.12,
  radius: 0.35,
  standH: 1.8,
  crouchH: 1.25,
  eyeStand: 1.68,
  eyeCrouch: 1.15,
  stepH: 0.4,
  mantleMin: 0.6,
  mantleMax: 1.35,
  mantleReach: 0.8,
  crouchRate: 7, // 1/s, stance blend speed
};
export const JUMP_V = Math.sqrt(2 * MOVE.gravity * MOVE.jumpApex);

export const COMBAT = {
  maxHealth: 100,
  regenDelay: 5,
  regenRate: 22,
  respawnDelay: 3,
  recapTime: 2.5,
  spawnProtect: 2,
  spawnProtectMove: 5,
  assistWindow: 8,
  meleeRange: 2.2,
  meleeCos: 0.62,
  meleeDamage: 55,
  meleeTime: 0.6,
  throwTime: 0.5,
  lagCompMaxTicks: 12, // 200 ms
};

export const MATCH = {
  warmup: 7,
  scoreLimit: 75,
  timeLimit: 480,
  suddenDeath: 60,
  suddenDeathPoints: 5,
  postMatch: 20,
  teamSize: 6,
};

export const MOMENTUM = {
  // stored doubled so assists (0.5) stay integral
  kill: 2,
  assist: 1,
  device: 2,
  tiers: [6, 10, 16],
};

export const SCORE = {
  kill: 100,
  assist: 40,
  sharedAssist: 25,
  headshot: 25,
  longshot: 25,
  double: 50,
  triple: 75,
  payback: 25,
  shutdown: 50,
  firstContact: 50,
  device: 50,
  win: 300,
  completion: 200,
  perMinute: 20,
};

export const TEAM_NAMES = ['Tidewatch', 'Ferrous'] as const;
export const TEAM_LONG = ['Tidewatch Station Security', 'Ferrous Recovery Group'] as const;

export const BOT_NAMES = [
  'Marlow', 'Pike', 'Sable', 'Quill', 'Tarn', 'Voss', 'Wren', 'Ibis', 'Juno', 'Kade', 'Lark', 'Onyx',
  'Flint', 'Ember', 'Dune', 'Cove', 'Brant', 'Arden', 'Hale', 'Nox', 'Rhee', 'Sorrel', 'Teague', 'Vale',
];

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface BotSkill {
  reaction: number; // seconds of continuous sight before a target is acquired
  aimK: number; // aim convergence rate (1/s)
  noise: number; // steady-state aim noise (degrees)
  turnRate: number; // max turn rate (deg/s)
  burstMin: number;
  burstMax: number;
  headPref: number; // chance to aim for the head
  share: boolean; // team shares sightings
  equip: number; // chance factor for equipment use
  recoilComp: number; // fraction of recoil compensated
  routeVariety: number;
}

export const BOT_SKILL: Record<Difficulty, BotSkill> = {
  easy: { reaction: 0.75, aimK: 3.6, noise: 4.8, turnRate: 220, burstMin: 2, burstMax: 5, headPref: 0.04, share: false, equip: 0.35, recoilComp: 0.3, routeVariety: 0.3 },
  normal: { reaction: 0.48, aimK: 5.8, noise: 3.2, turnRate: 320, burstMin: 3, burstMax: 8, headPref: 0.12, share: true, equip: 0.7, recoilComp: 0.55, routeVariety: 0.6 },
  hard: { reaction: 0.27, aimK: 10, noise: 1.5, turnRate: 430, burstMin: 4, burstMax: 12, headPref: 0.26, share: true, equip: 1, recoilComp: 0.8, routeVariety: 0.9 },
};
