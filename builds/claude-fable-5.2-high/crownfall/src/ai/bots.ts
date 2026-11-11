// server-ai: hero bots. Bots perceive only what their team can see (visUntil), act only through
// the same `issue()` command path as players, and never get stat or vision bonuses — difficulty
// changes reaction time, aim, last-hit tolerance and how often abilities are considered.
//
// States (b.state): Lane, LastHit, Harass, Push, AvoidThreat, Retreat, RecallBuy, JungleCamp, Gank,
// Defend, RotateObjective, TeamFight, ChaseLimited, Ward.

import { ULT_LEVELS } from '../shared/heroes';
import { ITEMS, buyPlan } from '../shared/items';
import { FOUNTAIN, WARD_SPOTS } from '../shared/map';
import { Vec, clamp, dist, pointSegDist, secs } from '../shared/math';
import type { Difficulty } from '../shared/protocol';
import { MONSTERS, RULES } from '../shared/units';
import { hasEffect, mitigate, structVulnerable, stunned } from '../sim/combat';
import { inFountain, issue } from '../sim/hero';
import type { CampState, Unit } from '../sim/types';
import type { World } from '../sim/world';

interface Brain {
  role: 'lane' | 'jungle';
  lane: number;
  state: string;
  next: number;
  path: number; // which build direction
  retreat: boolean;
  shopTrip: boolean;
  lastTrip: number;
  swapObs: number;
  chaseFrom: Vec | null;
  chaseId: number;
  objective: number; // camp id being contested, -1 none
  defendUntil: number;
  defendPos: Vec | null;
  recastAt: number;
  gankUntil: number;
}

const PARAMS: Record<Difficulty, { think: number; aimErr: number; lead: number; lastHit: number; cast: number; retreat: number; harass: boolean; dive: boolean }> = {
  easy: { think: 18, aimErr: 1.4, lead: 0.2, lastHit: 0.55, cast: 0.3, retreat: 0.25, harass: false, dive: false },
  normal: { think: 12, aimErr: 0.7, lead: 0.6, lastHit: 0.85, cast: 0.7, retreat: 0.27, harass: true, dive: false },
  hard: { think: 7, aimErr: 0.25, lead: 1.0, lastHit: 1.0, cast: 1.0, retreat: 0.3, harass: true, dive: true },
};

export const BOT_TALENTS: Record<string, [string, string]> = {
  brannoch: ['bulwark', 'skyhop'],
  suri: ['skyhop', 'mend'],
  oru: ['mend', 'surge'],
  kesh: ['sunder', 'skyhop'],
  ilyra: ['skyhop', 'bulwark'],
  vey: ['smolder', 'skyhop'],
};

const progress = (team: number, x: number): number => (team === 0 ? x : 150 - x);

function lanePointAt(w: World, lane: number, team: number, prog: number): Vec {
  const pts = w.map.lanes[lane];
  const x = clamp(team === 0 ? prog : 150 - prog, pts[0].x, pts[pts.length - 1].x);
  for (let i = 0; i < pts.length - 1; i++) {
    if (x <= pts[i + 1].x) {
      const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x || 1);
      return { x, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t };
    }
  }
  return pts[pts.length - 1];
}

function distToLane(w: World, lane: number, x: number, y: number): number {
  const pts = w.map.lanes[lane];
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, pointSegDist(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
  return best;
}

function initBrain(w: World, u: Unit): Brain {
  const team = w.heroes.filter((h) => h.team === u.team);
  const jungler = team.find((h) => h.hero!.def.builds.lane === 'jungle');
  const laners = team.filter((h) => h !== jungler);
  // first laner takes the short lower lane, the rest go upper
  const idx = laners.indexOf(u);
  const lane = u === jungler ? 1 : idx === 0 ? 1 : 0;
  return {
    role: u === jungler ? 'jungle' : 'lane',
    lane,
    state: 'Lane',
    next: 0,
    path: (w.config.seed + u.id) % 2,
    retreat: false,
    shopTrip: false,
    lastTrip: 0,
    swapObs: 0,
    chaseFrom: null,
    chaseId: 0,
    objective: -1,
    defendUntil: 0,
    defendPos: null,
    recastAt: 0,
    gankUntil: 0,
  };
}

// ---- small command helpers (avoid re-issuing identical orders, which would cancel windups) ----

function orderAttack(w: World, u: Unit, t: Unit): void {
  const o = u.hero!.order;
  if (o.t === 'attack' && o.id === t.id && !o.auto) return;
  issue(w, u, { t: 'attack', id: t.id });
}
function orderMove(w: World, u: Unit, x: number, y: number): void {
  const o = u.hero!.order;
  if (o.t === 'move' && dist(o.x, o.y, x, y) < 1.2) return;
  if (dist(u.x, u.y, x, y) < 0.8) {
    if (o.t !== 'idle') issue(w, u, { t: 'stop' });
    return;
  }
  issue(w, u, { t: 'move', x, y });
}

function ready(w: World, u: Unit, slot: number): boolean {
  const h = u.hero!;
  if (slot < 4) {
    if (h.ranks[slot] <= 0) return false;
    const def = h.def.abilities[slot];
    if (u.mana < def.cost[Math.min(def.cost.length - 1, h.ranks[slot] - 1)]) return false;
  }
  return w.tick >= h.cdUntil[slot];
}
function talentSlot(u: Unit, id: string): number {
  const i = u.hero!.talents.indexOf(id as never);
  return i < 0 ? -1 : 4 + i;
}
function cast(w: World, u: Unit, slot: number, x: number, y: number, id?: number): boolean {
  return issue(w, u, { t: 'cast', slot, x, y, id }) === null;
}
/** Lead a moving target; error and lead quality depend on difficulty. */
function aim(w: World, u: Unit, t: Unit, speed: number, P: (typeof PARAMS)[Difficulty]): Vec {
  const d = dist(u.x, u.y, t.x, t.y);
  const tt = speed > 0 ? d / speed : 0.3;
  return { x: t.x + t.vx * tt * P.lead + w.rng.range(-P.aimErr, P.aimErr), y: t.y + t.vy * tt * P.lead + w.rng.range(-P.aimErr, P.aimErr) };
}

// ---- shopping -----------------------------------------------------------------------------

function autoRank(w: World, u: Unit): void {
  const h = u.hero!;
  for (let guard = 0; guard < 3 && h.skillPts > 0; guard++) {
    const ultAllowed = ULT_LEVELS.filter((l) => h.level >= l).length;
    if (h.ranks[3] < ultAllowed) {
      issue(w, u, { t: 'rank', slot: 3 });
      continue;
    }
    // one point in everything early, then max by priority
    let pick = -1;
    if (h.level <= 3) pick = [0, 1, 2].find((s) => h.ranks[s] === 0) ?? -1;
    if (pick < 0) pick = h.def.builds.skillOrder.find((s) => h.ranks[s] < 4 && h.ranks[s] < Math.ceil(h.level / 2)) ?? -1;
    if (pick < 0) pick = [0, 1, 2].find((s) => h.ranks[s] < 4 && h.ranks[s] < Math.ceil(h.level / 2)) ?? -1;
    if (pick < 0) break;
    if (issue(w, u, { t: 'rank', slot: pick }) !== null) break;
  }
}

/** Build graph: starter -> chosen path, with a conditional defensive branch against the enemy damage profile. */
export function buildList(w: World, u: Unit, pathIdx: number): string[] {
  const h = u.hero!;
  const b = h.def.builds;
  const items = [b.starter, ...b.paths[pathIdx % b.paths.length].items];
  let phys = 0;
  let arc = 0;
  for (const e of w.heroes) {
    if (e.team === u.team) continue;
    if (['brannoch', 'suri', 'kesh', 'vey'].includes(e.hero!.heroId)) phys += 1 + e.hero!.k * 0.3;
    else arc += 1 + e.hero!.k * 0.3;
  }
  const adapt = phys >= arc * 1.8 ? b.vsPhysical : arc >= phys * 1.8 ? b.vsArcane : null;
  if (adapt && !items.includes(adapt)) items.splice(4, 0, adapt); // conditional branch after the second big item
  return items;
}

function nextItem(w: World, u: Unit, b: Brain): string | null {
  const h = u.hero!;
  const owned = h.inv.filter(Boolean).map((s) => s!.id);
  for (const id of buildList(w, u, b.path)) {
    if (owned.includes(id)) continue;
    // already upgraded past this component?
    if (owned.some((o) => ITEMS[o].from?.includes(id))) continue;
    if (ITEMS[id].tier === 'starter' && owned.some((o) => ITEMS[o].tier === 'starter')) continue;
    if (ITEMS[id].tier === 'boots' && owned.some((o) => ITEMS[o].tier === 'boots')) continue;
    return id;
  }
  return null;
}

function shop(w: World, u: Unit, b: Brain): void {
  const h = u.hero!;
  for (let guard = 0; guard < 6; guard++) {
    const want = nextItem(w, u, b);
    if (!want) break;
    const def = ITEMS[want];
    if (h.inv.every(Boolean) && buyPlan(h.inv, want).consume.length === 0) {
      // full: sell the starter to make room
      const si = h.inv.findIndex((s) => s && (ITEMS[s.id].tier === 'starter' || ITEMS[s.id].tier === 'consumable'));
      if (si < 0) break;
      issue(w, u, { t: 'sell', slot: si });
    }
    if (h.gold >= buyPlan(h.inv, want).cost) {
      if (issue(w, u, { t: 'buy', item: want }) !== null) break;
      continue;
    }
    const comp = def.from?.find((c) => !h.inv.some((s) => s?.id === c) && h.gold >= ITEMS[c].cost);
    if (comp && h.inv.includes(null)) {
      if (issue(w, u, { t: 'buy', item: comp }) !== null) break;
      continue;
    }
    break;
  }
  if (h.level < 7 && h.gold >= 50 && !h.inv.some((s) => s?.id === 'amber_draught') && h.inv.includes(null)) issue(w, u, { t: 'buy', item: 'amber_draught' });
  h.undo.length = 0;
}

// ---- perception ---------------------------------------------------------------------------

interface Percept {
  enemies: Unit[]; // visible enemy heroes within 14
  allies: Unit[]; // allied heroes within 14 (excluding self)
  eMinions: Unit[];
  aMinions: Unit[];
  tower: Unit | null; // nearest live enemy attacking structure within 14
  hpPct: number;
  manaPct: number;
}

function perceive(w: World, u: Unit): Percept {
  const p: Percept = { enemies: [], allies: [], eMinions: [], aMinions: [], tower: null, hpPct: u.hp / u.stats.maxHp, manaPct: u.stats.maxMana > 0 ? u.mana / u.stats.maxMana : 1 };
  const team = u.team as 0 | 1;
  let td = 14;
  for (const o of w.units) {
    if (!o.alive || o === u) continue;
    const d = dist(u.x, u.y, o.x, o.y);
    if (d > 14) continue;
    if (o.team === team) {
      if (o.hero) p.allies.push(o);
      else if (o.kind === 'minion') p.aMinions.push(o);
    } else if (o.team === 1 - team) {
      if (o.struct) {
        if (o.stats.ad > 0 && d < td) {
          td = d;
          p.tower = o;
        }
      } else if (o.visUntil[team] >= w.tick) {
        if (o.hero) p.enemies.push(o);
        else if (o.kind === 'minion') p.eMinions.push(o);
      }
    }
  }
  return p;
}

const power = (u: Unit): number => (u.hp / u.stats.maxHp) * (0.6 + u.level * 0.12);

function minionsTanking(w: World, tower: Unit, team: number): number {
  let n = 0;
  for (const m of w.units) if (m.kind === 'minion' && m.alive && m.team === team && dist(m.x, m.y, tower.x, tower.y) <= RULES.towerRange + 0.5) n++;
  return n;
}

function towerUnsafe(w: World, u: Unit, tower: Unit | null, x: number, y: number): boolean {
  if (!tower) return false;
  if (dist(tower.x, tower.y, x, y) > RULES.towerRange + u.radius + 0.8) return false;
  if (tower.attackTarget === u.id) return true;
  return minionsTanking(w, tower, u.team) < 2;
}

// ---- kit usage (utility-lite: gates on range, hit chance, target value, resource, danger) ----

function useKit(w: World, u: Unit, b: Brain, p: Percept, P: (typeof PARAMS)[Difficulty], target: Unit | null, fleeing: boolean): boolean {
  const h = u.hero!;
  if (stunned(u) || h.casting) return false;
  const d = target ? dist(u.x, u.y, target.x, target.y) : 99;
  const tHp = target ? target.hp / target.stats.maxHp : 1;
  const home = FOUNTAIN[u.team];
  // talents first: survival
  const tal = (id: string): number => {
    const s = talentSlot(u, id);
    return s >= 0 && ready(w, u, s) ? s : -1;
  };
  if (p.hpPct < 0.45 && tal('mend') >= 0) return cast(w, u, tal('mend'), u.x, u.y);
  if (p.hpPct < 0.5 && p.enemies.length && tal('bulwark') >= 0) return cast(w, u, tal('bulwark'), u.x, u.y);
  if (fleeing && p.enemies.some((e) => dist(e.x, e.y, u.x, u.y) < 6)) {
    if (tal('surge') >= 0) return cast(w, u, tal('surge'), u.x, u.y);
    if (tal('skyhop') >= 0) {
      const dd = dist(u.x, u.y, home.x, home.y) || 1;
      return cast(w, u, tal('skyhop'), u.x + ((home.x - u.x) / dd) * 4.5, u.y + ((home.y - u.y) / dd) * 4.5);
    }
  }
  if (target?.hero && tHp < 0.35 && d < 6 && tal('smolder') >= 0) return cast(w, u, tal('smolder'), target.x, target.y, target.id);
  const draught = h.inv.findIndex((s) => s?.id === 'amber_draught');
  if (draught >= 0 && p.hpPct < 0.55 && !hasEffect(u, 'hot')) {
    issue(w, u, { t: 'item', slot: draught, x: u.x, y: u.y });
    return false;
  }
  if (!w.rng.chance(P.cast)) return false;
  const reserve = fleeing ? 0 : 0.15;
  if (p.manaPct < reserve && h.def.resource === 'Mana') return false;
  const fighting = !!target?.hero && d < 13;

  switch (h.heroId) {
    case 'brannoch': {
      if (h.recast[2] && w.tick >= b.recastAt) return cast(w, u, 2, u.x, u.y);
      if (fleeing) return false;
      if (fighting && target) {
        if (ready(w, u, 3) && d > 4 && d < 12.5 && (tHp < 0.7 || p.allies.length > 0)) return cast(w, u, 3, target.x + target.vx * 0.9 * P.lead, target.y + target.vy * 0.9 * P.lead);
        if (ready(w, u, 0) && d < 4.2) return cast(w, u, 0, target.x, target.y);
        if (ready(w, u, 2) && d > 4.5 && d < 9) {
          b.recastAt = w.tick + 6;
          return cast(w, u, 2, target.x, target.y);
        }
        if (ready(w, u, 1) && d < 6 && tHp < 0.55) {
          const ex = target.x + ((target.x - u.x) / d) * 2.5;
          const ey = target.y + ((target.y - u.y) / d) * 2.5;
          return cast(w, u, 1, ex, ey);
        }
      } else if (ready(w, u, 0) && p.manaPct > 0.55) {
        const near = p.eMinions.filter((m) => dist(m.x, m.y, u.x, u.y) < 4);
        if (near.length >= 3) return cast(w, u, 0, near[0].x, near[0].y);
      }
      return false;
    }
    case 'suri': {
      if (fleeing) {
        if (ready(w, u, 1) && p.enemies.some((e) => dist(e.x, e.y, u.x, u.y) < 5)) {
          const dd = dist(u.x, u.y, home.x, home.y) || 1;
          return cast(w, u, 1, u.x + ((home.x - u.x) / dd) * 5, u.y + ((home.y - u.y) / dd) * 5);
        }
        return false;
      }
      if (fighting && target) {
        if (ready(w, u, 3) && tHp < 0.45 && d < 30) {
          const a = aim(w, u, target, 46, P);
          return cast(w, u, 3, a.x, a.y);
        }
        if (ready(w, u, 2) && d < 7.3) return cast(w, u, 2, target.x, target.y, target.id);
        if (ready(w, u, 0) && d < 10.5) {
          const a = aim(w, u, target, 27, P);
          return cast(w, u, 0, a.x, a.y);
        }
      } else if (ready(w, u, 0) && p.manaPct > 0.6) {
        const siege = p.eMinions.find((m) => m.sub === 'siege' && dist(m.x, m.y, u.x, u.y) < 10);
        if (siege) return cast(w, u, 0, siege.x, siege.y);
      }
      return false;
    }
    case 'oru': {
      const hurt = p.allies.filter((a) => a.hp / a.stats.maxHp < 0.7 && w.tick - a.lastCombat < 90).sort((a, c) => a.hp / a.stats.maxHp - c.hp / c.stats.maxHp)[0];
      if (fleeing) {
        if (ready(w, u, 2)) return cast(w, u, 2, u.x, u.y, u.id);
        return false;
      }
      if (ready(w, u, 3) && fighting && target && d < 12 && p.allies.some((a) => dist(a.x, a.y, u.x, u.y) < 9)) return cast(w, u, 3, target.x, target.y);
      if (hurt && ready(w, u, 0) && dist(hurt.x, hurt.y, u.x, u.y) < 9.5) {
        const a = aim(w, u, hurt, 11, P);
        return cast(w, u, 0, a.x, a.y);
      }
      if (fighting && target) {
        if (ready(w, u, 0) && d < 9.5) {
          const a = aim(w, u, target, 11, P);
          return cast(w, u, 0, a.x, a.y);
        }
        if (ready(w, u, 1) && d < 9) return cast(w, u, 1, target.x, target.y);
        const carry = p.allies.find((a) => w.tick - a.lastCombat < 60 && dist(a.x, a.y, u.x, u.y) < 8);
        if (ready(w, u, 2) && carry) return cast(w, u, 2, carry.x, carry.y, carry.id);
      } else if (ready(w, u, 0) && p.manaPct > 0.65) {
        const m = p.eMinions.find((mm) => dist(mm.x, mm.y, u.x, u.y) < 9 && mm.hp < 140);
        if (m) return cast(w, u, 0, m.x, m.y);
      }
      return false;
    }
    case 'kesh': {
      const mon = u.attackTarget ? w.byId.get(u.attackTarget) : undefined;
      const foe = fighting && target ? target : mon && mon.alive && mon.kind === 'monster' ? mon : null;
      if (fleeing) {
        if (ready(w, u, 2) && p.enemies.some((e) => dist(e.x, e.y, u.x, u.y) < 6)) {
          const dd = dist(u.x, u.y, home.x, home.y) || 1;
          return cast(w, u, 2, u.x + ((home.x - u.x) / dd) * 5.5, u.y + ((home.y - u.y) / dd) * 5.5);
        }
        return false;
      }
      if (!foe) {
        const near = p.eMinions.filter((m) => dist(m.x, m.y, u.x, u.y) < 3.6);
        if (near.length >= 3 && ready(w, u, 0) && p.manaPct > 0.5) return cast(w, u, 0, near[0].x, near[0].y);
        return false;
      }
      const fd = dist(u.x, u.y, foe.x, foe.y);
      if (foe.hero && ready(w, u, 3) && fd < 6 && (foe.hp / foe.stats.maxHp < 0.75 || p.allies.length > 0)) return cast(w, u, 3, foe.x, foe.y);
      if (ready(w, u, 0) && fd < 3.8 + foe.radius) return cast(w, u, 0, foe.x, foe.y);
      if (ready(w, u, 1) && w.tick - u.lastCombat < 30 && p.hpPct < 0.8 && fd < 4.5) return cast(w, u, 1, u.x, u.y);
      if (foe.hero && ready(w, u, 2) && fd > 3 && fd < 7.5) return cast(w, u, 2, foe.x, foe.y);
      const sun = tal('sunder');
      if (sun >= 0 && foe.kind === 'monster' && fd < 5 && (MONSTERS[foe.sub]?.big ? foe.hp < 300 + 40 * h.level : foe.hp > 250 && foe.sub !== 'thorn')) return cast(w, u, sun, foe.x, foe.y, foe.id);
      return false;
    }
    case 'ilyra': {
      if (fleeing) {
        const chaser = p.enemies.find((e) => dist(e.x, e.y, u.x, u.y) < 6);
        if (chaser && ready(w, u, 2)) return cast(w, u, 2, chaser.x, chaser.y);
        return false;
      }
      if (fighting && target) {
        if (ready(w, u, 3) && d < 12.5 && (tHp < 0.7 || stunned(target) || hasEffect(target, 'root') || p.enemies.length > 1)) {
          const a = aim(w, u, target, 0, P);
          return cast(w, u, 3, a.x, a.y);
        }
        if (ready(w, u, 2) && d < 6.5) return cast(w, u, 2, target.x, target.y);
        if (ready(w, u, 0) && d < 11.5) {
          const a = aim(w, u, target, 23, P);
          return cast(w, u, 0, a.x, a.y);
        }
        if (ready(w, u, 1) && d < 9) {
          const a = aim(w, u, target, 14, P);
          return cast(w, u, 1, a.x, a.y);
        }
      } else if (ready(w, u, 0) && p.manaPct > 0.55) {
        const ms = p.eMinions.filter((m) => dist(m.x, m.y, u.x, u.y) < 10);
        if (ms.length >= 3) return cast(w, u, 0, ms[1].x, ms[1].y);
      }
      return false;
    }
    case 'vey': {
      if (fleeing) {
        if (ready(w, u, 1) && p.enemies.some((e) => dist(e.x, e.y, u.x, u.y) < 6)) return cast(w, u, 1, u.x + (u.x - (p.enemies[0]?.x ?? u.x)), u.y + (u.y - (p.enemies[0]?.y ?? u.y)));
        return false;
      }
      if (fighting && target) {
        if (ready(w, u, 3) && d < 8 && tHp < 0.65) return cast(w, u, 3, target.x, target.y, target.id);
        if (ready(w, u, 0) && d < 5.5 + target.radius && !target.effects.some((e) => e.type === 'shardlock' && e.src === u.id) && (tHp < 0.8 || p.hpPct > 0.6)) return cast(w, u, 0, target.x, target.y, target.id);
        if (ready(w, u, 2) && d < 4.2) return cast(w, u, 2, target.x, target.y);
      } else {
        const mon = u.attackTarget ? w.byId.get(u.attackTarget) : undefined;
        if (mon?.alive && mon.kind === 'monster') {
          const md = dist(mon.x, mon.y, u.x, u.y);
          if (ready(w, u, 2) && md < 4) return cast(w, u, 2, mon.x, mon.y);
          if (ready(w, u, 0) && md < 5.5 && !mon.effects.some((e) => e.type === 'shardlock' && e.src === u.id)) return cast(w, u, 0, mon.x, mon.y, mon.id);
        }
      }
      return false;
    }
  }
  return false;
}

// ---- behaviours ---------------------------------------------------------------------------

function retreat(w: World, u: Unit, b: Brain, p: Percept): void {
  const h = u.hero!;
  const f = FOUNTAIN[u.team];
  const df = dist(u.x, u.y, f.x, f.y);
  b.state = b.shopTrip ? 'RecallBuy' : 'Retreat';
  if (inFountain(u)) {
    if (h.order.t !== 'idle') issue(w, u, { t: 'stop' });
    return;
  }
  const threatened = p.enemies.some((e) => dist(e.x, e.y, u.x, u.y) < 11) || w.tick - h.lastHurtByHeroTick < 60 || (p.tower !== null && dist(p.tower.x, p.tower.y, u.x, u.y) < RULES.towerRange + 2);
  if (!threatened && df > 22 && p.eMinions.every((m) => dist(m.x, m.y, u.x, u.y) > 7)) {
    if (h.recallUntil <= 0) issue(w, u, { t: 'recall' });
    return;
  }
  if (h.recallUntil > 0 && !threatened) return;
  orderMove(w, u, f.x, f.y);
}

function pickFightTarget(u: Unit, p: Percept): Unit | null {
  let best: Unit | null = null;
  let bs = 1e9;
  for (const e of p.enemies) {
    const d = dist(u.x, u.y, e.x, e.y);
    const s = e.hp * (1 + d * 0.06);
    if (s < bs) {
      bs = s;
      best = e;
    }
  }
  return best;
}

function laneFront(w: World, team: number, lane: number): { prog: number; hasMinions: boolean } {
  let best = -1;
  for (const m of w.units) {
    if (m.kind !== 'minion' || !m.alive || m.team !== team || m.npc!.lane !== lane) continue;
    const pr = progress(team, m.x);
    if (pr > best) best = pr;
  }
  if (best >= 0) return { prog: best, hasMinions: true };
  // no wave: hold at the outermost living lane structure
  let sp = 30;
  for (const s of w.structs) {
    if (s.team !== team || !s.alive || s.struct!.def.lane !== lane || s.kind === 'seal') continue;
    sp = Math.max(sp, progress(team, s.x) - 2);
  }
  return { prog: sp, hasMinions: false };
}

function laneBehaviour(w: World, u: Unit, b: Brain, p: Percept, P: (typeof PARAMS)[Difficulty]): void {
  const h = u.hero!;
  const team = u.team as 0 | 1;
  const front = laneFront(w, team, b.lane);
  const melee = h.def.melee;
  const range = u.stats.range;

  // attackable enemy structure in this lane?
  let struct: Unit | null = null;
  let sd = 12;
  for (const s of w.structs) {
    if (s.team === team || !s.alive || !structVulnerable(w, s)) continue;
    const d = dist(s.x, s.y, u.x, u.y);
    if (d < sd) {
      sd = d;
      struct = s;
    }
  }
  const danger = p.tower && towerUnsafe(w, u, p.tower, u.x, u.y);
  if (danger && p.tower) {
    // AvoidThreat: step out of tower range toward our side
    b.state = 'AvoidThreat';
    const back = lanePointAt(w, b.lane, team, progress(team, p.tower.x) - RULES.towerRange - 4);
    orderMove(w, u, back.x, back.y);
    return;
  }

  // LastHit
  const dmgVs = (m: Unit): number => u.stats.ad * mitigate(m.stats.armor, u.stats.armorPen);
  let lastHit: Unit | null = null;
  for (const m of p.eMinions) {
    const d = dist(m.x, m.y, u.x, u.y);
    if (d > range + 4.5) continue;
    if (m.hp <= dmgVs(m) * P.lastHit && !towerUnsafe(w, u, p.tower, m.x, m.y)) {
      if (!lastHit || m.hp < lastHit.hp) lastHit = m;
    }
  }
  if (lastHit) {
    b.state = 'LastHit';
    orderAttack(w, u, lastHit);
    return;
  }

  // Push: hit structures while the wave tanks
  if (struct && struct.stats.ad > 0 ? minionsTanking(w, struct, team) >= 2 && struct.attackTarget !== u.id : struct) {
    const s = struct as Unit;
    const threat = p.enemies.reduce((a, e) => a + power(e), 0);
    const mine = power(u) + p.allies.reduce((a, e) => a + power(e), 0);
    if (threat <= mine * 1.25 && dist(s.x, s.y, u.x, u.y) < range + 7) {
      b.state = 'Push';
      orderAttack(w, u, s);
      return;
    }
  }

  // Harass
  const foe = pickFightTarget(u, p);
  if (foe && P.harass) {
    const d = dist(foe.x, foe.y, u.x, u.y);
    const underTower = p.tower && dist(p.tower.x, p.tower.y, foe.x, foe.y) < RULES.towerRange && minionsTanking(w, p.tower, team) < 2;
    const fair = power(u) + p.allies.length * 0.5 >= power(foe) * 0.7 + (p.enemies.length - 1) * 0.6;
    if (d < range + (melee ? 4.5 : 3) && fair && !underTower && p.eMinions.filter((m) => dist(m.x, m.y, u.x, u.y) < 6).length <= 5) {
      b.state = 'Harass';
      orderAttack(w, u, foe);
      return;
    }
  }

  // Push the wave: free hits on minions when nothing better to do
  if (p.eMinions.length && (h.level >= 3 || !p.enemies.length || P.lastHit < 0.8)) {
    let best: Unit | null = null;
    let bs = 1e9;
    for (const m of p.eMinions) {
      const d = dist(m.x, m.y, u.x, u.y);
      if (d > range + 5 || towerUnsafe(w, u, p.tower, m.x, m.y)) continue;
      // avoid ruining an imminent last hit: skip minions that are nearly dead but not yet killable
      if (m.hp < dmgVs(m) * 2.2 && m.hp > dmgVs(m) && P.lastHit >= 0.8) continue;
      const s = m.hp + d * 12;
      if (s < bs) {
        bs = s;
        best = m;
      }
    }
    if (best) {
      b.state = 'Push';
      orderAttack(w, u, best);
      return;
    }
  }

  // Lane: hold position relative to the wave front
  b.state = 'Lane';
  let want = front.prog - (front.hasMinions ? (melee ? 1.5 : 4.5) : 2);
  for (const s of w.structs) {
    if (s.team === team || !s.alive || s.stats.ad <= 0 || s.struct!.def.lane !== b.lane) continue;
    const tp = progress(team, s.x);
    if (want > tp - RULES.towerRange - 2.5 && minionsTanking(w, s, team) < 2) want = Math.min(want, tp - RULES.towerRange - 2.5);
  }
  const pos = lanePointAt(w, b.lane, team, want);
  const off = ((u.id % 5) - 2) * 0.7;
  orderMove(w, u, pos.x, pos.y + off);
}

function ownCamps(w: World, u: Unit): CampState[] {
  return w.camps.filter((c) => c.def.side === u.team && c.alive);
}

function jungleBehaviour(w: World, u: Unit, b: Brain, p: Percept): boolean {
  const h = u.hero!;
  // Gank: a visible enemy laner who is overextended or weak
  if (w.tick >= b.gankUntil - secs(8) && h.level >= 3 && p.hpPct > 0.6) {
    let victim: Unit | null = null;
    let bd = 34;
    for (const e of w.heroes) {
      if (e.team === u.team || !e.alive || e.visUntil[u.team as 0 | 1] < w.tick) continue;
      const d = dist(e.x, e.y, u.x, u.y);
      const over = progress(e.team, e.x) > 70 || e.hp / e.stats.maxHp < 0.5;
      const nearTower = w.structs.some((s) => s.alive && s.team === e.team && s.stats.ad > 0 && dist(s.x, s.y, e.x, e.y) < RULES.towerRange + 1);
      if (over && !nearTower && d < bd) {
        bd = d;
        victim = e;
      }
    }
    if (victim && w.tick > b.gankUntil) b.gankUntil = w.tick + secs(14);
    if (victim && w.tick < b.gankUntil) {
      b.state = 'Gank';
      orderAttack(w, u, victim);
      return true;
    }
  }
  const camps = ownCamps(w, u);
  if (!camps.length) return false;
  let best: CampState | null = null;
  let bd = 1e9;
  for (const c of camps) {
    const d = dist(c.def.x, c.def.y, u.x, u.y) + (c.def.type === 'brass' || c.def.type === 'mist' ? (h.level >= 3 ? -6 : 30) : 0);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  if (!best) return false;
  b.state = 'JungleCamp';
  const mon = best.units.map((id) => w.byId.get(id)).find((m) => m && m.alive && m.visUntil[u.team as 0 | 1] >= w.tick);
  if (mon && dist(mon.x, mon.y, u.x, u.y) < 9) orderAttack(w, u, mon);
  else orderMove(w, u, best.def.x + (u.team === 0 ? -1.5 : 1.5), best.def.y);
  return true;
}

/** RotateObjective: contest Catalysts / the Colossus when the team can afford to. */
function objectiveBehaviour(w: World, u: Unit, b: Brain, p: Percept): boolean {
  const h = u.hero!;
  if (p.hpPct < 0.55) {
    b.objective = -1;
    return false;
  }
  const mates = w.heroes.filter((a) => a.team === u.team && a.alive);
  const enemiesAlive = w.heroes.filter((a) => a.team !== u.team && a.alive).length;
  let pick: CampState | null = null;
  for (const c of w.camps) {
    if (!c.alive || !MONSTERS[c.def.type].big) continue;
    const d = dist(c.def.x, c.def.y, u.x, u.y);
    const committed = mates.filter((a) => a !== u && dist(a.x, a.y, c.def.x, c.def.y) < 14).length;
    if (c.def.type === 'colossus') {
      const ok = h.level >= 7 && mates.length >= 2 && (enemiesAlive <= 2 || committed >= 1) && d < 60;
      if (ok && (b.role === 'jungle' || committed >= 1 || enemiesAlive <= 1)) pick = c;
    } else {
      const ok = h.level >= 4 && d < 40 && (b.role === 'jungle' ? h.level >= 6 || committed >= 1 : committed >= 1 && d < 20);
      if (ok && !pick) pick = c;
    }
  }
  if (!pick) {
    b.objective = -1;
    return false;
  }
  b.objective = pick.def.id;
  b.state = 'RotateObjective';
  const mon = w.byId.get(pick.units[0]);
  if (mon && mon.alive && mon.visUntil[u.team as 0 | 1] >= w.tick && dist(mon.x, mon.y, u.x, u.y) < 10) orderAttack(w, u, mon);
  else orderMove(w, u, pick.def.x, pick.def.y + (u.y > pick.def.y ? 3 : -3));
  return true;
}

function wardBehaviour(w: World, u: Unit, P: (typeof PARAMS)[Difficulty]): void {
  const h = u.hero!;
  if (h.wardCharges <= 0 || P.lastHit < 0.8) return;
  for (const spot of WARD_SPOTS) {
    if (dist(spot.x, spot.y, u.x, u.y) > RULES.wardRange - 0.5) continue;
    const covered = w.teams[u.team as 0 | 1].wards.some((id) => {
      const wd = w.byId.get(id);
      return wd && wd.alive && dist(wd.x, wd.y, spot.x, spot.y) < 7;
    });
    if (!covered) {
      issue(w, u, { t: 'ward', x: spot.x, y: spot.y });
      return;
    }
  }
}

// ---- main entry -----------------------------------------------------------------------------

export function botThink(w: World, u: Unit): void {
  const h = u.hero!;
  let b = h.ai as Brain | null;
  if (!b) {
    b = initBrain(w, u);
    h.ai = b;
  }
  if (h.skillPts > 0) autoRank(w, u);
  if (w.tick < b.next) return;
  const P = PARAMS[w.config.difficulty];
  b.next = w.tick + P.think + (u.id % 3);
  if (!u.alive) {
    shop(w, u, b);
    b.retreat = false;
    b.shopTrip = false;
    b.lastTrip = w.tick;
    return;
  }
  if (inFountain(u)) {
    shop(w, u, b);
    if (b.shopTrip) {
      b.shopTrip = false;
      b.lastTrip = w.tick;
      if (u.hp / u.stats.maxHp > 0.8) b.retreat = false;
    }
  }
  const p = perceive(w, u);
  const team = u.team as 0 | 1;

  // Retreat / RecallBuy
  const outnumbered = p.enemies.reduce((a, e) => a + power(e), 0) > (power(u) + p.allies.reduce((a, e) => a + power(e), 0)) * 1.5;
  if (b.retreat) {
    if (p.hpPct > 0.85 && (p.manaPct > 0.5 || h.def.resource === 'Energy') && !b.shopTrip) b.retreat = false;
    else if (inFountain(u) && p.hpPct > 0.85) b.retreat = false;
  }
  if (!b.retreat && (p.hpPct < P.retreat || (p.hpPct < 0.5 && outnumbered))) b.retreat = true;
  if (!b.retreat && !inFountain(u)) {
    const want = nextItem(w, u, b);
    if (want && h.gold >= buyPlan(h.inv, want).cost + 40 && w.tick - b.lastTrip > secs(50) && !p.enemies.length && w.tick - u.lastCombat > secs(3)) {
      b.retreat = true;
      b.shopTrip = true;
    }
  }
  if (b.retreat) {
    useKit(w, u, b, p, P, pickFightTarget(u, p), true);
    retreat(w, u, b, p);
    return;
  }
  if (h.recallUntil > 0) issue(w, u, { t: 'stop' });

  wardBehaviour(w, u, P);

  // lane coverage: if the human is standing in my lane and the other lane is empty, swap
  if (b.role === 'lane' && w.tick % 5 === 0) {
    const human = w.heroes.find((a) => a.team === team && !a.hero!.bot && a.alive);
    if (human && distToLane(w, b.lane, human.x, human.y) < 9 && progress(team, human.x) > 38) {
      const other = 1 - b.lane;
      const otherCovered = w.heroes.some((a) => a !== u && a.team === team && a.hero!.bot && (a.hero!.ai as Brain | null)?.role === 'lane' && (a.hero!.ai as Brain).lane === other);
      if (!otherCovered && ++b.swapObs > 12) {
        b.lane = other;
        b.swapObs = 0;
      }
    } else b.swapObs = 0;
  }

  // fight target + ChaseLimited
  let foe = pickFightTarget(u, p);
  if (foe) {
    const underTower = p.tower && dist(p.tower.x, p.tower.y, foe.x, foe.y) < RULES.towerRange && minionsTanking(w, p.tower, team) < 2;
    const kill = foe.hp / foe.stats.maxHp < 0.2 && p.hpPct > 0.6 && P.dive;
    if (underTower && !kill) foe = dist(foe.x, foe.y, u.x, u.y) < u.stats.range + 1 && !towerUnsafe(w, u, p.tower, u.x, u.y) ? foe : null;
  }
  if (useKit(w, u, b, p, P, foe, false)) return;

  // TeamFight: help a nearby ally who is trading with a visible enemy hero, or finish a weak target
  const finish = !!foe && foe.hp / foe.stats.maxHp < 0.5 && p.hpPct > 0.4;
  if (foe && (finish || p.allies.some((a) => w.tick - a.lastCombat < 45) || w.tick - h.lastHurtByHeroTick < 45 || b.state === 'Gank')) {
    const mine = power(u) + p.allies.reduce((a, e) => a + power(e), 0);
    const theirs = p.enemies.reduce((a, e) => a + power(e), 0);
    if (mine >= theirs * 0.7 && !towerUnsafe(w, u, p.tower, foe.x, foe.y)) {
      if (b.chaseId !== foe.id) {
        b.chaseId = foe.id;
        b.chaseFrom = { x: u.x, y: u.y };
      }
      if (b.chaseFrom && dist(b.chaseFrom.x, b.chaseFrom.y, u.x, u.y) < 16) {
        b.state = 'TeamFight';
        orderAttack(w, u, foe);
        return;
      }
      b.state = 'ChaseLimited';
    }
  } else if (!foe) b.chaseId = 0;

  // Defend: a friendly structure under attack with nobody home
  if (w.tick % 3 === 0 || w.tick < b.defendUntil) {
    if (w.tick >= b.defendUntil) {
      b.defendPos = null;
      for (const s of w.structs) {
        if (s.team !== team || !s.alive || w.tick - s.lastCombat > 60) continue;
        const d = dist(s.x, s.y, u.x, u.y);
        if (d > 55 || d < 10) continue;
        const defenders = w.heroes.filter((a) => a.team === team && a.alive && a !== u && dist(a.x, a.y, s.x, s.y) < 12).length;
        const closer = w.heroes.some((a) => a.team === team && a.alive && a !== u && a.hero!.bot && dist(a.x, a.y, s.x, s.y) < d);
        if (defenders === 0 && !closer) {
          b.defendPos = { x: s.x + (team === 0 ? -2.5 : 2.5), y: s.y };
          b.defendUntil = w.tick + secs(8);
        }
      }
    }
    if (b.defendPos && w.tick < b.defendUntil) {
      if (dist(b.defendPos.x, b.defendPos.y, u.x, u.y) > 7) {
        b.state = 'Defend';
        orderMove(w, u, b.defendPos.x, b.defendPos.y);
        return;
      }
      b.defendUntil = 0;
    }
  }

  if (objectiveBehaviour(w, u, b, p)) return;

  if (b.role === 'jungle') {
    // late game the jungler groups with the lane that is pushing hardest
    const late = w.time > 420 / w.pace.clock;
    if (!late && jungleBehaviour(w, u, b, p)) return;
    const f0 = laneFront(w, team, 0).prog;
    const f1 = laneFront(w, team, 1).prog;
    b.lane = f0 > f1 + 6 ? 0 : 1;
  }
  laneBehaviour(w, u, b, p, P);
}

export function botState(u: Unit): string {
  return (u.hero?.ai as Brain | null)?.state ?? '';
}
