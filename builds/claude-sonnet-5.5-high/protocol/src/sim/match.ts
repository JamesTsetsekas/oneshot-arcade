// The authoritative match simulation: players, weapons, economy, objective, rounds, halftime and overtime.
// Fixed 64 Hz step. Deterministic for a given seed and input stream (no wall-clock or Math.random use).

import { ARMOR, ECON, MAX_UTILITY, MOVEMENT as M, OBJECTIVE, PHASES, RULESETS, RULESET_VERSION, RuleSet, UTILITY, UtilityId } from '../content/economy';
import { WEAPONS, WeaponDef, WeaponId, mulberry32 } from '../content/weapons';
import { Pose, TraceTarget, applyArmor, rawDamage, traceBullet } from './combat';
import { BUY_ZONES, SITES, SPAWNS, Zone, inZone } from './map';
import { bodyBlocked } from './collision';
import { Vec3, angleDiff, anglesFromDir, clamp, dirFromAngles, dist2, normAngle, quant } from './math';
import { MoveInput, bodyHeight, eyeHeight, horizontalSpeed, stepMovement } from './movement';
import type {
  Controller, DropItem, FireArea, GameEvent, Grenade, HitZone, InputCmd, Phase, Player, PlayerStats, RoundRecord, Side, SmokeVolume, SpikeState, WeaponState,
} from './types';
import { computeSpread, kickNow, newWeapon, weaponValue } from './weapons';
import { stepGrenades, throwGrenade } from './grenades';

export const TICK_RATE = 64;
export const DT = 1 / TICK_RATE;
export const MAX_REWIND_TICKS = 12; // 187 ms: never beyond 200 ms
const HIST_LEN = 24;

export interface MatchConfig {
  seed: number;
  rules: RuleSet;
  /** Squad (0 or 1) that starts on this side. */
  squad0Side: Side;
  /** Which player ids are humans (others are bots). */
  humanIds: number[];
  /** Practice: unlimited money, buying any time anywhere, no round timer pressure. */
  practice?: boolean;
  names?: string[];
}

const BOT_NAMES = [
  'Vesper', 'Halcyon', 'Quill', 'Ember', 'Tarn', 'Juno', 'Cobalt', 'Sable', 'Pike', 'Mira',
  'Orrin', 'Lyra', 'Dax', 'Nova', 'Fenn', 'Iris', 'Rue', 'Kestrel', 'Wren', 'Brine',
];

export function emptyStats(): PlayerStats {
  return { kills: 0, deaths: 0, assists: 0, damage: 0, headshots: 0, shots: 0, hits: 0, plants: 0, defuses: 0, utilDamage: 0, flashed: 0, openingKills: 0, spent: 0, score: 0 };
}

function idleCmd(seq: number): InputCmd {
  return { seq, viewTick: 0, moveX: 0, moveZ: 0, yaw: 0, pitch: 0, fire: false, alt: false, jump: false, crouch: false, walk: false, use: false };
}

export const ITEM_PRICES: Record<string, number> = {
  vest: ARMOR.vest.price, helmet: ARMOR.helmetUpgrade, vesthelmet: ARMOR.vestHelmet.price, kit: ARMOR.kit.price,
};

export class Match {
  cfg: MatchConfig;
  rules: RuleSet;
  rng: () => number;
  tick = 0;
  time = 0;
  players: Player[] = [];
  phase: Phase = 'buy';
  phaseEnds = 0;
  round = 0; // 1-based index of the current/last round
  liveStart = 0;
  score: [number, number] = [0, 0];
  squadSide: [Side, Side];
  lossTier: [number, number] = [0, 0];
  spike: SpikeState;
  grenades: Grenade[] = [];
  smokes: SmokeVolume[] = [];
  fires: FireArea[] = [];
  drops: DropItem[] = [];
  events: GameEvent[] = [];
  rounds: RoundRecord[] = [];
  winnerSquad: 0 | 1 | -1 | null = null;
  plantedThisRound = false;
  firstKill: { killer: number; victim: number } | null = null;
  lastRoundEnd: { winnerSquad: 0 | 1; winnerSide: Side; reason: RoundRecord['reason'] } | null = null;
  hist: Array<{ tick: number; poses: Pose[] }> = [];
  /** Bot decision hooks, installed by the bot module. */
  brains: Map<number, { think: (m: Match, p: Player) => InputCmd }> = new Map();
  private idSeq = 1;
  private moneyBefore: [number, number] = [0, 0];
  private equipAtLive: [number, number] = [0, 0];
  private halfDone = false;
  rulesetVersion = RULESET_VERSION;

  constructor(cfg: MatchConfig) {
    this.cfg = cfg;
    this.rules = cfg.rules;
    this.rng = mulberry32(cfg.seed);
    this.squadSide = [cfg.squad0Side, cfg.squad0Side === 'int' ? 'cus' : 'int'];
    this.spike = this.freshSpike();
    this.createPlayers();
    this.startRound();
  }

  nextId(): number { return this.idSeq++; }
  emit(e: GameEvent): void { this.events.push(e); }

  // ------------------------------------------------------------------ setup
  private createPlayers(): void {
    for (let i = 0; i < 10; i++) {
      const squad = (i < 5 ? 0 : 1) as 0 | 1;
      const human = this.cfg.humanIds.includes(i);
      const name = this.cfg.names?.[i] ?? (human ? 'You' : BOT_NAMES[i % BOT_NAMES.length]);
      this.players.push(this.makePlayer(i, squad, name, human ? 'human' : 'bot'));
    }
  }

  private makePlayer(id: number, squad: 0 | 1, name: string, controller: Controller): Player {
    return {
      id, name, squad, side: this.squadSide[squad], controller,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, crouch: 0, onGround: true,
      alive: true, hp: 100, armor: 0, helmet: false, armorFresh: false, kit: false, spike: false, money: ECON.startMoney,
      slots: { primary: null, secondary: newWeapon('vela'), tool: newWeapon('tool') },
      cur: 'secondary', prev: 'tool', util: [], utilBought: {}, throwHeld: 0,
      interact: { kind: null, progress: 0 }, stats: emptyStats(), killedRound: false, landPenalty: 0,
      flashUntil: 0, flashFull: 0, lastSeq: -1, lastCmd: null, cmdQueue: [], starve: 0, processedReqs: new Set(), purchases: [],
      damagers: new Map(), stepAcc: 0, stance: 0, ping: 0, dropLock: 0, inspectUntil: 0, swing: 0, lastHurtDir: 0, connected: true,
      firePrev: false, altPrev: false, usePrev: false, jumpPrev: false, idleSince: 0,
    };
  }

  private freshSpike(): SpikeState {
    return {
      state: 'carried', carrier: -1, pos: { x: 0, y: 0, z: 0 }, site: null, plantedAt: 0, explodeAt: 0, nextBeep: 0, defuser: -1,
      defuseProgress: 0, defuseNeeded: OBJECTIVE.defuseTime,
    };
  }

  playersOf(side: Side): Player[] { return this.players.filter((p) => p.side === side); }
  alive(side: Side): Player[] { return this.players.filter((p) => p.side === side && p.alive); }
  squadOf(side: Side): 0 | 1 { return this.squadSide[0] === side ? 0 : 1; }
  intSquad(): 0 | 1 { return this.squadOf('int'); }

  setSidesForSquad0(side: Side): void {
    this.squadSide = [side, side === 'int' ? 'cus' : 'int'];
    for (const p of this.players) p.side = this.squadSide[p.squad];
  }

  // ------------------------------------------------------------------ rounds
  private resetLoadout(p: Player): void {
    p.armor = 0; p.helmet = false; p.armorFresh = false; p.kit = false;
    p.slots = { primary: null, secondary: newWeapon('vela'), tool: newWeapon('tool') };
    p.util = []; p.utilBought = {}; p.spike = false;
  }

  startRound(): void {
    this.round++;
    this.grenades = []; this.smokes = []; this.fires = []; this.drops = [];
    this.spike = this.freshSpike();
    this.plantedThisRound = false;
    this.firstKill = null;
    this.lastRoundEnd = null;
    for (const side of ['cus', 'int'] as Side[]) {
      const squadPlayers = this.players.filter((p) => p.side === side);
      squadPlayers.forEach((p, i) => {
        if (!p.alive) this.resetLoadout(p);
        p.alive = true; p.hp = 100; p.killedRound = false; p.spike = false;
        p.vel = { x: 0, y: 0, z: 0 };
        const sp = SPAWNS[side][i % 5];
        p.pos = { x: sp.x, y: 0, z: sp.z };
        p.yaw = sp.yaw; p.pitch = 0; p.crouch = 0; p.onGround = true; p.landPenalty = 0;
        p.flashUntil = 0; p.flashFull = 0;
        p.interact = { kind: null, progress: 0 };
        p.purchases = []; p.processedReqs = new Set(); p.damagers = new Map();
        p.cmdQueue = []; p.starve = 0; p.lastCmd = null;
        p.firePrev = p.altPrev = p.usePrev = p.jumpPrev = false;
        p.utilBought = {};
        p.armorFresh = false;
        p.cur = p.slots.primary ? 'primary' : 'secondary';
        p.prev = 'tool';
        for (const w of [p.slots.primary, p.slots.secondary, p.slots.tool]) {
          if (w) { w.nextFire = 0; w.readyAt = this.time + 0.2; w.reloading = false; w.shots = 0; w.lastShot = -100; w.heat = 0; w.burstLeft = 0; w.fresh = false; w.scopeLevel = 0; }
        }
        if (p.kit && side !== 'cus') p.kit = false;
      });
    }
    // Attacker spike carrier.
    const ints = this.players.filter((p) => p.side === 'int');
    const carrier = ints[Math.floor(this.rng() * ints.length)];
    carrier.spike = true;
    this.spike.carrier = carrier.id;
    this.moneyBefore = [this.teamMoney(0), this.teamMoney(1)];
    this.phase = 'buy';
    this.phaseEnds = this.time + PHASES.buy;
    this.emit({ t: 'phase', phase: 'buy', round: this.round, at: this.time });
  }

  teamMoney(squad: 0 | 1): number { return this.players.filter((p) => p.squad === squad).reduce((a, p) => a + p.money, 0); }

  equipValue(p: Player): number {
    let v = weaponValue(p.slots.primary) + (p.slots.secondary && p.slots.secondary.id !== 'vela' ? weaponValue(p.slots.secondary) : 0);
    v += p.armor > 0 ? ARMOR.vest.price : 0;
    v += p.helmet ? ARMOR.helmetUpgrade : 0;
    v += p.kit ? ARMOR.kit.price : 0;
    for (const u of p.util) v += UTILITY[u].price;
    return v;
  }

  private beginLive(): void {
    this.phase = 'live';
    this.liveStart = this.time;
    this.phaseEnds = this.time + PHASES.action;
    this.equipAtLive = [
      this.players.filter((p) => p.squad === 0).reduce((a, p) => a + this.equipValue(p), 0),
      this.players.filter((p) => p.squad === 1).reduce((a, p) => a + this.equipValue(p), 0),
    ];
    this.emit({ t: 'phase', phase: 'live', round: this.round, at: this.time });
  }

  /** Round ended: pay out, record, and enter the round-end phase. */
  endRound(winnerSquad: 0 | 1, reason: RoundRecord['reason']): void {
    if (this.phase === 'roundEnd' || this.phase === 'matchEnd' || this.phase === 'halftime') return;
    const winnerSide = this.squadSide[winnerSquad];
    this.score[winnerSquad]++;
    this.lastRoundEnd = { winnerSquad, winnerSide, reason };
    const intSquad = this.intSquad();
    // Economy payouts.
    for (const squad of [0, 1] as const) {
      const won = squad === winnerSquad;
      const side = this.squadSide[squad];
      const tier = this.lossTier[squad];
      let delta = 0;
      if (won) delta += ECON.roundWin;
      else {
        delta += ECON.lossBase + ECON.lossStep * tier;
        if (side === 'int' && reason === 'timeExpired' && !this.plantedThisRound) delta -= ECON.timeoutNoArmPenalty;
      }
      if (side === 'int' && this.plantedThisRound) delta += ECON.armTeam;
      for (const p of this.players.filter((q) => q.squad === squad)) this.addMoney(p, delta, won ? 'Round won' : 'Round lost');
      this.lossTier[squad] = won ? Math.max(0, tier - 1) : Math.min(ECON.lossMaxTier, tier + 1);
    }
    void intSquad;
    this.rounds.push({
      round: this.round, winnerSide, winnerSquad, reason, planted: this.plantedThisRound, duration: this.time - this.liveStart,
      moneyBefore: this.moneyBefore, equipValue: this.equipAtLive, score: [this.score[0], this.score[1]],
      firstKill: this.firstKill ?? undefined,
    });
    // Lock combat inputs; presentation finishes.
    for (const p of this.players) { p.interact = { kind: null, progress: 0 }; }
    this.phase = 'roundEnd';
    this.phaseEnds = this.time + PHASES.roundEnd;
    this.emit({ t: 'roundEnd', winnerSquad, winnerSide, reason, score: [this.score[0], this.score[1]] });
    this.emit({ t: 'phase', phase: 'roundEnd', round: this.round, at: this.time });
  }

  /** Match result according to win-by-2 / cap rules, or null if play continues. */
  matchResult(): { winner: 0 | 1 | -1 } | null {
    const [a, b] = this.score;
    const r = this.rules;
    if (Math.max(a, b) >= r.winRounds && Math.abs(a - b) >= r.winBy) return { winner: a > b ? 0 : 1 };
    if (a + b >= r.maxRounds) return { winner: a > b ? 0 : b > a ? 1 : -1 };
    return null;
  }

  private resetEconomyForSwap(startMoney: number): void {
    for (const p of this.players) {
      this.resetLoadout(p);
      p.alive = false; // forces a fresh loadout in startRound
      p.money = startMoney;
    }
    this.lossTier = [0, 0];
  }

  private advanceAfterRoundEnd(): void {
    const res = this.matchResult();
    if (res) {
      this.phase = 'matchEnd';
      this.winnerSquad = res.winner;
      this.phaseEnds = Infinity;
      this.emit({ t: 'phase', phase: 'matchEnd', round: this.round, at: this.time });
      return;
    }
    const played = this.score[0] + this.score[1];
    const reg = this.rules.halfRounds * 2;
    let swap = false;
    let startMoney: number = ECON.startMoney;
    if (played === this.rules.halfRounds) swap = true;
    else if (played >= reg && (played - reg) % 2 === 0) { swap = true; startMoney = 2400; }
    if (swap) {
      this.setSidesForSquad0(this.squadSide[0] === 'int' ? 'cus' : 'int');
      this.resetEconomyForSwap(startMoney);
      this.phase = 'halftime';
      this.phaseEnds = this.time + PHASES.halftime;
      this.emit({ t: 'phase', phase: 'halftime', round: this.round, at: this.time });
      this.emit({ t: 'info', text: played === this.rules.halfRounds ? 'Halftime: sides swap' : 'Overtime: sides swap' });
      return;
    }
    this.startRound();
  }

  addMoney(p: Player, delta: number, reason: string): void {
    if (this.cfg.practice) { p.money = ECON.cap; return; }
    const before = p.money;
    p.money = clamp(p.money + delta, 0, ECON.cap);
    const applied = p.money - before;
    if (applied !== 0) this.emit({ t: 'econ', id: p.id, delta: applied, reason });
  }

  // ------------------------------------------------------------------ inputs
  /** Validate and queue a client intent. Returns false if rejected. */
  submitInput(id: number, cmd: InputCmd): boolean {
    const p = this.players[id];
    if (!p || !p.connected) return false;
    if (!sanitizeCmd(cmd)) return false;
    if (cmd.seq <= p.lastSeq) return false; // already consumed: duplicate or reordered
    if (p.cmdQueue.some((c) => c.seq === cmd.seq)) return false;
    if (p.cmdQueue.length >= 24) p.cmdQueue.shift();
    p.cmdQueue.push(cmd);
    p.cmdQueue.sort((a, b) => a.seq - b.seq);
    return true;
  }

  private pullCmd(p: Player): InputCmd {
    const c = p.cmdQueue.shift();
    if (c) {
      p.starve = 0;
      p.lastSeq = c.seq;
      p.lastCmd = c;
      return c;
    }
    p.starve++;
    const base = p.lastCmd ?? idleCmd(p.lastSeq);
    const held: InputCmd = { ...base, reload: false, drop: false, quick: false, inspect: false, select: undefined, buy: undefined, refund: undefined };
    if (p.starve > 20) { held.moveX = 0; held.moveZ = 0; held.fire = false; held.alt = false; held.jump = false; held.use = false; }
    return held;
  }

  // ------------------------------------------------------------------ stepping
  step(): void {
    this.tick++;
    this.time = this.tick * DT;
    this.events = [];

    // bots decide
    for (const p of this.players) {
      const brain = this.brains.get(p.id);
      if (brain && p.controller === 'bot') {
        const cmd = brain.think(this, p);
        cmd.seq = p.lastSeq + 1;
        cmd.viewTick = this.tick;
        p.cmdQueue.push(cmd);
      }
    }

    for (const p of this.players) {
      const cmd = this.pullCmd(p);
      this.processCmd(p, cmd);
    }

    this.separatePlayers();
    stepGrenades(this);
    this.stepFires();
    this.stepSpike();
    this.stepFlashRecovery();

    // phase machine
    switch (this.phase) {
      case 'buy':
        if (this.time >= this.phaseEnds) this.beginLive();
        break;
      case 'live':
      case 'armed':
        this.checkRoundEnd();
        break;
      case 'roundEnd':
        if (this.time >= this.phaseEnds) this.advanceAfterRoundEnd();
        break;
      case 'halftime':
        if (this.time >= this.phaseEnds) this.startRound();
        break;
      default: break;
    }

    // lag-compensation history (end-of-tick poses)
    this.hist.push({ tick: this.tick, poses: this.players.map((p) => this.poseOf(p)) });
    if (this.hist.length > HIST_LEN) this.hist.shift();
  }

  /** Living players do not stand inside each other: push overlapping bodies apart (only into free space). */
  private separatePlayers(): void {
    const ps = this.players;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < ps.length; j++) {
        const b = ps[j];
        if (!b.alive || Math.abs(a.pos.y - b.pos.y) > 1.2) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        const min = 0.62;
        if (d >= min) continue;
        const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
        const push = (min - d) / 2;
        const ax = a.pos.x - nx * push, az = a.pos.z - nz * push;
        const bx = b.pos.x + nx * push, bz = b.pos.z + nz * push;
        if (!bodyBlocked(ax, a.pos.y, az, M.halfWidth, bodyHeight(a))) { a.pos.x = ax; a.pos.z = az; }
        if (!bodyBlocked(bx, b.pos.y, bz, M.halfWidth, bodyHeight(b))) { b.pos.x = bx; b.pos.z = bz; }
      }
    }
  }

  private stepFlashRecovery(): void { /* flash decay is time based (flashUntil) */ }

  poseOf(p: Player): Pose {
    return { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, crouchQ: quant(p.crouch, 0.25) };
  }

  eyePos(p: Player): Vec3 {
    return { x: p.pos.x, y: p.pos.y + eyeHeight(p.crouch), z: p.pos.z };
  }

  /** Pose of a player at a past tick (clamped to the retained window). */
  poseAt(p: Player, tick: number): Pose {
    for (let i = this.hist.length - 1; i >= 0; i--) {
      if (this.hist[i].tick <= tick) return this.hist[i].poses[p.id];
    }
    return this.hist.length ? this.hist[0].poses[p.id] : this.poseOf(p);
  }

  // ------------------------------------------------------------------ command processing
  private fireAllowed(): boolean { return this.phase === 'live' || this.phase === 'armed' || this.cfg.practice === true && this.phase === 'buy'; }

  private processCmd(p: Player, cmd: InputCmd): void {
    p.yaw = normAngle(cmd.yaw);
    p.pitch = clamp(cmd.pitch, -1.55, 1.55);

    if (cmd.buy) this.handleBuy(p, cmd.buy.req, cmd.buy.item);
    if (cmd.refund) this.handleRefund(p, cmd.refund.req, cmd.refund.item);

    if (!p.alive) { p.firePrev = cmd.fire; return; }

    const frozen = this.phase === 'halftime' || this.phase === 'matchEnd';

    // inventory actions
    if (cmd.select) this.selectItem(p, cmd.select);
    if (cmd.quick) this.selectItem(p, p.prev);
    if (cmd.drop) this.dropCurrent(p);
    if (cmd.reload) this.startReload(p);
    if (cmd.inspect) p.inspectUntil = this.time + 2.2;
    const useEdge = cmd.use && !p.usePrev;
    if (useEdge) this.tryPickup(p);

    const interacting = this.updateInteract(p, cmd);

    const mv: MoveInput = { moveX: cmd.moveX, moveZ: cmd.moveZ, jump: cmd.jump, crouch: cmd.crouch, walk: cmd.walk };
    const prevCrouch = p.crouch;
    stepMovement(p, mv, {
      dt: DT, time: this.time, locked: frozen || interacting, confine: this.phase === 'buy' && !this.cfg.practice ? BUY_ZONES[p.side] : null,
      emit: (e) => this.events.push(e),
    });
    void prevCrouch;

    this.updateReload(p);
    if (!frozen && !interacting) this.updateFire(p, cmd);
    else { p.firePrev = cmd.fire; p.altPrev = cmd.alt; }
    p.usePrev = cmd.use;
    p.jumpPrev = cmd.jump;
    this.autoPickupSpike(p);
  }

  // ---- inventory
  private heldSlotWeapon(p: Player): WeaponState | null {
    if (p.cur === 'primary') return p.slots.primary;
    if (p.cur === 'secondary') return p.slots.secondary;
    if (p.cur === 'tool') return p.slots.tool;
    return null;
  }
  heldWeapon(p: Player): WeaponState | null { return this.heldSlotWeapon(p); }
  heldDef(p: Player): WeaponDef | null { const w = this.heldSlotWeapon(p); return w ? WEAPONS[w.id] : null; }

  selectItem(p: Player, what: string): void {
    let target: Player['cur'] | null = null;
    const order: Player['cur'][] = [];
    if (p.slots.primary) order.push('primary');
    if (p.slots.secondary) order.push('secondary');
    order.push('tool');
    p.util.forEach((_, i) => order.push(`util${i}` as const));
    if (what === 'next' || what === 'prev') {
      const i = order.indexOf(p.cur);
      target = order[(i + (what === 'next' ? 1 : -1) + order.length) % order.length];
    } else if (what === 'primary' || what === 'secondary' || what === 'tool') {
      if (what === 'primary' && !p.slots.primary) return;
      if (what === 'secondary' && !p.slots.secondary) return;
      target = what;
    } else if (what.startsWith('util')) {
      const i = Number(what.slice(4));
      if (i < p.util.length) target = `util${i}` as const;
    }
    if (!target || target === p.cur) return;
    if (!p.cur.startsWith('util')) p.prev = p.cur as 'primary' | 'secondary' | 'tool';
    const old = this.heldSlotWeapon(p);
    if (old) { old.reloading = false; old.scopeLevel = 0; old.burstLeft = 0; }
    p.cur = target;
    const nw = this.heldSlotWeapon(p);
    const def = nw ? WEAPONS[nw.id] : null;
    if (nw && def) nw.readyAt = this.time + def.drawTime;
    p.throwHeld = 0;
    this.emit({ t: 'sfx', id: p.id, kind: 'draw', p: { ...p.pos }, weapon: nw?.id });
  }

  startReload(p: Player): void {
    const w = this.heldSlotWeapon(p);
    if (!w) return;
    const def = WEAPONS[w.id];
    if (def.mode === 'melee' || w.reloading) return;
    if (w.mag >= def.mag || w.reserve <= 0) return;
    if (this.time < w.readyAt) return;
    w.reloading = true;
    w.scopeLevel = 0;
    w.reloadEnd = this.time + def.reloadTime;
    this.emit({ t: 'sfx', id: p.id, kind: 'reload', p: { ...p.pos }, weapon: w.id });
  }

  private updateReload(p: Player): void {
    const w = this.heldSlotWeapon(p);
    if (!w || !w.reloading) return;
    const def = WEAPONS[w.id];
    if (this.time < w.reloadEnd) return;
    if (def.shellTime) {
      w.mag++; w.reserve--;
      if (w.mag < def.mag && w.reserve > 0) { w.reloadEnd = this.time + def.shellTime; this.emit({ t: 'sfx', id: p.id, kind: 'reload', p: { ...p.pos }, weapon: w.id }); } else w.reloading = false;
    } else {
      const need = def.mag - w.mag;
      const take = Math.min(need, w.reserve);
      w.mag += take; w.reserve -= take;
      w.reloading = false;
    }
  }

  dropCurrent(p: Player): void {
    if (this.time < p.dropLock) return;
    const slot = p.cur;
    if (slot !== 'primary' && slot !== 'secondary') return;
    const w = p.slots[slot];
    if (!w) return;
    p.slots[slot] = null;
    w.reloading = false; w.fresh = false;
    this.spawnDrop(w, p, true);
    p.dropLock = this.time + 0.4;
    p.cur = p.slots.primary ? 'primary' : p.slots.secondary ? 'secondary' : 'tool';
    this.emit({ t: 'sfx', id: p.id, kind: 'drop', p: { ...p.pos } });
  }

  private spawnDrop(w: WeaponState, p: Player, thrown: boolean): void {
    const dir = dirFromAngles(p.yaw, 0);
    const d = thrown ? 0.9 : 0;
    const x = clamp(p.pos.x + dir.x * d, 0.5, 95.5), z = clamp(p.pos.z + dir.z * d, 0.5, 71.5);
    this.drops.push({ id: this.nextId(), weapon: w, pos: { x, y: p.pos.y, z }, born: this.time });
  }

  tryPickup(p: Player): void {
    // Spike picked up automatically; weapons on E.
    let best: DropItem | null = null;
    let bd = 1.9;
    for (const d of this.drops) {
      const dd = Math.hypot(d.pos.x - p.pos.x, d.pos.z - p.pos.z);
      if (dd < bd && Math.abs(d.pos.y - p.pos.y) < 1.2) { bd = dd; best = d; }
    }
    if (!best) return;
    const def = WEAPONS[best.weapon.id];
    const slot = def.slot === 'secondary' ? 'secondary' : 'primary';
    const old = p.slots[slot];
    if (old) { old.reloading = false; this.spawnDrop(old, p, false); }
    p.slots[slot] = best.weapon;
    best.weapon.readyAt = this.time + def.drawTime;
    best.weapon.reloading = false;
    this.drops = this.drops.filter((x) => x !== best);
    p.cur = slot;
    this.emit({ t: 'sfx', id: p.id, kind: 'pickup', p: { ...p.pos }, weapon: best.weapon.id });
  }

  // ---- buying
  inBuyZone(p: Player): boolean {
    if (this.cfg.practice) return true;
    return inZone(BUY_ZONES[p.side], p.pos.x, p.pos.z);
  }

  canBuyNow(p: Player): boolean {
    if (!p.alive) return false;
    if (this.cfg.practice) return this.phase !== 'matchEnd' && this.phase !== 'halftime';
    return this.phase === 'buy' && this.inBuyZone(p);
  }

  priceOf(p: Player, item: string): number {
    if (item === 'vesthelmet') return ARMOR.vestHelmet.price - (p.armor >= 100 ? ARMOR.vest.price : 0) - (p.helmet ? ARMOR.helmetUpgrade : 0);
    if (item === 'vest') return ARMOR.vest.price;
    if (item === 'helmet') return ARMOR.helmetUpgrade;
    if (item === 'kit') return ARMOR.kit.price;
    if (item in UTILITY) return UTILITY[item as UtilityId].price;
    if (item in WEAPONS) return WEAPONS[item as WeaponId].price;
    return -1;
  }

  handleBuy(p: Player, req: number, item: string): boolean {
    if (p.processedReqs.has(req)) return false; // idempotent
    p.processedReqs.add(req);
    const fail = (reason: string) => { this.emit({ t: 'buy', id: p.id, item, ok: false, reason, req }); return false; };
    if (!this.canBuyNow(p)) return fail(this.phase === 'buy' ? 'Out of buy zone' : 'Buy phase over');
    const price = this.priceOf(p, item);
    if (price < 0) return fail('Unknown item');
    if (price === 0) return fail('Nothing to buy');
    if (p.money < price) return fail('Not enough money');

    if (item in WEAPONS) {
      const def = WEAPONS[item as WeaponId];
      if (def.slot === 'tool') return fail('Not for sale');
      const slot = def.slot === 'secondary' ? 'secondary' : 'primary';
      const old = p.slots[slot];
      if (old && old.id === def.id && !this.cfg.practice) return fail('Already owned');
      if (old) this.spawnDrop(old, p, false);
      const w = newWeapon(def.id, true);
      w.readyAt = this.time + def.drawTime;
      p.slots[slot] = w;
      p.cur = slot;
    } else if (item === 'vest') {
      if (p.armor >= 100) return fail('Already owned');
      p.armor = 100; p.armorFresh = true;
    } else if (item === 'helmet') {
      if (p.helmet) return fail('Already owned');
      p.helmet = true;
    } else if (item === 'vesthelmet') {
      if (p.armor >= 100 && p.helmet) return fail('Already owned');
      p.armor = 100; p.helmet = true; p.armorFresh = true;
    } else if (item === 'kit') {
      if (p.side !== 'cus') return fail('Custodians only');
      if (p.kit) return fail('Already owned');
      p.kit = true;
    } else if (item in UTILITY) {
      const u = UTILITY[item as UtilityId];
      if (p.util.length >= MAX_UTILITY) return fail('Utility slots full');
      if (p.util.filter((x) => x === u.id).length >= u.max) return fail('At carry limit');
      p.util.push(u.id);
      p.utilBought[u.id] = (p.utilBought[u.id] ?? 0) + 1;
    }
    if (!this.cfg.practice) p.money -= price; else p.money = ECON.cap;
    p.stats.spent += price;
    p.purchases.push({ item, price });
    this.emit({ t: 'buy', id: p.id, item, ok: true, req });
    return true;
  }

  handleRefund(p: Player, req: number, item: string): boolean {
    if (p.processedReqs.has(req)) return false;
    p.processedReqs.add(req);
    const fail = (reason: string) => { this.emit({ t: 'buy', id: p.id, item, ok: false, reason, req, refund: true }); return false; };
    if (!this.canBuyNow(p) || this.cfg.practice) return fail('Refunds only during buy phase');
    const idx = [...p.purchases].map((x) => x.item).lastIndexOf(item);
    if (idx < 0) return fail('Not purchased this round');
    const rec = p.purchases[idx];
    if (item in WEAPONS) {
      const def = WEAPONS[item as WeaponId];
      const slot = def.slot === 'secondary' ? 'secondary' : 'primary';
      const w = p.slots[slot];
      if (!w || w.id !== def.id || !w.fresh) return fail('Item no longer refundable');
      p.slots[slot] = slot === 'secondary' ? newWeapon('vela') : null;
      if (p.cur === slot) p.cur = p.slots.primary ? 'primary' : 'secondary';
    } else if (item === 'vest' || item === 'vesthelmet') {
      if (!p.armorFresh) return fail('Armour was damaged');
      p.armor = 0; if (item === 'vesthelmet') p.helmet = false;
    } else if (item === 'helmet') {
      p.helmet = false;
    } else if (item === 'kit') {
      p.kit = false;
    } else if (item in UTILITY) {
      const u = item as UtilityId;
      const i = p.util.lastIndexOf(u);
      if (i < 0) return fail('Already used');
      p.util.splice(i, 1);
      p.utilBought[u] = Math.max(0, (p.utilBought[u] ?? 1) - 1);
      if (p.cur.startsWith('util')) p.cur = p.slots.primary ? 'primary' : 'secondary';
    }
    p.purchases.splice(idx, 1);
    p.money = clamp(p.money + rec.price, 0, ECON.cap);
    p.stats.spent -= rec.price;
    this.emit({ t: 'buy', id: p.id, item, ok: true, req, refund: true });
    return true;
  }

  // ---- interaction (arming / disarming)
  private updateInteract(p: Player, cmd: InputCmd): boolean {
    const it = p.interact;
    // Arming
    if (p.side === 'int' && p.spike && this.phase === 'live' && cmd.use && p.onGround) {
      const site = (['A', 'B'] as const).find((s) => inZone(SITES[s], p.pos.x, p.pos.z));
      if (site) {
        if (it.kind !== 'arm') { it.kind = 'arm'; it.progress = 0; this.emit({ t: 'spike', kind: 'armStart', p: { ...p.pos }, id: p.id }); }
        it.progress += DT;
        if (it.progress >= OBJECTIVE.armTime) {
          this.plant(p, site);
          it.kind = null; it.progress = 0;
          return false;
        }
        return true;
      }
    }
    if (it.kind === 'arm') { this.emit({ t: 'spike', kind: 'armCancel', p: { ...p.pos }, id: p.id }); it.kind = null; it.progress = 0; }

    // Disarming
    if (p.side === 'cus' && this.phase === 'armed' && this.spike.state === 'planted' && cmd.use) {
      const sp = this.spike;
      const d = Math.hypot(sp.pos.x - p.pos.x, sp.pos.z - p.pos.z);
      if (d <= OBJECTIVE.defuseRange && Math.abs(sp.pos.y - p.pos.y) < 1.6 && (sp.defuser === -1 || sp.defuser === p.id)) {
        if (it.kind !== 'defuse') {
          it.kind = 'defuse'; it.progress = 0; sp.defuser = p.id;
          sp.defuseNeeded = p.kit ? OBJECTIVE.defuseTimeKit : OBJECTIVE.defuseTime;
          this.emit({ t: 'spike', kind: 'defuseStart', p: { ...p.pos }, id: p.id });
        }
        it.progress += DT;
        sp.defuseProgress = it.progress;
        if (it.progress >= sp.defuseNeeded) {
          sp.state = 'defused';
          this.emit({ t: 'spike', kind: 'defused', p: { ...sp.pos }, id: p.id });
          p.stats.defuses++;
          this.addMoney(p, ECON.defusePersonal, 'Defuse');
          it.kind = null; it.progress = 0; sp.defuser = -1;
          this.endRound(p.squad, 'disarmed');
          return false;
        }
        return true;
      }
    }
    if (it.kind === 'defuse') {
      this.emit({ t: 'spike', kind: 'defuseCancel', p: { ...p.pos }, id: p.id });
      it.kind = null; it.progress = 0;
      if (this.spike.defuser === p.id) { this.spike.defuser = -1; this.spike.defuseProgress = 0; }
    }
    return false;
  }

  private plant(p: Player, site: 'A' | 'B'): void {
    const sp = this.spike;
    sp.state = 'planted';
    sp.site = site;
    sp.pos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
    sp.plantedAt = this.time;
    sp.explodeAt = this.time + PHASES.armed;
    sp.nextBeep = this.time + 1;
    sp.carrier = -1;
    p.spike = false;
    p.stats.plants++;
    this.plantedThisRound = true;
    this.phase = 'armed';
    this.phaseEnds = sp.explodeAt;
    this.addMoney(p, ECON.armPersonal, 'Spike armed');
    this.emit({ t: 'spike', kind: 'planted', p: { ...sp.pos }, id: p.id });
    this.emit({ t: 'phase', phase: 'armed', round: this.round, at: this.time });
  }

  private autoPickupSpike(p: Player): void {
    const sp = this.spike;
    if (sp.state !== 'dropped' || p.side !== 'int' || !p.alive) return;
    if (Math.hypot(sp.pos.x - p.pos.x, sp.pos.z - p.pos.z) < 1.4 && Math.abs(sp.pos.y - p.pos.y) < 1.4) {
      sp.state = 'carried'; sp.carrier = p.id; p.spike = true;
      this.emit({ t: 'spike', kind: 'pickup', p: { ...sp.pos }, id: p.id });
    }
  }

  private stepSpike(): void {
    const sp = this.spike;
    if (sp.state !== 'planted') return;
    const remaining = sp.explodeAt - this.time;
    if (this.time >= sp.nextBeep && remaining > 0) {
      this.emit({ t: 'spike', kind: 'beep', p: { ...sp.pos }, id: -1, remaining });
      sp.nextBeep += OBJECTIVE.beepInterval(remaining);
    }
    if (remaining <= 0) {
      sp.state = 'exploded';
      this.emit({ t: 'spike', kind: 'explode', p: { ...sp.pos }, id: -1 });
      for (const q of this.players) {
        if (!q.alive) continue;
        const d = Math.hypot(q.pos.x - sp.pos.x, q.pos.z - sp.pos.z);
        if (d > 16) continue;
        const dmg = d < 8 ? 400 : 400 * (1 - (d - 8) / 8);
        this.applyDamage(q, null, dmg, 0, 'chest', 'world', 'spike', false, false);
      }
      this.endRound(this.intSquad(), 'detonated');
    }
  }

  // ------------------------------------------------------------------ fires (thermite)
  private stepFires(): void {
    if (!this.fires.length) return;
    for (const f of this.fires) {
      for (const p of this.players) {
        if (!p.alive || !p.onGround) continue;
        const owner = this.players[f.owner];
        // Friendly utility damage is off except for the thrower.
        if (owner && p.side === owner.side && p.id !== owner.id) continue;
        let inFire = false;
        for (const c of f.cells) {
          if (Math.abs(c.x - p.pos.x) < 0.6 && Math.abs(c.z - p.pos.z) < 0.6 && Math.abs(c.y - p.pos.y) < 0.7) { inFire = true; break; }
        }
        if (inFire) this.applyDamage(p, owner ?? null, 15 * DT * 2.2, 0, 'leg', 'fire', 'fire', false, false);
      }
    }
    this.fires = this.fires.filter((f) => {
      if (this.time < f.until) return true;
      this.emit({ t: 'nade', kind: 'fireEnd', type: 'thermite', p: f.cells[0] ?? { x: 0, y: 0, z: 0 }, id: f.id, owner: f.owner, side: 'int' });
      return false;
    });
  }

  // ------------------------------------------------------------------ weapon firing
  private updateFire(p: Player, cmd: InputCmd): void {
    const press = cmd.fire && !p.firePrev;
    const altPress = cmd.alt && !p.altPrev;
    p.firePrev = cmd.fire;
    p.altPrev = cmd.alt;
    if (!this.fireAllowed()) return;

    // utility
    if (p.cur.startsWith('util')) {
      const i = Number(p.cur.slice(4));
      const type = p.util[i];
      if (type && this.time >= p.dropLock && (press || altPress)) {
        p.util.splice(i, 1);
        p.utilBought[type] = Math.max(0, (p.utilBought[type] ?? 1) - 1);
        // Thrown items can no longer be refunded.
        const pi = [...p.purchases].map((x) => x.item).lastIndexOf(type);
        if (pi >= 0) p.purchases.splice(pi, 1);
        throwGrenade(this, p, type, press ? 20 : 9);
        p.cur = p.prev;
        const nw = this.heldSlotWeapon(p);
        if (nw) nw.readyAt = this.time + 0.4;
        p.dropLock = this.time + 0.5;
      }
      return;
    }

    const w = this.heldSlotWeapon(p);
    if (!w) return;
    const def = WEAPONS[w.id];
    if (this.time < w.readyAt) return;

    // scope toggle
    if (def.scoped && altPress && !w.reloading) {
      w.scopeLevel = (w.scopeLevel + 1) % (def.scoped.zoomFov.length + 1);
      this.emit({ t: 'sfx', id: p.id, kind: 'scope', p: { ...p.pos }, weapon: w.id });
    }

    if (def.mode === 'melee') {
      if (this.time < w.nextFire) return;
      if (press || altPress) this.melee(p, w, def, altPress && !press);
      return;
    }

    // burst continuation
    if (w.burstLeft > 0 && this.time >= w.burstNext) {
      this.shoot(p, w, def);
      w.burstLeft--;
      w.burstNext = this.time + 60 / (def.burstRpm ?? 900);
      return;
    }

    const wantsFire = def.mode === 'auto' ? cmd.fire : press;
    if (!wantsFire || this.time < w.nextFire) return;
    if (w.reloading) {
      if (def.shellTime && w.mag > 0) { w.reloading = false; } else return;
    }
    if (w.mag <= 0) {
      if (press) { this.emit({ t: 'sfx', id: p.id, kind: 'dry', p: { ...p.pos }, weapon: w.id }); }
      if (w.reserve > 0) this.startReload(p);
      w.nextFire = this.time + 0.2;
      return;
    }
    this.shoot(p, w, def);
    if (def.mode === 'burst') {
      w.burstLeft = Math.min(def.burstCount! - 1, w.mag);
      w.burstNext = this.time + 60 / (def.burstRpm ?? 900);
      w.nextFire = this.time + (def.cycle ?? 0.4);
    } else if (def.mode === 'bolt' || def.mode === 'pump') {
      w.nextFire = this.time + (def.cycle ?? 1);
      if (def.mode === 'bolt') this.emit({ t: 'sfx', id: p.id, kind: 'bolt', p: { ...p.pos }, weapon: w.id });
    } else {
      w.nextFire = this.time + 60 / def.rpm;
    }
    if (w.mag === 0 && w.reserve > 0 && def.mode !== 'pump') this.startReload(p);
  }

  private melee(p: Player, w: WeaponState, def: WeaponDef, heavy: boolean): void {
    w.nextFire = this.time + (heavy ? 1.1 : 0.55);
    p.swing = this.time;
    this.emit({ t: 'sfx', id: p.id, kind: 'melee', p: { ...p.pos } });
    const eye = this.eyePos(p);
    const dir = dirFromAngles(p.yaw, p.pitch);
    let bestT = def.range;
    let target: Player | null = null;
    for (const q of this.players) {
      if (!q.alive || q.side === p.side) continue;
      const pose = this.poseOf(q);
      const hit = traceBullet(eye, dir, def.range, WEAPONS.tool, [{ id: q.id, pose }]);
      if (hit.hit && hit.hit.dist < bestT) { bestT = hit.hit.dist; target = q; }
    }
    if (!target) return;
    let dmg = heavy ? 75 : def.damage;
    // Strike from behind is far more damaging.
    const toAtt = Math.atan2(-(p.pos.x - target.pos.x), -(p.pos.z - target.pos.z));
    if (Math.abs(angleDiff(target.yaw, toAtt + Math.PI)) < 1.0) dmg *= 3;
    const ar = applyArmor(dmg, def, 'chest', { armor: target.armor, helmet: target.helmet });
    this.applyDamage(target, p, ar.health, ar.armorLoss, 'chest', 'bullet', 'tool', false, false);
  }

  /** One bullet (or shotgun volley) from the weapon. */
  private shoot(p: Player, w: WeaponState, def: WeaponDef): void {
    const time = this.time;
    const kick = kickNow(w, def, time);
    const hs = horizontalSpeed(p);
    // Seeded recoil deviation.
    const devP = (this.rng() * 2 - 1) * def.recoil.seedDev * (Math.PI / 180);
    const devY = (this.rng() * 2 - 1) * def.recoil.seedDev * (Math.PI / 180);
    const spread = computeSpread(p, w, def, time, hs);
    const eye = this.eyePos(p);
    const baseYaw = p.yaw + kick.yaw + devY;
    const basePitch = p.pitch + kick.pitch + devP;
    const cmd = p.lastCmd;
    let rewind = 0;
    if (p.controller === 'human' && cmd && isFinite(cmd.viewTick) && cmd.viewTick > 0) {
      rewind = clamp(Math.round(this.tick - cmd.viewTick), 0, MAX_REWIND_TICKS);
    }
    const rewTick = this.tick - rewind;
    const targets: TraceTarget[] = [];
    for (const q of this.players) {
      if (!q.alive || q.side === p.side) continue;
      targets.push({ id: q.id, pose: rewind > 0 ? this.poseAt(q, rewTick) : this.poseOf(q) });
    }

    let totalHits = new Map<number, { health: number; armor: number; zone: HitZone; wall: boolean; head: boolean; pellets: number }>();
    let firstEnd: Vec3 = eye;
    for (let i = 0; i < def.pellets; i++) {
      let yaw = baseYaw, pitch = basePitch;
      if (spread > 0) {
        const r = spread * Math.sqrt(this.rng());
        const a = this.rng() * Math.PI * 2;
        yaw += Math.cos(a) * r;
        pitch += Math.sin(a) * r;
      }
      const dir = dirFromAngles(yaw, pitch);
      const res = traceBullet(eye, dir, def.range, def, targets);
      if (i === 0) firstEnd = res.end;
      // Shootable pulse shards.
      this.shootShards(eye, dir, res.hit ? res.hit.dist : def.range);
      for (let k = 0; k < res.impacts.length; k++) {
        if (def.pellets > 1 && i > 2) break;
        this.emit({ t: 'impact', p: res.impacts[k].p, n: res.impacts[k].n, mat: res.impacts[k].mat });
      }
      if (res.hit) {
        const victim = this.players[res.hit.id];
        const raw = rawDamage(def, res.hit.zone, res.hit.dist, res.hit.penMult);
        const ar = applyArmor(raw, def, res.hit.zone, { armor: victim.armor, helmet: victim.helmet });
        const cur = totalHits.get(victim.id) ?? { health: 0, armor: 0, zone: res.hit.zone, wall: false, head: false, pellets: 0 };
        cur.health += ar.health; cur.armor += ar.armorLoss; cur.pellets++;
        cur.wall = cur.wall || res.hit.penetrated;
        if (res.hit.zone === 'head') { cur.head = true; cur.zone = 'head'; }
        totalHits.set(victim.id, cur);
      }
    }
    this.emit({ t: 'shot', id: p.id, weapon: def.id, o: eye, e: firstEnd, side: p.side });
    p.stats.shots++;

    for (const [vid, h] of totalHits) {
      const victim = this.players[vid];
      p.stats.hits++;
      this.applyDamage(victim, p, h.health, h.armor, h.zone, 'bullet', def.id, h.wall, h.head);
    }

    // update weapon state
    w.mag = Math.max(0, w.mag - 1);
    w.fresh = false;
    w.heat = Math.min(0.05, w.heat * Math.exp(-(time - w.lastShot) * 7) + def.spread.sustain);
    w.shots = Math.min(40, kickShotsAfter(w, def, time) + 1);
    w.lastShot = time;
    totalHits = new Map();
  }

  private shootShards(o: Vec3, d: Vec3, maxT: number): void {
    for (const g of this.grenades) {
      if (g.type !== 'pulse' || g.destroyed || !g.landed) continue;
      const ox = o.x - g.pos.x, oy = o.y - g.pos.y, oz = o.z - g.pos.z;
      const b = ox * d.x + oy * d.y + oz * d.z;
      const c = ox * ox + oy * oy + oz * oz - 0.2 * 0.2;
      const disc = b * b - c;
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < maxT && g.pulses < 2) {
        g.destroyed = true;
        this.emit({ t: 'nade', kind: 'pulseDestroyed', type: 'pulse', p: { ...g.pos }, id: g.id, owner: g.owner, side: g.side });
      }
    }
  }

  // ------------------------------------------------------------------ damage & kills
  applyDamage(victim: Player, attacker: Player | null, health: number, armorLoss: number, zone: HitZone, kind: 'bullet' | 'fire' | 'frag' | 'world', weapon: WeaponId | 'spike' | 'fire' | 'frag' | 'world', wall: boolean, head: boolean): void {
    if (!victim.alive || health <= 0) return;
    if (this.phase === 'roundEnd' && kind === 'bullet') return;
    if (attacker && attacker.id !== victim.id && attacker.side === victim.side) return; // team damage off in the slice
    const applied = Math.min(victim.hp, health);
    victim.hp -= health;
    if (armorLoss > 0) { victim.armor = Math.max(0, victim.armor - armorLoss); victim.armorFresh = false; }
    if (attacker && attacker.id !== victim.id) {
      attacker.stats.damage += applied;
      if (kind === 'frag' || kind === 'fire') attacker.stats.utilDamage += applied;
      const rec = victim.damagers.get(attacker.id) ?? { dmg: 0, t: this.time };
      rec.dmg += applied; rec.t = this.time;
      victim.damagers.set(attacker.id, rec);
    }
    const from = attacker ? { ...attacker.pos } : { ...victim.pos };
    victim.lastHurtDir = Math.atan2(-(from.x - victim.pos.x), -(from.z - victim.pos.z));
    this.emit({ t: 'hurt', victim: victim.id, dmg: applied, from, kind });
    const killed = victim.hp <= 0;
    if (attacker && attacker.id !== victim.id) this.emit({ t: 'hit', shooter: attacker.id, victim: victim.id, dmg: applied, head, killed });
    if (killed) this.killPlayer(victim, attacker, weapon, head, wall);
  }

  private killPlayer(victim: Player, killer: Player | null, weapon: WeaponId | 'spike' | 'fire' | 'frag' | 'world', head: boolean, wall: boolean): void {
    victim.alive = false;
    victim.hp = 0;
    victim.stats.deaths++;
    victim.killedRound = true;
    victim.interact = { kind: null, progress: 0 };
    if (this.spike.defuser === victim.id) { this.spike.defuser = -1; this.spike.defuseProgress = 0; }
    // drop gear
    if (victim.slots.primary) { this.spawnDrop(victim.slots.primary, victim, false); victim.slots.primary = null; }
    if (victim.spike) {
      victim.spike = false;
      this.spike.state = 'dropped';
      this.spike.pos = { x: victim.pos.x, y: victim.pos.y, z: victim.pos.z };
      this.spike.carrier = -1;
      this.emit({ t: 'spike', kind: 'drop', p: { ...victim.pos }, id: victim.id });
    }
    let assist = -1;
    if (killer && killer.id !== victim.id) {
      killer.stats.kills++;
      if (head) killer.stats.headshots++;
      killer.stats.score += 2;
      if (!this.firstKill) { this.firstKill = { killer: killer.id, victim: victim.id }; killer.stats.openingKills++; }
      const reward = weapon === 'frag' || weapon === 'fire' ? 300 : weapon in WEAPONS ? WEAPONS[weapon as WeaponId].killReward : 300;
      this.addMoney(killer, reward, 'Elimination');
      let best = 0;
      for (const [aid, rec] of victim.damagers) {
        if (aid === killer.id) continue;
        const a = this.players[aid];
        if (a.side !== killer.side) continue;
        if (this.time - rec.t < 8 && rec.dmg >= 30 && rec.dmg > best) { best = rec.dmg; assist = aid; }
      }
      if (assist >= 0) { this.players[assist].stats.assists++; this.players[assist].stats.score += 1; }
    }
    this.emit({ t: 'kill', killer: killer && killer.id !== victim.id ? killer.id : -1, victim: victim.id, weapon, head, wall, assist, pos: { ...victim.pos } });
  }

  // ------------------------------------------------------------------ round end checks
  private checkRoundEnd(): void {
    const intAlive = this.alive('int').length;
    const cusAlive = this.alive('cus').length;
    const sp = this.spike;
    const intSq = this.squadOf('int'), cusSq = this.squadOf('cus');
    if (this.phase === 'armed') {
      if (sp.state === 'defused') return; // endRound already called
      if (cusAlive === 0) { this.endRound(intSq, 'defendersEliminated'); return; }
      return; // detonation handled in stepSpike; attackers dead does not end the round
    }
    if (intAlive === 0 && cusAlive === 0) { this.endRound(cusSq, 'eliminated'); return; }
    if (cusAlive === 0) { this.endRound(intSq, 'eliminated'); return; }
    if (intAlive === 0) { this.endRound(cusSq, 'eliminated'); return; }
    if (this.time >= this.phaseEnds) this.endRound(cusSq, 'timeExpired');
  }

  // ------------------------------------------------------------------ queries used by bots & server
  /** Seconds remaining in the current phase (action clock / buy / bomb). */
  phaseRemaining(): number { return Math.max(0, this.phaseEnds - this.time); }

  isSmoked(a: Vec3, b: Vec3): boolean {
    for (const s of this.smokes) {
      if (this.time < s.bloomAt || this.time >= s.until) continue;
      if (segmentSphereLength(a, b, s.pos, s.radius) > 0.5) return true;
    }
    return false;
  }

  result(): { winner: 0 | 1 | -1; score: [number, number] } | null {
    if (this.phase !== 'matchEnd' || this.winnerSquad === null) return null;
    return { winner: this.winnerSquad, score: [this.score[0], this.score[1]] };
  }
}

/** Recoil index for the next shot (already decayed to `time`). */
function kickShotsAfter(w: WeaponState, def: WeaponDef, time: number): number {
  if (w.shots <= 0) return 0;
  const f = 1 - (time - w.lastShot) / Math.max(0.05, def.recoil.recovery);
  return f <= 0 ? 0 : w.shots * f;
}

export function segmentSphereLength(a: Vec3, b: Vec3, c: Vec3, r: number): number {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return 0;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const ox = a.x - c.x, oy = a.y - c.y, oz = a.z - c.z;
  const bb = ox * ux + oy * uy + oz * uz;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = bb * bb - cc;
  if (disc <= 0) return 0;
  const s = Math.sqrt(disc);
  const t0 = Math.max(0, -bb - s), t1 = Math.min(len, -bb + s);
  return Math.max(0, t1 - t0);
}

export function sanitizeCmd(c: InputCmd): boolean {
  const nums = [c.seq, c.viewTick, c.moveX, c.moveZ, c.yaw, c.pitch];
  for (const n of nums) if (typeof n !== 'number' || !isFinite(n)) return false;
  c.moveX = clamp(c.moveX, -1, 1);
  c.moveZ = clamp(c.moveZ, -1, 1);
  c.fire = !!c.fire; c.alt = !!c.alt; c.jump = !!c.jump; c.crouch = !!c.crouch; c.walk = !!c.walk; c.use = !!c.use;
  if (c.buy && (typeof c.buy.item !== 'string' || !isFinite(c.buy.req))) return false;
  if (c.refund && (typeof c.refund.item !== 'string' || !isFinite(c.refund.req))) return false;
  if (c.select !== undefined && typeof c.select !== 'string') return false;
  return true;
}

export function newMatch(opts: Partial<MatchConfig> = {}): Match {
  return new Match({
    seed: opts.seed ?? 1337,
    rules: opts.rules ?? RULESETS.quick,
    squad0Side: opts.squad0Side ?? 'int',
    humanIds: opts.humanIds ?? [],
    practice: opts.practice,
    names: opts.names,
  });
}

export { dist2, anglesFromDir, bodyHeight };
