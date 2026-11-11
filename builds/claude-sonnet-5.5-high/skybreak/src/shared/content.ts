/**
 * shared-content: all data-driven rules (weapons, rarity, items, loot tiers, storm, movement).
 * Version string is recorded per match so content changes are traceable.
 */
export const CONTENT_VERSION = 'skybreak-content-0.1.0';
export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;

export type AmmoType = 'light' | 'shell' | 'heavy' | 'charge';
export const AMMO_TYPES: AmmoType[] = ['light', 'shell', 'heavy', 'charge'];
export const AMMO_CAPS: Record<AmmoType, number> = { light: 240, shell: 48, heavy: 80, charge: 18 };
export const AMMO_PICKUP: Record<AmmoType, number> = { light: 30, shell: 8, heavy: 10, charge: 3 };
export const AMMO_NAMES: Record<AmmoType, string> = { light: 'Light', shell: 'Shell', heavy: 'Heavy', charge: 'Charge' };
export const AMMO_COLORS: Record<AmmoType, string> = { light: '#f0c060', shell: '#e0675a', heavy: '#7fb0ff', charge: '#c490ff' };

/* ----------------------------------------------------------------- Rarity */
export type RarityShape = 'circle' | 'chevron' | 'diamond' | 'crown' | 'star';
export interface RarityDef {
  id: number;
  key: string;
  name: string;
  color: string;
  colorBlind: string;
  shape: RarityShape;
  damage: number;
  reload: number;
  spread: number;
  recoil: number;
  rate: number;
  mag: number;
  note: string;
}
export const RARITIES: RarityDef[] = [
  { id: 0, key: 'field', name: 'Field', color: '#a7b0ba', colorBlind: '#a7b0ba', shape: 'circle', damage: 1, reload: 1, spread: 1, recoil: 1, rate: 1, mag: 1, note: 'Reliable baseline' },
  { id: 1, key: 'tuned', name: 'Tuned', color: '#5fd37a', colorBlind: '#ffd166', shape: 'chevron', damage: 1.03, reload: 0.92, spread: 1, recoil: 1, rate: 1, mag: 1, note: 'Faster reload, +3% damage' },
  { id: 2, key: 'advanced', name: 'Advanced', color: '#58a6ff', colorBlind: '#2a9df4', shape: 'diamond', damage: 1.05, reload: 0.92, spread: 0.92, recoil: 0.9, rate: 1, mag: 1, note: 'Steadier aim, +5% damage' },
  { id: 3, key: 'masterwork', name: 'Masterwork', color: '#b07cff', colorBlind: '#ff7ab6', shape: 'crown', damage: 1.06, reload: 0.9, spread: 0.9, recoil: 0.88, rate: 1, mag: 1.25, note: 'Extended magazine fitted' },
  { id: 4, key: 'prototype', name: 'Prototype', color: '#ffc83d', colorBlind: '#ffffff', shape: 'star', damage: 1.08, reload: 0.9, spread: 1.15, recoil: 1.3, rate: 1.14, mag: 1, note: 'Overclocked: +14% fire rate, harder recoil' },
];
export const PROTOTYPE_MATCH_CAP = 3;

/* ---------------------------------------------------------------- Weapons */
export type WeaponId =
  | 'wayfarer' | 'tempest' | 'breakwater' | 'coil' | 'needler'
  | 'sundial' | 'longwake' | 'harbor' | 'gale';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cls: string;
  ammo: AmmoType;
  kind: 'hitscan' | 'projectile' | 'launcher';
  auto: boolean;
  damage: number; // per bullet / pellet
  pellets: number;
  pelletCap: number; // max aggregate damage per shot (shotguns), 0 = none
  rpm: number;
  mag: number;
  reload: number;
  swap: number;
  windup: number;
  spread: number; // degrees hip, standing
  adsSpread: number;
  bloomPerShot: number;
  bloomMax: number;
  recoil: [number, number][]; // [pitch deg, yaw deg] repeating pattern
  headMult: number;
  falloffStart: number;
  falloffEnd: number;
  falloffMin: number;
  range: number;
  projSpeed: number;
  projGravity: number;
  splash: number; // launcher splash radius
  push: number; // launcher displacement impulse
  adsFov: number; // fov multiplier when aiming
  adsBoom: number;
  color: string;
  blurb: string;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  wayfarer: {
    id: 'wayfarer', name: 'Wayfarer Rifle', cls: 'Rifle', ammo: 'light', kind: 'hitscan', auto: true,
    damage: 22, pellets: 1, pelletCap: 0, rpm: 400, mag: 30, reload: 2.2, swap: 0.5, windup: 0,
    spread: 1.3, adsSpread: 0.35, bloomPerShot: 0.18, bloomMax: 1.3,
    recoil: [[0.55, 0.05], [0.6, -0.08], [0.62, 0.12], [0.6, 0.1], [0.58, -0.12], [0.62, -0.06]],
    headMult: 1.75, falloffStart: 45, falloffEnd: 120, falloffMin: 0.7, range: 400,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.78, adsBoom: 2.2,
    color: '#d9c9a0', blurb: 'Balanced medium-range automatic.',
  },
  tempest: {
    id: 'tempest', name: 'Tempest Carbine', cls: 'Carbine', ammo: 'light', kind: 'hitscan', auto: true,
    damage: 16, pellets: 1, pelletCap: 0, rpm: 660, mag: 28, reload: 2.0, swap: 0.45, windup: 0,
    spread: 1.7, adsSpread: 0.6, bloomPerShot: 0.22, bloomMax: 1.8,
    recoil: [[0.7, 0.2], [0.8, -0.3], [0.85, 0.35], [0.8, -0.2], [0.9, 0.3], [0.85, -0.4]],
    headMult: 1.6, falloffStart: 30, falloffEnd: 85, falloffMin: 0.6, range: 300,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.82, adsBoom: 2.1,
    color: '#7ad7c8', blurb: 'High rate of fire, punishing recoil.',
  },
  breakwater: {
    id: 'breakwater', name: 'Breakwater Scattergun', cls: 'Pump Shotgun', ammo: 'shell', kind: 'hitscan', auto: false,
    damage: 11, pellets: 10, pelletCap: 105, rpm: 70, mag: 5, reload: 3.1, swap: 0.6, windup: 0,
    spread: 4.6, adsSpread: 3.4, bloomPerShot: 0, bloomMax: 0,
    recoil: [[5.5, 0.4]],
    headMult: 1.5, falloffStart: 7, falloffEnd: 26, falloffMin: 0.3, range: 60,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.88, adsBoom: 2.3,
    color: '#e7a15a', blurb: 'Pump shotgun with a huge close burst.',
  },
  coil: {
    id: 'coil', name: 'Coil Shotgun', cls: 'Auto Shotgun', ammo: 'shell', kind: 'hitscan', auto: false,
    damage: 7, pellets: 8, pelletCap: 66, rpm: 170, mag: 6, reload: 3.0, swap: 0.5, windup: 0,
    spread: 4.2, adsSpread: 3.2, bloomPerShot: 0, bloomMax: 0,
    recoil: [[3.4, 0.5], [3.6, -0.5]],
    headMult: 1.5, falloffStart: 7, falloffEnd: 24, falloffMin: 0.3, range: 55,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.88, adsBoom: 2.3,
    color: '#c97a5a', blurb: 'Semi-auto shotgun, lower damage per shot.',
  },
  needler: {
    id: 'needler', name: 'Needler SMG', cls: 'SMG', ammo: 'light', kind: 'hitscan', auto: true,
    damage: 11, pellets: 1, pelletCap: 0, rpm: 820, mag: 36, reload: 1.8, swap: 0.25, windup: 0,
    spread: 2.0, adsSpread: 0.9, bloomPerShot: 0.2, bloomMax: 2.2,
    recoil: [[0.4, 0.3], [0.45, -0.35], [0.5, 0.3], [0.45, -0.3]],
    headMult: 1.5, falloffStart: 14, falloffEnd: 48, falloffMin: 0.42, range: 160,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.86, adsBoom: 2.2,
    color: '#8fb5ff', blurb: 'Fast-swapping close weapon with sharp falloff.',
  },
  sundial: {
    id: 'sundial', name: 'Sundial DMR', cls: 'Precision Rifle', ammo: 'heavy', kind: 'hitscan', auto: false,
    damage: 44, pellets: 1, pelletCap: 0, rpm: 215, mag: 12, reload: 2.7, swap: 0.6, windup: 0,
    spread: 0.9, adsSpread: 0.06, bloomPerShot: 0.35, bloomMax: 1.2,
    recoil: [[1.5, 0.15], [1.6, -0.2]],
    headMult: 2.0, falloffStart: 80, falloffEnd: 220, falloffMin: 0.85, range: 500,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.45, adsBoom: 1.9,
    color: '#f1d27a', blurb: 'Semi-auto precision rifle, strong head pressure.',
  },
  longwake: {
    id: 'longwake', name: 'Longwake Rail', cls: 'Marksman Rail', ammo: 'heavy', kind: 'projectile', auto: false,
    damage: 88, pellets: 1, pelletCap: 0, rpm: 52, mag: 5, reload: 3.2, swap: 0.7, windup: 0.28,
    spread: 0.8, adsSpread: 0.02, bloomPerShot: 0, bloomMax: 0,
    recoil: [[3.2, 0.2]],
    headMult: 2.0, falloffStart: 120, falloffEnd: 350, falloffMin: 0.9, range: 600,
    projSpeed: 230, projGravity: 5, splash: 0, push: 0, adsFov: 0.3, adsBoom: 1.8,
    color: '#c7a1ff', blurb: 'Projectile marksman rifle: lead your shots.',
  },
  harbor: {
    id: 'harbor', name: 'Harbor Pistol', cls: 'Sidearm', ammo: 'light', kind: 'hitscan', auto: false,
    damage: 18, pellets: 1, pelletCap: 0, rpm: 330, mag: 15, reload: 1.5, swap: 0.2, windup: 0,
    spread: 1.2, adsSpread: 0.3, bloomPerShot: 0.3, bloomMax: 1.2,
    recoil: [[1.0, 0.15], [1.1, -0.15]],
    headMult: 1.6, falloffStart: 25, falloffEnd: 70, falloffMin: 0.6, range: 200,
    projSpeed: 0, projGravity: 0, splash: 0, push: 0, adsFov: 0.85, adsBoom: 2.4,
    color: '#b8c4cf', blurb: 'Common, reliable sidearm.',
  },
  gale: {
    id: 'gale', name: 'Gale Launcher', cls: 'Utility Launcher', ammo: 'charge', kind: 'launcher', auto: false,
    damage: 12, pellets: 1, pelletCap: 0, rpm: 55, mag: 3, reload: 3.0, swap: 0.6, windup: 0,
    spread: 0.5, adsSpread: 0.2, bloomPerShot: 0, bloomMax: 0,
    recoil: [[2.4, 0]],
    headMult: 1, falloffStart: 999, falloffEnd: 1000, falloffMin: 1, range: 120,
    projSpeed: 44, projGravity: 7, splash: 6, push: 15, adsFov: 0.85, adsBoom: 2.3,
    color: '#8fe3ff', blurb: 'Concussive wind orbs: low damage, big displacement.',
  },
};
export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];

/** Per-weapon loot weight (Harbor Pistol is the common sidearm). */
export const WEAPON_LOOT_WEIGHT: Record<WeaponId, number> = {
  wayfarer: 20, tempest: 12, breakwater: 10, coil: 8, needler: 12, sundial: 7, longwake: 3.5, harbor: 15, gale: 3,
};

export interface EffectiveWeapon {
  def: WeaponDef;
  rarity: RarityDef;
  damage: number;
  rpm: number;
  mag: number;
  reload: number;
  spread: number;
  recoil: number;
}
export function effectiveWeapon(id: WeaponId, rarity: number): EffectiveWeapon {
  const def = WEAPONS[id];
  const r = RARITIES[rarity];
  return {
    def, rarity: r,
    damage: def.damage * r.damage,
    rpm: def.rpm * r.rate,
    mag: Math.round(def.mag * r.mag),
    reload: def.reload * r.reload,
    spread: r.spread,
    recoil: r.recoil,
  };
}

/** Linear damage falloff by distance. */
export function falloffMult(def: WeaponDef, dist: number): number {
  if (dist <= def.falloffStart) return 1;
  if (dist >= def.falloffEnd) return def.falloffMin;
  const t = (dist - def.falloffStart) / (def.falloffEnd - def.falloffStart);
  return 1 - (1 - def.falloffMin) * t;
}

/* ------------------------------------------------------------------ Items */
export type ItemId =
  | 'medInjector' | 'traumaKit' | 'shieldFlask' | 'aegisCell'
  | 'mistCapsule' | 'grappleSpool' | 'echoBeacon' | 'windOrb';

export interface ItemDef {
  id: ItemId;
  name: string;
  stack: number;
  useTime: number;
  slow: number; // movement multiplier while using
  cancelOnDamage: boolean;
  blurb: string;
  color: string;
  category: 'heal' | 'shield' | 'utility';
}
export const ITEMS: Record<ItemId, ItemDef> = {
  medInjector: { id: 'medInjector', name: 'Med Injector', stack: 4, useTime: 3, slow: 0.55, cancelOnDamage: false, blurb: '+35 Health over 3s', color: '#ff6b7a', category: 'heal' },
  traumaKit: { id: 'traumaKit', name: 'Trauma Kit', stack: 2, useTime: 7, slow: 0.35, cancelOnDamage: true, blurb: 'Restore to 100 Health over 7s. Damage cancels.', color: '#ff3d55', category: 'heal' },
  shieldFlask: { id: 'shieldFlask', name: 'Shield Flask', stack: 4, useTime: 2.5, slow: 0.6, cancelOnDamage: false, blurb: '+25 Reserve Shield (max 50)', color: '#4fd0ff', category: 'shield' },
  aegisCell: { id: 'aegisCell', name: 'Aegis Cell', stack: 2, useTime: 3, slow: 0.6, cancelOnDamage: false, blurb: 'Starts Aegis recharge immediately', color: '#7cf0d0', category: 'shield' },
  mistCapsule: { id: 'mistCapsule', name: 'Mist Capsule', stack: 2, useTime: 0, slow: 1, cancelOnDamage: false, blurb: 'Throw: 9s smoke cover', color: '#d6d2ff', category: 'utility' },
  grappleSpool: { id: 'grappleSpool', name: 'Grapple Spool', stack: 3, useTime: 0, slow: 1, cancelOnDamage: false, blurb: 'Pull to terrain up to 55m (3 charges)', color: '#ffb25a', category: 'utility' },
  echoBeacon: { id: 'echoBeacon', name: 'Echo Beacon', stack: 2, useTime: 0, slow: 1, cancelOnDamage: false, blurb: 'Reveal recent trails nearby for 8s', color: '#ffe36b', category: 'utility' },
  windOrb: { id: 'windOrb', name: 'Wind Orb', stack: 4, useTime: 0, slow: 1, cancelOnDamage: false, blurb: 'Throw: concussive displacement', color: '#9be7ff', category: 'utility' },
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
export const INVENTORY_SLOTS = 5;

/* -------------------------------------------------------------- Loot tiers */
/** Rarity weights by location tier (index = rarity 0..4). Prototype never rolls on the ground. */
export const TIER_RARITY: Record<number, number[]> = {
  1: [62, 27, 9, 2, 0],
  2: [44, 31, 17, 8, 0],
  3: [28, 30, 25, 17, 0],
  4: [8, 22, 36, 34, 0], // Kilnworks vault
  5: [0, 0, 20, 50, 30], // supply capsule
};
export const FLOOR_CATEGORY_WEIGHTS = { weapon: 38, ammo: 26, heal: 18, shield: 10, utility: 8 };
export const HEAL_ROLL: [ItemId, number][] = [['medInjector', 50], ['traumaKit', 15], ['shieldFlask', 0], ['aegisCell', 0]];
export const UTILITY_ROLL: [ItemId, number][] = [['mistCapsule', 24], ['grappleSpool', 22], ['echoBeacon', 20], ['windOrb', 34]];
export const SHIELD_ROLL: [ItemId, number][] = [['shieldFlask', 70], ['aegisCell', 30]];

/* ------------------------------------------------------------------ Combat */
export const COMBAT = {
  maxHealth: 100,
  maxAegis: 50,
  maxReserve: 50,
  aegisDelay: 8,
  aegisRate: 10,
  assistWindow: 12,
  limbMult: 0.8,
  torsoMult: 1,
  meleeDamage: 28,
  meleeRange: 2.4,
  meleeCooldown: 0.7,
  fallDamageSpeed: 14,
  fallDamagePerMs: 5.5,
};

/* ---------------------------------------------------------------- Movement */
export const MOVE = {
  walk: 4.8,
  run: 5.8,
  sprint: 7.3,
  crouch: 2.8,
  swim: 4.2,
  swimSprint: 5.2,
  sprintEnergy: 5,
  sprintRegenDelay: 1.25,
  gravity: 20,
  jumpSpeed: 6.35, // tuned so the discrete 30 Hz apex is ~0.9 m
  slideMinSpeed: 5.5,
  slideDuration: 1.0,
  slideCooldown: 1.2,
  slideSpeedBoost: 1.12,
  radius: 0.4,
  heightStand: 1.8,
  heightCrouch: 1.3,
  heightSlide: 1.0,
  heightSwim: 1.0,
  stepHeight: 0.55,
  mantleMin: 0.6,
  mantleMax: 1.5,
  slopeLimit: 1.35,
  accelGround: 42,
  accelAir: 6,
  swimDepth: 1.1,
  freefallTerminal: 58,
  freefallDive: 74,
  freefallHoriz: 26,
  freefallHorizMin: 9,
  glideDescent: 6.5,
  glideSpeed: 17,
  glideSpeedBoost: 23,
  autoDeployAGL: 140,
  minDeployAGL: 25,
  zipSpeed: 15,
  grappleRange: 55,
  grappleSpeed: 26,
};

/* ------------------------------------------------------------------- Storm */
export interface StormPhaseDef {
  wait: number;
  shrink: number;
  toRadius: number;
  damage: number;
}
/** Phase 0 is the whole island. Index 1..5 follow the brief; endgame legs follow. */
export const STORM_PHASES: StormPhaseDef[] = [
  { wait: 90, shrink: 0, toRadius: 560, damage: 0 }, // phase 0: whole island
  { wait: 0, shrink: 120, toRadius: 320, damage: 1 }, // 430 -> 320 (opens with a 10 s sweep from the island edge)
  { wait: 70, shrink: 90, toRadius: 210, damage: 2 },
  { wait: 55, shrink: 75, toRadius: 125, damage: 4 },
  { wait: 40, shrink: 60, toRadius: 70, damage: 7 },
  { wait: 30, shrink: 45, toRadius: 35, damage: 10 },
  { wait: 0, shrink: 45, toRadius: 30, damage: 10 }, // endgame leg 1 (moving 30 m field)
  { wait: 0, shrink: 45, toRadius: 30, damage: 12 }, // endgame leg 2
  { wait: 0, shrink: 40, toRadius: 4, damage: 15 }, // final collapse
];
export const STORM_START_RADIUS = 560;
export const STORM_PHASE1_START_RADIUS = 430;
export const STORM_SWEEP_SECONDS = 10;
export const ISLAND_SIZE = 1200;
export const WATER_LEVEL = 0;

/* ------------------------------------------------------------------ Match */
export const MATCH = {
  players: 24,
  stagingSeconds: 35,
  skiffAltitude: 400,
  skiffSpeed: 42,
  skiffHalfLength: 760,
  capsuleStartPhase: 3,
  capsuleCount: 3,
};

export const COSMETICS = [
  { name: 'Ember', primary: '#e9703c', secondary: '#f4e0b8', accent: '#3c2a22' },
  { name: 'Tide', primary: '#2fb7c4', secondary: '#f3f0dc', accent: '#16424a' },
  { name: 'Orchard', primary: '#6fbf5a', secondary: '#f0e3b5', accent: '#2f4a28' },
  { name: 'Dusk', primary: '#8b6ad8', secondary: '#f0e0f5', accent: '#2c2354' },
];

export const BOT_NAMES = [
  'Kestrel', 'Marlow', 'Juniper', 'Pike', 'Sable', 'Wren', 'Tamsin', 'Orrin', 'Fenwick', 'Lark', 'Ostra', 'Bram',
  'Isolde', 'Cormac', 'Nettle', 'Halcyon', 'Rook', 'Vesper', 'Dunmore', 'Calla', 'Thorne', 'Ixia', 'Yarrow', 'Zephyr',
  'Maren', 'Quill', 'Soren', 'Tarn',
];
