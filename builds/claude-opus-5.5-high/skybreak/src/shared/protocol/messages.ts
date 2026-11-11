// Wire protocol between client runtime and the authoritative match. In this
// build the transport is in-process (LocalTransport) but every message is a
// plain, structured-clone-safe object so a WebSocket transport can be dropped in.

import type { Rarity } from '../content/rarity';
import type { WeaponId, AmmoType } from '../content/weapons';
import type { ItemId } from '../content/items';
import type { MoveMode } from '../sim/movement';

export const PROTOCOL_VERSION = 1;

export const BTN = {
  fire: 1,
  ads: 2,
  jump: 4, // edge
  sprint: 8,
  crouch: 16,
  interact: 32, // held
  reload: 64, // edge
  melee: 128, // edge
  deploy: 256, // edge
  walk: 512,
} as const;

export type InvAction =
  | { t: 'swap'; a: number; b: number }
  | { t: 'drop'; slot: number }
  | { t: 'dropAmmo'; ammo: AmmoType; amount: number }
  | { t: 'marker'; x: number; z: number }
  | { t: 'clearMarker' }
  | { t: 'shoulder' }
  | { t: 'ready' };

export interface InputFrame {
  seq: number;
  mx: number;
  mz: number;
  yaw: number;
  pitch: number;
  buttons: number;
  slot: number;
  actions?: InvAction[];
}

export type Slot =
  | { kind: 'weapon'; w: WeaponId; r: Rarity; mag: number }
  | { kind: 'item'; id: ItemId; n: number }
  | null;

export interface CircleView { x: number; z: number; r: number }

export interface StormView {
  phase: number;
  phases: number;
  stage: 'wait' | 'shrink' | 'done';
  endsIn: number;
  cur: CircleView;
  next: CircleView | null;
  damage: number;
}

export type FocusView =
  | { t: 'loot'; id: number; needsHold: boolean; swapSlot: number }
  | { t: 'container'; id: number; kind: string }
  | { t: 'zip' }
  | { t: 'ascend' }
  | null;

export interface SelfView {
  id: number;
  name: string;
  alive: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number;
  mode: MoveMode;
  crouch: boolean;
  slide: boolean;
  sprinting: boolean;
  stamina: number;
  health: number;
  aegis: number;
  reserve: number;
  aegisRecharging: boolean;
  slots: Slot[];
  sel: number;
  ammo: Record<AmmoType, number>;
  reloadLeft: number;
  reloadTotal: number;
  equipLeft: number;
  chargeLeft: number;
  bloom: number;
  spread: number;
  ads: boolean;
  shoulder: number;
  use: { id: ItemId; left: number; total: number } | null;
  focus: FocusView;
  holdProgress: number;
  kills: number;
  placement: number;
  canGlide: boolean;
  agl: number;
  distance: number;
  grappleCharges: number;
  inStorm: boolean;
}

export interface ActorView {
  id: number;
  name: string;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  vx: number; vz: number;
  mode: MoveMode;
  crouch: boolean;
  slide: boolean;
  weapon: WeaponId | null;
  rarity: Rarity;
  body: number;
  glider: number;
  alive: boolean;
  ads: boolean;
  healing: boolean;
  shielded: boolean;
}

export interface LootView {
  id: number;
  x: number; y: number; z: number;
  kind: 'weapon' | 'item' | 'ammo';
  w?: WeaponId; r?: Rarity; mag?: number;
  item?: ItemId; n?: number;
  ammo?: AmmoType; amount?: number;
}

export interface ContainerView { id: number; kind: 'chest' | 'locker' | 'cache' | 'capsule' | 'caravan'; x: number; y: number; z: number; yaw: number; opened: boolean; tier: number }
export interface ProjectileView { id: number; kind: 'rail' | 'gale' | 'wind_orb' | 'mist'; x: number; y: number; z: number; vx: number; vy: number; vz: number }
export interface SmokeView { id: number; x: number; y: number; z: number; r: number; left: number }
export interface SkiffView { x: number; y: number; z: number; dx: number; dz: number; ax: number; az: number; bx: number; bz: number; t: number; active: boolean; jumpOpen: boolean }
export interface CapsuleView { id: number; x: number; y: number; z: number; landed: boolean }
export interface CaravanView { x: number; y: number; z: number; exact: boolean; shield: number; shieldMax: number; alive: boolean }

export type MatchPhase = 'staging' | 'skiff' | 'live' | 'ended';

export interface Snapshot {
  tick: number;
  time: number;
  mode: 'solo' | 'practice';
  phase: MatchPhase;
  phaseLeft: number;
  matchClock: number;
  alive: number;
  total: number;
  you: SelfView;
  spectating: { id: number; name: string; health: number; shield: number } | null;
  players: ActorView[];
  loot: LootView[];
  containers: ContainerView[];
  projectiles: ProjectileView[];
  smokes: SmokeView[];
  storm: StormView;
  skiff: SkiffView | null;
  capsules: CapsuleView[];
  caravan: CaravanView | null;
  marker: { x: number; z: number } | null;
  winner: { id: number; name: string } | null;
}

export type GameEvent =
  | { e: 'shot'; by: number; w: WeaponId; fx: number; fy: number; fz: number; tx: number; ty: number; tz: number; hit: boolean; silent?: boolean }
  | { e: 'hit'; to: number; target: number; amt: number; zone: 'head' | 'torso' | 'limb'; shield: boolean; broke: boolean; kill: boolean; x: number; y: number; z: number }
  | { e: 'hurt'; to: number; amt: number; fromX: number; fromZ: number; shield: boolean; broke: boolean; kind: string }
  | { e: 'recoil'; to: number; p: number; y: number }
  | { e: 'kill'; victim: number; vName: string; killer: number; kName: string; cause: string; assists: number[] }
  | { e: 'impact'; x: number; y: number; z: number; nx: number; ny: number; nz: number; player: boolean }
  | { e: 'explode'; x: number; y: number; z: number; r: number; kind: string }
  | { e: 'pickup'; to: number; label: string; rarity: number }
  | { e: 'denied'; to: number; reason: string }
  | { e: 'open'; id: number; kind: string; x: number; y: number; z: number }
  | { e: 'reload'; by: number; w: WeaponId; x: number; y: number; z: number }
  | { e: 'charge'; by: number; x: number; y: number; z: number }
  | { e: 'glint'; by: number; x: number; y: number; z: number }
  | { e: 'move'; by: number; kind: string; x: number; y: number; z: number }
  | { e: 'heal'; to: number; kind: 'start' | 'done' | 'cancel'; item: ItemId }
  | { e: 'aegis'; to: number; kind: 'recharge' | 'full' }
  | { e: 'storm'; kind: 'reveal' | 'shrink' | 'final'; phase: number }
  | { e: 'capsule'; id: number; x: number; z: number }
  | { e: 'caravan'; kind: 'spawn' | 'pulse' | 'down'; x: number; z: number }
  | { e: 'echo'; to: number; trails: { id: number; pts: [number, number, number][] }[] }
  | { e: 'grapple'; by: number; x: number; y: number; z: number; ok: boolean }
  | { e: 'phase'; phase: MatchPhase }
  | { e: 'win'; id: number; name: string }
  | { e: 'footstep'; by: number; x: number; y: number; z: number; loud: boolean };

export interface MatchResult {
  placement: number;
  total: number;
  winner: string;
  youWon: boolean;
  kills: number;
  assists: number;
  damage: number;
  shots: number;
  hits: number;
  survival: number;
  distance: number;
  stormDamage: number;
  healed: number;
  loot: { t: number; label: string; rarity: number }[];
  timeline: { t: number; text: string }[];
  route: [number, number][];
  deathCause: string | null;
  seed: number;
  ruleset: string;
  manifest: string;
}
