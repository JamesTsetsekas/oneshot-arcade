export type DamageType = 'phys' | 'ember' | 'frost' | 'blight';
export const DAMAGE_TYPES: DamageType[] = ['phys', 'ember', 'frost', 'blight'];
export type ClassId = 'cinder' | 'ranger';
export type Rarity = 'worn' | 'tempered' | 'inscribed' | 'relic';
export type Difficulty = 'normal' | 'veteran';
export type SlotId = 'weapon' | 'offhand' | 'head' | 'chest' | 'gloves' | 'boots' | 'belt' | 'amulet' | 'ring1' | 'ring2';
export const SLOT_IDS: SlotId[] = ['weapon', 'offhand', 'head', 'chest', 'gloves', 'boots', 'belt', 'amulet', 'ring1', 'ring2'];
export type Stats = Record<string, number>;
export type DmgAmounts = Partial<Record<DamageType, number>>;

export interface Vec2 {
  x: number;
  z: number;
}

export type PotionKind = 'health' | 'focus' | 'cleanse' | 'tonic';
export const POTION_KINDS: PotionKind[] = ['health', 'focus', 'cleanse', 'tonic'];

export interface AffixRoll {
  id: string;
  tier: number;
  value: number;
}

export interface Item {
  uid: string;
  base: string;
  ilvl: number;
  rarity: Rarity;
  identified: boolean;
  affixes: AffixRoll[];
  relic?: string;
  sockets: (string | null)[]; // glyph base ids
  socketCap: number;
  favorite: boolean;
  dur: number;
  durMax: number;
  rerolls: number;
  name: string;
}

export type GameEvent =
  | { t: 'hit'; x: number; z: number; amount: number; crit: boolean; dtype: DamageType; onPlayer: boolean; target: number; killed?: boolean; blocked?: boolean }
  | { t: 'text'; x: number; z: number; text: string; color: string; big?: boolean }
  | { t: 'swing'; skill: string; x: number; z: number; dir: number; actor: number; combo?: number }
  | { t: 'cast'; skill: string; x: number; z: number; tx: number; tz: number }
  | { t: 'telegraph'; kind: string; x: number; z: number; enemy: number }
  | { t: 'die'; x: number; z: number; enemy: number; type: string; elite: boolean; boss: boolean }
  | { t: 'sfx'; id: string; x?: number; z?: number; vol?: number }
  | { t: 'fx'; id: string; x: number; z: number; dir?: number; r?: number; color?: number }
  | { t: 'pickup'; kind: string; text: string; rarity?: Rarity }
  | { t: 'levelup'; level: number }
  | { t: 'toast'; text: string; kind?: 'info' | 'quest' | 'warn' | 'loot' }
  | { t: 'shake'; amount: number }
  | { t: 'hitstop'; ms: number }
  | { t: 'zone'; id: string }
  | { t: 'bossIntro'; id: string }
  | { t: 'death'; cause: string; dtype: DamageType }
  | { t: 'victory' }
  | { t: 'dialog'; npc: string }
  | { t: 'panel'; id: string }
  | { t: 'music'; mode: string };
