// Authoritative match room. Owns all mutable match truth, runs the 64 Hz simulation, drives bots,
// keeps 250 ms of pose history for lag-compensated hitscan, and builds per-client frames with an
// interest filter so hidden enemy transforms are never sent.
// In this slice the room runs in-process behind a transport; nothing in it depends on the browser.
import { BotManager, type Difficulty } from '../bots/bots';
import { RULESET_VERSION, SNAPSHOT_EVERY, TICK_RATE, type Ruleset } from '../content/rules';
import type { MapData } from '../map/build';
import { getNav, type NavGrid } from '../map/nav';
import {
  PF,
  PROTOCOL_VERSION,
  type ClientMessage,
  type GameEvent,
  type InputCmd,
  type OwnState,
  type PlayerSnap,
  type RosterEntry,
  type ServerFrame,
  type ServerWelcome,
  type Side,
  type SpikeSnap,
  type ViewState,
  type WorldSnap,
} from '../protocol/types';
import { BOT_NAMES } from '../content/rules';
import { lossReward } from '../content/rules';
import { Rng } from '../shared/math';
import type { Pose } from '../sim/hit';
import { Match } from '../sim/match';
import { eyeHeight } from '../sim/movement';
import { carrySpeed, heldItem, type Player } from '../sim/state';
import { canSeePlayer, lineOfSight } from '../sim/vision';
import { WEAPONS, recoilAt } from '../content/weapons';

export interface RoomOptions {
  map: MapData;
  rules: Ruleset;
  seed: number;
  humans: { name: string; team: number }[];
  /** side of team 0 in the first half */
  team0Side: Side;
  difficulty: Difficulty;
  enemyDifficulty?: Difficulty;
  teamSize?: number;
  /** when true the "human" seats are also bot-driven (attract mode, load tests) */
  autopilot?: boolean;
}

export interface ClientLink {
  playerId: number;
  send: (frame: ServerFrame) => void;
  queue: InputCmd[];
  last: InputCmd | null;
  ack: number;
  /** message quota bookkeeping */
  msgs: number;
  dropped: number;
}

const HISTORY = 17; // ~265 ms at 64 Hz
const MAX_REWIND_TICKS = Math.floor(0.2 * TICK_RATE);

export class Room {
  readonly match: Match;
  readonly bots: BotManager;
  readonly nav: NavGrid;
  readonly clients = new Map<number, ClientLink>();
  private history: Float32Array[] = [];
  private historyTick: number[] = [];
  private inputs: (InputCmd | null)[] = [];
  private tmpPose: Pose = { x: 0, y: 0, z: 0, crouch: 0 };
  /** enemies each team has eyes on right now (radar blips) */
  private spotted: [Map<number, number>, Map<number, number>] = [new Map(), new Map()];
  paused = false;

  constructor(public opts: RoomOptions) {
    const size = opts.teamSize ?? 5;
    const rng = new Rng(opts.seed ^ 0x77);
    const names = rng.shuffle(BOT_NAMES.slice());
    const players: { name: string; team: number; bot: boolean }[] = [];
    for (const h of opts.humans) players.push({ name: h.name, team: h.team, bot: !!opts.autopilot });
    for (let team = 0; team < 2; team++) {
      let n = players.filter((p) => p.team === team).length;
      while (n++ < size) players.push({ name: names.pop() ?? 'Unit', team, bot: true });
    }
    this.match = new Match({ map: opts.map, rules: opts.rules, seed: opts.seed, players, firstAtkTeam: opts.team0Side === 'atk' ? 0 : 1 });
    this.nav = getNav(opts.map);
    this.bots = new BotManager(this.match, this.nav, opts.difficulty, opts.enemyDifficulty, opts.humans[0]?.team ?? 0);
    for (let i = 0; i < HISTORY; i++) {
      this.history.push(new Float32Array(players.length * 4));
      this.historyTick.push(-1);
    }
    this.match.poseOf = (target, shooter) => this.rewound(target, shooter);
  }

  welcome(playerId: number): ServerWelcome {
    return {
      t: 'welcome',
      protocol: PROTOCOL_VERSION,
      playerId,
      map: this.match.map.version,
      collisionHash: this.match.map.collisionHash,
      ruleset: RULESET_VERSION,
      tickRate: TICK_RATE,
      seed: this.match.seed,
    };
  }

  connect(playerId: number, send: (frame: ServerFrame) => void): ClientLink {
    const link: ClientLink = { playerId, send, queue: [], last: null, ack: 0, msgs: 0, dropped: 0 };
    this.clients.set(playerId, link);
    return link;
  }

  /** Validates and applies a client message. Clients can only express intent. */
  receive(playerId: number, msg: ClientMessage): void {
    const link = this.clients.get(playerId);
    const p = this.match.players[playerId];
    if (!link || !p || p.bot) return;
    // message quota: a flooding client is throttled, not obeyed
    if (++link.msgs > 400) {
      link.dropped++;
      return;
    }
    if (msg.t === 'input') {
      const c = msg.cmd;
      if (!Number.isFinite(c.yaw) || !Number.isFinite(c.pitch) || !Number.isInteger(c.seq) || c.seq <= link.ack) return;
      if (link.queue.length && c.seq <= link.queue[link.queue.length - 1].seq) return; // duplicate / out of order
      link.queue.push({ seq: c.seq, buttons: c.buttons & 0x7ff, yaw: c.yaw, pitch: c.pitch, renderTick: Number(c.renderTick) || 0 });
      // bounded backlog: never let a client bank inputs to replay later
      while (link.queue.length > 6) {
        link.queue.shift();
        link.dropped++;
      }
    } else if (msg.t === 'cmd') {
      this.match.command(p, msg.cmd);
    }
  }

  private rewound(target: Player, shooter: Player): Pose {
    if (shooter.bot) return target.move;
    const now = this.match.tick;
    let rt = shooter.renderTick;
    if (!(rt > 0) || rt > now) rt = now;
    if (rt < now - MAX_REWIND_TICKS) rt = now - MAX_REWIND_TICKS; // never rewind past 200 ms
    const t0 = Math.floor(rt);
    const a = this.historyAt(t0);
    const b = this.historyAt(t0 + 1);
    if (!a) return target.move;
    const i = target.id * 4;
    const f = b ? rt - t0 : 0;
    const out = this.tmpPose;
    const bb = b ?? a;
    out.x = a[i] + (bb[i] - a[i]) * f;
    out.y = a[i + 1] + (bb[i + 1] - a[i + 1]) * f;
    out.z = a[i + 2] + (bb[i + 2] - a[i + 2]) * f;
    out.crouch = a[i + 3] + (bb[i + 3] - a[i + 3]) * f;
    return out;
  }

  private historyAt(tick: number): Float32Array | null {
    const slot = ((tick % HISTORY) + HISTORY) % HISTORY;
    return this.historyTick[slot] === tick ? this.history[slot] : null;
  }

  private record(): void {
    const tick = this.match.tick;
    const slot = tick % HISTORY;
    const h = this.history[slot];
    this.historyTick[slot] = tick;
    for (const p of this.match.players) {
      const i = p.id * 4;
      h[i] = p.move.x;
      h[i + 1] = p.move.y;
      h[i + 2] = p.move.z;
      h[i + 3] = p.move.crouch;
    }
  }

  /** Advances the room by exactly one simulation tick. */
  tick(): void {
    if (this.paused) return;
    const m = this.match;
    const inputs = this.inputs;
    inputs.length = m.players.length;
    for (let i = 0; i < inputs.length; i++) inputs[i] = null;
    for (const link of this.clients.values()) {
      link.msgs = Math.max(0, link.msgs - 6);
      const p = m.players[link.playerId];
      if (p.bot) continue;
      let cmd = link.queue.shift() ?? null;
      if (cmd) {
        link.last = cmd;
        link.ack = cmd.seq;
      } else if (link.last) {
        // starved: hold movement keys briefly rather than freezing, but never repeat one-shot actions
        cmd = { ...link.last, buttons: link.last.buttons & 0x7f };
      }
      inputs[link.playerId] = cmd;
    }
    this.bots.update(inputs);
    m.step(inputs);
    this.record();
    if (m.tick % 6 === 0) this.updateSpotted();
    const sendWorld = m.tick % SNAPSHOT_EVERY === 0;
    for (const link of this.clients.values()) link.send(this.buildFrame(link, sendWorld));
    m.events.length = 0;
  }

  private updateSpotted(): void {
    const m = this.match;
    const t = m.time;
    for (const team of [0, 1]) {
      const map = this.spotted[team];
      map.clear();
      for (const p of m.players) {
        if (!p.alive || p.team !== team) continue;
        const bot = this.bots.bots.get(p.id);
        if (bot) {
          for (const id of bot.visible) map.set(id, m.tick);
        } else {
          const ey = p.move.y + eyeHeight(p.move.crouch);
          for (const q of m.players) {
            if (!q.alive || q.team === team) continue;
            // a human "spots" what is inside a generous forward cone with line of sight
            const dx = q.move.x - p.move.x;
            const dz = q.move.z - p.move.z;
            const d = Math.hypot(dx, dz) || 1;
            if ((dx * Math.sin(p.yaw) + dz * Math.cos(p.yaw)) / d < 0.3) continue;
            if (canSeePlayer(m.world, m.veils, t, p.move.x, ey, p.move.z, q)) map.set(q.id, m.tick);
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------ frames
  viewState(p: Player): ViewState {
    const m = this.match;
    const def = p.slot === 'util' ? null : WEAPONS[p.slot === 'primary' && p.primary ? p.primary.id : p.slot === 'sidearm' && p.sidearm ? p.sidearm.id : 'tool'];
    const rec = def ? recoilAt(def, p.recoilIdx) : { p: 0, y: 0 };
    const need = p.kit ? m.rules.defuseKitTime : m.rules.defuseTime;
    return {
      id: p.id,
      move: { ...p.move },
      yaw: p.yaw,
      pitch: p.pitch,
      hp: p.hp,
      armor: p.armor,
      helmet: p.helmet,
      kit: p.kit,
      hasSpike: p.hasSpike,
      primary: p.primary ? { id: p.primary.id, ammo: p.primary.ammo, reserve: p.primary.reserve } : null,
      sidearm: p.sidearm ? { id: p.sidearm.id, ammo: p.sidearm.ammo, reserve: p.sidearm.reserve } : null,
      util: p.util.slice(),
      slot: p.slot,
      utilSel: p.utilSel,
      reloading: p.reloadEnd > 0 ? Math.min(1, Math.max(0.001, (m.time - p.reloadStart) / (p.reloadEnd - p.reloadStart))) : 0,
      drawing: m.time < p.drawEnd,
      recoilIdx: p.recoilIdx,
      punchP: def ? rec.p * def.recoilView : 0,
      punchY: def ? rec.y * def.recoilView : 0,
      heat: p.heat,
      scope: p.scope,
      plant: p.plantT / m.rules.plantTime,
      defuse: p.defuseT / need,
      frozen: m.phase === 'warmup' || m.phase === 'matchEnd' || p.plantT > 0 || p.defuseT > 0,
      maxSpeed: carrySpeed(p),
      inBuyZone: m.inBuyZone(p),
      site: m.siteAt(p.move.x, p.move.z),
      canPickup: m.pickupPrompt(p),
    };
  }

  private buildFrame(link: ClientLink, withWorld: boolean): ServerFrame {
    const m = this.match;
    const me = m.players[link.playerId];
    const viewer = me.alive ? me : me.spectate >= 0 && m.players[me.spectate].alive ? m.players[me.spectate] : null;
    const own: OwnState = {
      id: me.id,
      alive: me.alive,
      money: me.money,
      team: me.team,
      side: m.sideOf(me),
      canBuy: m.canBuy(me),
      refundable: m.refundable(me),
      nextRoundMin: Math.min(m.rules.maxMoney, me.money + lossReward(m.rules, m.teams[me.team].lossStreak + 1)),
      spectating: viewer && viewer !== me ? viewer.id : -1,
      ready: me.ready,
    };
    const events: GameEvent[] = [];
    const lx = viewer ? viewer.move.x : me.move.x;
    const lz = viewer ? viewer.move.z : me.move.z;
    for (const q of m.events) {
      if (q.to >= 0 && q.to !== me.id) continue;
      if (q.team >= 0 && q.team !== me.team) continue;
      if (q.radius > 0 && Math.hypot(q.x - lx, q.z - lz) > q.radius) continue;
      events.push(q.ev);
    }
    const frame: ServerFrame = { tick: m.tick, ack: link.ack, own, view: viewer ? this.viewState(viewer) : null, events };
    if (withWorld) frame.world = this.buildWorld(me, viewer);
    return frame;
  }

  private buildWorld(me: Player, viewer: Player | null): WorldSnap {
    const m = this.match;
    const t = m.time;
    const players: PlayerSnap[] = [];
    const ex = viewer ? viewer.move.x : 0;
    const ey = viewer ? viewer.move.y + eyeHeight(viewer.move.crouch) : 0;
    const ez = viewer ? viewer.move.z : 0;
    for (const p of m.players) {
      if (!p.alive) continue;
      if (p.team !== me.team) {
        // interest filter: an enemy transform is only sent while the viewer has line of sight to it
        if (!viewer || !canSeePlayer(m.world, m.veils, t, ex, ey, ez, p, 0.14)) continue;
      }
      let flags = 0;
      if (p.plantT > 0) flags |= PF.PLANTING;
      if (p.defuseT > 0) flags |= PF.DEFUSING;
      if (p.hasSpike) flags |= PF.SPIKE;
      if (p.reloadEnd > 0) flags |= PF.RELOADING;
      if (p.scope > 0) flags |= PF.SCOPED;
      if (t < p.blindUntil) flags |= PF.BLIND;
      if (p.move.onGround) flags |= PF.ONGROUND;
      players.push({ id: p.id, x: p.move.x, y: p.move.y, z: p.move.z, yaw: p.yaw, pitch: p.pitch, crouch: p.move.crouch, item: heldItem(p), flags });
    }
    const roster: RosterEntry[] = m.players.map((p) => {
      const mate = p.team === me.team;
      return {
        id: p.id,
        name: p.name,
        team: p.team,
        bot: p.bot,
        alive: p.alive,
        k: p.stats.kills,
        d: p.stats.deaths,
        a: p.stats.assists,
        money: mate ? p.money : -1,
        hp: mate ? p.hp : -1,
        primary: mate && p.primary ? p.primary.id : '',
        sidearm: mate && p.sidearm ? p.sidearm.id : '',
        armor: mate ? p.armor : -1,
        helmet: mate ? p.helmet : false,
        kit: mate ? p.kit : false,
        utilCount: mate ? p.util.length : -1,
        hasSpike: mate ? p.hasSpike : false,
      };
    });
    const sp = m.spike;
    const spike: SpikeSnap = { state: sp.state };
    const atk = m.sideOf(me) === 'atk';
    if (sp.state === 'armed' || sp.state === 'disarmed' || sp.state === 'detonated') {
      spike.x = sp.x;
      spike.y = sp.y;
      spike.z = sp.z;
      spike.site = sp.site || 'A';
      spike.armedTick = sp.armedTick;
      spike.defuser = sp.defuser;
    } else if (sp.state === 'dropped') {
      // attackers always know where their spike fell; defenders must see it
      if (atk || (viewer && lineOfSight(m.world, m.veils, t, ex, ey, ez, sp.x, sp.y + 0.2, sp.z))) {
        spike.x = sp.x;
        spike.y = sp.y;
        spike.z = sp.z;
      }
    }
    const spotted: { id: number; x: number; z: number }[] = [];
    for (const [id, tick] of this.spotted[me.team]) {
      const q = m.players[id];
      if (q.alive && m.tick - tick < 24) spotted.push({ id, x: q.move.x, z: q.move.z });
    }
    return {
      tick: m.tick,
      phase: m.phase,
      phaseEnd: m.phaseEnd === Infinity ? -1 : m.phaseEnd,
      round: m.round,
      score: [m.teams[0].score, m.teams[1].score],
      sides: [m.teams[0].side, m.teams[1].side],
      players,
      roster,
      grenades: m.grenades.map((g) => ({ id: g.id, type: g.type, x: g.x, y: g.y, z: g.z, team: g.team })),
      veils: m.veils.map((v) => ({ id: v.id, x: v.x, y: v.y, z: v.z, r: v.r, start: v.startTick, end: v.endTick })),
      fires: m.fires.map((f) => ({ id: f.id, cells: f.cells, end: f.endTick })),
      shards: m.shards.map((s) => ({ id: s.id, x: s.x, y: s.y, z: s.z, team: s.team })),
      items: m.items
        .filter((it) => it.kind === 'weapon' || atk || spike.x !== undefined)
        .map((it) => ({ uid: it.uid, kind: it.kind, def: it.inst ? it.inst.id : 'spike', x: it.x, y: it.y, z: it.z, yaw: it.yaw })),
      spike,
      spotted,
    };
  }
}

/** Runs a room with every seat bot-driven until the match ends. Used by tests and the load harness. */
export function runHeadlessMatch(opts: Omit<RoomOptions, 'humans' | 'autopilot'>, maxTicks = 64 * 60 * 90): Room {
  const room = new Room({ ...opts, humans: [], autopilot: true });
  let n = 0;
  while (room.match.phase !== 'matchEnd' && n++ < maxTicks) room.tick();
  return room;
}
