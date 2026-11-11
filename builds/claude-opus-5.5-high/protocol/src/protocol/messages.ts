// protocol: versioned message schema between clients and the authoritative room.
// Clients send intent only (inputs + requests). The room sends filtered snapshots
// and reliable events. Nothing here carries hit/damage/money results from a client.

import type { UtilityId } from '../content/rules';
import type { WeaponId } from '../content/weapons';

export { PROTOCOL_VERSION } from '../content/rules';

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
  RELOAD: 512,
  USE: 1024,
  INSPECT: 2048,
} as const;

export type Side = 'intrusion' | 'custodian';
export type TeamIndex = 0 | 1;

export type SelectReq =
  | 'primary'
  | 'secondary'
  | 'tool'
  | 'util0'
  | 'util1'
  | 'util2'
  | 'util3'
  | 'last'
  | 'next'
  | 'prev';

export interface InputCmd {
  seq: number;
  /** server tick the client believes it is sampling for */
  tick: number;
  /** high-resolution client timestamp (ms) */
  time: number;
  buttons: number;
  yaw: number;
  pitch: number;
  select: SelectReq | null;
  /** tick of the interpolated world the client was viewing (lag compensation) */
  viewTick: number;
}

export type ItemId = WeaponId | UtilityId | 'vest' | 'vesthelm' | 'kit';

export type ClientRequest =
  | { rid: number; kind: 'buy'; item: ItemId }
  | { rid: number; kind: 'refund'; item: ItemId }
  | { rid: number; kind: 'drop' }
  | { rid: number; kind: 'radio'; text: string };

export type ActiveKind = 'primary' | 'secondary' | 'tool' | 'util' | 'spike';

export type Phase = 'warmup' | 'buy' | 'live' | 'planted' | 'roundEnd' | 'matchEnd';

export type WinReason = 'elimination' | 'time' | 'detonated' | 'defused';

export interface SnapPlayer {
  id: number;
  team: TeamIndex;
  name: string;
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  pitch: number;
  crouch: number;
  onGround: boolean;
  /** what is in hand */
  hand: WeaponId | UtilityId | 'spike' | 'none';
  firing: boolean;
  reloading: boolean;
  arming: boolean;
  defusing: boolean;
  scoped: boolean;
  /** team-only fields (undefined for enemies) */
  health?: number;
  armor?: number;
  helmet?: boolean;
  kit?: boolean;
  money?: number;
  primary?: WeaponId | null;
  secondary?: WeaponId | null;
  utils?: UtilityId[];
  hasSpike?: boolean;
  flash?: number;
  recoilYaw?: number;
  recoilPitch?: number;
}

export interface SelfState {
  id: number;
  team: TeamIndex;
  side: Side;
  alive: boolean;
  health: number;
  armor: number;
  helmet: boolean;
  kit: boolean;
  money: number;
  primary: { id: WeaponId; mag: number; reserve: number } | null;
  secondary: { id: WeaponId; mag: number; reserve: number } | null;
  utils: UtilityId[];
  utilIndex: number;
  hasSpike: boolean;
  active: ActiveKind;
  reloading: number; // 0..1 progress, 0 when not reloading
  drawing: boolean;
  scopeLevel: number;
  scopeFov: number;
  burstMode: boolean;
  spread: number;
  recoilYaw: number;
  recoilPitch: number;
  flashUntil: number;
  flashPeak: number;
  armProgress: number;
  defuseProgress: number;
  inBuyZone: boolean;
  canBuy: boolean;
  primed: boolean;
  spectating: number;
  refundable: ItemId[];
  speed: number;
}

export interface SnapSpike {
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'detonated' | 'none';
  carrier: number;
  known: boolean;
  x: number;
  y: number;
  z: number;
  site: string;
  explodeTick: number;
  plantTick: number;
}

export interface SnapGrenade {
  id: number;
  type: UtilityId;
  team: TeamIndex;
  x: number;
  y: number;
  z: number;
}

export interface SnapSmoke {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  startTick: number;
  endTick: number;
}

export interface SnapFire {
  id: number;
  cells: number[]; // flat x,y,z triples
  endTick: number;
  team: TeamIndex;
}

export interface SnapShard {
  id: number;
  team: TeamIndex;
  x: number;
  y: number;
  z: number;
}

export interface SnapDrop {
  id: number;
  item: WeaponId | 'spike';
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface TeamScore {
  side: Side;
  score: number;
  alive: number;
  lossTier: number;
}

export interface RoundRecord {
  round: number;
  winner: TeamIndex;
  winnerSide: Side;
  reason: WinReason;
  armed: boolean;
  site: string;
  decisive: string;
  money: [number, number];
  spent: [number, number];
  kills: [number, number];
}

export interface Snapshot {
  tick: number;
  phase: Phase;
  phaseEndTick: number;
  round: number;
  half: number;
  teams: [TeamScore, TeamScore];
  you: SelfState;
  players: SnapPlayer[];
  spike: SnapSpike;
  grenades: SnapGrenade[];
  smokes: SnapSmoke[];
  fires: SnapFire[];
  shards: SnapShard[];
  drops: SnapDrop[];
  lastRound: RoundRecord | null;
  practice: boolean;
}

export type SoundKind =
  | 'step'
  | 'land'
  | 'gear'
  | 'shot'
  | 'reload'
  | 'empty'
  | 'bounce'
  | 'pin'
  | 'drop'
  | 'pickup'
  | 'arm'
  | 'disarm'
  | 'scope'
  | 'melee';

export type GameEvent =
  | { e: 'sound'; kind: SoundKind; x: number; y: number; z: number; src: number; mat?: string; weapon?: string; radius: number }
  | { e: 'shot'; src: number; weapon: WeaponId; ox: number; oy: number; oz: number; ex: number; ey: number; ez: number; tracer: boolean }
  | { e: 'impact'; x: number; y: number; z: number; nx: number; ny: number; nz: number; mat: string; flesh: boolean }
  | { e: 'hit'; src: number; dst: number; dmg: number; zone: string; head: boolean; kill: boolean; armor: boolean; wall: boolean }
  | { e: 'hurt'; dst: number; src: number; dmg: number; fromX: number; fromZ: number }
  | { e: 'kill'; killer: number; victim: number; assister: number; weapon: string; head: boolean; wall: boolean; x: number; y: number; z: number }
  | { e: 'throw'; src: number; type: UtilityId }
  | { e: 'smoke'; x: number; y: number; z: number }
  | { e: 'flash'; x: number; y: number; z: number; src: number }
  | { e: 'blind'; dst: number; amount: number; duration: number }
  | { e: 'explode'; x: number; y: number; z: number; kind: 'frag' | 'spike' }
  | { e: 'fire'; x: number; y: number; z: number }
  | { e: 'pulse'; x: number; y: number; z: number; team: TeamIndex; wedges: number[]; ping: number }
  | { e: 'shardBroken'; x: number; y: number; z: number }
  | { e: 'purchase'; player: number; item: ItemId; ok: boolean; reason?: string; refund?: boolean }
  | { e: 'planted'; site: string; player: number; x: number; y: number; z: number }
  | { e: 'armStart'; player: number }
  | { e: 'defuseStart'; player: number; kit: boolean }
  | { e: 'defused'; player: number }
  | { e: 'spikeDropped'; x: number; y: number; z: number }
  | { e: 'spikePicked'; player: number }
  | { e: 'roundStart'; round: number }
  | { e: 'buyEnd'; round: number }
  | { e: 'roundEnd'; record: RoundRecord }
  | { e: 'halftime' }
  | { e: 'overtime' }
  | { e: 'matchEnd'; result: MatchResult }
  | { e: 'radio'; src: number; team: TeamIndex; text: string };

export interface PlayerStats {
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
  utilityDamage: number;
  enemiesFlashed: number;
  smokesThrown: number;
  spent: number;
  roundsSurvived: number;
}

export interface MatchResult {
  matchId: string;
  ruleset: string;
  mapHash: string;
  rules: string;
  seed: number;
  winner: TeamIndex | -1;
  scores: [number, number];
  rounds: RoundRecord[];
  players: { id: number; name: string; team: TeamIndex; bot: boolean; stats: PlayerStats }[];
  durationTicks: number;
  signature: string;
}
