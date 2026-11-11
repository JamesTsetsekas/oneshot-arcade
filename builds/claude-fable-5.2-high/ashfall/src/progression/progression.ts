import { CLASSES, SKILL, basicOf, classSkills } from '../abilities/skills';
import { Rng } from '../core/rng';
import type { ClassId, Hero } from '../entity-combat/types';
import { generateItem } from '../items/generate';

export const LEVEL_CAP = 20;
export const xpToNext = (level: number) => Math.round(60 + 42 * level + 13 * level * level);

export function createHero(name: string, cls: ClassId, look: number, seed: number): Hero {
  const rng = new Rng(seed).fork('starter');
  const core = cls === 'cinder' ? 'brand_arc' : 'splinter_volley';
  const hero: Hero = {
    id: 'w' + seed.toString(36) + Date.now().toString(36), name: name.trim().slice(0, 18) || 'Warden', cls, look, level: 1, xp: 0,
    attrs: { ...CLASSES[cls].attrs }, attrPoints: 0, skillPoints: 1,
    ranks: { [basicOf(cls).id]: 1, [core]: 1 }, hotbar: [core, null, null, null, null],
    equip: {}, inv: [], stash: [], gold: 40, dust: 0, belt: [3, 1, 0, 0], beltCap: 5,
    quest: 0, flags: {}, waypoints: ['refuge'], difficulty: 0, maxDifficulty: 0, runSeed: seed >>> 0, runs: 0,
    relicPity: 0, echo: null, blessing: 0, loadouts: [null, null], vendorSeed: seed ^ 0x5bd1e995,
    stats: { kills: 0, deaths: 0, playTime: 0, runTime: 0, bestHunt: {}, lastDeath: '', damageDealt: 0, elites: 0 },
    zone: 'refuge', createdAt: Date.now(),
  };
  const starter = cls === 'cinder' ? [['main', 'mace1'], ['off', 'shield1'], ['chest', 'heavy_chest1']] : [['main', 'wristbow1'], ['off', 'quiver1'], ['chest', 'light_chest1']];
  for (const [slot, base] of starter) hero.equip[slot as 'main'] = generateItem(rng, { ilvl: 1, cls, rarity: 0, base });
  return hero;
}
/** Adds XP, applying level-ups (1 skill point per level, 1 attribute point every other level). Returns levels gained. */
export function grantXp(hero: Hero, amount: number): number {
  if (hero.level >= LEVEL_CAP) return 0;
  hero.xp += Math.round(amount);
  let gained = 0;
  while (hero.level < LEVEL_CAP && hero.xp >= xpToNext(hero.level)) {
    hero.xp -= xpToNext(hero.level);
    hero.level++; gained++;
    hero.skillPoints++;
    if (hero.level % 2 === 0) hero.attrPoints++;
  }
  if (hero.level >= LEVEL_CAP) hero.xp = 0;
  return gained;
}
export function allocAttr(hero: Hero, attr: keyof Hero['attrs']): boolean {
  if (hero.attrPoints <= 0) return false;
  hero.attrPoints--; hero.attrs[attr]++;
  return true;
}
export function canRank(hero: Hero, id: string): string | null {
  const def = SKILL[id];
  if (!def || def.cls !== hero.cls) return 'Not a skill of this class.';
  const cur = hero.ranks[id] ?? 0;
  if (cur >= def.maxRank) return 'Already at maximum rank.';
  if (hero.level < def.unlock) return `Requires level ${def.unlock}.`;
  if (def.excl && hero.ranks[def.excl]) return `Excluded by ${SKILL[def.excl].name}.`;
  if (hero.skillPoints <= 0) return 'No skill points available.';
  return null;
}
export function rankUp(hero: Hero, id: string): string | null {
  const err = canRank(hero, id);
  if (err) return err;
  hero.skillPoints--;
  hero.ranks[id] = (hero.ranks[id] ?? 0) + 1;
  const def = SKILL[id];
  if (def.kind === 'active' && hero.ranks[id] === 1 && !hero.hotbar.includes(id)) {
    const free = hero.hotbar.indexOf(null);
    if (free >= 0) hero.hotbar[free] = id;
  }
  return null;
}
export const spentSkillPoints = (hero: Hero) => Object.entries(hero.ranks).reduce((n, [id, r]) => n + (SKILL[id]?.kind === 'basic' ? 0 : r), 0) - 1;
export const respecCost = (hero: Hero) => (hero.level <= 8 ? 0 : 30 * hero.level);
/** Refunds every skill and attribute point. Free through level 8, modest gold after. */
export function respec(hero: Hero): string | null {
  const cost = respecCost(hero);
  if (hero.gold < cost) return `Respec costs ${cost} gold.`;
  hero.gold -= cost;
  const core = hero.cls === 'cinder' ? 'brand_arc' : 'splinter_volley';
  hero.skillPoints += spentSkillPoints(hero);
  hero.ranks = { [basicOf(hero.cls).id]: 1, [core]: 1 };
  hero.hotbar = [core, null, null, null, null];
  const base = CLASSES[hero.cls].attrs;
  for (const k of Object.keys(base) as (keyof typeof base)[]) { hero.attrPoints += hero.attrs[k] - base[k]; hero.attrs[k] = base[k]; }
  return null;
}
export function assignHotbar(hero: Hero, slot: number, id: string | null): void {
  if (id && (SKILL[id]?.kind !== 'active' || !hero.ranks[id])) return;
  const prev = hero.hotbar.indexOf(id);
  if (id && prev >= 0) hero.hotbar[prev] = hero.hotbar[slot];
  hero.hotbar[slot] = id;
}
export function saveLoadout(hero: Hero, idx: number, name: string): void {
  hero.loadouts[idx] = { name: name.slice(0, 16) || `Loadout ${idx + 1}`, ranks: { ...hero.ranks }, hotbar: [...hero.hotbar] };
}
export function applyLoadout(hero: Hero, idx: number): string | null {
  const l = hero.loadouts[idx];
  if (!l) return 'Empty loadout.';
  const need = Object.entries(l.ranks).reduce((n, [id, r]) => n + (SKILL[id]?.kind === 'basic' ? 0 : r), 0) - 1;
  const have = hero.skillPoints + spentSkillPoints(hero);
  if (need > have) return 'Not enough skill points for this loadout.';
  const cost = respecCost(hero);
  if (hero.gold < cost) return `Switching costs ${cost} gold.`;
  hero.gold -= cost;
  hero.ranks = { ...l.ranks };
  hero.hotbar = [...l.hotbar];
  hero.skillPoints = have - need;
  return null;
}
export const learnedActives = (hero: Hero) => classSkills(hero.cls).filter((s) => s.kind === 'active' && hero.ranks[s.id]);
