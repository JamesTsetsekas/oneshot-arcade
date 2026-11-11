// network-protocol: the versioned command protocol shared by local play, replays and (future) online play.
// Clients only ever send intent (entity ids, command kind, target, queue flag, intended tick) — never transforms.
import type { Faction } from '../data/types';

export const PROTOCOL_VERSION = 1;
export const BUILD_VERSION = '0.1.0';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Controller = 'human' | 'ai' | 'passive';

export interface PlayerConfig { faction: Faction; controller: Controller; difficulty: Difficulty; name: string }
export interface MatchConfig {
  seed: number;
  mode: 'skirmish' | 'tutorial';
  players: [PlayerConfig, PlayerConfig];
}

export type Command =
  | { k: 'move'; ids: number[]; x: number; z: number; q?: boolean }
  | { k: 'amove'; ids: number[]; x: number; z: number; q?: boolean }
  | { k: 'patrol'; ids: number[]; x: number; z: number; q?: boolean }
  | { k: 'attack'; ids: number[]; target: number; q?: boolean }
  | { k: 'follow'; ids: number[]; target: number; q?: boolean }
  | { k: 'gather'; ids: number[]; target: number; q?: boolean }
  | { k: 'repair'; ids: number[]; target: number; q?: boolean }
  | { k: 'build'; ids: number[]; def: string; x: number; z: number; q?: boolean }
  | { k: 'ability'; ids: number[]; ability: string; x?: number; z?: number; target?: number; q?: boolean }
  | { k: 'stop'; ids: number[] }
  | { k: 'hold'; ids: number[] }
  | { k: 'train'; id: number; def: string }
  | { k: 'research'; id: number; tech: string }
  | { k: 'cancel'; id: number; index: number }
  | { k: 'cancelBuild'; id: number }
  | { k: 'rally'; ids: number[]; x: number; z: number; target?: number }
  | { k: 'surrender' };

export interface CommandEnvelope {
  /** protocol version */
  v: number;
  /** per-player monotonically increasing sequence number */
  seq: number;
  player: number;
  /** intended simulation tick */
  tick: number;
  cmd: Command;
}

export interface ReplayData {
  v: number;
  build: string;
  config: MatchConfig;
  commands: CommandEnvelope[];
  /** periodic state hashes: [tick, hash] */
  hashes: [number, number][];
  endTick: number;
  winner: number;
  recordedAt: string;
}

const MAX_IDS = 400;
const KINDS = new Set(['move', 'amove', 'patrol', 'attack', 'follow', 'gather', 'repair', 'build', 'ability', 'stop', 'hold', 'train', 'research', 'cancel', 'cancelBuild', 'rally', 'surrender']);

function finite(n: unknown): n is number { return typeof n === 'number' && Number.isFinite(n); }

/** Structural validation of an untrusted envelope. Semantic checks (ownership, cost, fog) happen in the simulation. */
export function validateEnvelope(e: unknown): e is CommandEnvelope {
  if (!e || typeof e !== 'object') return false;
  const env = e as CommandEnvelope;
  if (env.v !== PROTOCOL_VERSION || !Number.isInteger(env.seq) || !Number.isInteger(env.tick)) return false;
  if (env.player !== 0 && env.player !== 1) return false;
  const c = env.cmd as Record<string, unknown>;
  if (!c || typeof c !== 'object' || typeof c.k !== 'string' || !KINDS.has(c.k)) return false;
  if ('ids' in c) {
    if (!Array.isArray(c.ids) || c.ids.length > MAX_IDS || !c.ids.every((i) => Number.isInteger(i) && (i as number) >= 0)) return false;
  }
  for (const key of ['x', 'z']) if (key in c && c[key] !== undefined && !finite(c[key])) return false;
  for (const key of ['id', 'target', 'index']) if (key in c && c[key] !== undefined && !Number.isInteger(c[key])) return false;
  for (const key of ['def', 'tech', 'ability']) if (key in c && (typeof c[key] !== 'string' || (c[key] as string).length > 32)) return false;
  return true;
}

export function encodeEnvelope(e: CommandEnvelope): string { return JSON.stringify(e); }

export function decodeEnvelope(s: string): CommandEnvelope | null {
  try {
    const e = JSON.parse(s);
    return validateEnvelope(e) ? e : null;
  } catch { return null; }
}

export function encodeReplay(r: ReplayData): string { return JSON.stringify(r); }

export function decodeReplay(s: string): ReplayData | null {
  try {
    const r = JSON.parse(s) as ReplayData;
    if (!r || r.v !== PROTOCOL_VERSION || !Array.isArray(r.commands) || !Array.isArray(r.hashes) || !r.config) return null;
    if (!r.commands.every(validateEnvelope)) return null;
    return r;
  } catch { return null; }
}

/** Sanitise untrusted display text (player names, future chat). */
export function sanitizeLabel(s: unknown, max = 20): string {
  return String(s ?? '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, max) || 'Commander';
}
