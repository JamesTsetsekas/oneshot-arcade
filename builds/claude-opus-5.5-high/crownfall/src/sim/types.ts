// Authoritative simulation entity records. Only the simulation mutates these.
import type { HeroDef, HeroId, Stats, TalentId, DamageType } from '../shared/types';
import type { V2 } from '../shared/math';
import type { MinionKind } from '../shared/rules';
import type { CampKind, TowerTier } from '../shared/map';

export type UnitKind = 'hero' | 'minion' | 'tower' | 'seal' | 'core' | 'engine' | 'fountain' | 'monster' | 'ward' | 'wall' | 'decoy';
export type TeamId = 0 | 1 | 2;

export type EffectKind =
  | 'stun' | 'root' | 'slow' | 'silence' | 'airborne' | 'haste' | 'asBuff' | 'dr' | 'reveal' | 'grievous' | 'burn' | 'regen'
  | 'armorBuff' | 'wardBuff' | 'ghost' | 'draftMark' | 'invuln' | 'unstoppable' | 'buffForge' | 'buffSpring';

export interface Effect {
  kind: EffectKind;
  until: number;
  value: number;
  src: number;
  tag?: string;
  start?: number;
  tickAcc?: number;
  dmgType?: DamageType;
}

export interface Shield { amt: number; initial: number; until: number; src: number; fromOru: boolean }

export type OrderType = 'idle' | 'move' | 'attack' | 'attackMove' | 'hold' | 'cast';
export interface Order { type: OrderType; x?: number; y?: number; target?: number; cast?: PendingCast }

export interface PendingCast { slot: number; kind: 'ability' | 'talent' | 'item'; x?: number; y?: number; target?: number; seq: number }

export interface CastState { slot: number; kind: 'ability' | 'talent'; t: number; total: number; cmd: PendingCast; channel: boolean }

export interface Dash {
  sx: number; sy: number; ex: number; ey: number; t: number; dur: number; passWalls: boolean;
  onEnd?: () => void; airborne?: boolean; arc?: number;
}

export interface ItemStack { id: string; count: number; cd: number; data?: Record<string, number> }

export interface DamageLogEntry { src: number; t: number; amt: number; type: DamageType; source: string; srcName: string; hero: boolean }

export interface HeroState {
  def: HeroDef;
  id: HeroId;
  slot: number;
  name: string;
  bot: boolean;
  level: number;
  xp: number;
  gold: number;
  totalGold: number;
  items: (ItemStack | null)[];
  ranks: number[]; // Q W E R
  skillPoints: number;
  cds: number[]; // remaining cooldown (s) per Q W E R
  cdMax: number[];
  talents: TalentId[];
  talentCds: number[];
  wardCharges: number;
  wardRechargeT: number;
  respawnAt: number;
  k: number; d: number; a: number; cs: number;
  streak: number;
  dmgHeroes: number; dmgTaken: number; dmgStructures: number; healing: number;
  wardScore: number; objectives: number; structures: number;
  recall: { start: number; until: number } | null;
  passive: Record<string, number>;
  recast: Record<number, { until: number; data: any }>;
  undo: Array<{ kind: 'buy' | 'sell'; item: string; gold: number; consumed: ItemStack[]; slot: number; count?: number }>;
  inFountainPrev: boolean;
  skillOrder: string[];
  lastHeroDamageAt: number;
  aggroVictim: number;
  aggroAt: number;
  lastMoveX: number; lastMoveY: number;
  bounty: number;
  noteCast: number; // cast id counter
  quietRefunded: Set<number>;
  cmdTimes: number[];
  pingTimes: number[];
  chatTimes: number[];
  lastInputAt: number;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface MinionState { kind: MinionKind; lane: number; wp: number; aggroUntil: number; empoweredUntil: number }
export interface StructureState { key: string; tier: TowerTier; lane: number; atkCd: number; target: number; rampN: number; rampTarget: number; respawnAt: number; respawned: boolean }
export interface MonsterState { camp: string; kind: CampKind; homeX: number; homeY: number; leash: number; resetting: boolean; aggro: number; specialCd: number; contributors: Map<number, number> }

export interface Unit {
  id: number;
  kind: UnitKind;
  team: TeamId;
  name: string;
  x: number; y: number;
  vx: number; vy: number;
  facing: number;
  radius: number;
  hp: number;
  mana: number;
  base: Stats;
  stats: Stats;
  bonusAs: number;
  effects: Effect[];
  shields: Shield[];
  alive: boolean;
  removeAt: number;
  order: Order;
  path: V2[] | null;
  pathI: number;
  pathGoalX: number; pathGoalY: number;
  repathAt: number;
  atkTarget: number;
  atkPhase: 0 | 1 | 2; // 0 ready, 1 windup, 2 backswing
  atkTimer: number;
  atkCd: number;
  cast: CastState | null;
  dash: Dash | null;
  anim: number;
  animT: number;
  ranged: boolean;
  missileSpeed: number;
  windup: number;
  hero?: HeroState;
  minion?: MinionState;
  structure?: StructureState;
  monster?: MonsterState;
  ward?: { owner: number; until: number; disabledUntil: number; trinket: boolean };
  wall?: { owner: number; until: number };
  decoy?: { owner: number; until: number; dx: number; dy: number };
  dmgLog: DamageLogEntry[];
  ccLog: Array<{ t: number; kind: string; dur: number; src: string }>;
  lastSeen: [number, number];
  revealUntil: number;
  brush: number;
  combatUntil: number;
  heroCombatUntil: number;
  lastDamagedAt: number;
  invulnerable: boolean;
  untargetable: boolean;
  sub: string;
}

export interface Projectile {
  id: number;
  team: TeamId;
  owner: number;
  x: number; y: number;
  dx: number; dy: number;
  speed: number;
  maxDist: number;
  traveled: number;
  radius: number;
  homing: number; // target id for homing, 0 none
  pierce: boolean;
  hitAllies: boolean;
  hitSet: Set<number>;
  visual: string;
  ultimate: boolean;
  bounces: number;
  alive: boolean;
  startX: number; startY: number;
  onHit: (target: Unit, p: Projectile) => boolean; // return true to stop
  onWall?: (p: Projectile, hit: { nx: number; ny: number }) => boolean; // return true to stop
  passWalls: boolean;
  onEnd?: (p: Projectile) => void;
  filter?: (u: Unit) => boolean;
  data: Record<string, any>;
}

export type ZoneShape = { type: 'circle'; r: number } | { type: 'rect'; w: number; l: number; ang: number } | { type: 'ring'; r: number };

export interface Zone {
  id: number;
  team: TeamId;
  owner: number;
  x: number; y: number;
  shape: ZoneShape;
  start: number;
  end: number;
  visual: string;
  ultimate: boolean;
  publicTelegraph: boolean;
  hostile: boolean;
  alive: boolean;
  onTick?: (z: Zone, dt: number) => void;
  onEnd?: (z: Zone) => void;
  data: Record<string, any>;
  visionMul?: number;
}
