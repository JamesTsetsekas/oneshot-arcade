// Progression: account levels 1-30, sidegrade unlocks only. No unlock changes base health or universal damage.
export const MAX_LEVEL = 30;
export const XP_VALUES = { participation: 150, kill: 100, headshotBonus: 25, assist: 50, supportDestroy: 75, win: 500, completion: 100, medal: 20 };

/** XP required to advance FROM `level` to level+1. */
export const xpToNext = (level: number): number => (level >= MAX_LEVEL ? Infinity : 300 + 70 * (level - 1));
export const totalXpForLevel = (level: number): number => {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
};
export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rem = xp;
  while (level < MAX_LEVEL && rem >= xpToNext(level)) { rem -= xpToNext(level); level++; }
  return { level, into: rem, need: xpToNext(level) };
}

/** Level at which each content id unlocks in Quick Play / account progression. Practice has everything open. */
export const UNLOCK_LEVELS: Record<string, number> = {
  ar4: 1, p9: 1, reflex: 1, compensator: 1, angled: 1, extmag: 1, fixedstock: 1,
  fleet: 1, signalfilter: 1, rapid: 1, frag: 1, flash: 1, recon: 1, drone: 1, uplink: 1,
  m7: 3, h3: 4, quickmantle: 5, lightbarrel: 6, stable: 6, br12: 7, adhesive: 8, obscurant: 9,
  optic2x: 10, suppressor: 11, lightstock: 12, sg8: 13, cinder: 14, quickmag: 15, munitions: 16, ammopod: 17,
  lmg60: 18, mine: 19, lightkit: 20, mortar: 21, mr1: 24, dart: 22, tracereader: 26, fieldpatch: 28, scavenger: 30, flight: 25,
};
export const unlocksAtLevel = (level: number): string[] => Object.entries(UNLOCK_LEVELS).filter(([, l]) => l === level).map(([id]) => id);
export const ownedAt = (level: number): Set<string> => new Set(Object.entries(UNLOCK_LEVELS).filter(([, l]) => l <= level).map(([id]) => id));
