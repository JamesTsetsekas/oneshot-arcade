// Client netcode: sequenced inputs, local movement prediction with server reconciliation, snapshot buffering with
// remote-player interpolation, clock estimation and de-duplication of snapshots/events.

import { RULESET_VERSION } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import { PROTOCOL_VERSION, PlayerSnap, ServerMsg, Snapshot, decodeSnapshot } from '../protocol/schema';
import type { Endpoint } from '../server/link';
import { BUY_ZONES, MAP_HASH } from '../sim/map';
import { TICK_RATE } from '../sim/match';
import { lerp, normAngle } from '../sim/math';
import { stepMovement } from '../sim/movement';
import type { GameEvent, InputCmd, Player, Side } from '../sim/types';

const DT = 1 / TICK_RATE;
/** Remote entities are rendered this many ticks (94 ms) in the past: two snapshots at ~21 Hz. */
export const INTERP_TICKS = 6;
const MAX_PENDING = 128;

export interface PredictedBody {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  crouch: number;
  onGround: boolean;
  landPenalty: number;
  stepAcc: number;
}

export interface RenderedPlayer extends PlayerSnap { yawOut: number }

export class ClientNet {
  playerId = -1;
  welcomed = false;
  rejected: string | null = null;
  side: Side = 'int';
  latest: Snapshot | null = null;
  private snaps: Array<{ snap: Snapshot; at: number }> = [];
  private lastTick = -1;
  seq = 0;
  private pending: InputCmd[] = [];
  /** Predicted local body (identical movement code as the server). */
  body: PredictedBody = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, crouch: 0, onGround: true, landPenalty: 0, stepAcc: 0 };
  /** Visual smoothing offset applied after a correction. */
  errX = 0; errY = 0; errZ = 0;
  corrections = 0;
  maxCorrection = 0;
  newEvents: GameEvent[] = [];
  rttMs = 0;
  private pingSentAt = 0;
  private pingSeq = 0;
  private fake: Player;
  private clockOffsetTicks = 0;
  private haveClock = false;
  duplicateSnapshots = 0;

  constructor(private end: Endpoint) {
    this.fake = {
      id: 0, name: '', squad: 0, side: 'int', controller: 'human', pos: this.body.pos, vel: this.body.vel, yaw: 0, pitch: 0, crouch: 0, onGround: true,
      alive: true, hp: 100, armor: 0, helmet: false, armorFresh: false, kit: false, spike: false, money: 0,
      slots: { primary: null, secondary: null, tool: null as never }, cur: 'secondary', prev: 'tool', util: [], utilBought: {}, throwHeld: 0,
      interact: { kind: null, progress: 0 }, landPenalty: 0, stepAcc: 0,
    } as unknown as Player;
  }

  hello(name: string): void {
    this.end.send({ t: 'hello', v: PROTOCOL_VERSION, ruleset: RULESET_VERSION, mapHash: MAP_HASH, name });
  }

  sendPing(nowMs: number): void {
    this.pingSentAt = nowMs;
    this.pingSeq++;
    this.end.send({ t: 'ping', ct: nowMs });
  }

  /** Estimate of the server tick at `nowMs`, derived from snapshot arrival. */
  serverTickAt(nowMs: number): number {
    const last = this.snaps[this.snaps.length - 1];
    if (!last) return 0;
    const elapsed = Math.min(8, Math.max(0, (nowMs - last.at) / (1000 / TICK_RATE)));
    return last.snap.tick + elapsed;
  }

  renderTick(nowMs: number): number { return this.serverTickAt(nowMs) - INTERP_TICKS; }

  private buyReq = 1;
  /** Purchase / refund requests stay attached to outgoing inputs until the server answers (the server is idempotent per request id). */
  private openRequests: Array<{ kind: 'buy' | 'refund'; req: number; item: string }> = [];

  requestBuy(item: string): number { const req = this.buyReq++; this.openRequests.push({ kind: 'buy', req, item }); return req; }
  requestRefund(item: string): number { const req = this.buyReq++; this.openRequests.push({ kind: 'refund', req, item }); return req; }
  get openRequestCount(): number { return this.openRequests.length; }

  /** Build, predict and send one input command. */
  sendInput(partial: Omit<InputCmd, 'seq' | 'viewTick'>, nowMs: number): InputCmd {
    const cmd: InputCmd = { ...partial, seq: this.seq++, viewTick: this.renderTick(nowMs) };
    const open = this.openRequests[0];
    if (open) cmd[open.kind] = { req: open.req, item: open.item };
    this.predict(cmd);
    this.pending.push(cmd);
    if (this.pending.length > MAX_PENDING) this.pending.shift();
    this.end.send({ t: 'input', cmd });
    return cmd;
  }

  private canMoveLocked(): boolean {
    const s = this.latest;
    if (!s) return true;
    return s.self.interact.kind !== null || s.phase === 'halftime' || s.phase === 'matchEnd' || !s.self.alive;
  }

  private predict(cmd: InputCmd): void {
    const s = this.latest;
    if (!s || !s.self.alive) return;
    const f = this.fake;
    f.pos = this.body.pos; f.vel = this.body.vel; f.crouch = this.body.crouch; f.onGround = this.body.onGround;
    f.landPenalty = this.body.landPenalty; f.stepAcc = this.body.stepAcc; f.yaw = cmd.yaw; f.pitch = cmd.pitch;
    f.side = this.side;
    f.cur = s.self.cur as Player['cur'];
    f.slots = {
      primary: s.self.weapons.primary ? ({ id: s.self.weapons.primary.id } as never) : null,
      secondary: s.self.weapons.secondary ? ({ id: s.self.weapons.secondary.id } as never) : null,
      tool: { id: 'tool' } as never,
    };
    // Mirror server rules: arming/defusing locks movement; buy phase confines to the spawn area.
    const locked = this.canMoveLocked();
    stepMovement(f, { moveX: cmd.moveX, moveZ: cmd.moveZ, jump: cmd.jump, crouch: cmd.crouch, walk: cmd.walk }, {
      dt: DT, time: 0, locked, confine: s.phase === 'buy' && !this.practice ? BUY_ZONES[this.side] : null, emit: () => undefined,
    });
    this.body.crouch = f.crouch; this.body.onGround = f.onGround; this.body.landPenalty = f.landPenalty; this.body.stepAcc = f.stepAcc;
  }

  practice = false;

  /** Pump incoming messages. Returns number of snapshots applied. */
  poll(nowMs: number): number {
    let applied = 0;
    for (const raw of this.end.recv()) {
      const m = raw as ServerMsg;
      switch (m.t) {
        case 'welcome': this.welcomed = true; this.playerId = m.playerId; this.side = m.side; break;
        case 'reject': this.rejected = m.reason; break;
        case 'pong': this.rttMs = nowMs - m.ct; break;
        case 'snap':
          if (this.onSnapshot(decodeSnapshot(m.snap), nowMs)) applied++;
          break;
      }
    }
    return applied;
  }

  private onSnapshot(s: Snapshot, nowMs: number): boolean {
    if (s.tick <= this.lastTick) { this.duplicateSnapshots++; return false; } // duplicate / reordered
    this.lastTick = s.tick;
    if (s.roster) this.lastRoster = s.roster; else s.roster = this.lastRoster;
    this.latest = s;
    this.side = s.squadSide[s.self.id < 5 ? 0 : 1];
    this.snaps.push({ snap: s, at: nowMs });
    if (this.snaps.length > 24) this.snaps.shift();
    for (const e of s.events) {
      this.newEvents.push(e);
      if (e.t === 'buy') this.openRequests = this.openRequests.filter((r) => r.req !== e.req);
    }

    // ---- reconciliation
    const me = s.self;
    if (me.doneReqs.length) { const done = new Set(me.doneReqs); this.openRequests = this.openRequests.filter((r) => !done.has(r.req)); }
    this.pending = this.pending.filter((c) => c.seq > me.ack);
    const old = { x: this.body.pos.x, y: this.body.pos.y, z: this.body.pos.z };
    // authoritative state at ack
    this.body.pos = { x: me.pos.x, y: me.pos.y, z: me.pos.z };
    this.body.vel = { x: me.vel.x, y: me.vel.y, z: me.vel.z };
    this.body.crouch = me.crouch; this.body.onGround = me.onGround; this.body.landPenalty = me.landPenalty; this.body.stepAcc = me.stepAcc;
    if (me.alive) for (const c of this.pending) this.predict(c);
    const dx = old.x - this.body.pos.x, dy = old.y - this.body.pos.y, dz = old.z - this.body.pos.z;
    const err = Math.hypot(dx, dy, dz);
    if (err > 0.003 && this.hasPredicted) {
      this.corrections++;
      this.maxCorrection = Math.max(this.maxCorrection, err);
      if (err < 1.5) { this.errX += dx; this.errY += dy; this.errZ += dz; } // smooth small errors
      // large errors snap (teleport / respawn)
    }
    this.hasPredicted = true;
    return true;
  }

  private hasPredicted = false;
  private lastRoster: Snapshot['roster'] = [];

  /** Decay the visual correction offset (call once per rendered frame). */
  smooth(dtSec: number): void {
    const k = Math.exp(-dtSec * 14);
    this.errX *= k; this.errY *= k; this.errZ *= k;
  }

  /** Remote players interpolated at the render tick. */
  interpolated(nowMs: number): RenderedPlayer[] {
    const rt = this.renderTick(nowMs);
    const out: RenderedPlayer[] = [];
    if (!this.snaps.length) return out;
    // find bracketing snapshots
    let a = this.snaps[0], b = this.snaps[this.snaps.length - 1];
    for (let i = this.snaps.length - 1; i >= 0; i--) {
      if (this.snaps[i].snap.tick <= rt) { a = this.snaps[i]; b = this.snaps[Math.min(i + 1, this.snaps.length - 1)]; break; }
    }
    const span = b.snap.tick - a.snap.tick;
    const t = span > 0 ? Math.min(1, Math.max(0, (rt - a.snap.tick) / span)) : 1;
    const prev = new Map(a.snap.players.map((p) => [p.id, p]));
    for (const pb of b.snap.players) {
      const pa = prev.get(pb.id);
      if (pb.id === this.playerId) continue;
      if (!pa) { out.push({ ...pb, yawOut: pb.yaw }); continue; }
      // Do not extrapolate or blend across a large jump (teleport / respawn / visibility pop-in).
      const jump = Math.hypot(pb.pos.x - pa.pos.x, pb.pos.z - pa.pos.z);
      const tt = jump > 3 ? 1 : t;
      out.push({
        ...pb,
        pos: { x: lerp(pa.pos.x, pb.pos.x, tt), y: lerp(pa.pos.y, pb.pos.y, tt), z: lerp(pa.pos.z, pb.pos.z, tt) },
        yaw: pa.yaw + normAngle(pb.yaw - pa.yaw) * tt,
        pitch: lerp(pa.pitch, pb.pitch, tt),
        crouch: lerp(pa.crouch, pb.crouch, tt),
        yawOut: pa.yaw + normAngle(pb.yaw - pa.yaw) * tt,
      });
    }
    return out;
  }

  drainEvents(): GameEvent[] {
    const e = this.newEvents;
    this.newEvents = [];
    return e;
  }

  weaponDef(id: WeaponId) { return WEAPONS[id]; }
}
