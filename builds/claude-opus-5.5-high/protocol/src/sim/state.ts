// Server-private mutable match state. Never sent to clients directly; the
// snapshot builder filters it per viewer.

import type { UtilityId } from '../content/rules';
import type { WeaponId } from '../content/weapons';
import type { ActiveKind, InputCmd, ItemId, PlayerStats, TeamIndex } from '../protocol/messages';
import type { Vec3 } from './math';

export interface WeaponItem {
  uid: number;
  id: WeaponId;
  mag: number;
  reserve: number;
  fired: boolean;
  buyer: number;
  boughtRound: number;
}

export interface Purchase {
  item: ItemId;
  price: number;
  uid: number; // weapon uid, or -1
  armorBefore?: { armor: number; helmet: boolean };
  replaced?: WeaponItem | null;
}

export interface Player {
  id: number;
  name: string;
  team: TeamIndex;
  bot: boolean;
  difficulty: number; // 0..1
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  crouchAmt: number;
  crouchHeld: boolean;
  crouchToggleTicks: number[];
  walking: boolean;
  landTick: number;
  landPenalty: number;
  lastJumpTick: number;
  jumpHeldPrev: boolean;
  stepAccum: number;
  alive: boolean;
  health: number;
  armor: number;
  helmet: boolean;
  kit: boolean;
  money: number;
  primary: WeaponItem | null;
  secondary: WeaponItem | null;
  utils: UtilityId[];
  hasSpike: boolean;
  active: ActiveKind;
  utilIndex: number;
  lastActive: ActiveKind;
  drawUntil: number; // tick
  nextAttack: number; // seconds
  reloadStart: number; // tick, -1 none
  reloadEnd: number;
  reloadApplied: boolean;
  recoilIndex: number;
  lastShotTick: number;
  burstLeft: number;
  burstMode: boolean;
  scopeLevel: number;
  shotCounter: number;
  primed: 0 | 1 | 2; // 0 none, 1 strong (fire), 2 lob (alt)
  armStart: number;
  defuseStart: number;
  flashUntil: number;
  flashStart: number;
  flashPeak: number;
  prevButtons: number;
  lastCmd: InputCmd | null;
  inputs: InputCmd[];
  processedRids: Set<number>;
  stats: PlayerStats;
  roundDamage: Map<number, { dmg: number; tick: number }>;
  lastKillTick: number;
  lastKilledBy: number;
  purchases: Purchase[];
  deathTick: number;
  spectating: number;
  rttMs: number;
  practiceSpawn?: { x: number; z: number; yaw: number };
  respawnTick: number;
  firingTick: number;
}

export interface Grenade {
  id: number;
  type: UtilityId;
  owner: number;
  team: TeamIndex;
  pos: Vec3;
  vel: Vec3;
  spawnTick: number;
  rest: boolean;
  done: boolean;
  bounces: number;
}

export interface Smoke {
  id: number;
  pos: Vec3;
  radius: number;
  startTick: number;
  endTick: number;
  owner: number;
}

export interface Fire {
  id: number;
  cells: Vec3[];
  cellSet: Set<number>;
  endTick: number;
  owner: number;
  team: TeamIndex;
  pos: Vec3;
}

export interface Shard {
  id: number;
  pos: Vec3;
  owner: number;
  team: TeamIndex;
  startTick: number;
  pings: number;
  alive: boolean;
}

export interface Drop {
  id: number;
  item: WeaponItem | 'spike';
  pos: Vec3;
  yaw: number;
  tick: number;
  dropper: number;
}

export interface SpikeState {
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'detonated' | 'none';
  carrier: number;
  pos: Vec3;
  site: string;
  plantTick: number;
  explodeTick: number;
  dropId: number;
  defuser: number;
  /** teams that currently know where the dropped spike is */
  seenBy: [boolean, boolean];
}

export const emptyStats = (): PlayerStats => ({
  kills: 0,
  deaths: 0,
  assists: 0,
  damage: 0,
  headshots: 0,
  shots: 0,
  hits: 0,
  openingKills: 0,
  openingDeaths: 0,
  trades: 0,
  plants: 0,
  defuses: 0,
  utilityDamage: 0,
  enemiesFlashed: 0,
  smokesThrown: 0,
  spent: 0,
  roundsSurvived: 0,
});
