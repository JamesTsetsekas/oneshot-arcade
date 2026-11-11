// Pure rule definitions shared between simulation, AI, UI tooltips, and tests.
export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;
export const SNAPSHOT_EVERY = 2; // ticks -> 15 Hz snapshots
export const MAX_LEVEL = 12;
export const START_GOLD = 500;
export const PASSIVE_GOLD_PER_SEC = 2.4;
export const PASSIVE_GOLD_START = 60;
export const XP_RANGE = 14;
export const RECALL_TIME = 7;
export const RECALL_TIME_EMPOWERED = 4;
export const WAVE_INTERVAL = 30;
export const FIRST_WAVE = 15;
export const CATALYST_SPAWN = 210; // 3:30
export const CATALYST_RESPAWN = 240;
export const CATALYST_BUFF = 240;
export const COLOSSUS_SPAWN = 540; // 9:00
export const COLOSSUS_RESPAWN = 360;
export const COLOSSUS_BUFF = 150;
export const SEAL_RESPAWN = 240;
export const CAMP_FIRST_SPAWN = 75;
export const CAMP_RESPAWN = 120;
export const BUFF_RESPAWN = 180;
export const WARD_DURATION = 90;
export const WARD_CHARGES = 2;
export const WARD_RECHARGE = 75;
export const WARD_CAP = 3; // per team (trinket wards)
export const KILL_GOLD = 280;
export const ASSIST_WINDOW = 10;
export const BOUNTY_PER_STREAK = 45;
export const BOUNTY_CAP = 300;
export const VISION_GRACE_TICKS = 3; // 100 ms
export const SHOP_UNDO_LIMIT = 10;

/** Armor/Ward mitigation: reduction = d/(100+|d|) for d>=0; negative values amplify (bounded at 2x). */
export function damageMultiplier(defense: number): number {
  if (defense >= 0) return 1 - defense / (100 + defense);
  const a = -defense;
  return 1 + a / (100 + a);
}

/** XP required to reach level L+1 from level L (index L). */
export const XP_TO_NEXT = [0, 280, 360, 440, 520, 600, 680, 760, 840, 920, 1000, 1080, 0];
export function xpForLevel(level: number): number {
  let s = 0;
  for (let l = 1; l < level; l++) s += XP_TO_NEXT[l];
  return s;
}
export function levelForXp(xp: number): number {
  let l = 1;
  while (l < MAX_LEVEL && xp >= xpForLevel(l + 1)) l++;
  return l;
}

/** Respawn: 7 s at level 1, scaling with level and match time, capped at 34 s. */
export function respawnTime(level: number, matchSeconds: number): number {
  const t = 7 + (level - 1) * 2.0 + Math.min(5, Math.max(0, matchSeconds - 600) / 120);
  return Math.min(34, t);
}

/** Group XP share: each of n heroes receives this fraction of the unit's XP. */
export function xpShare(n: number): number {
  if (n <= 1) return 1;
  if (n === 2) return 0.62;
  return 0.46; // 3+: total 1.38x across team
}

export function rankAllowed(slot: 'Q' | 'W' | 'E' | 'R', currentRank: number, level: number): boolean {
  if (slot === 'R') return (currentRank === 0 && level >= 6) || (currentRank === 1 && level >= 11);
  if (currentRank >= 4) return false;
  return level >= currentRank * 2 + 1; // rank n requires level 2n-1
}

export function abilityHasteCdr(haste: number): number {
  return 100 / (100 + haste);
}

export type MinionKind = 'guard' | 'bolt' | 'siege' | 'vanguard';
export const MINIONS: Record<MinionKind, { hp: number; hpGrowth: number; ad: number; adGrowth: number; armor: number; range: number; as: number; ms: number; gold: number; xp: number; radius: number; missile: number }> = {
  guard: { hp: 460, hpGrowth: 14, ad: 13, adGrowth: 0.6, armor: 10, range: 1.4, as: 0.8, ms: 3.2, gold: 24, xp: 58, radius: 0.48, missile: 0 },
  bolt: { hp: 290, hpGrowth: 9, ad: 22, adGrowth: 0.8, armor: 0, range: 5.0, as: 0.66, ms: 3.2, gold: 19, xp: 32, radius: 0.42, missile: 14 },
  siege: { hp: 900, hpGrowth: 26, ad: 40, adGrowth: 1.5, armor: 20, range: 6.5, as: 0.5, ms: 3.2, gold: 55, xp: 92, radius: 0.7, missile: 12 },
  vanguard: { hp: 1500, hpGrowth: 40, ad: 70, adGrowth: 2, armor: 40, range: 1.8, as: 0.75, ms: 3.3, gold: 60, xp: 100, radius: 0.8, missile: 0 },
};

export const TOWER_STATS = {
  outer: { hp: 2200, ad: 150, armor: 25, range: 8.5 },
  inner: { hp: 2450, ad: 165, armor: 28, range: 8.5 },
  guard: { hp: 2650, ad: 180, armor: 30, range: 8.5 },
  core: { hp: 2400, ad: 170, armor: 30, range: 8.5 },
  seal: { hp: 2600, ad: 0, armor: 25, range: 0 },
  engine: { hp: 4000, ad: 0, armor: 25, range: 0 },
  fountain: { hp: 1, ad: 800, armor: 0, range: 6 },
};
export const TOWER_ATTACK_PERIOD = 0.95;
export const TOWER_RAMP = 0.3; // +30% per consecutive hit on the same hero
export const TOWER_RAMP_MAX = 1.2;
export const TOWER_GOLD_TEAM = 120;
export const TOWER_GOLD_LOCAL = 80;
export const BACKDOOR_REDUCTION = 0.6;

export const MONSTERS = {
  cogmites: { name: 'Cogmite Swarm', hp: 360, ad: 9, armor: 12, count: 3, gold: 26, xp: 50, radius: 0.5, ranged: false, as: 0.9 },
  mistlings: { name: 'Mistling Pod', hp: 620, ad: 15, armor: 14, count: 2, gold: 42, xp: 80, radius: 0.6, ranged: true, as: 0.6 },
  rams: { name: 'Ivory Ram', hp: 1150, ad: 24, armor: 22, count: 1, gold: 70, xp: 120, radius: 0.85, ranged: false, as: 0.6 },
  crabs: { name: 'Coralback Crab', hp: 700, ad: 14, armor: 26, count: 2, gold: 46, xp: 90, radius: 0.65, ranged: false, as: 0.7 },
  buffForge: { name: 'Brass Warden', hp: 1500, ad: 28, armor: 25, count: 1, gold: 95, xp: 170, radius: 1.0, ranged: false, as: 0.55 },
  buffSpring: { name: 'Lumen Tidecaller', hp: 1450, ad: 25, armor: 20, count: 1, gold: 95, xp: 170, radius: 1.0, ranged: true, as: 0.55 },
  catalystGale: { name: 'Gale Catalyst', hp: 1900, ad: 34, armor: 30, count: 1, gold: 0, xp: 220, radius: 1.3, ranged: true, as: 0.5 },
  catalystForge: { name: 'Forge Catalyst', hp: 1900, ad: 34, armor: 30, count: 1, gold: 0, xp: 220, radius: 1.3, ranged: true, as: 0.5 },
  colossus: { name: 'Aether Colossus', hp: 6000, ad: 80, armor: 45, count: 1, gold: 0, xp: 400, radius: 2.2, ranged: false, as: 0.45 },
} as const;
export const CATALYST_TEAM_GOLD = 100;
export const COLOSSUS_TEAM_GOLD = 200;
export const MONSTER_GROWTH_PER_MIN = 0.045;

export const VISION = { hero: 11, minion: 7, tower: 10, ward: 9, structure: 9, monster: 0 };
