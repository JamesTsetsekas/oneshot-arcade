// Shared content schemas (hero, ability, item, talent). Versioned with CONTENT_VERSION.
export const CONTENT_VERSION = 'crownfall-content-1';

export type DamageType = 'physical' | 'arcane' | 'pure';
export type HeroId = 'brannoch' | 'suri' | 'oru' | 'kesh' | 'ilyra' | 'vey';
export const HERO_IDS: HeroId[] = ['brannoch', 'suri', 'oru', 'kesh', 'ilyra', 'vey'];

export interface Stats {
  maxHp: number;
  hpRegen: number;
  maxMana: number;
  manaRegen: number;
  ad: number;
  ap: number;
  as: number; // attacks per second
  armor: number;
  ward: number; // arcane resist
  ms: number; // m/s
  haste: number;
  crit: number; // 0..1
  armorPen: number; // flat
  wardPen: number;
  healPower: number; // 0..1 bonus
  lifesteal: number;
  range: number;
}
export type StatKey = keyof Stats;
export const ZERO_STATS = (): Stats => ({
  maxHp: 0, hpRegen: 0, maxMana: 0, manaRegen: 0, ad: 0, ap: 0, as: 0, armor: 0, ward: 0, ms: 0, haste: 0, crit: 0,
  armorPen: 0, wardPen: 0, healPower: 0, lifesteal: 0, range: 0,
});

export type Targeting = 'direction' | 'point' | 'unit-enemy' | 'unit-ally' | 'unit-any' | 'self' | 'passive' | 'ally-or-point';
export type Slot = 'P' | 'Q' | 'W' | 'E' | 'R';

export interface ScaledValue {
  base: number[]; // per rank
  ad?: number; ap?: number; bonusAd?: number; maxHp?: number; level?: number;
  unit?: string;
}

export interface AbilityDef {
  id: string;
  slot: Slot;
  name: string;
  targeting: Targeting;
  range: number;
  radius?: number;
  width?: number;
  length?: number;
  cost: number[];
  cooldown: number[];
  castTime: number;
  tags: string[];
  values: Record<string, ScaledValue>;
  /** Template with {key} placeholders filled from `values`. */
  desc: string;
  /** One-line counterplay note shown in tooltip for ultimates. */
  counter?: string;
}

export type Role = 'Vanguard' | 'Tank' | 'Marksman' | 'Skirmisher' | 'Support' | 'Controller' | 'Fighter' | 'Jungler' | 'Mage' | 'Artillery' | 'Assassin' | 'Roamer';

export interface BuildPath { name: string; why: string; items: string[]; vsPhysical?: string; vsArcane?: string }

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  roles: Role[];
  difficulty: 1 | 2 | 3;
  resource: 'mana' | 'energy';
  base: Stats;
  perLevel: Partial<Stats>;
  radius: number;
  ranged: boolean;
  missileSpeed: number;
  windup: number; // fraction of attack period before release
  damageProfile: 'physical' | 'arcane' | 'mixed';
  colors: { body: number; accent: number; glow: number };
  abilities: AbilityDef[]; // P,Q,W,E,R
  builds: BuildPath[];
  skillOrder: Slot[]; // bot default priority among Q/W/E
  preferredRole: 'lane' | 'jungle' | 'support';
  lore: string;
  power: { burst: number; mobility: number; control: number; sustain: number; range: number; safety: number };
}

export type ItemCategory = 'starter' | 'component' | 'completed' | 'boots' | 'consumable';
export type ItemTag = 'attack' | 'ability' | 'defense' | 'movement' | 'support';
export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  tags: ItemTag[];
  cost: number; // total cost
  from: string[];
  stats: Partial<Stats>;
  passive?: string;
  active?: { name: string; cooldown: number; desc: string };
  desc?: string;
  maxStack?: number;
  icon: { shape: 'blade' | 'orb' | 'shield' | 'boot' | 'gem' | 'book' | 'bow' | 'bell' | 'potion' | 'ward' | 'gear' | 'leaf' | 'ring'; color: string };
}

export type TalentId = 'phase' | 'mend' | 'scorch' | 'bulwark' | 'rush' | 'reap';
export interface TalentDef { id: TalentId; name: string; cooldown: number; targeting: Targeting; range: number; desc: string; color: string }

export function scaled(v: ScaledValue, rank: number, s?: { ad: number; ap: number; bonusAd: number; maxHp: number; level: number }): number {
  const r = Math.max(1, Math.min(rank, v.base.length));
  let x = v.base[r - 1];
  if (s) {
    if (v.ad) x += v.ad * s.ad;
    if (v.ap) x += v.ap * s.ap;
    if (v.bonusAd) x += v.bonusAd * s.bonusAd;
    if (v.maxHp) x += v.maxHp * s.maxHp;
    if (v.level) x += v.level * s.level;
  }
  return x;
}

/** Fill an ability description template from data (tooltips come from data, never hand-written numbers). */
export function abilityTooltip(a: AbilityDef, rank: number, s?: { ad: number; ap: number; bonusAd: number; maxHp: number; level: number }): string {
  return a.desc.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = a.values[k];
    if (!v) return k;
    const unit = v.unit ?? '';
    if (s) return `${Math.round(scaled(v, rank, s) * 10) / 10}${unit}`;
    const parts = [`${v.base.length > 1 ? v.base.join('/') : v.base[0]}${unit}`];
    if (v.ad) parts.push(`+${Math.round(v.ad * 100)}% AD`);
    if (v.bonusAd) parts.push(`+${Math.round(v.bonusAd * 100)}% bonus AD`);
    if (v.ap) parts.push(`+${Math.round(v.ap * 100)}% AP`);
    if (v.maxHp) parts.push(`+${Math.round(v.maxHp * 100)}% max HP`);
    if (v.level) parts.push(`+${v.level} per level`);
    return parts.length > 1 ? `${parts[0]} (${parts.slice(1).join(', ')})` : parts[0];
  });
}
