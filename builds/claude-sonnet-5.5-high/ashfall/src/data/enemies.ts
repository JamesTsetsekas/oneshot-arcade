// Enemy definitions: ten normal families, elite modifiers, two bosses.
import type { DamageType } from '../sim/types';

export type Role = 'fodder' | 'skirmisher' | 'controller' | 'bruiser';
export const ROLE_POINTS: Record<Role, number> = { fodder: 1, skirmisher: 2, controller: 3, bruiser: 4 };

export type AttackKind = 'swipe' | 'slam' | 'shoot' | 'ward' | 'explode' | 'hook' | 'sweep' | 'lunge' | 'zone' | 'none';

export interface EnemyDef {
  id: string;
  name: string;
  role: Role;
  hp: number;
  dmg: number;
  speed: number;
  r: number;
  xp: number;
  attack: AttackKind;
  dtype: DamageType;
  windup: number; // telegraph time
  recover: number;
  cooldown: number;
  reach: number; // melee reach or desired range
  rangeMin?: number;
  rangeMax?: number;
  heavy?: boolean; // consumes a heavy-attack token
  res: Partial<Record<DamageType, number>>;
  ranged?: boolean;
  fly?: boolean;
  shieldArc?: number; // radians of frontal shield
  turn: number; // rad/s
  color: number;
  accent: number;
  scale: number;
  threat: string; // tooltip hint
}

export const ENEMIES: Record<string, EnemyDef> = {
  crawler: { id: 'crawler', name: 'Ash Crawler', role: 'fodder', hp: 24, dmg: 5.5, speed: 4.4, r: 0.4, xp: 5, attack: 'swipe', dtype: 'phys', windup: 0.36, recover: 0.5, cooldown: 0.7, reach: 1.25, res: { ember: -25 }, turn: 9, color: 0x3a3836, accent: 0xff7a40, scale: 0.9, threat: 'Fast fodder. Surrounds but yields attack slots.' },
  husk: { id: 'husk', name: 'Bell Husk', role: 'bruiser', hp: 105, dmg: 17, speed: 2.1, r: 0.72, xp: 16, attack: 'slam', dtype: 'phys', windup: 0.95, recover: 1.1, cooldown: 1.4, reach: 2.6, heavy: true, res: { phys: 20, frost: -15 }, turn: 3, color: 0x6c6760, accent: 0xd8b070, scale: 1.25, threat: 'Slow bruiser. Telegraphed overhead slam.' },
  archer: { id: 'archer', name: 'Soot Archer', role: 'skirmisher', hp: 30, dmg: 8.5, speed: 3.3, r: 0.4, xp: 9, attack: 'shoot', dtype: 'phys', windup: 0.55, recover: 0.6, cooldown: 1.7, reach: 11, rangeMin: 6.5, rangeMax: 11, ranged: true, res: {}, turn: 6, color: 0x2f3036, accent: 0xff5a3a, scale: 1.0, threat: 'Repositions to range and leads shots slightly.' },
  scribe: { id: 'scribe', name: 'Grave Scribe', role: 'controller', hp: 46, dmg: 6, speed: 2.8, r: 0.45, xp: 14, attack: 'ward', dtype: 'blight', windup: 0.8, recover: 0.7, cooldown: 7.5, reach: 9, rangeMin: 7, rangeMax: 11, ranged: true, res: { blight: 25 }, turn: 5, color: 0x4b3d58, accent: 0xb36bff, scale: 1.05, threat: 'Raises a fragile ward that shields allies. Priority target.' },
  mite: { id: 'mite', name: 'Lantern Mite', role: 'fodder', hp: 15, dmg: 22, speed: 4.9, r: 0.34, xp: 6, attack: 'explode', dtype: 'ember', windup: 0.8, recover: 0.1, cooldown: 0, reach: 1.9, res: { ember: 50 }, turn: 8, color: 0x5a4a30, accent: 0xffc060, scale: 0.8, threat: 'Explodes after a clear wind-up; hurts enemies too.' },
  pilgrim: { id: 'pilgrim', name: 'Chain Pilgrim', role: 'controller', hp: 76, dmg: 11, speed: 2.5, r: 0.55, xp: 16, attack: 'hook', dtype: 'phys', windup: 0.75, recover: 0.8, cooldown: 4.5, reach: 10, rangeMin: 3, rangeMax: 9, ranged: true, res: { phys: 10 }, turn: 4, color: 0x4a4540, accent: 0xc9a468, scale: 1.12, threat: 'Hooks you into melee range, then advances slowly.' },
  warden: { id: 'warden', name: 'Archive Warden', role: 'bruiser', hp: 120, dmg: 15, speed: 2.4, r: 0.62, xp: 18, attack: 'sweep', dtype: 'phys', windup: 0.85, recover: 1.0, cooldown: 1.2, reach: 2.9, heavy: true, res: { phys: 25 }, shieldArc: 1.8, turn: 1.7, color: 0x5f6f70, accent: 0x5ee0d0, scale: 1.2, threat: 'Shield blocks frontal hits. Slow to turn: flank it.' },
  swarm: { id: 'swarm', name: 'Quill Swarm', role: 'skirmisher', hp: 40, dmg: 5, speed: 4.1, r: 0.55, xp: 9, attack: 'swipe', dtype: 'phys', windup: 0.32, recover: 0.45, cooldown: 0.5, reach: 1.5, fly: true, res: { ember: -30, phys: 10 }, turn: 8, color: 0x2a2530, accent: 0xb36bff, scale: 1.0, threat: 'Flock that splits at half health.' },
  hound: { id: 'hound', name: 'Mire Hound', role: 'skirmisher', hp: 48, dmg: 12, speed: 4.6, r: 0.5, xp: 11, attack: 'lunge', dtype: 'phys', windup: 0.55, recover: 0.5, cooldown: 3.2, reach: 5.5, res: { blight: 25 }, turn: 8, color: 0x34383a, accent: 0xa6ff6a, scale: 1.05, threat: 'Flanks, lunges, then retreats.' },
  adept: { id: 'adept', name: 'Censer Adept', role: 'controller', hp: 52, dmg: 7, speed: 2.9, r: 0.45, xp: 15, attack: 'zone', dtype: 'blight', windup: 0.9, recover: 0.6, cooldown: 3.6, reach: 10, rangeMin: 7, rangeMax: 11, ranged: true, res: { ember: -10 }, turn: 5, color: 0x56503c, accent: 0xc8ff6a, scale: 1.05, threat: 'Lays lingering Blight zones; backs away from melee.' },
  // support entities
  swarmlet: { id: 'swarmlet', name: 'Quill Fragment', role: 'fodder', hp: 12, dmg: 4, speed: 4.6, r: 0.35, xp: 2, attack: 'swipe', dtype: 'phys', windup: 0.3, recover: 0.4, cooldown: 0.5, reach: 1.3, fly: true, res: { ember: -30 }, turn: 9, color: 0x2a2530, accent: 0xb36bff, scale: 0.6, threat: '' },
  ward: { id: 'ward', name: 'Ward Sigil', role: 'fodder', hp: 14, dmg: 0, speed: 0, r: 0.5, xp: 4, attack: 'none', dtype: 'blight', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 0, color: 0x7040a0, accent: 0xd090ff, scale: 1.0, threat: '' },
  dummy: { id: 'dummy', name: 'Training Dummy', role: 'fodder', hp: 1e9, dmg: 0, speed: 0, r: 0.6, xp: 0, attack: 'none', dtype: 'phys', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 0, color: 0x7a6a50, accent: 0xd8b070, scale: 1.1, threat: '' },
  lantern: { id: 'lantern', name: 'Toll Lantern', role: 'fodder', hp: 22, dmg: 18, speed: 3.6, r: 0.36, xp: 0, attack: 'explode', dtype: 'ember', windup: 0.9, recover: 0.1, cooldown: 0, reach: 1.9, res: { ember: 50 }, turn: 8, color: 0x5a4a30, accent: 0xffc060, scale: 0.85, threat: '' },
  scribe_repair: { id: 'scribe_repair', name: 'Repair Scribe', role: 'controller', hp: 50, dmg: 5, speed: 3.0, r: 0.45, xp: 0, attack: 'none', dtype: 'blight', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 5, color: 0x4b3d58, accent: 0x5ee0d0, scale: 1.0, threat: '' },
  urn: { id: 'urn', name: 'Ash Urn', role: 'fodder', hp: 8, dmg: 0, speed: 0, r: 0.45, xp: 0, attack: 'none', dtype: 'phys', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 0, color: 0x6a5a48, accent: 0xc9a468, scale: 0.9, threat: '' },
  powder: { id: 'powder', name: 'Powder Brazier', role: 'fodder', hp: 10, dmg: 30, speed: 0, r: 0.5, xp: 0, attack: 'none', dtype: 'ember', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 0, color: 0x5a3a2a, accent: 0xff7030, scale: 1.0, threat: '' },
  conduit: { id: 'conduit', name: 'Engine Conduit', role: 'fodder', hp: 90, dmg: 0, speed: 0, r: 0.9, xp: 30, attack: 'none', dtype: 'blight', windup: 0, recover: 0, cooldown: 0, reach: 0, res: {}, turn: 0, color: 0x3a5a60, accent: 0x5ee8ff, scale: 1.4, threat: '' },
  toll_keeper: { id: 'toll_keeper', name: 'The Toll-Keeper', role: 'bruiser', hp: 700, dmg: 30, speed: 2.7, r: 1.5, xp: 220, attack: 'none', dtype: 'phys', windup: 0, recover: 0, cooldown: 0, reach: 4, res: { ember: 10 }, turn: 2.4, color: 0x5a4f46, accent: 0xff8a40, scale: 1.8, threat: '' },
  orison_engine: { id: 'orison_engine', name: 'Orison Engine', role: 'bruiser', hp: 1350, dmg: 34, speed: 0, r: 2.6, xp: 520, attack: 'none', dtype: 'blight', windup: 0, recover: 0, cooldown: 0, reach: 6, res: { blight: 40 }, turn: 1, color: 0x4a5a5c, accent: 0x5ee8ff, scale: 1.7, threat: '' },
};

export const NEUTRAL_TYPES = ['dummy', 'urn', 'powder'];
export const NORMAL_TYPES = ['crawler', 'husk', 'archer', 'scribe', 'mite', 'pilgrim', 'warden', 'swarm', 'hound', 'adept'];

export interface EliteMod {
  id: string;
  name: string;
  desc: string;
  incompatible: string[];
  cost: number; // threat budget
  color: number;
}
export const ELITE_MODS: EliteMod[] = [
  { id: 'ember_wake', name: 'Ember Wake', desc: 'Leaves a burning trail as it moves.', incompatible: ['frost_pulse'], cost: 2, color: 0xff6a30 },
  { id: 'frost_pulse', name: 'Frost Pulse', desc: 'Periodically pulses a slowing ring of frost.', incompatible: ['ember_wake'], cost: 2, color: 0x8cc8ff },
  { id: 'rallying', name: 'Rallying', desc: 'Calls two minions and empowers its pack.', incompatible: [], cost: 3, color: 0xffd060 },
  { id: 'mirror_shell', name: 'Mirror Shell', desc: 'A shell that halves damage from the most recent damage type.', incompatible: ['rallying'], cost: 2, color: 0xc0c8d8 },
];
export const ELITE_PREFIX = ['Tollbound', 'Cinder-eyed', 'Hollowed', 'Gravewrought', 'Ashen', 'Oathless', 'Bellsworn', 'Starstruck'];

export function enemyLevelHpMul(level: number): number {
  const l = level - 1;
  return 1 + 0.3 * l + 0.012 * l * l;
}
export function enemyLevelDmgMul(level: number): number {
  return 1 + 0.15 * (level - 1);
}
