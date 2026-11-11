// Authoritative match simulation at fixed 30 Hz. Owns all truth: movement, combat, economy, AI, victory.
import { Rng, dist, dist2, clamp } from '../shared/math';
import {
  STRUCTURES, CAMPS, FOUNTAIN, LANES, inFountain, FOG_W, FOG_H, Team, getMapGrid, brushAt, CampDef, FOUNTAIN_RADIUS,
} from '../shared/map';
import { HEROES, STARTERS } from '../shared/heroes';
import { ITEMS, TALENTS } from '../shared/items';
import * as R from '../shared/rules';
import type { MatchSetup, Command, GameEvent, MatchResult, PlayerSetup, DeathRecap } from '../protocol/messages';
import type { Unit, Projectile, Zone, ZoneShape, TeamId, HeroState, PendingCast } from './types';
import { recomputeStats, dealDamage, addEffect, heal, hasEffect, isHardCC, canCast, addShield, hasItem, cooldownAfterHaste, effectValue } from './combat';
import { KITS, abilityDef, dirOf, clampPoint } from './abilities';
import { findPath, resolveStatic, walkableAt, raycastWall, nearestWalkable, lineClear } from './nav';
import { updateFog, isVisibleTo } from './fog';
import { updateMinion, updateTower, updateMonster, spawnCamp, campSpec } from './units';
import { buyItem, sellItem, undoShop, useItem, invalidateUndo } from './shop';
import { castTalent } from './talents';
import { Bot } from '../ai/bot';
import { ZERO_STATS } from '../shared/types';
import type { Stats } from '../shared/types';

export interface EventRoute { x?: number; y?: number; srcTeam?: TeamId; public?: boolean; team?: 0 | 1; slot?: number }
interface RoutedEvent { tick: number; ev: GameEvent; r: EventRoute }

export interface Parcel { owner: number; target: number; at: number; dmg: number }
interface Scheduled { at: number; fn: () => void }
interface Reveal { team: 0 | 1; x: number; y: number; r: number; until: number }
interface CampState { def: CampDef; alive: number[]; respawnAt: number; spawned: boolean }

export class Match {
  setup: MatchSetup;
  rng: Rng;
  tick = 0;
  time = 0;
  units: Unit[] = [];
  byId = new Map<number, Unit>();
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  nextId = 1;
  heroes: Unit[] = [];
  events: RoutedEvent[] = [];
  over = false;
  winner: 0 | 1 | -1 = -1;
  victoryFired = 0;
  fog: [Uint8Array, Uint8Array] = [new Uint8Array(FOG_W * FOG_H), new Uint8Array(FOG_W * FOG_H)];
  brushPresence: [Set<number>, Set<number>] = [new Set(), new Set()];
  reveals: Reveal[] = [];
  teamBuffs: Array<{ team: 0 | 1; kind: 'gale' | 'forge' | 'colossus'; until: number }> = [];
  camps: CampState[] = [];
  parcels: Parcel[] = [];
  annotations = new Map<number, Set<string>>();
  scheduled: Scheduled[] = [];
  structures = new Map<string, Unit>();
  waveCount = 0;
  nextWaveAt = R.FIRST_WAVE;
  timeline: Array<{ t: number; text: string; team: 0 | 1 | 2 }> = [];
  goldGraph: Array<[number, number, number]> = [];
  paused = false;
  timeScale = 1;
  firstBlood = false;
  bots: Bot[] = [];
  lastSeq = new Map<number, number>();
  kills: [number, number] = [0, 0];
  shakes: Array<{ x: number; y: number; amt: number }> = [];
  castCounter = 1;
  tutorialFlags: Record<string, number> = {};
  private grid = new Map<number, Unit[]>();

  constructor(setup: MatchSetup) {
    this.setup = setup;
    this.rng = new Rng(setup.seed);
    getMapGrid();
    for (const s of STRUCTURES) this.spawnStructure(s.key, s.kind, s.tier, s.team, s.lane, s.x, s.y);
    for (const t of [0, 1] as Team[]) this.spawnStructure(`${t}-fountain`, 'fountain', 'fountain', t, -1, FOUNTAIN[t].x, FOUNTAIN[t].y);
    for (const c of CAMPS) this.camps.push({ def: c, alive: [], respawnAt: campSpec(c.kind).firstSpawn, spawned: false });
    for (const p of setup.players) this.spawnHero(p);
    if (setup.mode === 'tutorial') {
      // Tutorial: compressed timers and fragile enemy structures so a full loop fits in a few minutes.
      for (const u of this.units) if (u.structure && u.team === 1) { u.base.maxHp *= 0.3; u.stats.maxHp = u.base.maxHp; u.hp = u.base.maxHp; }
      for (const c of this.camps) if (c.def.kind === 'catalystGale') c.respawnAt = 20;
    }
    for (const h of this.heroes) if (h.hero!.bot) this.bots.push(new Bot(this, h));
    updateFog(this, 0); updateFog(this, 1);
  }

  // ------------------------------------------------------------------ spawning
  private newUnit(kind: Unit['kind'], team: TeamId, x: number, y: number, radius: number, base: Stats, name: string): Unit {
    const u: Unit = {
      id: this.nextId++, kind, team, name, x, y, vx: 0, vy: 0, facing: team === 0 ? 0 : Math.PI, radius,
      hp: base.maxHp, mana: base.maxMana, base, stats: { ...base }, bonusAs: 0, effects: [], shields: [], alive: true, removeAt: 0,
      order: { type: 'idle' }, path: null, pathI: 0, pathGoalX: 0, pathGoalY: 0, repathAt: 0,
      atkTarget: 0, atkPhase: 0, atkTimer: 0, atkCd: 0, cast: null, dash: null, anim: 0, animT: 0,
      ranged: false, missileSpeed: 0, windup: 0.3, dmgLog: [], ccLog: [], lastSeen: [-999, -999], revealUntil: 0, brush: -1,
      combatUntil: 0, heroCombatUntil: 0, lastDamagedAt: -99, invulnerable: false, untargetable: false, sub: '',
    };
    this.units.push(u);
    this.byId.set(u.id, u);
    return u;
  }

  private spawnStructure(key: string, kind: Unit['kind'], tier: string, team: Team, lane: number, x: number, y: number) {
    const ts = (R.TOWER_STATS as any)[tier];
    const base: Stats = { ...ZERO_STATS(), maxHp: ts.hp, ad: ts.ad, armor: ts.armor, ward: ts.armor, range: ts.range, as: 1 / R.TOWER_ATTACK_PERIOD };
    const radius = kind === 'engine' ? 2.6 : kind === 'seal' ? 1.6 : kind === 'fountain' ? 1.5 : 1.2;
    const u = this.newUnit(kind, team, x, y, radius, base, tier === 'engine' ? 'Crown Engine' : tier === 'seal' ? 'Seal' : tier === 'fountain' ? 'Fountain' : `${tier[0].toUpperCase()}${tier.slice(1)} Tower`);
    u.structure = { key, tier: tier as any, lane, atkCd: 0, target: 0, rampN: 0, rampTarget: 0, respawnAt: 0, respawned: false };
    u.sub = tier;
    u.ranged = true;
    if (kind === 'fountain') u.invulnerable = true;
    this.structures.set(key, u);
  }

  private spawnHero(p: PlayerSetup) {
    const def = HEROES[p.hero];
    const f = FOUNTAIN[p.team];
    const offs = [-2.5, 0, 2.5][p.slot % 3];
    const u = this.newUnit('hero', p.team, f.x + (p.team === 0 ? 2 : -2), f.y + offs, def.radius, { ...def.base }, p.name);
    u.ranged = def.ranged; u.missileSpeed = def.missileSpeed; u.windup = def.windup; u.sub = def.id;
    const h: HeroState = {
      def, id: def.id, slot: p.slot, name: p.name, bot: p.bot, level: 1, xp: 0, gold: R.START_GOLD, totalGold: R.START_GOLD,
      items: [null, null, null, null, null, null], ranks: [0, 0, 0, 0], skillPoints: 1, cds: [0, 0, 0, 0], cdMax: [1, 1, 1, 1],
      talents: [...p.talents], talentCds: [0, 0], wardCharges: R.WARD_CHARGES, wardRechargeT: 0, respawnAt: 0,
      k: 0, d: 0, a: 0, cs: 0, streak: 0, dmgHeroes: 0, dmgTaken: 0, dmgStructures: 0, healing: 0, wardScore: 0, objectives: 0, structures: 0,
      recall: null, passive: {}, recast: {}, undo: [], inFountainPrev: true, skillOrder: [], lastHeroDamageAt: -99, aggroVictim: 0, aggroAt: -99,
      lastMoveX: 0, lastMoveY: 0, bounty: 0, noteCast: 0, quietRefunded: new Set(), cmdTimes: [], pingTimes: [], chatTimes: [], lastInputAt: 0,
      difficulty: p.difficulty,
    };
    u.hero = h;
    u.facing = p.team === 0 ? 0 : Math.PI;
    this.heroes[p.slot] = u;
    recomputeStats(this, u);
    u.hp = u.stats.maxHp; u.mana = u.stats.maxMana;
  }

  spawnMinion(team: Team, lane: number, kind: R.MinionKind, back: number) {
    const spec = R.MINIONS[kind];
    const pts = LANES[lane];
    const idx = team === 0 ? Math.min(pts.length - 1, 0) : pts.length - 1;
    const dirIdx = team === 0 ? 3 : pts.length - 4;
    const sx = pts[idx].x, sy = pts[idx].y;
    const ddx = pts[dirIdx].x - sx, ddy = pts[dirIdx].y - sy, dl = Math.hypot(ddx, ddy) || 1;
    const x = sx - (ddx / dl) * back, y = sy - (ddy / dl) * back;
    const mins = this.time / 60;
    const base: Stats = { ...ZERO_STATS(), maxHp: spec.hp + spec.hpGrowth * mins, ad: spec.ad + spec.adGrowth * mins, armor: spec.armor, ward: spec.armor * 0.5, as: spec.as, ms: spec.ms, range: spec.range };
    const p = nearestWalkable(x, y, spec.radius, 4) ?? { x: sx, y: sy };
    const u = this.newUnit('minion', team, p.x, p.y, spec.radius, base, `${kind[0].toUpperCase()}${kind.slice(1)} Minion`);
    u.minion = { kind, lane, wp: team === 0 ? 0 : pts.length - 1, aggroUntil: 0, empoweredUntil: 0 };
    u.ranged = spec.missile > 0; u.missileSpeed = spec.missile; u.windup = 0.3; u.sub = kind;
    u.facing = Math.atan2(ddy, ddx);
    return u;
  }

  spawnMonster(camp: string, kind: string, x: number, y: number, leash: number, stats: Stats, radius: number, ranged: boolean, name: string) {
    const u = this.newUnit('monster', 2, x, y, radius, stats, name);
    u.monster = { camp, kind: kind as any, homeX: x, homeY: y, leash, resetting: false, aggro: 0, specialCd: 4, contributors: new Map() };
    u.ranged = ranged; u.missileSpeed = ranged ? 14 : 0; u.sub = kind; u.windup = 0.35;
    return u;
  }

  spawnWall(owner: Unit, x: number, y: number, r: number, hp: number, dur: number) {
    const u = this.newUnit('wall', owner.team, x, y, r, { ...ZERO_STATS(), maxHp: hp, armor: 0, ward: 0 }, 'Rampart');
    u.wall = { owner: owner.id, until: this.time + dur };
    u.sub = 'rampart';
    // push units out of the new wall
    for (const t of this.unitsInRadius(x, y, r + 1, (t) => t.alive && (t.kind === 'hero' || t.kind === 'minion' || t.kind === 'monster'))) {
      const d = dist(x, y, t.x, t.y) || 0.01;
      const need = r + t.radius;
      if (d < need) { t.x = x + ((t.x - x) / d) * need; t.y = y + ((t.y - y) / d) * need; const p = resolveStatic(t.x, t.y, t.radius); t.x = p.x; t.y = p.y; }
    }
    return u;
  }

  spawnDecoy(owner: Unit, dx: number, dy: number, dur: number) {
    const u = this.newUnit('decoy', owner.team, owner.x, owner.y, owner.radius, { ...owner.stats }, owner.name);
    u.hp = owner.hp;
    u.decoy = { owner: owner.id, until: this.time + dur, dx, dy };
    u.sub = owner.hero!.id;
    u.facing = Math.atan2(dy, dx);
    return u;
  }

  popDecoy(d: Unit) {
    if (!d.alive) return;
    d.alive = false; d.removeAt = this.time;
    this.emit({ e: 'fx', kind: 'decoy-pop', x: d.x, y: d.y }, { x: d.x, y: d.y });
  }

  spawnZone(o: { team: TeamId; owner: number; x: number; y: number; shape: ZoneShape; dur: number; visual: string; hostile: boolean; ultimate?: boolean; publicTelegraph?: boolean; data?: Record<string, any> }): Zone {
    const z: Zone = { id: this.nextId++, team: o.team, owner: o.owner, x: o.x, y: o.y, shape: o.shape, start: this.time, end: this.time + o.dur, visual: o.visual, ultimate: !!o.ultimate, publicTelegraph: !!o.publicTelegraph, hostile: o.hostile, alive: true, data: o.data ?? {} };
    this.zones.push(z);
    return z;
  }

  spawnProjectile(o: { owner: Unit; dx: number; dy: number; speed: number; maxDist: number; radius: number; visual: string; homing?: number; pierce?: boolean; hitAllies?: boolean; ultimate?: boolean; bounces?: number; passWalls?: boolean; x?: number; y?: number; onHit: Projectile['onHit']; onWall?: Projectile['onWall']; filter?: Projectile['filter'] }): Projectile {
    const p: Projectile = {
      id: this.nextId++, team: o.owner.team, owner: o.owner.id, x: o.x ?? o.owner.x, y: o.y ?? o.owner.y, dx: o.dx, dy: o.dy, speed: o.speed, maxDist: o.maxDist, traveled: 0,
      radius: o.radius, homing: o.homing ?? 0, pierce: !!o.pierce, hitAllies: !!o.hitAllies, hitSet: new Set(), visual: o.visual, ultimate: !!o.ultimate,
      bounces: o.bounces ?? 0, alive: true, startX: o.x ?? o.owner.x, startY: o.y ?? o.owner.y, onHit: o.onHit, onWall: o.onWall, filter: o.filter, data: {}, passWalls: !!o.passWalls,
    };
    this.projectiles.push(p);
    return p;
  }

  startDash(u: Unit, ex: number, ey: number, speed: number, o: { dur?: number; passWalls?: boolean; airborne?: boolean; arc?: number; onEnd?: () => void }) {
    const d = Math.hypot(ex - u.x, ey - u.y);
    const dur = o.dur ?? Math.max(0.08, d / Math.max(1, speed));
    u.dash = { sx: u.x, sy: u.y, ex, ey, t: 0, dur, passWalls: !!o.passWalls, onEnd: o.onEnd, airborne: o.airborne, arc: o.arc };
    u.path = null;
    u.atkPhase = 0;
    u.anim = 6; u.animT = this.time;
    if (u.hero?.recall) this.cancelRecall(u);
  }

  schedule(delay: number, fn: () => void) { this.scheduled.push({ at: this.time + delay, fn }); }
  shake(x: number, y: number, amt: number) { this.shakes.push({ x, y, amt }); }
  addReveal(team: 0 | 1, x: number, y: number, r: number, dur: number) { this.reveals.push({ team, x, y, r, until: this.time + dur }); }

  // ------------------------------------------------------------------ queries
  isEnemy(a: Unit, b: Unit) { return a.team !== b.team; }
  visibleTo(team: 0 | 1, u: Unit) { return isVisibleTo(this, team, u); }
  teamBuff(team: TeamId, kind: 'gale' | 'forge' | 'colossus') {
    for (const b of this.teamBuffs) if (b.team === team && b.kind === kind && b.until > this.time) return true;
    return false;
  }
  inEnemyHush(u: Unit) {
    for (const z of this.zones) if (z.alive && z.visionMul && z.team !== u.team && z.shape.type === 'circle' && dist2(z.x, z.y, u.x, u.y) <= z.shape.r * z.shape.r) return true;
    return false;
  }
  wallBetween(ax: number, ay: number, bx: number, by: number) {
    for (const w of this.units) {
      if (w.kind !== 'wall' || !w.alive) continue;
      const abx = bx - ax, aby = by - ay, l2 = abx * abx + aby * aby || 1;
      const t = clamp(((w.x - ax) * abx + (w.y - ay) * aby) / l2, 0, 1);
      if (dist(w.x, w.y, ax + abx * t, ay + aby * t) < w.radius) return true;
    }
    return false;
  }

  private rebuildGrid() {
    this.grid.clear();
    for (const u of this.units) {
      if (!u.alive) continue;
      const k = ((Math.floor(u.x / 4) + 64) << 8) | (Math.floor(u.y / 4) + 64);
      let arr = this.grid.get(k);
      if (!arr) { arr = []; this.grid.set(k, arr); }
      arr.push(u);
    }
  }
  unitsInRadius(x: number, y: number, r: number, filter?: (u: Unit) => boolean): Unit[] {
    const out: Unit[] = [];
    const x0 = Math.floor((x - r - 3) / 4), x1 = Math.floor((x + r + 3) / 4), y0 = Math.floor((y - r - 3) / 4), y1 = Math.floor((y + r + 3) / 4);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const arr = this.grid.get(((gx + 64) << 8) | (gy + 64));
      if (!arr) continue;
      for (const u of arr) {
        if (!u.alive) continue;
        const rr = r + u.radius;
        if (dist2(x, y, u.x, u.y) <= rr * rr && (!filter || filter(u))) out.push(u);
      }
    }
    return out;
  }

  structureInvulnerable(u: Unit): boolean {
    if (!u.structure) return false;
    const s = u.structure;
    const team = u.team;
    if (s.tier === 'fountain') return true;
    if (s.tier === 'seal') return !!this.structures.get(`${team}-${s.lane}-guard`)?.alive;
    if (s.tier === 'core') return !this.anySealDown(team as Team);
    if (s.tier === 'engine') return !(this.anySealDown(team as Team) && !this.structures.get(`${team}-0-core`)!.alive && !this.structures.get(`${team}-1-core`)!.alive);
    if (s.tier === 'inner') return !!this.structures.get(`${team}-${s.lane}-outer`)?.alive;
    if (s.tier === 'guard') return !!this.structures.get(`${team}-${s.lane}-inner`)?.alive;
    return false;
  }
  anySealDown(team: Team) {
    return !this.structures.get(`${team}-0-seal`)!.alive || !this.structures.get(`${team}-1-seal`)!.alive;
  }
  isBackdoor(u: Unit): boolean {
    if (!u.structure) return false;
    for (const m of this.unitsInRadius(u.x, u.y, 11, (t) => t.kind === 'minion' && t.team !== u.team)) if (m) return false;
    return true;
  }

  // ------------------------------------------------------------------ events
  emit(ev: GameEvent, r: EventRoute = { public: true }) {
    this.events.push({ tick: this.tick, ev, r });
  }
  rejectFor(u: Unit, reason: string, seq = 0) {
    if (u.hero) this.emit({ e: 'reject', seq, reason }, { slot: u.hero.slot });
  }
  /** Events routed to a given team/slot since tick `since`. Fog filtering happens here, before serialization. */
  eventsFor(team: 0 | 1, slot: number, since: number): GameEvent[] {
    const out: GameEvent[] = [];
    for (const re of this.events) {
      if (re.tick < since) continue;
      const r = re.r;
      if (r.slot !== undefined) { if (r.slot === slot) out.push(re.ev); continue; }
      if (r.team !== undefined) { if (r.team === team) out.push(re.ev); continue; }
      if (r.public) { out.push(re.ev); continue; }
      if (r.srcTeam === team) { out.push(re.ev); continue; }
      if (r.x !== undefined && r.y !== undefined) {
        if (this.fogVisible(team, r.x, r.y)) out.push(re.ev);
        continue;
      }
      out.push(re.ev);
    }
    return out;
  }
  fogVisible(team: 0 | 1, x: number, y: number) {
    const cx = Math.floor(x + 75), cy = Math.floor(y + 57.5);
    if (cx < 0 || cy < 0 || cx >= FOG_W || cy >= FOG_H) return false;
    return this.fog[team][cy * FOG_W + cx] === 1;
  }

  // ------------------------------------------------------------------ commands
  command(slot: number, cmd: Command) {
    const u = this.heroes[slot];
    if (!u || this.over) return;
    const h = u.hero!;
    const last = this.lastSeq.get(slot) ?? -1;
    if (cmd.seq <= last) return; // duplicate or out-of-order: commands are idempotent by sequence
    this.lastSeq.set(slot, cmd.seq);
    // rate limit: 30 commands per second
    h.cmdTimes.push(this.time);
    while (h.cmdTimes.length && h.cmdTimes[0] < this.time - 1) h.cmdTimes.shift();
    if (h.cmdTimes.length > 30 && cmd.t !== 'stop') { this.rejectFor(u, 'Too many commands', cmd.seq); return; }
    h.lastInputAt = this.time;
    const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
    if ('x' in cmd && cmd.x !== undefined && (!num(cmd.x) || !num((cmd as any).y))) return;
    switch (cmd.t) {
      case 'move': {
        if (!u.alive) return;
        this.cancelRecall(u);
        u.order = { type: cmd.attackMove ? 'attackMove' : 'move', x: clamp(cmd.x, -75, 75), y: clamp(cmd.y, -57.5, 57.5) };
        this.setPath(u, u.order.x!, u.order.y!);
        if (u.atkPhase === 1) u.atkPhase = 0;
        if (this.setup.mode === 'tutorial') this.tutorialFlags.moved = (this.tutorialFlags.moved ?? 0) + 1;
        break;
      }
      case 'attack': {
        if (!u.alive) return;
        const t = this.byId.get(cmd.target);
        if (!t || !t.alive || t.team === u.team || t.kind === 'ward' && !this.visibleTo(u.team as 0 | 1, t)) { this.rejectFor(u, 'Invalid target', cmd.seq); return; }
        if (!this.visibleTo(u.team as 0 | 1, t)) { this.rejectFor(u, 'Target not visible', cmd.seq); return; }
        if (t.untargetable || t.kind === 'fountain') { this.rejectFor(u, 'Cannot attack that', cmd.seq); return; }
        this.cancelRecall(u);
        u.order = { type: 'attack', target: t.id };
        u.path = null; u.repathAt = 0;
        break;
      }
      case 'stop': u.order = { type: 'idle' }; u.path = null; if (u.atkPhase === 1) u.atkPhase = 0; break;
      case 'hold': u.order = { type: 'hold' }; u.path = null; break;
      case 'rank': {
        const slotN = cmd.slot | 0;
        if (slotN < 0 || slotN > 3 || h.skillPoints <= 0) { this.rejectFor(u, 'No skill points', cmd.seq); return; }
        const sl = (['Q', 'W', 'E', 'R'] as const)[slotN];
        if (!R.rankAllowed(sl, h.ranks[slotN], h.level)) { this.rejectFor(u, sl === 'R' ? 'Ultimate unlocks at 6 / 11' : 'Rank needs a higher level', cmd.seq); return; }
        h.ranks[slotN]++; h.skillPoints--; h.skillOrder.push(sl);
        break;
      }
      case 'cast': this.tryCast(u, { slot: cmd.slot | 0, kind: 'ability', x: cmd.x, y: cmd.y, target: cmd.target, seq: cmd.seq }); break;
      case 'talent': this.tryCast(u, { slot: cmd.slot | 0, kind: 'talent', x: cmd.x, y: cmd.y, target: cmd.target, seq: cmd.seq }); break;
      case 'item': {
        if (!u.alive) return;
        const r = useItem(this, u, cmd.slot | 0, cmd);
        if (r) this.rejectFor(u, r, cmd.seq);
        break;
      }
      case 'ward': {
        const r = this.placeWard(u, cmd.x, cmd.y, true);
        if (r) this.rejectFor(u, r, cmd.seq);
        break;
      }
      case 'recall': {
        if (!u.alive || h.recall || inFountain(u.team as Team, u.x, u.y)) return;
        u.order = { type: 'idle' }; u.path = null; u.cast = null;
        const dur = this.teamBuff(u.team, 'colossus') ? R.RECALL_TIME_EMPOWERED : R.RECALL_TIME;
        h.recall = { start: this.time, until: this.time + dur };
        this.emit({ e: 'recall', id: u.id, done: false, x: u.x, y: u.y }, { x: u.x, y: u.y, srcTeam: u.team });
        break;
      }
      case 'buy': { const r = buyItem(this, u, cmd.item); this.emit({ e: 'buy', item: cmd.item, ok: !r }, { slot }); if (r) this.rejectFor(u, r, cmd.seq); break; }
      case 'sell': { const r = sellItem(this, u, cmd.slot | 0); if (r) this.rejectFor(u, r, cmd.seq); break; }
      case 'undo': { const r = undoShop(this, u); if (r) this.rejectFor(u, r, cmd.seq); break; }
      case 'ping': {
        h.pingTimes.push(this.time);
        while (h.pingTimes.length && h.pingTimes[0] < this.time - 5) h.pingTimes.shift();
        if (h.pingTimes.length > 4) { this.rejectFor(u, 'Ping limit', cmd.seq); return; }
        this.emit({ e: 'ping', kind: cmd.kind, x: cmd.x, y: cmd.y, from: u.id, name: h.name }, { team: u.team as 0 | 1 });
        for (const b of this.bots) if (b.u.team === u.team && b.u !== u) b.onPing(cmd.kind, cmd.x, cmd.y, u);
        break;
      }
      case 'chat': {
        h.chatTimes.push(this.time);
        while (h.chatTimes.length && h.chatTimes[0] < this.time - 6) h.chatTimes.shift();
        if (h.chatTimes.length > 3) { this.rejectFor(u, 'Chat rate limit', cmd.seq); return; }
        const text = String(cmd.text).slice(0, 120).replace(/[<>]/g, '');
        this.emit({ e: 'chat', from: h.name, text: filterText(text), team: true }, { team: u.team as 0 | 1 });
        break;
      }
      case 'practice': this.practiceOp(u, cmd.op, cmd.value); break;
    }
  }

  private practiceOp(u: Unit, op: string, value?: number) {
    if (this.setup.mode !== 'practice') { this.rejectFor(u, 'Practice tools disabled'); return; }
    const h = u.hero!;
    switch (op) {
      case 'gold': h.gold += 1000; h.totalGold += 1000; break;
      case 'level': if (h.level < R.MAX_LEVEL) this.grantXp(u, R.xpForLevel(h.level + 1) - h.xp); break;
      case 'timescale': this.timeScale = clamp(value ?? 1, 0.25, 4); break;
      case 'pause': this.paused = !this.paused; break;
      case 'resetcd': h.cds = [0, 0, 0, 0]; h.talentCds = [0, 0]; break;
      case 'spawnwave': this.nextWaveAt = this.time; break;
    }
  }

  setPath(u: Unit, x: number, y: number) {
    u.pathGoalX = x; u.pathGoalY = y;
    const p = findPath(u.x, u.y, x, y, Math.min(0.55, u.radius));
    u.path = p; u.pathI = 0;
    if (!p && u.hero) this.rejectFor(u, 'Cannot path there');
  }

  tryCast(u: Unit, pc: PendingCast): boolean {
    const h = u.hero!;
    if (!u.alive) return false;
    if (pc.kind === 'ability') {
      if (pc.slot < 0 || pc.slot > 3) return false;
      const kit = KITS[h.id].abilities[pc.slot];
      if (h.ranks[pc.slot] === 0) { this.rejectFor(u, 'Ability not learned', pc.seq); return false; }
      if (kit.canRecast && kit.canRecast(this, u)) {
        if (!canCast(u)) { this.rejectFor(u, 'Cannot cast now', pc.seq); return false; }
        kit.recast!(this, u, pc);
        return true;
      }
      if (h.cds[pc.slot] > 0) { this.rejectFor(u, 'On cooldown', pc.seq); return false; }
      const def = abilityDef(u, pc.slot);
      const cost = def.cost[Math.min(def.cost.length, h.ranks[pc.slot]) - 1] ?? def.cost[0];
      if (u.mana < cost) { this.rejectFor(u, h.def.resource === 'energy' ? 'Not enough energy' : 'Not enough mana', pc.seq); return false; }
      if (!canCast(u)) { this.rejectFor(u, hasEffect(u, 'silence') ? 'Silenced' : 'Cannot cast now', pc.seq); return false; }
      if (u.cast) { this.rejectFor(u, 'Already casting', pc.seq); return false; }
      if (def.targeting === 'unit-enemy' || def.targeting === 'unit-ally' || (def.targeting === 'ally-or-point' && pc.target)) {
        const t = pc.target ? this.byId.get(pc.target) : (def.targeting === 'unit-ally' ? u : undefined);
        if (!t || !t.alive) { this.rejectFor(u, 'No target', pc.seq); return false; }
        if (t.team !== u.team && !this.visibleTo(u.team as 0 | 1, t)) { this.rejectFor(u, 'Target not visible', pc.seq); return false; }
        if (kit.validate) { const r = kit.validate(this, u, pc, h.ranks[pc.slot]); if (r) { this.rejectFor(u, r, pc.seq); return false; } }
        const range = def.range + t.radius + u.radius;
        if (dist(u.x, u.y, t.x, t.y) > range) { this.approachCast(u, pc, t.x, t.y); return true; }
      } else {
        if (kit.validate) { const r = kit.validate(this, u, pc, h.ranks[pc.slot]); if (r) { this.rejectFor(u, r, pc.seq); return false; } }
      }
      this.beginCast(u, pc);
      return true;
    }
    // talent
    return castTalent(this, u, pc);
  }

  private approachCast(u: Unit, pc: PendingCast, x: number, y: number) {
    this.cancelRecall(u);
    u.order = { type: 'cast', cast: pc };
    this.setPath(u, x, y);
  }

  beginCast(u: Unit, pc: PendingCast) {
    const h = u.hero!;
    const def = abilityDef(u, pc.slot);
    const kit = KITS[h.id].abilities[pc.slot];
    this.cancelRecall(u);
    invalidateUndo(u);
    if (pc.x !== undefined && pc.y !== undefined) u.facing = Math.atan2(pc.y - u.y, pc.x - u.x);
    if (pc.target) { const t = this.byId.get(pc.target); if (t) u.facing = Math.atan2(t.y - u.y, t.x - u.x); }
    kit.onCastStart?.(this, u, pc, h.ranks[pc.slot]);
    u.atkPhase = 0;
    if (def.castTime > 0) {
      u.cast = { slot: pc.slot, kind: 'ability', t: 0, total: def.castTime, cmd: pc, channel: !!kit.channel };
      u.anim = kit.channel ? 4 : 3; u.animT = this.time;
      if (u.order.type === 'cast') u.order = { type: 'idle' };
    } else {
      this.releaseCast(u, pc);
      if (u.order.type === 'cast') u.order = { type: 'idle' };
    }
  }

  private releaseCast(u: Unit, pc: PendingCast) {
    const h = u.hero!;
    const def = abilityDef(u, pc.slot);
    const rank = h.ranks[pc.slot];
    const cost = def.cost[Math.min(def.cost.length, rank) - 1] ?? def.cost[0];
    if (u.mana < cost) { this.rejectFor(u, 'Not enough mana'); return; }
    u.mana -= cost;
    const cd = cooldownAfterHaste(def.cooldown[Math.min(def.cooldown.length, rank) - 1], u.stats.haste);
    h.cds[pc.slot] = cd; h.cdMax[pc.slot] = cd;
    const castId = this.castCounter++;
    h.passive.lastCastId = castId;
    KITS[h.id].abilities[pc.slot].release(this, u, pc, rank, castId);
    u.anim = 3; u.animT = this.time;
    this.emit({ e: 'cast', id: u.id, ability: def.id, slot: def.slot, x: u.x, y: u.y, tx: pc.x ?? u.x, ty: pc.y ?? u.y, hero: h.id }, { x: u.x, y: u.y, srcTeam: u.team });
    if (this.setup.mode === 'tutorial') this.tutorialFlags.cast = (this.tutorialFlags.cast ?? 0) + 1;
  }

  cancelRecall(u: Unit) {
    if (u.hero?.recall) {
      u.hero.recall = null;
      this.emit({ e: 'recall', id: u.id, done: false, x: -999, y: -999 }, { x: u.x, y: u.y, srcTeam: u.team });
    }
  }

  placeWard(u: Unit, x: number, y: number, trinket: boolean): string | null {
    const h = u.hero!;
    if (!u.alive) return 'Dead';
    if (trinket && h.wardCharges <= 0) return 'No ward charges';
    if (dist(u.x, u.y, x, y) > 6.5) return 'Out of range';
    if (!walkableAt(x, y)) return 'Invalid ward location';
    if (trinket) h.wardCharges--;
    const w = this.newUnit('ward', u.team, x, y, 0.35, { ...ZERO_STATS(), maxHp: 3 }, 'Ward');
    w.ward = { owner: u.id, until: this.time + (trinket ? R.WARD_DURATION : 120), disabledUntil: 0, trinket };
    w.sub = 'ward';
    h.wardScore += 1;
    // team ward cap: remove the oldest
    const wards = this.units.filter((t) => t.alive && t.kind === 'ward' && t.team === u.team).sort((a, b) => a.ward!.until - b.ward!.until);
    while (wards.length > R.WARD_CAP + 1) { const o = wards.shift()!; o.alive = false; o.removeAt = this.time; }
    this.emit({ e: 'ward', x, y, team: u.team as 0 | 1 }, { team: u.team as 0 | 1 });
    if (this.setup.mode === 'tutorial') this.tutorialFlags.ward = 1;
    return null;
  }

  // ------------------------------------------------------------------ main tick
  step() {
    if (this.over) return;
    if (this.paused) return;
    const dt = R.DT;
    this.tick++;
    this.time += dt;
    this.rebuildGrid();
    // scheduled callbacks
    if (this.scheduled.length) {
      const due = this.scheduled.filter((s) => s.at <= this.time);
      this.scheduled = this.scheduled.filter((s) => s.at > this.time);
      for (const s of due) s.fn();
    }
    for (const b of this.bots) b.update(dt);
    this.spawnSystem();
    for (const u of this.units) {
      if (!u.alive && u.kind !== 'hero') continue;
      switch (u.kind) {
        case 'hero': this.updateHero(u, dt); break;
        case 'minion': updateMinion(this, u, dt); break;
        case 'tower': case 'core': case 'fountain': updateTower(this, u, dt); break;
        case 'monster': updateMonster(this, u, dt); break;
        case 'ward': if (this.time >= u.ward!.until) { u.alive = false; u.removeAt = this.time; } break;
        case 'wall': if (this.time >= u.wall!.until) { u.alive = false; u.removeAt = this.time; } break;
        case 'decoy': this.updateDecoy(u, dt); break;
        default: break;
      }
    }
    this.updateDashes(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateParcels();
    this.updateEffects(dt);
    this.separate();
    for (const u of this.units) if (u.alive) u.brush = brushAt(u.x, u.y);
    if (this.tick % 2 === 0) { updateFog(this, 0); updateFog(this, 1); }
    else { updateFog(this, 0, true); updateFog(this, 1, true); }
    // cleanup
    if (this.tick % 15 === 0) {
      this.units = this.units.filter((u) => {
        if (u.alive || u.kind === 'hero' || u.structure) return true;
        if (this.time - u.removeAt > 1.5) { this.byId.delete(u.id); return false; }
        return true;
      });
      this.projectiles = this.projectiles.filter((p) => p.alive);
      this.zones = this.zones.filter((z) => z.alive);
      this.reveals = this.reveals.filter((r) => r.until > this.time);
      const keepFrom = this.tick - 120;
      if (this.events.length > 4000 || (this.events.length && this.events[0].tick < keepFrom)) this.events = this.events.filter((e) => e.tick >= keepFrom);
      this.shakes.length = 0;
    }
    if (this.tick % (R.TICK_RATE * 30) === 0) {
      const g = [0, 0];
      for (const h of this.heroes) g[h.team as number] += h.hero!.totalGold;
      this.goldGraph.push([Math.round(this.time), g[0], g[1]]);
    }
  }

  private spawnSystem() {
    // lane waves (both lanes every 30 s)
    if (this.time >= this.nextWaveAt) {
      this.waveCount++;
      this.nextWaveAt += R.WAVE_INTERVAL;
      for (const team of [0, 1] as Team[]) for (let lane = 0; lane < 2; lane++) {
        const kinds: R.MinionKind[] = ['guard', 'guard', 'guard', 'bolt', 'bolt', 'bolt'];
        if (this.waveCount % 3 === 0) kinds.push('siege');
        const enemySeal = this.structures.get(`${1 - team}-${lane}-seal`)!;
        if (!enemySeal.alive) kinds.unshift('vanguard');
        kinds.forEach((k, i) => this.spawnMinion(team, lane, k, i * 1.4));
      }
    }
    // jungle camps and objectives
    for (const c of this.camps) {
      if (c.alive.length) {
        c.alive = c.alive.filter((id) => this.byId.get(id)?.alive);
        if (!c.alive.length) {
          const spec = campSpec(c.def.kind);
          c.respawnAt = this.time + spec.respawn;
        }
        continue;
      }
      if (this.time >= c.respawnAt) {
        if (c.def.kind === 'colossus' || c.def.kind.startsWith('catalyst')) {
          this.emit({ e: 'obj', key: c.def.key, kind: c.def.kind, what: 'spawn' });
          this.emit({ e: 'announce', text: `${R.MONSTERS[c.def.kind as keyof typeof R.MONSTERS].name} has awakened`, tone: 'neutral', caption: 'Objective spawned' });
          this.timeline.push({ t: this.time, text: `${R.MONSTERS[c.def.kind as keyof typeof R.MONSTERS].name} spawned`, team: 2 });
        }
        c.alive = spawnCamp(this, c.def).map((u) => u.id);
        c.spawned = true;
        c.respawnAt = Infinity;
      } else if (Math.abs(c.respawnAt - 30 - this.time) < R.DT / 2 && (c.def.kind === 'colossus' || c.def.kind.startsWith('catalyst'))) {
        this.emit({ e: 'obj', key: c.def.key, kind: c.def.kind, what: 'soon' });
      }
    }
    // seal respawn (once)
    for (const s of this.structures.values()) {
      const st = s.structure!;
      if (st.tier === 'seal' && !s.alive && !st.respawned && st.respawnAt > 0 && this.time >= st.respawnAt) {
        st.respawned = true;
        s.alive = true; s.hp = s.stats.maxHp;
        this.emit({ e: 'announce', text: `${s.team === this.humanTeam ? 'Our' : 'Enemy'} ${['Upper', 'Lower'][st.lane]} Seal has reformed`, tone: s.team === this.humanTeam ? 'good' : 'bad' });
        this.timeline.push({ t: this.time, text: `${['Upper', 'Lower'][st.lane]} Seal reformed`, team: s.team as 0 | 1 });
      }
    }
    // passive gold
    if (this.time >= R.PASSIVE_GOLD_START) {
      for (const h of this.heroes) {
        let g = R.PASSIVE_GOLD_PER_SEC * R.DT;
        if (hasItem(h, 's_thread') && this.unitsInRadius(h.x, h.y, 10, (t) => t.kind === 'hero' && t.team === h.team && t !== h).length) g += 1.5 * R.DT;
        h.hero!.gold += g; h.hero!.totalGold += g;
      }
    }
  }

  get humanTeam(): 0 | 1 { return this.setup.players.find((p) => p.slot === this.setup.humanSlot)?.team ?? 0; }

  // ------------------------------------------------------------------ heroes
  private updateHero(u: Unit, dt: number) {
    const h = u.hero!;
    u.atkCd -= dt;
    for (let i = 0; i < 4; i++) if (h.cds[i] > 0) h.cds[i] = Math.max(0, h.cds[i] - dt);
    for (let i = 0; i < 2; i++) if (h.talentCds[i] > 0) h.talentCds[i] = Math.max(0, h.talentCds[i] - dt);
    for (const it of h.items) if (it && it.cd > 0) it.cd = Math.max(0, it.cd - dt);
    if (h.wardCharges < R.WARD_CHARGES) {
      h.wardRechargeT += dt;
      if (h.wardRechargeT >= R.WARD_RECHARGE) { h.wardRechargeT = 0; h.wardCharges++; }
    } else h.wardRechargeT = 0;
    if (!u.alive) {
      if (this.time >= h.respawnAt) this.respawnHero(u);
      return;
    }
    KITS[h.id].passiveTick?.(this, u, dt);
    // fountain
    const inF = inFountain(u.team as Team, u.x, u.y);
    if (inF) {
      u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * 0.12 * dt);
      u.mana = Math.min(u.stats.maxMana, u.mana + u.stats.maxMana * 0.12 * dt);
    }
    if (h.inFountainPrev && !inF) h.undo.length = 0; // leaving fountain locks purchases
    h.inFountainPrev = inF;
    // recall
    if (h.recall && this.time >= h.recall.until) {
      h.recall = null;
      const f = FOUNTAIN[u.team as Team];
      this.emit({ e: 'recall', id: u.id, done: true, x: u.x, y: u.y }, { x: u.x, y: u.y, srcTeam: u.team });
      u.x = f.x + (u.team === 0 ? 1.5 : -1.5); u.y = f.y; u.path = null; u.order = { type: 'idle' };
      h.inFountainPrev = true;
      if (this.setup.mode === 'tutorial') this.tutorialFlags.recalled = 1;
    }
    if (u.dash) return;
    // casting
    if (u.cast) {
      if (isHardCC(u)) { u.cast = null; }
      else {
        u.cast.t += dt;
        if (u.cast.t >= u.cast.total) {
          const c = u.cast; u.cast = null;
          if (c.kind === 'ability') this.releaseCast(u, c.cmd);
        }
        return;
      }
    }
    if (isHardCC(u)) { u.anim = 7; return; }
    this.runOrder(u, dt);
  }

  private respawnHero(u: Unit) {
    const f = FOUNTAIN[u.team as Team];
    u.alive = true;
    u.x = f.x + (u.team === 0 ? 2 : -2); u.y = f.y + (this.rng.next() - 0.5) * 3;
    u.effects = []; u.shields = []; u.dmgLog = []; u.ccLog = [];
    recomputeStats(this, u);
    u.hp = u.stats.maxHp; u.mana = u.stats.maxMana;
    u.order = { type: 'idle' }; u.path = null; u.cast = null; u.dash = null; u.atkPhase = 0;
    u.hero!.inFountainPrev = true;
    this.emit({ e: 'fx', kind: 'respawn', x: u.x, y: u.y, id: u.id }, { x: u.x, y: u.y, srcTeam: u.team });
  }

  /** Shared order runner for heroes (and decoy-free units). */
  runOrder(u: Unit, dt: number) {
    const o = u.order;
    const root = hasEffect(u, 'root');
    switch (o.type) {
      case 'idle': case 'hold': {
        const t = this.byId.get(u.atkTarget);
        let target: Unit | null = t && t.alive && this.canAttackTarget(u, t) && this.inAttackRange(u, t, o.type === 'idle' ? 0.6 : 0) ? t : null;
        if (!target) target = this.acquire(u, u.stats.range + 0.3, false);
        if (target) this.attackStep(u, target, dt); else { u.anim = 0; if (u.atkPhase === 1) u.atkPhase = 0; }
        break;
      }
      case 'move': {
        if (root) { u.anim = 0; break; }
        if (this.followPath(u, dt)) { u.order = { type: 'idle' }; u.anim = 0; }
        break;
      }
      case 'attackMove': {
        const t = this.byId.get(u.atkTarget);
        let target: Unit | null = t && t.alive && this.canAttackTarget(u, t) && dist(u.x, u.y, t.x, t.y) < 8 ? t : null;
        if (!target) target = this.acquire(u, 7, true);
        if (target) { this.chaseAttack(u, target, dt, root); break; }
        if (root) break;
        if (!u.path || u.repathAt < this.time) { this.setPath(u, o.x!, o.y!); u.repathAt = this.time + 1.5; }
        if (this.followPath(u, dt)) { u.order = { type: 'idle' }; }
        break;
      }
      case 'attack': {
        const t = this.byId.get(o.target!);
        if (!t || !t.alive || !this.canAttackTarget(u, t)) { u.order = { type: 'idle' }; u.path = null; break; }
        this.chaseAttack(u, t, dt, root);
        break;
      }
      case 'cast': {
        const pc = o.cast!;
        const t = pc.target ? this.byId.get(pc.target) : undefined;
        if (pc.target && (!t || !t.alive || (t.team !== u.team && !this.visibleTo(u.team as 0 | 1, t)))) { u.order = { type: 'idle' }; break; }
        const def = pc.kind === 'ability' ? abilityDef(u, pc.slot) : null;
        const range = (def ? def.range : TALENTS[u.hero!.talents[pc.slot]].range) + (t ? t.radius + u.radius : 0);
        const tx = t ? t.x : pc.x!, ty = t ? t.y : pc.y!;
        if (dist(u.x, u.y, tx, ty) <= range) {
          u.order = { type: 'idle' }; u.path = null;
          if (pc.kind === 'ability') { if (u.hero!.cds[pc.slot] <= 0 && canCast(u)) this.beginCast(u, pc); }
          else castTalent(this, u, pc);
          break;
        }
        if (root) break;
        if (!u.path || (t && dist(u.pathGoalX, u.pathGoalY, t.x, t.y) > 1.5)) this.setPath(u, tx, ty);
        this.followPath(u, dt);
        break;
      }
    }
  }

  canAttackTarget(u: Unit, t: Unit): boolean {
    if (t.team === u.team || !t.alive || t.untargetable || t.kind === 'fountain') return false;
    if (t.kind === 'ward' && t.team !== 2 && !this.visibleTo(u.team as 0 | 1, t)) return false;
    if (u.team !== 2 && !this.visibleTo(u.team as 0 | 1, t)) return false;
    return true;
  }
  inAttackRange(u: Unit, t: Unit, pad = 0) {
    return dist(u.x, u.y, t.x, t.y) <= u.stats.range + u.radius + t.radius + pad;
  }

  /** Nearest attackable enemy, preferring units over structures; heroes only when `heroes` is true or none else. */
  acquire(u: Unit, r: number, heroes: boolean): Unit | null {
    let best: Unit | null = null, bd = Infinity;
    for (const t of this.unitsInRadius(u.x, u.y, r, (t) => this.canAttackTarget(u, t) && t.kind !== 'decoy')) {
      if (t.structure && this.structureInvulnerable(t)) continue;
      if (t.kind === 'monster' && !heroes && u.kind === 'hero' && t.monster!.aggro !== u.id) continue;
      let d = dist(u.x, u.y, t.x, t.y);
      if (t.kind === 'hero' && !heroes) d += 6;
      if (t.structure) d += 3;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  chaseAttack(u: Unit, t: Unit, dt: number, root: boolean) {
    if (this.inAttackRange(u, t)) { u.path = null; this.attackStep(u, t, dt); return; }
    if (u.atkPhase === 1) u.atkPhase = 0;
    if (root) return;
    const d = dist(u.x, u.y, t.x, t.y);
    if (d < 6 && lineClear(u.x, u.y, t.x, t.y, Math.min(0.5, u.radius))) {
      u.path = [{ x: t.x, y: t.y }]; u.pathI = 0;
    } else if (!u.path || this.time >= u.repathAt || dist(u.pathGoalX, u.pathGoalY, t.x, t.y) > 2) {
      this.setPath(u, t.x, t.y); u.repathAt = this.time + 0.35;
    }
    this.followPath(u, dt, u.radius + t.radius + u.stats.range * 0.9);
  }

  attackStep(u: Unit, t: Unit, dt: number) {
    u.facing = Math.atan2(t.y - u.y, t.x - u.x);
    const period = 1 / Math.max(0.2, u.stats.as);
    if (u.atkPhase === 0 || (u.atkPhase === 2 && u.atkCd <= 0)) {
      if (u.atkCd <= 0) {
        u.atkPhase = 1; u.atkTimer = period * u.windup; u.atkCd = period; u.atkTarget = t.id;
        u.anim = 2; u.animT = this.time;
      } else { u.anim = 0; }
    }
    if (u.atkPhase === 1) {
      u.atkTimer -= dt;
      if (u.atkTimer <= 0) {
        u.atkPhase = 2;
        this.releaseAttack(u, t);
      }
    }
  }

  releaseAttack(u: Unit, t: Unit) {
    if (u.hero) { this.cancelRecall(u); invalidateUndo(u); }
    const mod = u.hero ? KITS[u.hero.id].onAttackRelease?.(this, u, t) : undefined;
    this.emit({ e: 'attack', id: u.id, tgt: t.id, x: u.x, y: u.y, ranged: u.ranged, sub: u.sub }, { x: u.x, y: u.y, srcTeam: u.team });
    if (u.ranged) {
      const dx = t.x - u.x, dy = t.y - u.y, l = Math.hypot(dx, dy) || 1;
      this.spawnProjectile({ owner: u, dx: dx / l, dy: dy / l, speed: u.missileSpeed || 20, maxDist: 60, radius: 0.2, visual: `atk-${u.sub}`, homing: t.id, passWalls: true,
        onHit: (tt) => { this.applyAttack(u, tt, mod || undefined); return true; } });
    } else {
      this.applyAttack(u, t, mod || undefined);
    }
  }

  applyAttack(u: Unit, t: Unit, mod?: { bonus: number; bonusType: 'physical' | 'arcane'; penPct?: number; tag?: string }) {
    if (!t.alive) return;
    let dmg = u.stats.ad;
    let crit = false;
    if (u.stats.crit > 0 && this.rng.next() < u.stats.crit) { crit = true; dmg *= hasItem(u, 'tideglass') ? 1.9 : 1.75; }
    if (u.structure) {
      // tower damage ramp vs heroes
      const s = u.structure;
      if (t.kind === 'hero') {
        if (s.rampTarget === t.id) s.rampN++; else { s.rampTarget = t.id; s.rampN = 0; }
        dmg *= 1 + Math.min(R.TOWER_RAMP_MAX, R.TOWER_RAMP * s.rampN);
      }
    }
    if (u.kind === 'monster' && u.monster && this.time > 0) dmg *= 1 + R.MONSTER_GROWTH_PER_MIN * (this.time / 60);
    const dealt = dealDamage(this, u, t, dmg, 'physical', { kind: u.structure ? 'tower' : 'attack', source: 'Basic attack', crit, penPct: mod?.penPct });
    if (mod && mod.bonus > 0 && t.alive) dealDamage(this, u, t, mod.bonus, mod.bonusType, { kind: 'attack', source: mod.tag === 'ember' ? 'Hot Route' : mod.tag === 'refraction' ? 'Refraction' : 'Bonus', penPct: mod.penPct });
    if (u.hero) {
      if (u.stats.lifesteal > 0) heal(this, u, u, dealt * u.stats.lifesteal);
      KITS[u.hero.id].onAttackHit?.(this, u, t);
      if (hasEffect(u, 'buffForge') && t.alive) {
        addEffect(this, t, { kind: 'burn', until: this.time + 2, value: (20 + 2 * u.hero.level) / 2, src: u.id, tag: `forge${u.id}`, dmgType: 'arcane' });
        addEffect(this, t, { kind: 'slow', until: this.time + 1, value: 0.1, src: u.id, tag: 'forgeslow' });
      }
      if (hasItem(u, 'cindermaul') && t.alive) addEffect(this, t, { kind: 'slow', until: this.time + 1, value: u.ranged ? 0.15 : 0.25, src: u.id, tag: 'cinder' });
      if (hasItem(u, 'sunspoke')) {
        u.hero.passive.sunCount = (u.hero.passive.sunCount ?? 0) + 1;
        if (u.hero.passive.sunCount >= 3) {
          u.hero.passive.sunCount = 0;
          const others = this.unitsInRadius(t.x, t.y, 5, (o) => o !== t && this.canAttackTarget(u, o) && !o.structure && o.kind !== 'ward');
          others.sort((a, b) => (this.parcels.some((p) => p.target === b.id) ? 1 : 0) - (this.parcels.some((p) => p.target === a.id) ? 1 : 0));
          const o = others[0];
          if (o) {
            const dx = o.x - t.x, dy = o.y - t.y, l = Math.hypot(dx, dy) || 1;
            this.spawnProjectile({ owner: u, x: t.x, y: t.y, dx: dx / l, dy: dy / l, speed: 26, maxDist: 20, radius: 0.2, visual: 'sunbolt', homing: o.id, passWalls: true,
              onHit: (tt) => { dealDamage(this, u, tt, u.stats.ad * 0.5, 'physical', { kind: 'item', source: 'Sunspoke Bow' }); return true; } });
          }
        }
      }
      if (u.hero.passive.lastHitBoost) { /* reserved */ }
    }
    if (t.hero && hasItem(t, 'thornbrass') && u.alive && !u.structure) {
      dealDamage(this, t, u, 12 + 0.08 * t.stats.armor, 'arcane', { kind: 'reflect', source: 'Thornbrass Cuirass' });
    }
    if (t.hero && hasItem(t, 'kilnheart')) {
      const p = t.hero.passive;
      p.kilnStacks = Math.min(8, (p.kilnStacks ?? 0) + 1);
      p.kilnUntil = this.time + 3;
    }
  }

  /** Follow the current path. Returns true when arrived. `stopAt` stops early within that distance of the goal. */
  followPath(u: Unit, dt: number, stopAt = 0): boolean {
    if (!u.path || u.pathI >= u.path.length) { u.anim = 0; return true; }
    let step = u.stats.ms * dt;
    u.anim = 1;
    while (step > 0 && u.pathI < u.path.length) {
      const wp = u.path[u.pathI];
      const dx = wp.x - u.x, dy = wp.y - u.y, d = Math.hypot(dx, dy);
      const isLast = u.pathI === u.path.length - 1;
      if (isLast && stopAt > 0 && d <= stopAt) { u.path = null; return true; }
      if (d <= step) {
        u.x = wp.x; u.y = wp.y; step -= d; u.pathI++;
      } else {
        u.x += (dx / d) * step; u.y += (dy / d) * step;
        u.facing = Math.atan2(dy, dx);
        step = 0;
      }
    }
    const p = resolveStatic(u.x, u.y, u.radius);
    u.x = p.x; u.y = p.y;
    if (u.path && u.pathI >= u.path.length) { u.path = null; return true; }
    return false;
  }

  private updateDecoy(u: Unit, dt: number) {
    const d = u.decoy!;
    if (this.time >= d.until) { this.popDecoy(u); return; }
    const nx = u.x + d.dx * u.stats.ms * dt, ny = u.y + d.dy * u.stats.ms * dt;
    if (walkableAt(nx, ny, 0.4)) { u.x = nx; u.y = ny; u.anim = 1; } else u.anim = 0;
  }

  private updateDashes(dt: number) {
    for (const u of this.units) {
      if (!u.dash || !u.alive) continue;
      const d = u.dash;
      d.t += dt;
      const f = Math.min(1, d.t / d.dur);
      u.x = d.sx + (d.ex - d.sx) * f; u.y = d.sy + (d.ey - d.sy) * f;
      if (!d.passWalls) { const p = resolveStatic(u.x, u.y, u.radius * 0.8); u.x = p.x; u.y = p.y; }
      if (f >= 1) {
        u.dash = null;
        if (!walkableAt(u.x, u.y, u.radius * 0.6)) { const p = nearestWalkable(u.x, u.y, u.radius * 0.8, 4); if (p) { u.x = p.x; u.y = p.y; } }
        d.onEnd?.();
        u.anim = 0;
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      if (p.homing) {
        const t = this.byId.get(p.homing);
        if (!t || !t.alive) { p.alive = false; continue; }
        const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
        const step = p.speed * dt;
        if (d <= step + t.radius * 0.5) { p.x = t.x; p.y = t.y; p.alive = false; p.onHit(t, p); continue; }
        p.dx = dx / d; p.dy = dy / d;
        p.x += p.dx * step; p.y += p.dy * step;
        continue;
      }
      // swept skillshot with substeps
      const total = p.speed * dt;
      const sub = Math.max(1, Math.ceil(total / 0.5));
      for (let s = 0; s < sub && p.alive; s++) {
        const step = total / sub;
        const nx = p.x + p.dx * step, ny = p.y + p.dy * step;
        if (!p.passWalls) {
          const hit = raycastWall(p.x, p.y, nx, ny);
          if (hit) {
            p.x = hit.x; p.y = hit.y;
            const stop = p.onWall ? p.onWall(p, hit) : true;
            if (stop) { p.alive = false; p.onEnd?.(p); this.emit({ e: 'fx', kind: 'proj-wall', x: p.x, y: p.y }, { x: p.x, y: p.y }); break; }
            continue;
          }
        }
        p.x = nx; p.y = ny; p.traveled += step;
        if (p.data.echoCheck && p.data.echo) p.data.echo(p);
        // rampart walls block enemy projectiles
        for (const w of this.unitsInRadius(p.x, p.y, p.radius + 0.1, (t) => t.kind === 'wall' && t.team !== p.team)) {
          if (!p.ultimate) { dealDamage(this, this.byId.get(p.owner) ?? null, w, 60, 'physical', { kind: 'ability', source: 'Projectile' }); p.alive = false; break; }
        }
        if (!p.alive) break;
        const cands = this.unitsInRadius(p.x, p.y, p.radius, (t) => {
          if (!t.alive || p.hitSet.has(t.id) || t.kind === 'ward' || t.structure || t.kind === 'wall') return false;
          if (p.filter) return p.filter(t);
          if (t.untargetable) return false;
          return t.team !== p.team;
        });
        cands.sort((a, b) => dist2(p.startX, p.startY, a.x, a.y) - dist2(p.startX, p.startY, b.x, b.y));
        for (const t of cands) {
          p.hitSet.add(t.id);
          if (t.kind === 'decoy' && t.team !== p.team) { this.popDecoy(t); if (!p.pierce) { p.alive = false; break; } continue; }
          const stop = p.onHit(t, p);
          if (stop || !p.pierce) { if (stop) { p.alive = false; break; } }
        }
        if (p.traveled >= p.maxDist) { p.alive = false; p.onEnd?.(p); }
      }
    }
  }

  private updateZones(dt: number) {
    for (const z of this.zones) {
      if (!z.alive) continue;
      if (this.time >= z.end) { z.alive = false; z.onEnd?.(z); continue; }
      z.onTick?.(z, dt);
    }
  }

  private updateParcels() {
    if (!this.parcels.length) return;
    const due = this.parcels.filter((p) => p.at <= this.time);
    this.parcels = this.parcels.filter((p) => p.at > this.time && this.byId.get(p.target)?.alive);
    for (const p of due) {
      const t = this.byId.get(p.target); const o = this.byId.get(p.owner);
      if (!t || !o) continue;
      this.emit({ e: 'fx', kind: 'parcel-boom', x: t.x, y: t.y, r: 3 }, { x: t.x, y: t.y });
      for (const e of this.unitsInRadius(t.x, t.y, 3, (x) => x.alive && this.isEnemy(o, x) && !x.structure && x.kind !== 'ward')) {
        dealDamage(this, o, e, p.dmg, 'physical', { kind: 'ability', source: 'Parcel Charge', slot: 2 });
      }
    }
  }

  private updateEffects(dt: number) {
    for (const u of this.units) {
      if (!u.alive) continue;
      // DOTs
      for (const e of u.effects) {
        if (e.kind === 'burn' && e.until > this.time) {
          const src = this.byId.get(e.src) ?? null;
          e.tickAcc = (e.tickAcc ?? 0) + dt;
          if (e.tickAcc >= 0.5) { e.tickAcc -= 0.5; dealDamage(this, src, u, e.value * 0.5, e.dmgType ?? 'arcane', { kind: 'dot', source: e.tag?.startsWith('scorch') ? 'Scorch Brand' : e.tag?.startsWith('forge') ? 'Forgeheart' : 'Ember Codex', noEvent: false }); }
          if (!u.alive) break;
        } else if (e.kind === 'regen' && e.until > this.time) {
          heal(this, null, u, e.value * dt);
        }
      }
      if (!u.alive) continue;
      const before = u.effects.length;
      u.effects = u.effects.filter((e) => e.until > this.time);
      // shield expiry (Oru's Shared Wing)
      if (u.shields.length) {
        const keep = [];
        for (const s of u.shields) {
          if (s.until > this.time) { keep.push(s); continue; }
          if (s.fromOru && s.amt > 1) { const src = this.byId.get(s.src); heal(this, src ?? null, u, s.amt * 0.3); }
        }
        u.shields = keep;
      }
      if (u.hero) {
        const p = u.hero.passive;
        if (p.kilnStacks && (p.kilnUntil ?? 0) < this.time) p.kilnStacks = 0;
        // aether reservoir
        if (hasItem(u, 'reservoir') && u.hp < u.stats.maxHp * 0.3 && (p.reservoirAt ?? -99) + 60 <= this.time) {
          p.reservoirAt = this.time;
          addShield(this, u, u, u.mana * 0.15, 3);
        }
        // regen out of fountain
        u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.hpRegen * dt);
        u.mana = Math.min(u.stats.maxMana, u.mana + u.stats.manaRegen * dt);
        recomputeStats(this, u);
      } else if (before !== u.effects.length || u.effects.length || u.minion) {
        recomputeStats(this, u);
      }
      if (hasEffect(u, 'reveal')) u.revealUntil = Math.max(u.revealUntil, this.time + 0.05);
    }
  }

  /** Soft separation between units; enemy heroes block each other; walls block everyone. */
  private separate() {
    for (const u of this.units) {
      if (!u.alive || u.structure || u.kind === 'ward' || u.kind === 'wall' || u.dash || u.kind === 'decoy') continue;
      const ghost = hasEffect(u, 'ghost');
      let px = 0, py = 0;
      for (const o of this.unitsInRadius(u.x, u.y, u.radius + 1.2)) {
        if (o === u || o.kind === 'ward' || o.kind === 'decoy' || !o.alive) continue;
        const rr = u.radius + o.radius;
        const dx = u.x - o.x, dy = u.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.01;
        const overlap = rr - d;
        let k = 0;
        if (o.structure || o.kind === 'wall') k = 1;
        else if (ghost) k = 0;
        else if (u.kind === 'hero' && o.kind === 'hero') k = u.team !== o.team ? 0.5 : 0.15;
        else if (u.kind === 'minion' && o.kind === 'minion') k = u.team === o.team ? 0.2 : 0.3;
        else if (u.kind === 'hero' && o.kind === 'minion') k = o.team === u.team ? 0.05 : 0.18;
        else if (u.kind === 'minion' && o.kind === 'hero') k = o.team === u.team ? 0.3 : 0.25;
        else k = 0.2;
        if (d < 0.02) { px += (this.rng.next() - 0.5) * 0.05; py += (this.rng.next() - 0.5) * 0.05; continue; }
        px += (dx / d) * overlap * k; py += (dy / d) * overlap * k;
      }
      if (px || py) {
        const p = resolveStatic(u.x + px, u.y + py, u.radius);
        u.x = p.x; u.y = p.y;
      }
    }
  }

  // ------------------------------------------------------------------ economy & death
  grantXp(u: Unit, amt: number) {
    const h = u.hero!;
    if (h.level >= R.MAX_LEVEL) return;
    h.xp += amt;
    const nl = R.levelForXp(h.xp);
    while (h.level < nl) {
      h.level++;
      h.skillPoints++;
      const before = u.stats.maxHp;
      recomputeStats(this, u);
      u.hp += Math.max(0, u.stats.maxHp - before) * 0.0;
      this.emit({ e: 'level', id: u.id, level: h.level, x: u.x, y: u.y }, { x: u.x, y: u.y, srcTeam: u.team });
      if (h.level === 6 || h.level === 11) this.emit({ e: 'announce', text: h.level === 6 ? 'Ultimate unlocked' : 'Ultimate rank 2 available', tone: 'good' }, { slot: h.slot });
    }
    this.emit({ e: 'xp', amt: Math.round(amt) }, { slot: h.slot });
  }

  giveGold(u: Unit, amt: number, x: number, y: number) {
    const h = u.hero!;
    h.gold += amt; h.totalGold += amt;
    invalidateUndo(u);
    this.emit({ e: 'gold', amt: Math.round(amt), x, y }, { slot: h.slot });
  }

  private shareXp(team: TeamId, x: number, y: number, xp: number, killer?: Unit) {
    const near = this.heroes.filter((h) => h.alive && h.team === team && dist(h.x, h.y, x, y) <= R.XP_RANGE);
    if (killer && killer.hero && killer.alive && !near.includes(killer)) near.push(killer);
    const share = R.xpShare(near.length);
    for (const h of near) this.grantXp(h, xp * share);
  }

  heroBounty(u: Unit): number {
    const h = u.hero!;
    let b = h.streak >= 2 ? Math.min(R.BOUNTY_CAP, R.BOUNTY_PER_STREAK * (h.streak - 1)) : 0;
    const g = [0, 0];
    for (const x of this.heroes) g[x.team as number] += x.hero!.totalGold;
    if (g[u.team as number] - g[1 - (u.team as number)] > 1500) b += 60;
    return Math.min(R.BOUNTY_CAP, b);
  }

  killUnit(u: Unit, src: Unit | null) {
    if (!u.alive) return;
    u.alive = false;
    u.removeAt = this.time;
    u.hp = 0;
    u.cast = null; u.dash = null; u.path = null;
    this.emit({ e: 'death', id: u.id, x: u.x, y: u.y, k: kindCode(u) }, { x: u.x, y: u.y, srcTeam: u.team, public: !!u.structure || u.kind === 'hero' });
    // resolve hero credit
    let killer: Unit | null = src && src.hero ? src : null;
    if (!killer) {
      for (let i = u.dmgLog.length - 1; i >= 0; i--) {
        const e = u.dmgLog[i];
        if (this.time - e.t > R.ASSIST_WINDOW) break;
        const s = this.byId.get(e.src);
        if (s && s.hero && s.team !== u.team) { killer = s; break; }
      }
    }
    if (u.kind === 'hero') return this.heroDied(u, src, killer);
    if (u.kind === 'minion') {
      const spec = R.MINIONS[u.minion!.kind];
      if (src?.hero && src.team !== u.team) {
        src.hero.cs++;
        this.giveGold(src, spec.gold + Math.floor(this.time / 90), u.x, u.y);
        if (this.setup.mode === 'tutorial' && src.hero.slot === this.setup.humanSlot) this.tutorialFlags.lastHits = (this.tutorialFlags.lastHits ?? 0) + 1;
      }
      this.shareXp((1 - (u.team as number)) as TeamId, u.x, u.y, spec.xp);
      return;
    }
    if (u.kind === 'monster') return this.monsterDied(u, src, killer);
    if (u.structure) return this.structureDied(u, src, killer);
    if (u.kind === 'ward' && src?.hero) { this.giveGold(src, 20, u.x, u.y); src.hero.wardScore += 1; }
  }

  private heroDied(u: Unit, src: Unit | null, killer: Unit | null) {
    const h = u.hero!;
    h.d++;
    h.recall = null;
    const assists: Unit[] = [];
    for (const e of u.dmgLog) {
      if (this.time - e.t > R.ASSIST_WINDOW) continue;
      const s = this.byId.get(e.src);
      if (s && s.hero && s.team !== u.team && s !== killer && !assists.includes(s)) assists.push(s);
    }
    const bounty = this.heroBounty(u);
    let gold = 0;
    if (killer) {
      gold = R.KILL_GOLD + bounty + (this.firstBlood ? 0 : 100);
      killer.hero!.k++;
      killer.hero!.streak++;
      this.giveGold(killer, gold, u.x, u.y);
      this.kills[killer.team as 0 | 1]++;
    } else if (src && src.team !== u.team && src.team !== 2) {
      this.kills[src.team as 0 | 1]++;
    }
    for (const a of assists) { a.hero!.a++; this.giveGold(a, Math.round((R.KILL_GOLD * 0.5) / Math.max(1, assists.length)), u.x, u.y); }
    const first = !this.firstBlood && !!killer;
    if (killer) this.firstBlood = true;
    h.streak = 0;
    this.shareXp((1 - (u.team as number)) as TeamId, u.x, u.y, 120 + 40 * h.level, killer ?? undefined);
    h.respawnAt = this.time + R.respawnTime(h.level, this.time) * (this.setup.mode === 'tutorial' ? 0.4 : 1);
    this.emit({ e: 'kill', killer: killer?.id ?? src?.id ?? 0, victim: u.id, killerSlot: killer?.hero?.slot ?? -1, victimSlot: h.slot, assists: assists.map((a) => a.hero!.slot), gold: Math.round(gold), first, streak: killer?.hero?.streak });
    const kname = killer ? `${killer.hero!.name} (${killer.hero!.def.name})` : src ? src.name : 'Unknown';
    this.timeline.push({ t: this.time, text: `${kname} defeated ${h.name} (${h.def.name})${first ? ' — first blood' : ''}`, team: (killer?.team ?? src?.team ?? 2) as 0 | 1 | 2 });
    if (killer && killer.hero!.streak >= 3) this.emit({ e: 'announce', text: `${killer.hero!.def.name} is on a ${killer.hero!.streak}-kill streak`, tone: killer.team === this.humanTeam ? 'good' : 'bad' });
    // death recap (private to the victim)
    const recent = u.dmgLog.filter((e) => this.time - e.t <= 8);
    const agg = new Map<string, { name: string; source: string; amount: number; type: string }>();
    for (const e of recent) {
      const key = `${e.srcName}|${e.source}`;
      const a = agg.get(key) ?? { name: e.srcName, source: e.source, amount: 0, type: e.type };
      a.amount += e.amt; agg.set(key, a);
    }
    const recap: DeathRecap = {
      killer: killer ? killer.hero!.name : src?.name ?? 'Unknown', killerHero: killer?.hero?.def.name, assists: assists.map((a) => a.hero!.name),
      respawnIn: h.respawnAt - this.time, sources: [...agg.values()].sort((a, b) => b.amount - a.amount).slice(0, 8).map((s) => ({ ...s, amount: Math.round(s.amount) })),
      cc: u.ccLog.filter((c) => this.time - c.t <= 8).map((c) => ({ name: c.src, kind: c.kind, dur: Math.round(c.dur * 10) / 10 })), total: Math.round(recent.reduce((s, e) => s + e.amt, 0)),
    };
    this.emit({ e: 'deathRecap', recap }, { slot: h.slot });
    u.effects = []; u.shields = [];
    for (const d of this.units) if (d.kind === 'decoy' && d.decoy!.owner === u.id) this.popDecoy(d);
  }

  private monsterDied(u: Unit, src: Unit | null, killer: Unit | null) {
    const mon = u.monster!;
    const spec = R.MONSTERS[mon.kind as keyof typeof R.MONSTERS];
    const credit = killer ?? (src?.hero ? src : null);
    if (!credit) return;
    const team = credit.team as 0 | 1;
    if (spec.gold) this.giveGold(credit, spec.gold, u.x, u.y);
    if (hasItem(credit, 's_lantern')) heal(this, credit, credit, 60);
    credit.hero!.cs++;
    this.shareXp(team, u.x, u.y, spec.xp, credit);
    if (mon.kind === 'buffForge' || mon.kind === 'buffSpring') {
      addEffect(this, credit, { kind: mon.kind, until: this.time + 90, value: 1, src: u.id });
      this.emit({ e: 'fx', kind: 'buff-gain', x: credit.x, y: credit.y, id: credit.id }, { x: u.x, y: u.y });
    }
    if (mon.kind === 'catalystGale' || mon.kind === 'catalystForge' || mon.kind === 'colossus') {
      const kind = mon.kind === 'catalystGale' ? 'gale' : mon.kind === 'catalystForge' ? 'forge' : 'colossus';
      const dur = kind === 'colossus' ? R.COLOSSUS_BUFF : R.CATALYST_BUFF;
      this.teamBuffs = this.teamBuffs.filter((b) => !(b.team === team && b.kind === kind));
      this.teamBuffs.push({ team, kind, until: this.time + dur });
      const g = kind === 'colossus' ? R.COLOSSUS_TEAM_GOLD : R.CATALYST_TEAM_GOLD;
      for (const h of this.heroes) if (h.team === team) {
        this.giveGold(h, g, h.x, h.y);
        if (dist(h.x, h.y, u.x, u.y) < 16) h.hero!.objectives++;
      }
      const label = kind === 'gale' ? 'Gale Catalyst (out-of-combat speed)' : kind === 'forge' ? 'Forge Catalyst (structure damage)' : 'Aether Colossus (minion empowerment + fast recall)';
      this.emit({ e: 'obj', key: mon.camp, kind: mon.kind, what: 'kill', team });
      this.emit({ e: 'announce', text: `${team === this.humanTeam ? 'Your team' : 'The enemy'} claimed the ${label}`, tone: team === this.humanTeam ? 'good' : 'bad', caption: 'Objective taken' });
      this.timeline.push({ t: this.time, text: `${credit.hero!.name} secured ${spec.name}`, team });
      if (this.setup.mode === 'tutorial') this.tutorialFlags.objective = 1;
    }
  }

  private structureDied(u: Unit, src: Unit | null, killer: Unit | null) {
    const s = u.structure!;
    const team = (1 - (u.team as number)) as 0 | 1;
    if (s.tier !== 'seal' && s.tier !== 'engine') {
      for (const h of this.heroes) if (h.team === team) {
        this.giveGold(h, R.TOWER_GOLD_TEAM + (dist(h.x, h.y, u.x, u.y) < 14 ? R.TOWER_GOLD_LOCAL : 0), u.x, u.y);
      }
    }
    for (const h of this.heroes) if (h.team === team && dist(h.x, h.y, u.x, u.y) < 14) h.hero!.structures++;
    const laneName = s.lane >= 0 ? ['Upper', 'Lower'][s.lane] + ' ' : '';
    const nm = s.tier === 'engine' ? 'Crown Engine' : s.tier === 'seal' ? `${laneName}Seal` : s.tier === 'core' ? `${laneName}Core Tower` : `${laneName}${s.tier[0].toUpperCase()}${s.tier.slice(1)} Tower`;
    const ours = u.team === this.humanTeam;
    this.emit({ e: 'struct', key: s.key, tier: s.tier, team: u.team as 0 | 1, killerTeam: team });
    this.emit({ e: 'announce', text: `${ours ? 'Our' : 'Enemy'} ${nm} ${s.tier === 'seal' ? 'is broken' : 'has fallen'}`, tone: ours ? 'bad' : 'good', caption: 'Structure destroyed' });
    this.timeline.push({ t: this.time, text: `${team === 0 ? 'Dawn' : 'Dusk'} destroyed the ${u.team === 0 ? 'Dawn' : 'Dusk'} ${nm}`, team });
    if (s.tier === 'seal') {
      if (!s.respawned) s.respawnAt = this.time + R.SEAL_RESPAWN;
      this.emit({ e: 'vanguard', lane: s.lane, team });
      u.alive = false;
    }
    if (s.tier === 'engine') this.declareVictory(team);
    if (this.setup.mode === 'tutorial' && team === this.humanTeam) this.tutorialFlags.towers = (this.tutorialFlags.towers ?? 0) + 1;
  }

  private declareVictory(team: 0 | 1) {
    if (this.over || this.victoryFired) return;
    this.victoryFired++;
    this.over = true;
    this.winner = team;
    this.emit({ e: 'victory', winner: team });
    this.timeline.push({ t: this.time, text: `${team === 0 ? 'Dawn' : 'Dusk'} Guild seized the Crown Engine`, team });
    const g = [0, 0];
    for (const h of this.heroes) g[h.team as number] += h.hero!.totalGold;
    this.goldGraph.push([Math.round(this.time), g[0], g[1]]);
  }

  onHeroDealtDamage(src: Unit, tgt: Unit, amt: number, type: string, o: { kind: string; castId?: number; slot?: number }) {
    const h = src.hero!;
    invalidateUndo(src);
    KITS[h.id].onDealtDamage?.(this, src, tgt, amt, o.kind);
    if (o.kind === 'ability' && tgt.team !== src.team) {
      if (hasItem(src, 'embercodex') && tgt.alive) addEffect(this, tgt, { kind: 'burn', until: this.time + 2, value: (tgt.stats.maxHp * 0.03) / 2, src: src.id, tag: `ember${src.id}`, dmgType: 'arcane' });
      if (hasItem(src, 'quietindex') && o.castId && o.slot !== undefined && dist(src.x, src.y, tgt.x, tgt.y) > 7 && !h.quietRefunded.has(o.castId)) {
        h.quietRefunded.add(o.castId);
        h.cds[o.slot] *= 0.88;
      }
      if (tgt.kind === 'hero') {
        const mark = src.effects.find((e) => e.kind === 'draftMark');
        if (mark) {
          src.effects = src.effects.filter((e) => e !== mark);
          addEffect(this, tgt, { kind: 'reveal', until: this.time + 4, value: 1, src: mark.src });
          this.emit({ e: 'fx', kind: 'marked', x: tgt.x, y: tgt.y, id: tgt.id }, { x: tgt.x, y: tgt.y });
        }
      }
    }
    if (tgt.kind === 'hero' && hasItem(src, 'hollowprism') && tgt.hp < tgt.stats.maxHp * 0.4) addEffect(this, src, { kind: 'haste', until: this.time + 1.5, value: 0.2, src: src.id, tag: 'prism' });
  }

  onHeroTookDamage(tgt: Unit, src: Unit, amt: number, type: string, o: { kind: string }) {
    invalidateUndo(tgt);
    void src; void amt; void type; void o;
  }

  // ------------------------------------------------------------------ result
  result(): MatchResult {
    return {
      winner: this.winner === -1 ? 0 : this.winner,
      duration: this.time,
      humanTeam: this.humanTeam,
      score: scoreRows(this),
      timeline: this.timeline.slice(),
      goldGraph: this.goldGraph.slice(),
      mode: this.setup.mode,
    };
  }
}

export function kindCode(u: Unit): number {
  switch (u.kind) {
    case 'hero': return 1; case 'minion': return 2; case 'tower': return 3; case 'seal': return 4; case 'core': return 5; case 'engine': return 6;
    case 'monster': return 7; case 'ward': return 8; case 'wall': return 9; case 'decoy': return 10; case 'fountain': return 13;
  }
  return 0;
}

export function scoreRows(m: Match) {
  return m.heroes.map((u) => {
    const h = u.hero!;
    return {
      slot: h.slot, name: h.name, hero: h.id, team: u.team as 0 | 1, bot: h.bot, level: h.level, k: h.k, d: h.d, a: h.a, cs: h.cs,
      gold: Math.round(h.totalGold), items: h.items.filter(Boolean).map((i) => i!.id), wardScore: h.wardScore, objectives: h.objectives,
      dmgHeroes: Math.round(h.dmgHeroes), dmgTaken: Math.round(h.dmgTaken), dmgStructures: Math.round(h.dmgStructures), healing: Math.round(h.healing),
      structures: h.structures, bounty: m.heroBounty(u), dead: !u.alive, respawnAt: h.respawnAt, skillOrder: h.skillOrder.slice(), latency: h.bot ? 0 : 0,
      talents: h.talents.slice(),
    };
  });
}

const BAD = ['idiot', 'stupid', 'noob', 'trash', 'kys', 'loser', 'dumb'];
export function filterText(t: string): string {
  let s = t;
  for (const w of BAD) s = s.replace(new RegExp(`\\b${w}\\b`, 'gi'), '♪'.repeat(w.length));
  return s;
}

// re-exports used by bots
export { dirOf, clampPoint, effectValue };
