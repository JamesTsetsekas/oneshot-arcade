import type { AmmoType, WeaponId } from '../shared/content/weapons';
import type { ItemId } from '../shared/content/items';
import type { Rarity } from '../shared/content/rarity';
import type { MoveState } from '../shared/sim/movement';
import type { InputFrame, Slot } from '../shared/protocol/messages';
import type { BotBrain } from './bots/brain';

export interface PlayerStats {
  kills: number;
  assists: number;
  damage: number;
  shots: number;
  hits: number;
  stormDamage: number;
  healed: number;
  survival: number;
  placement: number;
  loot: { t: number; label: string; rarity: number }[];
  timeline: { t: number; text: string }[];
  route: [number, number][];
  deathCause: string | null;
}

export interface UseState { slot: number; id: ItemId; start: number; end: number; applied: number }

export interface Player {
  id: number;
  name: string;
  isBot: boolean;
  isDummy: boolean;
  body: number;
  glider: number;
  ms: MoveState;
  alive: boolean;
  health: number;
  aegis: number;
  reserve: number;
  lastDamage: number;
  aegisBoost: boolean;
  slots: Slot[];
  sel: number;
  ammo: Record<AmmoType, number>;
  nextFire: number;
  reloadEnd: number;
  reloadTotal: number;
  equipEnd: number;
  chargeEnd: number;
  burst: number;
  bloom: number;
  lastShot: number;
  ads: boolean;
  shoulder: number;
  fireHeldPrev: boolean;
  use: UseState | null;
  interactHeld: number;
  interactPrev: boolean;
  interactConsumed: boolean;
  focusKey: string;
  meleeReady: number;
  damageLog: { from: number; amt: number; t: number }[];
  history: { t: number; x: number; z: number }[];
  stats: PlayerStats;
  input: InputFrame;
  prevButtons: number;
  bot: BotBrain | null;
  deathTime: number;
  spectate: number;
  marker: { x: number; z: number } | null;
  hazardAcc: number;
  stormAcc: number;
}

export interface LootItem {
  id: number;
  x: number; y: number; z: number;
  kind: 'weapon' | 'item' | 'ammo';
  w?: WeaponId; r?: Rarity; mag?: number;
  item?: ItemId; n?: number;
  ammo?: AmmoType; amount?: number;
  respawnKey?: string; // practice racks
  droppedBy?: number;
}

export interface Container {
  id: number;
  kind: 'chest' | 'locker' | 'cache' | 'capsule' | 'caravan';
  x: number; y: number; z: number; yaw: number;
  tier: number;
  opened: boolean;
  contents: Omit<LootItem, 'id' | 'x' | 'y' | 'z'>[] | null;
}

export interface Projectile {
  id: number;
  owner: number;
  kind: 'rail' | 'gale' | 'wind_orb' | 'mist';
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  gravity: number;
  damage: number;
  headMult: number;
  splash: number;
  knockback: number;
  life: number;
  weapon: WeaponId | null;
  rarity: Rarity;
}

export interface Smoke { id: number; x: number; y: number; z: number; r: number; until: number }
