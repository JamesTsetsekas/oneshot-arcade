import type { UtilityId } from '../content/economy';
import type { WeaponId, WeaponSlot } from '../content/weapons';
import type { MaterialId } from './map';
import type { Vec3 } from './math';

export type Side = 'cus' | 'int';
export type Phase = 'warmup' | 'buy' | 'live' | 'armed' | 'roundEnd' | 'halftime' | 'matchEnd';
export type HitZone = 'head' | 'chest' | 'abdomen' | 'arm' | 'leg';

/** Sanitised player intent for one 64 Hz tick. The only thing a client ever sends. */
export interface InputCmd {
  seq: number;
  /** Fractional server tick the client was rendering when it sampled this input (lag compensation). */
  viewTick: number;
  /** Strafe: right positive. Forward: forward positive. Both in [-1, 1]. */
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  fire: boolean;
  alt: boolean;
  jump: boolean;
  crouch: boolean;
  walk: boolean;
  use: boolean;
  /** Edge-triggered actions for this cmd. */
  reload?: boolean;
  drop?: boolean;
  quick?: boolean;
  inspect?: boolean;
  select?: 'primary' | 'secondary' | 'tool' | `util${number}` | 'next' | 'prev';
  buy?: { req: number; item: string };
  refund?: { req: number; item: string };
}

export interface WeaponState {
  id: WeaponId;
  mag: number;
  reserve: number;
  /** Match time (s) at which the weapon may fire again. */
  nextFire: number;
  /** Match time the weapon is ready after drawing. */
  readyAt: number;
  reloadEnd: number;
  reloading: boolean;
  burstLeft: number;
  burstNext: number;
  /** Fractional recoil index (decays with time). */
  shots: number;
  lastShot: number;
  /** Sustained-fire spread heat (radians). */
  heat: number;
  /** Bought this buy phase and not yet fired: refundable. */
  fresh: boolean;
  /** Pump: needs the pump cycle (next fire gating handled by nextFire). */
  scopeLevel: number;
}

export type Controller = 'human' | 'bot';

export interface PurchaseRecord { item: string; price: number }

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshots: number;
  shots: number;
  hits: number;
  plants: number;
  defuses: number;
  utilDamage: number;
  flashed: number;
  openingKills: number;
  spent: number;
  score: number;
}

export interface Player {
  id: number;
  name: string;
  squad: 0 | 1;
  side: Side;
  controller: Controller;
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  /** 0 standing .. 1 crouched. */
  crouch: number;
  onGround: boolean;
  alive: boolean;
  hp: number;
  armor: number;
  helmet: boolean;
  armorFresh: boolean;
  kit: boolean;
  spike: boolean;
  money: number;
  slots: { primary: WeaponState | null; secondary: WeaponState | null; tool: WeaponState };
  cur: 'primary' | 'secondary' | 'tool' | `util${number}`;
  prev: 'primary' | 'secondary' | 'tool';
  util: UtilityId[];
  utilBought: Partial<Record<UtilityId, number>>;
  /** Throw wind-up for the held grenade. */
  throwHeld: number;
  interact: { kind: 'arm' | 'defuse' | null; progress: number };
  stats: PlayerStats;
  killedRound: boolean;
  landPenalty: number;
  flashUntil: number;
  flashFull: number;
  /** Last unconsumed cmd and bookkeeping. */
  lastSeq: number;
  lastCmd: InputCmd | null;
  cmdQueue: InputCmd[];
  starve: number;
  processedReqs: Set<number>;
  purchases: PurchaseRecord[];
  /** Attackers that damaged this player recently: id -> {damage,time}. */
  damagers: Map<number, { dmg: number; t: number }>;
  stepAcc: number;
  stance: 0 | 1 | 2 | 3 | 4;
  ping: number;
  /** Seconds of match time at which the player may next interact with the drop key etc. */
  dropLock: number;
  inspectUntil: number;
  swing: number;
  lastHurtDir: number;
  connected: boolean;
  firePrev: boolean;
  altPrev: boolean;
  usePrev: boolean;
  jumpPrev: boolean;
  idleSince: number;
}

export interface Grenade {
  id: number;
  type: UtilityId;
  owner: number;
  side: Side;
  pos: Vec3;
  vel: Vec3;
  born: number;
  /** Time at which the fuse expires (flash, frag) or -1. */
  detonateAt: number;
  landed: boolean;
  landedAt: number;
  bounces: number;
  sleep: boolean;
  /** Pulse shard state. */
  pulses: number;
  nextPulse: number;
  destroyed: boolean;
}

export interface SmokeVolume { id: number; pos: Vec3; radius: number; bloomAt: number; until: number }
export interface FireArea { id: number; owner: number; cells: Array<{ x: number; y: number; z: number }>; until: number }
export interface DropItem { id: number; weapon: WeaponState; pos: Vec3; born: number }

export interface SpikeState {
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'exploded';
  carrier: number;
  pos: Vec3;
  site: 'A' | 'B' | null;
  plantedAt: number;
  explodeAt: number;
  nextBeep: number;
  defuser: number;
  defuseProgress: number;
  defuseNeeded: number;
}

export interface RoundRecord {
  round: number;
  winnerSide: Side;
  winnerSquad: 0 | 1;
  reason: 'detonated' | 'eliminated' | 'disarmed' | 'timeExpired' | 'defendersEliminated';
  planted: boolean;
  duration: number;
  moneyBefore: [number, number];
  equipValue: [number, number];
  score: [number, number];
  firstKill?: { killer: number; victim: number };
}

export type GameEvent =
  | { t: 'phase'; phase: Phase; round: number; at: number }
  | { t: 'roundEnd'; winnerSquad: 0 | 1; winnerSide: Side; reason: RoundRecord['reason']; score: [number, number] }
  | { t: 'kill'; killer: number; victim: number; weapon: WeaponId | 'spike' | 'fire' | 'frag' | 'world'; head: boolean; wall: boolean; assist: number; pos: Vec3 }
  | { t: 'shot'; id: number; weapon: WeaponId; o: Vec3; e: Vec3; side: Side }
  | { t: 'impact'; p: Vec3; n: Vec3; mat: MaterialId | 'player' | 'ground' | 'head' }
  | { t: 'hit'; shooter: number; victim: number; dmg: number; head: boolean; killed: boolean }
  | { t: 'hurt'; victim: number; dmg: number; from: Vec3; kind: 'bullet' | 'fire' | 'frag' | 'world' }
  | { t: 'step'; id: number; p: Vec3; loud: number; kind: 'step' | 'land' | 'jump' | 'crouch' }
  | { t: 'sfx'; id: number; kind: 'reload' | 'draw' | 'dry' | 'drop' | 'pickup' | 'scope' | 'bolt' | 'throw' | 'armLoop' | 'defuseLoop' | 'melee'; p: Vec3; weapon?: WeaponId }
  | { t: 'nade'; kind: 'bounce' | 'flash' | 'frag' | 'veil' | 'thermite' | 'pulse' | 'pulsePing' | 'pulseDestroyed' | 'fireEnd'; type: UtilityId; p: Vec3; id: number; owner: number; side: Side; data?: number[] }
  | { t: 'spike'; kind: 'pickup' | 'drop' | 'armStart' | 'armCancel' | 'planted' | 'beep' | 'defuseStart' | 'defuseCancel' | 'defused' | 'explode'; p: Vec3; id: number; remaining?: number }
  | { t: 'econ'; id: number; delta: number; reason: string }
  | { t: 'buy'; id: number; item: string; ok: boolean; reason?: string; req: number; refund?: boolean }
  | { t: 'info'; text: string };

export interface RoundSummary { text: string }

export const SLOT_ORDER: WeaponSlot[] = ['primary', 'secondary', 'tool'];
