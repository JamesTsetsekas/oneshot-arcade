// Authoritative room: owns the Match, validates every client message, applies message quotas, and builds
// interest-filtered snapshots. Clients never receive the transform of an enemy that their team cannot legally see.

import { MOVEMENT as M, RULESET_VERSION } from '../content/economy';
import { WEAPONS } from '../content/weapons';
import {
  ClientMsg, DropSnap, FireSnap, GrenadeSnap, PROTOCOL_VERSION, PlayerSnap, RosterEntry, SNAPSHOT_EVERY_TICKS, ServerMsg, SmokeSnap, SpikeSnap,
  Snapshot, WeaponSnap, encodeSnapshot, validateClientMsg,
} from '../protocol/schema';
import { lineOfSight } from '../sim/collision';
import { MAP_HASH } from '../sim/map';
import { Match, TICK_RATE } from '../sim/match';
import { eyeHeight, horizontalSpeed } from '../sim/movement';
import type { GameEvent, Player, Side, WeaponState } from '../sim/types';
import { Endpoint } from './link';

const q = (v: number): number => Math.round(v * 64) / 64;

interface ClientSlot {
  playerId: number;
  end: Endpoint;
  welcomed: boolean;
  msgWindow: number;
  msgCount: number;
  rejected: number;
  spotted: Map<number, number>;
  lastSnapTick: number;
}

export interface RoomStats {
  snapshots: number;
  snapshotBytes: number[];
  inputsAccepted: number;
  inputsRejected: number;
  quotaDrops: number;
}

export class ServerRoom {
  match: Match;
  clients = new Map<number, ClientSlot>();
  pending: GameEvent[] = [];
  stats: RoomStats = { snapshots: 0, snapshotBytes: [], inputsAccepted: 0, inputsRejected: 0, quotaDrops: 0 };
  /** Max messages per client per second (hard quota against flooding). */
  quota = 260;

  constructor(match: Match) { this.match = match; }

  addClient(playerId: number, end: Endpoint): void {
    // Seat ownership: one session per seat. A second connection replaces the first (abandoned clients cannot double-control).
    const prev = this.clients.get(playerId);
    if (prev) prev.end.close?.();
    this.clients.set(playerId, { playerId, end, welcomed: false, msgWindow: 0, msgCount: 0, rejected: 0, spotted: new Map(), lastSnapTick: -1 });
  }

  removeClient(playerId: number): void { this.clients.delete(playerId); }

  private handleMessage(c: ClientSlot, raw: unknown): void {
    const m: ClientMsg | null = validateClientMsg(raw);
    if (!m) { c.rejected++; this.stats.inputsRejected++; return; }
    switch (m.t) {
      case 'hello':
        if (m.v !== PROTOCOL_VERSION) { c.end.send({ t: 'reject', reason: 'version mismatch' } satisfies ServerMsg); return; }
        if (m.mapHash !== MAP_HASH) { c.end.send({ t: 'reject', reason: 'map checksum mismatch' }); return; }
        if (m.ruleset !== RULESET_VERSION) { c.end.send({ t: 'reject', reason: 'ruleset mismatch' }); return; }
        c.welcomed = true;
        this.match.players[c.playerId].name = m.name || this.match.players[c.playerId].name;
        c.end.send({ t: 'welcome', v: PROTOCOL_VERSION, playerId: c.playerId, ruleset: RULESET_VERSION, mapHash: MAP_HASH, tickRate: TICK_RATE, side: this.match.players[c.playerId].side });
        break;
      case 'input':
        if (!c.welcomed) return;
        if (this.match.submitInput(c.playerId, m.cmd)) this.stats.inputsAccepted++; else this.stats.inputsRejected++;
        break;
      case 'ping':
        c.end.send({ t: 'pong', ct: m.ct, st: this.match.time, tick: this.match.tick });
        break;
    }
  }

  /** Advance the room by exactly one simulation tick. */
  step(): void {
    const m = this.match;
    const sec = Math.floor(m.tick / TICK_RATE);
    for (const c of this.clients.values()) {
      if (c.msgWindow !== sec) { c.msgWindow = sec; c.msgCount = 0; }
      for (const raw of c.end.recv()) {
        c.msgCount++;
        if (c.msgCount > this.quota) { this.stats.quotaDrops++; continue; }
        this.handleMessage(c, raw);
      }
    }
    m.step();
    for (const e of m.events) this.pending.push(e);
    if (m.tick % SNAPSHOT_EVERY_TICKS === 0) {
      for (const c of this.clients.values()) {
        if (!c.welcomed) continue;
        const snap = this.buildSnapshot(c);
        const msg: ServerMsg = { t: 'snap', snap: encodeSnapshot(snap) };
        c.end.send(msg);
        this.stats.snapshots++;
      }
      this.pending = [];
    }
  }

  // ------------------------------------------------------------------ snapshot building
  private weaponSnap(w: WeaponState): WeaponSnap {
    return { id: w.id, mag: w.mag, reserve: w.reserve, reloading: w.reloading, reloadEnd: w.reloadEnd, readyAt: w.readyAt, nextFire: w.nextFire, shots: w.shots, lastShot: w.lastShot, scope: w.scopeLevel };
  }

  /** Enemies this viewer's team can currently see (any living teammate has line of sight, smoke-aware). */
  spottedEnemies(c: ClientSlot, viewer: Player): Set<number> {
    const m = this.match;
    const out = new Set<number>();
    const mates = m.players.filter((p) => p.side === viewer.side && p.alive);
    for (const e of m.players) {
      if (e.side === viewer.side || !e.alive) continue;
      const head = { x: e.pos.x, y: e.pos.y + eyeHeight(e.crouch) - 0.05, z: e.pos.z };
      const chest = { x: e.pos.x, y: e.pos.y + 1.0, z: e.pos.z };
      let seen = false;
      for (const t of mates) {
        const eye = m.eyePos(t);
        if (Math.hypot(e.pos.x - t.pos.x, e.pos.z - t.pos.z) > 90) continue;
        if ((lineOfSight(eye, head) || lineOfSight(eye, chest)) && !m.isSmoked(eye, chest)) { seen = true; break; }
      }
      if (seen) c.spotted.set(e.id, m.time);
      const last = c.spotted.get(e.id);
      if (last !== undefined && m.time - last < 0.28) out.add(e.id);
    }
    return out;
  }

  private audible(e: GameEvent, viewer: Player, sameSideId: (id: number) => boolean): boolean {
    const m = this.match;
    const d = (p: { x: number; z: number }) => Math.hypot(p.x - viewer.pos.x, p.z - viewer.pos.z);
    switch (e.t) {
      case 'phase': case 'roundEnd': case 'kill': case 'info': return true;
      case 'econ': case 'buy': return e.id === viewer.id;
      case 'hit': return e.shooter === viewer.id || (!viewer.alive && sameSideId(e.shooter));
      case 'hurt': return e.victim === viewer.id;
      case 'shot': return e.id === viewer.id || sameSideId(e.id) || d(e.o) < 75;
      case 'impact': return d(e.p) < 45;
      case 'step': return e.id === viewer.id || sameSideId(e.id) || d(e.p) < 4 + 28 * e.loud;
      case 'sfx': return e.id === viewer.id || sameSideId(e.id) || d(e.p) < (e.kind === 'throw' || e.kind === 'drop' ? 22 : 14);
      case 'nade':
        if (e.kind === 'pulsePing') return e.side === viewer.side;
        if (e.kind === 'flash' || e.kind === 'frag' || e.kind === 'veil' || e.kind === 'thermite') return d(e.p) < 60 || e.side === viewer.side;
        return d(e.p) < 32 || e.side === viewer.side;
      case 'spike':
        if (e.kind === 'planted' || e.kind === 'defused' || e.kind === 'explode') return true;
        if (e.kind === 'beep') return d(e.p) < 70;
        if (viewer.side === 'int' && (e.kind === 'pickup' || e.kind === 'drop')) return true;
        return d(e.p) < 25;
    }
    return false;
  }

  buildSnapshot(c: ClientSlot, full = false): Snapshot {
    const m = this.match;
    const viewer = m.players[c.playerId];
    const spotted = this.spottedEnemies(c, viewer);
    const sameSideId = (id: number) => m.players[id]?.side === viewer.side;
    const players: PlayerSnap[] = [];
    for (const p of m.players) {
      const mate = p.side === viewer.side;
      if (!mate && !spotted.has(p.id)) continue;
      if (!p.alive && !mate) continue;
      const held = m.heldWeapon(p);
      players.push({
        id: p.id, pos: { x: q(p.pos.x), y: q(p.pos.y), z: q(p.pos.z) }, yaw: Math.round(p.yaw * 100) / 100, pitch: Math.round(p.pitch * 100) / 100,
        crouch: Math.round(p.crouch * 4) / 4, alive: p.alive, weapon: held ? held.id : 'util', scoped: !!held && held.scopeLevel > 0, swing: p.swing > 0 && m.time - p.swing < 0.6 ? 1 : 0,
        reloading: !!held && held.reloading, spotted: !mate,
      });
    }
    const rosterDue = full || m.tick % 32 === 0 || this.pending.some((e) => e.t === 'kill' || e.t === 'phase' || e.t === 'roundEnd' || (e.t === 'buy' && e.id === viewer.id) || (e.t === 'econ' && e.id === viewer.id)) || c.lastSnapTick < 0;
    c.lastSnapTick = m.tick;
    const roster: RosterEntry[] | undefined = !rosterDue ? undefined : m.players.map((p) => {
      const mate = p.side === viewer.side;
      const r: RosterEntry = {
        id: p.id, name: p.name, squad: p.squad, side: p.side, alive: p.alive, kills: p.stats.kills, deaths: p.stats.deaths, assists: p.stats.assists,
        score: p.stats.score, damage: Math.round(p.stats.damage), plants: p.stats.plants, defuses: p.stats.defuses, headshots: p.stats.headshots,
        shots: p.stats.shots, hits: p.stats.hits, utilDamage: Math.round(p.stats.utilDamage), flashed: p.stats.flashed, controller: p.controller, ping: p.ping,
      };
      if (mate) {
        r.money = p.money; r.primary = p.slots.primary?.id ?? null; r.secondary = p.slots.secondary?.id ?? null; r.armor = p.armor; r.helmet = p.helmet;
        r.kit = p.kit; r.util = [...p.util]; r.hp = p.hp; r.spike = p.spike;
      }
      return r;
    });

    const mates = m.players.filter((p) => p.side === viewer.side && p.alive);
    const seenByTeam = (pt: { x: number; y: number; z: number }) => mates.some((t) => lineOfSight(m.eyePos(t), { x: pt.x, y: pt.y + 0.3, z: pt.z }));

    const grenades: GrenadeSnap[] = [];
    for (const g of m.grenades) {
      if (g.side === viewer.side || seenByTeam(g.pos)) grenades.push({ id: g.id, type: g.type, x: q(g.pos.x), y: q(g.pos.y), z: q(g.pos.z), owner: g.owner, landed: g.landed });
    }
    const smokes: SmokeSnap[] = m.smokes.map((s) => ({ id: s.id, x: q(s.pos.x), y: q(s.pos.y), z: q(s.pos.z), r: s.radius, bloomIn: Math.max(0, s.bloomAt - m.time), remaining: Math.max(0, s.until - m.time) }));
    const fires: FireSnap[] = m.fires.map((f) => ({ id: f.id, cells: f.cells.flatMap((cell) => [cell.x, cell.y, cell.z]), remaining: Math.max(0, f.until - m.time) }));
    const drops: DropSnap[] = [];
    for (const d of m.drops) {
      if (seenByTeam(d.pos)) {
        drops.push({ id: d.id, weapon: d.weapon.id, x: q(d.pos.x), y: q(d.pos.y), z: q(d.pos.z), mag: d.weapon.mag });
      }
    }

    const sp = m.spike;
    const spike: SpikeSnap = {
      state: sp.state, carrier: viewer.side === 'int' ? sp.carrier : -1, site: sp.site, remaining: sp.state === 'planted' ? Math.max(0, sp.explodeAt - m.time) : 0,
      defuseProgress: sp.defuseProgress, defuseNeeded: sp.defuseNeeded, defuser: sp.defuser,
    };
    if (sp.state === 'planted' || sp.state === 'defused' || sp.state === 'exploded') spike.pos = { x: sp.pos.x, y: sp.pos.y, z: sp.pos.z };
    else if (sp.state === 'dropped') { if (viewer.side === 'int' || seenByTeam(sp.pos)) spike.pos = { x: sp.pos.x, y: sp.pos.y, z: sp.pos.z }; }

    const events = this.pending.filter((e) => this.audible(e, viewer, sameSideId));

    const wp = viewer.slots;
    return {
      tick: m.tick, time: m.time, phase: m.phase, phaseRemaining: m.phaseRemaining(), round: m.round, score: [m.score[0], m.score[1]],
      squadSide: [m.squadSide[0], m.squadSide[1]], lossTier: [m.lossTier[0], m.lossTier[1]],
      rules: { winRounds: m.rules.winRounds, halfRounds: m.rules.halfRounds, maxRounds: m.rules.maxRounds },
      self: {
        id: viewer.id, alive: viewer.alive, hp: viewer.hp, armor: viewer.armor, helmet: viewer.helmet, kit: viewer.kit, spike: viewer.spike, money: viewer.money,
        cur: viewer.cur,
        weapons: { primary: wp.primary ? this.weaponSnap(wp.primary) : null, secondary: wp.secondary ? this.weaponSnap(wp.secondary) : null, tool: this.weaponSnap(wp.tool) },
        util: [...viewer.util], interact: { kind: viewer.interact.kind, progress: viewer.interact.progress },
        flashUntil: viewer.flashUntil, flashFull: viewer.flashFull, canBuy: m.canBuyNow(viewer),
        pos: { x: viewer.pos.x, y: viewer.pos.y, z: viewer.pos.z }, vel: { x: viewer.vel.x, y: viewer.vel.y, z: viewer.vel.z },
        crouch: viewer.crouch, onGround: viewer.onGround, landPenalty: viewer.landPenalty, stepAcc: viewer.stepAcc, ack: viewer.lastSeq, hurtDir: viewer.lastHurtDir,
        purchases: viewer.purchases.map((x) => x.item), doneReqs: [...viewer.processedReqs],
      },
      players, roster, grenades, smokes, fires, drops, spike, events, winnerSquad: m.winnerSquad,
      rounds: m.phase === 'matchEnd' ? m.rounds.map((x) => ({ round: x.round, winnerSquad: x.winnerSquad, winnerSide: x.winnerSide, reason: x.reason, planted: x.planted, score: x.score, moneyBefore: x.moneyBefore, equipValue: x.equipValue, duration: x.duration })) : undefined,
      lastRound: m.lastRoundEnd ? { winnerSquad: m.lastRoundEnd.winnerSquad, winnerSide: m.lastRoundEnd.winnerSide, reason: m.lastRoundEnd.reason } : null,
    };
  }
}

void M; void WEAPONS;
export type { Side };
