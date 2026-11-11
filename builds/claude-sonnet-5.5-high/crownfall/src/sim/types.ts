import type { StatBlock, DamageType } from '../shared/content';
import type { StructureType } from '../shared/map';
import type { Vec } from '../shared/math';

export type Team = 0 | 1 | 2;
export type UnitKind = 'hero' | 'minion' | 'tower' | 'seal' | 'core' | 'engine' | 'monster' | 'ward' | 'decoy';
export type MinionType = 'guard' | 'bolt' | 'siege' | 'vanguard';
export type EffType =
  | 'slow' | 'stun' | 'root' | 'silence' | 'disarm' | 'airborne' | 'haste' | 'dr' | 'mod' | 'hush'
  | 'revealed' | 'guided' | 'charge' | 'bog' | 'prey' | 'prism' | 'shock' | 'regen' | 'manaRegen' | 'vision';

export interface Effect {
  type: EffType; until: number; amount: number; src: number; mods?: StatBlock; data?: number; tag?: string;
}

export interface Order {
  t: 'idle' | 'move' | 'attack' | 'amove' | 'hold' | 'castmove';
  x: number; z: number; target: number; path: Vec[]; pi: number; rp: number; slot: number;
}

export interface CastState { slot: number; endAt: number; rank: number; p: CastParams; total: number; recast: boolean }
export interface CastParams { tx: number; tz: number; dx: number; dz: number; target: number }
export interface Dash {
  sx: number; sz: number; ex: number; ez: number; t0: number; dur: number; ignoreUnits: boolean; ghost: boolean;
  onEnd?: () => void; kind: 'dash' | 'knock' | 'leap';
}

export interface ItemSlot { id: string; qty: number; cdUntil: number }
export interface Rec { until: number; fullCd: number; data?: Record<string, number> }
export interface RecapEntry { t: number; src: number; srcName: string; amount: number; type: DamageType; label: string }

export interface HeroState {
  heroId: string; slot: number; controller: 'player' | 'bot'; name: string;
  level: number; xp: number; skillPts: number; ranks: number[]; cds: number[];
  talents: [string, string]; talentCds: [number, number];
  gold: number; totalGold: number; items: (ItemSlot | null)[];
  trinketCharges: number; trinketNext: number;
  kills: number; deaths: number; assists: number; lastHits: number; monsterKills: number; damageDealt: number; damageTaken: number;
  wardsPlaced: number; wardsKilled: number; objectives: number; structures: number;
  respawnAt: number; recallStart: number; recallDur: number;
  rec: (Rec | null)[];
  undo: { itemId: string; gold: number; consumed: ItemSlot[]; slotIdx: number; goldAfter: number } | null;
  killStreak: number; deathStreak: number;
  recap: RecapEntry[];
  skillLog: string[]; buildLog: { t: number; item: string }[];
  // passive state
  pa: number; pb: number; pc: number; // generic counters used by hero passives
  markId: number; markCd: number;
  annotations: Record<number, number>;
  lastMoveDist: number; hotCharge: boolean; lastMoveX: number; lastMoveZ: number;
  refractReady: boolean; unseenSince: number; lastAttackAngle: Record<number, number>;
  lastCombatAt: number; boughtSinceFountain: boolean;
  stoneNear: number; stoneStacks: number;
  armorStacks: { until: number }[]; sunCount: number; shardCd: Record<number, number>;
  buffs: { id: string; until: number }[];
  placed: number; // ward counter
  aggroUntil: [number, number];
  deathAt: number; lastDeathPos: Vec; goldSpent: number; damageToStructures: number; visionScore: number;
  quietUsed: boolean;
}

export interface CampState {
  id: string; kind: 'small' | 'buff' | 'catalyst' | 'colossus'; hx: number; hz: number; leash: number;
  family: string; team: Team; member: number; engaged: boolean; target: number; resetUntil: number;
}

export interface Unit {
  id: number; kind: UnitKind; team: Team; name: string;
  x: number; z: number; px: number; pz: number; facing: number; pfacing: number; radius: number;
  hp: number; maxHp: number; mana: number; maxMana: number; shield: number; shieldUntil: number; shieldSrc: number;
  dead: boolean;
  ad: number; ap: number; armor: number; ward: number; as: number; ms: number; haste: number; pen: number; lifesteal: number;
  hpRegen: number; manaRegen: number; range: number; windup: number; vision: number; shieldPower: number; structDmg: number; monsterDmg: number;
  projSpeed: number;
  effects: Effect[];
  order: Order;
  atkTarget: number; atkRelease: number; atkNext: number;
  cast: CastState | null;
  dash: Dash | null;
  lastDamagedAt: number; lastCombatAt: number; lastHeroDamagedAt: number;
  damagers: Map<number, number>;
  visUntil: number[];
  revealUntil: number[];
  brush: number;
  hero?: HeroState;
  // minion
  lane: number; wp: number; mtype?: MinionType; wpath?: Vec[]; scale: number;
  // structure
  stype?: StructureType; invuln: boolean; defId?: string; ttarget: number; tramp: number; tnext: number; tlastTarget: number;
  sealRespawns: number;
  // monster
  camp?: CampState; baseMs: number;
  // generic
  gold: number; xp: number; heroAggro: Map<number, number>; lastAttackerHero: number;
  owner: number; expires: number; disabledUntil: number;
  aiBrain?: unknown;
  baseAr: number; baseWd: number; baseAd: number;
  dmgReflect: number; seenAt: number; hushed: boolean;
}

export interface Projectile {
  id: number; team: Team; owner: number; x: number; z: number; dx: number; dz: number; speed: number; radius: number;
  range: number; traveled: number; kind: 'skill' | 'basic' | 'tower'; homing: number; // target unit id for homing
  pierce: boolean; hitIds: Set<number>; hitsAllies: boolean; power: number; ult: boolean; bounces: number; tag: string;
  dmg: number; dtype: DamageType; label: string; fx: string; color: number; size: number; lifeEnd: number;
  onHit: ((p: Projectile, t: Unit) => void) | null; onEnd: ((p: Projectile) => void) | null;
  firstHeroHit: boolean; data: Record<string, number>; stopAtWall: boolean; edgeOnly: boolean;
}

export interface Zone {
  id: number; team: Team; owner: number; x: number; z: number; r: number; shape: 'circle' | 'rect'; w: number; l: number; ang: number;
  until: number; tickEvery: number; nextTick: number; power: number; ult: boolean; tag: string; fx: string; color: number; friendly: boolean;
  entered: Set<number>; onTick: ((z: Zone) => void) | null; onEnter: ((z: Zone, u: Unit) => void) | null; onEnd: ((z: Zone) => void) | null;
  hp: number; data: Record<string, number>; startAt: number;
}

export interface WallSeg { id: number; x: number; z: number; r: number; hp: number; maxHp: number; until: number; team: Team }

export interface TeamState {
  gold: number; kills: number; towers: number; buffMoveUntil: number; buffStructUntil: number; colossusUntil: number;
  wavesSpawned: number; vanguardLane: boolean[]; // vanguard spawns this team gets in lane i
  sealDown: boolean[]; structuresLost: number; lastStructureAlert: number;
}

export type CommandBody = (
  | { c: 'move'; x: number; z: number }
  | { c: 'attack'; target: number }
  | { c: 'amove'; x: number; z: number }
  | { c: 'stop' }
  | { c: 'hold' }
  | { c: 'cast'; ab: number; x: number; z: number; target: number }
  | { c: 'rank'; ab: number }
  | { c: 'talent'; idx: number; x: number; z: number }
  | { c: 'buy'; item: string }
  | { c: 'sell'; idx: number }
  | { c: 'undo' }
  | { c: 'use'; idx: number }
  | { c: 'recall' }
  | { c: 'ward'; x: number; z: number }
);
export type Command = { seq?: number; slot: number } & CommandBody;

export type SimEvent =
  | { t: 'damage'; target: number; amount: number; dtype: DamageType; src: number; crit?: boolean; shield?: boolean }
  | { t: 'heal'; target: number; amount: number }
  | { t: 'cast'; unit: number; ab: number; heroId: string; x: number; z: number; dx: number; dz: number }
  | { t: 'castStart'; unit: number; ab: number; time: number; x: number; z: number }
  | { t: 'hit'; x: number; z: number; color: number; big?: boolean; kind?: string }
  | { t: 'fx'; kind: string; x: number; z: number; r: number; color: number; dx?: number; dz?: number; dur?: number; team?: number }
  | { t: 'kill'; killer: number; victim: number; assists: number[]; gold: number; streak: number; first?: boolean }
  | { t: 'death'; unit: number }
  | { t: 'levelup'; unit: number; level: number }
  | { t: 'gold'; unit: number; amount: number; x: number; z: number }
  | { t: 'structure'; id: number; stype: string; team: number; killer: number }
  | { t: 'objective'; kind: string; team: number; text: string }
  | { t: 'announce'; text: string; team: number; priority: number; sound: string }
  | { t: 'sfx'; name: string; x: number; z: number }
  | { t: 'recall'; unit: number; done: boolean; cancelled?: boolean }
  | { t: 'ward'; unit: number; x: number; z: number; team: number }
  | { t: 'towerShot'; tower: number; target: number }
  | { t: 'victory'; team: number }
  | { t: 'buy'; unit: number; item: string }
  | { t: 'reject'; unit: number; reason: string }
  | { t: 'spawn'; unit: number }
  | { t: 'glint'; x: number; z: number; target: number };

export interface PickConfig {
  heroId: string; team: 0 | 1; controller: 'player' | 'bot'; talents: [string, string]; name?: string; lane?: number; role?: 'lane' | 'jungle' | 'support';
}
export interface SimConfig {
  seed: number; picks: PickConfig[]; difficulty: 'easy' | 'normal' | 'hard'; mode: 'match' | 'tutorial';
  enemyPassive?: boolean; startGold?: number;
}
