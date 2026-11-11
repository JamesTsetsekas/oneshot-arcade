// protocol: everything that crosses the client <-> authoritative-simulation boundary.
// The client only ever sends Commands (intent) and only ever receives team-filtered Snapshots.

import type { HeroId } from './heroes';
import type { InvSlot, TalentId } from './items';

export type Team = 0 | 1 | 2; // 2 = neutral
export type UnitKind = 'hero' | 'minion' | 'monster' | 'tower' | 'seal' | 'core' | 'engine' | 'ward' | 'decoy';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type MatchMode = 'unranked' | 'practice' | 'tutorial';

export interface SeatConfig {
  hero: HeroId;
  team: 0 | 1;
  bot: boolean;
  name: string;
  talents: [TalentId, TalentId];
}

export interface MatchConfig {
  seed: number;
  mode: MatchMode;
  difficulty: Difficulty;
  pace: 'quick' | 'standard';
  seats: SeatConfig[];
  humanSeat: number; // index into seats, -1 for headless bot matches
}

// ---- Commands (client -> server) ----------------------------------------------------------

export type Command =
  | { t: 'move'; x: number; y: number }
  | { t: 'attack'; id: number }
  | { t: 'amove'; x: number; y: number }
  | { t: 'stop' }
  | { t: 'hold' }
  | { t: 'cast'; slot: number; x: number; y: number; id?: number } // 0-3 abilities, 4-5 talents
  | { t: 'rank'; slot: number }
  | { t: 'item'; slot: number; x: number; y: number }
  | { t: 'ward'; x: number; y: number }
  | { t: 'recall' }
  | { t: 'buy'; item: string }
  | { t: 'sell'; slot: number }
  | { t: 'undo' }
  | { t: 'ping'; kind: PingKind; x: number; y: number }
  | { t: 'cheat'; kind: 'gold' | 'level' | 'refresh' | 'heal' };

export type PingKind = 'danger' | 'omw' | 'assist' | 'missing' | 'defend' | 'objective';

export interface SequencedCommand {
  seq: number;
  cmd: Command;
}

// ---- Status bits ----------------------------------------------------------------------------

export const ST = {
  STUN: 1,
  ROOT: 2,
  SLOW: 4,
  SILENCE: 8,
  AIRBORNE: 16,
  RECALL: 32,
  INVULN: 64,
  REVEALED: 128,
  HASTED: 256,
  GLINT: 512,
  PARCEL: 1024,
  MARKED: 2048,
  EMPOWERED: 4096,
  IN_BRUSH: 8192,
  DISABLED: 16384,
  HARDENED: 32768,
  CHANNEL: 65536,
  BLIND: 131072,
} as const;

export const ANIM = { idle: 0, run: 1, attack: 2, cast0: 3, cast1: 4, cast2: 5, cast3: 6, recall: 7, dash: 8 } as const;

// ---- Views (server -> client) ---------------------------------------------------------------

export interface UnitView {
  id: number;
  k: UnitKind;
  s: string; // hero id / minion type / monster type / structure tier
  t: Team;
  x: number;
  y: number;
  f: number;
  r: number;
  hp: number;
  mhp: number;
  sh: number;
  mp: number;
  mmp: number;
  lvl: number;
  st: number;
  an: number;
  at: number;
  ad: number;
  tg: number; // attack target id (towers: beam / warning)
  rp: number; // tower damage ramp 0..4
  dead?: boolean; // destroyed structure (rubble)
  nm?: string;
}

export interface ProjView {
  id: number;
  kind: string;
  t: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export interface ZoneView {
  id: number;
  kind: string;
  t: Team;
  shape: 'circle' | 'rect' | 'cone' | 'ring' | 'wall';
  x: number;
  y: number;
  r: number; // radius or length
  w: number; // width (rect) / inner radius (ring)
  ang: number;
  arc: number; // half-arc for cones (radians)
  t0: number; // created tick
  t1: number; // armed tick (telegraph ends)
  t2: number; // removed tick
  danger: boolean; // harmful to the viewing team
}

export interface HeroPublic {
  id: number;
  hero: HeroId;
  name: string;
  team: 0 | 1;
  bot: boolean;
  lvl: number;
  k: number;
  d: number;
  a: number;
  cs: number;
  items: string[];
  alive: boolean;
  respawn: number; // seconds remaining
  bounty: number;
  wards: number;
  dmg: number;
  sdmg: number;
  taken: number;
  heal: number;
  gold: number; // total gold earned
  obj: number;
  visible: boolean;
  x: number; // last known (only updated while visible)
  y: number;
  hpPct: number;
}

export interface SelfView {
  id: number;
  gold: number;
  xp: number;
  xpPrev: number;
  xpNext: number;
  lvl: number;
  skillPts: number;
  ranks: number[];
  cds: number[]; // seconds remaining for Q W E R D F
  cdMax: number[];
  recast: boolean[];
  talents: TalentId[];
  inv: (InvSlot | null)[];
  itemCds: number[];
  wardCharges: number;
  wardCd: number;
  wardsMax: number;
  stats: Record<string, number>;
  buffs: { id: string; left: number; total: number; n: number }[];
  inFountain: boolean;
  canUndo: boolean;
  recall: number; // seconds left, 0 if not recalling
  recallTotal: number;
  alive: boolean;
  respawn: number;
  orderTarget: number;
  recap: RecapEntry[] | null;
  passive: number; // 0..1 passive meter (hero specific)
  passiveN: number;
}

export interface RecapEntry {
  src: string;
  label: string;
  amount: number;
  type: 0 | 1 | 2;
}

export interface TeamView {
  kills: number;
  towers: number; // towers destroyed by this team
  gold: number;
  buffs: { id: string; left: number }[];
}

export interface ObjectiveView {
  id: string;
  alive: boolean;
  next: number; // seconds until spawn (0 when alive)
  hpPct: number;
}

export type GameEvent =
  | { e: 'dmg'; id: number; x: number; y: number; a: number; ty: 0 | 1 | 2; crit?: boolean; self?: boolean }
  | { e: 'heal'; id: number; x: number; y: number; a: number }
  | { e: 'gold'; x: number; y: number; a: number }
  | { e: 'death'; id: number; k: UnitKind; s: string; t: Team; x: number; y: number }
  | { e: 'kill'; victim: number; killer: number; assists: number[]; gold: number; first?: boolean }
  | { e: 'fx'; fx: string; x: number; y: number; x2?: number; y2?: number; r?: number; ang?: number; t?: Team; id?: number; c?: number }
  | { e: 'atk'; id: number; tgt: number; k: UnitKind; s: string; x: number; y: number }
  | { e: 'cast'; id: number; slot: number; hero: HeroId; x: number; y: number; name: string }
  | { e: 'announce'; msg: string; kind: string; team: Team; good?: boolean }
  | { e: 'level'; id: number; lvl: number; x: number; y: number }
  | { e: 'reject'; reason: string }
  | { e: 'ping'; kind: PingKind; x: number; y: number; by: string }
  | { e: 'timeline'; time: number; msg: string; team: Team }
  | { e: 'bought'; item: string }
  | { e: 'tut'; step: string };

export interface Snapshot {
  tick: number;
  time: number; // seconds
  units: UnitView[];
  projs: ProjView[];
  zones: ZoneView[];
  events: GameEvent[];
  heroes: HeroPublic[];
  you: SelfView | null;
  teams: [TeamView, TeamView];
  objectives: ObjectiveView[];
  vision: number[]; // flat [x, y, radius] triples for the viewing team's sight sources
  over: null | { winner: 0 | 1; duration: number };
  paused: boolean;
  timeScale: number;
}

// ---- Transport messages (worker boundary) ---------------------------------------------------

export type ToServer =
  | { m: 'init'; config: MatchConfig }
  | { m: 'cmd'; seq: number; cmd: Command }
  | { m: 'pause'; paused: boolean }
  | { m: 'timescale'; scale: number }
  | { m: 'stop' };

export type ToClient = { m: 'ready' } | { m: 'snap'; snap: Snapshot; ack: number } | { m: 'error'; message: string };
