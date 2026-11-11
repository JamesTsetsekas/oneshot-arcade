// shared-protocol: compact binary encoding for the hot path (input commands up, snapshots down).
import { InputCmd, PlayerState, STATE_FIELDS } from '../sim/player';

// ------------------------------------------------------------------ input command (26 bytes)
export const CMD_BYTES = 26;

export function encodeCmd(c: InputCmd): ArrayBuffer {
  const buf = new ArrayBuffer(CMD_BYTES);
  const v = new DataView(buf);
  v.setUint32(0, c.seq, true);
  v.setFloat32(4, c.rt, true);
  v.setInt8(8, Math.round(Math.max(-1, Math.min(1, c.mx)) * 127));
  v.setInt8(9, Math.round(Math.max(-1, Math.min(1, c.mz)) * 127));
  v.setFloat32(10, c.yaw, true);
  v.setFloat32(14, c.pitch, true);
  v.setUint16(18, c.buttons, true);
  v.setUint8(20, c.slot);
  v.setUint8(21, c.sel);
  v.setUint32(22, 0x4252434d, true); // 'BRCM' tag doubles as a cheap schema check
  return buf;
}

export function decodeCmd(buf: ArrayBuffer): InputCmd | null {
  if (buf.byteLength !== CMD_BYTES) return null;
  const v = new DataView(buf);
  if (v.getUint32(22, true) !== 0x4252434d) return null;
  const c: InputCmd = {
    seq: v.getUint32(0, true),
    rt: v.getFloat32(4, true),
    mx: v.getInt8(8) / 127,
    mz: v.getInt8(9) / 127,
    yaw: v.getFloat32(10, true),
    pitch: v.getFloat32(14, true),
    buttons: v.getUint16(18, true),
    slot: v.getUint8(20) ? 1 : 0,
    sel: Math.min(2, v.getUint8(21)),
  };
  if (!Number.isFinite(c.yaw) || !Number.isFinite(c.pitch) || !Number.isFinite(c.rt)) return null;
  return c;
}

/** The client quantizes its own command exactly as the server will decode it, so prediction uses identical inputs. */
export function quantizeCmd(c: InputCmd): InputCmd {
  return decodeCmd(encodeCmd(c))!;
}

// ------------------------------------------------------------------ snapshot
export const PF = { ALIVE: 1, CROUCH: 2, SPRINT: 4, ADS: 8, RELOAD: 16, PROTECTED: 32, REVEALED: 64, MARKED: 128 } as const;

export interface SnapPlayer {
  id: number;
  flags: number;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  weapon: number;
  health: number;
}

export interface SnapEntity {
  id: number;
  type: number;
  team: number;
  owner: number;
  x: number; y: number; z: number;
  a: number; // yaw (0..255) or aux
  b: number; // timer / hp aux (0..255)
}

export interface SnapSelf {
  alive: boolean;
  state: PlayerState;
  health: number;
  momentum: number; // doubled units
  supports: number; // bitmask of banked support tiers
  flash: number; // seconds
  protect: boolean;
  respawnIn: number; // seconds
  revealed: boolean;
  uplink: boolean;
  tier8Busy: boolean;
  loadout: number;
  streak: number;
}

export interface Snapshot {
  tick: number;
  ack: number;
  phase: number;
  timeLeft: number;
  score0: number;
  score1: number;
  glass: number;
  self: SnapSelf;
  players: SnapPlayer[];
  entities: SnapEntity[];
}

const NF = STATE_FIELDS.length;
const HEADER = 1 + 4 + 4 + 1 + 2 + 2 + 2 + 4;
const SELF = 1 + NF * 4 + 1 + 1 + 1 + 1 + 1 + 2 + 1 + 1;
const PLAYER = 13;
const ENTITY = 13;

export function snapshotBytes(nPlayers: number, nEntities: number): number {
  return HEADER + SELF + 1 + nPlayers * PLAYER + 1 + nEntities * ENTITY;
}

const q16 = (v: number): number => Math.max(-32767, Math.min(32767, Math.round(v * 100)));

export function encodeSnapshot(s: Snapshot): ArrayBuffer {
  const buf = new ArrayBuffer(snapshotBytes(s.players.length, s.entities.length));
  const v = new DataView(buf);
  let o = 0;
  v.setUint8(o, 0x53); o += 1;
  v.setUint32(o, s.tick, true); o += 4;
  v.setUint32(o, s.ack, true); o += 4;
  v.setUint8(o, s.phase); o += 1;
  v.setUint16(o, Math.max(0, Math.min(65535, Math.round(s.timeLeft * 10))), true); o += 2;
  v.setUint16(o, s.score0, true); o += 2;
  v.setUint16(o, s.score1, true); o += 2;
  v.setUint32(o, s.glass >>> 0, true); o += 4;
  const me = s.self;
  v.setUint8(o, (me.alive ? 1 : 0) | (me.protect ? 2 : 0) | (me.revealed ? 4 : 0) | (me.uplink ? 8 : 0) | (me.tier8Busy ? 16 : 0)); o += 1;
  for (let i = 0; i < NF; i++) { v.setFloat32(o, me.state[STATE_FIELDS[i]], true); o += 4; }
  v.setUint8(o, Math.max(0, Math.min(255, Math.ceil(me.health)))); o += 1;
  v.setUint8(o, Math.min(255, me.momentum)); o += 1;
  v.setUint8(o, me.supports); o += 1;
  v.setUint8(o, Math.max(0, Math.min(255, Math.round(me.flash * 40)))); o += 1;
  v.setUint8(o, me.loadout); o += 1;
  v.setUint16(o, Math.max(0, Math.min(65535, Math.round(me.respawnIn * 100))), true); o += 2;
  v.setUint8(o, Math.min(255, me.streak)); o += 1;
  v.setUint8(o, 0); o += 1;
  v.setUint8(o, s.players.length); o += 1;
  for (const p of s.players) {
    v.setUint8(o, p.id); o += 1;
    v.setUint8(o, p.flags); o += 1;
    v.setInt16(o, q16(p.x), true); o += 2;
    v.setInt16(o, q16(p.y), true); o += 2;
    v.setInt16(o, q16(p.z), true); o += 2;
    v.setUint16(o, Math.round((((p.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (65535 / (Math.PI * 2))), true); o += 2;
    v.setInt8(o, Math.round(Math.max(-1.57, Math.min(1.57, p.pitch)) * 80)); o += 1;
    v.setUint8(o, p.weapon); o += 1;
    v.setUint8(o, Math.max(0, Math.min(255, Math.ceil(p.health)))); o += 1;
  }
  v.setUint8(o, s.entities.length); o += 1;
  for (const e of s.entities) {
    v.setUint16(o, e.id & 0xffff, true); o += 2;
    v.setUint8(o, e.type); o += 1;
    v.setUint8(o, (e.team & 3) | ((e.owner & 31) << 2)); o += 1;
    v.setInt16(o, q16(e.x), true); o += 2;
    v.setInt16(o, q16(e.y), true); o += 2;
    v.setInt16(o, q16(e.z), true); o += 2;
    v.setUint8(o, e.a & 255); o += 1;
    v.setUint8(o, e.b & 255); o += 1;
    v.setUint8(o, 0); o += 1;
  }
  return buf;
}

export function decodeSnapshot(buf: ArrayBuffer): Snapshot | null {
  if (buf.byteLength < HEADER + SELF + 2) return null;
  const v = new DataView(buf);
  let o = 0;
  if (v.getUint8(o) !== 0x53) return null; o += 1;
  const tick = v.getUint32(o, true); o += 4;
  const ack = v.getUint32(o, true); o += 4;
  const phase = v.getUint8(o); o += 1;
  const timeLeft = v.getUint16(o, true) / 10; o += 2;
  const score0 = v.getUint16(o, true); o += 2;
  const score1 = v.getUint16(o, true); o += 2;
  const glass = v.getUint32(o, true); o += 4;
  const sf = v.getUint8(o); o += 1;
  const state = {} as PlayerState;
  for (let i = 0; i < NF; i++) { state[STATE_FIELDS[i]] = v.getFloat32(o, true); o += 4; }
  const health = v.getUint8(o); o += 1;
  const momentum = v.getUint8(o); o += 1;
  const supports = v.getUint8(o); o += 1;
  const flash = v.getUint8(o) / 40; o += 1;
  const loadout = v.getUint8(o); o += 1;
  const respawnIn = v.getUint16(o, true) / 100; o += 2;
  const streak = v.getUint8(o); o += 1;
  o += 1;
  const np = v.getUint8(o); o += 1;
  if (buf.byteLength < o + np * PLAYER + 1) return null;
  const players: SnapPlayer[] = [];
  for (let i = 0; i < np; i++) {
    const id = v.getUint8(o); o += 1;
    const flags = v.getUint8(o); o += 1;
    const x = v.getInt16(o, true) / 100; o += 2;
    const y = v.getInt16(o, true) / 100; o += 2;
    const z = v.getInt16(o, true) / 100; o += 2;
    const yaw = v.getUint16(o, true) * ((Math.PI * 2) / 65535); o += 2;
    const pitch = v.getInt8(o) / 80; o += 1;
    const weapon = v.getUint8(o); o += 1;
    const hp = v.getUint8(o); o += 1;
    players.push({ id, flags, x, y, z, yaw, pitch, weapon, health: hp });
  }
  const ne = v.getUint8(o); o += 1;
  if (buf.byteLength < o + ne * ENTITY) return null;
  const entities: SnapEntity[] = [];
  for (let i = 0; i < ne; i++) {
    const id = v.getUint16(o, true); o += 2;
    const type = v.getUint8(o); o += 1;
    const to = v.getUint8(o); o += 1;
    const x = v.getInt16(o, true) / 100; o += 2;
    const y = v.getInt16(o, true) / 100; o += 2;
    const z = v.getInt16(o, true) / 100; o += 2;
    const a = v.getUint8(o); o += 1;
    const b = v.getUint8(o); o += 1;
    o += 1;
    entities.push({ id, type, team: to & 3, owner: to >> 2, x, y, z, a, b });
  }
  return {
    tick, ack, phase, timeLeft, score0, score1, glass,
    self: { alive: (sf & 1) !== 0, protect: (sf & 2) !== 0, revealed: (sf & 4) !== 0, uplink: (sf & 8) !== 0, tier8Busy: (sf & 16) !== 0, state, health, momentum, supports, flash, loadout, respawnIn, streak },
    players, entities,
  };
}
