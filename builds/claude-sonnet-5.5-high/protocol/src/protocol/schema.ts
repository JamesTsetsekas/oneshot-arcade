// Versioned wire protocol between client and the authoritative room. Everything that crosses the boundary is a
// plain JSON-serialisable object validated here. Clients only ever send intent; the server never trusts results.

import type { UtilityId } from '../content/economy';
import type { WeaponId } from '../content/weapons';
import type { MaterialId } from '../sim/map';
import type { GameEvent, InputCmd, Phase, Side } from '../sim/types';

export const PROTOCOL_VERSION = 1;
export const SNAPSHOT_EVERY_TICKS = 3; // ~21 Hz snapshots, input at 64 Hz

export interface Hello { t: 'hello'; v: number; ruleset: string; mapHash: string; name: string }
export interface InputMsg { t: 'input'; cmd: InputCmd }
export interface PingMsg { t: 'ping'; ct: number }
export type ClientMsg = Hello | InputMsg | PingMsg;

export interface WeaponSnap {
  id: WeaponId;
  mag: number;
  reserve: number;
  reloading: boolean;
  reloadEnd: number;
  readyAt: number;
  nextFire: number;
  shots: number;
  lastShot: number;
  scope: number;
}

export interface SelfSnap {
  id: number;
  alive: boolean;
  hp: number;
  armor: number;
  helmet: boolean;
  kit: boolean;
  spike: boolean;
  money: number;
  cur: string;
  weapons: { primary: WeaponSnap | null; secondary: WeaponSnap | null; tool: WeaponSnap };
  util: UtilityId[];
  interact: { kind: 'arm' | 'defuse' | null; progress: number };
  flashUntil: number;
  flashFull: number;
  canBuy: boolean;
  /** Authoritative movement state, used for reconciliation. */
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  crouch: number;
  onGround: boolean;
  landPenalty: number;
  stepAcc: number;
  ack: number;
  hurtDir: number;
  purchases: string[];
  /** Request ids the server has processed (lets the client stop retransmitting purchases). */
  doneReqs: number[];
}

export interface PlayerSnap {
  id: number;
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  crouch: number;
  alive: boolean;
  weapon: WeaponId | 'util';
  scoped: boolean;
  swing: number;
  reloading: boolean;
  /** Visible enemy flagged because a teammate currently sees them. */
  spotted: boolean;
}

export interface RosterEntry {
  id: number;
  name: string;
  squad: 0 | 1;
  side: Side;
  alive: boolean;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  damage: number;
  plants: number;
  defuses: number;
  headshots: number;
  shots: number;
  hits: number;
  utilDamage: number;
  flashed: number;
  controller: 'human' | 'bot';
  ping: number;
  /** Team-only knowledge. */
  money?: number;
  primary?: WeaponId | null;
  secondary?: WeaponId | null;
  armor?: number;
  helmet?: boolean;
  kit?: boolean;
  util?: UtilityId[];
  hp?: number;
  spike?: boolean;
}

export interface GrenadeSnap { id: number; type: UtilityId; x: number; y: number; z: number; owner: number; landed: boolean }
export interface SmokeSnap { id: number; x: number; y: number; z: number; r: number; bloomIn: number; remaining: number }
export interface FireSnap { id: number; cells: number[]; remaining: number }
export interface DropSnap { id: number; weapon: WeaponId; x: number; y: number; z: number; mag: number }

export interface SpikeSnap {
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'exploded';
  /** Position is only present when the receiving team legally knows it. */
  pos?: { x: number; y: number; z: number };
  carrier: number;
  site: 'A' | 'B' | null;
  remaining: number;
  defuseProgress: number;
  defuseNeeded: number;
  defuser: number;
}

export interface RoundSnap {
  round: number;
  winnerSquad: 0 | 1;
  winnerSide: Side;
  reason: string;
  planted: boolean;
}

export interface Snapshot {
  tick: number;
  time: number;
  phase: Phase;
  phaseRemaining: number;
  round: number;
  score: [number, number];
  squadSide: [Side, Side];
  lossTier: [number, number];
  rules: { winRounds: number; halfRounds: number; maxRounds: number };
  self: SelfSnap;
  players: PlayerSnap[];
  /** Sent at ~2 Hz and on change; the client keeps the last roster in between. */
  roster?: RosterEntry[];
  grenades: GrenadeSnap[];
  smokes: SmokeSnap[];
  fires: FireSnap[];
  drops: DropSnap[];
  spike: SpikeSnap;
  events: GameEvent[];
  winnerSquad: 0 | 1 | -1 | null;
  /** Round history, only sent once the match has ended (for the post-match analysis). */
  rounds?: Array<{ round: number; winnerSquad: 0 | 1; winnerSide: Side; reason: string; planted: boolean; score: [number, number]; moneyBefore: [number, number]; equipValue: [number, number]; duration: number }>;
  lastRound: { winnerSquad: 0 | 1; winnerSide: Side; reason: string } | null;
}

/** Compact wire form: players are packed into number tuples. */
export type WireSnapshot = Omit<Snapshot, 'players'> & { pl: number[][] };

const WEAPON_CODES: Array<WeaponId | 'util'> = ['vela', 'rook', 'needle', 'kite', 'vectora', 'aster', 'krait', 'lumen', 'longglass', 'sable', 'rampart', 'atlas', 'tool', 'util'];

export function encodeSnapshot(s: Snapshot): WireSnapshot {
  const { players, ...rest } = s;
  const pl = players.map((p) => [
    p.id, p.pos.x, p.pos.y, p.pos.z, p.yaw, p.pitch, p.crouch,
    (p.alive ? 1 : 0) | (p.scoped ? 2 : 0) | (p.swing ? 4 : 0) | (p.reloading ? 8 : 0) | (p.spotted ? 16 : 0),
    WEAPON_CODES.indexOf(p.weapon),
  ]);
  return { ...rest, pl };
}

export function decodeSnapshot(w: WireSnapshot): Snapshot {
  const { pl, ...rest } = w;
  const players: PlayerSnap[] = pl.map((a) => ({
    id: a[0], pos: { x: a[1], y: a[2], z: a[3] }, yaw: a[4], pitch: a[5], crouch: a[6],
    alive: (a[7] & 1) !== 0, scoped: (a[7] & 2) !== 0, swing: (a[7] & 4) !== 0 ? 1 : 0, reloading: (a[7] & 8) !== 0, spotted: (a[7] & 16) !== 0,
    weapon: WEAPON_CODES[a[8]] ?? 'util',
  }));
  return { ...rest, players } as Snapshot;
}

export interface Welcome { t: 'welcome'; v: number; playerId: number; ruleset: string; mapHash: string; tickRate: number; side: Side }
export interface Reject { t: 'reject'; reason: string }
export interface SnapMsg { t: 'snap'; snap: WireSnapshot }
export interface Pong { t: 'pong'; ct: number; st: number; tick: number }
export type ServerMsg = Welcome | Reject | SnapMsg | Pong;

// ---------------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------------

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean' || v === undefined;

export function validateInput(raw: any): InputCmd | null {
  if (!raw || typeof raw !== 'object') return null;
  if (![raw.seq, raw.viewTick, raw.moveX, raw.moveZ, raw.yaw, raw.pitch].every(isNum)) return null;
  for (const k of ['fire', 'alt', 'jump', 'crouch', 'walk', 'use', 'reload', 'drop', 'quick', 'inspect']) if (!isBool(raw[k])) return null;
  const cmd: InputCmd = {
    seq: Math.floor(raw.seq), viewTick: raw.viewTick, moveX: raw.moveX, moveZ: raw.moveZ, yaw: raw.yaw, pitch: raw.pitch,
    fire: !!raw.fire, alt: !!raw.alt, jump: !!raw.jump, crouch: !!raw.crouch, walk: !!raw.walk, use: !!raw.use,
  };
  if (raw.reload) cmd.reload = true;
  if (raw.drop) cmd.drop = true;
  if (raw.quick) cmd.quick = true;
  if (raw.inspect) cmd.inspect = true;
  if (raw.select !== undefined) {
    if (typeof raw.select !== 'string' || !/^(primary|secondary|tool|next|prev|util[0-3])$/.test(raw.select)) return null;
    cmd.select = raw.select as InputCmd['select'];
  }
  for (const k of ['buy', 'refund'] as const) {
    if (raw[k] !== undefined) {
      const r = raw[k];
      if (!r || !isNum(r.req) || typeof r.item !== 'string' || r.item.length > 24) return null;
      cmd[k] = { req: Math.floor(r.req), item: r.item };
    }
  }
  return cmd;
}

export function validateClientMsg(raw: unknown): ClientMsg | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as any;
  switch (m.t) {
    case 'hello':
      if (!isNum(m.v) || typeof m.ruleset !== 'string' || typeof m.mapHash !== 'string' || typeof m.name !== 'string') return null;
      return { t: 'hello', v: m.v, ruleset: m.ruleset, mapHash: m.mapHash, name: m.name.slice(0, 16) };
    case 'input': {
      const cmd = validateInput(m.cmd);
      return cmd ? { t: 'input', cmd } : null;
    }
    case 'ping':
      return isNum(m.ct) ? { t: 'ping', ct: m.ct } : null;
    default:
      return null;
  }
}

export type MatImpact = MaterialId | 'player' | 'ground' | 'head';
