// Weapon content table. All names, numbers and recoil paths are original and
// provisional; they are data, consumed by the shared simulation.

import { DEG } from '../sim/math';

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

export type WeaponClass = 'tool' | 'sidearm' | 'smg' | 'rifle' | 'sniper' | 'dmr' | 'shotgun' | 'lmg';
export type FireMode = 'auto' | 'semi' | 'burst' | 'pump' | 'bolt' | 'melee';
export type Slot = 'primary' | 'secondary' | 'tool';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  blurb: string;
  slot: Slot;
  cls: WeaponClass;
  price: number;
  damage: number;
  armorPen: number;
  headMult: number;
  /** damage multiplier per 10 m travelled */
  rangeMod: number;
  range: number;
  rpm: number;
  mode: FireMode;
  mag: number;
  reserve: number;
  reloadTime: number;
  reloadType: 'mag' | 'shell';
  /** fraction of reload at which the new magazine is seated (authoritative stage) */
  magInAt: number;
  drawTime: number;
  moveSpeed: number;
  spreadStand: number;
  spreadMove: number;
  spreadAir: number;
  spreadCrouchMult: number;
  /** extra spread added per consecutive shot (sustained fire) */
  spreadPerShot: number;
  spreadPerShotMax: number;
  /** speed below which the standing baseline applies */
  accurateSpeed: number;
  /** cumulative recoil per shot index [yawDeg, pitchUpDeg] deltas */
  recoil: [number, number][];
  /** seconds for recoil offset to fully recover */
  recoilRecovery: number;
  /** seeded deviation added per shot (deg) */
  recoilJitter: number;
  pellets?: number;
  pelletSpread?: number;
  penetration: number;
  killReward: number;
  scope?: { fovs: number[]; scopedSpread: number; unscopedSpreadMult: number };
  burst?: { count: number; interval: number; cooldown: number };
  /** melee: second (alt) attack */
  melee?: { range: number; damage: number; altDamage: number; interval: number; altInterval: number };
}

/**
 * Build a learnable recoil path from cumulative control points (shotIndex, yawDeg, pitchDeg).
 * Returns per-shot deltas so the server simply sums them.
 */
export function buildRecoil(count: number, pts: [number, number, number][]): [number, number][] {
  const cum: [number, number][] = [];
  for (let i = 0; i <= count; i++) {
    let a = pts[0];
    let b = pts[pts.length - 1];
    for (let k = 0; k < pts.length - 1; k++) {
      if (i >= pts[k][0] && i <= pts[k + 1][0]) {
        a = pts[k];
        b = pts[k + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const t = Math.min(1, Math.max(0, (i - a[0]) / span));
    // smoothstep so the path has readable corners rather than jitter
    const s = t * t * (3 - 2 * t);
    cum.push([a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]);
  }
  const deltas: [number, number][] = [];
  for (let i = 0; i < count; i++) deltas.push([cum[i + 1][0] - cum[i][0], cum[i + 1][1] - cum[i][1]]);
  return deltas;
}

const single = (n: number, pitch: number, yaw = 0): [number, number][] =>
  Array.from({ length: n }, (_, i) => [yaw * (i % 2 ? -1 : 1), pitch] as [number, number]);

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  tool: {
    id: 'tool', name: 'Breach Tool', blurb: 'Close utility blade. Left: quick strike. Right: heavy strike.',
    slot: 'tool', cls: 'tool', price: 0, damage: 28, armorPen: 0.85, headMult: 1, rangeMod: 1, range: 1.7,
    rpm: 120, mode: 'melee', mag: 0, reserve: 0, reloadTime: 0, reloadType: 'mag', magInAt: 1, drawTime: 0.5,
    moveSpeed: 5.5, spreadStand: 0, spreadMove: 0, spreadAir: 0, spreadCrouchMult: 1, spreadPerShot: 0,
    spreadPerShotMax: 0, accurateSpeed: 99, recoil: [[0, 0]], recoilRecovery: 0.1, recoilJitter: 0, penetration: 0,
    killReward: 500, melee: { range: 1.7, damage: 28, altDamage: 58, interval: 0.45, altInterval: 1.05 },
  },
  vela: {
    id: 'vela', name: 'P-5 Vela', blurb: 'Balanced 15-round starter sidearm.', slot: 'secondary', cls: 'sidearm',
    price: 300, damage: 31, armorPen: 0.5, headMult: 4, rangeMod: 0.86, range: 90, rpm: 380, mode: 'semi', mag: 15,
    reserve: 45, reloadTime: 2.1, reloadType: 'mag', magInAt: 0.75, drawTime: 0.75, moveSpeed: 5.2,
    spreadStand: 0.0045, spreadMove: 0.035, spreadAir: 0.16, spreadCrouchMult: 0.8, spreadPerShot: 0.006,
    spreadPerShotMax: 0.03, accurateSpeed: 1.2, recoil: single(15, 1.5, 0.25), recoilRecovery: 0.32,
    recoilJitter: 0.2, penetration: 1.0, killReward: 300,
  },
  rook: {
    id: 'rook', name: 'Rook .44', blurb: 'Six-shot precision sidearm. Heavy kick, pressures armor.', slot: 'secondary',
    cls: 'sidearm', price: 700, damage: 58, armorPen: 0.92, headMult: 3.6, rangeMod: 0.9, range: 100, rpm: 140,
    mode: 'semi', mag: 6, reserve: 24, reloadTime: 2.6, reloadType: 'mag', magInAt: 0.7, drawTime: 0.85,
    moveSpeed: 5.1, spreadStand: 0.003, spreadMove: 0.06, spreadAir: 0.2, spreadCrouchMult: 0.85,
    spreadPerShot: 0.02, spreadPerShotMax: 0.05, accurateSpeed: 0.8, recoil: single(6, 5.2, 0.6),
    recoilRecovery: 0.55, recoilJitter: 0.4, penetration: 2.0, killReward: 300,
  },
  needle: {
    id: 'needle', name: 'Needle-9', blurb: 'Compact automatic sidearm for emergencies.', slot: 'secondary',
    cls: 'sidearm', price: 900, damage: 23, armorPen: 0.55, headMult: 3.6, rangeMod: 0.8, range: 70, rpm: 960,
    mode: 'auto', mag: 18, reserve: 54, reloadTime: 2.2, reloadType: 'mag', magInAt: 0.75, drawTime: 0.7,
    moveSpeed: 5.2, spreadStand: 0.012, spreadMove: 0.03, spreadAir: 0.15, spreadCrouchMult: 0.85,
    spreadPerShot: 0.004, spreadPerShotMax: 0.035, accurateSpeed: 1.5,
    recoil: buildRecoil(18, [[0, 0, 0], [6, 0.6, 3.6], [12, -1.4, 4.4], [18, 1.2, 4.8]]), recoilRecovery: 0.3,
    recoilJitter: 0.35, penetration: 0.9, killReward: 300,
  },
  kite: {
    id: 'kite', name: 'Kite-9', blurb: 'Mobile, forgiving SMG. Weak against armor.', slot: 'primary', cls: 'smg',
    price: 1250, damage: 26, armorPen: 0.55, headMult: 3.6, rangeMod: 0.84, range: 80, rpm: 800, mode: 'auto',
    mag: 30, reserve: 90, reloadTime: 2.3, reloadType: 'mag', magInAt: 0.72, drawTime: 0.8, moveSpeed: 5.0,
    spreadStand: 0.006, spreadMove: 0.028, spreadAir: 0.14, spreadCrouchMult: 0.85, spreadPerShot: 0.0015,
    spreadPerShotMax: 0.02, accurateSpeed: 1.6,
    recoil: buildRecoil(30, [[0, 0, 0], [8, 0.4, 3.0], [16, -1.0, 3.6], [24, 0.9, 3.9], [30, 0.2, 4.0]]),
    recoilRecovery: 0.35, recoilJitter: 0.15, penetration: 1.0, killReward: 450,
  },
  vectora: {
    id: 'vectora', name: 'Vectora-7', blurb: 'High-rate entry SMG with a sharp early climb.', slot: 'primary',
    cls: 'smg', price: 1700, damage: 27, armorPen: 0.6, headMult: 3.8, rangeMod: 0.82, range: 80, rpm: 950,
    mode: 'auto', mag: 25, reserve: 75, reloadTime: 2.4, reloadType: 'mag', magInAt: 0.72, drawTime: 0.8,
    moveSpeed: 5.0, spreadStand: 0.0065, spreadMove: 0.03, spreadAir: 0.15, spreadCrouchMult: 0.85,
    spreadPerShot: 0.002, spreadPerShotMax: 0.025, accurateSpeed: 1.5,
    recoil: buildRecoil(25, [[0, 0, 0], [6, 0.3, 5.6], [12, 1.8, 6.2], [19, -1.6, 6.5], [25, 0.4, 6.6]]),
    recoilRecovery: 0.38, recoilJitter: 0.2, penetration: 1.1, killReward: 450,
  },
  aster: {
    id: 'aster', name: 'Aster 4', blurb: 'Controllable all-purpose rifle. Helmet headshots lethal inside ~29 m.',
    slot: 'primary', cls: 'rifle', price: 2650, damage: 34, armorPen: 0.78, headMult: 4, rangeMod: 0.98, range: 140,
    rpm: 620, mode: 'auto', mag: 30, reserve: 90, reloadTime: 2.5, reloadType: 'mag', magInAt: 0.7, drawTime: 1.0,
    moveSpeed: 4.7, spreadStand: 0.0032, spreadMove: 0.085, spreadAir: 0.22, spreadCrouchMult: 0.75,
    spreadPerShot: 0.0011, spreadPerShotMax: 0.012, accurateSpeed: 0.45,
    recoil: buildRecoil(30, [[0, 0, 0], [9, 0.2, 6.2], [15, 2.4, 7.0], [23, -2.6, 7.4], [30, 1.0, 7.6]]),
    recoilRecovery: 0.42, recoilJitter: 0.12, penetration: 2.2, killReward: 300,
  },
  krait: {
    id: 'krait', name: 'Krait 7', blurb: 'Slower heavy rifle. Lethal helmet headshot, demanding recoil.',
    slot: 'primary', cls: 'rifle', price: 2900, damage: 38, armorPen: 0.8, headMult: 4, rangeMod: 0.98, range: 140,
    rpm: 560, mode: 'auto', mag: 30, reserve: 90, reloadTime: 2.6, reloadType: 'mag', magInAt: 0.7, drawTime: 1.05,
    moveSpeed: 4.6, spreadStand: 0.0036, spreadMove: 0.095, spreadAir: 0.24, spreadCrouchMult: 0.75,
    spreadPerShot: 0.0014, spreadPerShotMax: 0.015, accurateSpeed: 0.45,
    recoil: buildRecoil(30, [[0, 0, 0], [7, -0.3, 7.8], [14, -3.0, 8.6], [22, 3.0, 9.0], [30, 0, 9.3]]),
    recoilRecovery: 0.48, recoilJitter: 0.18, penetration: 2.4, killReward: 300,
  },
  lumen: {
    id: 'lumen', name: 'Lumen Burst', blurb: 'Three-round burst (right-click: semi). Low first-shot spread.',
    slot: 'primary', cls: 'rifle', price: 2350, damage: 31, armorPen: 0.75, headMult: 4, rangeMod: 0.97, range: 130,
    rpm: 320, mode: 'burst', mag: 24, reserve: 72, reloadTime: 2.4, reloadType: 'mag', magInAt: 0.7, drawTime: 0.95,
    moveSpeed: 4.7, spreadStand: 0.0022, spreadMove: 0.08, spreadAir: 0.22, spreadCrouchMult: 0.75,
    spreadPerShot: 0.0035, spreadPerShotMax: 0.012, accurateSpeed: 0.45,
    recoil: buildRecoil(24, [[0, 0, 0], [3, 0.3, 2.6], [6, -0.3, 4.8], [12, 0.6, 7.0], [24, -0.6, 8.0]]),
    recoilRecovery: 0.3, recoilJitter: 0.1, penetration: 2.0, killReward: 300,
    burst: { count: 3, interval: 60 / 1100, cooldown: 0.34 },
  },
  longglass: {
    id: 'longglass', name: 'Longglass M2', blurb: 'Bolt-action scope rifle. Lethal to the torso.',
    slot: 'primary', cls: 'sniper', price: 4650, damage: 115, armorPen: 0.98, headMult: 4, rangeMod: 0.99, range: 200,
    rpm: 40, mode: 'bolt', mag: 5, reserve: 20, reloadTime: 3.4, reloadType: 'mag', magInAt: 0.7, drawTime: 1.15,
    moveSpeed: 4.3, spreadStand: 0.0006, spreadMove: 0.14, spreadAir: 0.3, spreadCrouchMult: 0.8,
    spreadPerShot: 0, spreadPerShotMax: 0, accurateSpeed: 0.5, recoil: single(5, 6), recoilRecovery: 1.2,
    recoilJitter: 0.3, penetration: 3.0, killReward: 150,
    scope: { fovs: [40, 16], scopedSpread: 0.0006, unscopedSpreadMult: 120 },
  },
  sable: {
    id: 'sable', name: 'Sable DMR', blurb: 'Semi-auto scoped rifle. Two hits to the armored body.',
    slot: 'primary', cls: 'dmr', price: 3100, damage: 62, armorPen: 0.85, headMult: 4, rangeMod: 0.985, range: 180,
    rpm: 260, mode: 'semi', mag: 10, reserve: 30, reloadTime: 2.8, reloadType: 'mag', magInAt: 0.7, drawTime: 1.05,
    moveSpeed: 4.4, spreadStand: 0.001, spreadMove: 0.11, spreadAir: 0.26, spreadCrouchMult: 0.8,
    spreadPerShot: 0.004, spreadPerShotMax: 0.012, accurateSpeed: 0.5, recoil: single(10, 2.6, 0.5),
    recoilRecovery: 0.45, recoilJitter: 0.25, penetration: 2.6, killReward: 250,
    scope: { fovs: [45], scopedSpread: 0.001, unscopedSpreadMult: 18 },
  },
  rampart: {
    id: 'rampart', name: 'Rampart 12', blurb: 'Pump shotgun for close holds. Steep falloff.', slot: 'primary',
    cls: 'shotgun', price: 1900, damage: 21, armorPen: 0.6, headMult: 2, rangeMod: 0.5, range: 40, rpm: 70,
    mode: 'pump', mag: 6, reserve: 24, reloadTime: 0.5, reloadType: 'shell', magInAt: 0.8, drawTime: 0.9,
    moveSpeed: 4.8, spreadStand: 0.004, spreadMove: 0.03, spreadAir: 0.1, spreadCrouchMult: 0.9, spreadPerShot: 0,
    spreadPerShotMax: 0, accurateSpeed: 1.5, recoil: single(6, 6.5), recoilRecovery: 0.7, recoilJitter: 0.5,
    pellets: 9, pelletSpread: 0.055, penetration: 0.8, killReward: 450,
  },
  atlas: {
    id: 'atlas', name: 'Atlas LMG', blurb: 'High capacity suppression through cover. Slow, difficult recoil.',
    slot: 'primary', cls: 'lmg', price: 3800, damage: 33, armorPen: 0.78, headMult: 4, rangeMod: 0.96, range: 140,
    rpm: 700, mode: 'auto', mag: 100, reserve: 100, reloadTime: 5.0, reloadType: 'mag', magInAt: 0.75, drawTime: 1.3,
    moveSpeed: 4.3, spreadStand: 0.006, spreadMove: 0.1, spreadAir: 0.26, spreadCrouchMult: 0.65,
    spreadPerShot: 0.0012, spreadPerShotMax: 0.02, accurateSpeed: 0.45,
    recoil: buildRecoil(100, [[0, 0, 0], [10, 0.4, 5.6], [22, 3.6, 6.6], [36, -3.8, 7.2], [52, 3.4, 7.6], [70, -3.4, 7.9], [100, 0, 8.2]]),
    recoilRecovery: 0.6, recoilJitter: 0.25, penetration: 2.8, killReward: 300,
  },
};

export const PRIMARY_IDS: WeaponId[] = ['kite', 'vectora', 'lumen', 'aster', 'krait', 'rampart', 'sable', 'atlas', 'longglass'];
export const SIDEARM_IDS: WeaponId[] = ['vela', 'rook', 'needle'];

/** Max view zoom FOV when scoped, used for sensitivity scaling. */
export const fireInterval = (w: WeaponDef): number => 60 / w.rpm;

export const RECOIL_DEG = DEG;
