// server-room: the authoritative match. Owns all mutable truth (movement,
// weapons, utility, objective, economy, rounds), consumes client intent,
// produces per-viewer filtered snapshots and reliable events.

import {
  ARMOR, DT, ECONOMY, FLASH, FRAG, MAX_UTILITY, PLAYER, PULSE, RULESET_VERSION, SMOKE, THERMITE, TICK_RATE, UTILITY,
  lossBonus, type MatchRules, type UtilityId,
} from '../content/rules';
import { WEAPONS, type WeaponDef, type WeaponId } from '../content/weapons';
import type { GameMap } from '../map/runtime';
import type { NavGrid } from '../map/nav';
import {
  BTN, type ActiveKind, type ClientRequest, type GameEvent, type InputCmd, type ItemId, type MatchResult,
  type Phase, type RoundRecord, type SelectReq, type Side, type Snapshot, type SnapPlayer, type SoundKind,
  type TeamIndex, type WinReason,
} from '../protocol/messages';
import { computeDamage, computeSpread, crouchScale, rayHitboxes, recoilOffset, shotDeviation, traceWorld, type HitboxPose, type Zone } from './combat';
import { stepGrenade, throwState } from './grenades';
import { DEG, clamp, dirFromAngles, vdist, vdistH, type Vec3 } from './math';
import { eyeHeight, stepMovement } from './movement';
import { Rng, hash32, hashString } from './rng';
import {
  emptyStats, type Drop, type Fire, type Grenade, type Player, type Purchase, type Shard, type Smoke, type SpikeState,
  type WeaponItem,
} from './state';
import { BotBrain, TeamPlanner } from '../bots/brain';

export interface SoundRecord {
  kind: SoundKind;
  x: number;
  y: number;
  z: number;
  src: number;
  team: TeamIndex;
  tick: number;
  radius: number;
}

export interface RoomOptions {
  rules: MatchRules;
  seed: number;
  map: GameMap;
  nav: NavGrid;
  humans: { name: string; team: TeamIndex }[];
  /** total players per team, bots fill */
  teamSize?: number;
  botDifficulty?: number;
  /** team index that starts on the Intrusion side */
  intrusionTeam?: TeamIndex;
  practiceDummies?: number;
}

type Audience = { kind: 'all' } | { kind: 'team'; team: TeamIndex } | { kind: 'player'; id: number } | { kind: 'near'; x: number; y: number; z: number; r: number };

const HISTORY_TICKS = Math.ceil(0.25 * TICK_RATE);
const MAX_REWIND_TICKS = Math.floor(0.2 * TICK_RATE);
const BOT_NAMES = ['Vesper', 'Halden', 'Quill', 'Marrow', 'Iskra', 'Tamsin', 'Okoro', 'Brandt', 'Lio', 'Senna', 'Juno', 'Petrov', 'Calla', 'Rhee'];

export class MatchRoom {
  readonly rules: MatchRules;
  readonly map: GameMap;
  readonly nav: NavGrid;
  readonly seed: number;
  readonly rng: Rng;
  tick = 0;
  phase: Phase = 'buy';
  phaseEnd = 0;
  round = 0;
  scores: [number, number] = [0, 0];
  teamSide: [Side, Side];
  lossTier: [number, number] = [0, 0];
  players: Player[] = [];
  grenades: Grenade[] = [];
  smokes: Smoke[] = [];
  fires: Fire[] = [];
  shards: Shard[] = [];
  drops: Drop[] = [];
  spike: SpikeState;
  sounds: SoundRecord[] = [];
  rounds: RoundRecord[] = [];
  result: MatchResult | null = null;
  lastRound: RoundRecord | null = null;
  roundFirstKill = false;
  roundArmed = false;
  roundPlanter = -1;
  roundKills: [number, number] = [0, 0];
  roundStartMoney: [number, number] = [0, 0];
  roundSpent: [number, number] = [0, 0];
  decisive = '';
  /** append-only replay log: inputs + requests, keyed by tick */
  replayLog: { tick: number; id: number; cmd?: InputCmd; req?: ClientRequest }[] = [];
  eventHash = 0;
  private outbox = new Map<number, GameEvent[]>();
  private history: { tick: number; poses: (HitboxPose & { alive: boolean })[] }[] = [];
  private nextId = 1;
  private brains = new Map<number, BotBrain>();
  planners: [TeamPlanner, TeamPlanner];
  private fireAccum = new Map<number, number>();
  private damageLocked = false;
  private visCache = new Map<string, { tick: number; v: boolean }>();
  readonly practice: boolean;

  constructor(o: RoomOptions) {
    this.rules = o.rules;
    this.map = o.map;
    this.nav = o.nav;
    this.seed = o.seed >>> 0;
    this.rng = new Rng(hash32(this.seed, 77));
    this.practice = o.rules.practice;
    const intr = o.intrusionTeam ?? 0;
    this.teamSide = intr === 0 ? ['intrusion', 'custodian'] : ['custodian', 'intrusion'];
    this.spike = { state: 'none', carrier: -1, pos: { x: 0, y: 0, z: 0 }, site: '', plantTick: 0, explodeTick: 0, dropId: -1, defuser: -1, seenBy: [false, false] };
    const teamSize = o.teamSize ?? 5;
    let nameIdx = hash32(this.seed) % BOT_NAMES.length;
    for (const h of o.humans) this.addPlayer(h.name, h.team, false, 0.5);
    for (const team of [0, 1] as TeamIndex[]) {
      let count = this.players.filter((p) => p.team === team).length;
      const target = this.practice ? (team === 1 ? o.practiceDummies ?? 5 : count) : teamSize;
      while (count < target) {
        const diff = clamp((o.botDifficulty ?? 0.55) + (this.rng.next() - 0.5) * 0.2, 0, 1);
        this.addPlayer(BOT_NAMES[nameIdx++ % BOT_NAMES.length], team, true, diff);
        count++;
      }
    }
    this.planners = [new TeamPlanner(this, 0), new TeamPlanner(this, 1)];
    for (const p of this.players) if (p.bot) this.brains.set(p.id, new BotBrain(this, p));
    for (const p of this.players) p.money = ECONOMY.start;
    this.startRound(true);
  }

  // ------------------------------------------------------------------ setup
  private addPlayer(name: string, team: TeamIndex, bot: boolean, difficulty: number): Player {
    const p: Player = {
      id: this.players.length,
      name,
      team,
      bot,
      difficulty,
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      onGround: true,
      crouchAmt: 0,
      crouchHeld: false,
      crouchToggleTicks: [],
      walking: false,
      landTick: -999,
      landPenalty: 0,
      lastJumpTick: -999,
      jumpHeldPrev: false,
      stepAccum: 0,
      alive: true,
      health: 100,
      armor: 0,
      helmet: false,
      kit: false,
      money: ECONOMY.start,
      primary: null,
      secondary: null,
      utils: [],
      hasSpike: false,
      active: 'secondary',
      utilIndex: 0,
      lastActive: 'tool',
      drawUntil: 0,
      nextAttack: 0,
      reloadStart: -1,
      reloadEnd: 0,
      reloadApplied: false,
      recoilIndex: 0,
      lastShotTick: -999,
      burstLeft: 0,
      burstMode: true,
      scopeLevel: 0,
      shotCounter: 0,
      primed: 0,
      armStart: -1,
      defuseStart: -1,
      flashUntil: 0,
      flashStart: 0,
      flashPeak: 0,
      prevButtons: 0,
      lastCmd: null,
      inputs: [],
      processedRids: new Set(),
      stats: emptyStats(),
      roundDamage: new Map(),
      lastKillTick: -999,
      lastKilledBy: -1,
      purchases: [],
      deathTick: -1,
      spectating: -1,
      rttMs: 0,
      respawnTick: -1,
      firingTick: -999,
    };
    this.players.push(p);
    if (!bot) this.outbox.set(p.id, []);
    return p;
  }

  sideOf(p: Player | TeamIndex): Side {
    const t = typeof p === 'number' ? p : p.team;
    return this.teamSide[t];
  }
  teamOfSide(side: Side): TeamIndex {
    return this.teamSide[0] === side ? 0 : 1;
  }
  get attackTeam(): TeamIndex {
    return this.teamOfSide('intrusion');
  }
  get defendTeam(): TeamIndex {
    return this.teamOfSide('custodian');
  }
  brainOf(id: number): BotBrain | undefined {
    return this.brains.get(id);
  }

  /** Test/harness only: let a bot brain drive a human seat (same input path). */
  enableAutopilot(id: number): void {
    const p = this.players[id];
    if (!p || this.brains.has(id)) return;
    const b = new BotBrain(this, p);
    b.onRoundStart();
    this.brains.set(id, b);
    this.autopilot.add(id);
  }
  readonly autopilot = new Set<number>();

  private newWeapon(id: WeaponId, buyer: number): WeaponItem {
    const d = WEAPONS[id];
    return { uid: this.nextId++, id, mag: d.mag, reserve: d.reserve, fired: false, buyer, boughtRound: this.round };
  }

  private clearInventory(p: Player): void {
    p.primary = null;
    p.secondary = this.newWeapon('vela', -1);
    p.utils = [];
    p.armor = 0;
    p.helmet = false;
    p.kit = false;
  }

  private spawnRect(side: Side): [number, number, number, number] {
    const reg = this.map.regionById(this.map.def.spawnRegions[side]);
    return reg ? reg.rect : [-1, -1, 1, 1];
  }

  inBuyZone(p: Player): boolean {
    if (this.practice) return true;
    const [x0, z0, x1, z1] = this.spawnRect(this.sideOf(p));
    return p.pos.x >= x0 && p.pos.x <= x1 && p.pos.z >= z0 && p.pos.z <= z1;
  }

  canBuy(p: Player): boolean {
    if (!p.alive) return false;
    if (this.practice) return true;
    return this.phase === 'buy' && this.inBuyZone(p);
  }

  // ------------------------------------------------------------------ rounds
  private startRound(first = false): void {
    const prevRound = this.round;
    this.round++;
    const r = this.rules;
    let resetEconomy = first;
    if (!first) {
      if (prevRound === r.halfRounds) {
        this.teamSide = [this.teamSide[1], this.teamSide[0]];
        resetEconomy = true;
        this.emit({ e: 'halftime' }, { kind: 'all' });
      } else if (prevRound === r.halfRounds * 2) {
        this.emit({ e: 'overtime' }, { kind: 'all' });
        for (const p of this.players) {
          p.money = ECONOMY.overtimeMoney;
          this.clearInventory(p);
        }
        this.lossTier = [0, 0];
      } else if (prevRound > r.halfRounds * 2 && (prevRound - r.halfRounds * 2) % r.overtimeHalf === 0) {
        this.teamSide = [this.teamSide[1], this.teamSide[0]];
        for (const p of this.players) {
          p.money = ECONOMY.overtimeMoney;
          this.clearInventory(p);
        }
        this.lossTier = [0, 0];
        this.emit({ e: 'halftime' }, { kind: 'all' });
      }
    }
    if (resetEconomy) {
      this.lossTier = [0, 0];
      for (const p of this.players) {
        p.money = this.rules.infiniteMoney ? 16000 : ECONOMY.start;
        this.clearInventory(p);
      }
    }
    this.grenades = [];
    this.smokes = [];
    this.fires = [];
    this.shards = [];
    this.drops = [];
    this.sounds = [];
    this.roundFirstKill = false;
    this.roundArmed = false;
    this.roundPlanter = -1;
    this.roundKills = [0, 0];
    this.roundSpent = [0, 0];
    this.decisive = '';
    this.damageLocked = false;

    const spawnIdx: Record<Side, number> = { intrusion: 0, custodian: 0 };
    const order = [...this.players].sort((a, b) => a.id - b.id);
    for (const p of order) {
      const side = this.sideOf(p);
      if (!p.alive) this.clearInventory(p);
      p.alive = true;
      p.health = 100;
      p.hasSpike = false;
      p.purchases = [];
      p.roundDamage.clear();
      p.armStart = -1;
      p.defuseStart = -1;
      p.flashUntil = 0;
      p.reloadStart = -1;
      p.primed = 0;
      p.recoilIndex = 0;
      p.scopeLevel = 0;
      p.burstLeft = 0;
      p.spectating = -1;
      p.deathTick = -1;
      const list = this.map.def.spawns[side];
      const sp = list[spawnIdx[side]++ % list.length];
      p.pos = { x: sp[0], y: this.map.floorHeight(sp[0], sp[1], 5), z: sp[1] };
      p.vel = { x: 0, y: 0, z: 0 };
      p.yaw = side === 'intrusion' ? 0 : Math.PI;
      p.pitch = 0;
      p.onGround = true;
      p.crouchAmt = 0;
      p.crouchHeld = false;
      p.active = p.primary ? 'primary' : 'secondary';
      p.lastActive = 'tool';
      p.drawUntil = this.tick + 8;
      if (this.practice && p.team === 1) this.setupDummy(p, spawnIdx.custodian - 1);
    }
    // spike to a seeded random attacker
    const attackers = order.filter((p) => p.team === this.attackTeam);
    if (attackers.length) {
      const carrier = attackers[this.rng.int(attackers.length)];
      const human = attackers.find((p) => !p.bot);
      const c = this.practice && human ? human : carrier;
      c.hasSpike = true;
      this.spike = { state: 'carried', carrier: c.id, pos: { ...c.pos }, site: '', plantTick: 0, explodeTick: 0, dropId: -1, defuser: -1, seenBy: [false, false] };
    } else {
      this.spike = { state: 'none', carrier: -1, pos: { x: 0, y: 0, z: 0 }, site: '', plantTick: 0, explodeTick: 0, dropId: -1, defuser: -1, seenBy: [false, false] };
    }
    this.roundStartMoney = [0, 1].map((t) => this.players.filter((p) => p.team === t).reduce((s, p) => s + p.money, 0)) as [number, number];
    if (this.practice) {
      this.phase = 'live';
      this.phaseEnd = Number.MAX_SAFE_INTEGER;
    } else {
      this.phase = 'buy';
      this.phaseEnd = this.tick + Math.round(this.rules.buyTime * TICK_RATE);
    }
    this.planners[0].onRoundStart();
    this.planners[1].onRoundStart();
    for (const b of this.brains.values()) b.onRoundStart();
    this.emit({ e: 'roundStart', round: this.round }, { kind: 'all' });
  }

  private setupDummy(p: Player, idx: number): void {
    const spots: [number, number, number][] = [
      [-35, 9, Math.PI],
      [-30, 6, -Math.PI / 2],
      [-4, -6, Math.PI],
      [34, 6, Math.PI],
      [17, -2, -Math.PI / 2],
      [-38, -16, Math.PI],
    ];
    const s = spots[((idx % spots.length) + spots.length) % spots.length];
    p.practiceSpawn = { x: s[0], z: s[1], yaw: s[2] };
    p.pos = { x: s[0], y: this.map.floorHeight(s[0], s[1], 5), z: s[1] };
    p.yaw = s[2];
    p.armor = 100;
    p.helmet = idx % 2 === 0;
  }

  private endRound(winner: TeamIndex, reason: WinReason): void {
    if (this.phase === 'roundEnd' || this.phase === 'matchEnd') return;
    this.damageLocked = true;
    const winnerSide = this.teamSide[winner];
    const loser: TeamIndex = winner === 0 ? 1 : 0;
    this.scores[winner]++;
    // ---- economy ----
    const e = ECONOMY;
    this.lossTier[loser] = Math.min(4, this.lossTier[loser] + 1);
    const lb = lossBonus(this.lossTier[loser]);
    this.lossTier[winner] = Math.max(0, this.lossTier[winner] - 1);
    for (const p of this.players) {
      if (p.team === winner) this.addMoney(p, e.win);
      else {
        let bonus = lb;
        if (reason === 'time' && this.sideOf(p) === 'intrusion' && p.alive && !this.roundArmed) bonus = Math.round(lb * e.timeoutSurvivorLossMult);
        this.addMoney(p, bonus);
      }
      if (this.roundArmed && this.sideOf(p) === 'intrusion') this.addMoney(p, e.plantTeam);
      if (p.alive) p.stats.roundsSurvived++;
    }
    const rec: RoundRecord = {
      round: this.round,
      winner,
      winnerSide,
      reason,
      armed: this.roundArmed,
      site: this.spike.site,
      decisive: this.decisive || describeReason(reason, winnerSide),
      money: this.roundStartMoney,
      spent: this.roundSpent,
      kills: this.roundKills,
    };
    this.rounds.push(rec);
    this.lastRound = rec;
    this.emit({ e: 'roundEnd', record: rec }, { kind: 'all' });
    const over = this.matchOver();
    this.phase = 'roundEnd';
    const halftime = this.round === this.rules.halfRounds;
    this.phaseEnd = this.tick + Math.round((this.rules.roundEndTime + (halftime && !over ? this.rules.halftimeExtra : 0)) * TICK_RATE);
    if (over) this.finishMatch();
  }

  private matchOver(): boolean {
    const r = this.rules;
    const [a, b] = this.scores;
    const hi = Math.max(a, b);
    const lead = Math.abs(a - b);
    if (hi >= r.winRounds && lead >= r.winBy) return true;
    if (this.round >= r.maxRounds) return true;
    // regulation clinch: a team that cannot be caught (e.g. 9-x with x <= 7 handled by lead)
    return false;
  }

  private finishMatch(): void {
    const [a, b] = this.scores;
    const winner: TeamIndex | -1 = a === b ? -1 : a > b ? 0 : 1;
    const body = {
      matchId: `LP-${this.seed.toString(16)}-${this.map.hash.slice(-8)}`,
      ruleset: RULESET_VERSION,
      mapHash: this.map.hash,
      rules: this.rules.id,
      seed: this.seed,
      winner,
      scores: [a, b] as [number, number],
      rounds: this.rounds,
      players: this.players.map((p) => ({ id: p.id, name: p.name, team: p.team, bot: p.bot, stats: { ...p.stats } })),
      durationTicks: this.tick,
    };
    // Local rooms sign with a fixed dev key. A hosted room would use an HMAC
    // with a room credential issued by the match service.
    const signature = hashString('local-room-key|' + JSON.stringify(body)).toString(16).padStart(8, '0');
    this.result = { ...body, signature };
    this.emit({ e: 'matchEnd', result: this.result }, { kind: 'all' });
  }

  private addMoney(p: Player, amount: number): void {
    if (this.rules.infiniteMoney) {
      p.money = 16000;
      return;
    }
    p.money = clamp(p.money + amount, 0, ECONOMY.cap);
  }

  // ------------------------------------------------------------------ io
  submitInput(id: number, cmd: InputCmd): void {
    const p = this.players[id];
    if (!p || p.bot) return;
    // schema-ish validation and quotas
    if (!Number.isFinite(cmd.yaw) || !Number.isFinite(cmd.pitch) || !Number.isFinite(cmd.buttons)) return;
    if (p.lastCmd && cmd.seq <= p.lastCmd.seq) return; // duplicate / out of order
    if (p.inputs.length > 8) p.inputs.shift(); // bounded backlog
    p.inputs.push(cmd);
  }

  submitRequest(id: number, req: ClientRequest): void {
    const p = this.players[id];
    if (!p) return;
    if (p.processedRids.has(req.rid)) return; // idempotent
    p.processedRids.add(req.rid);
    this.replayLog.push({ tick: this.tick, id, req });
    switch (req.kind) {
      case 'buy':
        this.buy(p, req.item);
        break;
      case 'refund':
        this.refund(p, req.item);
        break;
      case 'drop':
        this.dropActive(p);
        break;
      case 'radio':
        this.radio(p, req.text.slice(0, 80));
        break;
    }
  }

  radio(p: Player, text: string): void {
    this.emit({ e: 'radio', src: p.id, team: p.team, text }, { kind: 'team', team: p.team });
  }

  drainEvents(id: number): GameEvent[] {
    const box = this.outbox.get(id);
    if (!box) return [];
    const out = box.slice();
    box.length = 0;
    return out;
  }

  private emit(ev: GameEvent, aud: Audience): void {
    this.eventHash = hash32(this.eventHash, hashString(ev.e), this.tick);
    for (const [id, box] of this.outbox) {
      const p = this.players[id];
      if (aud.kind === 'all') box.push(ev);
      else if (aud.kind === 'team' && p.team === aud.team) box.push(ev);
      else if (aud.kind === 'player' && aud.id === id) box.push(ev);
      else if (aud.kind === 'near') {
        const v = this.viewerOf(p);
        const dx = v.pos.x - aud.x;
        const dy = v.pos.y - aud.y;
        const dz = v.pos.z - aud.z;
        if (dx * dx + dy * dy + dz * dz <= aud.r * aud.r) box.push(ev);
      }
    }
    if (box_limit_exceeded(this.outbox)) for (const b of this.outbox.values()) if (b.length > 4000) b.splice(0, b.length - 4000);
  }

  private sound(kind: SoundKind, pos: Vec3, src: Player | null, radius: number, extra: { mat?: string; weapon?: string } = {}): void {
    const rec: SoundRecord = { kind, x: pos.x, y: pos.y, z: pos.z, src: src ? src.id : -1, team: src ? src.team : 0, tick: this.tick, radius };
    this.sounds.push(rec);
    if (this.sounds.length > 256) this.sounds.splice(0, this.sounds.length - 256);
    this.emit({ e: 'sound', kind, x: pos.x, y: pos.y, z: pos.z, src: rec.src, radius, ...extra }, { kind: 'near', x: pos.x, y: pos.y, z: pos.z, r: radius });
  }

  /** the player whose perspective a client is currently using */
  viewerOf(p: Player): Player {
    if (p.alive) return p;
    const t = this.players[p.spectating];
    return t && t.alive && t.team === p.team ? t : p;
  }

  // ------------------------------------------------------------------ tick
  step(): void {
    this.tick++;
    const t = this.tick;
    // phase transitions
    if (this.phase === 'buy' && t >= this.phaseEnd) {
      this.phase = 'live';
      this.phaseEnd = t + Math.round(this.rules.roundTime * TICK_RATE);
      this.emit({ e: 'buyEnd', round: this.round }, { kind: 'all' });
    } else if (this.phase === 'roundEnd' && t >= this.phaseEnd) {
      if (this.result) {
        this.phase = 'matchEnd';
      } else {
        this.startRound();
      }
    }
    if (this.phase === 'matchEnd') return;

    if (this.phase === 'buy') this.planners.forEach((pl) => pl.update());
    else this.planners.forEach((pl) => pl.update());

    for (const p of this.players) {
      let cmd: InputCmd | null;
      if (p.bot || this.autopilot.has(p.id)) {
        cmd = p.alive ? this.brains.get(p.id)!.think() : null;
      } else {
        cmd = p.inputs.shift() ?? (p.lastCmd ? { ...p.lastCmd, select: null } : null);
        if (cmd) this.replayLog.push({ tick: t, id: p.id, cmd });
      }
      if (cmd) {
        p.lastCmd = cmd;
        if (p.alive) this.processPlayer(p, cmd);
        else this.processSpectator(p, cmd);
      }
    }
    this.updateGrenades();
    this.updateEffects();
    this.updateSpike();
    this.checkRoundState();
    this.pushHistory();
    if (this.practice) this.practiceUpkeep();
  }

  private practiceUpkeep(): void {
    for (const p of this.players) {
      if (p.team === 1 && !p.alive && p.respawnTick > 0 && this.tick >= p.respawnTick) {
        p.alive = true;
        p.health = 100;
        p.respawnTick = -1;
        const s = p.practiceSpawn!;
        p.pos = { x: s.x, y: this.map.floorHeight(s.x, s.z, 5), z: s.z };
        p.vel = { x: 0, y: 0, z: 0 };
        p.armor = 100;
      }
      if (!p.bot && !p.alive && p.deathTick > 0 && this.tick - p.deathTick > TICK_RATE * 3) {
        p.alive = true;
        p.health = 100;
        const sp = this.map.def.spawns.intrusion[0];
        p.pos = { x: sp[0], y: 0, z: sp[1] };
        p.deathTick = -1;
        if (!p.secondary) p.secondary = this.newWeapon('vela', -1);
        p.active = p.primary ? 'primary' : 'secondary';
      }
    }
    if ((this.spike.state === 'detonated' || this.spike.state === 'defused') && this.tick - this.spike.explodeTick > TICK_RATE * 3) {
      const human = this.players.find((p) => !p.bot);
      if (human) {
        human.hasSpike = true;
        this.spike = { state: 'carried', carrier: human.id, pos: { ...human.pos }, site: '', plantTick: 0, explodeTick: 0, dropId: -1, defuser: -1, seenBy: [false, false] };
      }
    }
    for (const p of this.players) {
      if (p.team === 0 && !p.bot) {
        p.money = 16000;
        for (const w of [p.primary, p.secondary]) if (w) w.reserve = WEAPONS[w.id].reserve;
      }
    }
  }

  private processSpectator(p: Player, cmd: InputCmd): void {
    const pressed = cmd.buttons & ~p.prevButtons;
    p.prevButtons = cmd.buttons;
    const mates = this.players.filter((q) => q.team === p.team && q.alive && q.id !== p.id);
    if (!mates.length) {
      p.spectating = -1;
      return;
    }
    let idx = mates.findIndex((q) => q.id === p.spectating);
    if (idx < 0) idx = 0;
    if (pressed & BTN.FIRE || cmd.select === 'next') idx = (idx + 1) % mates.length;
    if (pressed & BTN.ALT || cmd.select === 'prev') idx = (idx - 1 + mates.length) % mates.length;
    p.spectating = mates[idx].id;
  }

  private processPlayer(p: Player, cmd: InputCmd): void {
    const t = this.tick;
    const buttons = cmd.buttons;
    const pressed = buttons & ~p.prevButtons;
    p.prevButtons = buttons;
    p.yaw = cmd.yaw;
    p.pitch = clamp(cmd.pitch, -89 * DEG, 89 * DEG);
    if (cmd.select) this.select(p, cmd.select);

    // objective interaction locks movement
    const useHeld = (buttons & BTN.USE) !== 0;
    this.handleObjective(p, useHeld, (buttons & BTN.FIRE) !== 0 && p.active === 'spike');
    const busy = p.armStart >= 0 || p.defuseStart >= 0;
    const def = this.activeDef(p);
    let maxSpeed = def ? def.moveSpeed : 5.2;
    if (p.scopeLevel > 0) maxSpeed *= 0.55;
    const clampRect = this.phase === 'buy' ? this.spawnRect(this.sideOf(p)) : null;
    const frozen = busy || this.phase === 'matchEnd';
    const landed = stepMovement(this.map, p, buttons, DT, { maxSpeed, frozen, clampRect, tick: t });
    if (this.practice && p.bot) {
      p.yaw = p.practiceSpawn?.yaw ?? p.yaw;
    }

    // ---- footsteps & landing (tactical audio) ----
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (p.onGround && sp > 0.3) {
      p.stepAccum += sp * DT;
      const quiet = p.walking || p.crouchAmt > 0.5;
      const stride = quiet ? 1.4 : 1.75;
      if (p.stepAccum >= stride) {
        p.stepAccum = 0;
        const floorMat = this.surfaceMat(p.pos);
        if (!quiet && sp > 3.0) this.sound('step', p.pos, p, 20, { mat: floorMat });
        else this.sound('gear', p.pos, p, 3.5, { mat: floorMat });
      }
    }
    if (landed > 3.5) this.sound('land', p.pos, p, 16, { mat: this.surfaceMat(p.pos) });

    // pickups (auto when walking over, E to swap)
    this.handlePickups(p, (pressed & BTN.USE) !== 0 && p.defuseStart < 0 && p.armStart < 0);

    if (busy) {
      p.reloadStart = -1;
      return;
    }
    this.handleWeapon(p, buttons, pressed, cmd);
    // recoil recovery
    if (def) {
      const since = (t - p.lastShotTick) * DT;
      if (since > (60 / def.rpm) * 1.25 && p.recoilIndex > 0) {
        p.recoilIndex = Math.max(0, p.recoilIndex - (DT * 10) / def.recoilRecovery);
      }
    }
  }

  private surfaceMat(pos: Vec3): string {
    const reg = this.map.regionAt(pos.x, pos.z);
    if (!reg) return 'concrete';
    if (reg.style === 'lab') return 'tile';
    if (reg.floor > 0 && reg.style === 'hall') return 'metal';
    if (reg.style === 'yard' || reg.style === 'lane') return 'gravel';
    return 'concrete';
  }

  activeDef(p: Player): WeaponDef | null {
    switch (p.active) {
      case 'primary':
        return p.primary ? WEAPONS[p.primary.id] : null;
      case 'secondary':
        return p.secondary ? WEAPONS[p.secondary.id] : null;
      case 'tool':
        return WEAPONS.tool;
      default:
        return null;
    }
  }
  activeItem(p: Player): WeaponItem | null {
    return p.active === 'primary' ? p.primary : p.active === 'secondary' ? p.secondary : null;
  }

  private available(p: Player): ActiveKind[] {
    const out: ActiveKind[] = [];
    if (p.primary) out.push('primary');
    if (p.secondary) out.push('secondary');
    out.push('tool');
    if (p.utils.length) out.push('util');
    if (p.hasSpike) out.push('spike');
    return out;
  }

  setActive(p: Player, kind: ActiveKind, utilIndex = p.utilIndex): void {
    if (kind === p.active && (kind !== 'util' || utilIndex === p.utilIndex)) return;
    if (kind === 'primary' && !p.primary) return;
    if (kind === 'secondary' && !p.secondary) return;
    if (kind === 'util' && !p.utils[utilIndex]) return;
    if (kind === 'spike' && !p.hasSpike) return;
    if (p.active !== kind) p.lastActive = p.active;
    p.active = kind;
    p.utilIndex = utilIndex;
    const def = this.activeDef(p);
    p.drawUntil = this.tick + Math.round((def ? def.drawTime : 0.45) * TICK_RATE);
    p.reloadStart = -1;
    p.scopeLevel = 0;
    p.primed = 0;
    p.burstLeft = 0;
  }

  private select(p: Player, s: SelectReq): void {
    switch (s) {
      case 'primary':
        this.setActive(p, 'primary');
        break;
      case 'secondary':
        this.setActive(p, 'secondary');
        break;
      case 'tool':
        if (p.active === 'tool' && p.hasSpike) this.setActive(p, 'spike');
        else this.setActive(p, 'tool');
        break;
      case 'util0':
      case 'util1':
      case 'util2':
      case 'util3':
        this.setActive(p, 'util', Number(s.slice(4)));
        break;
      case 'last': {
        const k = p.lastActive;
        if (this.available(p).includes(k)) this.setActive(p, k);
        break;
      }
      case 'next':
      case 'prev': {
        const av = this.available(p);
        const i = av.indexOf(p.active);
        const j = (i + (s === 'next' ? 1 : -1) + av.length) % av.length;
        this.setActive(p, av[j], 0);
        break;
      }
    }
  }

  // ------------------------------------------------------------------ weapons
  private handleWeapon(p: Player, buttons: number, pressed: number, cmd: InputCmd): void {
    const t = this.tick;
    const now = t * DT;
    const fireHeld = (buttons & BTN.FIRE) !== 0;
    const firePressed = (pressed & BTN.FIRE) !== 0;
    const altPressed = (pressed & BTN.ALT) !== 0;
    const canShoot = this.phase !== 'buy' && !this.damageLocked;

    if (p.active === 'util') {
      if (t < p.drawUntil || !canShoot) return;
      if (!p.primed) {
        if (firePressed) p.primed = 1;
        else if (altPressed) p.primed = 2;
      } else {
        const held = p.primed === 1 ? BTN.FIRE : BTN.ALT;
        if (!(buttons & held)) {
          this.throwUtility(p, p.primed === 2);
          p.primed = 0;
        }
      }
      return;
    }
    if (p.active === 'spike') return;
    const def = this.activeDef(p);
    if (!def) return;
    const item = this.activeItem(p);

    // reload progress
    if (p.reloadStart >= 0 && item) {
      if (def.reloadType === 'mag') {
        const frac = (t - p.reloadStart) / Math.max(1, p.reloadEnd - p.reloadStart);
        if (!p.reloadApplied && frac >= def.magInAt) {
          const need = def.mag - item.mag;
          const take = Math.min(need, item.reserve);
          item.mag += take;
          item.reserve -= take;
          p.reloadApplied = true;
        }
        if (t >= p.reloadEnd) p.reloadStart = -1;
        else return;
      } else {
        // shell by shell, interruptible by fire
        if (firePressed && item.mag > 0) p.reloadStart = -1;
        else if (t >= p.reloadEnd) {
          if (item.reserve > 0 && item.mag < def.mag) {
            item.mag++;
            item.reserve--;
            this.sound('reload', p.pos, p, 8);
          }
          if (item.mag < def.mag && item.reserve > 0) {
            p.reloadStart = t;
            p.reloadEnd = t + Math.round(def.reloadTime * TICK_RATE);
          } else p.reloadStart = -1;
          return;
        } else return;
      }
    }
    if (t < p.drawUntil) return;

    // alternate fire
    if (altPressed) {
      if (def.scope) {
        p.scopeLevel = (p.scopeLevel + 1) % (def.scope.fovs.length + 1);
        this.sound('scope', p.pos, p, 6);
      } else if (def.burst) {
        p.burstMode = !p.burstMode;
      }
    }

    const wantReload = (pressed & BTN.RELOAD) !== 0;
    if (item && wantReload && item.mag < def.mag && item.reserve > 0) {
      this.startReload(p, def);
      return;
    }

    if (def.mode === 'melee') {
      if (!canShoot) return;
      const altHeld = (buttons & BTN.ALT) !== 0;
      if ((fireHeld || altHeld) && now >= p.nextAttack) {
        const heavy = altHeld && !fireHeld;
        this.melee(p, def, heavy, cmd);
        p.nextAttack = now + (heavy ? def.melee!.altInterval : def.melee!.interval);
      }
      return;
    }
    if (!item) return;
    if (!canShoot) return;

    const interval = 60 / def.rpm;
    let shoot = false;
    if (def.mode === 'auto') shoot = fireHeld && now + 1e-9 >= p.nextAttack;
    else if (def.mode === 'burst') {
      if (p.burstLeft > 0 && now + 1e-9 >= p.nextAttack) shoot = true;
      else if (firePressed && now + 1e-9 >= p.nextAttack) {
        p.burstLeft = p.burstMode ? def.burst!.count : 1;
        shoot = true;
      }
    } else shoot = firePressed && now + 1e-9 >= p.nextAttack;

    if (shoot) {
      if (item.mag <= 0) {
        p.burstLeft = 0;
        if (firePressed) {
          this.sound('empty', p.pos, p, 5);
          if (item.reserve > 0) this.startReload(p, def);
        }
        p.nextAttack = now + 0.2;
        return;
      }
      this.fireWeapon(p, def, item, cmd);
      if (def.mode === 'burst') {
        p.burstLeft--;
        if (p.burstLeft > 0) p.nextAttack = now + def.burst!.interval;
        else p.nextAttack = now + (p.burstMode ? def.burst!.cooldown : interval);
      } else {
        if (now - p.nextAttack > DT) p.nextAttack = now;
        p.nextAttack += interval;
      }
      if (def.mode === 'bolt' && p.scopeLevel > 0) {
        p.scopeLevel = 0; // re-chamber unscopes
      }
      if (item.mag === 0 && item.reserve > 0 && def.mode !== 'auto') this.startReload(p, def);
    }
  }

  private startReload(p: Player, def: WeaponDef): void {
    p.reloadStart = this.tick;
    p.reloadEnd = this.tick + Math.round(def.reloadTime * TICK_RATE);
    p.reloadApplied = false;
    p.scopeLevel = 0;
    p.burstLeft = 0;
    this.sound('reload', p.pos, p, 9);
  }

  eyePos(p: Player): Vec3 {
    return { x: p.pos.x, y: p.pos.y + eyeHeight(p.crouchAmt), z: p.pos.z };
  }

  spreadOf(p: Player): number {
    const def = this.activeDef(p);
    if (!def || def.mode === 'melee') return 0;
    return computeSpread(def, {
      speedH: Math.hypot(p.vel.x, p.vel.z),
      onGround: p.onGround,
      crouchAmt: p.crouchAmt,
      landPenalty: p.landPenalty,
      recoilIndex: p.recoilIndex,
      scoped: p.scopeLevel > 0,
    });
  }

  private posesAt(tick: number): (HitboxPose & { alive: boolean })[] | null {
    for (let i = this.history.length - 1; i >= 0; i--) if (this.history[i].tick === tick) return this.history[i].poses;
    return null;
  }

  /** Lag-compensation target tick for a shot from this command. Never rewinds the shooter. */
  rewindTick(p: Player, cmd: InputCmd): number {
    if (p.bot) return this.tick;
    const want = Math.round(cmd.viewTick);
    return clamp(want, this.tick - MAX_REWIND_TICKS, this.tick);
  }

  private fireWeapon(p: Player, def: WeaponDef, item: WeaponItem, cmd: InputCmd): void {
    const origin = this.eyePos(p);
    const rec = recoilOffset(def, p.recoilIndex);
    const inacc = this.spreadOf(p);
    const shot = p.shotCounter++;
    const pellets = def.pellets ?? 1;
    const rewind = this.rewindTick(p, cmd);
    const poses = rewind < this.tick ? this.posesAt(rewind) : null;
    p.stats.shots++;
    let anyHit = false;
    for (let k = 0; k < pellets; k++) {
      const dev = shotDeviation(this.seed, p.id, shot, k, inacc + (def.pelletSpread ?? 0) * (k > 0 ? 1 : 0.4), def.recoilJitter);
      const d = dirFromAngles(p.yaw + rec.yaw + dev.dyaw, p.pitch + rec.pitch + dev.dpitch);
      const res = this.traceShot(p, origin, d, def, poses);
      if (res.hit) anyHit = true;
      if (k < 3) {
        this.emit(
          { e: 'shot', src: p.id, weapon: def.id, ox: origin.x, oy: origin.y, oz: origin.z, ex: res.end.x, ey: res.end.y, ez: res.end.z, tracer: k === 0 },
          { kind: 'near', x: origin.x, y: origin.y, z: origin.z, r: 90 },
        );
      }
    }
    if (anyHit) p.stats.hits++;
    item.mag--;
    item.fired = true;
    p.recoilIndex += 1;
    p.lastShotTick = this.tick;
    p.firingTick = this.tick;
    this.sound('shot', origin, p, 55, { weapon: def.id });
  }

  private traceShot(p: Player, o: Vec3, d: Vec3, def: WeaponDef, poses: (HitboxPose & { alive: boolean })[] | null): { end: Vec3; hit: boolean } {
    const segs = traceWorld(this.map, o, d, def.range, def.penetration);
    const ff = false; // team damage off in Unranked MVP
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      // players
      let best: { q: Player; t: number; zone: Zone } | null = null;
      for (const q of this.players) {
        if (q === p || !q.alive) continue;
        if (!ff && q.team === p.team) continue;
        const pose = poses ? poses[q.id] : null;
        const hp: HitboxPose = pose && pose.alive ? pose : { x: q.pos.x, y: q.pos.y, z: q.pos.z, yaw: q.yaw, crouch: q.crouchAmt };
        const h = rayHitboxes(o, d, hp, seg.to);
        if (h && h.t >= seg.from - 0.01 && (!best || h.t < best.t)) best = { q, t: h.t, zone: h.zone };
      }
      // enemy pulse shards are destructible
      for (const s of this.shards) {
        if (!s.alive || s.team === p.team) continue;
        const ts = raySphere(o, d, s.pos, 0.22);
        if (ts !== null && ts >= seg.from && ts <= seg.to && (!best || ts < best.t)) {
          s.alive = false;
          this.emit({ e: 'shardBroken', x: s.pos.x, y: s.pos.y, z: s.pos.z }, { kind: 'all' });
        }
      }
      if (best) {
        const end = { x: o.x + d.x * best.t, y: o.y + d.y * best.t, z: o.z + d.z * best.t };
        this.applyBulletDamage(p, best.q, def, best.zone, best.t, seg.powerMul, si > 0);
        this.emit({ e: 'impact', x: end.x, y: end.y, z: end.z, nx: -d.x, ny: -d.y, nz: -d.z, mat: 'flesh', flesh: true }, { kind: 'near', x: end.x, y: end.y, z: end.z, r: 60 });
        return { end, hit: true };
      }
      if (seg.hit) {
        const h = seg.hit;
        this.emit({ e: 'impact', x: h.x, y: h.y, z: h.z, nx: h.nx, ny: h.ny, nz: h.nz, mat: this.map.boxes[seg.hitBox].mat, flesh: false }, { kind: 'near', x: h.x, y: h.y, z: h.z, r: 60 });
        if (si === segs.length - 1) return { end: { x: h.x, y: h.y, z: h.z }, hit: false };
      } else {
        return { end: { x: o.x + d.x * seg.to, y: o.y + d.y * seg.to, z: o.z + d.z * seg.to }, hit: false };
      }
    }
    const last = segs[segs.length - 1];
    return { end: { x: o.x + d.x * last.to, y: o.y + d.y * last.to, z: o.z + d.z * last.to }, hit: false };
  }

  private applyBulletDamage(src: Player, dst: Player, def: WeaponDef, zone: Zone, dist: number, powerMul: number, wall: boolean): void {
    if (this.damageLocked) return;
    const r = computeDamage(def, zone, dist, powerMul, dst.armor, dst.helmet);
    dst.armor = Math.max(0, dst.armor - r.armorLoss);
    this.markArmorDamaged(dst);
    this.damage(src, dst, r.health, def.name, zone === 'head', wall, zone, r.armored, false);
  }

  private markArmorDamaged(p: Player): void {
    // armor damage voids armor refunds
    for (const pu of p.purchases) if (pu.item === 'vest' || pu.item === 'vesthelm') pu.price = -Math.abs(pu.price);
  }

  private melee(p: Player, def: WeaponDef, heavy: boolean, cmd: InputCmd): void {
    const o = this.eyePos(p);
    const d = dirFromAngles(p.yaw, p.pitch);
    const range = def.melee!.range;
    const wall = this.map.raycast(o, d, range);
    const maxT = wall ? wall.t : range;
    let best: { q: Player; t: number; zone: Zone } | null = null;
    for (const q of this.players) {
      if (q === p || !q.alive || q.team === p.team) continue;
      const h = rayHitboxes(o, d, { x: q.pos.x, y: q.pos.y, z: q.pos.z, yaw: q.yaw, crouch: q.crouchAmt }, maxT);
      if (h && (!best || h.t < best.t)) best = { q, t: h.t, zone: h.zone };
    }
    this.sound('melee', o, p, 8);
    if (!best || this.damageLocked || this.phase === 'buy') return;
    const q = best.q;
    const fwdQ = dirFromAngles(q.yaw, 0);
    const behind = fwdQ.x * d.x + fwdQ.z * d.z > 0.55;
    let dmg = heavy ? def.melee!.altDamage : def.melee!.damage;
    if (behind) dmg *= 2.1;
    const armored = q.armor > 0;
    let hp = armored ? dmg * def.armorPen : dmg;
    if (armored) q.armor = Math.max(0, q.armor - Math.round(dmg * 0.1));
    hp = Math.round(hp);
    this.emit({ e: 'impact', x: o.x + d.x * best.t, y: o.y + d.y * best.t, z: o.z + d.z * best.t, nx: -d.x, ny: -d.y, nz: -d.z, mat: 'flesh', flesh: true }, { kind: 'all' });
    this.damage(p, q, hp, def.name, false, false, best.zone, armored, false);
  }

  /** Central damage application: stats, assists, kill credit, events. */
  damage(src: Player | null, dst: Player, amount: number, weapon: string, head: boolean, wall: boolean, zone: string, armored: boolean, utility: boolean): void {
    if (!dst.alive || this.damageLocked) return;
    const dealt = Math.min(dst.health, amount);
    dst.health -= amount;
    if (src && src.team !== dst.team) {
      src.stats.damage += dealt;
      if (utility) src.stats.utilityDamage += dealt;
      const rd = dst.roundDamage.get(src.id) ?? { dmg: 0, tick: 0 };
      rd.dmg += dealt;
      rd.tick = this.tick;
      dst.roundDamage.set(src.id, rd);
    }
    const kill = dst.health <= 0;
    if (src) this.emit({ e: 'hit', src: src.id, dst: dst.id, dmg: dealt, zone, head, kill, armor: armored, wall }, { kind: 'player', id: src.id });
    const from = src ? src.pos : dst.pos;
    this.emit({ e: 'hurt', dst: dst.id, src: src ? src.id : -1, dmg: dealt, fromX: from.x, fromZ: from.z }, { kind: 'player', id: dst.id });
    this.brains.get(dst.id)?.onHurt(src);
    if (kill) this.kill(dst, src, weapon, head, wall);
  }

  private kill(v: Player, k: Player | null, weapon: string, head: boolean, wall: boolean): void {
    v.alive = false;
    v.health = 0;
    v.deathTick = this.tick;
    v.stats.deaths++;
    v.armStart = -1;
    v.defuseStart = -1;
    this.roundKills[v.team === 0 ? 1 : 0]++;
    // assists: others who dealt >= 40 this round
    let assister = -1;
    let bestA = 39;
    for (const [aid, rd] of v.roundDamage) {
      if (k && aid === k.id) continue;
      if (rd.dmg > bestA && this.players[aid].team !== v.team) {
        bestA = rd.dmg;
        assister = aid;
      }
    }
    if (assister >= 0) this.players[assister].stats.assists++;
    if (k && k.team !== v.team) {
      k.stats.kills++;
      if (head) k.stats.headshots++;
      const def = Object.values(WEAPONS).find((w) => w.name === weapon);
      this.addMoney(k, def ? def.killReward : 300);
      if (!this.roundFirstKill) {
        this.roundFirstKill = true;
        k.stats.openingKills++;
        v.stats.openingDeaths++;
      }
      // trade: victim recently killed one of the killer's teammates
      if (v.lastKillTick > 0 && this.tick - v.lastKillTick < TICK_RATE * 4) k.stats.trades++;
      k.lastKillTick = this.tick;
      this.decisive = `${k.name} eliminated ${v.name} with ${weapon}`;
    }
    v.lastKilledBy = k ? k.id : -1;
    this.emit({ e: 'kill', killer: k ? k.id : -1, victim: v.id, assister, weapon, head, wall, x: v.pos.x, y: v.pos.y, z: v.pos.z }, { kind: 'all' });
    // drop gear: primary (else sidearm) and spike
    const w = v.primary ?? v.secondary;
    if (w) this.spawnDrop(w, v.pos, v.id);
    if (v.primary) v.primary = null;
    else v.secondary = null;
    v.utils = [];
    if (v.hasSpike) {
      v.hasSpike = false;
      this.dropSpike(v.pos, v.id);
    }
    if (this.practice && v.bot) v.respawnTick = this.tick + TICK_RATE * 3;
    const mates = this.players.filter((q) => q.team === v.team && q.alive);
    v.spectating = k && k.team === v.team ? -1 : mates[0]?.id ?? -1;
    if (k) this.brains.get(k.id)?.onKill(v);
  }

  private spawnDrop(item: WeaponItem | 'spike', at: Vec3, dropper: number): Drop {
    // deterministic resting transform from a trace below the drop point
    const fy = this.map.floorHeight(at.x, at.z, at.y + 0.6);
    const d: Drop = { id: this.nextId++, item, pos: { x: at.x, y: Math.max(0, fy) + 0.06, z: at.z }, yaw: (hash32(this.seed, this.nextId) % 628) / 100, tick: this.tick, dropper };
    this.drops.push(d);
    this.sound('drop', d.pos, this.players[dropper] ?? null, 10);
    return d;
  }

  private dropSpike(at: Vec3, dropper: number): void {
    const d = this.spawnDrop('spike', at, dropper);
    this.spike.state = 'dropped';
    this.spike.carrier = -1;
    this.spike.pos = { ...d.pos };
    this.spike.dropId = d.id;
    this.spike.seenBy = [false, false];
    this.spike.seenBy[this.attackTeam] = true;
    this.emit({ e: 'spikeDropped', x: d.pos.x, y: d.pos.y, z: d.pos.z }, { kind: 'team', team: this.attackTeam });
  }

  dropActive(p: Player): void {
    if (!p.alive) return;
    const fwd = dirFromAngles(p.yaw, 0);
    const at = { x: p.pos.x + fwd.x * 0.9, y: p.pos.y + 0.5, z: p.pos.z + fwd.z * 0.9 };
    if (!this.map.lineClear({ x: p.pos.x, y: p.pos.y + 0.5, z: p.pos.z }, at, false)) {
      at.x = p.pos.x;
      at.z = p.pos.z;
    }
    if (p.active === 'spike' && p.hasSpike) {
      p.hasSpike = false;
      this.dropSpike(at, p.id);
      this.setActive(p, p.primary ? 'primary' : p.secondary ? 'secondary' : 'tool');
      return;
    }
    const item = this.activeItem(p);
    if (!item) return;
    if (p.active === 'primary') p.primary = null;
    else p.secondary = null;
    this.spawnDrop(item, at, p.id);
    // a dropped purchase can no longer be refunded
    p.purchases = p.purchases.filter((pu) => pu.uid !== item.uid);
    p.active = 'tool';
    this.setActive(p, p.primary ? 'primary' : p.secondary ? 'secondary' : 'tool');
    if (p.active === 'tool') p.drawUntil = this.tick + 20;
  }

  private handlePickups(p: Player, usePressed: boolean): void {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dh = vdistH(p.pos, d.pos);
      const dy = Math.abs(p.pos.y - d.pos.y);
      if (dy > 1.4) continue;
      if (d.item === 'spike') {
        if (this.sideOf(p) === 'intrusion' && dh < 1.0) {
          this.drops.splice(i, 1);
          p.hasSpike = true;
          this.spike.state = 'carried';
          this.spike.carrier = p.id;
          this.spike.dropId = -1;
          this.sound('pickup', p.pos, p, 5);
          this.emit({ e: 'spikePicked', player: p.id }, { kind: 'team', team: p.team });
        }
        continue;
      }
      const w = d.item;
      const slot = WEAPONS[w.id].slot === 'primary' ? 'primary' : 'secondary';
      const occupied = slot === 'primary' ? p.primary : p.secondary;
      // brief grace so the dropper doesn't instantly re-pick
      if (d.dropper === p.id && this.tick - d.tick < TICK_RATE * 1.5 && !usePressed) continue;
      if (!occupied && dh < 0.9) {
        this.drops.splice(i, 1);
        if (slot === 'primary') p.primary = w;
        else p.secondary = w;
        this.sound('pickup', p.pos, p, 5);
        if (p.active === 'tool' || (slot === 'primary' && p.active === 'secondary')) this.setActive(p, slot);
        continue;
      }
      if (usePressed && occupied && dh < 1.6) {
        // swap
        const eye = this.eyePos(p);
        const look = dirFromAngles(p.yaw, p.pitch);
        const to = { x: d.pos.x - eye.x, y: d.pos.y - eye.y, z: d.pos.z - eye.z };
        const l = Math.hypot(to.x, to.y, to.z) || 1;
        if ((to.x * look.x + to.y * look.y + to.z * look.z) / l < 0.6) continue;
        this.drops.splice(i, 1);
        this.spawnDrop(occupied, p.pos, p.id);
        p.purchases = p.purchases.filter((pu) => pu.uid !== occupied.uid);
        if (slot === 'primary') p.primary = w;
        else p.secondary = w;
        this.setActive(p, 'tool');
        this.setActive(p, slot);
        this.sound('pickup', p.pos, p, 5);
        return;
      }
    }
  }

  // ------------------------------------------------------------------ utility
  private throwUtility(p: Player, lob: boolean): void {
    const type = p.utils[p.utilIndex];
    if (!type) return;
    p.utils.splice(p.utilIndex, 1);
    p.purchases = p.purchases.filter((pu) => !(pu.item === type && pu.uid === -1 && false));
    // thrown utility is no longer refundable: drop one matching purchase record
    const pi = p.purchases.findIndex((pu) => pu.item === type);
    if (pi >= 0) p.purchases.splice(pi, 1);
    const body = throwState(p.pos, p.vel, p.crouchAmt, p.yaw, p.pitch, lob, this.map);
    const g: Grenade = { id: this.nextId++, type, owner: p.id, team: p.team, pos: body.pos, vel: body.vel, spawnTick: this.tick, rest: false, done: false, bounces: 0 };
    this.grenades.push(g);
    if (type === 'veil') p.stats.smokesThrown++;
    this.emit({ e: 'throw', src: p.id, type }, { kind: 'near', x: p.pos.x, y: p.pos.y, z: p.pos.z, r: 25 });
    this.sound('pin', p.pos, p, 7);
    if (p.utils.length) {
      p.utilIndex = Math.min(p.utilIndex, p.utils.length - 1);
      p.drawUntil = this.tick + Math.round(0.5 * TICK_RATE);
    } else {
      const back: ActiveKind = p.lastActive !== 'util' && this.available(p).includes(p.lastActive) ? p.lastActive : p.primary ? 'primary' : 'secondary';
      p.active = 'util';
      this.setActive(p, back);
    }
  }

  private updateGrenades(): void {
    for (const g of this.grenades) {
      if (g.done) continue;
      const b = stepGrenade(this.map, g, DT);
      if (b && b.speed > 1.4) this.sound('bounce', g.pos, this.players[g.owner], 14, { mat: b.mat });
      const def = UTILITY[g.type];
      const age = (this.tick - g.spawnTick) * DT;
      const det = def.onRest ? (g.rest && age > 0.25) || age >= def.fuse + 2 : age >= def.fuse;
      if (det) {
        g.done = true;
        this.detonate(g);
      }
    }
    this.grenades = this.grenades.filter((g) => !g.done);
  }

  private detonate(g: Grenade): void {
    const owner = this.players[g.owner];
    switch (g.type) {
      case 'veil': {
        const fy = this.map.floorHeight(g.pos.x, g.pos.z, g.pos.y + 0.1);
        const c = { x: g.pos.x, y: Math.max(fy, 0) + 1.3, z: g.pos.z };
        this.smokes.push({ id: g.id, pos: c, radius: SMOKE.radius, startTick: this.tick, endTick: this.tick + Math.round(SMOKE.duration * TICK_RATE), owner: g.owner });
        this.emit({ e: 'smoke', x: c.x, y: c.y, z: c.z }, { kind: 'all' });
        break;
      }
      case 'flash':
        this.flashBang(g, owner);
        break;
      case 'frag':
        this.fragBlast(g, owner);
        break;
      case 'thermite':
        this.ignite(g);
        break;
      case 'pulse':
        this.shards.push({ id: g.id, pos: { ...g.pos, y: g.pos.y + 0.1 }, owner: g.owner, team: g.team, startTick: this.tick, pings: 0, alive: true });
        break;
    }
  }

  /** world + smoke occlusion test for sight (shared by flashes, bots, snapshots) */
  sightClear(a: Vec3, b: Vec3): boolean {
    if (!this.map.lineClear(a, b, true)) return false;
    return !this.smokeBlocks(a, b);
  }

  smokeBlocks(a: Vec3, b: Vec3): boolean {
    for (const s of this.smokes) {
      const r = this.smokeRadius(s);
      if (r <= 0.2) continue;
      if (segmentSphereChord(a, b, s.pos, r) > 0.45) return true;
    }
    return false;
  }

  smokeRadius(s: Smoke): number {
    const age = (this.tick - s.startTick) * DT;
    const left = (s.endTick - this.tick) * DT;
    let r = s.radius * clamp(age / SMOKE.bloomTime, 0.15, 1);
    if (left < 1.5) r *= clamp(left / 1.5, 0, 1);
    return r;
  }

  private flashBang(g: Grenade, owner: Player): void {
    this.emit({ e: 'flash', x: g.pos.x, y: g.pos.y, z: g.pos.z, src: g.owner }, { kind: 'all' });
    for (const q of this.players) {
      if (!q.alive) continue;
      const eye = this.eyePos(q);
      const dist = vdist(eye, g.pos);
      if (dist > FLASH.range) continue;
      if (!this.sightClear(eye, g.pos)) continue;
      const look = dirFromAngles(q.yaw, q.pitch);
      const to = { x: (g.pos.x - eye.x) / dist, y: (g.pos.y - eye.y) / dist, z: (g.pos.z - eye.z) / dist };
      const dot = look.x * to.x + look.y * to.y + look.z * to.z;
      const angleF = dot >= 0.55 ? 1 : dot <= -0.35 ? 0.12 : 0.12 + ((dot + 0.35) / 0.9) * 0.88;
      const distF = clamp(1 - dist / FLASH.range, 0.25, 1);
      const dur = FLASH.maxBlind * angleF * distF;
      if (dur < FLASH.minBlind) continue;
      const until = this.tick + Math.round(dur * TICK_RATE);
      if (until > q.flashUntil) {
        q.flashUntil = until;
        q.flashStart = this.tick;
        q.flashPeak = clamp(angleF * distF * 1.2, 0.3, 1);
      }
      if (q.team !== owner.team && dur > 1.2) owner.stats.enemiesFlashed++;
      this.emit({ e: 'blind', dst: q.id, amount: q.flashPeak, duration: dur }, { kind: 'player', id: q.id });
      this.brains.get(q.id)?.onFlashed(dur);
    }
  }

  private fragBlast(g: Grenade, owner: Player): void {
    this.emit({ e: 'explode', x: g.pos.x, y: g.pos.y, z: g.pos.z, kind: 'frag' }, { kind: 'all' });
    this.sound('shot', g.pos, owner, 60, { weapon: 'frag' });
    const c = { x: g.pos.x, y: g.pos.y + 0.2, z: g.pos.z };
    for (const q of this.players) {
      if (!q.alive) continue;
      if (q.team === owner.team && q !== owner) continue;
      const pts = [
        { x: q.pos.x, y: q.pos.y + 1.2 * crouchScale(q.crouchAmt), z: q.pos.z },
        { x: q.pos.x, y: q.pos.y + 0.3, z: q.pos.z },
        { x: q.pos.x, y: q.pos.y + 1.65 * crouchScale(q.crouchAmt), z: q.pos.z },
      ];
      let best = Infinity;
      for (const pt of pts) {
        const d = vdist(c, pt);
        if (d < best && d < FRAG.radius && this.map.lineClear(c, pt, false)) best = d;
      }
      if (best === Infinity) continue;
      const f = Math.pow(1 - best / FRAG.radius, 1.25);
      let dmg = FRAG.maxDamage * f;
      if (q.armor > 0) {
        const hp = dmg * FRAG.armorPen;
        q.armor = Math.max(0, q.armor - Math.round((dmg - hp) * 0.5));
        dmg = hp;
        this.markArmorDamaged(q);
      }
      if (q === owner) dmg *= 0.5;
      if (dmg >= 1) this.damage(owner, q, Math.round(dmg), 'Fragment Charge', false, false, 'chest', q.armor > 0, true);
    }
  }

  private ignite(g: Grenade): void {
    const map = this.map;
    const nav = this.nav;
    const start = map.cellIndex(g.pos.x, g.pos.z);
    if (start < 0) return;
    let base = nav.rawFloor[start];
    if (isNaN(base)) base = Math.max(0, map.floorHeight(g.pos.x, g.pos.z, g.pos.y + 0.1));
    if (g.pos.y - base > 1.2) {
      // too high above any surface: drop to the floor below
      base = Math.max(0, map.floorHeight(g.pos.x, g.pos.z, g.pos.y));
    }
    const cells: Vec3[] = [];
    const set = new Set<number>();
    const queue = [start];
    set.add(start);
    const nx = map.nx;
    while (queue.length) {
      const c = queue.shift()!;
      const f = nav.rawFloor[c];
      if (isNaN(f) || Math.abs(f - base) > 0.5) {
        set.delete(c);
        continue;
      }
      const cc = map.cellCenter(c);
      if (Math.hypot(cc.x - g.pos.x, cc.z - g.pos.z) > THERMITE.radius) {
        set.delete(c);
        continue;
      }
      cells.push({ x: cc.x, y: f + 0.03, z: cc.z });
      const ix = c % nx;
      const nb = [ix > 0 ? c - 1 : -1, ix < nx - 1 ? c + 1 : -1, c - nx, c + nx];
      for (const n of nb) {
        if (n < 0 || n >= nav.rawFloor.length || set.has(n)) continue;
        set.add(n);
        queue.push(n);
      }
    }
    if (!cells.length) return;
    this.fires.push({ id: g.id, cells, cellSet: new Set(cells.map((c) => map.cellIndex(c.x, c.z))), endTick: this.tick + Math.round(THERMITE.duration * TICK_RATE), owner: g.owner, team: g.team, pos: { x: g.pos.x, y: base, z: g.pos.z } });
    this.emit({ e: 'fire', x: g.pos.x, y: base, z: g.pos.z }, { kind: 'all' });
  }

  inFire(pos: Vec3, enemyOfTeam?: TeamIndex): boolean {
    const c = this.map.cellIndex(pos.x, pos.z);
    for (const f of this.fires) {
      if (enemyOfTeam !== undefined && f.team === enemyOfTeam) continue;
      if (f.cellSet.has(c) && pos.y - f.pos.y < 0.6) return true;
    }
    return false;
  }

  private updateEffects(): void {
    const t = this.tick;
    this.smokes = this.smokes.filter((s) => s.endTick > t);
    this.fires = this.fires.filter((f) => f.endTick > t);
    // thermite damage, applied in 1/8 s steps
    if (this.fires.length && t % 8 === 0) {
      for (const q of this.players) {
        if (!q.alive) continue;
        const c = this.map.cellIndex(q.pos.x, q.pos.z);
        for (const f of this.fires) {
          if (f.team === q.team) continue;
          if (!f.cellSet.has(c) || q.pos.y - f.pos.y > 0.6) continue;
          const acc = (this.fireAccum.get(q.id) ?? 0) + THERMITE.dps * (8 / TICK_RATE);
          const whole = Math.floor(acc);
          this.fireAccum.set(q.id, acc - whole);
          if (whole > 0) this.damage(this.players[f.owner], q, whole, 'Thermite Vial', false, false, 'leg', false, true);
          break;
        }
      }
    }
    // pulse shard pings
    for (const s of this.shards) {
      if (!s.alive) continue;
      const age = (t - s.startTick) * DT;
      const due = PULSE.pingTimes[s.pings];
      if (due !== undefined && age >= due) {
        s.pings++;
        const wedges = new Array(PULSE.wedges).fill(0);
        for (const q of this.players) {
          if (!q.alive || q.team === s.team) continue;
          const dx = q.pos.x - s.pos.x;
          const dz = q.pos.z - s.pos.z;
          if (Math.hypot(dx, dz) > PULSE.radius || Math.abs(q.pos.y - s.pos.y) > 6) continue;
          const ang = Math.atan2(dx, dz);
          const w = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * PULSE.wedges) % PULSE.wedges;
          wedges[w] = 1;
        }
        this.emit({ e: 'pulse', x: s.pos.x, y: s.pos.y, z: s.pos.z, team: s.team, wedges, ping: s.pings }, { kind: 'team', team: s.team });
        this.sound('arm', s.pos, this.players[s.owner], 26);
        this.planners[s.team].onPulse(s.pos, wedges);
        if (s.pings >= PULSE.pingTimes.length) s.alive = false;
      }
    }
    this.shards = this.shards.filter((s) => s.alive);
  }

  // ------------------------------------------------------------------ objective
  private handleObjective(p: Player, useHeld: boolean, fireWithSpike: boolean): void {
    const t = this.tick;
    const live = this.phase === 'live';
    // arming
    if (p.hasSpike && this.spike.state === 'carried' && live) {
      const zone = this.map.vaultAt(p.pos);
      const wants = (useHeld || fireWithSpike) && zone && p.onGround;
      if (wants) {
        if (p.armStart < 0) {
          p.armStart = t;
          if (p.active !== 'spike') {
            p.lastActive = p.active;
            p.active = 'spike';
          }
          this.sound('arm', p.pos, p, 14);
          this.emit({ e: 'armStart', player: p.id }, { kind: 'team', team: p.team });
        } else if ((t - p.armStart) * DT >= this.rules.armTime) {
          this.plant(p, zone!.id);
        }
      } else p.armStart = -1;
    } else p.armStart = -1;

    // disarming
    if (this.spike.state === 'planted' && this.sideOf(p) === 'custodian' && (this.phase === 'planted' || this.practice)) {
      const near = vdistH(p.pos, this.spike.pos) < 1.4 && Math.abs(p.pos.y - this.spike.pos.y) < 1.6;
      const canSee = near && this.map.lineClear(this.eyePos(p), { ...this.spike.pos, y: this.spike.pos.y + 0.15 }, false);
      if (useHeld && canSee && (this.spike.defuser < 0 || this.spike.defuser === p.id)) {
        if (p.defuseStart < 0) {
          p.defuseStart = t;
          this.spike.defuser = p.id;
          this.sound('disarm', p.pos, p, 14);
          this.emit({ e: 'defuseStart', player: p.id, kit: p.kit }, { kind: 'all' });
        } else {
          const need = p.kit ? this.rules.defuseKitTime : this.rules.defuseTime;
          if ((t - p.defuseStart) * DT >= need) this.defused(p);
        }
      } else if (p.defuseStart >= 0) {
        // released: progress resets to zero
        p.defuseStart = -1;
        if (this.spike.defuser === p.id) this.spike.defuser = -1;
      }
    } else if (p.defuseStart >= 0) {
      p.defuseStart = -1;
      if (this.spike.defuser === p.id) this.spike.defuser = -1;
    }
  }

  private plant(p: Player, site: string): void {
    p.armStart = -1;
    p.hasSpike = false;
    p.stats.plants++;
    this.addMoney(p, ECONOMY.plantPersonal);
    this.spike = {
      state: 'planted',
      carrier: -1,
      pos: { x: p.pos.x, y: p.pos.y + 0.02, z: p.pos.z },
      site,
      plantTick: this.tick,
      explodeTick: this.tick + Math.round(this.rules.spikeTime * TICK_RATE),
      dropId: -1,
      defuser: -1,
      seenBy: [true, true],
    };
    this.roundArmed = true;
    this.roundPlanter = p.id;
    if (!this.practice) {
      this.phase = 'planted';
      this.phaseEnd = this.spike.explodeTick;
    }
    this.decisive = `${p.name} armed the Cipher at ${site}`;
    this.setActive(p, p.primary ? 'primary' : p.secondary ? 'secondary' : 'tool');
    this.emit({ e: 'planted', site, player: p.id, x: p.pos.x, y: p.pos.y, z: p.pos.z }, { kind: 'all' });
    this.sound('arm', p.pos, p, 40);
    this.planners.forEach((pl) => pl.onPlanted(site));
  }

  private defused(p: Player): void {
    p.defuseStart = -1;
    p.stats.defuses++;
    this.addMoney(p, ECONOMY.defusePersonal);
    this.spike.state = 'defused';
    this.spike.explodeTick = this.tick;
    this.spike.defuser = -1;
    this.decisive = `${p.name} disarmed the Cipher${p.kit ? ' with a kit' : ''}`;
    this.emit({ e: 'defused', player: p.id }, { kind: 'all' });
    if (!this.practice) this.endRound(p.team, 'defused');
  }

  private updateSpike(): void {
    const s = this.spike;
    if (s.state === 'carried') {
      const c = this.players[s.carrier];
      if (c) s.pos = { ...c.pos };
    } else if (s.state === 'dropped') {
      const def = this.defendTeam;
      if (!s.seenBy[def]) {
        for (const q of this.players) {
          if (q.team !== def || !q.alive) continue;
          if (vdist(q.pos, s.pos) < 35 && this.sightClear(this.eyePos(q), { ...s.pos, y: s.pos.y + 0.15 })) {
            s.seenBy[def] = true;
            this.planners[def].onSpikeSeen(s.pos);
            break;
          }
        }
      }
    } else if (s.state === 'planted' && this.tick >= s.explodeTick) {
      s.state = 'detonated';
      this.emit({ e: 'explode', x: s.pos.x, y: s.pos.y, z: s.pos.z, kind: 'spike' }, { kind: 'all' });
      // lethal radius around the vault (presentation-safe: only if round is still live)
      if (!this.damageLocked) {
        for (const q of this.players) {
          if (!q.alive) continue;
          const d = vdist(q.pos, s.pos);
          if (d < 22) this.damage(null, q, Math.round(220 * Math.pow(1 - d / 22, 1.6)), 'Cipher Spike', false, false, 'chest', false, false);
        }
      }
      if (this.phase === 'planted') {
        this.decisive = `The Cipher detonated at ${s.site}`;
        this.endRound(this.attackTeam, 'detonated');
      }
    }
  }

  private checkRoundState(): void {
    if (this.practice) return;
    if (this.phase !== 'live' && this.phase !== 'planted') return;
    const att = this.attackTeam;
    const def = this.defendTeam;
    const attAlive = this.players.some((p) => p.team === att && p.alive);
    const defAlive = this.players.some((p) => p.team === def && p.alive);
    if (this.phase === 'live') {
      if (!attAlive) this.endRound(def, 'elimination');
      else if (!defAlive) this.endRound(att, 'elimination');
      else if (this.tick >= this.phaseEnd) {
        this.decisive = 'Time expired before the Cipher was armed';
        this.endRound(def, 'time');
      }
    } else if (this.phase === 'planted') {
      if (!defAlive) this.endRound(att, 'elimination');
    }
  }

  private pushHistory(): void {
    const poses = this.players.map((p) => ({ x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, crouch: Math.round(p.crouchAmt * 16) / 16, alive: p.alive }));
    this.history.push({ tick: this.tick, poses });
    if (this.history.length > HISTORY_TICKS) this.history.shift();
  }

  historyRange(): [number, number] {
    return this.history.length ? [this.history[0].tick, this.history[this.history.length - 1].tick] : [0, 0];
  }

  // ------------------------------------------------------------------ economy
  priceOf(p: Player, item: ItemId): number {
    if (item === 'vest') return ARMOR.vest;
    if (item === 'vesthelm') return p.armor >= 100 && !p.helmet ? ARMOR.helmetOnly : ARMOR.vestHelmet;
    if (item === 'kit') return ARMOR.kit;
    if (item in UTILITY) return UTILITY[item as UtilityId].price;
    return WEAPONS[item as WeaponId]?.price ?? Infinity;
  }

  /** Returns null if purchase is allowed, else a reason. */
  buyBlockReason(p: Player, item: ItemId): string | null {
    if (!p.alive) return 'Not alive';
    if (!this.canBuy(p)) return this.phase === 'buy' ? 'Outside buy zone' : 'Buy phase over';
    const price = this.priceOf(p, item);
    if (!Number.isFinite(price)) return 'Unknown item';
    if (!this.rules.infiniteMoney && p.money < price) return 'Not enough money';
    if (item === 'kit') {
      if (this.sideOf(p) !== 'custodian') return 'Custodians only';
      if (p.kit) return 'Already owned';
      return null;
    }
    if (item === 'vest') return p.armor >= 100 ? 'Already owned' : null;
    if (item === 'vesthelm') return p.armor >= 100 && p.helmet ? 'Already owned' : null;
    if (item in UTILITY) {
      const u = item as UtilityId;
      if (p.utils.length >= MAX_UTILITY) return 'Utility full';
      if (p.utils.filter((x) => x === u).length >= UTILITY[u].cap) return 'Carry limit';
      return null;
    }
    const def = WEAPONS[item as WeaponId];
    if (!def || def.slot === 'tool') return 'Unknown item';
    const cur = def.slot === 'primary' ? p.primary : p.secondary;
    if (cur && cur.id === def.id) return 'Already owned';
    return null;
  }

  private buy(p: Player, item: ItemId): void {
    const reason = this.buyBlockReason(p, item);
    if (reason) {
      this.emit({ e: 'purchase', player: p.id, item, ok: false, reason }, { kind: 'player', id: p.id });
      return;
    }
    const price = this.rules.infiniteMoney ? 0 : this.priceOf(p, item);
    const pu: Purchase = { item, price, uid: -1 };
    if (item === 'vest' || item === 'vesthelm') {
      pu.armorBefore = { armor: p.armor, helmet: p.helmet };
      p.armor = 100;
      if (item === 'vesthelm') p.helmet = true;
    } else if (item === 'kit') p.kit = true;
    else if (item in UTILITY) p.utils.push(item as UtilityId);
    else {
      const def = WEAPONS[item as WeaponId];
      const w = this.newWeapon(def.id, p.id);
      pu.uid = w.uid;
      const slot = def.slot === 'primary' ? 'primary' : 'secondary';
      const old = slot === 'primary' ? p.primary : p.secondary;
      if (old) {
        pu.replaced = old;
        this.spawnDrop(old, p.pos, p.id);
      }
      if (slot === 'primary') p.primary = w;
      else p.secondary = w;
      p.active = slot === 'primary' ? 'secondary' : 'primary';
      this.setActive(p, slot);
    }
    p.money -= price;
    p.stats.spent += price;
    this.roundSpent[p.team] += price;
    p.purchases.push(pu);
    this.emit({ e: 'purchase', player: p.id, item, ok: true }, { kind: 'team', team: p.team });
  }

  refundable(p: Player): ItemId[] {
    if (!this.canBuy(p) || this.practice) return [];
    const out: ItemId[] = [];
    for (const pu of p.purchases) if (this.canRefund(p, pu)) out.push(pu.item);
    return out;
  }

  private canRefund(p: Player, pu: Purchase): boolean {
    if (pu.price < 0) return false; // damaged armor
    if (pu.uid >= 0) {
      const w = p.primary?.uid === pu.uid ? p.primary : p.secondary?.uid === pu.uid ? p.secondary : null;
      return !!w && !w.fired;
    }
    if (pu.item === 'kit') return p.kit;
    if (pu.item === 'vest' || pu.item === 'vesthelm') return p.armor >= 100;
    if (pu.item in UTILITY) return p.utils.includes(pu.item as UtilityId);
    return false;
  }

  private refund(p: Player, item: ItemId): void {
    if (!this.canBuy(p) || this.practice) {
      this.emit({ e: 'purchase', player: p.id, item, ok: false, reason: 'Refunds only during buy phase', refund: true }, { kind: 'player', id: p.id });
      return;
    }
    let idx = -1;
    for (let i = p.purchases.length - 1; i >= 0; i--) if (p.purchases[i].item === item && this.canRefund(p, p.purchases[i])) {
      idx = i;
      break;
    }
    if (idx < 0) {
      this.emit({ e: 'purchase', player: p.id, item, ok: false, reason: 'Not refundable', refund: true }, { kind: 'player', id: p.id });
      return;
    }
    const pu = p.purchases[idx];
    p.purchases.splice(idx, 1);
    if (pu.uid >= 0) {
      const slot = p.primary?.uid === pu.uid ? 'primary' : 'secondary';
      // restore the replaced weapon if it is still lying where we dropped it
      let restored: WeaponItem | null = null;
      if (pu.replaced) {
        const di = this.drops.findIndex((d) => d.item !== 'spike' && d.item.uid === pu.replaced!.uid);
        if (di >= 0) {
          restored = pu.replaced;
          this.drops.splice(di, 1);
        }
      }
      if (slot === 'primary') p.primary = restored;
      else p.secondary = restored;
      this.setActive(p, p.primary ? 'primary' : p.secondary ? 'secondary' : 'tool');
      if (!this.activeDef(p)) p.active = 'tool';
    } else if (pu.item === 'kit') p.kit = false;
    else if (pu.item === 'vest' || pu.item === 'vesthelm') {
      p.armor = pu.armorBefore?.armor ?? 0;
      p.helmet = pu.armorBefore?.helmet ?? false;
    } else {
      const ui = p.utils.lastIndexOf(pu.item as UtilityId);
      if (ui >= 0) p.utils.splice(ui, 1);
      if (p.active === 'util' && !p.utils[p.utilIndex]) this.setActive(p, p.primary ? 'primary' : 'secondary');
    }
    p.money = Math.min(ECONOMY.cap, p.money + pu.price);
    p.stats.spent -= pu.price;
    this.roundSpent[p.team] -= pu.price;
    this.emit({ e: 'purchase', player: p.id, item, ok: true, refund: true }, { kind: 'team', team: p.team });
  }

  // ------------------------------------------------------------------ visibility / snapshots
  /** Server-side potentially-visible test: can viewer legally see target right now? */
  canSee(viewer: Player, target: Player, strict = false): boolean {
    if (!target.alive && target.deathTick < 0) return false;
    const key = `${viewer.id}:${target.id}:${strict ? 1 : 0}`;
    const c = this.visCache.get(key);
    if (c && c.tick === this.tick) return c.v;
    const v = this.computeSee(viewer, target, strict);
    this.visCache.set(key, { tick: this.tick, v });
    return v;
  }

  private computeSee(viewer: Player, target: Player, strict: boolean): boolean {
    const eye = this.eyePos(viewer);
    const dist = vdist(viewer.pos, target.pos);
    if (dist > 140) return false;
    if (!strict && dist < 1.6) return true;
    const s = crouchScale(target.crouchAmt);
    const pts: Vec3[] = [
      { x: target.pos.x, y: target.pos.y + 1.62 * s, z: target.pos.z },
      { x: target.pos.x, y: target.pos.y + 1.1 * s, z: target.pos.z },
      { x: target.pos.x, y: target.pos.y + 0.25, z: target.pos.z },
    ];
    // shoulders, perpendicular to the line of sight
    const dx = target.pos.x - viewer.pos.x;
    const dz = target.pos.z - viewer.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    const px = -dz / l;
    const pz = dx / l;
    pts.push({ x: target.pos.x + px * 0.3, y: target.pos.y + 1.3 * s, z: target.pos.z + pz * 0.3 });
    pts.push({ x: target.pos.x - px * 0.3, y: target.pos.y + 1.3 * s, z: target.pos.z - pz * 0.3 });
    const origins: Vec3[] = [eye];
    if (!strict) {
      // anticipate peeks: lateral offsets of the viewer
      origins.push({ x: eye.x + px * 0.5, y: eye.y, z: eye.z + pz * 0.5 }, { x: eye.x - px * 0.5, y: eye.y, z: eye.z - pz * 0.5 });
    }
    for (const o of origins) for (const pt of pts) if (this.sightClear(o, pt)) return true;
    return false;
  }

  buildSnapshot(viewerId: number): Snapshot {
    const me = this.players[viewerId];
    const view = this.viewerOf(me);
    const players: SnapPlayer[] = [];
    for (const q of this.players) {
      const mate = q.team === me.team;
      if (!mate && !this.canSee(view, q)) continue;
      const sp: SnapPlayer = {
        id: q.id,
        team: q.team,
        name: q.name,
        alive: q.alive,
        x: q.pos.x,
        y: q.pos.y,
        z: q.pos.z,
        vx: q.vel.x,
        vz: q.vel.z,
        yaw: q.yaw,
        pitch: q.pitch,
        crouch: q.crouchAmt,
        onGround: q.onGround,
        hand: this.handOf(q),
        firing: this.tick - q.firingTick < 4,
        reloading: q.reloadStart >= 0,
        arming: q.armStart >= 0,
        defusing: q.defuseStart >= 0,
        scoped: q.scopeLevel > 0,
      };
      if (mate) {
        sp.health = q.health;
        sp.armor = q.armor;
        sp.helmet = q.helmet;
        sp.kit = q.kit;
        sp.money = q.money;
        sp.primary = q.primary?.id ?? null;
        sp.secondary = q.secondary?.id ?? null;
        sp.utils = [...q.utils];
        sp.hasSpike = q.hasSpike;
        sp.flash = q.flashUntil > this.tick ? q.flashPeak : 0;
        sp.recoilYaw = 0;
        sp.recoilPitch = 0;
        const d = this.activeDef(q);
        if (d && d.mode !== 'melee') {
          const r = recoilOffset(d, q.recoilIndex);
          sp.recoilYaw = r.yaw;
          sp.recoilPitch = r.pitch;
        }
      }
      players.push(sp);
    }
    const s = this.spike;
    const att = this.attackTeam;
    const known = s.state === 'planted' || s.state === 'defused' || s.state === 'detonated' || me.team === att || (s.state === 'dropped' && s.seenBy[me.team]);
    const def = this.activeDef(me);
    const rec = def && def.mode !== 'melee' ? recoilOffset(def, me.recoilIndex) : { yaw: 0, pitch: 0 };
    const item = this.activeItem(me);
    const reloading = me.reloadStart >= 0 && def ? clamp((this.tick - me.reloadStart) / Math.max(1, me.reloadEnd - me.reloadStart), 0, 1) : 0;
    const scopeFov = def?.scope && me.scopeLevel > 0 ? def.scope.fovs[me.scopeLevel - 1] : 0;
    void item;
    return {
      tick: this.tick,
      phase: this.phase,
      phaseEndTick: this.phaseEnd,
      round: this.round,
      half: this.round <= this.rules.halfRounds ? 1 : 2,
      teams: [0, 1].map((t) => ({
        side: this.teamSide[t],
        score: this.scores[t],
        alive: this.players.filter((p) => p.team === t && p.alive).length,
        lossTier: this.lossTier[t],
      })) as Snapshot['teams'],
      you: {
        id: me.id,
        team: me.team,
        side: this.sideOf(me),
        alive: me.alive,
        health: Math.max(0, me.health),
        armor: me.armor,
        helmet: me.helmet,
        kit: me.kit,
        money: me.money,
        primary: me.primary ? { id: me.primary.id, mag: me.primary.mag, reserve: me.primary.reserve } : null,
        secondary: me.secondary ? { id: me.secondary.id, mag: me.secondary.mag, reserve: me.secondary.reserve } : null,
        utils: [...me.utils],
        utilIndex: me.utilIndex,
        hasSpike: me.hasSpike,
        active: me.active,
        reloading,
        drawing: this.tick < me.drawUntil,
        scopeLevel: me.scopeLevel,
        scopeFov,
        burstMode: me.burstMode,
        spread: this.spreadOf(me),
        recoilYaw: rec.yaw,
        recoilPitch: rec.pitch,
        flashUntil: me.flashUntil,
        flashPeak: me.flashPeak,
        armProgress: me.armStart >= 0 ? clamp(((this.tick - me.armStart) * DT) / this.rules.armTime, 0, 1) : 0,
        defuseProgress: me.defuseStart >= 0 ? clamp(((this.tick - me.defuseStart) * DT) / (me.kit ? this.rules.defuseKitTime : this.rules.defuseTime), 0, 1) : 0,
        inBuyZone: this.inBuyZone(me),
        canBuy: this.canBuy(me),
        primed: me.primed > 0,
        spectating: me.alive ? -1 : this.viewerOf(me).id,
        refundable: this.refundable(me),
        speed: Math.hypot(me.vel.x, me.vel.z),
      },
      players,
      spike: {
        state: known ? s.state : s.state === 'dropped' || s.state === 'carried' ? 'none' : s.state,
        carrier: me.team === att ? s.carrier : -1,
        known,
        x: known ? s.pos.x : 0,
        y: known ? s.pos.y : 0,
        z: known ? s.pos.z : 0,
        site: s.site,
        explodeTick: s.explodeTick,
        plantTick: s.plantTick,
      },
      grenades: this.grenades.map((g) => ({ id: g.id, type: g.type, team: g.team, x: g.pos.x, y: g.pos.y, z: g.pos.z })),
      smokes: this.smokes.map((sm) => ({ id: sm.id, x: sm.pos.x, y: sm.pos.y, z: sm.pos.z, radius: sm.radius, startTick: sm.startTick, endTick: sm.endTick })),
      fires: this.fires.map((f) => ({ id: f.id, cells: f.cells.flatMap((c) => [c.x, c.y, c.z]), endTick: f.endTick, team: f.team })),
      shards: this.shards.map((sh) => ({ id: sh.id, team: sh.team, x: sh.pos.x, y: sh.pos.y, z: sh.pos.z })),
      drops: this.drops
        .filter((d) => d.item !== 'spike' || known)
        .map((d) => ({ id: d.id, item: d.item === 'spike' ? 'spike' : d.item.id, x: d.pos.x, y: d.pos.y, z: d.pos.z, yaw: d.yaw })),
      lastRound: this.lastRound,
      practice: this.practice,
    };
  }

  handOf(q: Player): SnapPlayer['hand'] {
    switch (q.active) {
      case 'primary':
        return q.primary?.id ?? 'none';
      case 'secondary':
        return q.secondary?.id ?? 'none';
      case 'tool':
        return 'tool';
      case 'util':
        return q.utils[q.utilIndex] ?? 'none';
      case 'spike':
        return 'spike';
    }
  }
}

function describeReason(reason: WinReason, side: Side): string {
  const team = side === 'intrusion' ? 'Intrusion' : 'Custodians';
  switch (reason) {
    case 'elimination':
      return `${team} eliminated the opposing team`;
    case 'time':
      return 'Time expired';
    case 'detonated':
      return 'Cipher detonated';
    case 'defused':
      return 'Cipher disarmed';
  }
}

function box_limit_exceeded(outbox: Map<number, GameEvent[]>): boolean {
  for (const b of outbox.values()) if (b.length > 4000) return true;
  return false;
}

export function raySphere(o: Vec3, d: Vec3, c: Vec3, r: number): number | null {
  const ox = o.x - c.x;
  const oy = o.y - c.y;
  const oz = o.z - c.z;
  const b = ox * d.x + oy * d.y + oz * d.z;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : null;
}

/** Length of the chord of segment a-b inside sphere (c, r). */
export function segmentSphereChord(a: Vec3, b: Vec3, c: Vec3, r: number): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return 0;
  const ux = dx / len;
  const uy = dy / len;
  const uz = dz / len;
  const ox = a.x - c.x;
  const oy = a.y - c.y;
  const oz = a.z - c.z;
  const bb = ox * ux + oy * uy + oz * uz;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = bb * bb - cc;
  if (disc <= 0) return 0;
  const sq = Math.sqrt(disc);
  const t0 = Math.max(0, -bb - sq);
  const t1 = Math.min(len, -bb + sq);
  return Math.max(0, t1 - t0);
}
