// Data schema for factions, units, structures and technology.
// All balance content is data-driven and validated by `validateFactionData`.

export type FactionId = 'helix' | 'verdant';
export type Tag = 'Light' | 'Armored' | 'Massive' | 'Biological' | 'Mechanical' | 'Hover' | 'Structure';
export const ALL_TAGS: Tag[] = ['Light', 'Armored', 'Massive', 'Biological', 'Mechanical', 'Hover', 'Structure'];

export interface Cost { ore: number; flux: number }

export type WeaponKind = 'rifle' | 'lance' | 'shell' | 'melee' | 'spore' | 'eruption' | 'arc' | 'needle' | 'torch' | 'bite';

export interface WeaponDef {
  kind: WeaponKind;
  damage: number;
  /** attack period in simulation ticks (20 Hz) */
  period: number;
  range: number;
  minRange?: number;
  /** world units / second. 0 or undefined = instant hit (with decorative tracer) */
  projectileSpeed?: number;
  bonus?: Partial<Record<Tag, number>>;
  /** splash radius in world units */
  splash?: number;
  /** delay in ticks between release and ground eruption (Rift Stag) */
  eruptionDelay?: number;
  /** windup (anticipation) ticks before the shot is released */
  windup: number;
  canTargetHover: boolean;
  /** overpenetrates one Light unit behind the primary target at 50% damage */
  overpenetrate?: boolean;
  /** applies a non-stacking slow (fraction) for `slowTicks` */
  slow?: number;
  slowTicks?: number;
  /** firing cone half-angle in degrees for fixed defenses */
  coneHalfAngle?: number;
  /** setup ticks required while stationary before firing (Mortar Crawler) */
  setupTicks?: number;
}

export type AbilityTarget = 'none' | 'point' | 'unit' | 'toggle';

export interface AbilityDef {
  id: string;
  name: string;
  slot: 0 | 1 | 2; // command card slot -> Q/W/E
  target: AbilityTarget;
  cost?: Cost;
  energy?: number;
  cooldown: number; // ticks
  range: number;
  radius?: number;
  description: string;
}

export interface UnitDef {
  id: string;
  name: string;
  faction: FactionId;
  role: string;
  cost: Cost;
  supply: number;
  buildTime: number; // ticks
  hp: number;
  armor: number;
  speed: number; // world units per second
  radius: number;
  sight: number;
  tags: Tag[];
  weapon?: WeaponDef;
  abilities: string[];
  producedAt: string;
  requires: string[]; // structure ids or tech ids
  hover?: boolean;
  worker?: boolean;
  detector?: number;
  energyMax?: number;
  energyStart?: number;
  energyRegen?: number; // per second
  strongVs: string;
  weakVs: string;
  hotkey: string;
}

export interface StructureDef {
  id: string;
  name: string;
  faction: FactionId;
  role: string;
  cost: Cost;
  buildTime: number;
  hp: number;
  armor: number;
  size: number; // footprint in cells (square)
  sight: number;
  supply: number;
  trains: string[];
  researches: string[];
  requires: string[];
  isHQ?: boolean;
  isDropoff?: boolean;
  isExtractor?: boolean;
  weapon?: WeaponDef;
  zoneRadius?: number;
  detector?: number;
  tags: Tag[];
  hotkey: string;
}

export interface TechDef {
  id: string;
  name: string;
  faction: FactionId;
  cost: Cost;
  time: number;
  at: string;
  requires: string[];
  effect: { attackLevel?: number; armorLevel?: number; unlock?: string };
  description: string;
  hotkey: string;
}

export interface FactionDef {
  id: FactionId;
  name: string;
  tagline: string;
  description: string;
  worker: string;
  scout: string;
  hq: string;
  supplyStructure: string;
  production: string;
  tech: string;
  defense: string;
  extractor: string;
  /** structures grow by themselves after the worker plants them */
  selfGrowingStructures: boolean;
  /** regeneration out of combat for Biological units, hp/s */
  passiveRegen: number;
  /** extra regen while standing in own build zone */
  zoneRegen: number;
  color: string;
}
