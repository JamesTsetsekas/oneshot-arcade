// Versioned wire protocol between a client and the authoritative room.
// Clients send intent only (inputs, view angles, selections, purchase requests).
// They never send hits, damage, money or objective results.
import type { WeaponId } from '../content/weapons';
import type { UtilityId, EquipId } from '../content/rules';

export const PROTOCOL_VERSION = 3;

export const BTN = {
  FWD: 1,
  BACK: 2,
  LEFT: 4,
  RIGHT: 8,
  JUMP: 16,
  CROUCH: 32,
  WALK: 64,
  FIRE: 128,
  ALT: 256,
  USE: 512,
  RELOAD: 1024,
} as const;

export interface InputCmd {
  seq: number;
  buttons: number;
  yaw: number;
  pitch: number;
  /** server tick (fractional) the client was rendering remote players at; used for lag compensation */
  renderTick: number;
}

export type SlotKind = 'primary' | 'sidearm' | 'tool' | 'util';
export type BuyItem = WeaponId | UtilityId | EquipId;

export type ClientCommand =
  | { t: 'buy'; item: BuyItem; reqId: number }
  | { t: 'refund'; item: BuyItem; reqId: number }
  | { t: 'select'; slot: SlotKind; util?: number }
  | { t: 'cycle'; dir: 1 | -1 }
  | { t: 'quick' }
  | { t: 'drop' }
  | { t: 'ready' }
  | { t: 'spectate'; dir: 1 | -1 };

export type ClientMessage = { t: 'hello'; protocol: number; collisionHash: string; ruleset: string } | { t: 'input'; cmd: InputCmd } | { t: 'cmd'; cmd: ClientCommand };

export type Side = 'atk' | 'def';
export type Phase = 'warmup' | 'buy' | 'live' | 'armed' | 'roundEnd' | 'matchEnd';
export type RoundEndReason = 'eliminated' | 'time' | 'detonated' | 'disarmed';

export interface MoveState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  crouch: number;
  jumpHeld: boolean;
  landT: number;
  fatigue: number;
}

export interface WeaponInstSnap {
  id: WeaponId;
  ammo: number;
  reserve: number;
}

/** Private state of the player a client is looking through (itself, or a spectated teammate). */
export interface ViewState {
  id: number;
  move: MoveState;
  yaw: number;
  pitch: number;
  hp: number;
  armor: number;
  helmet: boolean;
  kit: boolean;
  hasSpike: boolean;
  primary: WeaponInstSnap | null;
  sidearm: WeaponInstSnap | null;
  util: UtilityId[];
  slot: SlotKind;
  utilSel: number;
  reloading: number; // 0..1 progress, 0 when idle
  drawing: boolean;
  recoilIdx: number;
  punchP: number;
  punchY: number;
  heat: number;
  scope: number; // 0 = unscoped, 1.. = zoom level
  plant: number; // 0..1
  defuse: number; // 0..1
  frozen: boolean;
  maxSpeed: number;
  inBuyZone: boolean;
  site: '' | 'A' | 'B';
  canPickup: string; // name of a weapon that E would pick up
}

export interface OwnState {
  id: number;
  alive: boolean;
  money: number;
  team: number;
  side: Side;
  canBuy: boolean;
  /** items bought this round that are still refundable */
  refundable: BuyItem[];
  nextRoundMin: number;
  spectating: number; // player id or -1 (fixed tactical camera)
  ready: boolean;
}

export interface PlayerSnap {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  crouch: number;
  /** held item for the third-person model */
  item: string;
  flags: number; // PF_*
}

export const PF = { PLANTING: 1, DEFUSING: 2, SPIKE: 4, RELOADING: 8, SCOPED: 16, BLIND: 32, ONGROUND: 64 } as const;

export interface RosterEntry {
  id: number;
  name: string;
  team: number;
  bot: boolean;
  alive: boolean;
  k: number;
  d: number;
  a: number;
  /** team-only fields (-1 / '' for enemies) */
  money: number;
  hp: number;
  primary: string;
  sidearm: string;
  armor: number;
  helmet: boolean;
  kit: boolean;
  utilCount: number;
  hasSpike: boolean;
}

export interface GrenadeSnap {
  id: number;
  type: UtilityId;
  x: number;
  y: number;
  z: number;
  team: number;
}

export interface VeilSnap {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
  start: number; // tick
  end: number; // tick
}

export interface FireSnap {
  id: number;
  cells: number[]; // x,y,z triples
  end: number;
}

export interface ShardSnap {
  id: number;
  x: number;
  y: number;
  z: number;
  team: number;
}

export interface ItemSnap {
  uid: number;
  kind: 'weapon' | 'spike';
  def: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface SpikeSnap {
  state: 'carried' | 'dropped' | 'armed' | 'disarmed' | 'detonated';
  /** only present when legally known to the viewer */
  x?: number;
  y?: number;
  z?: number;
  site?: 'A' | 'B';
  armedTick?: number;
  defuser?: number;
}

export interface WorldSnap {
  tick: number;
  phase: Phase;
  phaseEnd: number; // tick at which the current phase ends
  round: number;
  score: [number, number];
  sides: [Side, Side];
  players: PlayerSnap[];
  roster: RosterEntry[];
  grenades: GrenadeSnap[];
  veils: VeilSnap[];
  fires: FireSnap[];
  shards: ShardSnap[];
  items: ItemSnap[];
  spike: SpikeSnap;
  /** radar blips: enemies currently seen by a living teammate (2D only) */
  spotted: { id: number; x: number; z: number }[];
}

export interface ImpactInfo {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  mat: string;
  /** 'w' world, 'p' player, 'x' penetration exit */
  kind: 'w' | 'p' | 'x';
}

export interface PlayerStats {
  id: number;
  name: string;
  team: number;
  bot: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshots: number;
  shots: number;
  hits: number;
  openingKills: number;
  openingDeaths: number;
  trades: number;
  plants: number;
  defuses: number;
  utilDamage: number;
  flashed: number;
  spent: number;
}

export interface RoundRecord {
  n: number;
  winnerTeam: number;
  winnerSide: Side;
  reason: RoundEndReason;
  /** equipment value per team at round start (after buy) */
  equip: [number, number];
  /** total cash per team after rewards */
  bank: [number, number];
  spent: [number, number];
  firstKill: { killer: number; victim: number } | null;
  planted: boolean;
  site: '' | 'A' | 'B';
  mvp: number;
  duration: number;
}

export interface MatchSummary {
  matchId: string;
  ruleset: string;
  map: string;
  collisionHash: string;
  seed: number;
  score: [number, number];
  winnerTeam: number; // -1 draw
  rounds: RoundRecord[];
  players: PlayerStats[];
  /** FNV fingerprint over the transaction/event log for replay verification */
  logHash: string;
  ticks: number;
}

export type GameEvent =
  | { t: 'shot'; id: number; weapon: WeaponId; ox: number; oy: number; oz: number; impacts: ImpactInfo[]; ex: number; ey: number; ez: number; punchP: number; punchY: number }
  | { t: 'melee'; id: number; x: number; y: number; z: number; hit: boolean }
  | { t: 'hit'; victim: number; dmg: number; zone: string; killed: boolean; x: number; y: number; z: number }
  | { t: 'hurt'; from: number; dmg: number; fx: number; fz: number; armor: boolean }
  | { t: 'kill'; killer: number; victim: number; weapon: string; head: boolean; wall: boolean; assist: number; x: number; y: number; z: number; dx: number; dz: number }
  | { t: 'sound'; kind: string; x: number; y: number; z: number; id: number; vol?: number }
  | { t: 'veil'; x: number; y: number; z: number }
  | { t: 'flashpop'; x: number; y: number; z: number }
  | { t: 'blind'; amount: number; duration: number }
  | { t: 'frag'; x: number; y: number; z: number }
  | { t: 'thermite'; x: number; y: number; z: number }
  | { t: 'pulse'; x: number; y: number; z: number; n: number; team: number; wedges: { a: number; d: number }[] }
  | { t: 'shardbreak'; x: number; y: number; z: number }
  | { t: 'throw'; id: number; util: UtilityId }
  | { t: 'phase'; phase: Phase; round: number }
  | { t: 'armed'; site: 'A' | 'B'; by: number; x: number; y: number; z: number }
  | { t: 'disarmed'; by: number }
  | { t: 'detonated'; x: number; y: number; z: number }
  | { t: 'roundend'; winnerTeam: number; winnerSide: Side; reason: RoundEndReason; award: number; mvp: number; note: string; score: [number, number] }
  | { t: 'halftime' }
  | { t: 'matchend'; summary: MatchSummary }
  | { t: 'chat'; from: number; text: string; kind: 'radio' | 'system' }
  | { t: 'buy'; ok: boolean; reqId: number; item: string; reason: string; refund?: boolean }
  | { t: 'pickup'; item: string }
  | { t: 'money'; amount: number; reason: string };

export interface ServerFrame {
  tick: number;
  /** last input sequence the server has simulated for this client */
  ack: number;
  own: OwnState;
  view: ViewState | null;
  world?: WorldSnap;
  events: GameEvent[];
}

export interface ServerWelcome {
  t: 'welcome';
  protocol: number;
  playerId: number;
  map: string;
  collisionHash: string;
  ruleset: string;
  tickRate: number;
  seed: number;
}
