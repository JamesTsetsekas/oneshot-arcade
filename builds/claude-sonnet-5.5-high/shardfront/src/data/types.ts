// faction-data: schema for all balance content. Everything the simulation needs about a unit/structure lives here.
export type Tag = 'Light' | 'Armored' | 'Massive' | 'Biological' | 'Mechanical' | 'Structure' | 'Hover';
export type FactionId = 'helix' | 'verdant';
export type WeaponVisual = 'rifle' | 'lance' | 'mortar' | 'spore' | 'thorn' | 'claw' | 'stag' | 'arc' | 'needle' | 'beast' | 'weld';

export interface Cost { ore: number; flux: number }

export interface WeaponDef {
  damage: number;
  /** seconds between attacks */
  period: number;
  range: number;
  minRange?: number;
  /** anticipation time before release, seconds */
  windup?: number;
  /** world units / second; 0 or undefined = instant hit */
  projectileSpeed?: number;
  /** extra damage per defender tag */
  bonus?: Partial<Record<Tag, number>>;
  splash?: number;
  /** ground eruption: seconds between release and impact */
  delayed?: number;
  slow?: { factor: number; duration: number };
  pierce?: boolean;
  /** seconds the unit must stay still before the first shot */
  setup?: number;
  targets: 'ground' | 'air' | 'both';
  /** turret half-angle (radians); undefined = omnidirectional */
  cone?: number;
  hoverFirst?: boolean;
  visual: WeaponVisual;
}

export type AbilityTarget = 'none' | 'point' | 'unit' | 'grove' | 'toggle' | 'structure';
export interface AbilityDef {
  id: string;
  name: string;
  hotkey: string; // q w e r
  target: AbilityTarget;
  cooldown: number; // seconds
  range?: number;
  radius?: number;
  energy?: number;
  flux?: number;
  desc: string;
}

export interface EntityDef {
  id: string;
  name: string;
  faction: FactionId | 'neutral';
  kind: 'unit' | 'structure' | 'neutral';
  role: string;
  desc: string;
  counter: string; // short counter relationship note
  tags: Tag[];
  hp: number;
  armor: number;
  radius: number;
  speed: number;
  sight: number;
  cost: Cost;
  buildTime: number;
  supply: number;
  supplyProvided?: number;
  producedBy?: string;
  requires?: string[];
  weapon?: WeaponDef;
  abilities?: AbilityDef[];
  worker?: boolean;
  hover?: boolean;
  energy?: number;
  shield?: number; // directional shield capacity
  // structures
  size?: number;
  isHall?: boolean;
  field?: number; // construction field radius
  produces?: string[];
  researches?: string[];
  onVent?: boolean;
  turret?: boolean;
  regen?: number; // hp/s
  /** key into the procedural model table */
  model: string;
}

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  faction: FactionId;
  cost: Cost;
  time: number;
  at: string; // building id
  requires?: string[]; // upgrade ids
  effect: { kind: 'attack' | 'armor' | 'unlock'; amount: number; key?: string };
}

export interface FactionDef {
  id: FactionId;
  name: string;
  tagline: string;
  blurb: string;
  accent: string;
  buildMode: 'attend' | 'seed';
  buildTimeMult: number;
  worker: string;
  scout: string;
  hall: string;
  supply: string;
  tap: string;
  defense: string;
  basicProd: string;
  tech: string;
  units: string[];
  structures: string[];
  upgrades: string[];
  traits: string[];
  /** AI unit composition preferences */
  composition: Array<{ id: string; weight: number }>;
}

export const SIM_HZ = 20;
export const secToTicks = (s: number) => Math.max(1, Math.round(s * SIM_HZ));
