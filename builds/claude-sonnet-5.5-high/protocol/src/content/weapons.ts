// Weapon data tables. All names and numbers are original and provisional (see brief).
// Pure data: shared by server simulation, bots, UI and tests.

export type WeaponId =
  | 'vela' | 'rook' | 'needle'
  | 'kite' | 'vectora'
  | 'aster' | 'krait' | 'lumen'
  | 'longglass' | 'sable' | 'rampart' | 'atlas'
  | 'tool';

export type WeaponClass = 'pistol' | 'smg' | 'rifle' | 'sniper' | 'dmr' | 'shotgun' | 'lmg' | 'melee';
export type FireMode = 'auto' | 'semi' | 'burst' | 'bolt' | 'pump' | 'melee';
export type WeaponSlot = 'primary' | 'secondary' | 'tool';

export interface RecoilDef {
  /** Degrees of upward view kick added per shot while climbing. */
  vert: number;
  /** Horizontal sway amplitude in degrees. */
  horiz: number;
  /** Sway frequency in radians per shot index. */
  freq: number;
  /** Phase of the sway. */
  phase: number;
  /** Shots until the climb rate drops to 30%. */
  climb: number;
  /** Maximum accumulated vertical kick (degrees). */
  maxVert: number;
  /** Seconds of no fire for the pattern to fully recover. */
  recovery: number;
  /** Seeded random deviation (degrees, half-range) applied per shot on top of the pattern. */
  seedDev: number;
}

export interface SpreadDef {
  /** Radians when stationary / below accuracy speed. */
  stand: number;
  /** Radians added at full move speed. */
  move: number;
  /** Radians added while airborne. */
  air: number;
  /** Multiplier while crouched. */
  crouch: number;
  /** Radians added per sustained shot (decays). */
  sustain: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cls: WeaponClass;
  slot: WeaponSlot;
  price: number;
  killReward: number;
  mode: FireMode;
  /** Rounds per minute (cyclic rate). */
  rpm: number;
  burstCount?: number;
  burstRpm?: number;
  /** Time between bursts / bolt cycle / pump cycle (s). */
  cycle?: number;
  damage: number;
  pellets: number;
  headMult: number;
  chestMult: number;
  abdomenMult: number;
  armMult: number;
  legMult: number;
  /** Fraction of damage that still reaches health when armour covers the zone. */
  armorPen: number;
  /** Damage retained per 10 m of travel. */
  falloff: number;
  /** Penetration budget (metre-equivalents of obstruction). */
  penetration: number;
  mag: number;
  reserve: number;
  reloadTime: number;
  /** Shotgun style: seconds per shell. */
  shellTime?: number;
  drawTime: number;
  moveSpeed: number;
  spread: SpreadDef;
  recoil: RecoilDef;
  scoped?: { zoomFov: number[]; moveSpreadMul: number; unscopedSpreadMul: number };
  range: number;
  blurb: string;
}

const none: RecoilDef = { vert: 0, horiz: 0, freq: 0, phase: 0, climb: 1, maxVert: 0, recovery: 0.1, seedDev: 0 };

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  vela: {
    id: 'vela', name: 'P-5 Vela', cls: 'pistol', slot: 'secondary', price: 300, killReward: 300,
    mode: 'semi', rpm: 400, damage: 28, pellets: 1, headMult: 4, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.5, falloff: 0.88, penetration: 1.0, mag: 15, reserve: 60, reloadTime: 2.0, drawTime: 0.35, moveSpeed: 5.2,
    spread: { stand: 0.0022, move: 0.02, air: 0.045, crouch: 0.8, sustain: 0.003 },
    recoil: { vert: 0.9, horiz: 0.3, freq: 1.3, phase: 0.4, climb: 4, maxVert: 4, recovery: 0.35, seedDev: 0.08 },
    range: 80, blurb: 'Balanced 15-round starter sidearm.',
  },
  rook: {
    id: 'rook', name: 'Rook .44', cls: 'pistol', slot: 'secondary', price: 700, killReward: 300,
    mode: 'semi', rpm: 170, damage: 62, pellets: 1, headMult: 3.6, chestMult: 1, abdomenMult: 1.15, armMult: 0.9, legMult: 0.75,
    armorPen: 0.85, falloff: 0.9, penetration: 2.2, mag: 6, reserve: 30, reloadTime: 3.1, drawTime: 0.5, moveSpeed: 5.0,
    spread: { stand: 0.0016, move: 0.03, air: 0.06, crouch: 0.75, sustain: 0.01 },
    recoil: { vert: 3.2, horiz: 0.5, freq: 2.1, phase: 1.1, climb: 2, maxVert: 8, recovery: 0.7, seedDev: 0.12 },
    range: 90, blurb: 'Six-shot precision sidearm with brutal recoil and armour pressure.',
  },
  needle: {
    id: 'needle', name: 'Needle-9', cls: 'pistol', slot: 'secondary', price: 900, killReward: 300,
    mode: 'auto', rpm: 820, damage: 19, pellets: 1, headMult: 3.3, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.55, falloff: 0.8, penetration: 0.9, mag: 20, reserve: 80, reloadTime: 2.2, drawTime: 0.35, moveSpeed: 5.2,
    spread: { stand: 0.004, move: 0.025, air: 0.05, crouch: 0.85, sustain: 0.006 },
    recoil: { vert: 0.7, horiz: 0.9, freq: 1.7, phase: 2.0, climb: 5, maxVert: 5, recovery: 0.3, seedDev: 0.2 },
    range: 45, blurb: 'Compact automatic sidearm. Close-range emergency weapon.',
  },
  kite: {
    id: 'kite', name: 'Kite-9', cls: 'smg', slot: 'primary', price: 1250, killReward: 600,
    mode: 'auto', rpm: 750, damage: 24, pellets: 1, headMult: 3.6, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.55, falloff: 0.85, penetration: 1.0, mag: 30, reserve: 120, reloadTime: 2.2, drawTime: 0.4, moveSpeed: 5.0,
    spread: { stand: 0.0035, move: 0.012, air: 0.04, crouch: 0.85, sustain: 0.002 },
    recoil: { vert: 0.5, horiz: 0.45, freq: 1.1, phase: 0.2, climb: 12, maxVert: 8, recovery: 0.35, seedDev: 0.1 },
    range: 55, blurb: 'Mobile, forgiving recoil, weak against armour.',
  },
  vectora: {
    id: 'vectora', name: 'Vectora-7', cls: 'smg', slot: 'primary', price: 1700, killReward: 600,
    mode: 'auto', rpm: 920, damage: 26, pellets: 1, headMult: 3.6, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.62, falloff: 0.86, penetration: 1.2, mag: 25, reserve: 100, reloadTime: 2.4, drawTime: 0.4, moveSpeed: 5.0,
    spread: { stand: 0.0045, move: 0.014, air: 0.04, crouch: 0.85, sustain: 0.003 },
    recoil: { vert: 0.95, horiz: 0.9, freq: 1.5, phase: 1.5, climb: 6, maxVert: 9, recovery: 0.4, seedDev: 0.15 },
    range: 55, blurb: 'High rate of fire with a sharp early climb. Strong close entry.',
  },
  aster: {
    id: 'aster', name: 'Aster 4', cls: 'rifle', slot: 'primary', price: 2650, killReward: 300,
    mode: 'auto', rpm: 620, damage: 35, pellets: 1, headMult: 4, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.8, falloff: 0.93, penetration: 2.2, mag: 30, reserve: 90, reloadTime: 2.5, drawTime: 0.55, moveSpeed: 4.7,
    spread: { stand: 0.0012, move: 0.02, air: 0.05, crouch: 0.8, sustain: 0.0016 },
    recoil: { vert: 0.78, horiz: 0.55, freq: 0.9, phase: 0.6, climb: 10, maxVert: 9, recovery: 0.4, seedDev: 0.06 },
    range: 120, blurb: 'Controllable all-purpose rifle. Helmeted headshots are lethal only at close range.',
  },
  krait: {
    id: 'krait', name: 'Krait 7', cls: 'rifle', slot: 'primary', price: 2900, killReward: 300,
    mode: 'auto', rpm: 500, damage: 40, pellets: 1, headMult: 4, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.92, falloff: 0.95, penetration: 3.0, mag: 25, reserve: 75, reloadTime: 2.9, drawTime: 0.65, moveSpeed: 4.5,
    spread: { stand: 0.0012, move: 0.022, air: 0.055, crouch: 0.78, sustain: 0.002 },
    recoil: { vert: 1.05, horiz: 0.85, freq: 0.75, phase: 2.4, climb: 9, maxVert: 11, recovery: 0.5, seedDev: 0.08 },
    range: 130, blurb: 'Slower heavy rifle. Lethal helmet headshots, demanding recoil.',
  },
  lumen: {
    id: 'lumen', name: 'Lumen Burst', cls: 'rifle', slot: 'primary', price: 2350, killReward: 300,
    mode: 'burst', rpm: 700, burstCount: 3, burstRpm: 1000, cycle: 0.42, damage: 30, pellets: 1, headMult: 4, chestMult: 1,
    abdomenMult: 1.2, armMult: 0.9, legMult: 0.7, armorPen: 0.78, falloff: 0.94, penetration: 2.0, mag: 30, reserve: 90,
    reloadTime: 2.4, drawTime: 0.55, moveSpeed: 4.7,
    spread: { stand: 0.0006, move: 0.02, air: 0.05, crouch: 0.8, sustain: 0.0035 },
    recoil: { vert: 0.95, horiz: 0.3, freq: 1.4, phase: 0.9, climb: 5, maxVert: 8, recovery: 0.5, seedDev: 0.05 },
    range: 125, blurb: 'Three-round burst rifle. Low first-shot spread; punishes a missed burst.',
  },
  longglass: {
    id: 'longglass', name: 'Longglass M2', cls: 'sniper', slot: 'primary', price: 4650, killReward: 100,
    mode: 'bolt', rpm: 45, cycle: 1.35, damage: 118, pellets: 1, headMult: 3.6, chestMult: 1, abdomenMult: 1, armMult: 0.85, legMult: 0.55,
    armorPen: 0.96, falloff: 0.99, penetration: 4.0, mag: 5, reserve: 20, reloadTime: 3.4, drawTime: 0.9, moveSpeed: 4.3,
    spread: { stand: 0.0004, move: 0.06, air: 0.1, crouch: 0.9, sustain: 0.0 },
    recoil: { vert: 2.4, horiz: 0.2, freq: 1, phase: 0, climb: 1, maxVert: 2.4, recovery: 1.2, seedDev: 0.02 },
    scoped: { zoomFov: [38, 14], moveSpreadMul: 1.0, unscopedSpreadMul: 6 },
    range: 250, blurb: 'Bolt-action scope rifle. One-shot torso kill. Scope glint shows to opponents it faces.',
  },
  sable: {
    id: 'sable', name: 'Sable DMR', cls: 'dmr', slot: 'primary', price: 3100, killReward: 300,
    mode: 'semi', rpm: 260, damage: 62, pellets: 1, headMult: 3.6, chestMult: 1, abdomenMult: 1.1, armMult: 0.85, legMult: 0.6,
    armorPen: 0.88, falloff: 0.97, penetration: 2.8, mag: 10, reserve: 40, reloadTime: 3.0, drawTime: 0.7, moveSpeed: 4.3,
    spread: { stand: 0.0007, move: 0.05, air: 0.08, crouch: 0.85, sustain: 0.004 },
    recoil: { vert: 1.8, horiz: 0.35, freq: 1.2, phase: 0.3, climb: 2, maxVert: 5, recovery: 0.55, seedDev: 0.05 },
    scoped: { zoomFov: [42], moveSpreadMul: 1.0, unscopedSpreadMul: 4 },
    range: 200, blurb: 'Semi-auto scoped rifle with a two-hit body profile.',
  },
  rampart: {
    id: 'rampart', name: 'Rampart 12', cls: 'shotgun', slot: 'primary', price: 1900, killReward: 900,
    mode: 'pump', rpm: 72, cycle: 0.85, damage: 11, pellets: 9, headMult: 2.6, chestMult: 1, abdomenMult: 1.1, armMult: 0.9, legMult: 0.8,
    armorPen: 0.55, falloff: 0.5, penetration: 0.6, mag: 6, reserve: 30, reloadTime: 0.4, shellTime: 0.5, drawTime: 0.6, moveSpeed: 4.7,
    spread: { stand: 0.035, move: 0.04, air: 0.06, crouch: 0.9, sustain: 0 },
    recoil: { vert: 3.5, horiz: 0.4, freq: 1, phase: 0, climb: 1, maxVert: 3.5, recovery: 0.6, seedDev: 0.1 },
    range: 35, blurb: 'Pump shotgun for close holds.',
  },
  atlas: {
    id: 'atlas', name: 'Atlas LMG', cls: 'lmg', slot: 'primary', price: 3800, killReward: 300,
    mode: 'auto', rpm: 680, damage: 33, pellets: 1, headMult: 3.8, chestMult: 1, abdomenMult: 1.2, armMult: 0.9, legMult: 0.7,
    armorPen: 0.8, falloff: 0.93, penetration: 3.4, mag: 100, reserve: 200, reloadTime: 5.6, drawTime: 0.9, moveSpeed: 4.3,
    spread: { stand: 0.0025, move: 0.03, air: 0.06, crouch: 0.8, sustain: 0.0028 },
    recoil: { vert: 0.88, horiz: 1.15, freq: 0.55, phase: 3.1, climb: 14, maxVert: 13, recovery: 0.6, seedDev: 0.12 },
    range: 130, blurb: 'High capacity, slow, suppresses through penetrable cover. Difficult recoil.',
  },
  tool: {
    id: 'tool', name: 'Kerf Tool', cls: 'melee', slot: 'tool', price: 0, killReward: 1000,
    mode: 'melee', rpm: 120, damage: 38, pellets: 1, headMult: 1, chestMult: 1, abdomenMult: 1, armMult: 1, legMult: 1,
    armorPen: 0.9, falloff: 1, penetration: 0, mag: 0, reserve: 0, reloadTime: 0, drawTime: 0.25, moveSpeed: 5.5,
    spread: { stand: 0, move: 0, air: 0, crouch: 1, sustain: 0 }, recoil: none,
    range: 1.9, blurb: 'Short directional strike. Heavy swing on alt-fire.',
  },
};

export const WEAPON_LIST: WeaponDef[] = Object.values(WEAPONS);
export const BUYABLE_WEAPONS: WeaponDef[] = WEAPON_LIST.filter((w) => w.price > 0);

/** Pure deterministic 32-bit RNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Learnable recoil path: cumulative view offset (degrees) after `n` shots have been fired. */
export function recoilPattern(def: RecoilDef, n: number): { pitch: number; yaw: number } {
  if (n <= 0) return { pitch: 0, yaw: 0 };
  const climbing = Math.min(n, def.climb);
  const rest = Math.max(0, n - def.climb);
  const pitch = Math.min(def.maxVert, def.vert * (climbing + rest * 0.3));
  const ramp = Math.min(1, n / 4);
  const yaw = def.horiz * Math.sin(n * def.freq + def.phase) * ramp;
  return { pitch, yaw };
}
