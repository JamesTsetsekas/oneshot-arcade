// Runtime entity shapes owned by the simulation.
import type { EnemyDef } from '../data/enemies';
import type { DamageType, DmgAmounts, Item, PotionKind, Vec2 } from './types';

export interface Effect {
  k: string; // slow root stun burn blight mark guard furnace cloak dodge tonic resolve blessing laststand rally ward mirror frostwake taunt haste standard
  t: number;
  mag: number;
  src?: number;
  tick?: number;
}

export interface Actor {
  id: number;
  x: number;
  z: number;
  px: number;
  pz: number;
  vx: number;
  vz: number;
  facing: number;
  r: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  effects: Effect[];
  hitFlash: number;
  freeze: number;
}

export type AIState = 'dormant' | 'investigate' | 'approach' | 'reposition' | 'telegraph' | 'execute' | 'recover' | 'flee' | 'dead';

export interface AttackRun {
  kind: string;
  t: number; // time elapsed in the telegraph/execute
  windup: number;
  tx: number;
  tz: number;
  dir: number;
  fired: boolean;
  recover: number;
  data?: Record<string, number>;
}

export interface BossState {
  id: string;
  phase: number;
  t: number; // time since fight start
  patternT: number; // timer until next pattern
  pattern: string | null;
  patternData: Record<string, number>;
  lastPatterns: string[];
  armor: number; // breakable armor meter (toll keeper) / stagger meter
  armorMax: number;
  broken: number; // seconds remaining in broken state
  engaged: boolean;
  enrage: boolean;
  conduits: number[]; // enemy ids of conduit entities
  invuln: boolean;
  variant: boolean;
  overload: number; // phase 3 overload charge 0..1
  introDone: boolean;
  staggerRace: number;
  summonT: number;
  cause: string;
}

export interface Enemy extends Actor {
  type: string;
  def: EnemyDef;
  name: string;
  level: number;
  state: AIState;
  stateT: number;
  home: Vec2;
  lastSeen: Vec2 | null;
  searchT: number;
  pack: string;
  aggro: boolean;
  elite: boolean;
  mods: string[];
  boss: boolean;
  atk: AttackRun | null;
  atkCd: number;
  slotAngle: number;
  hasSlot: boolean;
  heavyToken: boolean;
  path: Vec2[] | null;
  pathT: number;
  strafe: number;
  spawnT: number;
  tauntT: number;
  retreatT: number;
  modT: number;
  modT2: number;
  hpMax0: number;
  dmgMul: number;
  boss_state?: BossState;
  fadeT: number; // corpse fade timer
  lastDmgType: DamageType;
  neutral: boolean;
  split: boolean;
  seed: number;
  wardId: number;
  leader: number;
  noLoot: boolean;
  lungeDir: number;
  lungeT: number;
  speedMul: number;
  wake: number;
  killedBy: string;
}

export interface Player extends Actor {
  focus: number;
  maxFocus: number;
  heat: number;
  heatIdle: number;
  evadeCharges: number;
  evadeRecharge: number;
  evadeT: number;
  evadeDir: Vec2;
  cast: CastRun | null;
  queued: { slot: string; x: number; z: number; targetId: number } | null;
  path: Vec2[] | null;
  moveTarget: Vec2 | null;
  attackTarget: number;
  interactTarget: string | null;
  moving: boolean;
  speed: number;
  cds: Record<string, number>;
  charges: Record<string, number>;
  chargeT: Record<string, number>;
  potionCd: Record<string, number>;
  comboIdx: number;
  comboT: number;
  moveAcc: number;
  dash: DashRun | null;
  channel: { t: number; dur: number } | null;
  lastHitBy: string;
  lastHitType: DamageType;
  standStill: boolean;
  inCombat: number;
  regenAcc: number;
  lastStandCd: number;
  walkAnim: number;
  castSkill: string | null;
  fireAnimT: number;
  dead: boolean;
  reviveT: number;
  invalidT: number;
}

export interface CastRun {
  skill: string;
  t: number;
  wind: number;
  total: number;
  move: number;
  fired: boolean;
  aim: Vec2;
  dir: number;
  targetId: number;
  speed: number;
  combo: number;
}

export interface DashRun {
  dx: number;
  dz: number;
  t: number;
  dur: number;
  skill: string;
  hit: Set<number>;
  pullTarget?: number;
}

export interface Hazard {
  id: number;
  owner: 'player' | 'enemy' | 'env';
  shape: 'circle' | 'cone' | 'line' | 'ring';
  kind: string; // slam sweep pool beam trap zone nova blast wave preview ...
  x: number;
  z: number;
  dir: number;
  radius: number;
  arc: number;
  length: number;
  width: number;
  inner: number;
  delay: number;
  totalDelay: number;
  dur: number; // active duration after the telegraph (0 = single tick)
  interval: number;
  tickT: number;
  active: boolean;
  src: number;
  dtype: DamageType;
  dmg: DmgAmounts; // fixed amounts for enemy/env hazards
  skill?: string; // player hazards compute at hit time
  coefs?: DmgAmounts;
  tags?: string[];
  ailment?: { kind: string; chance: number; dur: number; mag: number };
  knock: number;
  color: number;
  affectsEnemies: boolean;
  affectsPlayer: boolean;
  hit: Set<number>;
  once: boolean; // each actor hit once total
  follow: number; // follow actor id (0 none)
  telegraph: boolean;
  trap?: { arm: number; root: number; slow: number };
  dead: boolean;
  slowMag: number;
  ownerLabel: string;
  noFriendly: boolean;
  heal?: number;
  blightDot?: boolean;
}

export interface Projectile {
  id: number;
  owner: 'player' | 'enemy';
  kind: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  r: number;
  life: number;
  dist: number;
  range: number;
  dtype: DamageType;
  dmg: DmgAmounts;
  skill?: string;
  coefs?: DmgAmounts;
  tags?: string[];
  pierce: number;
  hit: Set<number>;
  color: number;
  src: number;
  detonate?: number;
  mark?: boolean;
  special?: string;
  label: string;
  dead: boolean;
  homing?: number;
  ailment?: { kind: string; chance: number; dur: number; mag: number };
}

export type PickupKind = 'gold' | 'dust' | 'potion' | 'item' | 'echo' | 'globe';
export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  z: number;
  amount: number;
  potion?: PotionKind;
  item?: Item;
  age: number;
  vx: number;
  vz: number;
  magnet: boolean;
  label: string;
  dead: boolean;
}

export interface Standard {
  x: number;
  z: number;
  t: number;
  dur: number;
  r: number;
  taunt: number;
  tauntT: number;
}
