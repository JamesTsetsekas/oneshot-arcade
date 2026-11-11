/**
 * Authoritative simulation core. Runs at a fixed 30 Hz, owns every mutation of game state,
 * and is driven only through `command()` (client intent) and `step()` (time).
 * It has no dependency on the DOM or the renderer; tests drive it headlessly.
 */
import {
  DT, HERO_BY_ID, ITEM_BY_ID, MAX_LEVEL, PASSIVE_GOLD, RECALL_TIME, SHOP_RANGE, START_GOLD, TALENT_BY_ID, XP_TO_LEVEL,
  type DamageType, type StatBlock,
} from '../shared/content';
import { Rng, angDiff, clamp, dist, lerpAngle, norm } from '../shared/math';
import {
  TEAM_BASE, brushAt, findPath, inRiver, isSolid, isWalkable, inIsland, walkLine, sightLine, nearestWalkable,
} from '../shared/map';
import type {
  CastParams, Command, Dash, Effect, EffType, HeroState, Order, PickConfig, Projectile, SimConfig, SimEvent, TeamState, Unit, UnitKind,
  WallSeg, Zone, Team,
} from './types';
import { HERO_IMPL, heroOnAttack, heroTick, heroOnAbilityHit, heroOnDamaged } from './heroes';
import { applyItemPassivesOnHit, buyItem, sellItem, undoBuy, sumItemStats, useItem, hasItem, itemTick } from './items';
import { Rules } from './rules';
import { BotManager } from './bots';

export interface Revealer { x: number; z: number; r: number; team: Team; until: number }
export interface TimelineEntry { t: number; text: string; team: number; kind: string }

export class Sim {
  readonly cfg: SimConfig;
  readonly rng: Rng;
  tick = 0;
  units: Unit[] = [];
  byId = new Map<number, Unit>();
  heroes: Unit[] = [];
  nextId = 1;
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  walls: WallSeg[] = [];
  timers: { at: number; fn: () => void }[] = [];
  events: SimEvent[] = [];
  revealers: Revealer[] = [];
  timeline: TimelineEntry[] = [];
  teams: TeamState[];
  winner: -1 | 0 | 1 = -1;
  playerSlot = 0;
  paused = false;
  rules: Rules;
  bots: BotManager;
  firstBlood = false;
  lastTick = 0;
  commandLog: { tick: number; cmd: Command }[] = [];
  recordCommands = false;
  private lastVisTick = -99;
  private sepCache: Unit[] = [];

  constructor(cfg: SimConfig) {
    this.cfg = cfg;
    this.rng = new Rng(cfg.seed);
    const mkTeam = (): TeamState => ({
      gold: 0, kills: 0, towers: 0, buffMoveUntil: 0, buffStructUntil: 0, colossusUntil: 0, wavesSpawned: 0,
      vanguardLane: [false, false], sealDown: [false, false], structuresLost: 0, lastStructureAlert: -99,
    });
    this.teams = [mkTeam(), mkTeam()];
    this.rules = new Rules(this);
    cfg.picks.forEach((p, i) => this.spawnHero(p, i));
    const pi = cfg.picks.findIndex((p) => p.controller === 'player');
    this.playerSlot = pi < 0 ? 0 : pi;
    this.rules.init();
    this.bots = new BotManager(this);
    for (const h of this.heroes) this.recomputeStats(h, true);
    for (const h of this.heroes) { h.hp = h.maxHp; h.mana = h.maxMana; }
  }

  get time() { return this.tick * DT; }
  emit(e: SimEvent) { this.events.push(e); }
  after(sec: number, fn: () => void) { this.timers.push({ at: this.time + sec, fn }); }
  note(text: string, team: number, kind: string) { this.timeline.push({ t: this.time, text, team, kind }); }

  // ------------------------------------------------------------ construction
  blank(kind: UnitKind, team: Team, name: string, x: number, z: number, radius: number): Unit {
    const u: Unit = {
      id: this.nextId++, kind, team, name, x, z, px: x, pz: z, facing: team === 1 ? Math.PI : 0, pfacing: 0, radius,
      hp: 100, maxHp: 100, mana: 0, maxMana: 0, shield: 0, shieldUntil: 0, shieldSrc: 0, dead: false,
      ad: 0, ap: 0, armor: 0, ward: 0, as: 1, ms: 3, haste: 0, pen: 0, lifesteal: 0, hpRegen: 0, manaRegen: 0, range: 1.5, windup: 0.3,
      vision: 8, shieldPower: 0, structDmg: 1, monsterDmg: 1, projSpeed: 0,
      effects: [], order: { t: 'idle', x, z, target: 0, path: [], pi: 0, rp: 0, slot: 0 },
      atkTarget: 0, atkRelease: 0, atkNext: 0, cast: null, dash: null,
      lastDamagedAt: -99, lastCombatAt: -99, lastHeroDamagedAt: -99, damagers: new Map(), visUntil: [0, 0, 0], revealUntil: [0, 0, 0], brush: 0,
      lane: 0, wp: 0, scale: 1, invuln: false, ttarget: 0, tramp: 0, tnext: 0, tlastTarget: 0, sealRespawns: 0, baseMs: 3,
      gold: 0, xp: 0, heroAggro: new Map(), lastAttackerHero: 0, owner: 0, expires: 0, disabledUntil: 0, baseAr: 0, baseWd: 0, baseAd: 0,
      dmgReflect: 0, seenAt: 0, hushed: false,
    };
    u.pfacing = u.facing;
    this.units.push(u);
    this.byId.set(u.id, u);
    return u;
  }

  private spawnHero(p: PickConfig, slot: number) {
    const d = HERO_BY_ID[p.heroId];
    const idxInTeam = this.cfg.picks.slice(0, slot).filter((q) => q.team === p.team).length;
    const sp = TEAM_BASE[p.team].spawn;
    const u = this.blank('hero', p.team, p.name ?? d.name, sp.x + (p.team === 0 ? 1.5 : -1.5), sp.z + (idxInTeam - 1) * 2.6, d.radius);
    const h: HeroState = {
      heroId: d.id, slot, controller: p.controller, name: p.name ?? d.name, level: 1, xp: 0, skillPts: 1, ranks: [0, 0, 0, 0],
      cds: [0, 0, 0, 0], talents: p.talents, talentCds: [0, 0], gold: this.cfg.startGold ?? START_GOLD, totalGold: this.cfg.startGold ?? START_GOLD,
      items: [null, null, null, null, null, null], trinketCharges: 2, trinketNext: 0,
      kills: 0, deaths: 0, assists: 0, lastHits: 0, monsterKills: 0, damageDealt: 0, damageTaken: 0, wardsPlaced: 0, wardsKilled: 0,
      objectives: 0, structures: 0, respawnAt: 0, recallStart: 0, recallDur: 0, rec: [null, null, null, null], undo: null, killStreak: 0, deathStreak: 0,
      recap: [], skillLog: [], buildLog: [], pa: 0, pb: 0, pc: 0, markId: 0, markCd: 0, annotations: {}, lastMoveDist: 0, hotCharge: false,
      lastMoveX: u.x, lastMoveZ: u.z, refractReady: false, unseenSince: 0, lastAttackAngle: {}, lastCombatAt: -99, boughtSinceFountain: false,
      stoneNear: 0, stoneStacks: 0, armorStacks: [], sunCount: 0, shardCd: {}, buffs: [], placed: 0, aggroUntil: [0, 0],
      deathAt: 0, lastDeathPos: { x: u.x, z: u.z }, goldSpent: 0, damageToStructures: 0, visionScore: 0, quietUsed: false,
    };
    u.hero = h;
    u.range = d.range;
    u.projSpeed = d.projSpeed;
    u.windup = d.windup;
    u.vision = 11;
    u.lane = p.lane ?? 0;
    this.heroes.push(u);
    return u;
  }

  heroOf(slot: number): Unit { return this.heroes[slot]; }
  get player(): Unit { return this.heroes[this.playerSlot]; }

  // ------------------------------------------------------------ effects
  addEffect(u: Unit, type: EffType, dur: number, amount = 0, src = 0, extra: Partial<Effect> = {}) {
    const until = this.time + dur;
    for (const e of u.effects) {
      if (e.type === type && e.src === src && e.tag === extra.tag) {
        if (until > e.until) e.until = until;
        e.amount = Math.max(e.amount, amount);
        if (extra.mods) e.mods = extra.mods;
        return e;
      }
    }
    const e: Effect = { type, until, amount, src, ...extra };
    u.effects.push(e);
    return e;
  }
  has(u: Unit, type: EffType): boolean {
    const t = this.time;
    for (const e of u.effects) if (e.type === type && e.until > t) return true;
    return false;
  }
  effAmount(u: Unit, type: EffType): number {
    const t = this.time;
    let m = 0;
    for (const e of u.effects) if (e.type === type && e.until > t && e.amount > m) m = e.amount;
    return m;
  }
  getEffect(u: Unit, type: EffType, tag?: string): Effect | undefined {
    const t = this.time;
    return u.effects.find((e) => e.type === type && e.until > t && (tag === undefined || e.tag === tag));
  }
  removeEffects(u: Unit, types: EffType[]) {
    u.effects = u.effects.filter((e) => !types.includes(e.type));
  }
  cleanse(u: Unit) {
    this.removeEffects(u, ['slow', 'root', 'silence', 'stun', 'disarm']);
    this.emit({ t: 'fx', kind: 'ring', x: u.x, z: u.z, r: 1.6, color: 0xffffff, dur: 0.5 });
  }
  isStunned(u: Unit) { return this.has(u, 'stun') || this.has(u, 'airborne'); }
  isRooted(u: Unit) { return this.isStunned(u) || this.has(u, 'root'); }
  isSilenced(u: Unit) { return this.isStunned(u) || this.has(u, 'silence'); }
  isDisarmed(u: Unit) { return this.isStunned(u) || this.has(u, 'disarm'); }

  canSee(team: number, u: Unit): boolean {
    return u.team === team || u.visUntil[team] > this.time || u.revealUntil[team] > this.time;
  }

  // ------------------------------------------------------------ stats
  recomputeStats(u: Unit, init = false) {
    const now = this.time;
    // expire effects/shields
    if (u.effects.length) u.effects = u.effects.filter((e) => e.until > now);
    if (u.shield > 0 && now > u.shieldUntil) u.shield = 0;
    let mods: StatBlock = {};
    let slowMax = 0, hasteMax = 0, asMod = 0;
    for (const e of u.effects) {
      if (e.type === 'mod' && e.mods) for (const k in e.mods) (mods as Record<string, number>)[k] = ((mods as Record<string, number>)[k] ?? 0) + (e.mods as Record<string, number>)[k];
      else if (e.type === 'slow') slowMax = Math.max(slowMax, e.amount);
      else if (e.type === 'haste') hasteMax = Math.max(hasteMax, e.amount);
    }
    u.hushed = this.has(u, 'hush');
    if (u.kind === 'hero') {
      const h = u.hero!, d = HERO_BY_ID[h.heroId], L = h.level - 1;
      const S = sumItemStats(h);
      const M = mods as Record<string, number>;
      const hpOld = u.maxHp;
      u.maxHp = Math.round(d.hp + d.hpGrow * L + (S.hp ?? 0) + (M.hp ?? 0));
      if (!init && u.maxHp > hpOld && !u.dead) u.hp += u.maxHp - hpOld;
      if (u.hp > u.maxHp) u.hp = u.maxHp;
      const manaOld = u.maxMana;
      u.maxMana = Math.round(d.mana + d.manaGrow * L + (S.mana ?? 0));
      if (!init && u.maxMana > manaOld && !u.dead) u.mana += u.maxMana - manaOld;
      if (u.mana > u.maxMana) u.mana = u.maxMana;
      const colossusAD = 0;
      u.baseAd = d.ad + d.adGrow * L;
      u.ad = u.baseAd + (S.ad ?? 0) + (M.ad ?? 0) + colossusAD;
      u.ap = ((S.ap ?? 0) + (M.ap ?? 0)) * (1 + (S.apPct ?? 0));
      u.armor = d.armor + d.armorGrow * L + (S.armor ?? 0) + (M.armor ?? 0) + h.stoneStacks * 2 + h.armorStacks.filter((a) => a.until > now).length * 4;
      u.ward = d.ward + d.wardGrow * L + (S.ward ?? 0) + (M.ward ?? 0) + h.stoneStacks * 2;
      u.as = Math.min(2.5, d.as * (1 + d.asGrow * L * 1.0) * (1 + (S.as ?? 0) + (M.as ?? 0)));
      u.haste = (S.haste ?? 0) + (M.haste ?? 0);
      u.pen = Math.min(0.6, (S.pen ?? 0) + (M.pen ?? 0));
      u.lifesteal = S.lifesteal ?? 0;
      u.hpRegen = d.hpRegen + d.hpRegen * 0.08 * L + (S.hpRegen ?? 0) + (M.hpRegen ?? 0);
      u.manaRegen = d.manaRegen + d.manaRegen * 0.06 * L + (S.manaRegen ?? 0) + (M.manaRegen ?? 0);
      u.shieldPower = S.shieldPower ?? 0;
      u.structDmg = 1 + (S.structDmg ?? 0);
      u.monsterDmg = 1 + (S.monsterDmg ?? 0);
      u.dmgReflect = hasItem(h, 'thornmail') ? 25 + u.armor * 0.2 : 0;
      let ms = d.ms + (S.ms ?? 0) + (M.ms ?? 0);
      if (hasItem(h, 'riverglass') && inRiver(u.x, u.z) && now - u.lastCombatAt > 3) ms += 0.5;
      const tb = this.teams[u.team as 0 | 1];
      if (tb.buffMoveUntil > now && now - u.lastCombatAt > 4) ms += 0.35;
      if (tb.buffStructUntil > now) u.structDmg += 0.2;
      u.baseMs = ms;
      u.vision = this.has(u, 'hush') ? 5.5 : 11;
      if (this.has(u, 'vision')) u.vision += 0;
      hasteMax = Math.max(hasteMax, 0);
    } else if (u.kind === 'minion' || u.kind === 'monster') {
      const M = mods as Record<string, number>;
      u.ad = u.baseAd + (M.ad ?? 0);
      u.armor = u.baseAr + (M.armor ?? 0);
      u.ward = u.baseWd;
      asMod = M.as ?? 0;
      u.as = Math.max(0.3, (u.as || 1) * 1);
      void asMod;
    }
    u.ms = u.kind === 'hero' || u.kind === 'minion' || u.kind === 'monster' || u.kind === 'decoy'
      ? Math.max(1.4, u.baseMs * (1 + hasteMax) * (1 - Math.min(0.65, slowMax)))
      : 0;
  }

  // ------------------------------------------------------------ damage / heal / shield
  damage(src: Unit | null, tgt: Unit, amount: number, dtype: DamageType,
    o: { label?: string; isAttack?: boolean; ability?: boolean; pen?: number; noLifesteal?: boolean; noReflect?: boolean; silent?: boolean } = {}): number {
    if (tgt.dead || tgt.invuln || amount <= 0) return 0;
    const now = this.time;
    if (tgt.kind === 'ward') {
      tgt.hp -= 1;
      if (src?.hero) src.hero.wardsKilled += tgt.hp <= 0 ? 1 : 0;
      if (tgt.hp <= 0) this.killUnit(tgt, src);
      return 1;
    }
    let def = dtype === 'physical' ? tgt.armor : dtype === 'arcane' ? tgt.ward : 0;
    const pen = Math.min(0.7, (src?.pen ?? 0) + (o.pen ?? 0));
    if (def > 0) def *= 1 - pen;
    let mult = def >= 0 ? 100 / (100 + def) : 2 - 100 / (100 - def);
    let dmg = amount * mult;
    // damage reduction
    const dr = this.effAmount(tgt, 'dr');
    if (dr > 0) dmg *= 1 - Math.min(0.75, dr);
    if (tgt.stype) {
      if (src) dmg *= src.structDmg;
      if (!this.rules.hasAlliedMinionNear(tgt)) dmg *= 0.35; // backdoor mitigation
    } else if (tgt.kind === 'monster' && src) dmg *= src.monsterDmg;
    if (src && src.kind === 'hero' && tgt.kind === 'monster') { /* neutral */ }
    // bogskin absorb tracking
    if (tgt.kind === 'hero') {
      const bog = this.getEffect(tgt, 'bog');
      if (bog) bog.data = (bog.data ?? 0) + dmg;
    }
    // shield
    let shieldHit = false;
    if (tgt.shield > 0) {
      const ab = Math.min(tgt.shield, dmg);
      tgt.shield -= ab; dmg -= ab; shieldHit = ab > 0;
      if (shieldHit && !o.silent) this.emit({ t: 'damage', target: tgt.id, amount: Math.round(ab), dtype, src: src?.id ?? 0, shield: true });
    }
    const dealt = Math.min(tgt.hp, dmg);
    tgt.hp -= dmg;
    tgt.lastDamagedAt = now;
    if (src) {
      tgt.lastCombatAt = now; src.lastCombatAt = now;
      tgt.damagers.set(src.owner || src.id, now);
      if (src.kind === 'hero' || src.owner) {
        const owner = src.kind === 'hero' ? src : this.byId.get(src.owner);
        if (owner?.hero) {
          owner.hero.damageDealt += dealt;
          if (tgt.stype) { owner.hero.damageToStructures += dealt; tgt.lastHeroDamagedAt = now; }
          if (tgt.kind === 'hero') { owner.hero.aggroUntil[tgt.team === 0 ? 0 : 1] = now + 3; tgt.lastAttackerHero = owner.id; tgt.lastHeroDamagedAt = now; }
        }
      }
    } else tgt.lastCombatAt = now;
    if (tgt.kind === 'hero') {
      const h = tgt.hero!;
      h.damageTaken += dealt;
      h.lastCombatAt = now;
      if (h.recallStart > 0 && (src || true)) this.cancelRecall(tgt, 'damaged');
      h.recap.push({ t: now, src: src?.id ?? 0, srcName: src ? (src.hero?.name ?? src.name) : 'Burn', amount: dealt, type: dtype, label: o.label ?? 'Attack' });
      if (h.recap.length > 40) h.recap.shift();
      heroOnDamaged(this, tgt, src, dealt, dtype);
      if (dtype === 'physical' && hasItem(h, 'kilnheart')) {
        h.armorStacks.push({ until: now + 4 });
        if (h.armorStacks.length > 5) h.armorStacks.shift();
      }
    }
    if (!o.silent && dmg > 0) this.emit({ t: 'damage', target: tgt.id, amount: Math.round(dmg), dtype, src: src?.id ?? 0 });
    if (src && o.isAttack && !o.noLifesteal && src.lifesteal > 0) this.heal(src, dealt * src.lifesteal, true);
    if (tgt.dmgReflect > 0 && o.isAttack && !o.noReflect && src && !src.stype && src.range < 3.5) {
      this.damage(tgt, src, tgt.dmgReflect, 'physical', { noReflect: true, label: 'Thorns', silent: false });
    }
    if (tgt.hp <= 0 && !tgt.dead) this.killUnit(tgt, src);
    return dealt;
  }

  heal(u: Unit, amount: number, quiet = false) {
    if (u.dead || amount <= 0) return;
    const a = Math.min(u.maxHp - u.hp, amount);
    if (a <= 0) return;
    u.hp += a;
    if (!quiet && a >= 8) this.emit({ t: 'heal', target: u.id, amount: Math.round(a) });
  }

  grantShield(src: Unit | null, tgt: Unit, amount: number, dur: number, tagReveal = true) {
    const amt = amount * (1 + (src?.shieldPower ?? 0));
    tgt.shield += amt;
    tgt.shieldUntil = Math.max(tgt.shieldUntil, this.time + dur);
    tgt.shieldSrc = src?.id ?? 0;
    this.emit({ t: 'fx', kind: 'shield', x: tgt.x, z: tgt.z, r: tgt.radius + 0.5, color: 0x6ff0ff, dur: 0.6 });
    if (src?.hero) {
      if (src.hero.heroId === 'oru' && tgt.id !== src.id) {
        const snap = tgt.shield;
        this.after(3, () => { if (!src.dead && tgt.shield > 0 && tgt.shield >= Math.min(snap, amt) * 0.5) this.heal(src, amt * 0.2); });
      }
      if (tagReveal && hasItem(src.hero, 'beacon') && tgt.id !== src.id) {
        this.revealers.push({ x: tgt.x, z: tgt.z, r: 6, team: src.team, until: this.time + 3 });
      }
    }
  }

  // ------------------------------------------------------------ kills / economy
  respawnTime(u: Unit): number {
    const lvl = u.hero!.level;
    return clamp(7 + lvl * 1.6 + (this.time / 60) * 0.9, 7, 34);
  }

  giveGold(u: Unit, amount: number, x?: number, z?: number) {
    const h = u.hero;
    if (!h || amount <= 0) return;
    h.gold += amount; h.totalGold += amount;
    this.emit({ t: 'gold', unit: u.id, amount: Math.round(amount), x: x ?? u.x, z: z ?? u.z });
  }

  giveXp(u: Unit, amount: number) {
    const h = u.hero;
    if (!h || h.level >= MAX_LEVEL || amount <= 0) return;
    h.xp += amount;
    while (h.level < MAX_LEVEL && h.xp >= XP_TO_LEVEL[h.level + 1]) {
      h.level++; h.skillPts++;
      this.recomputeStats(u);
      u.hp += (u.maxHp * 0.08);
      this.emit({ t: 'levelup', unit: u.id, level: h.level });
    }
  }

  private xpShare(x: number, z: number, killerTeam: Team, amount: number, range = 15) {
    const near = this.heroes.filter((h) => !h.dead && h.team === killerTeam && dist(h.x, h.z, x, z) <= range);
    if (!near.length) return;
    const each = (amount * (1 + 0.12 * (near.length - 1))) / near.length;
    for (const h of near) this.giveXp(h, each);
  }

  killUnit(v: Unit, killer: Unit | null) {
    if (v.dead) return;
    v.dead = true; v.hp = 0;
    const now = this.time;
    const kHero = killer ? (killer.kind === 'hero' ? killer : this.byId.get(killer.owner) ?? null) : null;
    const killerHero = kHero && kHero.kind === 'hero' ? kHero : null;
    this.emit({ t: 'death', unit: v.id });
    if (v.kind === 'hero') {
      const h = v.hero!;
      h.deaths++; h.deathStreak++; h.killStreak = 0;
      h.respawnAt = now + this.respawnTime(v);
      h.deathAt = now; h.lastDeathPos = { x: v.x, z: v.z };
      h.recallStart = 0; h.rec = [null, null, null, null];
      v.cast = null; v.dash = null; v.atkRelease = 0;
      v.order.t = 'idle';
      const assists: number[] = [];
      for (const [id, t] of v.damagers) {
        if (now - t > 10) continue;
        const a = this.byId.get(id);
        if (a && a.kind === 'hero' && a.team !== v.team && a.id !== killerHero?.id) assists.push(a.id);
      }
      let gold = 0;
      const killerTeam: Team = (killerHero ? killerHero.team : (1 - v.team) as Team) as Team;
      if (killerHero) {
        const kh = killerHero.hero!;
        kh.kills++; kh.killStreak++; kh.deathStreak = 0;
        const streakB = Math.min(250, Math.max(0, kh.killStreak - 1) * 50);
        const shutdown = Math.min(250, h.killStreak * 0 + Math.max(0, (v.hero!.killStreak) * 50)); // victim streak was reset above
        void shutdown;
        const lead = Math.max(0, Math.min(200, (this.heroes.filter((x) => x.team === v.team).reduce((s, x) => s + x.hero!.totalGold, 0)
          - this.heroes.filter((x) => x.team !== v.team).reduce((s, x) => s + x.hero!.totalGold, 0)) * 0.03));
        gold = 260 + v.hero!.level * 14 + streakB + lead;
        const assistShare = assists.length ? 0.5 : 0;
        this.giveGold(killerHero, gold * (1 - assistShare), v.x, v.z);
        for (const aid of assists) {
          const a = this.byId.get(aid)!;
          a.hero!.assists++;
          this.giveGold(a, (gold * assistShare) / assists.length + 20, v.x, v.z);
        }
        this.teams[killerHero.team as 0 | 1].kills++;
      } else {
        this.teams[killerTeam as 0 | 1].kills++;
        for (const aid of assists) { const a = this.byId.get(aid)!; a.hero!.assists++; this.giveGold(a, 90, v.x, v.z); }
      }
      // xp to nearby enemy heroes
      this.xpShare(v.x, v.z, killerTeam, 90 + h.level * 24, 20);
      const first = !this.firstBlood;
      this.firstBlood = true;
      this.emit({ t: 'kill', killer: killerHero?.id ?? (killer?.id ?? 0), victim: v.id, assists, gold: Math.round(gold), streak: killerHero?.hero!.killStreak ?? 0, first });
      this.note(`${killerHero?.hero?.name ?? killer?.name ?? 'The wild'}${killerHero ? ` (${killerTeam === 0 ? 'Tidewatch' : 'Cinderguard'})` : ''} defeated ${h.name} (${v.team === 0 ? 'Tidewatch' : 'Cinderguard'})`, killerTeam, 'kill');
    } else if (v.kind === 'minion' || v.kind === 'monster') {
      const killerTeam: Team = killer ? (killer.team as Team) : (1 - v.team) as Team;
      const isMonster = v.kind === 'monster';
      if (killerHero && v.team !== killerHero.team) {
        const kh = killerHero.hero!;
        if (isMonster) kh.monsterKills++; else kh.lastHits++;
        let g = v.gold;
        if (!isMonster && hasItem(kh, 'whetstone')) g += 5;
        if (!isMonster && hasItem(kh, 'quill')) killerHero.mana = Math.min(killerHero.maxMana, killerHero.mana + 8);
        this.giveGold(killerHero, g, v.x, v.z);
        if (isMonster) this.rules.onMonsterKilled(v, killerHero);
      } else if (isMonster && killer) {
        this.rules.onMonsterKilled(v, killerHero);
      }
      const xpTeam: Team = isMonster ? killerTeam : (1 - v.team) as Team;
      if (killer || !isMonster) this.xpShare(v.x, v.z, xpTeam as Team, v.xp * (killerHero ? 1 : 0.8), 15);
    } else if (v.stype) {
      this.rules.onStructureDestroyed(v, killer, killerHero);
    } else if (v.kind === 'ward') {
      this.emit({ t: 'fx', kind: 'burst', x: v.x, z: v.z, r: 1, color: 0x7ff0ff, dur: 0.4 });
    }
    // damage-over-time and marks cleanup
    for (const p of this.projectiles) if (p.homing === v.id) p.lifeEnd = -1;
  }

  // ------------------------------------------------------------ queries
  hostile(a: Team, b: Team): boolean { return a !== b; }
  isEnemyTarget(u: Unit, team: Team, opts: { structures?: boolean; wards?: boolean; needSight?: boolean } = {}): boolean {
    if (u.dead || u.team === team) return false;
    if (u.kind === 'ward') return !!opts.wards && this.canSee(team, u);
    if (u.stype) return !!opts.structures && !u.invuln;
    if (u.invuln) return false;
    if (opts.needSight !== false && team !== 2 && !this.canSee(team, u)) return false;
    return true;
  }
  unitsInCircle(x: number, z: number, r: number, f: (u: Unit) => boolean): Unit[] {
    const out: Unit[] = [];
    for (const u of this.units) {
      if (u.dead) continue;
      const rr = r + u.radius;
      const dx = u.x - x, dz = u.z - z;
      if (dx * dx + dz * dz <= rr * rr && f(u)) out.push(u);
    }
    return out;
  }
  unitsInCone(x: number, z: number, dx: number, dz: number, range: number, halfAngle: number, f: (u: Unit) => boolean): Unit[] {
    const out: Unit[] = [];
    const ang = Math.atan2(dz, dx);
    for (const u of this.units) {
      if (u.dead) continue;
      const d = dist(x, z, u.x, u.z);
      if (d > range + u.radius) continue;
      if (d > 0.4 && Math.abs(angDiff(ang, Math.atan2(u.z - z, u.x - x))) > halfAngle + Math.asin(Math.min(1, u.radius / Math.max(d, 0.5)))) continue;
      if (f(u)) out.push(u);
    }
    return out;
  }
  unitsInRect(x: number, z: number, dx: number, dz: number, len: number, wid: number, f: (u: Unit) => boolean): Unit[] {
    const out: Unit[] = [];
    const n = norm(dx, dz);
    for (const u of this.units) {
      if (u.dead) continue;
      const rx = u.x - x, rz = u.z - z;
      const along = rx * n.x + rz * n.z;
      const across = -rx * n.z + rz * n.x;
      if (along < -u.radius || along > len + u.radius || Math.abs(across) > wid / 2 + u.radius) continue;
      if (f(u)) out.push(u);
    }
    return out;
  }
  nearestEnemyHero(u: Unit, range: number, needSight = true): Unit | null {
    let best: Unit | null = null, bd = range;
    for (const h of this.heroes) {
      if (h.dead || h.team === u.team || h.invuln) continue;
      if (needSight && !this.canSee(u.team, h)) continue;
      const d = dist(u.x, u.z, h.x, h.z);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }

  // ------------------------------------------------------------ projectiles, zones, walls
  spawnProjectile(p: Partial<Projectile> & { team: Team; owner: number; x: number; z: number; dx: number; dz: number; speed: number; range: number }): Projectile {
    const n = norm(p.dx, p.dz);
    const pr: Projectile = {
      id: this.nextId++, radius: 0.6, traveled: 0, kind: 'skill', homing: 0, pierce: false, hitIds: new Set(), hitsAllies: false, power: 1, ult: false,
      bounces: 0, tag: '', dmg: 0, dtype: 'physical', label: '', fx: 'bolt', color: 0xffffff, size: 0.4, lifeEnd: 1e9, onHit: null, onEnd: null,
      firstHeroHit: false, data: {}, stopAtWall: true, edgeOnly: false, ...p, dx: n.x, dz: n.z,
    };
    this.projectiles.push(pr);
    return pr;
  }
  spawnZone(z: Partial<Zone> & { team: Team; owner: number; x: number; z: number; r: number; until: number }): Zone {
    const zone: Zone = {
      id: this.nextId++, shape: 'circle', w: 0, l: 0, ang: 0, tickEvery: 0, nextTick: 0, power: 1, ult: false, tag: '', fx: 'zone', color: 0xffffff,
      friendly: false, entered: new Set(), onTick: null, onEnter: null, onEnd: null, hp: 0, data: {}, startAt: this.time, ...z,
    };
    this.zones.push(zone);
    return zone;
  }
  addWall(x: number, z: number, r: number, hp: number, dur: number, team: Team) {
    const w: WallSeg = { id: this.nextId++, x, z, r, hp, maxHp: hp, until: this.time + dur, team };
    this.walls.push(w);
    return w;
  }
  inZone(z: Zone, u: Unit): boolean {
    if (z.shape === 'circle') return dist(z.x, z.z, u.x, u.z) <= z.r + u.radius * 0.6;
    const c = Math.cos(z.ang), s = Math.sin(z.ang);
    const rx = u.x - z.x, rz = u.z - z.z;
    const along = rx * c + rz * s, across = -rx * s + rz * c;
    return Math.abs(along) <= z.l / 2 + u.radius && Math.abs(across) <= z.w / 2 + u.radius;
  }

  private stepProjectiles() {
    const now = this.time;
    const list = this.projectiles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.lifeEnd < 0 || now > p.lifeEnd) { list.splice(i, 1); p.onEnd?.(p); continue; }
      let remove = false;
      if (p.homing) {
        const t = this.byId.get(p.homing);
        if (!t || t.dead) { list.splice(i, 1); continue; }
        const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
        const step = p.speed * DT;
        if (d <= step + t.radius * 0.6) {
          p.x = t.x; p.z = t.z;
          p.onHit?.(p, t);
          list.splice(i, 1);
          continue;
        }
        p.dx = dx / d; p.dz = dz / d;
        p.x += p.dx * step; p.z += p.dz * step;
        continue;
      }
      const total = p.speed * DT;
      const n = Math.max(1, Math.ceil(total / 0.5));
      const step = total / n;
      for (let s = 0; s < n && !remove; s++) {
        const nx = p.x + p.dx * step, nz = p.z + p.dz * step;
        // terrain
        if (p.stopAtWall && (isSolid(nx, nz) || !inIsland(nx, nz, -1.5))) {
          if (p.bounces > 0) {
            p.bounces--;
            const bx = !(isSolid(nx, p.z) || !inIsland(nx, p.z, -1.5)), bz = !(isSolid(p.x, nz) || !inIsland(p.x, nz, -1.5));
            if (bx && !bz) p.dz = -p.dz;
            else if (bz && !bx) p.dx = -p.dx;
            else { p.dx = -p.dx; p.dz = -p.dz; }
            p.hitIds.clear();
            this.emit({ t: 'hit', x: p.x, z: p.z, color: p.color, kind: 'spark' });
            continue;
          }
          remove = true; break;
        }
        // dynamic walls
        let blockedBy: WallSeg | null = null;
        for (const w of this.walls) if (w.until > now && (!p.ult) && dist(nx, nz, w.x, w.z) < w.r + p.radius * 0.5) { blockedBy = w; break; }
        if (blockedBy) {
          blockedBy.hp -= Math.max(40, p.dmg * 0.6);
          this.emit({ t: 'hit', x: nx, z: nz, color: 0xd8c8a8, kind: 'stone' });
          if (blockedBy.hp <= 0) blockedBy.until = 0;
          remove = true; break;
        }
        p.x = nx; p.z = nz; p.traveled += step;
        // unit hits
        for (const u of this.units) {
          if (u.dead || p.hitIds.has(u.id) || u.kind === 'ward') continue;
          const friendly = u.team === p.team;
          if (friendly && !p.hitsAllies) continue;
          if (friendly && u.kind !== 'hero') continue;
          if (!friendly) {
            if (u.stype || u.invuln) continue;
            if (u.kind === 'decoy' && false) continue;
            if (!this.canSee(p.team, u) && p.team !== 2) continue;
          }
          if (u.id === p.owner && !p.data.self) continue;
          const rr = p.radius + u.radius;
          const ddx = u.x - p.x, ddz = u.z - p.z;
          if (ddx * ddx + ddz * ddz > rr * rr) continue;
          p.hitIds.add(u.id);
          p.onHit?.(p, u);
          if (u.kind === 'hero' && !friendly) p.firstHeroHit = true;
          if (!p.pierce) { remove = true; break; }
        }
        if (p.traveled >= p.range) { remove = true; break; }
      }
      if (remove) { list.splice(i, 1); p.onEnd?.(p); }
    }
  }

  private stepZones() {
    const now = this.time;
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      if (now >= z.until) { this.zones.splice(i, 1); z.onEnd?.(z); continue; }
      if (z.onEnter) {
        for (const u of this.units) {
          if (u.dead || z.entered.has(u.id)) continue;
          if (this.inZone(z, u)) { z.entered.add(u.id); z.onEnter(z, u); }
        }
      }
      if (z.onTick && now >= z.nextTick) { z.nextTick = now + (z.tickEvery || 0.25); z.onTick(z); }
    }
    for (let i = this.walls.length - 1; i >= 0; i--) {
      if (this.walls[i].until <= now) this.walls.splice(i, 1);
    }
  }

  // ------------------------------------------------------------ orders / movement
  setOrder(u: Unit, t: Order['t'], x = 0, z = 0, target = 0) {
    const o = u.order;
    o.t = t; o.x = x; o.z = z; o.target = target; o.path = []; o.pi = 0; o.rp = 0;
  }

  private steer(u: Unit, tx: number, tz: number, useNav: boolean): boolean {
    const o = u.order;
    let gx = tx, gz = tz;
    const now = this.time;
    if (useNav && !walkLine(u.x, u.z, tx, tz)) {
      if (o.path.length === 0 || now >= o.rp) {
        o.path = findPath(u.x, u.z, tx, tz); o.pi = 0; o.rp = now + 0.6;
      }
      while (o.pi < o.path.length - 1 && dist(u.x, u.z, o.path[o.pi].x, o.path[o.pi].z) < 0.35) o.pi++;
      if (o.pi < o.path.length) { gx = o.path[o.pi].x; gz = o.path[o.pi].z; }
    } else if (useNav) { o.path = []; }
    const dx = gx - u.x, dz = gz - u.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.02) return true;
    const sp = u.ms * DT;
    const k = Math.min(1, sp / d);
    this.moveBy(u, dx * k, dz * k);
    const ang = Math.atan2(dz, dx);
    u.facing = lerpAngle(u.facing, ang, 0.4);
    return false;
  }

  moveBy(u: Unit, dx: number, dz: number) {
    const nx = u.x + dx, nz = u.z + dz;
    if (isWalkable(nx, nz) || !isWalkable(u.x, u.z)) { u.x = nx; u.z = nz; return; }
    if (isWalkable(nx, u.z)) { u.x = nx; return; }
    if (isWalkable(u.x, nz)) { u.z = nz; return; }
  }

  /** furthest walkable point along a segment */
  clipToWalkable(sx: number, sz: number, ex: number, ez: number) {
    if (walkLine(sx, sz, ex, ez)) return { x: ex, z: ez };
    const d = dist(sx, sz, ex, ez);
    const n = Math.ceil(d / 0.4);
    let lx = sx, lz = sz;
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = sx + (ex - sx) * t, z = sz + (ez - sz) * t;
      if (!isWalkable(x, z)) break;
      lx = x; lz = z;
    }
    return { x: lx, z: lz };
  }

  startDash(u: Unit, ex: number, ez: number, dur: number, kind: Dash['kind'], opts: { ignoreUnits?: boolean; onEnd?: () => void } = {}) {
    const end = this.clipToWalkable(u.x, u.z, ex, ez);
    u.dash = { sx: u.x, sz: u.z, ex: end.x, ez: end.z, t0: this.time, dur: Math.max(0.05, dur), ignoreUnits: opts.ignoreUnits ?? true, ghost: false, onEnd: opts.onEnd, kind };
    u.atkRelease = 0;
    u.cast = null;
    if (kind !== 'knock') u.facing = Math.atan2(end.z - u.z, end.x - u.x);
  }

  private stepDash(u: Unit) {
    const d = u.dash!;
    const t = clamp((this.time - d.t0) / d.dur, 0, 1);
    const e = d.kind === 'leap' ? t : 1 - (1 - t) * (1 - t);
    u.x = d.sx + (d.ex - d.sx) * e;
    u.z = d.sz + (d.ez - d.sz) * e;
    if (t >= 1) {
      u.dash = null;
      d.onEnd?.();
    }
  }

  private runOrder(u: Unit) {
    if (u.dash || this.isStunned(u) || u.cast || u.atkRelease > 0) return;
    const o = u.order;
    const rooted = this.isRooted(u);
    switch (o.t) {
      case 'idle':
      case 'hold': {
        const t = this.acquire(u, u.range + 0.5, false);
        if (t) this.tryAttack(u, t);
        return;
      }
      case 'move': {
        if (rooted) return;
        if (this.steer(u, o.x, o.z, true)) o.t = 'idle';
        else if (u.kind === 'hero') u.hero!.lastMoveDist += u.ms * DT;
        return;
      }
      case 'attack': {
        const t = this.byId.get(o.target);
        if (!t || t.dead || t.team === u.team || !(t.kind === 'ward' ? this.canSee(u.team, t) : (u.team === 2 || this.canSee(u.team, t))) || (t.invuln && t.kind !== 'ward')) {
          o.t = 'idle'; return;
        }
        const d = dist(u.x, u.z, t.x, t.z);
        const reach = u.range + t.radius + u.radius * 0.4;
        if (d <= reach) this.tryAttack(u, t);
        else if (!rooted) { this.steer(u, t.x, t.z, u.kind === 'hero'); if (u.kind === 'hero') u.hero!.lastMoveDist += u.ms * DT; }
        return;
      }
      case 'amove': {
        const t = this.acquire(u, Math.max(u.range + 1, u.kind === 'hero' ? 7.5 : 8), true);
        if (t) {
          const d = dist(u.x, u.z, t.x, t.z);
          if (d <= u.range + t.radius + u.radius * 0.4) this.tryAttack(u, t);
          else if (!rooted) this.steer(u, t.x, t.z, false);
        } else if (!rooted) {
          if (this.steer(u, o.x, o.z, u.kind === 'hero')) o.t = 'idle';
          else if (u.kind === 'hero') u.hero!.lastMoveDist += u.ms * DT;
        }
        return;
      }
      case 'castmove': {
        const def = HERO_BY_ID[u.hero!.heroId].abilities[o.slot];
        const t = this.byId.get(o.target);
        if (!t || t.dead) { o.t = 'idle'; return; }
        if (dist(u.x, u.z, t.x, t.z) <= def.range + t.radius) {
          o.t = 'idle';
          this.beginCast(u, o.slot, { tx: t.x, tz: t.z, dx: t.x - u.x, dz: t.z - u.z, target: t.id }, true);
        } else if (!rooted) this.steer(u, t.x, t.z, true);
        return;
      }
    }
  }

  /** Pick an attack target within range of u. Heroes prefer heroes, then low-health minions. */
  acquire(u: Unit, range: number, chase: boolean): Unit | null {
    let best: Unit | null = null, bs = Infinity;
    const passive = u.order.t === 'idle' || u.order.t === 'hold';
    for (const t of this.units) {
      if (t.dead || t.team === u.team || t.kind === 'ward' || t.invuln) continue;
      // idle heroes never wake neutral camps on their own; they only fight monsters that are already attacking them
      if (t.kind === 'monster' && u.team !== 2 && passive && t.camp?.target !== u.id) continue;
      if (!this.canSee(u.team, t)) continue;
      const d = dist(u.x, u.z, t.x, t.z) - t.radius;
      if (d > range) continue;
      let s = d;
      if (t.kind === 'hero') s -= 2.5;
      else if (t.kind === 'decoy') s += 8;
      else if (t.stype) s += 5;
      else s += (t.hp / t.maxHp) * 1.5;
      if (s < bs) { bs = s; best = t; }
    }
    void chase;
    return best;
  }

  tryAttack(u: Unit, t: Unit) {
    if (this.isDisarmed(u)) return;
    const now = this.time;
    const dx = t.x - u.x, dz = t.z - u.z;
    u.facing = lerpAngle(u.facing, Math.atan2(dz, dx), 0.6);
    if (now < u.atkNext || u.atkRelease > 0) return;
    const asNow = Math.max(0.2, u.as);
    const wind = Math.max(0.08, Math.min(u.windup * (u.kind === 'hero' ? HERO_BY_ID[u.hero!.heroId].as / asNow : 1), 0.7 / asNow));
    u.atkTarget = t.id;
    u.atkRelease = now + wind;
    u.atkNext = now + 1 / asNow;
    if (u.kind === 'hero') this.cancelRecall(u, 'attack');
  }

  private stepAttackRelease(u: Unit) {
    if (u.atkRelease <= 0 || this.time < u.atkRelease) return;
    u.atkRelease = 0;
    if (this.isDisarmed(u) || u.dead) return;
    const t = this.byId.get(u.atkTarget);
    if (!t || t.dead) { u.atkNext = this.time; return; }
    const d = dist(u.x, u.z, t.x, t.z);
    if (d > u.range + t.radius + u.radius * 0.4 + 1.0) { u.atkNext = this.time + 0.1; return; }
    if (u.kind === 'hero') this.cancelRecall(u, 'attack');
    if (u.projSpeed > 0) {
      this.spawnProjectile({
        team: u.team, owner: u.id, x: u.x, z: u.z, dx: t.x - u.x, dz: t.z - u.z, speed: u.projSpeed, range: 99, homing: t.id, kind: 'basic', radius: 0.3,
        color: u.hero ? HERO_BY_ID[u.hero.heroId].accent : (u.team === 0 ? 0x8ac8ff : 0xff9a8a), size: 0.22, fx: 'basic',
        onHit: (_p, tt) => this.attackHit(u, tt),
      });
    } else this.attackHit(u, t);
    this.emit({ t: 'sfx', name: u.projSpeed > 0 ? 'shoot' : 'swing', x: u.x, z: u.z });
  }

  attackHit(u: Unit, t: Unit) {
    if (u.dead && u.kind !== 'minion') { /* attacks already released still land */ }
    if (t.dead) return;
    let dmg = u.ad;
    let dtype: DamageType = 'physical';
    let pen = 0;
    if (u.kind === 'hero') {
      const b = heroOnAttack(this, u, t);
      dmg += b.bonus; pen += b.pen;
      if (b.dtype) dtype = b.dtype;
      applyItemPassivesOnHit(this, u, t);
    }
    if (u.kind === 'minion' && t.stype) dmg *= u.mtype === 'siege' ? 1.8 : 1;
    this.damage(u, t, dmg, dtype, { isAttack: true, pen, label: 'Attack' });
    // Parcel charge: attacks accelerate detonation
    if (u.kind === 'hero') {
      const ch = this.getEffect(t, 'charge');
      if (ch && ch.src === u.id) ch.until -= 0.5;
    }
  }

  // ------------------------------------------------------------ casting
  beginCast(u: Unit, slot: number, p: CastParams, fromMove = false): boolean {
    const h = u.hero;
    if (!h || u.dead) return false;
    const d = HERO_BY_ID[h.heroId];
    const def = d.abilities[slot];
    const now = this.time;
    const reject = (reason: string) => { if (u.hero!.controller === 'player') this.emit({ t: 'reject', unit: u.id, reason }); return false; };
    if (u.dash) return false;
    if (u.cast) return false;
    if (h.ranks[slot] <= 0) return reject('Not learned');
    if (this.isSilenced(u)) return reject('Silenced');
    const rec = h.rec[slot];
    const isRecast = !!(rec && rec.until > now);
    if (!isRecast) {
      if (h.cds[slot] > now) return reject('On cooldown');
      const cost = def.cost[h.ranks[slot] - 1];
      if (u.mana < cost) return reject(d.resource === 'energy' ? 'Not enough energy' : 'Not enough mana');
    }
    let tgt: Unit | undefined;
    // target validation
    if (def.targeting === 'unit' || def.targeting === 'ally') {
      tgt = this.byId.get(p.target);
      if (!tgt || tgt.dead) return reject('Invalid target');
      if (def.targeting === 'unit' && (tgt.team === u.team || tgt.invuln || (tgt.stype && true) || tgt.kind === 'ward' || !this.canSee(u.team, tgt))) return reject('Invalid target');
      if (def.targeting === 'ally' && (tgt.team !== u.team || tgt.kind !== 'hero' || tgt.id === u.id)) return reject('Invalid target');
      if (h.heroId === 'vey' && slot === 3 && tgt.kind !== 'hero') return reject('Needs a hero');
      const dd = dist(u.x, u.z, tgt.x, tgt.z);
      if (dd > def.range + tgt.radius + 0.3) {
        if (fromMove) return false;
        // walk into range
        this.setOrder(u, 'castmove', tgt.x, tgt.z, tgt.id);
        u.order.slot = slot;
        return false;
      }
    }
    // direction / point
    let { tx, tz } = p;
    let dx = p.dx, dz = p.dz;
    if (def.targeting === 'point') {
      const dd = dist(u.x, u.z, tx, tz);
      if (dd > def.range) { const k = def.range / dd; tx = u.x + (tx - u.x) * k; tz = u.z + (tz - u.z) * k; }
      dx = tx - u.x; dz = tz - u.z;
    }
    if (def.targeting === 'dir' || def.targeting === 'self') {
      const l = Math.hypot(dx, dz);
      if (l < 0.05) { dx = Math.cos(u.facing); dz = Math.sin(u.facing); } else { dx /= l; dz /= l; }
      tx = u.x + dx * def.range; tz = u.z + dz * def.range;
    }
    if (tgt) { dx = tgt.x - u.x; dz = tgt.z - u.z; tx = tgt.x; tz = tgt.z; }
    if (!isRecast) {
      const cost = def.cost[h.ranks[slot] - 1];
      u.mana -= cost;
      const cdv = def.cd[h.ranks[slot] - 1] * (100 / (100 + u.haste));
      if (def.recast) h.rec[slot] = { until: now + def.recast + def.castTime, fullCd: cdv, data: {} };
      else h.cds[slot] = now + cdv;
      if (def.recast) h.cds[slot] = now + 0.4;
    }
    this.cancelRecall(u, 'cast');
    u.atkRelease = 0;
    u.order.path = [];
    if (u.order.t === 'move' || u.order.t === 'castmove') { /* keep destination, resume after cast */ }
    u.facing = Math.atan2(dz, dx);
    const full: CastParams = { tx, tz, dx, dz, target: tgt?.id ?? 0 };
    h.lastCombatAt = now;
    this.emit({ t: 'castStart', unit: u.id, ab: slot, time: def.castTime, x: tx, z: tz });
    if (def.castTime <= 0.06) {
      this.finishCast(u, slot, h.ranks[slot], full, isRecast);
    } else {
      u.cast = { slot, endAt: now + def.castTime, rank: h.ranks[slot], p: full, total: def.castTime, recast: isRecast };
      if (def.tags.includes("reveal")) u.revealUntil[1 - u.team] = Math.max(u.revealUntil[1 - u.team], now + def.castTime + 0.3);
    }
    return true;
  }

  private finishCast(u: Unit, slot: number, rank: number, p: CastParams, isRecast: boolean) {
    const h = u.hero!;
    const impl = HERO_IMPL[h.heroId];
    this.emit({ t: 'cast', unit: u.id, ab: slot, heroId: h.heroId, x: p.tx, z: p.tz, dx: p.dx, dz: p.dz });
    impl(this, u, slot, rank, p, isRecast);
  }

  private stepCast(u: Unit) {
    const c = u.cast!;
    if (this.isStunned(u) || u.dead) { u.cast = null; return; }
    if (this.time >= c.endAt) {
      u.cast = null;
      this.finishCast(u, c.slot, c.rank, c.p, c.recast);
    }
  }

  // ------------------------------------------------------------ recall / talents
  startRecall(u: Unit) {
    const h = u.hero!;
    if (u.dead || h.recallStart > 0) return;
    const t = this.teams[u.team as 0 | 1];
    const dur = t.colossusUntil > this.time ? RECALL_TIME * 0.65 : RECALL_TIME;
    h.recallStart = Math.max(this.time, 0.001); h.recallDur = dur;
    u.order.t = u.order.t === 'move' ? 'idle' : u.order.t;
    this.emit({ t: 'recall', unit: u.id, done: false });
  }
  cancelRecall(u: Unit, _why: string) {
    const h = u.hero;
    if (!h || h.recallStart <= 0) return;
    h.recallStart = 0;
    this.emit({ t: 'recall', unit: u.id, done: false, cancelled: true });
  }
  inShop(u: Unit): boolean {
    const f = TEAM_BASE[u.team as 0 | 1].fountain;
    return dist(u.x, u.z, f.x, f.z) <= SHOP_RANGE;
  }

  useTalent(u: Unit, idx: number, x: number, z: number) {
    const h = u.hero!;
    const id = h.talents[idx];
    const def = TALENT_BY_ID[id];
    if (!def || u.dead || h.talentCds[idx] > this.time || (this.isStunned(u) && id !== 'purify')) return;
    const now = this.time;
    switch (id) {
      case 'skyhop': {
        if (this.has(u, 'root') && false) return;
        const n = norm(x - u.x, z - u.z);
        this.startDash(u, u.x + n.x * 6, u.z + n.z * 6, 0.12, 'dash');
        break;
      }
      case 'mend': this.heal(u, u.maxHp * 0.14 * (u.hp / u.maxHp < 0.4 ? 2 : 1)); this.emit({ t: 'fx', kind: 'heal', x: u.x, z: u.z, r: 1.5, color: 0xffd860, dur: 0.8 }); break;
      case 'aegis': this.grantShield(u, u, u.maxHp * 0.12 + 60, 3); break;
      case 'sprint': this.addEffect(u, 'haste', 3, 0.35, u.id, { tag: 'sprint' }); break;
      case 'cinder': {
        const t = this.nearestEnemyHero(u, 6);
        if (!t) { if (h.controller === 'player') this.emit({ t: 'reject', unit: u.id, reason: 'No target in range' }); return; }
        const total = 60 + 10 * h.level;
        for (let i = 1; i <= 6; i++) this.after(i * 0.5, () => { if (!t.dead) this.damage(u, t, total / 6, 'pure', { label: 'Cinder Mark' }); });
        this.emit({ t: 'fx', kind: 'ring', x: t.x, z: t.z, r: 1.4, color: 0xff7a30, dur: 0.6 });
        break;
      }
      case 'purify': this.cleanse(u); break;
    }
    h.talentCds[idx] = now + def.cd;
    this.cancelRecall(u, 'talent');
  }

  placeWard(u: Unit, x: number, z: number) {
    const h = u.hero!;
    if (u.dead || h.trinketCharges <= 0) { if (h.controller === 'player') this.emit({ t: 'reject', unit: u.id, reason: 'No ward charges' }); return false; }
    const d = dist(u.x, u.z, x, z);
    if (d > 9) { const k = 9 / d; x = u.x + (x - u.x) * k; z = u.z + (z - u.z) * k; }
    if (!isWalkable(x, z)) { const p = nearestWalkable(x, z); x = p.x; z = p.z; }
    const mine = this.units.filter((w) => w.kind === 'ward' && w.team === u.team && !w.dead);
    if (mine.length >= 6) {
      const oldest = mine.sort((a, b) => a.expires - b.expires)[0];
      this.killUnit(oldest, null);
    }
    const w = this.blank('ward', u.team, 'Ward', x, z, 0.4);
    w.hp = 3; w.maxHp = 3; w.vision = 8.5; w.expires = this.time + 90; w.owner = u.id; w.visUntil[u.team] = 1e9;
    h.trinketCharges--; h.wardsPlaced++;
    if (h.trinketNext <= this.time) h.trinketNext = this.time + 45 / (1 + 0);
    this.emit({ t: 'ward', unit: w.id, x, z, team: u.team });
    this.emit({ t: 'sfx', name: 'ward', x, z });
    return true;
  }

  // ------------------------------------------------------------ commands
  command(cmd: Command) {
    if (this.recordCommands) this.commandLog.push({ tick: this.tick, cmd });
    const u = this.heroes[cmd.slot];
    if (!u || this.winner >= 0) return;
    const h = u.hero!;
    const now = this.time;
    if (u.dead) {
      if (cmd.c === 'buy' || cmd.c === 'sell' || cmd.c === 'undo') { /* allow shopping while dead only in fountain */ }
      else return;
    }
    switch (cmd.c) {
      case 'move': {
        if (u.cast || u.dash || this.isStunned(u)) { if (!u.cast || u.cast.total < 0.4) return; }
        if (u.cast) return;
        this.cancelRecall(u, 'move');
        u.atkRelease = 0;
        this.setOrder(u, 'move', cmd.x, cmd.z);
        const p = findPath(u.x, u.z, cmd.x, cmd.z);
        u.order.path = p; u.order.rp = now + 1.2;
        break;
      }
      case 'attack': {
        if (u.cast || u.dash) return;
        const t = this.byId.get(cmd.target);
        if (!t || t.dead || t.team === u.team) return;
        if (!this.canSee(u.team, t)) return;
        this.cancelRecall(u, 'attack');
        if (u.atkRelease > 0 && u.atkTarget !== t.id) u.atkRelease = 0;
        this.setOrder(u, 'attack', 0, 0, t.id);
        break;
      }
      case 'amove': {
        if (u.cast || u.dash) return;
        this.cancelRecall(u, 'move');
        u.atkRelease = 0;
        this.setOrder(u, 'amove', cmd.x, cmd.z);
        break;
      }
      case 'stop': { this.cancelRecall(u, 'stop'); u.atkRelease = 0; this.setOrder(u, 'idle'); break; }
      case 'hold': { this.cancelRecall(u, 'stop'); this.setOrder(u, 'hold'); break; }
      case 'cast': {
        const dx = cmd.x - u.x, dz = cmd.z - u.z;
        this.beginCast(u, cmd.ab, { tx: cmd.x, tz: cmd.z, dx, dz, target: cmd.target });
        break;
      }
      case 'rank': {
        const slot = cmd.ab;
        if (h.skillPts <= 0 || slot < 0 || slot > 3) return;
        const r = h.ranks[slot];
        if (slot === 3) { if (r >= 2 || h.level < (r === 0 ? 6 : 11)) return; }
        else { if (r >= 4 || h.level < r * 2 - 1) return; }
        h.ranks[slot]++; h.skillPts--;
        h.skillLog.push(`${h.level}:${'QWER'[slot]}`);
        break;
      }
      case 'talent': this.useTalent(u, cmd.idx, cmd.x, cmd.z); break;
      case 'buy': if (this.inShop(u)) buyItem(this, u, cmd.item); else this.emit({ t: 'reject', unit: u.id, reason: 'Must be at the fountain' }); break;
      case 'sell': if (this.inShop(u)) sellItem(this, u, cmd.idx); else this.emit({ t: 'reject', unit: u.id, reason: 'Must be at the fountain' }); break;
      case 'undo': undoBuy(this, u); break;
      case 'use': useItem(this, u, cmd.idx); break;
      case 'recall': {
        if (h.recallStart > 0) this.cancelRecall(u, 'toggle');
        else if (!this.inShop(u)) this.startRecall(u);
        break;
      }
      case 'ward': this.placeWard(u, cmd.x, cmd.z); break;
    }
  }

  // ------------------------------------------------------------ main tick
  step() {
    if (this.winner >= 0 && this.tick > this.lastTick + 60) return;
    this.tick++;
    const now = this.time;
    for (const u of this.units) { u.px = u.x; u.pz = u.z; u.pfacing = u.facing; }

    // timers
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= now);
      if (due.length) {
        this.timers = this.timers.filter((t) => t.at > now);
        for (const t of due) t.fn();
      }
    }
    this.rules.step();
    this.bots.update();

    // economy & regen
    if (this.tick % 3 === 0) {
      for (const g of this.heroes) {
        if (!g.dead && g.hero) {
          const gps = PASSIVE_GOLD + (sumItemStats(g.hero).passiveGold ?? 0);
          this.giveGoldSilent(g, gps * DT * 3);
        }
      }
    }
    for (const u of this.units) {
      if (u.dead) continue;
      if (u.kind === 'hero' || u.kind === 'minion' || u.kind === 'monster' || u.kind === 'decoy' || u.kind === 'ward') {
        if (u.kind === 'hero' || this.tick % 3 === 0) this.recomputeStats(u);
      }
      if (u.kind === 'hero') this.stepHero(u);
      if (u.dash) this.stepDash(u);
      else if (u.kind !== 'tower' && u.kind !== 'seal' && u.kind !== 'core' && u.kind !== 'engine' && u.kind !== 'ward') {
        if (u.cast) this.stepCast(u);
        if (!u.dead) { this.stepAttackRelease(u); this.runOrder(u); }
      }
      if (u.expires > 0 && now >= u.expires && !u.dead) this.killUnit(u, null);
    }
    this.separate();
    this.stepProjectiles();
    this.stepZones();
    if (this.tick - this.lastVisTick >= 3) { this.updateVision(); this.lastVisTick = this.tick; }
    // purge dead non-heroes
    if (this.units.some((u) => u.dead && u.kind !== 'hero')) {
      this.units = this.units.filter((u) => {
        if (u.dead && u.kind !== 'hero') { this.byId.delete(u.id); return false; }
        return true;
      });
    }
    if (this.revealers.length) this.revealers = this.revealers.filter((r) => r.until > now);
    if (this.events.length > 4000) this.events.splice(0, this.events.length - 2000);
  }

  private giveGoldSilent(u: Unit, amt: number) { u.hero!.gold += amt; u.hero!.totalGold += amt; }

  private stepHero(u: Unit) {
    const h = u.hero!;
    const now = this.time;
    if (u.dead) return;
    // regen
    u.hp = Math.min(u.maxHp, u.hp + u.hpRegen * DT);
    u.mana = Math.min(u.maxMana, u.mana + u.manaRegen * DT);
    const reg = this.getEffect(u, 'regen');
    if (reg) this.heal(u, reg.amount * DT, true);
    const mreg = this.getEffect(u, 'manaRegen');
    if (mreg) u.mana = Math.min(u.maxMana, u.mana + mreg.amount * DT);
    // fountain
    const f = TEAM_BASE[u.team as 0 | 1].fountain;
    if (dist(u.x, u.z, f.x, f.z) < 7) {
      u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.1 * DT);
      u.mana = Math.min(u.maxMana, u.mana + u.maxMana * 0.1 * DT);
    }
    // trinket
    const maxCh = 2 + (sumItemStats(h).wardCharges ?? 0);
    if (h.trinketCharges < maxCh && now >= h.trinketNext) { h.trinketCharges++; h.trinketNext = now + 40; }
    // recall
    if (h.recallStart > 0 && now - h.recallStart >= h.recallDur) {
      h.recallStart = 0;
      const sp = TEAM_BASE[u.team as 0 | 1].spawn;
      u.x = sp.x; u.z = sp.z + (h.slot % 3 - 1) * 2; u.px = u.x; u.pz = u.z;
      this.setOrder(u, 'idle');
      this.emit({ t: 'recall', unit: u.id, done: true });
    }
    // item cooldown handled in itemTick
    itemTick(this, u);
    heroTick(this, u);
    // respawn handled in rules
    // brush & visibility book keeping
    u.brush = brushAt(u.x, u.z);
  }

  heroRespawn(u: Unit) {
    const h = u.hero!;
    const sp = TEAM_BASE[u.team as 0 | 1].spawn;
    u.dead = false;
    u.x = sp.x; u.z = sp.z + (h.slot % 3 - 1) * 2.4;
    u.px = u.x; u.pz = u.z;
    this.recomputeStats(u);
    u.hp = u.maxHp; u.mana = u.maxMana; u.shield = 0;
    u.effects = [];
    this.setOrder(u, 'idle');
    h.recallStart = 0;
    this.emit({ t: 'spawn', unit: u.id });
  }

  private separate() {
    const mob = this.sepCache;
    mob.length = 0;
    for (const u of this.units) if (!u.dead && (u.kind === 'hero' || u.kind === 'minion' || u.kind === 'monster' || u.kind === 'decoy') && !u.dash) mob.push(u);
    for (let i = 0; i < mob.length; i++) {
      const a = mob[i];
      for (let j = i + 1; j < mob.length; j++) {
        const b = mob[j];
        const dx = b.x - a.x;
        if (dx > 2 || dx < -2) continue;
        const dz = b.z - a.z;
        const rr = a.radius + b.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.001;
        const ov = rr - d;
        const same = a.team === b.team;
        // units that are attacking in place resist being shoved
        const wa = a.atkRelease > 0 || a.order.t === 'hold' || a.cast ? 0.25 : 1;
        const wb = b.atkRelease > 0 || b.order.t === 'hold' || b.cast ? 0.25 : 1;
        const k = same ? 0.3 : 0.45;
        const s = (ov * k) / (wa + wb);
        const nx = dx / d, nz = dz / d;
        this.moveBy(a, -nx * s * wa, -nz * s * wa);
        this.moveBy(b, nx * s * wb, nz * s * wb);
      }
    }
    // structures and walls push units out
    for (const s of this.units) {
      if (s.dead || !s.stype) continue;
      for (const m of mob) {
        const dx = m.x - s.x, dz = m.z - s.z;
        const rr = s.radius + m.radius * 0.7;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.001;
        this.moveBy(m, (dx / d) * (rr - d), (dz / d) * (rr - d));
      }
    }
    for (const w of this.walls) {
      if (w.until <= this.time) continue;
      for (const m of mob) {
        const dx = m.x - w.x, dz = m.z - w.z;
        const rr = w.r + m.radius * 0.8;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.001;
        this.moveBy(m, (dx / d) * (rr - d), (dz / d) * (rr - d));
      }
    }
  }

  // ------------------------------------------------------------ vision
  observers(team: Team): { x: number; z: number; r: number; ward: boolean }[] {
    const out: { x: number; z: number; r: number; ward: boolean }[] = [];
    const now = this.time;
    for (const u of this.units) {
      if (u.dead || u.team !== team) continue;
      if (u.kind === 'ward') { if (u.disabledUntil > now) continue; out.push({ x: u.x, z: u.z, r: u.vision, ward: true }); continue; }
      if (u.kind === 'monster' || u.kind === 'decoy') continue;
      out.push({ x: u.x, z: u.z, r: u.vision, ward: false });
    }
    for (const r of this.revealers) if (r.team === team && r.until > now) out.push({ x: r.x, z: r.z, r: r.r, ward: true });
    return out;
  }

  updateVision() {
    const now = this.time;
    for (const team of [0, 1] as Team[]) {
      const obs = this.observers(team);
      const obsBrush = obs.map((o) => brushAt(o.x, o.z));
      for (const u of this.units) {
        if (u.dead || u.team === team) continue;
        const sealed = u.revealUntil[team] > now;
        if (sealed) { u.visUntil[team] = now + 0.1; continue; }
        const ub = u.brush = u.kind === 'ward' ? 0 : brushAt(u.x, u.z);
        let seen = false;
        for (let i = 0; i < obs.length && !seen; i++) {
          const o = obs[i];
          let r = o.r;
          if (u.kind === 'ward') r = Math.min(r, 3.4);
          const dx = u.x - o.x, dz = u.z - o.z;
          if (dx * dx + dz * dz > (r + u.radius) * (r + u.radius)) continue;
          if (ub > 0 && !o.ward && obsBrush[i] !== ub && dx * dx + dz * dz > 4.6 * 4.6) continue;
          if (!o.ward && !sightLine(o.x, o.z, u.x, u.z) && dx * dx + dz * dz > 3 * 3) continue;
          seen = true;
        }
        if (seen) u.visUntil[team] = now + 0.1;
      }
    }
  }

  /** Is world point visible to a team (for fog rendering helpers). */
  pointVisible(team: Team, x: number, z: number): boolean {
    for (const o of this.observers(team)) if (dist2(o.x, o.z, x, z) <= o.r * o.r) return true;
    return false;
  }

  stateHash(): number {
    let h = 2166136261;
    const mix = (n: number) => { h ^= Math.round(n * 100) | 0; h = Math.imul(h, 16777619); };
    for (const u of this.units) { mix(u.id); mix(u.x); mix(u.z); mix(u.hp); }
    for (const g of this.heroes) { mix(g.hero!.gold); mix(g.hero!.level); }
    return h >>> 0;
  }
}

function dist2(ax: number, az: number, bx: number, bz: number) { return (ax - bx) ** 2 + (az - bz) ** 2; }
void ITEM_BY_ID;
