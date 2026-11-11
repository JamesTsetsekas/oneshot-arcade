// Shared simulation types.

export const MAX_ENTITIES = 4096;

export const Kind = {
  None: 0,
  Unit: 1,
  Structure: 2,
  Ore: 3,
  Vent: 4,
  Pylon: 5,
  Barrier: 6,
  Pod: 7,
  Spike: 8,
} as const;
export type KindT = (typeof Kind)[keyof typeof Kind];

export type Order =
  | { t: 'move'; x: number; y: number; attack: boolean; force: boolean; gc?: number }
  | { t: 'patrol'; x: number; y: number; ox: number; oy: number; gc?: number }
  | { t: 'attack'; target: number }
  | { t: 'gather'; target: number }
  | { t: 'build'; def: string; tx: number; ty: number }
  | { t: 'repair'; target: number }
  | { t: 'capture'; target: number }
  | { t: 'guard'; target: number }
  | { t: 'hold' }
  | { t: 'ability'; ability: string; x: number; y: number; target: number };

export interface QueueItem {
  kind: 'unit' | 'tech';
  def: string;
  progress: number; // ticks done
  total: number;
  started: boolean;
  paused: '' | 'supply' | 'prereq';
}

export type WorkerPhase = 'none' | 'toNode' | 'waiting' | 'mining' | 'toDrop' | 'toSite' | 'planting' | 'constructing';

/** Cold / variable-size per-entity data. Hot numeric state lives in the SoA arrays on Sim. */
export class Ext {
  orders: Order[] = [];
  // movement
  goalX = 0; goalY = 0; hasGoal = false; goalRange = 0.25; goalEntity = -1;
  fieldKey = ''; vx = 0; vy = 0;
  seedFn: (() => number[]) | null = null;
  direct = false; nearArrive = false; sidestep = 0;
  anchorX = 0; anchorY = 0; hasAnchor = false;
  engage = -1;
  bestDist = 1e9; stuckTicks = 0; repaths = 0; pathFailed = false;
  groupId = 0;
  // combat
  windup = 0; windupTarget = -1; setup = 0;
  lastDamageTick = -9999; lastAttackTick = -9999; lastAttacker = -1;
  slowUntil = 0; slowAmount = 0; silencedUntil = 0;
  energy = 0;
  abilityReady: Record<string, number> = {};
  braced = false; curled = false; toggleTicks = 0;
  shield = 0;
  speedBoostUntil = 0;
  focusTarget = -1;
  // worker
  phase: WorkerPhase = 'none';
  carry: '' | 'ore' | 'flux' = ''; carryAmount = 0;
  gatherNode = -1; phaseTicks = 0; buildSite = -1; resumeGather = -1;
  // structure
  queue: QueueItem[] = [];
  rallyX = 0; rallyY = 0; hasRally = false; rallyTarget = -1;
  builder = -1;
  cone = { x: 0, y: -1 };
  // resource nodes / extractors
  amount = 0; maxAmount = 0; miner = -1; reserved = 0; base = -1;
  // neutral objects
  captureOwner = -1; captureProgress = 0; captureBy = -1; contested = false;
  cells: number[] = [];
  // effects
  regenTicks = 0; regenPerTick = 0;
  expires = 0;
  cloaked = false;
  deathTick = 0;
}

export interface SimEvent {
  type:
    | 'spawn' | 'death' | 'shot' | 'windup' | 'impact' | 'projectile' | 'built' | 'research' | 'alert'
    | 'deposit' | 'ability' | 'zone' | 'capture' | 'pod' | 'barrier' | 'pulse' | 'heal' | 'construct' | 'queued' | 'gameover';
  id?: number;
  target?: number;
  owner?: number;
  x?: number; y?: number; x2?: number; y2?: number;
  kind?: string;
  def?: string;
  text?: string;
  value?: number;
  radius?: number;
  duration?: number;
  delay?: number;
}

export type AlertKind = 'attack' | 'built' | 'resources' | 'supply' | 'research' | 'depleted' | 'unit' | 'pylon' | 'info' | 'invalid' | 'expansion';

export interface Projectile {
  id: number;
  owner: number;
  src: number;
  target: number;
  kind: string;
  x0: number; y0: number;
  x: number; y: number;
  tx: number; ty: number;
  speed: number; // units per tick
  homing: boolean;
  traveled: number;
  total: number;
  damage: number; // pre-armor
  bonusSrcDef: string; // weapon owner def for bonus lookup
  splash: number;
  slow: number; slowTicks: number;
  overpen: boolean;
  arc: boolean;
}

export interface Zone {
  id: number;
  owner: number;
  kind: 'mend' | 'silence' | 'eruption';
  x: number; y: number; r: number;
  start: number; // tick it activates
  end: number;
  damage?: number;
  src?: number;
  srcDef?: string;
}

export interface Ghost {
  id: number; def: string; owner: number; x: number; y: number; progress: number; seenTick: number; size: number;
}

export interface PlayerStats {
  oreCollected: number; fluxCollected: number;
  unitsCreated: number; unitsLost: number; structuresBuilt: number; structuresLost: number;
  kills: number;
  samples: { tick: number; army: number; workers: number; ore: number; flux: number; supply: number }[];
  expansions: number[];
}

export interface TimelineEvent { tick: number; player: number; text: string; kind: 'econ' | 'tech' | 'combat' | 'expand' | 'end' | 'map' }
