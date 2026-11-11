// Server-side hero bots. They issue the same validated Commands as players and perceive only
// their team's fog-filtered view (no hidden vision, no stat cheats). Difficulty changes reaction
// time, aim error, last-hit tolerance and planning — never stats.
import type { Match } from '../sim/match';
import type { Unit } from '../sim/types';
import type { CommandBody, PingKind } from '../protocol/messages';
import { LANES, FOUNTAIN, CAMPS, BRUSHES, inFountain, Team, laneDistance } from '../shared/map';
import { dist, clamp } from '../shared/math';
import { ITEMS, purchasePlan } from '../shared/items';
import { HEROES, STARTERS } from '../shared/heroes';
import * as R from '../shared/rules';
import { damageMultiplier } from '../shared/rules';
import { botCast, BotCtx } from './botkits';

export type BotState = 'Lane' | 'LastHit' | 'Harass' | 'AvoidThreat' | 'RecallBuy' | 'Ward' | 'JungleCamp' | 'Gank' | 'Defend' | 'Push' | 'RotateObjective' | 'TeamFight' | 'ChaseLimited' | 'Retreat' | 'Shop' | 'Dead';

const DIFF = {
  easy: { think: 0.45, aim: 1.3, lastHit: 0.75, lead: 0.3, castChance: 0.45, ward: 0.3 },
  normal: { think: 0.28, aim: 0.6, lastHit: 0.92, lead: 0.75, castChance: 0.8, ward: 0.7 },
  hard: { think: 0.18, aim: 0.25, lastHit: 1.0, lead: 1.0, castChance: 1, ward: 1 },
};

/** Team blackboard shared by a team's bots. */
export class TeamPlanner {
  objective: { key: string; x: number; y: number; until: number; members: number[] } | null = null;
  cooldown = new Map<string, number>();
  nextObjectiveAt = 0;
  groupLane = -1;
  siegeEngine = 0;
  lastPlan = -99;
  lastKnown = new Map<number, { x: number; y: number; t: number }>();
  constructor(public m: Match, public team: 0 | 1) {}

  update() {
    const m = this.m;
    if (m.time - this.lastPlan < 1.5) return;
    this.lastPlan = m.time;
    for (const u of m.units) if (u.kind === 'hero' && u.team !== this.team && u.alive && m.visibleTo(this.team, u)) this.lastKnown.set(u.id, { x: u.x, y: u.y, t: m.time });
    const allies = m.heroes.filter((h) => h.team === this.team);
    const enemies = m.heroes.filter((h) => h.team !== this.team);
    const aliveA = allies.filter((h) => h.alive).length, aliveE = enemies.filter((h) => h.alive).length; // death state is public (scoreboard)
    const avgLevel = allies.reduce((s, h) => s + h.hero!.level, 0) / allies.length;
    const avgLevelE = enemies.reduce((s, h) => s + h.hero!.level, 0) / enemies.length;
    // neutral objective decisions
    if (this.objective) {
      const o = this.objective;
      const contested = m.units.filter((u) => u.kind === 'hero' && u.team !== this.team && u.alive && m.visibleTo(this.team, u) && dist(u.x, u.y, o.x, o.y) < 14).length;
      const ours = allies.filter((h) => h.alive && dist(h.x, h.y, o.x, o.y) < 14).length;
      if (m.time > o.until || !this.campAlive(o.key) || contested > ours + 1) {
        if (this.campAlive(o.key)) this.cooldown.set(o.key, m.time + 75);
        this.objective = null;
      }
    }
    if (!this.objective && m.time >= this.nextObjectiveAt) {
      for (const c of m.camps) {
        if (!c.alive.length || (this.cooldown.get(c.def.key) ?? 0) > m.time) continue;
        const k = c.def.kind;
        let want = false;
        if (k === 'colossus') want = aliveA >= 2 && aliveA >= aliveE && avgLevel >= 6;
        else if (k === 'catalystGale' || k === 'catalystForge') want = aliveA >= aliveE && avgLevel >= 4;
        if (!want) continue;
        if (m.units.some((u) => u.kind === 'hero' && u.team !== this.team && u.alive && m.visibleTo(this.team, u) && dist(u.x, u.y, c.def.x, c.def.y) < 15)) continue;
        // pick the nearest healthy bots as participants (humans are invited by ping)
        const bots = allies.filter((h) => h.alive && h.hero!.bot && h.hp / h.stats.maxHp > 0.5).sort((a, b) => dist(a.x, a.y, c.def.x, c.def.y) - dist(b.x, b.y, c.def.x, c.def.y));
        const need = k === 'colossus' ? 3 : 2;
        const members = bots.slice(0, need).filter((h) => dist(h.x, h.y, c.def.x, c.def.y) < 38);
        if (members.length < Math.min(2, bots.length) || members.length === 0) continue;
        this.objective = { key: c.def.key, x: c.def.x, y: c.def.y, until: m.time + 32, members: members.map((h) => h.id) };
        this.nextObjectiveAt = m.time + 75;
        const human = allies.find((h) => !h.hero!.bot);
        if (human) m.emit({ e: 'ping', kind: 'objective', x: c.def.x, y: c.def.y, from: members[0].id, name: members[0].hero!.name }, { team: this.team });
        break;
      }
    }
    // base siege: once the enemy Crown Engine is vulnerable, every bot commits to it
    const eTeam = (1 - this.team) as Team;
    const engine = m.structures.get(`${eTeam}-engine`)!;
    this.siegeEngine = engine.alive && !m.structureInvulnerable(engine) && aliveA >= Math.max(1, aliveE) ? engine.id : 0;
    // late game: group in one lane to siege
    const lateGame = m.time > 11 * 60 || (aliveA - aliveE >= 2) || m.teamBuff(this.team, 'colossus') || (avgLevel - avgLevelE > 2);
    if (lateGame) {
      if (this.groupLane < 0 || m.time % 90 < 1.6) this.groupLane = this.weakestEnemyLane();
    } else this.groupLane = -1;
  }

  campAlive(key: string) { return this.m.camps.some((c) => c.def.key === key && c.alive.length > 0); }

  weakestEnemyLane(): number {
    const m = this.m, e = (1 - this.team) as Team;
    for (const lane of [0, 1]) if (!m.structures.get(`${e}-${lane}-seal`)!.alive) return lane;
    const score = [0, 1].map((lane) => {
      let s = 0;
      for (const t of ['outer', 'inner', 'guard', 'seal'] as const) if (m.structures.get(`${e}-${lane}-${t}`)?.alive) s += 1;
      return s;
    });
    return score[0] <= score[1] ? 0 : 1;
  }
}

const planners = new WeakMap<Match, TeamPlanner[]>();
export function plannerFor(m: Match, team: 0 | 1): TeamPlanner {
  let p = planners.get(m);
  if (!p) { p = [new TeamPlanner(m, 0), new TeamPlanner(m, 1)]; planners.set(m, p); }
  return p[team];
}

export class Bot {
  m: Match;
  u: Unit;
  team: 0 | 1;
  role: 'lane' | 'jungle';
  lane = 0;
  seq = 1;
  nextThink = 0;
  state: BotState = 'Shop';
  build: string[];
  diff: typeof DIFF.normal;
  lastGoal = { x: 0, y: 0, t: -99 };
  prevPos = new Map<number, { x: number; y: number; t: number }>();
  override: { kind: PingKind; x: number; y: number; until: number } | null = null;
  nextWardAt = 60;
  campTarget: string | null = null;
  recastAt = 0;
  lastStateChange = 0;

  constructor(m: Match, u: Unit) {
    this.m = m; this.u = u;
    this.team = u.team as 0 | 1;
    this.diff = DIFF[u.hero!.difficulty];
    const def = u.hero!.def;
    const mates = m.setup.players.filter((p) => p.team === this.team);
    const jungler = mates.find((p) => HEROES[p.hero].preferredRole === 'jungle' && p.bot) ?? (mates.length >= 3 ? mates.filter((p) => p.bot).slice(-1)[0] : undefined);
    const slotIdx = mates.findIndex((p) => p.slot === u.hero!.slot);
    this.role = jungler && jungler.slot === u.hero!.slot && mates.length >= 3 ? 'jungle' : 'lane';
    // lane assignment: human (if any) keeps their lane choice by position; bots fill remaining
    const laners = mates.filter((p) => !(jungler && jungler.slot === p.slot && mates.length >= 3));
    const li = laners.findIndex((p) => p.slot === u.hero!.slot);
    this.lane = li >= 0 ? (li + (this.team === 1 ? 1 : 0)) % 2 : slotIdx % 2;
    // conditional build graph: pick a path and swap defensive items by enemy damage profile
    const enemies = m.setup.players.filter((p) => p.team !== this.team).map((p) => HEROES[p.hero].damageProfile);
    const phys = enemies.filter((d) => d === 'physical').length, arc = enemies.filter((d) => d === 'arcane').length;
    const path = def.builds[(u.hero!.slot + Math.floor(m.rng.next() * 2)) % 2];
    let items = path.items.slice();
    if (phys >= 2 && path.vsPhysical && !items.includes(path.vsPhysical)) items[items.length - 1] = path.vsPhysical;
    if (arc >= 2 && path.vsArcane && !items.includes(path.vsArcane)) items[items.length - 1] = path.vsArcane;
    this.build = [...STARTERS[def.id], ...items];
  }

  get planner() { return plannerFor(this.m, this.team); }

  cmd(c: CommandBody) { this.m.command(this.u.hero!.slot, { ...c, seq: this.seq++ } as any); }

  onPing(kind: PingKind, x: number, y: number, _from: Unit) {
    if (kind === 'assist' || kind === 'omw' || kind === 'objective' || kind === 'defend') this.override = { kind, x, y, until: this.m.time + 14 };
    else if (kind === 'danger' || kind === 'missing') this.override = { kind, x, y, until: this.m.time + 6 };
  }

  moveTo(x: number, y: number, attackMove = false) {
    const m = this.m;
    const o = this.u.order;
    const moving = (o.type === 'move' || o.type === 'attackMove') && this.u.path;
    if (moving && dist(x, y, this.lastGoal.x, this.lastGoal.y) < 1.5 && m.time - this.lastGoal.t < 3) return;
    if (!moving && dist(this.u.x, this.u.y, x, y) < 0.8) return;
    this.lastGoal = { x, y, t: m.time };
    this.cmd({ t: 'move', x, y, attackMove });
  }
  attack(t: Unit) {
    if (this.u.order.type === 'attack' && this.u.order.target === t.id) return;
    this.cmd({ t: 'attack', target: t.id });
  }
  setState(s: BotState) { if (s !== this.state) { this.state = s; this.lastStateChange = this.m.time; } }

  visibleEnemies(r: number, filter?: (u: Unit) => boolean): Unit[] {
    return this.m.unitsInRadius(this.u.x, this.u.y, r, (t) => t.alive && t.team !== this.team && this.m.visibleTo(this.team, t) && t.kind !== 'ward' && (!filter || filter(t)));
  }

  predict(t: Unit, time: number): { x: number; y: number } {
    const p = this.prevPos.get(t.id);
    let vx = 0, vy = 0;
    if (p && this.m.time - p.t > 0.05 && this.m.time - p.t < 1) { vx = (t.x - p.x) / (this.m.time - p.t); vy = (t.y - p.y) / (this.m.time - p.t); }
    const e = this.diff.aim;
    const jx = (this.m.rng.next() - 0.5) * 2 * e, jy = (this.m.rng.next() - 0.5) * 2 * e;
    return { x: t.x + vx * time * this.diff.lead + jx, y: t.y + vy * time * this.diff.lead + jy };
  }

  update(_dt: number) {
    const m = this.m;
    if (m.time < this.nextThink) return;
    this.nextThink = m.time + this.diff.think * (0.85 + m.rng.next() * 0.3);
    this.planner.update();
    const u = this.u, h = u.hero!;
    // skills
    while (h.skillPoints > 0 && this.rankUp()) { /* rank as many as allowed */ }
    if (!u.alive) { this.setState('Dead'); this.shop(); return; }
    const inF = inFountain(this.team, u.x, u.y);
    if (inF) this.shop();
    if (u.cast || u.dash) return;
    if (h.recall) {
      if (this.visibleEnemies(9, (t) => t.kind === 'hero').length === 0) return;
    }
    const enemiesNear = this.visibleEnemies(14);
    const enemyHeroes = enemiesNear.filter((t) => t.kind === 'hero');
    for (const e of enemiesNear) this.prevPos.set(e.id, { x: e.x, y: e.y, t: m.time });
    const hpPct = u.hp / u.stats.maxHp;
    const manaPct = u.stats.maxMana > 0 ? u.mana / u.stats.maxMana : 1;

    // stay at fountain to heal
    if (inF && (hpPct < 0.9 || manaPct < 0.6)) { this.setState('Shop'); if (u.order.type !== 'idle') this.cmd({ t: 'stop' }); return; }

    const ctx: BotCtx = { bot: this, m, u, enemies: enemiesNear, enemyHeroes, allies: m.heroes.filter((a) => a.alive && a.team === this.team && a !== u && dist(a.x, a.y, u.x, u.y) < 14), mode: 'fight' };

    // --- danger / retreat
    const threat = this.threatScore(enemyHeroes);
    const underTower = this.enemyTowerThreat(u.x, u.y);
    if (underTower && this.towerTargetingMe()) {
      this.setState('AvoidThreat');
      this.retreat(ctx);
      return;
    }
    const lowHp = hpPct < 0.28 || (hpPct < 0.42 && threat > 1.2);
    if (lowHp && enemyHeroes.length) {
      this.setState('Retreat');
      ctx.mode = 'escape';
      botCast(ctx);
      this.retreat(ctx);
      return;
    }
    // --- recall
    const nextCost = this.nextItemCost();
    const wantShop = h.gold >= Math.max(900, nextCost) && m.time > 120;
    if (!inF && (hpPct < 0.38 || (manaPct < 0.12 && h.def.resource === 'mana') || (wantShop && hpPct < 0.75) || h.gold > 2600)) {
      if (enemyHeroes.length === 0 && this.visibleEnemies(7).length === 0) {
        this.setState('RecallBuy');
        if (!h.recall) this.cmd({ t: 'recall' });
        return;
      }
      if (hpPct < 0.38) { this.setState('Retreat'); this.retreat(ctx); return; }
    }

    // --- team fight
    if (enemyHeroes.length) {
      const target = this.pickHeroTarget(enemyHeroes);
      if (target && this.shouldFight(ctx, target, threat)) {
        this.setState('TeamFight');
        ctx.target = target;
        if (m.rng.next() < this.diff.castChance && botCast(ctx)) return;
        if (this.talents(ctx, target)) return;
        if (this.enemyTowerThreat(target.x, target.y) && target.hp / target.stats.maxHp > 0.15 && !this.alliedMinionsNear(target.x, target.y, 8)) {
          this.setState('ChaseLimited');
          this.laneBehavior(ctx);
          return;
        }
        this.attack(target);
        return;
      } else if (threat > 1.4 && hpPct < 0.7) {
        this.setState('Retreat');
        this.retreat(ctx);
        return;
      }
    }

    // --- commit to a vulnerable Crown Engine
    if (this.planner.siegeEngine && hpPct > 0.35) {
      const eng = m.byId.get(this.planner.siegeEngine);
      if (eng && eng.alive) {
        this.setState('Push');
        const defenders = this.visibleEnemies(9, (t) => t.kind === 'minion');
        if (defenders.length >= 3 && dist(u.x, u.y, eng.x, eng.y) < 12) { this.attack(defenders[0]); return; }
        this.attack(eng);
        return;
      }
    }
    // --- ping overrides from teammates
    if (this.override && this.override.until > m.time) {
      const o = this.override;
      if (o.kind === 'danger' || o.kind === 'missing') {
        if (dist(u.x, u.y, o.x, o.y) < 12) { this.retreat(ctx); return; }
      } else if (dist(u.x, u.y, o.x, o.y) > 6) {
        this.setState(o.kind === 'defend' ? 'Defend' : 'RotateObjective');
        this.moveTo(o.x, o.y, true);
        return;
      } else if (o.kind === 'objective') {
        const mon = this.visibleEnemies(10, (t) => t.kind === 'monster')[0];
        if (mon) { this.attack(mon); return; }
      }
    } else this.override = null;

    // --- neutral objective
    const obj = this.planner.objective;
    if (obj && obj.members.includes(u.id)) {
      this.setState('RotateObjective');
      const mon = this.visibleEnemies(12, (t) => t.kind === 'monster' && dist(t.monster!.homeX, t.monster!.homeY, obj.x, obj.y) < 4)[0];
      const alliesThere = m.heroes.filter((a) => a.alive && a.team === this.team && dist(a.x, a.y, obj.x, obj.y) < 13).length;
      if (mon && (alliesThere >= Math.min(2, obj.members.length) || (mon.monster!.kind.startsWith('catalyst') && h.level >= 6 && hpPct > 0.7) || mon.hp < mon.stats.maxHp * 0.98)) {
        ctx.target = mon; ctx.mode = 'farm';
        if (this.useReap(mon)) return;
        if (botCast(ctx)) return;
        this.attack(mon);
        return;
      }
      if (dist(u.x, u.y, obj.x, obj.y) > 6) { this.moveTo(obj.x, obj.y); return; }
      if (u.order.type !== 'idle') this.cmd({ t: 'stop' });
      return;
    }

    // --- defend structures under siege
    const defend = this.structureUnderSiege();
    if (defend && dist(u.x, u.y, defend.x, defend.y) < 45) {
      this.setState('Defend');
      const tgt = this.visibleEnemies(12, (t) => t.kind === 'minion')[0];
      if (dist(u.x, u.y, defend.x, defend.y) > 9) { this.moveTo(defend.x, defend.y, true); return; }
      if (tgt) { ctx.mode = 'farm'; ctx.target = tgt; if (manaPct > 0.5 && botCast(ctx)) return; this.attack(tgt); return; }
    }

    // --- wards
    if (m.time > this.nextWardAt && h.wardCharges > 0 && m.rng.next() < this.diff.ward) {
      const spot = this.wardSpot();
      if (spot && dist(u.x, u.y, spot.x, spot.y) < 6) {
        this.setState('Ward');
        this.cmd({ t: 'ward', x: spot.x, y: spot.y });
        this.nextWardAt = m.time + 45 + m.rng.next() * 30;
        return;
      }
    }

    if (this.role === 'jungle' && this.planner.groupLane < 0 && h.level < 8) { this.jungleBehavior(ctx); return; }
    if (this.role === 'jungle' && m.time < R.CAMP_FIRST_SPAWN + 2) { this.jungleBehavior(ctx); return; }
    this.laneBehavior(ctx);
  }

  rankUp(): boolean {
    const h = this.u.hero!;
    const slots = ['Q', 'W', 'E', 'R'] as const;
    if (R.rankAllowed('R', h.ranks[3], h.level)) { const b = h.skillPoints; this.cmd({ t: 'rank', slot: 3 }); return h.skillPoints < b; }
    const order = h.def.skillOrder;
    const seq = [order[0], order[1], order[2], order[0], order[0], order[1], order[0], order[1], order[1], order[2], order[2], order[2]];
    for (const s of seq) {
      const i = slots.indexOf(s as any);
      if (R.rankAllowed(s as any, h.ranks[i], h.level)) {
        const before = h.skillPoints;
        this.cmd({ t: 'rank', slot: i });
        return h.skillPoints < before;
      }
    }
    return false;
  }

  nextItemCost(): number {
    const h = this.u.hero!;
    const owned = h.items.map((s) => (s ? s.id : ''));
    for (const id of this.build) {
      if (owned.includes(id) || (ITEMS[id].category === 'consumable')) continue;
      return purchasePlan(id, owned).cost;
    }
    return 99999;
  }

  shop() {
    const h = this.u.hero!;
    for (let guard = 0; guard < 8; guard++) {
      const owned = h.items.map((s) => (s ? s.id : ''));
      let bought = false;
      for (const id of this.build) {
        const def = ITEMS[id];
        if (def.category === 'consumable') {
          const s = h.items.find((x) => x && x.id === id);
          if (this.m.time < 600 && (!s || s.count < 2) && h.gold >= def.cost + 0 && h.items.some((x) => !x || x.id === id) && !(this.m.time > 60 && s)) {
            const before = h.gold;
            this.cmd({ t: 'buy', item: id });
            if (h.gold < before) { bought = true; break; }
          }
          continue;
        }
        if (owned.includes(id)) continue;
        if (def.category === 'starter' && (this.m.time > 240 || h.items.some((x) => x && ITEMS[x.id].category === 'completed'))) continue;
        // sell the starter / consumables to free space
        if (!h.items.includes(null) && def.category !== 'starter') {
          const st = h.items.findIndex((x) => x && (ITEMS[x.id].category === 'starter' || ITEMS[x.id].category === 'consumable'));
          if (st >= 0) this.cmd({ t: 'sell', slot: st });
        }
        const plan = purchasePlan(id, owned);
        if (h.gold >= plan.cost) {
          const before = h.gold;
          this.cmd({ t: 'buy', item: id });
          bought = h.gold < before;
        } else {
          // buy an affordable component on the way (conditional branch of the build graph)
          for (const c of def.from) {
            const ownedCount = owned.filter((o) => o === c).length;
            const needed = def.from.filter((x) => x === c).length;
            if (ownedCount >= needed) continue;
            if (h.gold >= ITEMS[c].cost && h.items.includes(null)) { const before = h.gold; this.cmd({ t: 'buy', item: c }); bought = h.gold < before; break; }
          }
        }
        break;
      }
      if (!bought) break;
    }
  }

  threatScore(enemyHeroes: Unit[]): number {
    const u = this.u;
    let e = 0, a = 0;
    for (const t of enemyHeroes) if (dist(t.x, t.y, u.x, u.y) < 12) e += (t.hp / t.stats.maxHp) * (0.6 + t.hero!.level / 10);
    for (const t of this.m.heroes) if (t.alive && t.team === this.team && dist(t.x, t.y, u.x, u.y) < 12) a += (t.hp / t.stats.maxHp) * (0.6 + t.hero!.level / 10);
    if (this.alliedTowerNear(u.x, u.y)) a += 0.8;
    if (this.enemyTowerThreat(u.x, u.y)) e += 0.8;
    return a > 0 ? e / a : e * 2;
  }

  shouldFight(ctx: BotCtx, target: Unit, threat: number): boolean {
    const u = this.u;
    const hp = u.hp / u.stats.maxHp;
    const thp = target.hp / target.stats.maxHp;
    if (thp < 0.25 && hp > 0.3) return true;
    if (this.role === 'lane' && this.m.time < 180 && dist(u.x, u.y, target.x, target.y) > u.stats.range + 2 && thp > 0.5) return false; // early: trade only in range
    if (threat < 0.9 && hp > 0.45) return true;
    if (threat < 1.25 && hp > 0.6 && thp < hp) return true;
    return false;
  }

  pickHeroTarget(heroes: Unit[]): Unit | null {
    let best: Unit | null = null, bs = Infinity;
    for (const t of heroes) {
      if (t.untargetable) continue;
      const d = dist(this.u.x, this.u.y, t.x, t.y);
      const eff = t.hp * damageMultiplier(t.stats.armor) * 0.01 + d * 1.5;
      if (eff < bs) { bs = eff; best = t; }
    }
    return best;
  }

  talents(ctx: BotCtx, target: Unit): boolean {
    const h = this.u.hero!;
    for (let i = 0; i < 2; i++) {
      if (h.talentCds[i] > 0) continue;
      const id = h.talents[i];
      const d = dist(this.u.x, this.u.y, target.x, target.y);
      if (id === 'scorch' && d < 6 && target.hp / target.stats.maxHp < 0.5) { this.cmd({ t: 'talent', slot: i, target: target.id }); return true; }
      if (id === 'bulwark' && this.u.hp / this.u.stats.maxHp < 0.5) { this.cmd({ t: 'talent', slot: i }); return true; }
      if (id === 'mend' && this.u.hp / this.u.stats.maxHp < 0.45) { this.cmd({ t: 'talent', slot: i }); return true; }
      if (id === 'phase' && target.hp / target.stats.maxHp < 0.2 && d > this.u.stats.range + 1 && d < 7) { this.cmd({ t: 'talent', slot: i, x: target.x, y: target.y }); return true; }
      if (id === 'rush' && target.hp / target.stats.maxHp < 0.3 && d > 4) { this.cmd({ t: 'talent', slot: i }); return true; }
    }
    return false;
  }

  useReap(mon: Unit): boolean {
    const h = this.u.hero!;
    const i = h.talents.indexOf('reap');
    if (i < 0 || h.talentCds[i] > 0) return false;
    const big = mon.monster && (mon.monster.kind.startsWith('buff') || mon.monster.kind.startsWith('catalyst') || mon.monster.kind === 'colossus');
    if (!big && this.role !== 'jungle') return false;
    if (mon.hp <= 400 + 25 * h.level && dist(this.u.x, this.u.y, mon.x, mon.y) < 6) { this.cmd({ t: 'talent', slot: i, target: mon.id }); return true; }
    return false;
  }

  retreat(ctx: BotCtx) {
    const u = this.u;
    for (let i = 0; i < 2; i++) {
      const id = u.hero!.talents[i];
      if (u.hero!.talentCds[i] > 0) continue;
      if ((id === 'rush' || id === 'bulwark' || id === 'mend') && u.hp / u.stats.maxHp < 0.35 && ctx.enemyHeroes.length) { this.cmd({ t: 'talent', slot: i }); return; }
      if (id === 'phase' && u.hp / u.stats.maxHp < 0.2 && ctx.enemyHeroes.some((e) => dist(e.x, e.y, u.x, u.y) < 4)) {
        const f = FOUNTAIN[this.team]; const dx = f.x - u.x, dy = f.y - u.y, l = Math.hypot(dx, dy) || 1;
        this.cmd({ t: 'talent', slot: i, x: u.x + (dx / l) * 4.5, y: u.y + (dy / l) * 4.5 }); return;
      }
    }
    const safe = this.safePoint();
    this.moveTo(safe.x, safe.y);
  }

  safePoint(): { x: number; y: number } {
    const u = this.u;
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (const s of this.m.structures.values()) {
      if (!s.alive || s.team !== this.team || (s.kind !== 'tower' && s.kind !== 'core')) continue;
      const toward = dist(s.x, s.y, FOUNTAIN[this.team].x, FOUNTAIN[this.team].y) < dist(u.x, u.y, FOUNTAIN[this.team].x, FOUNTAIN[this.team].y) + 2;
      if (!toward) continue;
      const d = dist(u.x, u.y, s.x, s.y);
      if (d < 4) continue;
      if (d < bd) { bd = d; best = { x: s.x + (this.team === 0 ? -2.5 : 2.5), y: s.y }; }
    }
    return best ?? FOUNTAIN[this.team];
  }

  enemyTowerThreat(x: number, y: number): Unit | null {
    for (const s of this.m.structures.values()) {
      if (!s.alive || s.team === this.team || (s.kind !== 'tower' && s.kind !== 'core' && s.kind !== 'fountain')) continue;
      if (dist(x, y, s.x, s.y) <= s.stats.range + 1.2) return s;
    }
    return null;
  }
  towerTargetingMe(): boolean {
    for (const s of this.m.structures.values()) if (s.alive && s.team !== this.team && s.structure!.target === this.u.id) return true;
    const t = this.enemyTowerThreat(this.u.x, this.u.y);
    if (t && this.alliedMinionsNear(t.x, t.y, t.stats.range) < 1) return true;
    return false;
  }
  alliedTowerNear(x: number, y: number): boolean {
    for (const s of this.m.structures.values()) if (s.alive && s.team === this.team && (s.kind === 'tower' || s.kind === 'core') && dist(x, y, s.x, s.y) < 9) return true;
    return false;
  }
  alliedMinionsNear(x: number, y: number, r: number): number {
    return this.m.unitsInRadius(x, y, r, (t) => t.kind === 'minion' && t.team === this.team).length;
  }

  structureUnderSiege(): Unit | null {
    for (const s of this.m.structures.values()) {
      if (!s.alive || s.team !== this.team || s.kind === 'fountain') continue;
      const attackers = this.m.unitsInRadius(s.x, s.y, 10, (t) => t.team !== this.team && t.team !== 2 && (t.kind === 'minion' || t.kind === 'hero') && this.m.visibleTo(this.team, t));
      if (attackers.length >= 3 && s.hp < s.stats.maxHp * 0.95) return s;
    }
    return null;
  }

  wardSpot(): { x: number; y: number } | null {
    const u = this.u;
    let best: { x: number; y: number } | null = null, bd = 20;
    for (const b of BRUSHES) {
      const d = dist(u.x, u.y, b.x, b.y);
      const ownSide = this.team === 0 ? b.x < 15 : b.x > -15;
      if (!ownSide) continue;
      if (this.m.units.some((w) => w.alive && w.kind === 'ward' && w.team === this.team && dist(w.x, w.y, b.x, b.y) < 6)) continue;
      if (d < bd) { bd = d; best = { x: b.x, y: b.y }; }
    }
    return best;
  }

  /** Lane / LastHit / Harass / Push behaviour. */
  laneBehavior(ctx: BotCtx) {
    const m = this.m, u = this.u, h = u.hero!;
    const lane = this.planner.groupLane >= 0 ? this.planner.groupLane : this.lane;
    const pts = LANES[lane];
    const dir = this.team === 0 ? 1 : -1;
    // frontmost allied minion of this lane
    let front: Unit | null = null, fp = -1;
    for (const t of m.units) {
      if (!t.alive || t.kind !== 'minion' || t.team !== this.team || t.minion!.lane !== lane) continue;
      const prog = this.team === 0 ? t.minion!.wp : pts.length - 1 - t.minion!.wp;
      if (prog > fp) { fp = prog; front = t; }
    }
    // last hit / push targets near us
    const minions = this.visibleEnemies(u.stats.range + 4, (t) => t.kind === 'minion' || t.kind === 'wall');
    const myHit = u.stats.ad;
    let lastHit: Unit | null = null;
    for (const t of minions) {
      if (t.kind !== 'minion') continue;
      const dmg = myHit * damageMultiplier(t.stats.armor) * this.diff.lastHit;
      if (t.hp <= dmg + 4 && (!lastHit || t.hp < lastHit.hp)) lastHit = t;
    }
    if (lastHit && !this.enemyTowerThreatFor(lastHit)) { this.setState('LastHit'); this.attack(lastHit); return; }
    const enemyHeroClose = ctx.enemyHeroes.find((t) => dist(t.x, t.y, u.x, u.y) < 10);
    // harass if trade is favorable
    if (enemyHeroClose && u.hp / u.stats.maxHp > 0.55 && !this.enemyTowerThreat(enemyHeroClose.x, enemyHeroClose.y)) {
      ctx.target = enemyHeroClose;
      if (u.mana / Math.max(1, u.stats.maxMana) > 0.45 && m.rng.next() < this.diff.castChance * 0.5 && botCast(ctx)) { this.setState('Harass'); return; }
      if (dist(u.x, u.y, enemyHeroClose.x, enemyHeroClose.y) <= u.stats.range + 1 && m.rng.next() < 0.3) { this.setState('Harass'); this.attack(enemyHeroClose); return; }
    }
    // structure push when minions tank
    const st = this.attackableStructure();
    if (st) { this.setState('Push'); this.attack(st); return; }
    // push when no enemy hero contests
    if (!enemyHeroClose && minions.length) {
      const t = minions.sort((a, b) => a.hp - b.hp)[0];
      if (!this.enemyTowerThreatFor(t)) {
        this.setState('Push');
        ctx.target = t; ctx.mode = 'farm';
        if (minions.length >= 3 && u.mana / Math.max(1, u.stats.maxMana) > 0.6 && h.level >= 4 && m.rng.next() < 0.25 && botCast(ctx)) return;
        this.attack(t);
        return;
      }
    }
    // position behind the front minion or at our outermost tower
    this.setState('Lane');
    let goal: { x: number; y: number };
    if (front) {
      const back = Math.max(0, Math.min(pts.length - 1, front.minion!.wp - dir * (u.ranged ? 4 : 2)));
      goal = pts[back];
    } else {
      goal = this.outermostTower(lane);
    }
    const tower = this.enemyTowerThreat(goal.x, goal.y);
    if (tower && !this.alliedMinionsNear(tower.x, tower.y, tower.stats.range)) goal = this.outermostTower(lane);
    if (dist(u.x, u.y, goal.x, goal.y) > 2.5) this.moveTo(goal.x + (m.rng.next() - 0.5), goal.y + (m.rng.next() - 0.5));
    else if (minions.length && u.order.type !== 'attack') { const t = minions[0]; if (!this.enemyTowerThreatFor(t)) this.attack(t); }
  }

  enemyTowerThreatFor(t: Unit): boolean {
    const tw = this.enemyTowerThreat(t.x, t.y);
    if (!tw) return false;
    // safe if tower is busy with our minions
    const tt = this.m.byId.get(tw.structure!.target);
    if (tt && tt.kind === 'minion' && this.alliedMinionsNear(tw.x, tw.y, tw.stats.range) >= 2) return false;
    return true;
  }

  attackableStructure(): Unit | null {
    const u = this.u;
    for (const s of this.m.structures.values()) {
      if (!s.alive || s.team === this.team || s.kind === 'fountain') continue;
      if (dist(u.x, u.y, s.x, s.y) > 13) continue;
      if (this.m.structureInvulnerable(s)) continue;
      const shoots = s.kind === 'tower' || s.kind === 'core';
      const minionsTank = this.alliedMinionsNear(s.x, s.y, s.stats.range || 8) >= 2;
      const enemyHeroesNear = this.visibleEnemies(12, (t) => t.kind === 'hero').length;
      if (!shoots || (minionsTank && s.structure!.target !== u.id) || (u.hp / u.stats.maxHp > 0.8 && enemyHeroesNear === 0 && this.m.heroes.filter((a) => a.alive && a.team === this.team && dist(a.x, a.y, s.x, s.y) < 10).length >= 3)) return s;
    }
    return null;
  }

  outermostTower(lane: number): { x: number; y: number } {
    for (const tier of ['outer', 'inner', 'guard', 'core'] as const) {
      const s = this.m.structures.get(`${this.team}-${lane}-${tier}`);
      if (s && s.alive) {
        const back = this.team === 0 ? -2.5 : 2.5;
        return { x: s.x + back, y: s.y };
      }
    }
    return FOUNTAIN[this.team];
  }

  jungleBehavior(ctx: BotCtx) {
    const m = this.m, u = this.u;
    // gank: visible enemy hero in a lane near us, low-ish and with an ally nearby
    const gankT = m.units.find((t) => t.alive && t.kind === 'hero' && t.team !== this.team && m.visibleTo(this.team, t) && dist(t.x, t.y, u.x, u.y) < 28 && t.hp / t.stats.maxHp < 0.65 && laneDistance(t.x, t.y).d < 7 && !this.enemyTowerThreat(t.x, t.y) && m.heroes.some((a) => a.alive && a.team === this.team && a !== u && dist(a.x, a.y, t.x, t.y) < 12));
    if (gankT && u.hp / u.stats.maxHp > 0.5 && u.hero!.level >= 3) {
      this.setState('Gank');
      ctx.target = gankT;
      if (dist(u.x, u.y, gankT.x, gankT.y) < 8 && botCast(ctx)) return;
      this.attack(gankT);
      return;
    }
    // camps on our side, nearest alive
    const camps = m.camps.filter((c) => c.def.side === this.team && c.alive.length > 0);
    if (!camps.length && m.time < R.CAMP_FIRST_SPAWN + 2) {
      const first = m.camps.find((c) => c.def.side === this.team && c.def.kind === 'cogmites')!;
      this.setState('JungleCamp');
      this.moveTo(first.def.x + (this.team === 0 ? -3 : 3), first.def.y);
      return;
    }
    if (!camps.length) {
      // no camps up: help the lane with the most pressure
      this.lane = this.lane === 0 ? 1 : 0;
      if (m.rng.next() < 0.02) this.lane = 1 - this.lane;
      this.laneBehavior(ctx);
      return;
    }
    camps.sort((a, b) => dist(u.x, u.y, a.def.x, a.def.y) - dist(u.x, u.y, b.def.x, b.def.y));
    const c = camps[0];
    this.setState('JungleCamp');
    const mons = this.visibleEnemies(10, (t) => t.kind === 'monster' && t.monster!.camp === c.def.key).sort((a, b) => a.hp - b.hp);
    if (mons.length && dist(u.x, u.y, c.def.x, c.def.y) < 10) {
      const t = mons[0];
      ctx.target = t; ctx.mode = 'farm';
      if (this.useReap(t)) return;
      if (u.mana / Math.max(1, u.stats.maxMana) > 0.3 && botCast(ctx)) return;
      this.attack(t);
      return;
    }
    this.moveTo(c.def.x, c.def.y);
  }
}

export const BOT_NAMES = ['Wren', 'Tamsin', 'Oriel', 'Bram', 'Cass', 'Lio', 'Marrow', 'Pell', 'Quill', 'Sable', 'Teo', 'Vesper', 'Juno', 'Ash', 'Rook', 'Ember', 'Fenn', 'Hollis'];
void clamp; void CAMPS;
