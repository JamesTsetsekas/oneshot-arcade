// Authoritative (server-private) simulation state.
import type { UtilityId } from '../content/rules';
import { DEFAULT_SIDEARM, WEAPONS, type WeaponDef, type WeaponId } from '../content/weapons';
import type { BuyItem, GameEvent, MoveState, PlayerStats, Side, SlotKind } from '../protocol/types';
import { newMoveState } from './movement';

export interface WeaponInst {
  uid: number;
  id: WeaponId;
  ammo: number;
  reserve: number;
  fired: boolean;
}

export interface Purchase {
  item: BuyItem;
  price: number;
  uid: number;
  /** armor state before the purchase, for refunds */
  prevArmor?: number;
  prevHelmet?: boolean;
}

export interface Player {
  id: number;
  name: string;
  team: number;
  bot: boolean;
  alive: boolean;
  hp: number;
  armor: number;
  helmet: boolean;
  kit: boolean;
  hasSpike: boolean;
  move: MoveState;
  yaw: number;
  pitch: number;
  money: number;
  primary: WeaponInst | null;
  sidearm: WeaponInst | null;
  util: UtilityId[];
  slot: SlotKind;
  utilSel: number;
  lastSlot: SlotKind;
  nextFire: number;
  fireBuffer: number;
  reloadStart: number;
  reloadEnd: number;
  drawEnd: number;
  recoilIdx: number;
  lastShot: number;
  heat: number;
  shotSeq: number;
  burstLeft: number;
  nextBurst: number;
  scope: number;
  prevButtons: number;
  plantT: number;
  defuseT: number;
  blindUntil: number;
  stepDist: number;
  armorHit: boolean;
  purchases: Purchase[];
  seenReq: Set<number>;
  ready: boolean;
  spectate: number;
  survived: boolean;
  diedAt: number;
  roundKills: number;
  roundDamage: number;
  damageFrom: Map<number, { dmg: number; time: number }>;
  stats: PlayerStats;
  /** lag-compensation render tick supplied with the latest input */
  renderTick: number;
}

export interface TeamState {
  score: number;
  lossStreak: number;
  side: Side;
}

export interface Grenade {
  id: number;
  type: UtilityId;
  owner: number;
  team: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  born: number;
  rest: boolean;
  bounces: number;
}

export interface Veil {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
  start: number; // seconds
  end: number;
  startTick: number;
  endTick: number;
}

export interface FireArea {
  id: number;
  owner: number;
  team: number;
  cells: number[];
  end: number;
  endTick: number;
  nextBurn: number;
}

export interface Shard {
  id: number;
  owner: number;
  team: number;
  x: number;
  y: number;
  z: number;
  hp: number;
  pulses: number[]; // remaining pulse times
  n: number;
}

export interface DroppedItem {
  uid: number;
  kind: 'weapon' | 'spike';
  inst: WeaponInst | null;
  x: number;
  y: number;
  z: number;
  yaw: number;
  by: number;
  time: number;
}

export interface SpikeState {
  state: 'carried' | 'dropped' | 'armed' | 'disarmed' | 'detonated';
  carrier: number;
  x: number;
  y: number;
  z: number;
  site: '' | 'A' | 'B';
  armedAt: number;
  armedTick: number;
  defuser: number;
  planter: number;
}

export interface Noise {
  x: number;
  y: number;
  z: number;
  id: number;
  team: number;
  kind: string;
  radius: number;
}

export interface QueuedEvent {
  ev: GameEvent;
  /** -1 = everyone */
  to: number;
  /** -1 = any team */
  team: number;
  /** audible radius; 0 = unlimited */
  radius: number;
  x: number;
  z: number;
}

let uidCounter = 1;
export function resetUids(): void {
  uidCounter = 1;
}
export function newWeapon(id: WeaponId, uid: number): WeaponInst {
  const d = WEAPONS[id];
  return { uid, id, ammo: d.mag, reserve: d.reserve, fired: false };
}

export function newStats(id: number, name: string, team: number, bot: boolean): PlayerStats {
  return {
    id,
    name,
    team,
    bot,
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
    utilDamage: 0,
    flashed: 0,
    spent: 0,
  };
}

export function newPlayer(id: number, name: string, team: number, bot: boolean, money: number): Player {
  return {
    id,
    name,
    team,
    bot,
    alive: false,
    hp: 100,
    armor: 0,
    helmet: false,
    kit: false,
    hasSpike: false,
    move: newMoveState(),
    yaw: 0,
    pitch: 0,
    money,
    primary: null,
    sidearm: null,
    util: [],
    slot: 'sidearm',
    utilSel: 0,
    lastSlot: 'tool',
    nextFire: 0,
    fireBuffer: -1,
    reloadStart: 0,
    reloadEnd: 0,
    drawEnd: 0,
    recoilIdx: 0,
    lastShot: -10,
    heat: 0,
    shotSeq: 0,
    burstLeft: 0,
    nextBurst: 0,
    scope: 0,
    prevButtons: 0,
    plantT: 0,
    defuseT: 0,
    blindUntil: 0,
    stepDist: 0,
    armorHit: false,
    purchases: [],
    seenReq: new Set(),
    ready: false,
    spectate: -1,
    survived: false,
    diedAt: 0,
    roundKills: 0,
    roundDamage: 0,
    damageFrom: new Map(),
    stats: newStats(id, name, team, bot),
    renderTick: 0,
  };
}

export function activeWeapon(p: Player): WeaponInst | null {
  return p.slot === 'primary' ? p.primary : p.slot === 'sidearm' ? p.sidearm : null;
}

export function activeDef(p: Player): WeaponDef {
  const w = activeWeapon(p);
  return w ? WEAPONS[w.id] : WEAPONS.tool;
}

/** Name of the item in hand, for third-person models and the HUD. */
export function heldItem(p: Player): string {
  if (p.slot === 'util') return p.util[p.utilSel] ?? 'tool';
  const w = activeWeapon(p);
  return w ? w.id : 'tool';
}

export function carrySpeed(p: Player): number {
  if (p.slot === 'util') return 5.3;
  const d = activeDef(p);
  let s = d.moveSpeed;
  if (p.scope > 0 && d.scope) s *= d.scope.speedMul;
  return s;
}

export function equipValue(p: Player): number {
  let v = 0;
  if (p.primary) v += WEAPONS[p.primary.id].price;
  if (p.sidearm && p.sidearm.id !== DEFAULT_SIDEARM) v += WEAPONS[p.sidearm.id].price;
  if (p.armor > 0) v += p.helmet ? 1000 : 650;
  if (p.kit) v += 400;
  v += p.util.length * 300;
  return v;
}
