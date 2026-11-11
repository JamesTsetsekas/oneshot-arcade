// The authoritative Cipher Breach simulation: rounds, movement, weapons, utility, objective, economy.
// Deterministic for a given seed and input stream (no wall-clock, no Math.random).
import {
  DT,
  EQUIPMENT,
  MAX_UTILITY,
  PLAYER,
  TICK_RATE,
  UTILITY,
  UTIL_TUNING,
  lossReward,
  type EquipId,
  type Ruleset,
  type UtilityId,
} from '../content/rules';
import { DEFAULT_SIDEARM, WEAPONS, computeSpread, damageFalloff, fireInterval, isWeaponId, recoilAt, type WeaponDef, type WeaponId } from '../content/weapons';
import { inRect, type MapData } from '../map/build';
import { F_BULLET, F_OPAQUE, F_SOLID, MATS, newHit, type CollisionWorld } from '../map/world';
import {
  BTN,
  type BuyItem,
  type ClientCommand,
  type GameEvent,
  type ImpactInfo,
  type InputCmd,
  type MatchSummary,
  type Phase,
  type RoundEndReason,
  type RoundRecord,
  type Side,
  type SlotKind,
} from '../protocol/types';
import { Rng, clamp, dirFromAngles, hash32, v3 } from '../shared/math';
import { stepProjectile, throwVelocity } from './grenades';
import { ZONE_MULT, raySphere, rayVsPlayer, type HitZone, type PlayerHit, type Pose } from './hit';
import { eyeHeight, stepMove, type MoveCtx } from './movement';
import {
  activeDef,
  activeWeapon,
  carrySpeed,
  equipValue,
  newPlayer,
  newWeapon,
  type DroppedItem,
  type FireArea,
  type Grenade,
  type Noise,
  type Player,
  type QueuedEvent,
  type Shard,
  type SpikeState,
  type TeamState,
  type Veil,
  type WeaponInst,
} from './state';
import { lineOfSight } from './vision';

export interface MatchOptions {
  map: MapData;
  rules: Ruleset;
  seed: number;
  players: { name: string; team: number; bot: boolean }[];
  /** which team attacks first (default 0) */
  firstAtkTeam?: number;
}

const hit = newHit();
const phit: PlayerHit = { t: 0, zone: 'chest' };
const dir = v3();
const SECONDS = (s: number): number => Math.round(s * TICK_RATE);

export class Match {
  readonly map: MapData;
  readonly world: CollisionWorld;
  readonly rules: Ruleset;
  readonly seed: number;
  readonly rng: Rng;
  tick = 0;
  time = 0;
  players: Player[] = [];
  teams: [TeamState, TeamState];
  phase: Phase = 'warmup';
  phaseEnd = 0;
  round = 0;
  roundStart = 0;
  grenades: Grenade[] = [];
  veils: Veil[] = [];
  fires: FireArea[] = [];
  shards: Shard[] = [];
  items: DroppedItem[] = [];
  spike: SpikeState = { state: 'carried', carrier: -1, x: 0, y: 0, z: 0, site: '', armedAt: 0, armedTick: 0, defuser: -1, planter: -1 };
  events: QueuedEvent[] = [];
  noises: Noise[] = [];
  rounds: RoundRecord[] = [];
  summary: MatchSummary | null = null;
  logHash = 0x51ed;
  logCount = 0;
  /** Target pose provider; the room swaps this for lag-compensated history while a shooter fires. */
  poseOf: (target: Player, shooter: Player) => Pose = (t) => t.move;
  private nextId = 1;
  private firstKill: { killer: number; victim: number } | null = null;
  private recentKills: { killer: number; victim: number; time: number }[] = [];
  private roundPlanted = false;
  private roundEquip: [number, number] = [0, 0];
  private roundSpent: [number, number] = [0, 0];
  private pendingSwap = false;

  constructor(opts: MatchOptions) {
    this.map = opts.map;
    this.world = opts.map.world;
    this.rules = opts.rules;
    this.seed = opts.seed >>> 0;
    this.rng = new Rng(this.seed ^ 0xa5a5);
    const atk = opts.firstAtkTeam ?? 0;
    this.teams = [
      { score: 0, lossStreak: 0, side: atk === 0 ? 'atk' : 'def' },
      { score: 0, lossStreak: 0, side: atk === 0 ? 'def' : 'atk' },
    ];
    opts.players.forEach((p, i) => this.players.push(newPlayer(i, p.name, p.team, p.bot, this.rules.startMoney)));
    this.resetGear(true);
    this.placeAtSpawns();
    this.phase = 'warmup';
    this.phaseEnd = SECONDS(this.rules.warmupTime);
  }

  // ------------------------------------------------------------------ helpers
  uid(): number {
    return this.nextId++;
  }
  sideOf(p: Player): Side {
    return this.teams[p.team].side;
  }
  teamOfSide(side: Side): number {
    return this.teams[0].side === side ? 0 : 1;
  }
  aliveOn(side: Side): number {
    let n = 0;
    for (const p of this.players) if (p.alive && this.sideOf(p) === side) n++;
    return n;
  }
  isLive(): boolean {
    return this.phase === 'live' || this.phase === 'armed';
  }
  emit(ev: GameEvent, to = -1, team = -1): void {
    this.events.push({ ev, to, team, radius: 0, x: 0, z: 0 });
  }
  /** Audible event: delivered to clients within `radius` and recorded as a noise for bot hearing. */
  sound(kind: string, x: number, y: number, z: number, id: number, radius: number, vol = 1): void {
    this.events.push({ ev: { t: 'sound', kind, x, y, z, id, vol }, to: -1, team: -1, radius, x, z });
    const p = id >= 0 ? this.players[id] : null;
    this.noises.push({ x, y, z, id, team: p ? p.team : -1, kind, radius });
  }
  private logTx(a: number, b: number, c: number, d = 0): void {
    this.logHash = hash32(hash32(this.logHash, a, b, c), d, this.tick);
    this.logCount++;
  }
  private say(text: string): void {
    this.emit({ t: 'chat', from: -1, text, kind: 'system' });
  }
  siteAt(x: number, z: number): '' | 'A' | 'B' {
    if (inRect(this.map.sites.A.zone, x, z)) return 'A';
    if (inRect(this.map.sites.B.zone, x, z)) return 'B';
    return '';
  }
  inBuyZone(p: Player): boolean {
    return inRect(this.map.buyZones[this.sideOf(p)], p.move.x, p.move.z);
  }
  canBuy(p: Player): boolean {
    if (!p.alive) return false;
    if (this.rules.buyAnywhere) return this.phase !== 'matchEnd' && this.phase !== 'roundEnd';
    return this.phase === 'buy' && this.inBuyZone(p);
  }

  // ------------------------------------------------------------------ round flow
  private resetGear(all: boolean): void {
    for (const p of this.players) {
      if (all || !p.survived) {
        p.primary = null;
        p.sidearm = newWeapon(DEFAULT_SIDEARM, this.uid());
        p.armor = 0;
        p.helmet = false;
        p.kit = false;
        p.util = [];
      }
      // defenders-only kit never carries over a side swap
      if (this.sideOf(p) !== 'def') p.kit = false;
      for (const w of [p.primary, p.sidearm]) {
        if (!w) continue;
        w.ammo = WEAPONS[w.id].mag;
        w.reserve = WEAPONS[w.id].reserve;
        w.fired = false;
      }
    }
  }

  private placeAtSpawns(): void {
    const counters: Record<Side, number> = { atk: 0, def: 0 };
    for (const p of this.players) {
      const side = this.sideOf(p);
      const list = this.map.spawns[side];
      const sp = list[(counters[side]++ + this.round) % list.length];
      const m = p.move;
      m.x = sp.x;
      m.z = sp.z;
      m.y = 0;
      m.vx = m.vy = m.vz = 0;
      m.onGround = true;
      m.crouch = 0;
      m.landT = 0;
      m.fatigue = 0;
      m.jumpHeld = false;
      p.yaw = sp.yaw;
      p.pitch = 0;
      p.alive = true;
      p.hp = 100;
      p.hasSpike = false;
      p.slot = p.primary ? 'primary' : 'sidearm';
      p.lastSlot = p.primary ? 'sidearm' : 'tool';
      p.utilSel = 0;
      p.nextFire = 0;
      p.fireBuffer = -1;
      p.reloadEnd = 0;
      p.drawEnd = 0;
      p.recoilIdx = 0;
      p.heat = 0;
      p.burstLeft = 0;
      p.scope = 0;
      p.plantT = 0;
      p.defuseT = 0;
      p.blindUntil = 0;
      p.armorHit = false;
      p.purchases = [];
      p.ready = false;
      p.spectate = -1;
      p.roundKills = 0;
      p.roundDamage = 0;
      p.damageFrom.clear();
      p.prevButtons = 0;
    }
  }

  private startRound(): void {
    this.round++;
    this.roundStart = this.time;
    this.grenades.length = 0;
    this.veils.length = 0;
    this.fires.length = 0;
    this.shards.length = 0;
    this.items.length = 0;
    this.firstKill = null;
    this.recentKills.length = 0;
    this.roundPlanted = false;
    this.roundSpent = [0, 0];
    this.resetGear(false);
    this.placeAtSpawns();
    const attackers = this.players.filter((p) => this.sideOf(p) === 'atk');
    const carrier = attackers[this.rng.int(attackers.length)];
    carrier.hasSpike = true;
    this.spike = { state: 'carried', carrier: carrier.id, x: 0, y: 0, z: 0, site: '', armedAt: 0, armedTick: 0, defuser: -1, planter: -1 };
    this.phase = 'buy';
    this.phaseEnd = this.tick + SECONDS(this.rules.buyTime);
    this.logTx(1, this.round, carrier.id);
    this.emit({ t: 'phase', phase: 'buy', round: this.round });
  }

  private goLive(): void {
    this.phase = 'live';
    this.phaseEnd = this.tick + SECONDS(this.rules.roundTime);
    this.roundEquip = [0, 0];
    for (const p of this.players) this.roundEquip[p.team] += equipValue(p);
    this.emit({ t: 'phase', phase: 'live', round: this.round });
  }

  private endRound(winnerSide: Side, reason: RoundEndReason): void {
    if (this.phase === 'roundEnd' || this.phase === 'matchEnd') return;
    const winTeam = this.teamOfSide(winnerSide);
    const loseTeam = 1 - winTeam;
    this.teams[winTeam].score++;
    this.teams[winTeam].lossStreak = Math.max(0, this.teams[winTeam].lossStreak - 1);
    this.teams[loseTeam].lossStreak++;
    const lossPay = lossReward(this.rules, this.teams[loseTeam].lossStreak);
    let mvp = -1;
    let best = -1;
    const awards: number[] = [];
    for (const p of this.players) {
      p.survived = p.alive;
      p.plantT = 0;
      p.defuseT = 0;
      let award = 0;
      if (p.team === winTeam) award = this.rules.winReward;
      else if (reason === 'time' && this.sideOf(p) === 'atk' && p.alive) award = this.rules.saveReward;
      else award = lossPay;
      if (this.roundPlanted && this.sideOf(p) === 'atk') award += this.rules.plantTeam;
      awards[p.id] = award;
      this.addMoney(p, award, p.team === winTeam ? 'Round win' : 'Round loss');
      if (p.team === winTeam) {
        let score = p.roundKills * 100 + p.roundDamage;
        if (reason === 'disarmed' && this.spike.defuser === p.id) score += 250;
        if (reason === 'detonated' && this.spike.planter === p.id) score += 250;
        if (score > best) {
          best = score;
          mvp = p.id;
        }
      }
    }
    const bank: [number, number] = [0, 0];
    for (const p of this.players) bank[p.team] += p.money;
    this.rounds.push({
      n: this.round,
      winnerTeam: winTeam,
      winnerSide,
      reason,
      equip: [this.roundEquip[0], this.roundEquip[1]],
      bank,
      spent: [this.roundSpent[0], this.roundSpent[1]],
      firstKill: this.firstKill,
      planted: this.roundPlanted,
      site: this.spike.site,
      mvp,
      duration: this.time - this.roundStart,
    });
    const note =
      reason === 'disarmed'
        ? 'Cipher disarmed'
        : reason === 'detonated'
          ? 'Cipher detonated'
          : reason === 'time'
            ? 'Time expired'
            : winnerSide === 'atk'
              ? 'Custodians eliminated'
              : 'Intrusion eliminated';
    this.logTx(2, this.round, winTeam, reason.length);
    const score: [number, number] = [this.teams[0].score, this.teams[1].score];
    for (const p of this.players) this.emit({ t: 'roundend', winnerTeam: winTeam, winnerSide, reason, award: awards[p.id], mvp, note, score }, p.id);
    this.phase = 'roundEnd';
    this.phaseEnd = this.tick + SECONDS(this.rules.roundEndTime);
    this.pendingSwap = this.round === this.rules.swapAfter;
  }

  private matchWinner(): number | null {
    const [a, b] = [this.teams[0].score, this.teams[1].score];
    const r = this.rules;
    if (Math.max(a, b) >= r.roundsToWin && Math.abs(a - b) >= 2) return a > b ? 0 : 1;
    // a team that cannot be caught before overtime territory also wins outright
    if (Math.max(a, b) >= r.roundsToWin && Math.min(a, b) < r.swapAfter) return a > b ? 0 : 1;
    if (this.round >= r.maxRounds) return a === b ? -1 : a > b ? 0 : 1;
    return null;
  }

  private afterRound(): void {
    const w = this.matchWinner();
    if (w !== null) {
      this.phase = 'matchEnd';
      this.phaseEnd = Infinity;
      this.summary = this.buildSummary(w);
      this.emit({ t: 'matchend', summary: this.summary });
      return;
    }
    if (this.pendingSwap) {
      this.pendingSwap = false;
      for (const t of this.teams) {
        t.side = t.side === 'atk' ? 'def' : 'atk';
        t.lossStreak = 0;
      }
      for (const p of this.players) {
        p.money = this.rules.startMoney;
        p.survived = false;
      }
      this.resetGear(true);
      this.emit({ t: 'halftime' });
    }
    this.startRound();
  }

  buildSummary(winnerTeam: number): MatchSummary {
    return {
      matchId: 'lp-' + this.seed.toString(16) + '-' + this.tick.toString(16),
      ruleset: this.rules.version,
      map: this.map.version,
      collisionHash: this.map.collisionHash,
      seed: this.seed,
      score: [this.teams[0].score, this.teams[1].score],
      winnerTeam,
      rounds: this.rounds,
      players: this.players.map((p) => ({ ...p.stats })),
      logHash: this.logHash.toString(16),
      ticks: this.tick,
    };
  }

  // ------------------------------------------------------------------ economy
  addMoney(p: Player, amount: number, reason: string): void {
    if (amount === 0) return;
    const before = p.money;
    p.money = clamp(p.money + amount, 0, this.rules.maxMoney);
    this.logTx(3, p.id, amount, p.money);
    if (p.money !== before) this.emit({ t: 'money', amount: p.money - before, reason }, p.id);
  }

  priceOf(p: Player, item: BuyItem): number {
    if (isWeaponId(item)) return WEAPONS[item].price;
    if (item in UTILITY) return UTILITY[item as UtilityId].price;
    if (item === 'vesthelm' && p.armor >= 100 && !p.helmet) return 350;
    return EQUIPMENT[item as EquipId].price;
  }

  /** Reason a purchase is not allowed, or '' when it is. Shared by the server and the buy UI. */
  buyBlock(p: Player, item: BuyItem): string {
    if (!this.canBuy(p)) return 'Buy zone closed';
    if (isWeaponId(item)) {
      const d = WEAPONS[item];
      if (item === 'tool') return 'Not for sale';
      const cur = d.slot === 'primary' ? p.primary : p.sidearm;
      if (cur && cur.id === item) return 'Already equipped';
    } else if (item in UTILITY) {
      const u = UTILITY[item as UtilityId];
      if (p.util.length >= MAX_UTILITY) return 'Utility full';
      if (p.util.filter((x) => x === item).length >= u.cap) return 'Limit reached';
    } else if (item === 'kit') {
      if (this.sideOf(p) !== 'def') return 'Custodians only';
      if (p.kit) return 'Already owned';
    } else if (item === 'vest') {
      if (p.armor >= 100) return 'Already owned';
    } else if (item === 'vesthelm') {
      if (p.armor >= 100 && p.helmet) return 'Already owned';
    } else return 'Unknown item';
    if (!this.rules.infiniteMoney && p.money < this.priceOf(p, item)) return 'Insufficient funds';
    return '';
  }

  buy(p: Player, item: BuyItem, reqId: number): boolean {
    if (p.seenReq.has(reqId)) return false; // idempotent: a replayed request is ignored
    p.seenReq.add(reqId);
    const block = this.buyBlock(p, item);
    if (block) {
      this.emit({ t: 'buy', ok: false, reqId, item, reason: block }, p.id);
      return false;
    }
    const price = this.rules.infiniteMoney ? 0 : this.priceOf(p, item);
    const pur = { item, price, uid: 0, prevArmor: p.armor, prevHelmet: p.helmet };
    if (isWeaponId(item)) {
      const d = WEAPONS[item];
      const inst = newWeapon(item, this.uid());
      pur.uid = inst.uid;
      if (d.slot === 'primary') {
        if (p.primary) this.dropWeapon(p, 'primary');
        p.primary = inst;
        this.switchSlot(p, 'primary', 0, true);
      } else {
        if (p.sidearm) this.dropWeapon(p, 'sidearm');
        p.sidearm = inst;
        if (!p.primary) this.switchSlot(p, 'sidearm', 0, true);
      }
    } else if (item in UTILITY) {
      p.util.push(item as UtilityId);
    } else if (item === 'kit') p.kit = true;
    else if (item === 'vest') {
      p.armor = 100;
      p.armorHit = false;
    } else if (item === 'vesthelm') {
      p.armor = 100;
      p.helmet = true;
      p.armorHit = false;
    }
    p.money -= price;
    p.stats.spent += price;
    this.roundSpent[p.team] += price;
    p.purchases.push(pur);
    this.logTx(4, p.id, price, item.length * 31 + item.charCodeAt(0));
    this.emit({ t: 'buy', ok: true, reqId, item, reason: '' }, p.id);
    return true;
  }

  refundable(p: Player): BuyItem[] {
    if (this.phase !== 'buy' && this.phase !== 'warmup') return [];
    const out: BuyItem[] = [];
    for (const pur of p.purchases) if (this.canRefund(p, pur)) out.push(pur.item);
    return out;
  }

  private canRefund(p: Player, pur: { item: BuyItem; uid: number }): boolean {
    const item = pur.item;
    if (isWeaponId(item)) {
      const w = WEAPONS[item].slot === 'primary' ? p.primary : p.sidearm;
      return !!w && w.uid === pur.uid && !w.fired;
    }
    if (item in UTILITY) return p.util.includes(item as UtilityId);
    if (item === 'kit') return p.kit;
    return p.armor >= 100 && !p.armorHit;
  }

  refund(p: Player, item: BuyItem, reqId: number): boolean {
    if (p.seenReq.has(reqId)) return false;
    p.seenReq.add(reqId);
    if (this.phase !== 'buy' && this.phase !== 'warmup') {
      this.emit({ t: 'buy', ok: false, reqId, item, reason: 'Refunds close when the round starts', refund: true }, p.id);
      return false;
    }
    for (let i = p.purchases.length - 1; i >= 0; i--) {
      const pur = p.purchases[i];
      if (pur.item !== item || !this.canRefund(p, pur)) continue;
      if (isWeaponId(item)) {
        if (WEAPONS[item].slot === 'primary') p.primary = null;
        else p.sidearm = null;
        // take back whatever this purchase displaced, if it is still lying where it fell
        const slot = WEAPONS[item].slot;
        const idx = this.items.findIndex((it) => it.kind === 'weapon' && it.by === p.id && it.inst && WEAPONS[it.inst.id].slot === slot);
        if (idx >= 0) {
          const it = this.items.splice(idx, 1)[0];
          if (slot === 'primary') p.primary = it.inst;
          else p.sidearm = it.inst;
        }
        this.fixSlot(p);
      } else if (item in UTILITY) {
        p.util.splice(p.util.lastIndexOf(item as UtilityId), 1);
        this.fixSlot(p);
      } else if (item === 'kit') p.kit = false;
      else {
        p.armor = pur.prevArmor ?? 0;
        p.helmet = pur.prevHelmet ?? false;
      }
      p.purchases.splice(i, 1);
      p.money = Math.min(this.rules.maxMoney, p.money + pur.price);
      p.stats.spent -= pur.price;
      this.roundSpent[p.team] -= pur.price;
      this.logTx(5, p.id, pur.price);
      this.emit({ t: 'buy', ok: true, reqId, item, reason: '', refund: true }, p.id);
      return true;
    }
    this.emit({ t: 'buy', ok: false, reqId, item, reason: 'Not refundable', refund: true }, p.id);
    return false;
  }

  // ------------------------------------------------------------------ inventory
  private hasSlot(p: Player, slot: SlotKind, util = 0): boolean {
    if (slot === 'primary') return !!p.primary;
    if (slot === 'sidearm') return !!p.sidearm;
    if (slot === 'util') return util >= 0 && util < p.util.length;
    return true;
  }

  switchSlot(p: Player, slot: SlotKind, util = 0, force = false): void {
    if (!this.hasSlot(p, slot, util)) return;
    if (!force && p.slot === slot && (slot !== 'util' || p.utilSel === util)) return;
    if (p.slot !== slot) p.lastSlot = p.slot;
    p.slot = slot;
    p.utilSel = util;
    const d = slot === 'util' ? null : activeDef(p);
    p.drawEnd = this.time + (d ? d.drawTime : 0.4);
    p.reloadEnd = 0;
    p.scope = 0;
    p.burstLeft = 0;
    p.fireBuffer = -1;
    p.recoilIdx = 0;
    p.heat = 0;
  }

  /** After losing the held item, fall back to the best remaining one. */
  private fixSlot(p: Player): void {
    if (this.hasSlot(p, p.slot, p.utilSel)) return;
    this.switchSlot(p, p.primary ? 'primary' : p.sidearm ? 'sidearm' : 'tool', 0, true);
  }

  private dropPos(p: Player, distance: number): { x: number; y: number; z: number } {
    const fx = Math.sin(p.yaw);
    const fz = Math.cos(p.yaw);
    const m = p.move;
    let d = distance;
    if (this.world.raycast(m.x, m.y + 0.9, m.z, fx, 0, fz, distance + 0.35, F_SOLID, false, hit)) d = Math.max(0, hit.t - 0.35);
    const x = m.x + fx * d;
    const z = m.z + fz * d;
    const gy = this.world.groundBelow(x, m.y + 0.9, z);
    return { x, y: isFinite(gy) ? gy : m.y, z };
  }

  dropWeapon(p: Player, slot: 'primary' | 'sidearm'): void {
    const inst = slot === 'primary' ? p.primary : p.sidearm;
    if (!inst) return;
    if (slot === 'primary') p.primary = null;
    else p.sidearm = null;
    const pos = this.dropPos(p, 0.9);
    this.items.push({ uid: inst.uid, kind: 'weapon', inst, ...pos, yaw: p.yaw + 1.2, by: p.id, time: this.time });
    this.sound('drop', pos.x, pos.y, pos.z, p.id, 9);
    this.fixSlot(p);
  }

  dropSpike(p: Player): void {
    if (!p.hasSpike) return;
    p.hasSpike = false;
    const pos = this.dropPos(p, 0.5);
    this.spike.state = 'dropped';
    this.spike.carrier = -1;
    this.spike.x = pos.x;
    this.spike.y = pos.y;
    this.spike.z = pos.z;
    this.items.push({ uid: this.uid(), kind: 'spike', inst: null, ...pos, yaw: p.yaw, by: p.id, time: this.time });
    this.sound('drop', pos.x, pos.y, pos.z, p.id, 9);
  }

  private tryPickups(p: Player, usePressed: boolean): void {
    const m = p.move;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const d = Math.hypot(it.x - m.x, it.z - m.z);
      if (d > 1.7 || Math.abs(it.y - m.y) > 1.3) continue;
      const fresh = it.by === p.id && this.time - it.time < 1.0;
      if (it.kind === 'spike') {
        if (this.sideOf(p) !== 'atk' || d > 1.0 || fresh || this.phase === 'roundEnd') continue;
        this.items.splice(i, 1);
        p.hasSpike = true;
        this.spike.state = 'carried';
        this.spike.carrier = p.id;
        this.emit({ t: 'pickup', item: 'spike' }, p.id);
        this.sound('pickup', m.x, m.y, m.z, p.id, 7);
        continue;
      }
      const inst = it.inst!;
      const slot = WEAPONS[inst.id].slot as 'primary' | 'sidearm';
      const cur = slot === 'primary' ? p.primary : p.sidearm;
      if (!cur && d <= 1.0 && !fresh) {
        this.items.splice(i, 1);
        this.giveWeapon(p, inst);
      } else if (cur && usePressed) {
        this.items.splice(i, 1);
        this.dropWeapon(p, slot);
        this.giveWeapon(p, inst);
        usePressed = false;
      }
    }
  }

  private giveWeapon(p: Player, inst: WeaponInst): void {
    const slot = WEAPONS[inst.id].slot;
    if (slot === 'primary') {
      p.primary = inst;
      this.switchSlot(p, 'primary', 0, true);
    } else {
      p.sidearm = inst;
      if (!p.primary) this.switchSlot(p, 'sidearm', 0, true);
    }
    this.emit({ t: 'pickup', item: inst.id }, p.id);
    this.sound('pickup', p.move.x, p.move.y, p.move.z, p.id, 7);
  }

  /** Name of a weapon the player could swap to with USE, for the HUD prompt. */
  pickupPrompt(p: Player): string {
    const m = p.move;
    for (const it of this.items) {
      if (it.kind !== 'weapon' || !it.inst) continue;
      if (Math.hypot(it.x - m.x, it.z - m.z) > 1.7 || Math.abs(it.y - m.y) > 1.3) continue;
      const cur = WEAPONS[it.inst.id].slot === 'primary' ? p.primary : p.sidearm;
      if (cur) return WEAPONS[it.inst.id].name;
    }
    return '';
  }

  // ------------------------------------------------------------------ commands
  command(p: Player, c: ClientCommand): void {
    switch (c.t) {
      case 'buy':
        this.buy(p, c.item, c.reqId);
        break;
      case 'refund':
        this.refund(p, c.item, c.reqId);
        break;
      case 'ready':
        p.ready = true;
        break;
      case 'spectate':
        this.cycleSpectate(p, c.dir);
        break;
      default:
        if (!p.alive) return;
        if (c.t === 'select') this.switchSlot(p, c.slot, c.util ?? 0);
        else if (c.t === 'quick') this.switchSlot(p, p.lastSlot, 0);
        else if (c.t === 'cycle') {
          const order: [SlotKind, number][] = [];
          if (p.primary) order.push(['primary', 0]);
          if (p.sidearm) order.push(['sidearm', 0]);
          order.push(['tool', 0]);
          p.util.forEach((_, i) => order.push(['util', i]));
          const cur = order.findIndex(([s, u]) => s === p.slot && (s !== 'util' || u === p.utilSel));
          const nx = order[(cur + c.dir + order.length) % order.length];
          this.switchSlot(p, nx[0], nx[1]);
        } else if (c.t === 'drop') {
          if (p.slot === 'primary' || p.slot === 'sidearm') this.dropWeapon(p, p.slot);
          else if (p.slot === 'tool' && p.hasSpike) this.dropSpike(p);
        }
    }
  }

  cycleSpectate(p: Player, d: number): void {
    const mates = this.players.filter((q) => q.team === p.team && q.alive && q.id !== p.id);
    if (!mates.length) {
      p.spectate = -1;
      return;
    }
    const i = mates.findIndex((q) => q.id === p.spectate);
    p.spectate = mates[(i + d + mates.length) % mates.length].id;
  }

  // ------------------------------------------------------------------ tick
  step(inputs: (InputCmd | null | undefined)[]): void {
    this.noises.length = 0;
    this.tick++;
    this.time = this.tick * DT;
    for (const p of this.players) {
      const cmd = inputs[p.id];
      if (p.alive && cmd) this.stepPlayer(p, cmd);
      else if (!p.alive && (p.spectate < 0 || !this.players[p.spectate].alive)) this.cycleSpectate(p, 1);
    }
    this.stepGrenades();
    this.stepAreas();
    this.stepPhase();
  }

  private stepPhase(): void {
    switch (this.phase) {
      case 'warmup':
        if (this.tick >= this.phaseEnd) this.startRound();
        break;
      case 'buy': {
        // a single-player convenience: once every human is ready the buy phase wraps up early
        const humans = this.players.filter((p) => !p.bot);
        if (humans.length && humans.every((p) => p.ready)) this.phaseEnd = Math.min(this.phaseEnd, this.tick + SECONDS(1.2));
        if (this.tick >= this.phaseEnd) this.goLive();
        break;
      }
      case 'live':
        if (this.aliveOn('atk') === 0) this.endRound('def', 'eliminated');
        else if (this.aliveOn('def') === 0) this.endRound('atk', 'eliminated');
        else if (this.tick >= this.phaseEnd) this.endRound('def', 'time');
        break;
      case 'armed':
        if (this.aliveOn('def') === 0) this.endRound('atk', 'eliminated');
        else if (this.tick >= this.phaseEnd) {
          this.spike.state = 'detonated';
          this.emit({ t: 'detonated', x: this.spike.x, y: this.spike.y, z: this.spike.z });
          this.sound('detonate', this.spike.x, this.spike.y, this.spike.z, -1, 200);
          this.endRound('atk', 'detonated');
        }
        break;
      case 'roundEnd':
        if (this.tick >= this.phaseEnd) this.afterRound();
        break;
      case 'matchEnd':
        break;
    }
  }

  // ------------------------------------------------------------------ player step
  private stepPlayer(p: Player, cmd: InputCmd): void {
    const buttons = cmd.buttons;
    const pressed = buttons & ~p.prevButtons;
    p.prevButtons = buttons;
    p.yaw = cmd.yaw;
    p.pitch = clamp(cmd.pitch, -1.55, 1.55);
    p.renderTick = cmd.renderTick;
    const m = p.move;
    const ctx: MoveCtx = {
      maxSpeed: carrySpeed(p),
      frozen: this.phase === 'warmup' || p.plantT > 0 || p.defuseT > 0 || this.phase === 'matchEnd',
      barriers: this.phase === 'buy' || this.phase === 'warmup',
    };
    const wasGround = m.onGround;
    const px = m.x;
    const pz = m.z;
    const vyBefore = m.vy;
    stepMove(this.world, m, buttons, p.yaw, ctx, DT);
    this.footsteps(p, px, pz, wasGround, vyBefore, buttons);
    // objective interaction first: the same tick that starts an arm or disarm must already block firing
    this.stepUse(p, buttons, pressed);
    this.stepWeapon(p, buttons, pressed);
    this.tryPickups(p, (pressed & BTN.USE) !== 0 && p.plantT === 0 && p.defuseT === 0);
  }

  private footsteps(p: Player, px: number, pz: number, wasGround: boolean, vyBefore: number, buttons: number): void {
    const m = p.move;
    if (!wasGround && m.onGround && vyBefore < -3.5) {
      this.sound('land', m.x, m.y, m.z, p.id, vyBefore < -7 ? 18 : 12);
      return;
    }
    if (wasGround && !m.onGround && m.vy > 2) {
      this.sound('jump', m.x, m.y, m.z, p.id, 7, 0.6);
      return;
    }
    if (!m.onGround) return;
    const sp = Math.hypot(m.vx, m.vz);
    if (sp < 0.6) {
      p.stepDist = Math.min(p.stepDist, 1.2);
      return;
    }
    p.stepDist += Math.hypot(m.x - px, m.z - pz);
    const quiet = (buttons & BTN.WALK) !== 0 || m.crouch > 0.5 || sp < 2.7;
    const stride = quiet ? 1.9 : 2.3;
    if (p.stepDist >= stride) {
      p.stepDist = 0;
      let surface = 'hard';
      if (this.world.raycast(m.x, m.y + 0.2, m.z, 0, -1, 0, 0.6, F_SOLID, false, hit) && hit.box) surface = MATS[hit.box.mat].step;
      // silent walking still makes close-range gear sound
      if (quiet) this.sound('gear', m.x, m.y, m.z, p.id, 3.2, 0.35);
      else this.sound('step_' + surface, m.x, m.y, m.z, p.id, 17);
    }
  }

  private stepWeapon(p: Player, buttons: number, pressed: number): void {
    const t = this.time;
    const def = activeDef(p);
    // recoil / spread recovery
    const restDelay = Math.max(fireInterval(def) * 1.5, 0.13);
    if (t - p.lastShot > restDelay && p.burstLeft === 0) p.recoilIdx = Math.max(0, p.recoilIdx - def.recoilRecover * DT);
    if (def.spreadMax > 0) p.heat = Math.max(0, p.heat - (def.spreadMax / def.spreadRecovery) * DT);

    if (!this.isLive()) {
      p.burstLeft = 0;
      p.fireBuffer = -1;
      // reloading is still allowed outside live play
    }
    const w = activeWeapon(p);
    // reload completion
    if (p.reloadEnd > 0 && t >= p.reloadEnd && w) {
      const need = WEAPONS[w.id].mag - w.ammo;
      const take = Math.min(need, w.reserve);
      w.ammo += take;
      w.reserve -= take;
      p.reloadEnd = 0;
    }
    const busy = t < p.drawEnd || p.plantT > 0 || p.defuseT > 0;
    if (w && !busy && p.reloadEnd === 0 && w.ammo < def.mag && w.reserve > 0) {
      if (pressed & BTN.RELOAD || (w.ammo === 0 && t - p.lastShot > 0.2)) this.startReload(p, def);
    }
    if (!this.isLive() || busy) return;

    // scope toggle
    if (pressed & BTN.ALT && def.scope && p.reloadEnd === 0) {
      p.scope = (p.scope + 1) % (def.scope.fov.length + 1);
      this.sound('scope', p.move.x, p.move.y, p.move.z, p.id, 5, 0.5);
    }

    if (p.slot === 'util') {
      if (pressed & (BTN.FIRE | BTN.ALT)) this.throwUtility(p, (pressed & BTN.FIRE) === 0);
      return;
    }
    if (p.slot === 'tool') {
      if (buttons & BTN.FIRE && t >= p.nextFire) {
        p.nextFire = t + fireInterval(def);
        this.melee(p, def);
      }
      return;
    }
    if (!w || p.reloadEnd > 0) return;

    // burst continuation
    if (p.burstLeft > 0) {
      if (t >= p.nextBurst) {
        if (w.ammo > 0) {
          this.shoot(p, def, w);
          p.burstLeft--;
          p.nextBurst = t + 60 / (def.burstRpm ?? 900);
        } else p.burstLeft = 0;
      }
      return;
    }
    if (def.mode === 'auto') {
      if (!(buttons & BTN.FIRE)) return;
    } else {
      if (pressed & BTN.FIRE) p.fireBuffer = t + 0.11;
      if (t > p.fireBuffer) return;
    }
    if (t < p.nextFire) return;
    p.fireBuffer = -1;
    if (w.ammo <= 0) {
      if (pressed & BTN.FIRE) this.sound('dry', p.move.x, p.move.y, p.move.z, p.id, 4, 0.5);
      return;
    }
    const interval = fireInterval(def);
    p.nextFire = (p.nextFire < t - interval ? t : p.nextFire) + interval;
    this.shoot(p, def, w);
    if (def.mode === 'burst' && def.burstCount) {
      p.burstLeft = def.burstCount - 1;
      p.nextBurst = t + 60 / (def.burstRpm ?? 900);
    }
  }

  private startReload(p: Player, def: WeaponDef): void {
    p.reloadStart = this.time;
    p.reloadEnd = this.time + def.reloadTime;
    p.scope = 0;
    p.burstLeft = 0;
    this.sound('reload', p.move.x, p.move.y, p.move.z, p.id, 9, 0.7);
  }

  private shoot(p: Player, def: WeaponDef, w: WeaponInst): void {
    const m = p.move;
    w.ammo--;
    w.fired = true;
    p.shotSeq++;
    p.stats.shots++;
    const rec = recoilAt(def, p.recoilIdx);
    const speed = Math.hypot(m.vx, m.vz);
    const spread = computeSpread(def, {
      speed,
      maxSpeed: def.moveSpeed,
      onGround: m.onGround,
      crouch: m.crouch,
      landT: m.landT,
      heat: p.heat,
      scoped: p.scope > 0,
    });
    const ox = m.x;
    const oy = m.y + eyeHeight(m.crouch);
    const oz = m.z;
    const impacts: ImpactInfo[] = [];
    const pellets = def.pellets ?? 1;
    let ex = ox;
    let ey = oy;
    let ez = oz;
    let anyHit = false;
    for (let k = 0; k < pellets; k++) {
      // spread is fully determined by (match seed, shooter, shot sequence, pellet): reproducible and verifiable
      const h1 = hash32(this.seed, p.id, p.shotSeq, k);
      const h2 = hash32(h1, 0x9e37, k, p.shotSeq);
      const rad = spread * Math.sqrt((h1 & 0xffffff) / 0x1000000);
      const ang = ((h2 & 0xffffff) / 0x1000000) * Math.PI * 2;
      const pitch = clamp(p.pitch + rec.p + rad * Math.sin(ang), -1.56, 1.56);
      const yaw = p.yaw + rec.y + (rad * Math.cos(ang)) / Math.max(0.25, Math.cos(pitch));
      dirFromAngles(yaw, pitch, dir);
      const end = this.traceBullet(p, def, ox, oy, oz, dir.x, dir.y, dir.z, impacts);
      if (k === 0) {
        ex = end.x;
        ey = end.y;
        ez = end.z;
      }
      if (end.hitPlayer) anyHit = true;
    }
    if (anyHit) p.stats.hits++;
    p.recoilIdx = Math.min(def.recoil.length - 1, p.recoilIdx + 1);
    p.heat = Math.min(def.spreadMax, p.heat + def.spreadPerShot);
    p.lastShot = this.time;
    if (def.mode === 'bolt') p.scope = 0;
    const view = recoilAt(def, p.recoilIdx);
    this.events.push({
      ev: { t: 'shot', id: p.id, weapon: def.id, ox, oy, oz, impacts, ex, ey, ez, punchP: view.p * def.recoilView, punchY: view.y * def.recoilView },
      to: -1,
      team: -1,
      radius: 0,
      x: ox,
      z: oz,
    });
    this.noises.push({ x: ox, y: oy, z: oz, id: p.id, team: p.team, kind: 'shot', radius: def.loudness });
  }

  private endPoint = { x: 0, y: 0, z: 0, hitPlayer: false };

  private traceBullet(
    shooter: Player,
    def: WeaponDef,
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    impacts: ImpactInfo[],
  ): { x: number; y: number; z: number; hitPlayer: boolean } {
    let power = def.penetration;
    let dmgMul = 1;
    let traveled = 0;
    let wall = false;
    const out = this.endPoint;
    out.hitPlayer = false;
    for (let iter = 0; iter < 4; iter++) {
      const remain = def.range - traveled;
      const worldHit = this.world.raycast(ox, oy, oz, dx, dy, dz, remain, F_BULLET, false, hit);
      const tW = worldHit ? hit.t : remain;
      // players
      let bestT = tW;
      let victim: Player | null = null;
      let zone: HitZone = 'chest';
      for (const q of this.players) {
        if (!q.alive || q === shooter) continue;
        if (q.team === shooter.team && !this.rules.friendlyFire) continue;
        if (rayVsPlayer(ox, oy, oz, dx, dy, dz, this.poseOf(q, shooter), phit) && phit.t < bestT) {
          bestT = phit.t;
          victim = q;
          zone = phit.zone;
        }
      }
      // pulse shards can be shot before their second pulse
      for (let i = this.shards.length - 1; i >= 0; i--) {
        const s = this.shards[i];
        const ts = raySphere(ox, oy, oz, dx, dy, dz, s.x, s.y, s.z, 0.28);
        if (ts < bestT && s.team !== shooter.team) {
          s.hp -= def.damage;
          if (s.hp <= 0) {
            this.shards.splice(i, 1);
            this.emit({ t: 'shardbreak', x: s.x, y: s.y, z: s.z });
            this.sound('shardbreak', s.x, s.y, s.z, -1, 14);
          }
        }
      }
      if (victim) {
        const dist = traveled + bestT;
        const hx = ox + dx * bestT;
        const hy = oy + dy * bestT;
        const hz = oz + dz * bestT;
        impacts.push({ x: hx, y: hy, z: hz, nx: -dx, ny: -dy, nz: -dz, mat: 'flesh', kind: 'p' });
        const raw = def.damage * damageFalloff(def, dist) * dmgMul * (zone === 'head' ? def.headMult : ZONE_MULT[zone]);
        this.damage(victim, shooter, raw, zone, def.armorPen, def.id, wall, hx, hy, hz);
        out.x = hx;
        out.y = hy;
        out.z = hz;
        out.hitPlayer = true;
        return out;
      }
      if (!worldHit || !hit.box) {
        out.x = ox + dx * remain;
        out.y = oy + dy * remain;
        out.z = oz + dz * remain;
        return out;
      }
      const hx = ox + dx * hit.t;
      const hy = oy + dy * hit.t;
      const hz = oz + dz * hit.t;
      impacts.push({ x: hx, y: hy, z: hz, nx: hit.nx, ny: hit.ny, nz: hit.nz, mat: hit.box.mat, kind: 'w' });
      out.x = hx;
      out.y = hy;
      out.z = hz;
      const resist = MATS[hit.box.mat].resist;
      if (!isFinite(resist) || iter === 3) return out;
      const thickness = Math.max(0.02, hit.tExit - hit.t);
      const cost = thickness * resist;
      if (cost > power) return out;
      power -= cost;
      dmgMul *= 1 - 0.6 * (cost / Math.max(0.01, def.penetration));
      wall = true;
      const adv = hit.tExit + 0.01;
      ox += dx * adv;
      oy += dy * adv;
      oz += dz * adv;
      traveled += adv;
      impacts.push({ x: ox, y: oy, z: oz, nx: -hit.nx, ny: -hit.ny, nz: -hit.nz, mat: hit.box.mat, kind: 'x' });
    }
    return out;
  }

  private melee(p: Player, def: WeaponDef): void {
    const m = p.move;
    const ox = m.x;
    const oy = m.y + eyeHeight(m.crouch);
    const oz = m.z;
    dirFromAngles(p.yaw, p.pitch, dir);
    const wallT = this.world.raycast(ox, oy, oz, dir.x, dir.y, dir.z, def.range, F_BULLET, false, hit) ? hit.t : def.range;
    let victim: Player | null = null;
    let best = wallT;
    for (const q of this.players) {
      if (!q.alive || q === p || (q.team === p.team && !this.rules.friendlyFire)) continue;
      const pose = this.poseOf(q, p);
      // generous melee: test the centre ray and a wider torso cylinder
      const dxq = pose.x - ox;
      const dzq = pose.z - oz;
      const along = dxq * Math.sin(p.yaw) + dzq * Math.cos(p.yaw);
      const side = Math.abs(dxq * Math.cos(p.yaw) - dzq * Math.sin(p.yaw));
      if (along > 0 && along < best + 0.2 && side < 0.55 && Math.abs(pose.y - m.y) < 1.4) {
        best = along;
        victim = q;
      }
    }
    if (victim) {
      // directional: a strike from behind is far deadlier
      const behind = Math.sin(victim.yaw) * dir.x + Math.cos(victim.yaw) * dir.z > 0.45;
      this.damage(victim, p, behind ? 95 : def.damage, 'chest', def.armorPen, 'tool', false, victim.move.x, victim.move.y + 1.2, victim.move.z);
    }
    this.emit({ t: 'melee', id: p.id, x: ox + dir.x, y: oy + dir.y, z: oz + dir.z, hit: !!victim });
    this.sound(victim ? 'melee_hit' : 'melee', ox, oy, oz, p.id, 7, 0.7);
  }

  /** Applies ballistic or utility damage with armor rules. Returns health removed. */
  damage(victim: Player, attacker: Player | null, raw: number, zone: HitZone, armorPen: number, weapon: string, wall: boolean, hx: number, hy: number, hz: number): number {
    if (!victim.alive || !this.isLive()) return 0;
    let dmg = raw;
    let armored = false;
    if (zone === 'head') armored = victim.helmet;
    else if (zone !== 'leg') armored = victim.armor > 0;
    if (armored) {
      dmg = raw * armorPen;
      if (zone !== 'head') {
        const loss = Math.max(1, Math.round(raw * (1 - armorPen) * 0.6));
        victim.armor = Math.max(0, victim.armor - loss);
      }
      victim.armorHit = true;
    }
    const dealt = Math.min(victim.hp, Math.max(1, Math.round(dmg)));
    victim.hp -= dealt;
    victim.plantT = 0;
    if (attacker && attacker !== victim) {
      attacker.stats.damage += dealt;
      attacker.roundDamage += dealt;
      const rec = victim.damageFrom.get(attacker.id);
      if (rec) {
        rec.dmg += dealt;
        rec.time = this.time;
      } else victim.damageFrom.set(attacker.id, { dmg: dealt, time: this.time });
      this.emit({ t: 'hit', victim: victim.id, dmg: dealt, zone, killed: victim.hp <= 0, x: hx, y: hy, z: hz }, attacker.id);
    }
    const src = attacker ?? victim;
    this.emit({ t: 'hurt', from: attacker ? attacker.id : -1, dmg: dealt, fx: src.move.x, fz: src.move.z, armor: armored }, victim.id);
    if (victim.hp <= 0) this.kill(victim, attacker, weapon, zone === 'head', wall);
    return dealt;
  }

  private kill(victim: Player, killer: Player | null, weapon: string, head: boolean, wall: boolean): void {
    victim.alive = false;
    victim.hp = 0;
    victim.diedAt = this.time;
    victim.stats.deaths++;
    victim.plantT = 0;
    victim.defuseT = 0;
    victim.scope = 0;
    if (this.spike.defuser === victim.id) this.spike.defuser = -1;
    const m = victim.move;
    let assist = -1;
    if (killer && killer !== victim && killer.team !== victim.team) {
      killer.stats.kills++;
      killer.roundKills++;
      if (head) killer.stats.headshots++;
      const reward = isWeaponId(weapon) ? WEAPONS[weapon as WeaponId].killReward : 300;
      this.addMoney(killer, reward, 'Elimination');
      if (!this.firstKill) {
        this.firstKill = { killer: killer.id, victim: victim.id };
        killer.stats.openingKills++;
        victim.stats.openingDeaths++;
      }
      // a trade: the victim killed one of the killer's teammates moments ago
      for (const k of this.recentKills) {
        if (k.killer === victim.id && this.time - k.time <= 4 && this.players[k.victim].team === killer.team) {
          killer.stats.trades++;
          break;
        }
      }
      this.recentKills.push({ killer: killer.id, victim: victim.id, time: this.time });
      let bestDmg = 0;
      for (const [id, rec] of victim.damageFrom) {
        if (id === killer.id || this.players[id].team === victim.team) continue;
        if (rec.dmg >= 30 && this.time - rec.time <= 12 && rec.dmg > bestDmg) {
          bestDmg = rec.dmg;
          assist = id;
        }
      }
      if (assist >= 0) this.players[assist].stats.assists++;
    }
    // drop the best weapon and the spike where the player fell
    if (victim.primary) this.dropWeapon(victim, 'primary');
    else if (victim.sidearm && victim.sidearm.id !== DEFAULT_SIDEARM) this.dropWeapon(victim, 'sidearm');
    if (victim.hasSpike) this.dropSpike(victim);
    victim.primary = null;
    victim.sidearm = null;
    victim.util = [];
    victim.kit = false;
    victim.armor = 0;
    victim.helmet = false;
    victim.spectate = -1;
    this.cycleSpectate(victim, 1);
    this.logTx(6, killer ? killer.id : -1, victim.id, head ? 1 : 0);
    const kx = killer ? killer.move.x : m.x;
    const kz = killer ? killer.move.z : m.z;
    const dl = Math.hypot(m.x - kx, m.z - kz) || 1;
    this.emit({
      t: 'kill',
      killer: killer ? killer.id : -1,
      victim: victim.id,
      weapon,
      head,
      wall,
      assist,
      x: m.x,
      y: m.y,
      z: m.z,
      dx: (m.x - kx) / dl,
      dz: (m.z - kz) / dl,
    });
    this.sound('death', m.x, m.y, m.z, victim.id, 14);
  }

  // ------------------------------------------------------------------ objective
  private stepUse(p: Player, buttons: number, pressed: number): void {
    const use = (buttons & BTN.USE) !== 0;
    const m = p.move;
    // arming
    if (use && p.hasSpike && this.phase === 'live' && m.onGround && this.siteAt(m.x, m.z) !== '') {
      if (p.plantT === 0) this.sound('arm_start', m.x, m.y, m.z, p.id, 15);
      p.plantT += DT;
      p.scope = 0;
      if (p.plantT >= this.rules.plantTime) this.armSpike(p);
    } else p.plantT = 0;
    // disarming
    const sp = this.spike;
    if (use && this.phase === 'armed' && this.sideOf(p) === 'def' && sp.state === 'armed' && (sp.defuser === -1 || sp.defuser === p.id)) {
      const d = Math.hypot(sp.x - m.x, sp.z - m.z);
      const ey = m.y + eyeHeight(m.crouch);
      if (d <= PLAYER.useRange && Math.abs(sp.y - m.y) < 1.4 && this.world.segmentClear(m.x, ey, m.z, sp.x, sp.y + 0.15, sp.z, F_SOLID)) {
        if (p.defuseT === 0) this.sound('disarm_start', m.x, m.y, m.z, p.id, 15);
        sp.defuser = p.id;
        p.defuseT += DT;
        p.scope = 0;
        const need = p.kit ? this.rules.defuseKitTime : this.rules.defuseTime;
        if (p.defuseT >= need) {
          sp.state = 'disarmed';
          p.stats.defuses++;
          this.addMoney(p, this.rules.defusePersonal, 'Cipher disarmed');
          this.emit({ t: 'disarmed', by: p.id });
          this.sound('disarmed', sp.x, sp.y, sp.z, p.id, 60);
          this.endRound('def', 'disarmed');
        }
        return;
      }
    }
    if (p.defuseT > 0) {
      // no partial persistence: releasing restarts from zero
      p.defuseT = 0;
      if (sp.defuser === p.id) sp.defuser = -1;
    }
    void pressed;
  }

  private armSpike(p: Player): void {
    const m = p.move;
    p.plantT = 0;
    p.hasSpike = false;
    p.stats.plants++;
    this.roundPlanted = true;
    const site = this.siteAt(m.x, m.z) || 'A';
    this.spike = { state: 'armed', carrier: -1, x: m.x, y: m.y, z: m.z, site, armedAt: this.time, armedTick: this.tick, defuser: -1, planter: p.id };
    this.phase = 'armed';
    this.phaseEnd = this.tick + SECONDS(this.rules.spikeTime);
    this.addMoney(p, this.rules.plantPersonal, 'Cipher armed');
    this.logTx(7, p.id, site.charCodeAt(0));
    this.emit({ t: 'armed', site, by: p.id, x: m.x, y: m.y, z: m.z });
    this.emit({ t: 'phase', phase: 'armed', round: this.round });
    this.sound('armed', m.x, m.y, m.z, p.id, 200);
  }

  // ------------------------------------------------------------------ utility
  private throwUtility(p: Player, lob: boolean): void {
    const type = p.util[p.utilSel];
    if (!type) return;
    const m = p.move;
    dirFromAngles(p.yaw, p.pitch, dir);
    const g: Grenade = {
      id: this.uid(),
      type,
      owner: p.id,
      team: p.team,
      x: m.x + dir.x * 0.35,
      y: m.y + eyeHeight(m.crouch) - 0.05 + dir.y * 0.35,
      z: m.z + dir.z * 0.35,
      vx: 0,
      vy: 0,
      vz: 0,
      born: this.time,
      rest: false,
      bounces: 0,
    };
    // never start a projectile inside geometry
    if (!this.world.segmentClear(m.x, m.y + eyeHeight(m.crouch), m.z, g.x, g.y, g.z, F_SOLID)) {
      g.x = m.x;
      g.y = m.y + eyeHeight(m.crouch) - 0.05;
      g.z = m.z;
    }
    throwVelocity(p.yaw, p.pitch, lob, m.vx, m.vy, m.vz, g);
    this.grenades.push(g);
    p.util.splice(p.utilSel, 1);
    this.emit({ t: 'throw', id: p.id, util: type });
    this.sound('throw', m.x, m.y, m.z, p.id, 8, 0.6);
    this.logTx(8, p.id, type.charCodeAt(0), Math.round(p.yaw * 1000));
    if (p.util.length) this.switchSlot(p, 'util', Math.min(p.utilSel, p.util.length - 1), true);
    else this.switchSlot(p, p.primary ? 'primary' : p.sidearm ? 'sidearm' : 'tool', 0, true);
    p.nextFire = Math.max(p.nextFire, this.time + 0.35);
  }

  private stepGrenades(): void {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      const b = stepProjectile(this.world, g, g.type, DT);
      if (b && g.bounces <= 5) this.sound('bounce', g.x, g.y, g.z, -1, 11, 0.6);
      const age = this.time - g.born;
      const fuse = UTILITY[g.type].fuse;
      let pop = false;
      if (g.type === 'veil') pop = (g.rest && age >= fuse) || age >= 3.5;
      else if (g.type === 'flash' || g.type === 'frag') pop = age >= fuse;
      else if (g.type === 'thermite') pop = (b !== null && b.ny > 0.5) || g.rest || age >= fuse;
      else if (g.type === 'pulse') pop = g.rest || age >= 4;
      if (!pop) continue;
      this.grenades.splice(i, 1);
      this.detonate(g);
    }
  }

  private detonate(g: Grenade): void {
    const owner = this.players[g.owner];
    const T = UTIL_TUNING;
    if (g.type === 'veil') {
      const gy = this.world.groundBelow(g.x, g.y + 0.2, g.z, 6);
      const cy = (isFinite(gy) ? gy : g.y) + 1.3;
      this.veils.push({
        id: g.id,
        x: g.x,
        y: cy,
        z: g.z,
        r: T.veilRadius,
        start: this.time,
        end: this.time + T.veilDuration + T.veilBloom,
        startTick: this.tick,
        endTick: this.tick + SECONDS(T.veilDuration + T.veilBloom),
      });
      this.emit({ t: 'veil', x: g.x, y: cy, z: g.z });
      this.sound('veil', g.x, g.y, g.z, -1, 22);
    } else if (g.type === 'flash') {
      this.emit({ t: 'flashpop', x: g.x, y: g.y, z: g.z });
      this.sound('flash', g.x, g.y, g.z, -1, 40);
      for (const p of this.players) {
        if (!p.alive) continue;
        const m = p.move;
        const ex = m.x;
        const ey = m.y + eyeHeight(m.crouch);
        const ez = m.z;
        const d = Math.hypot(g.x - ex, g.y - ey, g.z - ez);
        if (d > T.flashRange) continue;
        if (!lineOfSight(this.world, this.veils, this.time, g.x, g.y, g.z, ex, ey, ez)) continue;
        dirFromAngles(p.yaw, p.pitch, dir);
        const dot = d > 0.01 ? ((g.x - ex) * dir.x + (g.y - ey) * dir.y + (g.z - ez) * dir.z) / d : 1;
        const angleF = dot > 0.55 ? 1 : dot > 0 ? 0.55 : 0.22;
        const distF = 1 - Math.pow(d / T.flashRange, 2) * 0.8;
        const duration = T.flashMaxDuration * angleF * distF;
        if (duration < 0.3) continue;
        p.blindUntil = Math.max(p.blindUntil, this.time + duration * 0.75);
        this.emit({ t: 'blind', amount: Math.min(1, angleF * distF * 1.25), duration }, p.id);
        if (p.team !== g.team && duration > 1.2 && owner) owner.stats.flashed++;
      }
    } else if (g.type === 'frag') {
      this.emit({ t: 'frag', x: g.x, y: g.y, z: g.z });
      this.sound('frag', g.x, g.y, g.z, -1, 90);
      for (const p of this.players) {
        if (!p.alive) continue;
        if (p.team === g.team && p.id !== g.owner && !this.rules.friendlyFire) continue;
        const m = p.move;
        const cy = m.y + 1.0 - 0.35 * m.crouch;
        const d = Math.hypot(g.x - m.x, g.y - cy, g.z - m.z);
        if (d > T.fragRadius) continue;
        // cover occlusion: the blast needs a clear line to the chest or the head
        const oy = g.y + 0.25;
        const clear =
          this.world.segmentClear(g.x, oy, g.z, m.x, cy, m.z, F_OPAQUE | F_SOLID) ||
          this.world.segmentClear(g.x, oy, g.z, m.x, m.y + eyeHeight(m.crouch), m.z, F_OPAQUE | F_SOLID);
        if (!clear) continue;
        let raw = T.fragDamage * Math.pow(1 - d / T.fragRadius, 1.15);
        if (p.id === g.owner) raw *= 0.6;
        const dealt = this.damage(p, owner ?? null, raw, 'chest', 0.62, 'frag', false, m.x, cy, m.z);
        if (owner && p.team !== g.team) owner.stats.utilDamage += dealt;
      }
      for (let i = this.shards.length - 1; i >= 0; i--) {
        const s = this.shards[i];
        if (Math.hypot(s.x - g.x, s.y - g.y, s.z - g.z) < 4) {
          this.shards.splice(i, 1);
          this.emit({ t: 'shardbreak', x: s.x, y: s.y, z: s.z });
        }
      }
    } else if (g.type === 'thermite') {
      const gy = this.world.groundBelow(g.x, g.y + 0.3, g.z, 12);
      if (!isFinite(gy)) return;
      // fire only occupies whole floor cells that are level with, and visible from, the ignition point
      const cells: number[] = [];
      const r = T.thermiteRadius;
      for (let cz = Math.floor(g.z - r); cz <= Math.floor(g.z + r); cz++) {
        for (let cx = Math.floor(g.x - r); cx <= Math.floor(g.x + r); cx++) {
          const px = cx + 0.5;
          const pz = cz + 0.5;
          if (Math.hypot(px - g.x, pz - g.z) > r) continue;
          const cg = this.world.groundBelow(px, gy + 0.7, pz, 1.4);
          if (!isFinite(cg) || Math.abs(cg - gy) > 0.65) continue;
          if (!this.world.segmentClear(g.x, gy + 0.6, g.z, px, cg + 0.6, pz, F_SOLID)) continue;
          cells.push(px, cg, pz);
        }
      }
      this.fires.push({ id: g.id, owner: g.owner, team: g.team, cells, end: this.time + T.thermiteDuration, endTick: this.tick + SECONDS(T.thermiteDuration), nextBurn: this.time });
      this.emit({ t: 'thermite', x: g.x, y: gy, z: g.z });
      this.sound('thermite', g.x, gy, g.z, -1, 24);
    } else if (g.type === 'pulse') {
      this.shards.push({ id: g.id, owner: g.owner, team: g.team, x: g.x, y: g.y + 0.1, z: g.z, hp: T.pulseHp, pulses: T.pulseDelays.map((d) => this.time + d), n: 0 });
      this.sound('shard_set', g.x, g.y, g.z, -1, 10, 0.6);
    }
  }

  private stepAreas(): void {
    const t = this.time;
    for (let i = this.veils.length - 1; i >= 0; i--) if (t > this.veils[i].end) this.veils.splice(i, 1);
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i];
      if (t > f.end) {
        this.fires.splice(i, 1);
        continue;
      }
      if (t < f.nextBurn) continue;
      f.nextBurn = t + 0.25;
      const owner = this.players[f.owner] ?? null;
      for (const p of this.players) {
        if (!p.alive) continue;
        if (p.team === f.team && p.id !== f.owner && !this.rules.friendlyFire) continue;
        const m = p.move;
        for (let c = 0; c < f.cells.length; c += 3) {
          if (Math.abs(f.cells[c] - m.x) < 0.75 && Math.abs(f.cells[c + 2] - m.z) < 0.75 && m.y - f.cells[c + 1] > -0.4 && m.y - f.cells[c + 1] < 1.2) {
            const dealt = this.damage(p, owner, UTIL_TUNING.thermiteDps * 0.25, 'leg', 1, 'thermite', false, m.x, m.y + 0.4, m.z);
            if (owner && p.team !== f.team) owner.stats.utilDamage += dealt;
            break;
          }
        }
      }
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      if (s.pulses.length && t >= s.pulses[0]) {
        s.pulses.shift();
        s.n++;
        // coarse reveal: 45-degree wedge and a near/far band, never an exact position
        const wedges: { a: number; d: number }[] = [];
        for (const p of this.players) {
          if (!p.alive || p.team === s.team) continue;
          const dx = p.move.x - s.x;
          const dz = p.move.z - s.z;
          const d = Math.hypot(dx, dz);
          if (d > UTIL_TUNING.pulseRadius || Math.abs(p.move.y - s.y) > 4) continue;
          const sector = Math.round(Math.atan2(dx, dz) / (Math.PI / 4));
          const band = d < 6 ? 0 : 1;
          if (!wedges.some((w) => w.a === sector && w.d === band)) wedges.push({ a: sector, d: band });
        }
        this.emit({ t: 'pulse', x: s.x, y: s.y, z: s.z, n: s.n, team: s.team, wedges }, -1, s.team);
        this.emit({ t: 'pulse', x: s.x, y: s.y, z: s.z, n: s.n, team: s.team, wedges: [] }, -1, 1 - s.team);
        this.sound('pulse', s.x, s.y, s.z, -1, 24);
        this.lastPulse = { team: s.team, x: s.x, z: s.z, wedges, time: t };
      }
      if (!s.pulses.length && t > 0) this.shards.splice(i, 1);
    }
  }

  /** Latest pulse result, readable by same-team bots through their blackboard. */
  lastPulse: { team: number; x: number; z: number; wedges: { a: number; d: number }[]; time: number } | null = null;
}
