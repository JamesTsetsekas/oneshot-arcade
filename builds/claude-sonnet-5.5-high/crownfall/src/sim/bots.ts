/**
 * Server-side hero bots. They obey the same rules and information as players:
 * they only see what their team sees (Sim.canSee) and act exclusively through Sim.command().
 */
import { HERO_BY_ID, ITEM_BY_ID, DT } from '../shared/content';
import { dist, clamp, norm } from '../shared/math';
import { BRUSH, TEAM_BASE, laneFor, CAMPS } from '../shared/map';
import type { Sim } from './sim';
import type { Unit, Team } from './types';
import { quote } from './items';

type State = 'Lane' | 'Retreat' | 'RecallBuy' | 'Fight' | 'Jungle' | 'Gank' | 'Group' | 'Objective' | 'Defend';
interface Brain {
  role: 'lane' | 'jungle' | 'support'; lane: number; partner: number; state: State; goals: string[]; ward: number; lastRecall: number;
  think: number; lastGoto: { x: number; z: number }; campIdx: number; lastBuyCheck: number; objUntil: number; talentTick: number; lastAb: number;
}
interface TeamPlan { mode: 'lane' | 'group'; lane: number; boss: string | null; nextEval: number }

const WARD_SPOTS = [
  { x: -3, z: -25 }, { x: 3, z: 25 }, { x: -9, z: -28 }, { x: 9, z: 28 }, { x: 0, z: -14.5 }, { x: 0, z: 14.5 }, { x: -24, z: -31 }, { x: 24, z: 31 },
];

export class BotManager {
  brains = new Map<number, Brain>();
  plans: TeamPlan[] = [
    { mode: 'lane', lane: 0, boss: null, nextEval: 0 },
    { mode: 'lane', lane: 0, boss: null, nextEval: 0 },
  ];
  constructor(private sim: Sim) {
    this.assignRoles();
  }

  goalsFor(heroId: string): string[] {
    const d = HERO_BY_ID[heroId];
    const b = d.builds[this.sim.rng.int(0, d.builds.length - 1)].items;
    return b.filter((id, i) => {
      const def = ITEM_BY_ID[id];
      if (def.tier !== 'component') return true;
      if (id === 'swiftsole') return !b.slice(i + 1).some((o) => ITEM_BY_ID[o].from?.includes('swiftsole'));
      return false;
    });
  }

  private assignRoles() {
    const sim = this.sim;
    for (const team of [0, 1] as const) {
      const members = sim.heroes.filter((h) => h.team === team);
      const bots = members.filter((h) => h.hero!.controller === 'bot');
      const hasPlayer = members.some((h) => h.hero!.controller === 'player');
      const jungler = [...bots].sort((a, b) => HERO_BY_ID[b.hero!.heroId].jungle - HERO_BY_ID[a.hero!.heroId].jungle)[0];
      const useJungler = jungler && HERO_BY_ID[jungler.hero!.heroId].jungle >= 3 && members.length >= 3;
      let laneCursor = hasPlayer ? 1 : 0;
      const laners = bots.filter((b) => !(useJungler && b === jungler));
      laners.sort((a, b) => (HERO_BY_ID[a.hero!.heroId].role === 'Support' ? 1 : 0) - (HERO_BY_ID[b.hero!.heroId].role === 'Support' ? 1 : 0));
      const byLane: Unit[][] = [[], []];
      for (const b of laners) {
        let lane = laneCursor;
        if (hasPlayer) lane = 1;
        else lane = byLane[0].length <= byLane[1].length ? 0 : 1;
        byLane[lane].push(b);
        laneCursor = 1 - laneCursor;
      }
      for (const b of bots) {
        const isJ = useJungler && b === jungler;
        const lane = isJ ? 0 : byLane[0].includes(b) ? 0 : 1;
        const mates = isJ ? [] : byLane[lane].filter((o) => o !== b);
        const isSupport = HERO_BY_ID[b.hero!.heroId].role === 'Support' && (mates.length > 0 || (hasPlayer && lane === 1));
        const partner = isSupport ? (mates.find((m) => HERO_BY_ID[m.hero!.heroId].role !== 'Support')?.id ?? 0) : 0;
        this.brains.set(b.id, {
          role: isJ ? 'jungle' : isSupport ? 'support' : 'lane', lane, partner, state: 'Lane', goals: this.goalsFor(b.hero!.heroId), ward: 0, lastRecall: 0,
          think: 0, lastGoto: { x: 0, z: 0 }, campIdx: 0, lastBuyCheck: 0, objUntil: 0, talentTick: 0, lastAb: 0,
        });
      }
    }
  }

  /** the lane a human teammate would be expected to take (for UI hints) */
  laneAssignments() {
    return [...this.brains.entries()].map(([id, b]) => ({ id, role: b.role, lane: b.lane }));
  }

  update() {
    const sim = this.sim;
    if (sim.winner >= 0) return;
    const interval = sim.cfg.difficulty === 'easy' ? 10 : sim.cfg.difficulty === 'hard' ? 4 : 6;
    for (const team of [0, 1] as const) this.planTeam(team);
    for (const h of sim.heroes) {
      const b = this.brains.get(h.id);
      if (!b || h.hero!.controller !== 'bot') continue;
      if (h.dead) continue;
      if ((sim.tick + b.think) % interval !== 0) continue;
      this.think(h, b);
    }
  }

  // ------------------------------------------------------------ team plan
  private planTeam(team: Team) {
    const sim = this.sim;
    const p = this.plans[team];
    if (sim.time < p.nextEval) return;
    p.nextEval = sim.time + 6;
    const passive = sim.cfg.enemyPassive && team === 1;
    const groupAt = sim.cfg.difficulty === 'hard' ? 210 : sim.cfg.difficulty === 'easy' ? 480 : 270;
    p.mode = !passive && sim.time >= groupAt ? 'group' : 'lane';
    // choose lane: the one where we are furthest ahead (fewest enemy structures), prefer the one with Seal already down
    const enemy = (1 - team) as 0 | 1;
    let best = 0, bs = -1e9;
    for (let lane = 0; lane < 2; lane++) {
      const pre = enemy === 0 ? 'b' : 'r';
      let alive = 0;
      for (const t of ['outer', 'inner', 'guard', 'seal']) { const s = this.sim.rules.structures.get(`${pre}-${t}-${lane}`); if (s && !s.dead) alive++; }
      let sc = -alive * 10;
      if (sim.teams[enemy].sealDown[lane]) sc += 40;
      sc += lane === 0 ? 0.1 : 0;
      if (sc > bs) { bs = sc; best = lane; }
    }
    p.lane = best;
    // boss objective when it is alive and our heroes are alive
    p.boss = null;
    if (p.mode === 'group') {
      const alive = sim.units.filter((u) => u.kind === 'monster' && !u.dead && u.camp && (u.camp.kind === 'colossus' || u.camp.kind === 'catalyst'));
      const myHeroes = sim.heroes.filter((h) => h.team === team && !h.dead);
      const colossus = alive.find((u) => u.camp!.kind === 'colossus');
      if (colossus && myHeroes.length >= 2 && !this.sim.teams[team].structuresLost) p.boss = 'colossus';
      else if (colossus && myHeroes.length >= 2 && sim.time > 700) p.boss = 'colossus';
    }
  }

  // ------------------------------------------------------------ helpers
  private cmdMove(h: Unit, x: number, z: number, b: Brain) {
    const o = h.order;
    if (o.t === 'move' && dist(o.x, o.z, x, z) < 2.5) return;
    this.sim.command({ slot: h.hero!.slot, c: 'move', x, z });
    b.lastGoto = { x, z };
  }
  private cmdAttack(h: Unit, t: Unit) {
    if (h.order.t === 'attack' && h.order.target === t.id) return;
    this.sim.command({ slot: h.hero!.slot, c: 'attack', target: t.id });
  }
  private visibleEnemyHeroes(h: Unit, range: number): Unit[] {
    const sim = this.sim;
    return sim.heroes.filter((e) => !e.dead && e.team !== h.team && sim.canSee(h.team, e) && dist(h.x, h.z, e.x, e.z) <= range);
  }
  private power(u: Unit): number {
    return (u.hp / u.maxHp) * (u.hero!.level * 10 + u.ad * 0.4 + u.ap * 0.4 + u.maxHp * 0.03);
  }
  private nearestOwnTower(h: Unit): Unit | null {
    let best: Unit | null = null, bd = 1e9;
    for (const s of this.sim.rules.structures.values()) {
      if (s.dead || s.team !== h.team || (s.kind !== 'tower' && s.kind !== 'core')) continue;
      const d = dist(h.x, h.z, s.x, s.z);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  private enemyTowerThreat(h: Unit): boolean {
    for (const s of this.sim.rules.structures.values()) {
      if (s.dead || s.team === h.team || (s.kind !== 'tower' && s.kind !== 'core')) continue;
      if (dist(h.x, h.z, s.x, s.z) < s.range + 1.5) {
        // a tower is only safe if allied minions are absorbing fire
        let cover = 0;
        for (const u of this.sim.units) if (u.kind === 'minion' && u.team === h.team && !u.dead && dist(u.x, u.z, s.x, s.z) < s.range) cover++;
        if (cover < 2 || h.hero!.aggroUntil[1 - h.team as 0 | 1] > this.sim.time) return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------ main brain
  private think(h: Unit, b: Brain) {
    const sim = this.sim;
    const hs = h.hero!;
    const now = sim.time;
    const diff = sim.cfg.difficulty;
    const passive = !!sim.cfg.enemyPassive && h.team === 1;
    // skills
    while (hs.skillPts > 0) {
      const order = [3, 0, 1, 2];
      let spent = false;
      for (const s of order) {
        const before = hs.skillPts;
        sim.command({ slot: hs.slot, c: 'rank', ab: s });
        if (hs.skillPts < before) { spent = true; break; }
      }
      if (!spent) break;
    }
    if (hs.recallStart > 0) {
      // keep channeling unless an enemy shows up
      if (this.visibleEnemyHeroes(h, 11).length === 0) return;
    }
    const inShop = sim.inShop(h);
    if (inShop) this.shop(h, b);
    const hpf = h.hp / h.maxHp;
    const enemies = this.visibleEnemyHeroes(h, 14);
    const allies = sim.heroes.filter((a) => !a.dead && a.team === h.team && a.id !== h.id && dist(a.x, a.z, h.x, h.z) < 14);
    const myP = this.power(h) + allies.reduce((s, a) => s + this.power(a), 0);
    const thP = enemies.reduce((s, e) => s + this.power(e), 0);
    const nextCost = this.nextGoalCost(h, b);
    const fountain = TEAM_BASE[h.team as 0 | 1].fountain;

    // talents
    if (now - b.talentTick > 0.5) {
      b.talentTick = now;
      for (let i = 0; i < 2; i++) {
        const id = hs.talents[i];
        if (hs.talentCds[i] > now) continue;
        if (id === 'mend' && hpf < 0.4 && enemies.length) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: h.x, z: h.z });
        else if (id === 'aegis' && enemies.length && hpf < 0.7) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: h.x, z: h.z });
        else if (id === 'sprint' && hpf < 0.35 && enemies.length) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: h.x, z: h.z });
        else if (id === 'cinder' && enemies.length && enemies.some((e) => e.hp / e.maxHp < 0.6 && dist(e.x, e.z, h.x, h.z) < 6)) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: h.x, z: h.z });
        else if (id === 'purify' && (sim.has(h, 'stun') || sim.has(h, 'root')) && enemies.length) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: h.x, z: h.z });
        else if (id === 'skyhop' && hpf < 0.3 && enemies.length) sim.command({ slot: hs.slot, c: 'talent', idx: i, x: fountain.x, z: fountain.z });
      }
    }

    // ---- retreat / recall
    const lowHp = hpf < 0.3 || (hpf < 0.45 && thP > myP);
    if (lowHp && !passive) {
      b.state = 'Retreat';
      if (enemies.length === 0 && dist(h.x, h.z, fountain.x, fountain.z) > 22 && now - h.lastDamagedAt > 2.5 && hs.recallStart === 0) {
        sim.command({ slot: hs.slot, c: 'recall' });
        return;
      }
      if (!inShop) { this.cmdMove(h, fountain.x, fountain.z, b); this.retreatSkills(h, enemies); }
      return;
    }
    if (b.state === 'Retreat') {
      if (hpf < 0.8 && inShop) { if (hs.recallStart > 0) return; return; }
      if (hpf >= 0.8 || !inShop) b.state = 'Lane';
    }
    if (nextCost > 0 && hs.gold >= nextCost && !inShop && enemies.length === 0 && now - b.lastRecall > 45 && now - h.lastDamagedAt > 3 && hs.recallStart === 0 && dist(h.x, h.z, fountain.x, fountain.z) > 16) {
      b.lastRecall = now;
      b.state = 'RecallBuy';
      sim.command({ slot: hs.slot, c: 'recall' });
      return;
    }
    if (inShop && (hpf < 0.9 || (nextCost > 0 && hs.gold >= nextCost))) { if (now - hs.respawnAt < 40 && hpf >= 0.9) { /* fresh spawn: go */ } else if (hpf < 0.9) { this.cmdMove(h, fountain.x + 1, fountain.z, b); return; } }

    // ---- fight
    const engaged = enemies.filter((e) => dist(h.x, h.z, e.x, e.z) < (h.range + 6));
    const fightOk = engaged.length > 0 && myP >= thP * 0.6 && !this.enemyTowerThreat(h);
    if (fightOk && !passive) {
      b.state = 'Fight';
      // focus: lowest effective health in attack range, else closest
      let tgt = engaged[0], ts = 1e9;
      for (const e of engaged) { const s = e.hp + dist(h.x, h.z, e.x, e.z) * 25; if (s < ts) { ts = s; tgt = e; } }
      const d = dist(h.x, h.z, tgt.x, tgt.z);
      if (b.role === 'support' && HERO_BY_ID[hs.heroId].role === 'Support' && allies.length === 0 && hpf < 0.6) { /* fall through to retreat logic next think */ }
      this.useAbilities(h, tgt, enemies, allies);
      if (d > h.range + tgt.radius + 0.3 && HERO_BY_ID[hs.heroId].range > 4 && d < h.range + 2.5) this.cmdAttack(h, tgt);
      else this.cmdAttack(h, tgt);
      return;
    }
    if (passive) { this.laneBehavior(h, b, enemies, allies, true); return; }

    // ---- defend own structures
    if (!passive) {
      for (const s of sim.rules.structures.values()) {
        if (s.dead || s.team !== h.team || now - s.lastDamagedAt > 3) continue;
        const foe = sim.heroes.find((e) => !e.dead && e.team !== h.team && sim.canSee(h.team, e) && dist(e.x, e.z, s.x, s.z) < 16);
        if (foe && dist(h.x, h.z, s.x, s.z) < 55 && (enemies.length === 0 || fightOk)) {
          b.state = 'Defend';
          if (dist(h.x, h.z, foe.x, foe.z) < 12) { this.useAbilities(h, foe, enemies, allies); this.cmdAttack(h, foe); }
          else this.cmdMove(h, foe.x, foe.z, b);
          return;
        }
      }
    }
    // ---- role behaviors
    const plan = this.plans[h.team as 0 | 1];
    if (plan.mode === 'group' && b.role !== 'jungle' || (plan.mode === 'group' && now > 660)) {
      if (plan.boss === 'colossus') {
        const boss = sim.units.find((u) => u.kind === 'monster' && !u.dead && u.camp?.kind === 'colossus');
        if (boss) { this.objectiveBehavior(h, b, boss, enemies); return; }
      }
      b.state = 'Group';
      this.laneBehavior(h, b, enemies, allies, false, plan.lane);
      return;
    }
    if (b.role === 'jungle') { this.jungleBehavior(h, b, enemies); return; }
    this.laneBehavior(h, b, enemies, allies, false);
    void diff; void DT; void clamp; void norm; void CAMPS;
  }

  private objectiveBehavior(h: Unit, b: Brain, boss: Unit, enemies: Unit[]) {
    const sim = this.sim;
    b.state = 'Objective';
    const mates = sim.heroes.filter((a) => !a.dead && a.team === h.team && dist(a.x, a.z, boss.x, boss.z) < 14);
    if (enemies.length > mates.length) { this.cmdMove(h, TEAM_BASE[h.team as 0 | 1].spawn.x * 0.5, TEAM_BASE[h.team as 0 | 1].spawn.z * 0.5, b); return; }
    if (dist(h.x, h.z, boss.x, boss.z) > 9 && mates.length < 2) {
      // gather at the entrance on our side
      const gx = h.team === 0 ? -11 : 11;
      this.cmdMove(h, gx, 0, b);
      return;
    }
    this.useAbilities(h, boss, enemies, mates);
    this.cmdAttack(h, boss);
  }

  private nextGoalCost(h: Unit, b: Brain): number {
    const hs = h.hero!;
    for (const id of b.goals) {
      const q = quote(hs, id);
      if (!q.ok && q.reason === 'Already owned') continue;
      if (!q.ok) continue;
      // the cheapest missing component also counts as a trip reason
      return Math.min(q.cost, this.cheapestMissing(h, id) || q.cost);
    }
    return hs.items.filter((s) => s && s.id === 'draught').length < 2 ? 70 : 0;
  }
  private cheapestMissing(h: Unit, id: string): number {
    const def = ITEM_BY_ID[id];
    if (!def.from) return def.cost;
    const hs = h.hero!;
    let min = 1e9;
    for (const c of def.from) if (!hs.items.some((s) => s && s.id === c)) min = Math.min(min, ITEM_BY_ID[c].cost);
    return min === 1e9 ? quote(hs, id).cost : min;
  }

  private shop(h: Unit, b: Brain) {
    const sim = this.sim;
    const hs = h.hero!;
    if (sim.time - b.lastBuyCheck < 1) return;
    b.lastBuyCheck = sim.time;
    for (let n = 0; n < 5; n++) {
      let bought = false;
      for (const id of b.goals) {
        const q = quote(hs, id);
        if (!q.ok) { if (q.reason === 'Already owned') continue; if (q.reason === 'Inventory full') break; continue; }
        if (hs.gold >= q.cost) { sim.command({ slot: hs.slot, c: 'buy', item: id }); bought = true; break; }
        // save money for the full item; but buy affordable missing components to bank value
        const def = ITEM_BY_ID[id];
        if (def.from) {
          const missing = def.from.filter((c) => !hs.items.some((s) => s && s.id === c));
          const afford = missing.map((c) => ITEM_BY_ID[c]).filter((c) => c.cost <= hs.gold).sort((a, z) => z.cost - a.cost)[0];
          if (afford) { sim.command({ slot: hs.slot, c: 'buy', item: afford.id }); bought = true; }
        }
        break;
      }
      if (!bought) break;
    }
    // consumables when everything is bought or idle gold
    const draughts = hs.items.filter((s) => s && s.id === 'draught').reduce((s, x) => s + x!.qty, 0);
    if (draughts < 2 && hs.gold > 400 && b.goals.every((g) => !quote(hs, g).ok)) sim.command({ slot: hs.slot, c: 'buy', item: 'draught' });
    // use draughts when hurt
    if (h.hp / h.maxHp < 0.6) { const idx = hs.items.findIndex((s) => s && s.id === 'draught'); if (idx >= 0) sim.command({ slot: hs.slot, c: 'use', idx }); }
  }

  private retreatSkills(h: Unit, enemies: Unit[]) {
    const sim = this.sim;
    const hs = h.hero!;
    const d = HERO_BY_ID[hs.heroId];
    const f = TEAM_BASE[h.team as 0 | 1].fountain;
    for (const s of [1, 2]) {
      const ab = d.abilities[s];
      if (ab.ai !== 'escape' || hs.ranks[s] <= 0 || hs.cds[s] > sim.time || h.mana < ab.cost[hs.ranks[s] - 1]) continue;
      if (enemies.length === 0) continue;
      sim.command({ slot: hs.slot, c: 'cast', ab: s, x: f.x, z: f.z, target: 0 });
    }
  }

  // ------------------------------------------------------------ lane
  private laneBehavior(h: Unit, b: Brain, enemies: Unit[], allies: Unit[], passive: boolean, laneOverride?: number) {
    const sim = this.sim;
    const hs = h.hero!;
    const lane = laneOverride ?? b.lane;
    const path = sim.rules.pathFor(h.team as 0 | 1, lane);
    b.state = laneOverride !== undefined ? 'Group' : 'Lane';
    const team = h.team;
    // allied front-line minion along this lane
    let front: Unit | null = null;
    for (const u of sim.units) {
      if (u.dead || u.kind !== 'minion' || u.team !== team || u.lane !== lane) continue;
      if (!front || u.wp > front.wp || (u.wp === front.wp && dist(u.x, u.z, path[u.wp].x, path[u.wp].z) < dist(front.x, front.z, path[front.wp].x, path[front.wp].z))) front = u;
    }
    const myTowerSpot = this.laneRallyPoint(h, lane);
    let anchor = front ? { x: front.x, z: front.z } : myTowerSpot;
    // stay slightly behind the front: pull toward own base along path
    if (front) {
      const back = path[Math.max(0, front.wp - 1)];
      const bd = norm(back.x - front.x, back.z - front.z);
      anchor = { x: front.x + bd.x * 3.2, z: front.z + bd.z * 3.2 };
    }
    const dmg = h.ad * 0.95;
    const range = h.range;
    // support follows its partner
    if (b.role === 'support' && b.partner) {
      const p = sim.byId.get(b.partner);
      if (p && !p.dead) anchor = { x: p.x - (team === 0 ? 1.8 : -1.8), z: p.z + 1.2 };
    }
    // enemy targets near me
    let tgt: Unit | null = null, ts = 1e9;
    const reach = range + 0.7;
    const supportRole = b.role === 'support' && HERO_BY_ID[hs.heroId].role === 'Support';
    for (const e of sim.units) {
      if (e.dead || e.team === team || e.team === 2 || e.invuln || e.kind === 'ward') continue;
      if (!sim.canSee(team, e)) continue;
      const d = dist(h.x, h.z, e.x, e.z) - e.radius;
      if (d > reach + 0.5) continue;
      if (e.stype) continue; // structures handled below
      let s = d;
      if (e.kind === 'minion') {
        if (supportRole) s += 8;
        const killable = e.hp <= dmg * 1.05;
        s += killable ? -6 : (e.hp / e.maxHp) * 2;
        if (!killable && e.hp > dmg * 3 && sim.cfg.difficulty !== 'hard' && sim.rng.next() < 0.4) s += 3;
      } else if (e.kind === 'hero') {
        if (this.enemyTowerThreat(h)) continue;
        s += 1;
      }
      if (s < ts) { ts = s; tgt = e; }
    }
    // stay out of enemy tower range unless covered
    const danger = this.enemyTowerThreat(h) && !(laneOverride !== undefined && allies.length >= 2 && h.hp / h.maxHp > 0.5);
    if (danger && !passive) { this.cmdMove(h, anchor.x, anchor.z, b); return; }
    if (tgt) {
      if (tgt.kind === 'hero') this.useAbilities(h, tgt, enemies, allies);
      else if (HERO_BY_ID[hs.heroId].range > 4 && tgt.hp > dmg * 1.5 && !supportRole) this.farmAbilities(h, tgt);
      this.cmdAttack(h, tgt);
      return;
    }
    // group push: advance on the next vulnerable enemy structure
    if (!passive && laneOverride !== undefined && enemies.length <= allies.length + 1) {
      const ps = this.pushStructure(h, lane);
      if (ps) {
        const d = dist(h.x, h.z, ps.x, ps.z);
        const reachS = h.range + ps.radius + 0.5;
        if (d <= reachS) { this.cmdAttack(h, ps); return; }
        let cover = 0;
        for (const u of sim.units) if (u.kind === 'minion' && u.team === team && !u.dead && dist(u.x, u.z, ps.x, ps.z) < 12) cover++;
        if (cover >= 1 || allies.length >= 1 || h.hp / h.maxHp > 0.7) {
          const dir = norm(ps.x - h.x, ps.z - h.z);
          this.cmdMove(h, ps.x - dir.x * (reachS - 0.8), ps.z - dir.z * (reachS - 0.8), b);
          return;
        }
      }
    }
    // sieging: hit towers when minions are tanking
    if (!passive) {
      for (const s of sim.rules.structures.values()) {
        if (s.dead || s.team === team || s.invuln) continue;
        if (dist(h.x, h.z, s.x, s.z) > h.range + s.radius + 0.8) continue;
        let cover = 0;
        for (const u of sim.units) if (u.kind === 'minion' && u.team === team && !u.dead && dist(u.x, u.z, s.x, s.z) < 10) cover++;
        const towerOnMe = s.ttarget === h.id;
        if (cover >= 2 && !towerOnMe && enemies.length === 0 || (cover >= 1 && enemies.length === 0 && this.plans[team as 0 | 1].mode === "group")) {
          this.cmdAttack(h, s);
          return;
        }
      }
    }
    // move to anchor (offset per hero to avoid stacking)
    const off = ((h.id % 3) - 1) * 1.1;
    this.cmdMove(h, anchor.x + off, anchor.z + off * 0.6, b);
    this.maybeWard(h, b);
  }

  private pushStructure(h: Unit, lane: number): Unit | null {
    let best: Unit | null = null, bs = 1e9;
    for (const s of this.sim.rules.structures.values()) {
      if (s.dead || s.team === h.team || s.invuln) continue;
      const inLane = s.lane === lane && s.stype !== 'core' && s.stype !== 'engine';
      const sc = (inLane ? 0 : 25) + dist(h.x, h.z, s.x, s.z) * 0.4 + (s.stype === 'engine' ? -10 : 0);
      if (sc < bs) { bs = sc; best = s; }
    }
    return best;
  }

  private laneRallyPoint(h: Unit, lane: number) {
    const sim = this.sim;
    const pre = h.team === 0 ? 'b' : 'r';
    for (const t of ['outer', 'inner', 'guard', 'seal']) {
      const s = sim.rules.structures.get(`${pre}-${t}-${lane}`);
      if (s && !s.dead) {
        const path = laneFor(h.team as 0 | 1, lane);
        // a few meters in front of the tower along the lane
        let bestI = 0, bd = 1e9;
        for (let i = 0; i < path.length; i++) { const d = dist(path[i].x, path[i].z, s.x, s.z); if (d < bd) { bd = d; bestI = i; } }
        const nxt = path[Math.min(path.length - 1, bestI + 1)];
        const dir = norm(nxt.x - s.x, nxt.z - s.z);
        return { x: s.x + dir.x * 3.2, z: s.z + dir.z * 3.2 };
      }
    }
    return TEAM_BASE[h.team as 0 | 1].spawn;
  }

  private maybeWard(h: Unit, b: Brain) {
    const sim = this.sim;
    const hs = h.hero!;
    if (sim.cfg.difficulty === 'easy' || hs.trinketCharges <= 0 || sim.time - b.ward < 55) return;
    let best: { x: number; z: number } | null = null, bd = 12;
    for (const s of WARD_SPOTS) {
      const d = dist(h.x, h.z, s.x, s.z);
      if (d < bd && !sim.units.some((u) => u.kind === 'ward' && u.team === h.team && !u.dead && dist(u.x, u.z, s.x, s.z) < 6)) { bd = d; best = s; }
    }
    if (best) { sim.command({ slot: hs.slot, c: 'ward', x: best.x, z: best.z }); b.ward = sim.time; }
  }

  // ------------------------------------------------------------ jungle
  private jungleBehavior(h: Unit, b: Brain, enemies: Unit[]) {
    const sim = this.sim;
    const hs = h.hero!;
    b.state = 'Jungle';
    const pre = h.team === 0 ? 'b-' : 'r-';
    // gank when an isolated, damaged enemy hero is visible nearby
    if (hs.level >= 4) {
      const prey = sim.heroes.find((e) => !e.dead && e.team !== h.team && sim.canSee(h.team, e) && e.hp / e.maxHp < 0.65 && dist(h.x, h.z, e.x, e.z) < 38 && !this.towerNear(e, h.team));
      if (prey && h.hp / h.maxHp > 0.55) {
        b.state = 'Gank';
        this.useAbilities(h, prey, enemies, []);
        if (dist(h.x, h.z, prey.x, prey.z) > 2) this.cmdAttack(h, prey); else this.cmdAttack(h, prey);
        return;
      }
    }
    const rts = sim.rules.camps.filter((c) => c.def.id.startsWith(pre) && c.spawned && c.members.some((m) => !m.dead));
    // prefer buffs when level>=3, then nearest
    rts.sort((a, c) => dist(h.x, h.z, a.def.x, a.def.z) - dist(h.x, h.z, c.def.x, c.def.z));
    const camp = rts[0];
    if (!camp) { this.laneBehavior(h, b, enemies, [], false, b.lane); return; }
    const m = camp.members.filter((x) => !x.dead).sort((a, c) => dist(h.x, h.z, a.x, a.z) - dist(h.x, h.z, c.x, c.z))[0];
    if (!sim.canSee(h.team, m) || dist(h.x, h.z, m.x, m.z) > h.range + 9) { this.cmdMove(h, camp.def.x - (h.team === 0 ? 2.5 : -2.5), camp.def.z, b); return; }
    if (dist(h.x, h.z, m.x, m.z) < h.range + 5 && m.camp?.engaged) this.farmAbilities(h, m);
    this.cmdAttack(h, m);
    // ward when idle
    this.maybeWard(h, b);
  }
  private towerNear(e: Unit, team: Team): boolean {
    for (const s of this.sim.rules.structures.values()) if (!s.dead && s.team !== team && (s.kind === 'tower' || s.kind === 'core') && dist(e.x, e.z, s.x, s.z) < s.range + 2) return true;
    return false;
  }

  // ------------------------------------------------------------ abilities
  private farmAbilities(h: Unit, target: Unit) {
    const sim = this.sim;
    const hs = h.hero!;
    const d = HERO_BY_ID[hs.heroId];
    if (h.mana < h.maxMana * 0.5) return;
    for (const s of [0, 2]) {
      const ab = d.abilities[s];
      if (hs.ranks[s] <= 0 || hs.cds[s] > sim.time || ab.ult) continue;
      if (ab.ai !== 'skillshot' && ab.ai !== 'point') continue;
      if (dist(h.x, h.z, target.x, target.z) > ab.range * 0.9) continue;
      sim.command({ slot: hs.slot, c: 'cast', ab: s, x: target.x, z: target.z, target: 0 });
      return;
    }
  }

  private aim(h: Unit, t: Unit, speed: number): { x: number; z: number } {
    const sim = this.sim;
    const d = dist(h.x, h.z, t.x, t.z);
    const vx = (t.x - t.px) / DT, vz = (t.z - t.pz) / DT;
    const lead = speed > 0 ? Math.min(0.9, d / speed) : 0.25;
    const skill = sim.cfg.difficulty === 'hard' ? 1 : sim.cfg.difficulty === 'easy' ? 0.2 : 0.65;
    const nx = (sim.rng.next() - 0.5) * (1 - skill) * 3.2, nz = (sim.rng.next() - 0.5) * (1 - skill) * 3.2;
    return { x: t.x + vx * lead * skill + nx, z: t.z + vz * lead * skill + nz };
  }

  private useAbilities(h: Unit, tgt: Unit, enemies: Unit[], allies: Unit[]) {
    const sim = this.sim;
    const hs = h.hero!;
    const now = sim.time;
    if (h.cast || h.dash || sim.isSilenced(h)) return;
    if (now - this.brains.get(h.id)!.lastAb < 0.35) return;
    const d = HERO_BY_ID[hs.heroId];
    const dTgt = dist(h.x, h.z, tgt.x, tgt.z);
    const hpf = h.hp / h.maxHp;
    const isHero = tgt.kind === 'hero';
    const speeds: Record<string, number[]> = { suri: [26, 0, 0, 0], oru: [11, 0, 0, 9.5], ilyra: [26, 0, 0, 0], brannoch: [0, 0, 0, 0] };
    const spd = (s: number) => speeds[hs.heroId]?.[s] ?? 0;
    const nEnemiesNear = enemies.filter((e) => dist(h.x, h.z, e.x, e.z) < 9).length;
    const cast = (s: number, x: number, z: number, target = 0) => {
      sim.command({ slot: hs.slot, c: 'cast', ab: s, x, z, target });
      this.brains.get(h.id)!.lastAb = now;
    };
    for (const s of [3, 2, 0, 1]) {
      const ab = d.abilities[s];
      if (hs.ranks[s] <= 0) continue;
      const rec = hs.rec[s];
      const isRecast = !!(rec && rec.until > now);
      if (!isRecast) {
        if (hs.cds[s] > now || h.mana < ab.cost[hs.ranks[s] - 1]) continue;
      }
      if (isRecast) {
        // recast rules
        if (hs.heroId === 'kesh' && s === 0 && dTgt < 3.4 && now - (rec!.until - ab.recast! - ab.castTime) > 0.5) { cast(s, tgt.x, tgt.z); return; }
        if (hs.heroId === 'brannoch' && s === 2 && rec!.data) { const dd = dist(h.x, h.z, rec!.data.ax, rec!.data.az); if (dd > 2.5 && dTgt > 3) { cast(s, tgt.x, tgt.z); return; } }
        continue;
      }
      if (!isHero && !(ab.ai === 'self' || ab.ai === 'skillshot' || ab.ai === 'engage')) continue;
      switch (ab.ai) {
        case 'skillshot': {
          if (dTgt > ab.range * 0.92 || (ab.range < 6 && dTgt > ab.range)) break;
          if (ab.ult && !(isHero && (tgt.hp / tgt.maxHp < 0.7 || nEnemiesNear >= 2))) break;
          const a = this.aim(h, tgt, spd(s));
          if (hs.heroId === 'oru' && s === 3) { if (allies.length === 0 && tgt.hp / tgt.maxHp > 0.4) break; }
          cast(s, a.x, a.z); return;
        }
        case 'point': {
          if (dTgt > ab.range) break;
          if (hs.heroId === 'ilyra' && s === 3 && !(tgt.hp / tgt.maxHp < 0.65 || nEnemiesNear >= 2)) break;
          if (hs.heroId === 'ilyra' && s === 1) { if (nEnemiesNear === 0) break; }
          const a = this.aim(h, tgt, spd(s));
          cast(s, a.x, a.z); return;
        }
        case 'unit': {
          if (!isHero || dTgt > ab.range) break;
          if (ab.ult && tgt.hp / tgt.maxHp > 0.75) break;
          cast(s, tgt.x, tgt.z, tgt.id); return;
        }
        case 'ally': {
          const a = allies.filter((x) => dist(h.x, h.z, x.x, x.z) <= ab.range).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp)[0];
          if (a) { cast(s, a.x, a.z, a.id); return; }
          break;
        }
        case 'self': {
          if (nEnemiesNear === 0 && dTgt > 5.5) break;
          if (hs.heroId === 'kesh' && s === 3 && !(nEnemiesNear >= 1 && hpf < 0.85)) break;
          if (hs.heroId === 'kesh' && s === 1 && !(dTgt < 5 && hpf < 0.75)) break;
          if (hs.heroId === 'brannoch' && s === 1) { if (!(dTgt < 7 && enemies.some((e) => e.range > 3))) break; cast(s, tgt.x, tgt.z); return; }
          cast(s, tgt.x, tgt.z); return;
        }
        case 'engage': {
          if (hs.heroId === 'brannoch' && s === 3) { if (dTgt < 3 || dTgt > 10.5 || !(isHero && (nEnemiesNear >= 1))) break; const a = this.aim(h, tgt, 0); cast(s, a.x, a.z); return; }
          if (hs.heroId === 'brannoch' && s === 2) { if (dTgt > 9 || dTgt < 4) break; cast(s, tgt.x, tgt.z); return; }
          if (hs.heroId === 'kesh' && s === 2) { if (dTgt < 3.5 || dTgt > 8) break; cast(s, tgt.x, tgt.z); return; }
          break;
        }
        case 'escape': {
          if (hs.heroId === 'vey' && s === 1 && dTgt < 12 && isHero) { cast(s, tgt.x + 2, tgt.z); return; }
          if (hs.heroId === 'suri' && s === 1 && dTgt < 3.5 && hpf < 0.6) { cast(s, h.x * 2 - tgt.x, h.z * 2 - tgt.z); return; }
          break;
        }
      }
    }
  }
}
