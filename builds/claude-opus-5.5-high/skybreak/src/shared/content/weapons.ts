// Data-driven weapon definitions. All nine weapons are original designs:
// wind-instrument / ceramic-housing salvage tech. Rarity modifies 2-3 stats
// modestly; it never doubles damage (enforced by tests).

import { RARITIES, Rarity } from './rarity';

export type AmmoType = 'light' | 'shell' | 'heavy' | 'charge';
export const AMMO_TYPES: readonly AmmoType[] = ['light', 'shell', 'heavy', 'charge'];
export const AMMO_CAPS: Record<AmmoType, number> = { light: 240, shell: 48, heavy: 80, charge: 18 };
export const AMMO_NAMES: Record<AmmoType, string> = { light: 'Light', shell: 'Shell', heavy: 'Heavy', charge: 'Charge' };
/** Ammo amounts granted by a single floor ammo pickup. */
export const AMMO_PICKUP: Record<AmmoType, number> = { light: 36, shell: 8, heavy: 12, charge: 3 };

export type WeaponId =
  | 'wayfarer' | 'tempest' | 'breakwater' | 'coil' | 'needler'
  | 'sundial' | 'longwake' | 'harbor' | 'gale';

export type WeaponClass = 'rifle' | 'carbine' | 'shotgun' | 'smg' | 'dmr' | 'rail' | 'pistol' | 'launcher';

export interface ProjectileDef { speed: number; gravity: number; radius: number; splash?: number; knockback?: number }

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cls: WeaponClass;
  blurb: string;
  ammo: AmmoType;
  mag: number;
  mode: 'auto' | 'semi' | 'pump' | 'bolt';
  /** Seconds between shots. */
  interval: number;
  damage: number;
  pellets: number;
  headMult: number;
  limbMult: number;
  /** Falloff: full damage to start, linear to minMult at end (metres). */
  falloffStart: number;
  falloffEnd: number;
  falloffMin: number;
  range: number;
  hipSpread: number; // degrees, cone half-angle
  adsSpread: number;
  pelletSpread: number;
  bloomPerShot: number;
  bloomMax: number;
  bloomRecover: number; // degrees per second
  /** Deterministic recoil pattern: [pitchUp, yawRight] degrees per shot index. */
  recoil: readonly (readonly [number, number])[];
  reload: number;
  /** Per-shell reload (shotguns): total = reload + perShell * missing. */
  perShell?: number;
  equip: number;
  adsZoom: number; // fov multiplier when aiming
  adsBoom: number; // camera boom metres when aiming (1.8–2.4)
  /** Aggregate damage cap for pellet weapons (body). */
  pelletCapMin?: number;
  pelletCapMax?: number;
  projectile?: ProjectileDef;
  charge?: number; // seconds of charge tone before release
  audibleRadius: number;
  masterwork: { name: string; desc: string };
  prototype: { name: string; desc: string; drawback: string };
}

const pat = (n: number, up: number, side: number, drift = 0): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const s = Math.sin(i * 0.9) * side + drift * Math.min(i, 10) / 10;
    out.push([up * (i < 6 ? 1.0 : 0.7), s]);
  }
  return out;
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  wayfarer: {
    id: 'wayfarer', name: 'Wayfarer Rifle', cls: 'rifle', blurb: 'Balanced medium-range automatic.',
    ammo: 'light', mag: 30, mode: 'auto', interval: 0.105, damage: 27, pellets: 1, headMult: 1.6, limbMult: 0.85,
    falloffStart: 45, falloffEnd: 130, falloffMin: 0.65, range: 320,
    hipSpread: 2.6, adsSpread: 0.35, pelletSpread: 0, bloomPerShot: 0.22, bloomMax: 2.2, bloomRecover: 6,
    recoil: pat(30, 0.42, 0.18, 0.12), reload: 2.2, equip: 0.5, adsZoom: 0.72, adsBoom: 2.1, audibleRadius: 170,
    masterwork: { name: 'Stabilized Grip', desc: 'Bloom builds 25% slower.' },
    prototype: { name: 'Overclocked Bellows', desc: '+15% fire rate', drawback: 'Magazine 24' },
  },
  tempest: {
    id: 'tempest', name: 'Tempest Carbine', cls: 'carbine', blurb: 'Fast, close-medium, demanding recoil.',
    ammo: 'light', mag: 28, mode: 'auto', interval: 0.08, damage: 21, pellets: 1, headMult: 1.5, limbMult: 0.85,
    falloffStart: 25, falloffEnd: 85, falloffMin: 0.55, range: 260,
    hipSpread: 2.9, adsSpread: 0.55, pelletSpread: 0, bloomPerShot: 0.3, bloomMax: 2.8, bloomRecover: 7,
    recoil: pat(28, 0.62, 0.32, -0.2), reload: 2.0, equip: 0.45, adsZoom: 0.8, adsBoom: 2.2, audibleRadius: 160,
    masterwork: { name: 'Damped Stock', desc: 'Recoil pattern 20% smaller.' },
    prototype: { name: 'Storm Coil', desc: 'Final 6 rounds deal +20% damage', drawback: 'Reload 25% slower' },
  },
  breakwater: {
    id: 'breakwater', name: 'Breakwater Scattergun', cls: 'shotgun', blurb: 'Pump action, high close burst.',
    ammo: 'shell', mag: 5, mode: 'pump', interval: 0.95, damage: 11, pellets: 10, headMult: 1.75, limbMult: 0.85,
    falloffStart: 7, falloffEnd: 26, falloffMin: 0.3, range: 60,
    hipSpread: 0.5, adsSpread: 0.35, pelletSpread: 4.4, bloomPerShot: 0, bloomMax: 0, bloomRecover: 10,
    recoil: [[3.2, 0.3]], reload: 0.6, perShell: 0.55, equip: 0.55, adsZoom: 0.88, adsBoom: 2.4,
    pelletCapMin: 22, pelletCapMax: 120, audibleRadius: 150,
    masterwork: { name: 'Choke Ring', desc: 'Pellet spread 15% tighter.' },
    prototype: { name: 'Twin Breech', desc: 'Pump time -25%', drawback: 'Magazine 4' },
  },
  coil: {
    id: 'coil', name: 'Coil Shotgun', cls: 'shotgun', blurb: 'Semi-auto, lower damage per shell.',
    ammo: 'shell', mag: 6, mode: 'semi', interval: 0.36, damage: 7, pellets: 8, headMult: 1.5, limbMult: 0.85,
    falloffStart: 6, falloffEnd: 22, falloffMin: 0.3, range: 50,
    hipSpread: 0.6, adsSpread: 0.45, pelletSpread: 4.0, bloomPerShot: 0.4, bloomMax: 1.2, bloomRecover: 5,
    recoil: [[2.0, 0.4], [2.0, -0.4]], reload: 0.5, perShell: 0.45, equip: 0.45, adsZoom: 0.9, adsBoom: 2.4,
    pelletCapMin: 14, pelletCapMax: 70, audibleRadius: 140,
    masterwork: { name: 'Choke Ring', desc: 'Pellet spread 15% tighter.' },
    prototype: { name: 'Magnet Feed', desc: 'Magazine 9', drawback: 'Spread 15% wider' },
  },
  needler: {
    id: 'needler', name: 'Needler SMG', cls: 'smg', blurb: 'Close range, fast swap, sharp falloff.',
    ammo: 'light', mag: 36, mode: 'auto', interval: 0.066, damage: 16, pellets: 1, headMult: 1.5, limbMult: 0.9,
    falloffStart: 12, falloffEnd: 42, falloffMin: 0.42, range: 180,
    hipSpread: 2.2, adsSpread: 0.9, pelletSpread: 0, bloomPerShot: 0.18, bloomMax: 2.4, bloomRecover: 8,
    recoil: pat(36, 0.3, 0.26, 0.05), reload: 1.7, equip: 0.28, adsZoom: 0.86, adsBoom: 2.3, audibleRadius: 120,
    masterwork: { name: 'Extended Drum', desc: 'Magazine +20%.' },
    prototype: { name: 'Hummingbird', desc: '+20% fire rate', drawback: 'Falloff begins 25% sooner' },
  },
  sundial: {
    id: 'sundial', name: 'Sundial DMR', cls: 'dmr', blurb: 'Semi-auto precision, strong head pressure.',
    ammo: 'heavy', mag: 12, mode: 'semi', interval: 0.42, damage: 44, pellets: 1, headMult: 2.0, limbMult: 0.85,
    falloffStart: 90, falloffEnd: 260, falloffMin: 0.8, range: 450,
    hipSpread: 3.2, adsSpread: 0.12, pelletSpread: 0, bloomPerShot: 0.9, bloomMax: 2.4, bloomRecover: 5,
    recoil: [[1.5, 0.15], [1.5, -0.2], [1.6, 0.25]], reload: 2.6, equip: 0.6, adsZoom: 0.45, adsBoom: 1.8, audibleRadius: 230,
    masterwork: { name: 'Sun Scope', desc: 'Stronger zoom.' },
    prototype: { name: 'Solstice Barrel', desc: 'Headshot multiplier 2.3', drawback: 'Fire interval +20%' },
  },
  longwake: {
    id: 'longwake', name: 'Longwake Rail', cls: 'rail', blurb: 'Charged projectile marksman rifle. Glints when scoped.',
    ammo: 'heavy', mag: 5, mode: 'bolt', interval: 1.3, damage: 92, pellets: 1, headMult: 2.0, limbMult: 0.85,
    falloffStart: 999, falloffEnd: 1000, falloffMin: 1, range: 700,
    hipSpread: 4.0, adsSpread: 0.0, pelletSpread: 0, bloomPerShot: 0, bloomMax: 0, bloomRecover: 5,
    recoil: [[3.5, 0.4]], reload: 3.0, equip: 0.75, adsZoom: 0.3, adsBoom: 1.8, charge: 0.3,
    projectile: { speed: 300, gravity: 6, radius: 0.08 }, audibleRadius: 320,
    masterwork: { name: 'Tidal Scope', desc: 'Stronger zoom, faster charge.' },
    prototype: { name: 'Riptide Coil', desc: 'Projectile speed +40%', drawback: 'Magazine 3' },
  },
  harbor: {
    id: 'harbor', name: 'Harbor Pistol', cls: 'pistol', blurb: 'Reliable sidearm. Fires while swimming.',
    ammo: 'light', mag: 15, mode: 'semi', interval: 0.17, damage: 23, pellets: 1, headMult: 1.6, limbMult: 0.9,
    falloffStart: 20, falloffEnd: 65, falloffMin: 0.6, range: 200,
    hipSpread: 1.6, adsSpread: 0.5, pelletSpread: 0, bloomPerShot: 0.5, bloomMax: 2.0, bloomRecover: 6,
    recoil: [[0.9, 0.1], [0.9, -0.15]], reload: 1.4, equip: 0.25, adsZoom: 0.85, adsBoom: 2.3, audibleRadius: 110,
    masterwork: { name: 'Long Slide', desc: 'Magazine +20%.' },
    prototype: { name: 'Lighthouse', desc: 'Damage +15%', drawback: 'Magazine 10' },
  },
  gale: {
    id: 'gale', name: 'Gale Launcher', cls: 'launcher', blurb: 'Concussive wind orbs: low damage, big displacement.',
    ammo: 'charge', mag: 3, mode: 'semi', interval: 0.9, damage: 18, pellets: 1, headMult: 1, limbMult: 1,
    falloffStart: 999, falloffEnd: 1000, falloffMin: 1, range: 200,
    hipSpread: 1.0, adsSpread: 0.4, pelletSpread: 0, bloomPerShot: 0, bloomMax: 0, bloomRecover: 5,
    recoil: [[2.4, 0]], reload: 2.4, equip: 0.5, adsZoom: 0.85, adsBoom: 2.3,
    projectile: { speed: 48, gravity: 9, radius: 0.35, splash: 6, knockback: 17 }, audibleRadius: 140,
    masterwork: { name: 'Vortex Vane', desc: 'Splash radius +20%.' },
    prototype: { name: 'Cyclone Core', desc: 'Knockback +35%', drawback: 'Magazine 2' },
  },
};

export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];

/** Effective stats of a weapon at a given rarity, including attachment/prototype modifiers. */
export interface WeaponStats {
  def: WeaponDef;
  rarity: Rarity;
  damage: number;
  interval: number;
  mag: number;
  reload: number;
  perShell: number;
  equip: number;
  hipSpread: number;
  adsSpread: number;
  pelletSpread: number;
  bloomPerShot: number;
  recoilMult: number;
  headMult: number;
  falloffStart: number;
  falloffEnd: number;
  adsZoom: number;
  charge: number;
  projectile?: ProjectileDef;
  lastRoundsBonus: number; // tempest prototype
}

export function weaponStats(id: WeaponId, r: Rarity): WeaponStats {
  const d = WEAPONS[id];
  const rr = RARITIES[r];
  const s: WeaponStats = {
    def: d, rarity: r,
    damage: d.damage * rr.damageMult,
    interval: d.interval,
    mag: d.mag,
    reload: d.reload * rr.reloadMult,
    perShell: (d.perShell ?? 0) * rr.reloadMult,
    equip: d.equip * rr.handlingMult,
    hipSpread: d.hipSpread * rr.spreadMult,
    adsSpread: d.adsSpread * rr.spreadMult,
    pelletSpread: d.pelletSpread * (r >= 2 ? 0.95 : 1),
    bloomPerShot: d.bloomPerShot,
    recoilMult: rr.recoilMult,
    headMult: d.headMult,
    falloffStart: d.falloffStart,
    falloffEnd: d.falloffEnd,
    adsZoom: d.adsZoom,
    charge: d.charge ?? 0,
    projectile: d.projectile ? { ...d.projectile } : undefined,
    lastRoundsBonus: 0,
  };
  if (r >= 3) {
    // Masterwork: fixed attachment behaviour per weapon.
    switch (id) {
      case 'wayfarer': s.bloomPerShot *= 0.75; break;
      case 'tempest': s.recoilMult *= 0.8; break;
      case 'breakwater': case 'coil': s.pelletSpread *= 0.85; break;
      case 'needler': case 'harbor': s.mag = Math.round(s.mag * 1.2); break;
      case 'sundial': s.adsZoom *= 0.8; break;
      case 'longwake': s.adsZoom *= 0.8; s.charge *= 0.8; break;
      case 'gale': if (s.projectile) s.projectile.splash = (s.projectile.splash ?? 0) * 1.2; break;
    }
  }
  if (r === 4) {
    switch (id) {
      case 'wayfarer': s.interval /= 1.15; s.mag = 24; break;
      case 'tempest': s.lastRoundsBonus = 0.2; s.reload *= 1.25; break;
      case 'breakwater': s.interval *= 0.75; s.mag = 4; break;
      case 'coil': s.mag = 9; s.pelletSpread *= 1.15; break;
      case 'needler': s.interval /= 1.2; s.falloffStart *= 0.75; s.falloffEnd *= 0.75; break;
      case 'sundial': s.headMult = 2.3; s.interval *= 1.2; break;
      case 'longwake': if (s.projectile) s.projectile.speed *= 1.4; s.mag = 3; break;
      case 'harbor': s.damage *= 1.15; s.mag = 10; break;
      case 'gale': if (s.projectile) s.projectile.knockback = (s.projectile.knockback ?? 0) * 1.35; s.mag = 2; break;
    }
  }
  return s;
}

/** Damage multiplier from distance (hitscan falloff). */
export function falloffMult(s: WeaponStats, dist: number): number {
  if (dist <= s.falloffStart) return 1;
  if (dist >= s.falloffEnd) return s.def.falloffMin;
  const t = (dist - s.falloffStart) / (s.falloffEnd - s.falloffStart);
  return 1 + (s.def.falloffMin - 1) * t;
}

/** Body-shot DPS at point-blank (used for balance tests and advanced stats). */
export function effectiveDps(s: WeaponStats): number {
  let perShot = s.damage * s.def.pellets;
  if (s.def.pelletCapMax) perShot = Math.min(perShot, s.def.pelletCapMax);
  const cycle = s.mag * Math.max(s.interval, s.charge) + s.reload + s.perShell * s.mag;
  return (perShot * s.mag) / cycle;
}
