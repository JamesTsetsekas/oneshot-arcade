// server-simulation: the authoritative world. Fixed 30 Hz tick, seeded RNG, no wall-clock or
// DOM access — the same code runs in the browser worker and in headless Node tests.

import { botThink } from '../ai/bots';
import { HEROES } from '../shared/heroes';
import { CampDef, FOUNTAIN, GameMap, NAV_CLEAR, getMap } from '../shared/map';
import { DT, Vec, clamp, dist, inCone, inRect, pointSegDist, secs } from '../shared/math';
import { ANIM, GameEvent, MatchConfig, Team, UnitKind } from '../shared/protocol';
import { Rng } from '../shared/rng';
import { MINIONS, MONSTERS, NpcDef, RULES, STRUCTS, TEAM_NAMES } from '../shared/units';
import { addEffect, applyCC, basicHit, dealDamage, grantGold, hasEffect, heal, kill, recalcStats, stunned, targetable } from './combat';
import { heroBrain, heroPreTick, makeHeroState, respawnHero } from './hero';
import { ARCANE, CampState, DynWall, Emitted, Projectile, Stats, TeamState, Unit, Zone } from './types';
import { VisionSrc, updateVision } from './vision';

const blankStats = (): Stats => ({ maxHp: 1, hpRegen: 0, maxMana: 0, manaRegen: 0, ad: 0, ap: 0, as: 1, armor: 0, ward: 0, speed: 0, haste: 0, crit: 0, armorPen: 0, wardPen: 0, lifesteal: 0, healPower: 0, range: 1 });

export type ProjOpts = Partial<Projectile> & { kind: string; team: Team; src: number; x: number; y: number };
export type ZoneOpts = Partial<Zone> & { kind: string; team: Team; src: number; x: number; y: number; shape: Zone['shape']; r: number; until: number };

export class World {
  readonly map: GameMap = getMap();
  readonly rng: Rng;
  readonly config: MatchConfig;
  tick = 0;
  units: Unit[] = [];
  readonly byId = new Map<number, Unit>();
  readonly heroes: Unit[] = [];
  readonly structs: Unit[] = [];
  readonly structByKey = new Map<string, Unit>();
  projs: Projectile[] = [];
  zones: Zone[] = [];
  walls: DynWall[] = [];
  events: Emitted[] = [];
  readonly teams: [TeamState, TeamState] = [
    { kills: 0, towers: 0, buffs: [], wards: [] },
    { kills: 0, towers: 0, buffs: [], wards: [] },
  ];
  readonly camps: CampState[] = [];
  readonly timeline: { time: number; msg: string; team: Team }[] = [];
  readonly pace: { xp: number; gold: number; clock: number };
  visionSrc: [VisionSrc[], VisionSrc[]] = [[], []];
  over: null | { winner: 0 | 1; tick: number } = null;
  firstBlood = false;
  waveCount = [0, 0];
  private nextId = 1;
  private castCounter = 1;

  constructor(config: MatchConfig) {
    this.config = config;
    this.rng = new Rng(config.seed);
    this.pace = config.pace === 'quick' ? { xp: 1.6, gold: 1.5, clock: 1.8 } : { xp: 1, gold: 1, clock: 1 };
    for (const def of this.map.structs) {
      const sd = STRUCTS[def.tier];
      const u = this.makeUnit(def.kind, def.tier, def.team, def.x, def.y, def.radius);
      const tutorialSoft = config.mode === 'tutorial' && def.team === 1 ? 0.55 : 1;
      u.stats.maxHp = Math.round(sd.hp * tutorialSoft * (config.pace === 'quick' ? 0.6 : 1));
      u.hp = u.stats.maxHp;
      u.stats.ad = sd.ad;
      u.stats.armor = sd.armor;
      u.stats.ward = sd.ward;
      u.stats.as = RULES.towerAs;
      u.stats.range = RULES.towerRange;
      u.vision = RULES.structVision;
      u.struct = { def, focusId: 0, focusUntil: 0, ramp: 0, lastTarget: 0, respawned: false, deadAt: 0, warnAt: 0 };
      u.facing = def.team === 0 ? 0 : Math.PI;
      this.structs.push(u);
      this.structByKey.set(def.key, u);
    }
    const perTeam = [0, 0];
    config.seats.forEach((seat, i) => {
      const f = FOUNTAIN[seat.team];
      const n = perTeam[seat.team]++;
      const ang = (seat.team === 0 ? 0 : Math.PI) + (n - 1) * 0.9;
      const spawn = { x: f.x + Math.cos(ang) * 3, y: f.y + Math.sin(ang) * 3 };
      const def = HEROES[seat.hero];
      const u = this.makeUnit('hero', seat.hero, seat.team, spawn.x, spawn.y, def.base.radius);
      u.hero = makeHeroState(def, seat, i, spawn);
      u.vision = RULES.heroVision;
      u.facing = seat.team === 0 ? 0 : Math.PI;
      recalcStats(this, u);
      u.hp = u.stats.maxHp;
      u.mana = u.stats.maxMana;
      this.heroes.push(u);
    });
    for (const def of this.map.camps) {
      const first = def.type === 'colossus' ? RULES.colossusFirst / this.pace.clock : def.type.startsWith('catalyst') ? RULES.catalystFirst / this.pace.clock : RULES.campFirst;
      this.camps.push({ def, units: [], nextSpawn: secs(first), alive: false, aggro: 0, lastKiller: 0 });
    }
    updateVision(this);
  }

  get time(): number {
    return this.tick * DT;
  }

  // ---- entity creation ---------------------------------------------------------------------

  makeUnit(kind: UnitKind, sub: string, team: Team, x: number, y: number, radius: number): Unit {
    const u: Unit = {
      id: this.nextId++,
      kind,
      sub,
      team,
      x,
      y,
      facing: 0,
      radius,
      alive: true,
      hp: 1,
      mana: 0,
      level: 1,
      stats: blankStats(),
      effects: [],
      shields: [],
      path: null,
      pathI: 0,
      vx: 0,
      vy: 0,
      dash: null,
      attackTarget: 0,
      windupUntil: 0,
      windupTarget: 0,
      attackReadyAt: 0,
      lastCombat: -9999,
      visUntil: [-1, -1],
      brush: -1,
      anim: 0,
      animAt: 0,
      animDur: 0,
      vision: 0,
      spawnTick: this.tick,
      expireAt: 0,
      owner: 0,
      disabledUntil: 0,
      hero: null,
      npc: null,
      struct: null,
    };
    this.units.push(u);
    this.byId.set(u.id, u);
    return u;
  }

  private makeNpc(kind: 'minion' | 'monster', sub: string, def: NpcDef, team: Team, x: number, y: number, growth: number): Unit {
    const u = this.makeUnit(kind, sub, team, x, y, def.radius);
    u.stats.maxHp = def.hp * growth;
    u.hp = u.stats.maxHp;
    u.stats.ad = def.ad;
    u.stats.as = def.as;
    u.stats.armor = def.armor;
    u.stats.ward = def.ward;
    u.stats.speed = def.speed;
    u.stats.range = def.range;
    u.vision = def.vision;
    u.npc = { def, lane: 0, wp: 0, aggroId: 0, aggroUntil: 0, camp: null, home: { x, y }, resetting: false, nextSpecial: 0, lostAt: 0, dmgMult: 1 + (growth - 1) * 0.7 };
    return u;
  }

  spawnProj(o: ProjOpts): Projectile {
    const p: Projectile = {
      id: this.nextId++,
      dx: 1,
      dy: 0,
      speed: 20,
      radius: 0.4,
      homing: 0,
      remaining: 30,
      pierce: false,
      hits: 'enemies',
      hitIds: [],
      terrain: false,
      bounce: 0,
      ult: false,
      power: 100,
      travelled: 0,
      dead: false,
      onHit: null,
      onEnd: null,
      onStep: null,
      ...o,
    };
    this.projs.push(p);
    return p;
  }

  spawnZone(o: ZoneOpts): Zone {
    const z: Zone = {
      id: this.nextId++,
      w: 0,
      ang: 0,
      arc: 0,
      start: this.tick,
      armAt: this.tick,
      armed: false,
      every: 0,
      hostile: true,
      ult: false,
      erasable: true,
      dead: false,
      data: {},
      touched: [],
      onArm: null,
      onTick: null,
      onEnd: null,
      ...o,
    };
    this.zones.push(z);
    return z;
  }

  nextCastId(): number {
    return this.castCounter++;
  }
  newId(): number {
    return this.nextId++;
  }

  // ---- events ------------------------------------------------------------------------------

  emit(ev: GameEvent): void {
    this.events.push({ ev, vis: 'all', x: 0, y: 0, hero: 0, team: 2 });
  }
  emitPos(ev: GameEvent, x: number, y: number, vis: 'pos' | 'all' = 'pos'): void {
    this.events.push({ ev, vis, x, y, hero: 0, team: 2 });
  }
  emitHero(ev: GameEvent, hero: number): void {
    this.events.push({ ev, vis: 'hero', x: 0, y: 0, hero, team: 2 });
  }
  emitTeam(ev: GameEvent, team: Team): void {
    this.events.push({ ev, vis: 'team', x: 0, y: 0, hero: 0, team });
  }
  fxAt(fx: string, x: number, y: number, extra: { x2?: number; y2?: number; r?: number; ang?: number; t?: Team; id?: number; c?: number }): void {
    this.events.push({ ev: { e: 'fx', fx, x, y, ...extra }, vis: 'pos', x, y, hero: 0, team: 2 });
  }
  announce(msg: string, kind: string, team: Team): void {
    this.emit({ e: 'announce', msg, kind, team });
  }
  timelineAdd(msg: string, team: Team): void {
    this.timeline.push({ time: this.time, msg, team });
    this.emit({ e: 'timeline', time: this.time, msg, team });
  }
  /** tutorial progress hook (no-op outside tutorial mode) */
  tut(hero: Unit | null, step: string): void {
    if (!step || this.config.mode !== 'tutorial') return;
    if (hero && hero.hero?.seat !== this.config.humanSeat) return;
    this.emit({ e: 'tut', step });
  }
  finish(winner: 0 | 1): void {
    if (this.over) return; // victory fires exactly once
    this.over = { winner, tick: this.tick };
    this.timelineAdd(`${TEAM_NAMES[winner]} claims the Crown Engine`, winner);
  }

  // ---- queries -----------------------------------------------------------------------------

  unitName(u: Unit): string {
    if (u.hero) return u.hero.name;
    if (u.struct) return STRUCTS[u.struct.def.tier].name;
    if (u.npc) return u.npc.def.name;
    return u.kind;
  }
  teamBuff(team: number, id: string): boolean {
    if (team > 1) return false;
    for (const b of this.teams[team as 0 | 1].buffs) if (b.id === id && b.until > this.tick) return true;
    return false;
  }
  teamGold(team: number): number {
    let g = 0;
    for (const h of this.heroes) if (h.team === team) g += h.hero!.goldEarned;
    return g;
  }
  minionNear(team: number, x: number, y: number, r: number): boolean {
    for (const u of this.units) if (u.kind === 'minion' && u.alive && u.team === team && dist(u.x, u.y, x, y) <= r) return true;
    return false;
  }
  /** Enemies of `team` that abilities can affect (no structures / wards). */
  enemiesIn(team: number, x: number, y: number, r: number): Unit[] {
    const out: Unit[] = [];
    for (const u of this.units) {
      if (!u.alive || u.team === team || u.struct || u.kind === 'ward') continue;
      if (dist(u.x, u.y, x, y) <= r + u.radius) out.push(u);
    }
    return out;
  }
  alliedHeroesIn(team: number, x: number, y: number, r: number): Unit[] {
    const out: Unit[] = [];
    for (const u of this.heroes) if (u.alive && u.team === team && dist(u.x, u.y, x, y) <= r + u.radius) out.push(u);
    return out;
  }
  nearestEnemy(team: number, x: number, y: number, r: number, pred?: (u: Unit) => boolean): Unit | null {
    let best: Unit | null = null;
    let bd = r;
    for (const u of this.units) {
      if (!u.alive || u.team === team) continue;
      const d = dist(u.x, u.y, x, y) - u.radius;
      if (d > bd) continue;
      if (!targetable(this, u, team)) continue;
      if (pred && !pred(u)) continue;
      bd = d;
      best = u;
    }
    return best;
  }
  inZone(z: Zone, u: Unit): boolean {
    switch (z.shape) {
      case 'circle':
        return dist(u.x, u.y, z.x, z.y) <= z.r + u.radius * 0.6;
      case 'ring': {
        const d = dist(u.x, u.y, z.x, z.y);
        return d <= z.r + u.radius * 0.6 && d >= z.w - u.radius * 0.6;
      }
      case 'cone':
        return inCone(u.x, u.y, z.x, z.y, z.ang, z.r, z.arc, u.radius * 0.6);
      case 'rect':
        return inRect(u.x, u.y, z.x, z.y, z.ang, z.r, z.w, u.radius * 0.6);
      case 'wall':
        return false;
    }
  }
  wallBlocks(team: number, x: number, y: number, pad: number): boolean {
    for (const wl of this.walls) {
      if (wl.team === team) continue;
      if (pointSegDist(x, y, wl.ax, wl.ay, wl.bx, wl.by) < wl.r + pad) return true;
    }
    return false;
  }
  pathFor(u: Unit, tx: number, ty: number): Vec[] {
    const blocked = this.walls.length ? (x: number, y: number): boolean => this.wallBlocks(u.team, x, y, 0.4) : undefined;
    return this.map.findPath(u.x, u.y, tx, ty, blocked);
  }

  // ---- movement ----------------------------------------------------------------------------

  private clearOf(u: Unit): number {
    return u.hero ? NAV_CLEAR - 0.08 : 0.35;
  }

  /** Attempt a displacement with wall sliding. Returns true if the unit moved. */
  tryMove(u: Unit, dx: number, dy: number): boolean {
    const map = this.map;
    const clear = this.clearOf(u);
    let nx = u.x + dx;
    let ny = u.y + dy;
    const here = map.sdf(u.x, u.y);
    const ok = (x: number, y: number): boolean => {
      const d = map.sdf(x, y);
      if (d >= -clear && d >= here - 0.001) return false; // may always move toward more open ground
      return !(this.walls.length && this.wallBlocks(u.team, x, y, u.radius * 0.6) && !this.wallBlocks(u.team, u.x, u.y, u.radius * 0.6));
    };
    if (ok(nx, ny)) {
      u.x = nx;
      u.y = ny;
      return true;
    }
    const g = map.gradient(nx, ny);
    const dot = dx * g.x + dy * g.y;
    if (dot > 0) {
      const sx = dx - g.x * dot;
      const sy = dy - g.y * dot;
      const sl = Math.hypot(sx, sy);
      const l = Math.hypot(dx, dy);
      if (sl > 1e-4) {
        nx = u.x + (sx / sl) * l;
        ny = u.y + (sy / sl) * l;
        if (ok(nx, ny)) {
          u.x = nx;
          u.y = ny;
          return true;
        }
      }
    }
    return false;
  }

  /** Move toward a point at the unit's speed. Returns true on arrival. */
  moveToward(u: Unit, tx: number, ty: number, speed = u.stats.speed): boolean {
    const dx = tx - u.x;
    const dy = ty - u.y;
    const d = Math.hypot(dx, dy);
    const step = speed * DT;
    if (d < 1e-4) return true;
    u.facing = Math.atan2(dy, dx);
    if (d <= step) {
      this.tryMove(u, dx, dy);
      return true;
    }
    this.tryMove(u, (dx / d) * step, (dy / d) * step);
    return false;
  }

  /** Follow u.path; returns true once the final waypoint is reached. */
  followPath(u: Unit): boolean {
    if (!u.path || u.pathI >= u.path.length) return true;
    const wp = u.path[u.pathI];
    if (this.moveToward(u, wp.x, wp.y)) {
      u.pathI++;
      if (u.pathI >= u.path.length) {
        u.path = null;
        return true;
      }
    }
    return false;
  }

  /** Furthest walkable point walking from a toward b (used by dashes, knockbacks, blinks). */
  lastWalkable(ax: number, ay: number, bx: number, by: number, team: number = 2): Vec {
    const d = dist(ax, ay, bx, by);
    const n = Math.max(1, Math.ceil(d / 0.3));
    let ox = ax;
    let oy = ay;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (this.map.sdf(x, y) > -(NAV_CLEAR + 0.05) || (team < 2 && this.wallBlocks(team, x, y, 0.4))) break;
      ox = x;
      oy = y;
    }
    return { x: ox, y: oy };
  }

  /** Endpoint for a wall-crossing move: the target if standable, else the nearest valid spot back along the line. */
  throughEnd(ax: number, ay: number, bx: number, by: number): Vec {
    const d = dist(ax, ay, bx, by);
    const n = Math.max(1, Math.ceil(d / 0.3));
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (this.map.sdf(x, y) < -(NAV_CLEAR + 0.05)) return { x, y };
    }
    return { x: ax, y: ay };
  }

  startDash(u: Unit, tx: number, ty: number, speed: number, through: boolean, onArrive: (() => void) | null = null): void {
    u.dash = { tx, ty, speed, onArrive, through };
    u.path = null;
    u.windupUntil = 0;
    u.anim = ANIM.dash;
    u.animAt = this.tick;
    u.animDur = Math.max(3, Math.round((dist(u.x, u.y, tx, ty) / speed) * 30));
    if (u.hero && u.hero.recallUntil > 0) u.hero.recallUntil = 0;
  }

  private tickDash(u: Unit): void {
    const d = u.dash!;
    const dx = d.tx - u.x;
    const dy = d.ty - u.y;
    const l = Math.hypot(dx, dy);
    const step = d.speed * DT;
    if (l > 1e-3) u.facing = Math.atan2(dy, dx);
    let done = false;
    if (l <= step) {
      u.x = d.tx;
      u.y = d.ty;
      done = true;
    } else if (d.through) {
      u.x += (dx / l) * step;
      u.y += (dy / l) * step;
    } else {
      const bx = u.x;
      const by = u.y;
      if (!this.tryMove(u, (dx / l) * step, (dy / l) * step) || dist(bx, by, u.x, u.y) < step * 0.3) done = true;
    }
    if (done) {
      u.dash = null;
      if (this.map.sdf(u.x, u.y) > -NAV_CLEAR * 0.8) {
        const p = this.map.nearestWalkable(u.x, u.y);
        u.x = p.x;
        u.y = p.y;
      }
      d.onArrive?.();
    }
  }

  /** Shove a unit (knockbacks / pulls); slides along walls and never embeds in terrain. */
  displace(u: Unit, tx: number, ty: number): void {
    if (u.struct || u.kind === 'ward') return;
    const p = this.lastWalkable(u.x, u.y, tx, ty);
    u.x = p.x;
    u.y = p.y;
    u.path = null;
  }

  // ---- attacks -----------------------------------------------------------------------------

  inRange(u: Unit, t: Unit, extra = 0): boolean {
    return dist(u.x, u.y, t.x, t.y) <= u.stats.range + t.radius + 0.15 + extra;
  }

  setAnim(u: Unit, anim: number, dur: number): void {
    u.anim = anim;
    u.animAt = this.tick;
    u.animDur = dur;
  }
  loco(u: Unit, moving: boolean): void {
    if (u.anim >= 2 && this.tick < u.animAt + u.animDur) {
      if (!moving || u.windupUntil > 0) return;
    }
    const a = moving ? ANIM.run : ANIM.idle;
    if (u.anim !== a) {
      u.anim = a;
      u.animAt = this.tick;
      u.animDur = 0;
    }
  }

  /** Windup -> release -> backswing state machine shared by every attacker. */
  attackStep(u: Unit, t: Unit): void {
    u.facing = Math.atan2(t.y - u.y, t.x - u.x);
    if (u.windupUntil > 0) {
      if (u.windupTarget !== t.id) {
        u.windupUntil = 0;
      } else if (this.tick >= u.windupUntil) {
        u.windupUntil = 0;
        if (this.inRange(u, t, 2)) this.releaseAttack(u, t);
      }
      return;
    }
    if (this.tick < u.attackReadyAt || hasEffect(u, 'disarm')) return;
    const period = Math.max(6, Math.round(30 / u.stats.as));
    const frac = u.hero ? u.hero.def.base.windup : u.npc ? u.npc.def.windup : 0.25;
    const wind = Math.max(2, Math.round(period * frac));
    u.windupUntil = this.tick + wind;
    u.windupTarget = t.id;
    u.attackReadyAt = this.tick + period;
    this.setAnim(u, ANIM.attack, wind + 5);
  }

  private releaseAttack(u: Unit, t: Unit): void {
    this.emitPos({ e: 'atk', id: u.id, tgt: t.id, k: u.kind, s: u.sub, x: u.x, y: u.y }, u.x, u.y);
    const missile = u.hero ? u.hero.def.base.missileSpeed : u.npc ? u.npc.def.missile : u.struct ? RULES.towerMissile : 0;
    if (u.hero) this.tut(u, t.hero ? 'attackHero' : 'attack');
    if (missile <= 0) {
      basicHit(this, u, t);
      return;
    }
    this.spawnProj({
      kind: `atk_${u.kind === 'hero' ? u.sub : u.struct ? 'tower' : u.sub}`,
      team: u.team,
      src: u.id,
      x: u.x + Math.cos(u.facing) * u.radius,
      y: u.y + Math.sin(u.facing) * u.radius,
      homing: t.id,
      speed: missile,
      radius: 0.25,
      hits: 'none',
      onHit: (_p, tg) => basicHit(this, u, tg),
    });
  }

  heroAggro(src: Unit, tgt: Unit): void {
    const R = RULES.towerRange;
    for (const s of this.structs) {
      if (!s.alive || s.team !== tgt.team || s.stats.ad <= 0 || !s.struct) continue;
      if (dist(s.x, s.y, tgt.x, tgt.y) <= R + 2 && dist(s.x, s.y, src.x, src.y) <= R + src.radius) {
        s.struct.focusId = src.id;
        s.struct.focusUntil = this.tick + secs(2.5);
      }
    }
    for (const m of this.units) {
      if (m.kind !== 'minion' || !m.alive || m.team !== tgt.team || !m.npc) continue;
      if (dist(m.x, m.y, src.x, src.y) < 8) {
        m.npc.aggroId = src.id;
        m.npc.aggroUntil = this.tick + secs(2.5);
      }
    }
  }

  // ---- NPC brains --------------------------------------------------------------------------

  private minionAcquire(u: Unit): void {
    const n = u.npc!;
    if (n.aggroUntil > this.tick) {
      const a = this.byId.get(n.aggroId);
      if (a && targetable(this, a, u.team) && dist(u.x, u.y, a.x, a.y) < 9) {
        u.attackTarget = a.id;
        return;
      }
    }
    let best: Unit | null = null;
    let bestScore = 1e9;
    const enemy = 1 - u.team;
    for (const o of this.units) {
      if (o.team !== enemy || !o.alive || o.kind === 'ward') continue;
      const d = dist(u.x, u.y, o.x, o.y) - o.radius;
      if (d > 7.5) continue;
      if (!targetable(this, o, u.team)) continue;
      const pri = o.struct ? 1 : o.hero ? 2 : 0;
      if (o.hero && d > 6) continue;
      const score = pri * 100 + d + (o.id === u.attackTarget ? -1.5 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    u.attackTarget = best ? best.id : 0;
  }

  private minionBrain(u: Unit): void {
    const n = u.npc!;
    let t = u.attackTarget ? this.byId.get(u.attackTarget) : undefined;
    if ((this.tick + u.id) % 8 === 0 || (u.attackTarget && !targetable(this, t, u.team))) {
      this.minionAcquire(u);
      t = u.attackTarget ? this.byId.get(u.attackTarget) : undefined;
    }
    if (t && t.alive) {
      if (this.inRange(u, t)) {
        this.attackStep(u, t);
        this.loco(u, false);
      } else {
        u.windupUntil = 0;
        this.moveToward(u, t.x, t.y);
        this.loco(u, true);
      }
      return;
    }
    u.windupUntil = 0;
    const path = this.map.lanePaths[n.lane][u.team as 0 | 1];
    const last = path.length - 1;
    while (n.wp < last) {
      const c = path[n.wp];
      const nx = path[n.wp + 1];
      const dc = dist(u.x, u.y, c.x, c.y);
      if (dc < 2.4 || dist(u.x, u.y, nx.x, nx.y) < dc) n.wp++;
      else break;
    }
    const wp = path[n.wp];
    if (dist(u.x, u.y, wp.x, wp.y) > 1) {
      this.moveToward(u, wp.x, wp.y);
      this.loco(u, true);
    } else this.loco(u, false);
  }

  private monsterBrain(u: Unit): void {
    const n = u.npc!;
    const camp = n.camp!;
    const def = MONSTERS[u.sub];
    if (n.resetting) {
      u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * 0.2 * DT);
      if (dist(u.x, u.y, n.home.x, n.home.y) > 0.3) {
        this.moveToward(u, n.home.x, n.home.y, u.stats.speed * 1.4);
        this.loco(u, true);
      } else {
        this.loco(u, false);
        if (u.hp >= u.stats.maxHp - 1) n.resetting = false;
      }
      return;
    }
    if (!n.aggroId) {
      this.loco(u, false);
      return;
    }
    const a = this.byId.get(n.aggroId);
    const leash = def.big ? 11 : 9;
    if (!a || !a.alive || dist(a.x, a.y, camp.def.x, camp.def.y) > leash) {
      // target left the leash zone: the whole camp resets and heals
      camp.aggro = 0;
      for (const id of camp.units) {
        const m = this.byId.get(id);
        if (m?.npc) {
          m.npc.aggroId = 0;
          m.npc.resetting = true;
          m.windupUntil = 0;
        }
      }
      return;
    }
    if (this.inRange(u, a)) {
      this.attackStep(u, a);
      this.loco(u, false);
    } else {
      u.windupUntil = 0;
      this.moveToward(u, a.x, a.y);
      this.loco(u, true);
    }
    // role-readable telegraphed specials
    if ((def.big || u.sub === 'mist' || u.sub === 'brass') && this.tick >= n.nextSpecial) {
      if (n.nextSpecial === 0) {
        n.nextSpecial = this.tick + secs(3);
        return;
      }
      n.nextSpecial = this.tick + secs(u.sub === 'colossus' ? 6 : 7);
      const r = u.sub === 'colossus' ? 4.6 : def.big ? 3.2 : 2.4;
      const dmg = (u.sub === 'colossus' ? 230 : def.big ? 130 : 70) * n.dmgMult;
      this.spawnZone({
        kind: u.sub === 'colossus' ? 'colossusSlam' : 'monsterSlam',
        team: 2,
        src: u.id,
        shape: 'circle',
        x: a.x,
        y: a.y,
        r,
        armAt: this.tick + secs(1.1),
        until: this.tick + secs(1.1) + 2,
        erasable: false,
        onArm: (z) => {
          this.fxAt('slam', z.x, z.y, { r: z.r, c: 0xff5ad6 });
          for (const e of this.units) {
            if (!e.alive || e.team === 2 || e.struct || e.kind === 'ward') continue;
            if (!this.inZone(z, e)) continue;
            dealDamage(this, u, e, dmg, ARCANE, { label: `${def.name} slam` });
            if (u.sub === 'colossus') applyCC(this, u, e, 'airborne', 0.6);
            else applyCC(this, u, e, 'slow', 1.5, 0.3);
          }
        },
      });
    }
  }

  private towerBrain(u: Unit): void {
    const st = u.struct!;
    if (u.stats.ad <= 0) return;
    const R = RULES.towerRange;
    const inR = (o: Unit | undefined): o is Unit => !!o && o.alive && o.team !== u.team && o.team !== 2 && dist(u.x, u.y, o.x, o.y) <= R + o.radius;
    let t = u.attackTarget ? this.byId.get(u.attackTarget) : undefined;
    const focus = st.focusUntil > this.tick ? this.byId.get(st.focusId) : undefined;
    if (inR(focus) && focus !== t) {
      t = focus;
    } else if ((this.tick + u.id) % 6 === 0 || (t !== undefined && !inR(t))) {
      // (re)acquire on a staggered cadence, or immediately when the current target is lost
      if (!inR(t)) t = undefined;
      if (!t) {
        // priority: minions, then summoned units (decoys), then heroes
        let best: Unit | undefined;
        let bs = 1e9;
        for (const o of this.units) {
          if (!inR(o) || o.kind === 'ward' || o.struct) continue;
          const pri = o.kind === 'minion' ? 0 : o.kind === 'decoy' ? 1 : 2;
          const s = pri * 100 + dist(u.x, u.y, o.x, o.y);
          if (s < bs) {
            bs = s;
            best = o;
          }
        }
        t = best;
      }
    }
    const id = t ? t.id : 0;
    if (id !== u.attackTarget) {
      u.attackTarget = id;
      st.ramp = 0;
      u.windupUntil = 0;
      if (t?.hero) this.fxAt('towerLock', t.x, t.y, { id: t.id, x2: u.x, y2: u.y });
    }
    if (t) this.attackStep(u, t);
  }

  private decoyBrain(u: Unit): void {
    if (u.path) {
      this.followPath(u);
      this.loco(u, true);
    } else this.loco(u, false);
  }

  // ---- spawners ----------------------------------------------------------------------------

  private spawnWave(lane: number): void {
    const count = ++this.waveCount[lane];
    const minutes = this.time / 60;
    const growth = 1 + 0.035 * minutes * this.pace.clock;
    for (const team of [0, 1] as const) {
      const path = this.map.lanePaths[lane][team];
      const start = path[0];
      const dirx = path[1].x - start.x;
      const diry = path[1].y - start.y;
      const dl = Math.hypot(dirx, diry) || 1;
      const list: string[] = ['guard', 'guard', 'guard', 'bolt', 'bolt', 'bolt'];
      if (count % 3 === 0) list.push('siege');
      // a broken enemy Seal in this lane adds a Vanguard to our wave
      const enemySeal = this.structByKey.get(`t${1 - team}-${lane === 0 ? 'up' : 'low'}-seal`);
      if (enemySeal && !enemySeal.alive) list.unshift('vanguard');
      list.forEach((type, i) => {
        const back = 1.3 * i;
        const side = ((i % 3) - 1) * 1.1;
        const x = start.x - (dirx / dl) * back + (-diry / dl) * side;
        const y = start.y - (diry / dl) * back + (dirx / dl) * side;
        const p = this.map.sdf(x, y) < -0.5 ? { x, y } : this.map.nearestWalkable(x, y);
        const u = this.makeNpc('minion', type, MINIONS[type], team, p.x, p.y, growth);
        u.npc!.lane = lane;
        u.facing = Math.atan2(diry, dirx);
      });
    }
  }

  private spawnCamp(camp: CampState): void {
    const def = MONSTERS[camp.def.type];
    const growth = 1 + 0.045 * (this.time / 60) * this.pace.clock;
    camp.alive = true;
    camp.aggro = 0;
    camp.units = [];
    for (let i = 0; i < def.count; i++) {
      const a = (i / def.count) * Math.PI * 2 + 0.6;
      const off = def.count > 1 ? 1.3 : 0;
      const u = this.makeNpc('monster', camp.def.type, def, 2, camp.def.x + Math.cos(a) * off, camp.def.y + Math.sin(a) * off, growth);
      u.npc!.camp = camp;
      u.facing = camp.def.x < 75 ? Math.PI : camp.def.x > 75 ? 0 : -Math.PI / 2;
      camp.units.push(u.id);
    }
    if (def.big) {
      this.announce(`${def.name} has awakened`, 'objective', 2);
      this.fxAt('spawnBig', camp.def.x, camp.def.y, {});
    }
  }

  campCleared(camp: CampState, kHero: Unit | null, _killer: Unit | null): void {
    const def = MONSTERS[camp.def.type];
    camp.alive = false;
    camp.nextSpawn = this.tick + secs(def.respawn / this.pace.clock);
    if (!kHero?.hero) return;
    const team = kHero.team as 0 | 1;
    const type: CampDef['type'] = camp.def.type;
    if (type === 'brass') {
      addEffect(this, kHero, 'buff_brass', secs(90), 0, -2);
      addEffect(this, kHero, 'ad', secs(90), 10 + kHero.level, -2);
      addEffect(this, kHero, 'as', secs(90), 15, -2);
    } else if (type === 'mist') {
      addEffect(this, kHero, 'buff_mist', secs(90), 0, -3);
    } else if (def.big) {
      const id = type === 'catalystN' ? 'gale' : type === 'catalystS' ? 'forge' : 'colossus';
      const dur = type === 'colossus' ? RULES.colossusBuff : RULES.catalystBuff;
      this.teams[team].buffs = this.teams[team].buffs.filter((b) => b.id !== id);
      this.teams[team].buffs.push({ id, until: this.tick + secs(dur) });
      for (const h of this.heroes) {
        if (h.team !== team) continue;
        grantGold(this, h, def.gold * this.pace.gold, h.alive);
        if (h.alive && dist(h.x, h.y, camp.def.x, camp.def.y) < 16) h.hero!.objectives++;
      }
      const what = type === 'catalystN' ? 'Gale Catalyst — Tailwind: faster out of combat' : type === 'catalystS' ? 'Forge Catalyst — Sunder: +20% structure damage' : 'Aether Colossus — empowered minions and fast recall';
      this.announce(`${TEAM_NAMES[team]} claimed the ${what}`, 'objective', team);
      this.timelineAdd(`${def.name} claimed`, team);
      this.tut(null, team === 0 ? 'objective' : '');
    }
  }

  private spawners(): void {
    const t = this.tick;
    const iv = secs(RULES.waveInterval);
    const first = secs(RULES.firstWave);
    if (t >= first && (t - first) % iv === 0) this.spawnWave(0);
    if (t >= first + iv / 2 && (t - first - iv / 2) % iv === 0) this.spawnWave(1);
    if (t % 15 === 0) {
      for (const camp of this.camps) if (!camp.alive && t >= camp.nextSpawn) this.spawnCamp(camp);
      // one-time Seal respawn
      for (const s of this.structs) {
        const st = s.struct!;
        if (s.kind === 'seal' && !s.alive && !st.respawned && t >= st.deadAt + secs(RULES.sealRespawn / this.pace.clock)) {
          st.respawned = true;
          s.alive = true;
          s.hp = s.stats.maxHp;
          this.announce(`${TEAM_NAMES[s.team]}'s ${st.def.lane === 0 ? 'upper' : 'lower'} Seal has reformed`, 'seal', s.team);
        }
      }
      // Colossus empowerment: allied minions near allied heroes
      for (const team of [0, 1] as const) {
        if (!this.teamBuff(team, 'colossus')) continue;
        for (const m of this.units) {
          if (m.kind !== 'minion' || m.team !== team || !m.alive) continue;
          for (const h of this.heroes) {
            if (h.team === team && h.alive && dist(h.x, h.y, m.x, m.y) < 12) {
              addEffect(this, m, 'empower', 30, 1, -5);
              break;
            }
          }
        }
      }
    }
    if (t % 30 === 0) {
      for (const h of this.heroes) {
        const hs = h.hero!;
        let g = RULES.passiveGold * this.pace.gold;
        for (const s of hs.inv) if (s?.id === 'moth_lantern') g += 0.6;
        hs.gold += g;
        hs.goldEarned += g;
      }
      for (const tm of this.teams) tm.buffs = tm.buffs.filter((b) => b.until > t);
    }
  }

  // ---- per-unit tick -----------------------------------------------------------------------

  private tickUnit(u: Unit): void {
    const t = this.tick;
    if (!u.alive) {
      if (u.hero && u.hero.respawnAt > 0 && t >= u.hero.respawnAt) respawnHero(this, u);
      return;
    }
    if (u.expireAt && t >= u.expireAt) {
      u.alive = false;
      if (u.kind === 'ward' && u.team < 2) this.teams[u.team as 0 | 1].wards = this.teams[u.team as 0 | 1].wards.filter((id) => id !== u.id);
      this.fxAt('poof', u.x, u.y, {});
      return;
    }
    const px = u.x;
    const py = u.y;
    if (u.effects.length) {
      let expired = false;
      for (const e of u.effects) {
        if (e.until <= t) {
          expired = true;
          if (e.type === 'parcel') this.parcelBoom(u, e.src, e.value);
          continue;
        }
        if (t % 15 === 0) {
          if (e.type === 'dot' || e.type === 'dotp') dealDamage(this, this.byId.get(e.src) ?? null, u, e.value * 0.5, e.type === 'dot' ? ARCANE : 2, { dot: true, label: e.type === 'dot' ? 'Burn' : 'Smolder', noProc: true });
          else if (e.type === 'hot') heal(this, null, u, e.value * 0.5, true);
          else if (e.type === 'mot') u.mana = Math.min(u.stats.maxMana, u.mana + e.value * 0.5);
          if (!u.alive) return;
        }
      }
      if (expired) u.effects = u.effects.filter((e) => e.until > t);
    }
    if (u.shields.length) {
      for (const sh of u.shields) {
        if (sh.until <= t && sh.amount > 0) {
          // Oru's Shared Wing: unbroken shields return part of their value as health
          if (sh.oru) heal(this, null, u, sh.amount * 0.3);
          sh.amount = 0;
        }
      }
      u.shields = u.shields.filter((sh) => sh.amount > 0);
    }
    u.brush = this.map.brushAt(u.x, u.y);
    if (u.hero || u.effects.length || (t + u.id) % 15 === 0) recalcStats(this, u);
    if (u.hero) {
      heroPreTick(this, u);
      if (!u.alive) return;
    }
    if (stunned(u)) {
      this.loco(u, false);
    } else if (u.dash) {
      this.tickDash(u);
    } else if (u.hero) heroBrain(this, u);
    else if (u.kind === 'minion') this.minionBrain(u);
    else if (u.kind === 'monster') this.monsterBrain(u);
    else if (u.struct) this.towerBrain(u);
    else if (u.kind === 'decoy') this.decoyBrain(u);
    u.vx = (u.x - px) / DT;
    u.vy = (u.y - py) / DT;
  }

  parcelBoom(carrier: Unit, srcId: number, dmg: number): void {
    const src = this.byId.get(srcId);
    if (!src || !carrier.alive) return;
    this.fxAt('parcelBoom', carrier.x, carrier.y, { r: 2.5 });
    for (const e of this.enemiesIn(src.team, carrier.x, carrier.y, 2.5)) dealDamage(this, src, e, dmg, ARCANE, { ability: 2, label: 'Parcel Charge' });
  }

  private separate(): void {
    const us = this.units;
    const n = us.length;
    for (let i = 0; i < n; i++) {
      const a = us[i];
      if (!a.alive || a.struct || a.kind === 'ward' || a.dash) continue;
      for (let j = i + 1; j < n; j++) {
        const b = us[j];
        if (!b.alive || b.struct || b.kind === 'ward' || b.dash) continue;
        const dx = b.x - a.x;
        if (dx > 2.2 || dx < -2.2) continue;
        const dy = b.y - a.y;
        if (dy > 2.2 || dy < -2.2) continue;
        const rr = (a.radius + b.radius) * 0.9;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) continue;
        const aHero = !!a.hero;
        const bHero = !!b.hero;
        if (aHero && bHero && a.team === b.team && (a.path || b.path)) continue; // allies pass through softly while moving
        let d = Math.sqrt(d2);
        let nx: number;
        let ny: number;
        if (d < 1e-3) {
          const ang = ((a.id * 7 + b.id * 13) % 628) / 100;
          nx = Math.cos(ang);
          ny = Math.sin(ang);
          d = 0;
        } else {
          nx = dx / d;
          ny = dy / d;
        }
        const push = (rr - d) * 0.5;
        // heroes shoulder minions aside; monsters hold their ground
        let wa = 0.5;
        let wb = 0.5;
        if (aHero && !bHero) {
          wa = 0.1;
          wb = 0.9;
        } else if (bHero && !aHero) {
          wa = 0.9;
          wb = 0.1;
        }
        if (a.kind === 'monster') {
          wa = 0;
          wb = 1;
        } else if (b.kind === 'monster') {
          wa = 1;
          wb = 0;
        }
        if (wa > 0) this.tryMove(a, -nx * push * wa, -ny * push * wa);
        if (wb > 0) this.tryMove(b, nx * push * wb, ny * push * wb);
      }
    }
  }

  // ---- projectiles and zones ---------------------------------------------------------------

  private tickProjs(): void {
    for (const p of this.projs) {
      if (p.dead) continue;
      if (p.homing) {
        const t = this.byId.get(p.homing);
        if (!t || !t.alive) {
          p.dead = true;
          continue;
        }
        const dx = t.x - p.x;
        const dy = t.y - p.y;
        const d = Math.hypot(dx, dy);
        const step = p.speed * DT;
        if (d <= step + t.radius * 0.5) {
          p.x = t.x;
          p.y = t.y;
          p.dead = true;
          p.onHit?.(p, t);
        } else {
          p.dx = dx / d;
          p.dy = dy / d;
          p.x += p.dx * step;
          p.y += p.dy * step;
        }
        continue;
      }
      let step = Math.min(p.speed * DT, p.remaining);
      const sub = Math.max(1, Math.ceil(step / 0.7));
      step /= sub;
      for (let s = 0; s < sub && !p.dead; s++) {
        const px = p.x;
        const py = p.y;
        p.x += p.dx * step;
        p.y += p.dy * step;
        p.remaining -= step;
        p.travelled += step;
        // created terrain (Rampart Fold)
        if (this.walls.length && p.team < 2) {
          for (const wl of this.walls) {
            if (wl.team === p.team) continue;
            if (pointSegDist(p.x, p.y, wl.ax, wl.ay, wl.bx, wl.by) <= wl.r + p.radius) {
              wl.hp -= p.power;
              this.fxAt('wallHit', p.x, p.y, {});
              p.dead = true;
              break;
            }
          }
          if (p.dead) break;
        }
        if (p.terrain && this.map.sdfT(p.x, p.y) > 0.5) {
          if (p.bounce > 0) {
            p.bounce--;
            const g = this.map.gradient(p.x, p.y, true);
            const dot = p.dx * g.x + p.dy * g.y;
            if (dot > 0) {
              p.dx -= 2 * dot * g.x;
              p.dy -= 2 * dot * g.y;
            }
            p.x = px;
            p.y = py;
            p.hitIds.length = 0;
            this.fxAt('ricochet', p.x, p.y, {});
          } else {
            p.dead = true;
            p.onEnd?.(p);
            break;
          }
        }
        p.onStep?.(p, px, py);
        if (p.hits !== 'none' && p.onHit) {
          let best: Unit | null = null;
          let bd = 1e9;
          for (const u of this.units) {
            if (!u.alive || u.struct || u.kind === 'ward' || u.id === p.src) continue;
            if (p.hits !== 'both' && u.team === p.team) continue;
            if (p.hits === 'both' && u.team === p.team && !u.hero) continue;
            if (p.hitIds.includes(u.id)) continue;
            if (pointSegDist(u.x, u.y, px, py, p.x, p.y) > p.radius + u.radius) continue;
            const d = dist(px, py, u.x, u.y);
            if (d < bd) {
              bd = d;
              best = u;
            }
          }
          if (best) {
            p.hitIds.push(best.id);
            const stop = p.onHit(p, best);
            if (!p.pierce || stop === true) p.dead = true;
          }
        }
        if (!p.dead && p.remaining <= 0.001) {
          p.dead = true;
          p.onEnd?.(p);
        }
      }
    }
    if (this.projs.some((p) => p.dead)) this.projs = this.projs.filter((p) => !p.dead);
  }

  private tickZones(): void {
    const t = this.tick;
    for (const z of this.zones) {
      if (z.dead) continue;
      if (!z.armed && t >= z.armAt) {
        z.armed = true;
        z.onArm?.(z);
      }
      if (z.armed && z.onTick && z.every > 0 && (t - z.armAt) % z.every === 0) z.onTick(z);
      if (t >= z.until) {
        z.dead = true;
        z.onEnd?.(z);
      }
    }
    if (this.zones.some((z) => z.dead)) this.zones = this.zones.filter((z) => !z.dead);
    if (this.walls.length) {
      for (const wl of this.walls) {
        if (wl.hp <= 0 || t >= wl.until) {
          wl.until = 0;
          const z = this.zones.find((zz) => zz.id === wl.zone);
          if (z) z.dead = true;
          this.fxAt('wallBreak', (wl.ax + wl.bx) / 2, (wl.ay + wl.by) / 2, {});
        }
      }
      this.walls = this.walls.filter((wl) => wl.until > 0);
      this.zones = this.zones.filter((z) => !z.dead);
    }
  }

  // ---- main step ---------------------------------------------------------------------------

  step(): void {
    if (this.over) return;
    this.tick++;
    this.spawners();
    for (const h of this.heroes) if (h.hero!.bot) botThink(this, h);
    const n = this.units.length;
    for (let i = 0; i < n; i++) this.tickUnit(this.units[i]);
    this.separate();
    this.tickProjs();
    this.tickZones();
    let removed = false;
    for (const u of this.units) {
      if (!u.alive && !u.hero && !u.struct) {
        this.byId.delete(u.id);
        removed = true;
      }
    }
    if (removed) this.units = this.units.filter((u) => u.alive || u.hero || u.struct);
    if (this.tick % 3 === 0) updateVision(this);
  }

  /** Cheap state hash for determinism tests. */
  hash(): number {
    let h = 2166136261 >>> 0;
    const mix = (v: number): void => {
      h ^= Math.round(v * 100) | 0;
      h = Math.imul(h, 16777619) >>> 0;
    };
    for (const u of this.units) {
      mix(u.id);
      mix(u.x);
      mix(u.y);
      mix(u.hp);
    }
    for (const hh of this.heroes) {
      mix(hh.hero!.gold);
      mix(hh.hero!.xp);
    }
    mix(this.tick);
    return h;
  }
}

export { clamp };
