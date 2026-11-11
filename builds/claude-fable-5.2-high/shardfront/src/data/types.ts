// faction-data: shared type definitions for balance content.
// All durations are authored in seconds and converted to ticks by the simulation.

export type Faction = 'helix' | 'chorus';
export type FactionOrNeutral = Faction | 'neutral';

export const TAGS = ['Light', 'Armored', 'Massive', 'Biological', 'Mechanical', 'Structure', 'Hover'] as const;
export type Tag = (typeof TAGS)[number];

export type WeaponFx = 'rifle' | 'lance' | 'shell' | 'claw' | 'spore' | 'needle' | 'eruption' | 'arc' | 'tool' | 'gore';

export interface WeaponDef {
  name: string;
  damage: number;
  /** seconds between attacks */
  period: number;
  range: number;
  minRange: number;
  /** anticipation before the shot is released (seconds) */
  windup: number;
  /** projectile speed in units/second; 0 = instant contact */
  speed: number;
  /** splash radius; 0 = single target */
  splash: number;
  /** ground-effect delay in seconds (telegraphed eruptions); 0 = none */
  delay: number;
  bonus: Partial<Record<Tag, number>>;
  fx: WeaponFx;
  melee: boolean;
  hitsHover: boolean;
  /** attack lands on a ground point instead of homing on the target */
  ground: boolean;
  slow?: { factor: number; seconds: number };
  /** line shot continues through to one Light unit behind the target */
  pierce?: boolean;
}

export type EntityClass = 'unit' | 'structure' | 'resource' | 'neutral';

export interface EntityDef {
  id: string;
  name: string;
  faction: FactionOrNeutral;
  cls: EntityClass;
  role: string;
  /** one-line counter guidance shown in tooltips / tech archive */
  counters: string;
  ore: number;
  flux: number;
  supply: number;
  supplyProvided: number;
  /** seconds */
  buildTime: number;
  hp: number;
  armor: number;
  speed: number;
  radius: number;
  sight: number;
  tags: Tag[];
  weapon?: WeaponDef;
  ability?: string;
  /** square footprint edge in cells for structures / blockers (even numbers) */
  footprint: number;
  /** structure ids that must be complete before this can be built / trained */
  requires: string[];
  /** tech id required */
  requiresTech?: string;
  trains: string[];
  researches: string[];
  worker?: boolean;
  hq?: boolean;
  dropoff?: boolean;
  hover?: boolean;
  /** radius of the construction field this structure projects */
  zone: number;
  /** maximum energy pool (support casters) */
  energy: number;
  /** frontal projectile shield pool */
  shield: number;
  /** flux extractor placed on a vent */
  tap?: boolean;
  scout?: boolean;
  /** render scale hint (model height in world units) */
  height: number;
}

export interface TechDef {
  id: string;
  name: string;
  faction: Faction;
  ore: number;
  flux: number;
  /** seconds */
  time: number;
  requiresTech?: string;
  desc: string;
  kind: 'attack' | 'armor' | 'tier';
  level: number;
}

export interface AbilityDef {
  id: string;
  name: string;
  desc: string;
  target: 'none' | 'point' | 'unit';
  range: number;
  /** seconds */
  cooldown: number;
  energy: number;
  flux: number;
  radius: number;
  toggle?: boolean;
}

export const ATTACK_UPGRADE_STEP = 0.08;
export const ARMOR_UPGRADE_STEP = 0.06;
