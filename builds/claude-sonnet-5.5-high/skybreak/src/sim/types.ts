import type { AmmoType, ItemId, WeaponId } from '../shared/content';
import type { Vec3 } from '../shared/math';

export type Mode = 'staging' | 'skiff' | 'freefall' | 'glide' | 'ground' | 'swim' | 'mantle' | 'zipline' | 'grapple' | 'dead';

export interface PlayerInput {
  moveF: number;
  moveR: number;
  yaw: number;
  pitch: number;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
  fire: boolean;
  ads: boolean;
  reload: boolean;
  interact: boolean;
  drop: boolean;
  deploy: boolean;
  melee: boolean;
  throwItem: boolean;
  slot: number; // -1 none, 0..4 select this tick
  cycle: number; // -1, 0, 1
  jumpSkiff: boolean;
  swapShoulder: boolean;
}
export function emptyInput(): PlayerInput {
  return {
    moveF: 0, moveR: 0, yaw: 0, pitch: 0, jump: false, sprint: false, crouch: false, fire: false, ads: false,
    reload: false, interact: false, drop: false, deploy: false, melee: false, throwItem: false, slot: -1, cycle: 0, jumpSkiff: false, swapShoulder: false,
  };
}

export type Slot =
  | { kind: 'weapon'; weapon: WeaponId; rarity: number; mag: number }
  | { kind: 'item'; item: ItemId; count: number };

export interface DamageRecord { by: number; amount: number; t: number }

export interface PlayerStats {
  kills: number; assists: number; damageDealt: number; damageTaken: number; stormDamage: number;
  shots: number; hits: number; headshots: number; distance: number; lootPicked: { name: string; rarity: number; t: number }[];
  placement: number; surviveTime: number; killedBy: string;
}

export interface Player {
  id: number;
  name: string;
  isBot: boolean;
  cosmetic: number;
  alive: boolean;
  mode: Mode;
  // transform (feet position)
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; pitch: number;
  onGround: boolean;
  crouching: boolean;
  sliding: boolean;
  slideT: number; slideCd: number; slideDirX: number; slideDirZ: number; slideSpeed: number;
  stamina: number; sprintDelay: number; sprinting: boolean;
  mantle: { t: number; dur: number; sx: number; sy: number; sz: number; tx: number; ty: number; tz: number } | null;
  zip: { id: number; dist: number; dir: number; len: number } | null;
  grapple: { x: number; y: number; z: number; t: number } | null;
  knockX: number; knockZ: number;
  ventLaunch: boolean;
  wingOut: boolean;
  fallSpeed: number;
  // vitals
  health: number; aegis: number; reserve: number; lastDamage: number;
  // inventory
  slots: (Slot | null)[];
  selected: number;
  ammo: Record<AmmoType, number>;
  // timers
  fireCd: number; reloadT: number; reloading: boolean; swapT: number; windupT: number;
  bloom: number; recoilP: number; recoilY: number; recoilIdx: number; sinceShot: number;
  shotCount: number;
  using: { item: ItemId; t: number; total: number; slot: number; h0: number } | null;
  meleeCd: number;
  interactHold: number;
  prevInput: PlayerInput;
  input: PlayerInput;
  damageLog: DamageRecord[];
  stats: PlayerStats;
  inSmoke: number;
  hazardAcc: number;
  lastStormTick: number;
  spawnSocket: number;
  trail: { x: number; y: number; z: number; t: number }[];
  jumpAt: number;
  shoulder: number;
  adsT: number;
  swapPending: boolean;
  dropCd: number;
  beaconUntil: number;
  // transient flags for the client
  hitFlash: number;
  lastFootstep: number;
  dummy: boolean;
  homeX: number; homeZ: number;
}

export type LootKind =
  | { kind: 'weapon'; weapon: WeaponId; rarity: number; mag: number }
  | { kind: 'item'; item: ItemId; count: number }
  | { kind: 'ammo'; ammo: AmmoType; count: number }
  | { kind: 'cache'; items: { item: ItemId; count: number }[]; ammo: Partial<Record<AmmoType, number>>; owner: string };

export interface LootEntity {
  id: number;
  x: number; y: number; z: number;
  data: LootKind;
  tier: number;
  priority: boolean;
  source: 'floor' | 'chest' | 'locker' | 'death' | 'capsule' | 'drop';
  age: number;
}

export interface Chest {
  id: number; x: number; y: number; z: number; tier: number; kind: 'chest' | 'locker'; opened: boolean; loc: string;
}

export interface Projectile {
  id: number; owner: number; weapon: WeaponId | 'windOrb' | 'mist';
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  gravity: number; damage: number; splash: number; push: number; ttl: number; rarity: number;
  kind: 'rail' | 'orb' | 'mist' | 'gale';
  fuse: number;
  traveled: number;
}
export interface Smoke { id: number; x: number; y: number; z: number; r: number; t: number; life: number }
export interface Capsule { id: number; x: number; z: number; y: number; landed: boolean; opened: boolean; t: number }

export type GameEvent =
  | { type: 'shot'; pid: number; weapon: WeaponId; ox: number; oy: number; oz: number; tx: number; ty: number; tz: number; hit: 'none' | 'world' | 'player' }
  | { type: 'projectile'; pid: number; kind: 'rail' | 'orb' | 'mist' | 'gale' }
  | { type: 'hit'; attacker: number; victim: number; amount: number; zone: 'head' | 'torso' | 'limb'; shieldBreak: boolean; killed: boolean; weapon: string }
  | { type: 'damage'; victim: number; amount: number; source: string; dirX: number; dirZ: number }
  | { type: 'kill'; killer: number; victim: number; weapon: string; assists: number[]; placement: number }
  | { type: 'pickup'; pid: number; name: string; rarity: number }
  | { type: 'full'; pid: number }
  | { type: 'chest'; pid: number; id: number; x: number; y: number; z: number }
  | { type: 'reload'; pid: number; weapon: WeaponId }
  | { type: 'use'; pid: number; item: ItemId; done: boolean }
  | { type: 'explosion'; x: number; y: number; z: number; r: number; kind: 'orb' | 'gale' }
  | { type: 'smoke'; x: number; y: number; z: number; r: number }
  | { type: 'land'; pid: number; speed: number }
  | { type: 'mantle'; pid: number }
  | { type: 'slide'; pid: number }
  | { type: 'storm'; phase: number; msg: string }
  | { type: 'capsule'; x: number; z: number; stage: 'incoming' | 'landed' }
  | { type: 'beacon'; pid: number }
  | { type: 'grapple'; pid: number; x: number; y: number; z: number }
  | { type: 'deploy'; pid: number }
  | { type: 'jump'; pid: number }
  | { type: 'melee'; pid: number }
  | { type: 'end'; winner: number }
  | { type: 'sound'; kind: 'gunshot' | 'footstep'; x: number; y: number; z: number; pid: number; loud: number };

export interface StormState {
  phase: number; // index into zones
  cx: number; cz: number; r: number;
  fromX: number; fromZ: number; fromR: number;
  toX: number; toZ: number; toR: number;
  nextX: number; nextZ: number; nextR: number;
  t: number; // elapsed in current stage
  stage: 'wait' | 'shrink' | 'done';
  waitLen: number; shrinkLen: number;
  damage: number;
  label: string;
}

export interface Skiff { x: number; z: number; y: number; dirX: number; dirZ: number; t: number; startX: number; startZ: number; endX: number; endZ: number; speed: number; length: number }

export type Phase = 'staging' | 'skiff' | 'live' | 'ended';

export type { Vec3 };
