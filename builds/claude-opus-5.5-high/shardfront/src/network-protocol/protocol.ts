// Versioned command protocol. The local client, the AI, and replays all speak this protocol;
// a future authoritative server would receive exactly these messages over WebSockets.

export const PROTOCOL_VERSION = 1;
export const SIM_VERSION = 'shardfront-sim-1';
export const TICK_HZ = 20;
/** commands execute this many ticks after being issued (input delay window) */
export const INPUT_DELAY_TICKS = 2;
/** per-player command quota per second (impossible-action / spam rejection) */
export const COMMAND_QUOTA_PER_SEC = 60;

export type CommandKind =
  | 'move' | 'attackMove' | 'attack' | 'gather' | 'build' | 'train' | 'cancel' | 'research' | 'rally'
  | 'stop' | 'hold' | 'patrol' | 'guard' | 'ability' | 'repair' | 'capture' | 'surrender';

export interface Command {
  seq: number;
  /** intended simulation tick */
  tick: number;
  player: number;
  kind: CommandKind;
  ids: number[];
  x?: number;
  y?: number;
  target?: number;
  def?: string;
  queued?: boolean;
  /** Alt+right-click force move: do not auto-acquire on the way */
  force?: boolean;
  index?: number;
}

const KINDS: CommandKind[] = ['move', 'attackMove', 'attack', 'gather', 'build', 'train', 'cancel', 'research', 'rally',
  'stop', 'hold', 'patrol', 'guard', 'ability', 'repair', 'capture', 'surrender'];

/** Strict structural validation for untrusted command input (network or replay file). */
export function parseCommand(raw: unknown): Command | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const int = (v: unknown) => typeof v === 'number' && Number.isInteger(v);
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  if (!int(r.seq) || !int(r.tick) || !int(r.player)) return null;
  if (typeof r.kind !== 'string' || !KINDS.includes(r.kind as CommandKind)) return null;
  if (!Array.isArray(r.ids) || r.ids.length > 256 || !r.ids.every(int)) return null;
  if (r.x !== undefined && !num(r.x)) return null;
  if (r.y !== undefined && !num(r.y)) return null;
  if (r.target !== undefined && !int(r.target)) return null;
  if (r.def !== undefined && (typeof r.def !== 'string' || r.def.length > 40)) return null;
  if (r.index !== undefined && !int(r.index)) return null;
  const c: Command = { seq: r.seq as number, tick: r.tick as number, player: r.player as number, kind: r.kind as CommandKind, ids: (r.ids as number[]).slice() };
  if (r.x !== undefined) c.x = r.x as number;
  if (r.y !== undefined) c.y = r.y as number;
  if (r.target !== undefined) c.target = r.target as number;
  if (r.def !== undefined) c.def = r.def as string;
  if (r.queued) c.queued = true;
  if (r.force) c.force = true;
  if (r.index !== undefined) c.index = r.index as number;
  return c;
}

/** Compact array encoding used for replay storage (and a future wire format). */
export function encodeCommand(c: Command): unknown[] {
  return [c.seq, c.tick, c.player, KINDS.indexOf(c.kind), c.ids, c.x ?? null, c.y ?? null, c.target ?? null, c.def ?? null, c.queued ? 1 : 0, c.force ? 1 : 0, c.index ?? null];
}
export function decodeCommand(a: unknown): Command | null {
  if (!Array.isArray(a) || a.length !== 12) return null;
  const obj: Record<string, unknown> = { seq: a[0], tick: a[1], player: a[2], kind: KINDS[a[3] as number], ids: a[4] };
  if (a[5] !== null) obj.x = a[5];
  if (a[6] !== null) obj.y = a[6];
  if (a[7] !== null) obj.target = a[7];
  if (a[8] !== null) obj.def = a[8];
  if (a[9]) obj.queued = true;
  if (a[10]) obj.force = true;
  if (a[11] !== null) obj.index = a[11];
  return parseCommand(obj);
}

export interface MatchSetup {
  seed: number;
  map: 'glass_ravine';
  players: { faction: 'helix' | 'verdant'; ai: null | 'easy' | 'normal' | 'hard' | 'tutorial' | 'idle'; name: string }[];
  mode: 'skirmish' | 'tutorial' | 'benchmark';
}

export interface ReplayFile {
  version: number;
  simVersion: string;
  setup: MatchSetup;
  commands: unknown[][];
  hashes: [number, number][];
  endTick: number;
  winner: number;
}

/** Sanitize an untrusted player label (names, future chat). */
export function sanitizeLabel(s: string, max = 24): string {
  return String(s).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) || 'Commander';
}
