// network-protocol + shared simulation types. Commands are the only way the UI / AI / network mutate the simulation.
import type { FactionId } from '../data';

export const Ord = {
  Move: 0, AttackMove: 1, Attack: 2, Stop: 3, Hold: 4, Patrol: 5, Gather: 6, Build: 7, Repair: 8, Ability: 9, Capture: 10, Resume: 11,
} as const;
export type OrdKind = (typeof Ord)[keyof typeof Ord];

export interface Order {
  k: OrdKind;
  x: number;
  y: number;
  t: number; // target entity id (-1 none)
  p: number; // param: def index (build) / ability index
  r: number; // arrive radius
  /** patrol: second waypoint; ability phase etc. */
  a: number;
  b: number;
}

export type CmdKind = 'order' | 'train' | 'research' | 'cancel' | 'rally' | 'surrender';
export type OrderName = 'move' | 'attackMove' | 'attack' | 'stop' | 'hold' | 'patrol' | 'gather' | 'build' | 'repair' | 'capture' | 'ability';

/** versioned, serialisable command (see PROTOCOL_VERSION). */
export interface Command {
  c: CmdKind;
  player: number;
  /** simulation tick the command is intended for (0 = next tick) */
  tick?: number;
  seq?: number;
  ord?: OrderName;
  ids?: number[];
  x?: number;
  y?: number;
  target?: number;
  /** def index for build/train, upgrade index for research, ability index for ability, queue index for cancel */
  param?: number;
  queue?: boolean;
  /** alt: force move (no auto-acquire) */
  force?: boolean;
}
export const PROTOCOL_VERSION = 1;

export type EventKind =
  | 'shot' | 'hit' | 'death' | 'built' | 'trained' | 'alert' | 'ability' | 'depleted' | 'researched' | 'captured' | 'pod' | 'erupt' | 'order' | 'victory' | 'placed' | 'weld' | 'spike' | 'silence' | 'invalid';

export interface SimEvent {
  k: EventKind;
  tick: number;
  owner: number;
  x: number;
  y: number;
  /** meaning depends on kind */
  a?: number;
  b?: number;
  tx?: number;
  ty?: number;
  id?: number;
  text?: string;
  vis?: string;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  target: number; // entity id for homing, -1 for ground
  speed: number; // units / tick
  owner: number;
  src: number;
  damage: number;
  bonus: number;
  splash: number;
  slowF: number;
  slowT: number;
  visual: string;
  arc: number;
  born: number;
  total: number; // ticks of flight (for visual progress)
  def: number;
}

export interface Effect {
  kind: 'silence' | 'spike' | 'erupt' | 'weld' | 'pulse';
  owner: number;
  x: number;
  y: number;
  r: number;
  start: number; // active from
  end: number;
  target?: number;
  dmg?: number;
  born: number;
  src?: number;
  bonus?: number;
}

export interface QItem {
  kind: 'unit' | 'research';
  idx: number; // def index or upgrade index
  left: number;
  total: number;
  started: boolean;
  paused: string; // '' | 'supply' | 'requires'
}

export interface PlayerStats {
  ore: number;
  flux: number;
  created: number;
  lost: number;
  killed: number;
  structures: number;
  structuresLost: number;
  workersMax: number;
  firstExpandTick: number;
  armySamples: number[]; // every 10s
  econSamples: number[]; // cumulative ore+flux every 10s
  timeline: Array<{ tick: number; text: string; kind: string }>;
}

export interface SimConfig {
  seed: number;
  factions: [FactionId, FactionId];
  /** AI difficulty per player or null for human/remote. */
  ai: [string | null, string | null];
  mode: 'skirmish' | 'tutorial' | 'sandbox';
  /** tutorial dummy opponent: passive until told otherwise */
  passiveAi?: boolean;
  startOre?: number;
  noVictory?: boolean;
}

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
