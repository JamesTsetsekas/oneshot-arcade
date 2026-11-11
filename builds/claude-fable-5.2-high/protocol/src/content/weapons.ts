// Weapon content table. All names, numbers and recoil paths are original to Last Protocol.
// Values are data: change them here and bump RULESET_VERSION in rules.ts.
import { DEG, hash32 } from '../shared/math';

export type WeaponId =
  | 'tool'
  | 'vela'
  | 'rook'
  | 'needle'
  | 'kite'
  | 'vectora'
  | 'aster'
  | 'krait'
  | 'lumen'
  | 'longglass'
  | 'sable'
  | 'rampart'
  | 'atlas';

export type WeaponClass = 'tool' | 'sidearm' | 'smg' | 'rifle' | 'sniper' | 'shotgun' | 'lmg';
export type FireMode = 'auto' | 'semi' | 'burst' | 'bolt' | 'pump' | 'melee';
export type WeaponSlot = 'primary' | 'sidearm' | 'tool';

export interface RecoilStep {
  /** cumulative pitch offset (radians, up) */
  p: number;
  /** cumulative yaw offset (radians, right) */
  y: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cls: WeaponClass;
  slot: WeaponSlot;
  category: 'Sidearms' | 'SMGs' | 'Rifles' | 'Heavy' | 'Tool';
  price: number;
  killReward: number;
  desc: string;
  damage: number;
  headMult: number;
  /** fraction of damage that reaches health through armor */
  armorPen: number;
  /** distance (m) before damage begins to fall off */
  falloffStart: number;
  /** fraction of damage lost per 10 m beyond falloffStart */
  falloffPer10m: number;
  minDamageFrac: number;
  rpm: number;
  mode: FireMode;
  burstCount?: number;
  burstRpm?: number;
  pellets?: number;
  mag: number;
  reserve: number;
  reloadTime: number;
  drawTime: number;
  moveSpeed: number;
  /** spread cone half-angles in radians */
  spreadBase: number;
  spreadCrouchMul: number;
  spreadMove: number;
  spreadAir: number;
  spreadPerShot: number;
  spreadMax: number;
  /** seconds for sustained-fire spread to fully recover */
  spreadRecovery: number;
  recoil: RecoilStep[];
  /** fraction of the recoil offset that is shown as view punch */
  recoilView: number;
  /** recoil index recovered per second once the trigger rests */
  recoilRecover: number;
  /** wall penetration energy. 0 = none. */
  penetration: number;
  scope?: { fov: number[]; unscopedSpread: number; speedMul: number };
  range: number;
  /** audible radius of the shot in metres */
  loudness: number;
}

interface PatternOpts {
  shots: number;
  climb: number; // degrees per shot during the climb
  climbShots: number;
  drift: number; // fraction of climb retained after the climb phase
  sway: number; // degrees of horizontal amplitude
  period: number; // shots per horizontal cycle
  phase: number; // radians
  seed: number;
}

/** Builds a deterministic, learnable recoil path: a vertical climb followed by a horizontal sway. */
function makePattern(o: PatternOpts): RecoilStep[] {
  const out: RecoilStep[] = [];
  let p = 0;
  for (let i = 0; i < o.shots; i++) {
    if (i > 0) p += o.climb * (i <= o.climbShots ? 1 : o.drift);
    const ramp = Math.min(1, i / Math.max(1, o.climbShots));
    const wiggle = ((hash32(o.seed, i) % 1000) / 1000 - 0.5) * 0.18 * o.sway;
    const y = i === 0 ? 0 : (Math.sin((i / o.period) * Math.PI * 2 + o.phase) * o.sway + wiggle) * ramp;
    out.push({ p: p * DEG, y: y * DEG });
  }
  return out;
}

const base = {
  minDamageFrac: 0.45,
  spreadCrouchMul: 0.8,
  drawTime: 0.55,
  range: 200,
  loudness: 70,
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  tool: {
    ...base,
    id: 'tool',
    name: 'Edge Tool',
    cls: 'tool',
    slot: 'tool',
    category: 'Tool',
    price: 0,
    killReward: 750,
    desc: 'Short directional strike. Fastest carry speed.',
    damage: 42,
    headMult: 1,
    armorPen: 0.85,
    falloffStart: 99,
    falloffPer10m: 0,
    rpm: 110,
    mode: 'melee',
    mag: 0,
    reserve: 0,
    reloadTime: 0,
    drawTime: 0.4,
    moveSpeed: 5.5,
    spreadBase: 0,
    spreadMove: 0,
    spreadAir: 0,
    spreadPerShot: 0,
    spreadMax: 0,
    spreadRecovery: 0.1,
    recoil: [{ p: 0, y: 0 }],
    recoilView: 0,
    recoilRecover: 10,
    penetration: 0,
    range: 1.75,
    loudness: 6,
  },
  vela: {
    ...base,
    id: 'vela',
    name: 'P-5 Vela',
    cls: 'sidearm',
    slot: 'sidearm',
    category: 'Sidearms',
    price: 300,
    killReward: 300,
    desc: 'Balanced 15-round starter sidearm.',
    damage: 27,
    headMult: 3.6,
    armorPen: 0.52,
    falloffStart: 10,
    falloffPer10m: 0.09,
    rpm: 400,
    mode: 'semi',
    mag: 15,
    reserve: 45,
    reloadTime: 2.0,
    drawTime: 0.45,
    moveSpeed: 5.2,
    spreadBase: 0.0052,
    spreadMove: 0.024,
    spreadAir: 0.09,
    spreadPerShot: 0.006,
    spreadMax: 0.035,
    spreadRecovery: 0.38,
    recoil: makePattern({ shots: 8, climb: 0.55, climbShots: 5, drift: 0.2, sway: 0.25, period: 5, phase: 0.6, seed: 11 }),
    recoilView: 0.6,
    recoilRecover: 14,
    penetration: 0.3,
  },
  rook: {
    ...base,
    id: 'rook',
    name: 'Rook .44',
    cls: 'sidearm',
    slot: 'sidearm',
    category: 'Sidearms',
    price: 700,
    killReward: 300,
    desc: 'Six-shot precision sidearm. Heavy kick, real armor pressure.',
    damage: 56,
    headMult: 3.3,
    armorPen: 0.9,
    falloffStart: 14,
    falloffPer10m: 0.07,
    rpm: 155,
    mode: 'semi',
    mag: 6,
    reserve: 24,
    reloadTime: 2.5,
    drawTime: 0.5,
    moveSpeed: 5.2,
    spreadBase: 0.004,
    spreadMove: 0.05,
    spreadAir: 0.12,
    spreadPerShot: 0.03,
    spreadMax: 0.06,
    spreadRecovery: 0.55,
    recoil: makePattern({ shots: 6, climb: 2.4, climbShots: 3, drift: 0.3, sway: 0.5, period: 4, phase: 2.2, seed: 12 }),
    recoilView: 0.7,
    recoilRecover: 5,
    penetration: 0.6,
    loudness: 80,
  },
  needle: {
    ...base,
    id: 'needle',
    name: 'Needle-9',
    cls: 'sidearm',
    slot: 'sidearm',
    category: 'Sidearms',
    price: 900,
    killReward: 300,
    desc: 'Compact automatic sidearm for close emergencies.',
    damage: 21,
    headMult: 3.4,
    armorPen: 0.5,
    falloffStart: 7,
    falloffPer10m: 0.14,
    rpm: 900,
    mode: 'auto',
    mag: 20,
    reserve: 60,
    reloadTime: 2.3,
    drawTime: 0.45,
    moveSpeed: 5.2,
    spreadBase: 0.0085,
    spreadMove: 0.022,
    spreadAir: 0.08,
    spreadPerShot: 0.0022,
    spreadMax: 0.04,
    spreadRecovery: 0.35,
    recoil: makePattern({ shots: 20, climb: 0.52, climbShots: 6, drift: 0.14, sway: 1.0, period: 7, phase: 3.4, seed: 13 }),
    recoilView: 0.5,
    recoilRecover: 16,
    penetration: 0.25,
  },
  kite: {
    ...base,
    id: 'kite',
    name: 'Kite-9',
    cls: 'smg',
    slot: 'primary',
    category: 'SMGs',
    price: 1250,
    killReward: 500,
    desc: 'Mobile and forgiving. Struggles against armor.',
    damage: 24,
    headMult: 3.6,
    armorPen: 0.55,
    falloffStart: 9,
    falloffPer10m: 0.12,
    rpm: 780,
    mode: 'auto',
    mag: 30,
    reserve: 90,
    reloadTime: 2.2,
    moveSpeed: 5.0,
    spreadBase: 0.0065,
    spreadMove: 0.016,
    spreadAir: 0.07,
    spreadPerShot: 0.0011,
    spreadMax: 0.03,
    spreadRecovery: 0.3,
    recoil: makePattern({ shots: 30, climb: 0.27, climbShots: 10, drift: 0.1, sway: 0.7, period: 14, phase: 0.2, seed: 21 }),
    recoilView: 0.5,
    recoilRecover: 20,
    penetration: 0.45,
  },
  vectora: {
    ...base,
    id: 'vectora',
    name: 'Vectora-7',
    cls: 'smg',
    slot: 'primary',
    category: 'SMGs',
    price: 1700,
    killReward: 500,
    desc: 'Very high rate of fire with a sharp early climb. Built for entries.',
    damage: 26,
    headMult: 3.6,
    armorPen: 0.63,
    falloffStart: 8,
    falloffPer10m: 0.13,
    rpm: 960,
    mode: 'auto',
    mag: 26,
    reserve: 78,
    reloadTime: 2.5,
    moveSpeed: 5.0,
    spreadBase: 0.007,
    spreadMove: 0.019,
    spreadAir: 0.075,
    spreadPerShot: 0.0013,
    spreadMax: 0.034,
    spreadRecovery: 0.32,
    recoil: makePattern({ shots: 26, climb: 0.6, climbShots: 5, drift: 0.12, sway: 0.95, period: 9, phase: 3.3, seed: 22 }),
    recoilView: 0.5,
    recoilRecover: 19,
    penetration: 0.5,
  },
  aster: {
    ...base,
    id: 'aster',
    name: 'Aster 4',
    cls: 'rifle',
    slot: 'primary',
    category: 'Rifles',
    price: 2650,
    killReward: 300,
    desc: 'Controllable all-purpose rifle. Helmet headshots kill only up close.',
    damage: 34,
    headMult: 4,
    armorPen: 0.78,
    falloffStart: 6,
    falloffPer10m: 0.05,
    rpm: 640,
    mode: 'auto',
    mag: 30,
    reserve: 90,
    reloadTime: 2.6,
    moveSpeed: 4.7,
    spreadBase: 0.0026,
    spreadMove: 0.07,
    spreadAir: 0.14,
    spreadPerShot: 0.0009,
    spreadMax: 0.02,
    spreadRecovery: 0.32,
    recoil: makePattern({ shots: 30, climb: 0.42, climbShots: 9, drift: 0.08, sway: 1.1, period: 11, phase: 3.5, seed: 31 }),
    recoilView: 0.5,
    recoilRecover: 17,
    penetration: 1.0,
  },
  krait: {
    ...base,
    id: 'krait',
    name: 'Krait 7',
    cls: 'rifle',
    slot: 'primary',
    category: 'Rifles',
    price: 2900,
    killReward: 300,
    desc: 'Slower heavy rifle. Lethal through helmets; demanding recoil.',
    damage: 38,
    headMult: 4,
    armorPen: 0.82,
    falloffStart: 12,
    falloffPer10m: 0.03,
    rpm: 560,
    mode: 'auto',
    mag: 28,
    reserve: 84,
    reloadTime: 2.8,
    moveSpeed: 4.7,
    spreadBase: 0.003,
    spreadMove: 0.085,
    spreadAir: 0.16,
    spreadPerShot: 0.0012,
    spreadMax: 0.026,
    spreadRecovery: 0.38,
    recoil: makePattern({ shots: 28, climb: 0.64, climbShots: 7, drift: 0.1, sway: 1.75, period: 8, phase: 0.3, seed: 32 }),
    recoilView: 0.5,
    recoilRecover: 14,
    penetration: 1.15,
    loudness: 80,
  },
  lumen: {
    ...base,
    id: 'lumen',
    name: 'Lumen Burst',
    cls: 'rifle',
    slot: 'primary',
    category: 'Rifles',
    price: 2350,
    killReward: 300,
    desc: 'Three-round burst with a pin-point first shot. Missed bursts are punished.',
    damage: 33,
    headMult: 4,
    armorPen: 0.76,
    falloffStart: 14,
    falloffPer10m: 0.04,
    rpm: 135,
    mode: 'burst',
    burstCount: 3,
    burstRpm: 900,
    mag: 24,
    reserve: 72,
    reloadTime: 2.5,
    moveSpeed: 4.7,
    spreadBase: 0.0012,
    spreadMove: 0.075,
    spreadAir: 0.14,
    spreadPerShot: 0.0016,
    spreadMax: 0.02,
    spreadRecovery: 0.4,
    recoil: makePattern({ shots: 9, climb: 0.5, climbShots: 9, drift: 1, sway: 0.4, period: 6, phase: 1.1, seed: 33 }),
    recoilView: 0.55,
    recoilRecover: 9,
    penetration: 1.0,
  },
  longglass: {
    ...base,
    id: 'longglass',
    name: 'Longglass M2',
    cls: 'sniper',
    slot: 'primary',
    category: 'Heavy',
    price: 4650,
    killReward: 150,
    desc: 'Bolt-action scoped rifle. One torso hit kills; legs survive.',
    damage: 112,
    headMult: 3,
    armorPen: 0.93,
    falloffStart: 60,
    falloffPer10m: 0.01,
    rpm: 44,
    mode: 'bolt',
    mag: 6,
    reserve: 18,
    reloadTime: 3.3,
    drawTime: 0.9,
    moveSpeed: 4.3,
    spreadBase: 0.0004,
    spreadMove: 0.17,
    spreadAir: 0.25,
    spreadPerShot: 0.02,
    spreadMax: 0.05,
    spreadRecovery: 0.6,
    recoil: makePattern({ shots: 2, climb: 3.2, climbShots: 1, drift: 0, sway: 0, period: 1, phase: 0, seed: 41 }),
    recoilView: 0.8,
    recoilRecover: 2.2,
    penetration: 1.8,
    scope: { fov: [40, 14], unscopedSpread: 0.07, speedMul: 0.55 },
    loudness: 95,
  },
  sable: {
    ...base,
    id: 'sable',
    name: 'Sable DMR',
    cls: 'sniper',
    slot: 'primary',
    category: 'Heavy',
    price: 3100,
    killReward: 250,
    desc: 'Semi-auto scoped rifle with a two-hit body profile.',
    damage: 62,
    headMult: 3.2,
    armorPen: 0.86,
    falloffStart: 40,
    falloffPer10m: 0.02,
    rpm: 230,
    mode: 'semi',
    mag: 12,
    reserve: 36,
    reloadTime: 2.9,
    drawTime: 0.75,
    moveSpeed: 4.3,
    spreadBase: 0.0009,
    spreadMove: 0.12,
    spreadAir: 0.2,
    spreadPerShot: 0.012,
    spreadMax: 0.04,
    spreadRecovery: 0.5,
    recoil: makePattern({ shots: 6, climb: 1.3, climbShots: 4, drift: 0.3, sway: 0.5, period: 5, phase: 0.9, seed: 42 }),
    recoilView: 0.7,
    recoilRecover: 6,
    penetration: 1.4,
    scope: { fov: [45], unscopedSpread: 0.03, speedMul: 0.7 },
    loudness: 85,
  },
  rampart: {
    ...base,
    id: 'rampart',
    name: 'Rampart 12',
    cls: 'shotgun',
    slot: 'primary',
    category: 'Heavy',
    price: 1900,
    killReward: 450,
    desc: 'Pump shotgun for close holds. Nine pellets, short reach.',
    damage: 17,
    headMult: 2,
    armorPen: 0.5,
    falloffStart: 5,
    falloffPer10m: 0.42,
    minDamageFrac: 0.15,
    rpm: 68,
    mode: 'pump',
    pellets: 9,
    mag: 6,
    reserve: 24,
    reloadTime: 3.1,
    moveSpeed: 4.3,
    spreadBase: 0.042,
    spreadMove: 0.012,
    spreadAir: 0.04,
    spreadPerShot: 0.004,
    spreadMax: 0.06,
    spreadRecovery: 0.4,
    recoil: makePattern({ shots: 2, climb: 3.6, climbShots: 1, drift: 0, sway: 0, period: 1, phase: 0, seed: 51 }),
    recoilView: 0.8,
    recoilRecover: 3,
    penetration: 0.12,
    loudness: 85,
  },
  atlas: {
    ...base,
    id: 'atlas',
    name: 'Atlas LMG',
    cls: 'lmg',
    slot: 'primary',
    category: 'Heavy',
    price: 3800,
    killReward: 300,
    desc: '80-round belt. Suppresses through light cover; hard to steer.',
    damage: 30,
    headMult: 4,
    armorPen: 0.8,
    falloffStart: 14,
    falloffPer10m: 0.03,
    rpm: 720,
    mode: 'auto',
    mag: 80,
    reserve: 160,
    reloadTime: 4.6,
    drawTime: 0.9,
    moveSpeed: 4.3,
    spreadBase: 0.005,
    spreadMove: 0.095,
    spreadAir: 0.18,
    spreadPerShot: 0.0011,
    spreadMax: 0.03,
    spreadRecovery: 0.45,
    recoil: makePattern({ shots: 80, climb: 0.36, climbShots: 14, drift: 0.06, sway: 2.2, period: 16, phase: 2.6, seed: 61 }),
    recoilView: 0.5,
    recoilRecover: 12,
    penetration: 1.5,
    loudness: 85,
  },
};

export const WEAPON_LIST: WeaponDef[] = Object.values(WEAPONS);
export const BUYABLE_WEAPONS: WeaponDef[] = WEAPON_LIST.filter((w) => w.id !== 'tool');
export const DEFAULT_SIDEARM: WeaponId = 'vela';

export function isWeaponId(id: string): id is WeaponId {
  return Object.prototype.hasOwnProperty.call(WEAPONS, id);
}

/** Seconds between shots (or between bursts for burst weapons). */
export function fireInterval(def: WeaponDef): number {
  return 60 / def.rpm;
}

/** Damage multiplier at a given distance. */
export function damageFalloff(def: WeaponDef, dist: number): number {
  if (dist <= def.falloffStart) return 1;
  return Math.max(def.minDamageFrac, 1 - ((dist - def.falloffStart) / 10) * def.falloffPer10m);
}

/** Recoil offset for a (possibly fractional) recoil index. */
export function recoilAt(def: WeaponDef, index: number): RecoilStep {
  const r = def.recoil;
  const i = Math.max(0, Math.min(r.length - 1, Math.floor(index)));
  const j = Math.min(r.length - 1, i + 1);
  const f = Math.max(0, Math.min(1, index - i));
  return { p: r[i].p + (r[j].p - r[i].p) * f, y: r[i].y + (r[j].y - r[i].y) * f };
}

export interface SpreadInputs {
  speed: number;
  maxSpeed: number;
  onGround: boolean;
  crouch: number;
  landT: number;
  heat: number; // sustained-fire spread already accumulated (radians)
  scoped: boolean;
}

/** Movement speed (m/s) under which a weapon keeps its tight standing baseline. */
export const ACCURATE_SPEED = 0.45;

/** The single source of truth for firing inaccuracy. Used by the server for shots and by the HUD crosshair. */
export function computeSpread(def: WeaponDef, s: SpreadInputs): number {
  if (def.mode === 'melee') return 0;
  let spread = def.scope && !s.scoped ? def.scope.unscopedSpread : def.spreadBase;
  spread *= 1 - (1 - def.spreadCrouchMul) * s.crouch;
  if (s.speed > ACCURATE_SPEED) {
    const f = Math.min(1, (s.speed - ACCURATE_SPEED) / Math.max(0.1, s.maxSpeed * 0.85 - ACCURATE_SPEED));
    spread += def.spreadMove * f * f;
  }
  if (!s.onGround) spread += def.spreadAir;
  if (s.landT > 0) spread += def.spreadAir * 0.6 * Math.min(1, s.landT / 0.25);
  spread += s.heat;
  return spread;
}
