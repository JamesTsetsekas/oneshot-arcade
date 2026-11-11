// server-simulation: entity and component types. The simulation is the only owner of these;
// clients see the reduced views defined in shared/protocol.ts.

import type { HeroDef, HeroId } from '../shared/heroes';
import type { InvSlot, TalentId } from '../shared/items';
import type { CampDef, StructDef } from '../shared/map';
import type { Vec } from '../shared/math';
import type { GameEvent, Team, UnitKind } from '../shared/protocol';
import type { NpcDef } from '../shared/units';
import type { World } from './world';

export interface Stats {
  maxHp: number;
  hpRegen: number;
  maxMana: number;
  manaRegen: number;
  ad: number;
  ap: number;
  as: number;
  armor: number;
  ward: number;
  speed: number;
  haste: number;
  crit: number;
  armorPen: number;
  wardPen: number;
  lifesteal: number;
  healPower: number;
  range: number;
}

export interface Effect {
  type: string;
  until: number;
  value: number;
  src: number;
  total: number;
}

export interface Shield {
  amount: number;
  until: number;
  src: number;
  oru: boolean;
}

export type DamageType = 0 | 1 | 2; // physical, arcane, pure
export const PHYS: DamageType = 0;
export const ARCANE: DamageType = 1;
export const PURE: DamageType = 2;

export interface DamageOpts {
  basic?: boolean;
  ability?: number; // slot index
  label?: string;
  crit?: boolean;
  pen?: number; // extra percent penetration
  dot?: boolean;
  castId?: number;
  noProc?: boolean;
}

export type Order =
  | { t: 'idle' }
  | { t: 'move'; x: number; y: number }
  | { t: 'attack'; id: number; auto?: boolean }
  | { t: 'amove'; x: number; y: number; tgt: number }
  | { t: 'hold' };

export interface DamageLog {
  tick: number;
  src: number;
  srcName: string;
  label: string;
  amount: number;
  type: DamageType;
  hero: boolean;
}

export interface UndoEntry {
  kind: 'buy' | 'sell';
  inv: (InvSlot | null)[];
  gold: number;
}

export interface HeroState {
  heroId: HeroId;
  def: HeroDef;
  name: string;
  bot: boolean;
  seat: number;
  level: number;
  xp: number;
  gold: number;
  goldEarned: number;
  skillPts: number;
  ranks: number[];
  cdUntil: number[]; // Q W E R D F
  cdTotal: number[];
  recast: (null | { until: number; data: Record<string, number> })[];
  talents: [TalentId, TalentId];
  inv: (InvSlot | null)[];
  itemCd: Record<string, number>;
  wardCharges: number;
  wardNextAt: number;
  order: Order;
  queuedOrder: Order | null;
  pendingCast: null | { slot: number; id: number };
  casting: null | { slot: number; until: number; fire: () => void; start: number };
  recallUntil: number;
  recallStart: number;
  respawnAt: number;
  k: number;
  d: number;
  a: number;
  cs: number;
  streak: number;
  deathStreak: number;
  dmgLog: DamageLog[];
  recap: DamageLog[] | null;
  dmgHeroes: number;
  dmgStructs: number;
  dmgTaken: number;
  healing: number;
  wardsPlaced: number;
  objectives: number;
  undo: UndoEntry[];
  p: Record<string, number>; // passive scratch
  attackCount: number;
  spawn: Vec;
  repathAt: number;
  stuckTicks: number;
  castSeq: number;
  refunded: number; // castSeq that already triggered Quiet Index
  lastSeen: [Vec, Vec];
  ai: unknown; // bot brain (server-ai)
  lastHurtByHero: number;
  lastHurtByHeroTick: number;
  leftFountainSinceBuy: boolean;
}

export interface NpcState {
  def: NpcDef;
  lane: number;
  wp: number;
  aggroId: number;
  aggroUntil: number;
  camp: CampState | null;
  home: Vec;
  resetting: boolean;
  nextSpecial: number;
  lostAt: number;
  dmgMult: number;
}

export interface StructState {
  def: StructDef;
  focusId: number;
  focusUntil: number;
  ramp: number;
  lastTarget: number;
  respawned: boolean;
  deadAt: number;
  warnAt: number;
}

export interface CampState {
  def: CampDef;
  units: number[];
  nextSpawn: number; // tick
  alive: boolean;
  aggro: number; // hero id the camp is fighting
  lastKiller: number;
}

export interface Unit {
  id: number;
  kind: UnitKind;
  sub: string;
  team: Team;
  x: number;
  y: number;
  facing: number;
  radius: number;
  alive: boolean;
  hp: number;
  mana: number;
  level: number;
  stats: Stats;
  effects: Effect[];
  shields: Shield[];
  path: Vec[] | null;
  pathI: number;
  vx: number;
  vy: number;
  dash: null | { tx: number; ty: number; speed: number; onArrive: (() => void) | null; through: boolean };
  attackTarget: number;
  windupUntil: number;
  windupTarget: number;
  attackReadyAt: number;
  lastCombat: number;
  visUntil: [number, number];
  brush: number;
  anim: number;
  animAt: number;
  animDur: number;
  vision: number;
  spawnTick: number;
  expireAt: number; // wards / decoys
  owner: number;
  disabledUntil: number;
  hero: HeroState | null;
  npc: NpcState | null;
  struct: StructState | null;
}

export interface Projectile {
  id: number;
  kind: string;
  team: Team;
  src: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  radius: number;
  homing: number; // target id or 0
  remaining: number;
  pierce: boolean;
  hits: 'enemies' | 'enemyHeroesFirst' | 'both' | 'none';
  hitIds: number[];
  terrain: boolean;
  bounce: number;
  ult: boolean;
  power: number;
  travelled: number;
  dead: boolean;
  onHit: ((p: Projectile, target: Unit) => boolean | void) | null;
  onEnd: ((p: Projectile) => void) | null;
  onStep: ((p: Projectile, px: number, py: number) => void) | null;
}

export interface Zone {
  id: number;
  kind: string;
  team: Team;
  src: number;
  shape: 'circle' | 'rect' | 'cone' | 'ring' | 'wall';
  x: number;
  y: number;
  r: number;
  w: number;
  ang: number;
  arc: number;
  start: number;
  armAt: number;
  until: number;
  armed: boolean;
  every: number;
  hostile: boolean; // dangerous to enemies of `team`
  ult: boolean;
  erasable: boolean;
  dead: boolean;
  data: Record<string, number>;
  touched: number[];
  onArm: ((z: Zone) => void) | null;
  onTick: ((z: Zone) => void) | null;
  onEnd: ((z: Zone) => void) | null;
}

export interface DynWall {
  id: number;
  team: Team;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
  hp: number;
  until: number;
  zone: number;
}

export interface Emitted {
  ev: GameEvent;
  // visibility: global, positional (must be seen by the team), or private to one hero / team
  vis: 'all' | 'pos' | 'hero' | 'team';
  x: number;
  y: number;
  hero: number;
  team: Team;
}

export interface TeamState {
  kills: number;
  towers: number;
  buffs: { id: string; until: number }[];
  wards: number[];
}

export interface AbilityCtx {
  w: World;
  h: Unit;
  slot: number;
  rank: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  ang: number;
  target: Unit | null;
  castId: number;
}

export interface AbilityImpl {
  /** extra validation; return a rejection reason or null */
  check?(c: AbilityCtx): string | null;
  /** runs when the cast time completes */
  fire(c: AbilityCtx): void;
  /** runs immediately when the cast starts (telegraphs) */
  begin?(c: AbilityCtx): void;
  /** recast handler (no cost) */
  recast?(c: AbilityCtx): void;
  /** if true, cooldown starts only when the recast window ends */
  holdsCooldown?: boolean;
}
