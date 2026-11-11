// server-simulation: hero state, command validation, orders, casting flow, recall, wards, shop.
// Bots and humans both drive heroes exclusively through `issue()` — same rules, same information.

import { HeroDef, MAX_BASIC_RANK, MAX_LEVEL, PASSIVE, ULT_LEVELS, XP_TABLE } from '../shared/heroes';
import { CONSUMABLE_STACK, INVENTORY_SLOTS, ITEMS, SELL_RATIO, TALENTS, buyPlan } from '../shared/items';
import { FOUNTAIN, FOUNTAIN_RADIUS } from '../shared/map';
import { Vec, dist, secs } from '../shared/math';
import { ANIM, Command, SeatConfig } from '../shared/protocol';
import { RULES } from '../shared/units';
import { ABILITIES } from './abilities';
import { addEffect, addShield, applyCC, cancelRecall, dealDamage, grantXp, hasEffect, heal, recalcStats, removeEffect, rooted, silenced, stunned, targetable } from './combat';
import { AbilityCtx, HeroState, Order, PURE, Unit } from './types';
import type { World } from './world';

export function makeHeroState(def: HeroDef, seat: SeatConfig, seatIdx: number, spawn: Vec): HeroState {
  return {
    heroId: def.id,
    def,
    name: seat.name,
    bot: seat.bot,
    seat: seatIdx,
    level: 1,
    xp: 0,
    gold: RULES.startGold,
    goldEarned: RULES.startGold,
    skillPts: 1,
    ranks: [0, 0, 0, 0],
    cdUntil: [0, 0, 0, 0, 0, 0],
    cdTotal: [1, 1, 1, 1, 1, 1],
    recast: [null, null, null, null],
    talents: seat.talents,
    inv: new Array(INVENTORY_SLOTS).fill(null),
    itemCd: {},
    wardCharges: RULES.wardCharges,
    wardNextAt: 0,
    order: { t: 'idle' },
    queuedOrder: null,
    pendingCast: null,
    casting: null,
    recallUntil: 0,
    recallStart: 0,
    respawnAt: 0,
    k: 0,
    d: 0,
    a: 0,
    cs: 0,
    streak: 0,
    deathStreak: 0,
    dmgLog: [],
    recap: null,
    dmgHeroes: 0,
    dmgStructs: 0,
    dmgTaken: 0,
    healing: 0,
    wardsPlaced: 0,
    objectives: 0,
    undo: [],
    p: {},
    attackCount: 0,
    spawn,
    repathAt: 0,
    stuckTicks: 0,
    castSeq: 0,
    refunded: -1,
    lastSeen: [
      { x: spawn.x, y: spawn.y },
      { x: spawn.x, y: spawn.y },
    ],
    ai: null,
    lastHurtByHero: 0,
    lastHurtByHeroTick: -9999,
    leftFountainSinceBuy: false,
  };
}

export const inFountain = (u: Unit): boolean => u.team < 2 && dist(u.x, u.y, FOUNTAIN[u.team].x, FOUNTAIN[u.team].y) <= FOUNTAIN_RADIUS;
export const canShop = (u: Unit): boolean => !u.alive || inFountain(u);

export function respawnHero(w: World, u: Unit): void {
  const h = u.hero!;
  u.alive = true;
  h.respawnAt = 0;
  u.x = h.spawn.x;
  u.y = h.spawn.y;
  u.effects = [];
  u.shields = [];
  u.path = null;
  u.dash = null;
  h.order = { t: 'idle' };
  recalcStats(w, u);
  u.hp = u.stats.maxHp;
  u.mana = u.stats.maxMana;
  u.lastCombat = -9999;
  w.fxAt('respawn', u.x, u.y, { id: u.id });
}

function reject(w: World, u: Unit, reason: string): string {
  w.emitHero({ e: 'reject', reason }, u.id);
  return reason;
}

// ---- per-tick upkeep ------------------------------------------------------------------------

export function heroPreTick(w: World, u: Unit): void {
  const h = u.hero!;
  const t = w.tick;
  const s = u.stats;
  u.hp = Math.min(s.maxHp, u.hp + s.hpRegen / 30);
  u.mana = Math.min(s.maxMana, u.mana + s.manaRegen / 30);
  if (inFountain(u)) {
    u.hp = Math.min(s.maxHp, u.hp + (s.maxHp * 0.14) / 30);
    u.mana = Math.min(s.maxMana, u.mana + (s.maxMana * 0.14) / 30);
  } else {
    if (h.undo.length) h.undo.length = 0;
    h.leftFountainSinceBuy = true;
    const ef = FOUNTAIN[1 - u.team];
    if (dist(u.x, u.y, ef.x, ef.y) < FOUNTAIN_RADIUS + 1) {
      dealDamage(w, w.structByKey.get(`t${1 - u.team}-engine`) ?? null, u, RULES.fountainDps / 30, PURE, { label: 'Fountain ward', basic: false });
      if (!u.alive) return;
    }
  }
  if (h.wardCharges < RULES.wardCharges && t >= h.wardNextAt) {
    h.wardCharges++;
    h.wardNextAt = t + secs(RULES.wardRecharge);
  }

  // --- passives ---
  const p = h.p;
  switch (h.heroId) {
    case 'suri': {
      const moved = Math.hypot(u.vx, u.vy) / 30;
      if (moved > 0.01 && !u.dash) p.charge = Math.min(1, (p.charge ?? 0) + moved / 8);
      break;
    }
    case 'vey': {
      const enemy = (1 - u.team) as 0 | 1;
      if (u.brush >= 0 || u.visUntil[enemy] < t) p.refractUntil = t + secs(4);
      if ((p.prismAt ?? 0) > 0 && t >= p.prismAt) {
        p.prismAt = 0;
        ABILITIES.prism_sentence.recast?.({ w, h: u, slot: 3, rank: p.prismRank, x: 0, y: 0, dx: 0, dy: 0, ang: 0, target: w.byId.get(p.prismTarget) ?? null, castId: p.prismCast });
      }
      break;
    }
    case 'brannoch': {
      let near = false;
      for (const e of w.heroes) if (e.alive && e.team !== u.team && dist(e.x, e.y, u.x, u.y) <= 6) near = true;
      if (near) {
        p.near = (p.near ?? 0) + 1;
        p.lastNear = t;
        if (p.near >= 90 && (p.near - 90) % 45 === 0) p.stacks = Math.min(4, (p.stacks ?? 0) + 1);
      } else if (t - (p.lastNear ?? 0) > 90) {
        p.near = 0;
        p.stacks = 0;
      }
      if ((p.stacks ?? 0) > 0) {
        removeEffect(u, 'resist', -4);
        addEffect(w, u, 'resist', 3, p.stacks * PASSIVE.brannochStack(h.level), -4);
      }
      break;
    }
    case 'kesh': {
      if ((p.bogEnd ?? 0) > 0 && t >= p.bogEnd) {
        p.bogEnd = 0;
        const slow = 0.2 + Math.min(0.4, ((p.bogAbsorb ?? 0) / (s.maxHp * 0.25)) * 0.4);
        w.fxAt('ring', u.x, u.y, { r: 4, c: 0x7fbf5a });
        for (const e of w.enemiesIn(u.team, u.x, u.y, 4)) applyCC(w, u, e, 'slow', 2, slow);
      }
      break;
    }
  }

  // recast windows
  for (let i = 0; i < 4; i++) {
    const rc = h.recast[i];
    if (rc && t >= rc.until) h.recast[i] = null;
  }

  if (h.recallUntil > 0 && t >= h.recallUntil) {
    h.recallUntil = 0;
    w.fxAt('respawn', u.x, u.y, {});
    w.fxAt('respawn', h.spawn.x, h.spawn.y, { id: u.id });
    u.x = h.spawn.x;
    u.y = h.spawn.y;
    u.path = null;
    h.order = { t: 'idle' };
    w.tut(u, 'recall');
  }

  if (h.casting && t >= h.casting.until) {
    const c = h.casting;
    h.casting = null;
    c.fire();
    if (h.queuedOrder) {
      const q = h.queuedOrder;
      h.queuedOrder = null;
      setOrder(w, u, q);
    }
  }
}

// ---- orders ---------------------------------------------------------------------------------

export function setOrder(w: World, u: Unit, order: Order): void {
  const h = u.hero!;
  cancelRecall(w, u);
  h.pendingCast = null;
  if (h.casting) {
    h.queuedOrder = order;
    return;
  }
  if (u.windupUntil > 0) {
    // moving before release cancels the attack (and refunds it); after release only the backswing
    u.windupUntil = 0;
    u.attackReadyAt = w.tick;
  }
  h.order = order;
  h.repathAt = 0;
  h.stuckTicks = 0;
  u.path = null;
  if (order.t === 'move' || order.t === 'amove') {
    u.path = w.pathFor(u, order.x, order.y);
    u.pathI = 0;
    h.repathAt = w.tick + 20;
  }
}

function approach(w: World, u: Unit, tx: number, ty: number): void {
  const h = u.hero!;
  if (!u.path || w.tick >= h.repathAt) {
    u.path = w.pathFor(u, tx, ty);
    u.pathI = 0;
    h.repathAt = w.tick + 9;
  }
  walk(w, u);
}

/** Advance along the current path with stuck detection (dynamic walls, shoved units). */
function walk(w: World, u: Unit): boolean {
  const h = u.hero!;
  if (rooted(u)) {
    w.loco(u, false);
    return false;
  }
  const bx = u.x;
  const by = u.y;
  const done = w.followPath(u);
  w.loco(u, !done);
  if (!done && dist(bx, by, u.x, u.y) < u.stats.speed / 30 / 3) {
    if (++h.stuckTicks > 5) {
      h.stuckTicks = 0;
      u.path = null; // forces a replan
    }
  } else h.stuckTicks = 0;
  return done;
}

function attackOrApproach(w: World, u: Unit, t: Unit): void {
  if (w.inRange(u, t)) {
    u.path = null;
    w.attackStep(u, t);
    w.loco(u, false);
  } else {
    if (u.windupUntil > 0) {
      u.windupUntil = 0;
      u.attackReadyAt = w.tick;
    }
    approach(w, u, t.x, t.y);
  }
}

export function heroBrain(w: World, u: Unit): void {
  const h = u.hero!;
  if (h.casting || h.recallUntil > 0) return;
  if (h.pendingCast) {
    const pc = h.pendingCast;
    const t = w.byId.get(pc.id);
    const def = h.def.abilities[pc.slot];
    if (!t || !t.alive || (t.team !== u.team && !targetable(w, t, u.team))) {
      h.pendingCast = null;
    } else if (dist(u.x, u.y, t.x, t.y) <= def.range + t.radius) {
      h.pendingCast = null;
      u.path = null;
      tryCast(w, u, pc.slot, t.x, t.y, t.id);
      return;
    } else {
      approach(w, u, t.x, t.y);
      return;
    }
  }
  const o = h.order;
  switch (o.t) {
    case 'move': {
      if (!u.path) {
        if (dist(u.x, u.y, o.x, o.y) < 0.6) {
          h.order = { t: 'idle' };
          w.loco(u, false);
          return;
        }
        u.path = w.pathFor(u, o.x, o.y);
        u.pathI = 0;
        if (!u.path.length) {
          h.order = { t: 'idle' };
          u.path = null;
          return;
        }
      }
      if (walk(w, u)) h.order = { t: 'idle' };
      return;
    }
    case 'attack': {
      const t = w.byId.get(o.id);
      if (!targetable(w, t, u.team)) {
        h.order = { t: 'idle' };
        u.windupUntil = 0;
        w.loco(u, false);
        return;
      }
      if (o.auto && !w.inRange(u, t, 3.5)) {
        h.order = { t: 'idle' };
        return;
      }
      attackOrApproach(w, u, t);
      return;
    }
    case 'amove': {
      let t = o.tgt ? w.byId.get(o.tgt) : undefined;
      if (!targetable(w, t, u.team) || !w.inRange(u, t, 5)) {
        o.tgt = 0;
        t = undefined;
        if ((w.tick + u.id) % 5 === 0) {
          const found = w.nearestEnemy(u.team, u.x, u.y, Math.max(u.stats.range + 2.5, 7), (e) => e.kind !== 'ward' && (e.kind !== 'monster' || e.npc?.aggroId === u.id));
          if (found) {
            o.tgt = found.id;
            t = found;
            u.path = null;
          }
        }
      }
      if (t) {
        attackOrApproach(w, u, t);
        return;
      }
      if (!u.path) {
        if (dist(u.x, u.y, o.x, o.y) < 0.8) {
          h.order = { t: 'idle' };
          return;
        }
        u.path = w.pathFor(u, o.x, o.y);
        u.pathI = 0;
        if (!u.path.length) {
          h.order = { t: 'idle' };
          u.path = null;
          return;
        }
      }
      if (walk(w, u)) h.order = { t: 'idle' };
      return;
    }
    case 'hold':
    case 'idle': {
      w.loco(u, false);
      if ((w.tick + u.id) % 6 !== 0) {
        const cur = u.attackTarget ? w.byId.get(u.attackTarget) : undefined;
        if (o.t === 'hold' && targetable(w, cur, u.team) && w.inRange(u, cur)) w.attackStep(u, cur);
        return;
      }
      const reach = o.t === 'hold' ? 0 : 1;
      const found = w.nearestEnemy(u.team, u.x, u.y, u.stats.range + reach, (e) => {
        if (e.struct || e.kind === 'ward') return false;
        if (e.kind === 'monster') return e.npc?.aggroId === u.id;
        if (e.hero) return o.t === 'hold' || (h.lastHurtByHero === e.id && w.tick - h.lastHurtByHeroTick < secs(3));
        return true;
      });
      if (!found) {
        u.attackTarget = 0;
        return;
      }
      if (o.t === 'hold') {
        u.attackTarget = found.id;
        if (w.inRange(u, found)) w.attackStep(u, found);
      } else {
        h.order = { t: 'attack', id: found.id, auto: true };
      }
      return;
    }
  }
}

// ---- casting --------------------------------------------------------------------------------

export function cooldownTicks(u: Unit, seconds: number): number {
  return Math.max(1, secs((seconds * 100) / (100 + u.stats.haste)));
}

function pickUnit(w: World, u: Unit, filter: 'enemy' | 'enemyHero' | 'ally', x: number, y: number, id: number | undefined, range: number): Unit | null {
  const ok = (t: Unit | undefined): t is Unit => {
    if (!t || !t.alive) return false;
    if (filter === 'ally') return t.team === u.team && !!t.hero;
    if (!targetable(w, t, u.team) || t.struct || t.kind === 'ward') return false;
    return filter !== 'enemyHero' || !!t.hero;
  };
  const direct = id ? w.byId.get(id) : undefined;
  if (ok(direct)) return direct;
  let best: Unit | null = null;
  let bd = filter === 'ally' ? 3.5 : 2.8;
  const list = filter === 'ally' ? w.heroes : w.units;
  for (const t of list) {
    if (!ok(t)) continue;
    const d = dist(t.x, t.y, x, y) - t.radius;
    // prefer heroes under the cursor
    const score = d - (t.hero ? 0.8 : 0);
    if (score < bd && dist(u.x, u.y, t.x, t.y) <= range + 8) {
      bd = score;
      best = t;
    }
  }
  if (!best && filter === 'ally') return u;
  return best;
}

export function tryCast(w: World, u: Unit, slot: number, x: number, y: number, id?: number): string | null {
  const h = u.hero!;
  if (!u.alive) return 'Dead';
  if (slot >= 4) return castTalent(w, u, slot, x, y, id);
  const def = h.def.abilities[slot];
  const rank = h.ranks[slot];
  if (rank <= 0) return reject(w, u, 'Ability not learned yet');
  if (stunned(u)) return reject(w, u, 'Stunned');
  if (silenced(u)) return reject(w, u, 'Silenced');
  if (h.casting || u.dash) return 'Busy';
  const impl = ABILITIES[def.id];
  const mk = (target: Unit | null, tx: number, ty: number): AbilityCtx => {
    let dx = tx - u.x;
    let dy = ty - u.y;
    const l = Math.hypot(dx, dy);
    if (l < 0.05) {
      dx = Math.cos(u.facing);
      dy = Math.sin(u.facing);
    } else {
      dx /= l;
      dy /= l;
    }
    return { w, h: u, slot, rank, x: tx, y: ty, dx, dy, ang: Math.atan2(dy, dx), target, castId: w.nextCastId() };
  };
  if (h.recast[slot] && impl.recast) {
    impl.recast(mk(null, x, y));
    return null;
  }
  if (w.tick < h.cdUntil[slot]) return reject(w, u, 'On cooldown');
  const cost = def.cost[Math.min(def.cost.length - 1, rank - 1)];
  if (u.mana < cost) return reject(w, u, `Not enough ${h.def.resource.toLowerCase()}`);
  if (rooted(u) && (def.id === 'slipstream' || def.id === 'sinkstep' || def.id === 'shardstep' || def.id === 'citybreaker' || def.id === 'anchor_line')) return reject(w, u, 'Rooted');

  let target: Unit | null = null;
  let tx = x;
  let ty = y;
  if (def.target === 'unit' || def.target === 'ally') {
    target = pickUnit(w, u, def.unitFilter ?? 'enemy', x, y, id, def.range);
    if (!target) return reject(w, u, 'No valid target');
    if (dist(u.x, u.y, target.x, target.y) > def.range + target.radius) {
      if (target === u) return 'self';
      h.pendingCast = { slot, id: target.id };
      h.order = { t: 'idle' };
      u.path = null;
      return null;
    }
    tx = target.x;
    ty = target.y;
  } else if (def.target === 'point') {
    const d = dist(u.x, u.y, x, y);
    if (d > def.range) {
      tx = u.x + ((x - u.x) / d) * def.range;
      ty = u.y + ((y - u.y) / d) * def.range;
    }
  } else if (def.target === 'self') {
    tx = u.x + Math.cos(u.facing);
    ty = u.y + Math.sin(u.facing);
  }
  const ctx = mk(target, tx, ty);
  const err = impl.check?.(ctx);
  if (err) return reject(w, u, err);

  u.mana -= cost;
  const cd = cooldownTicks(u, def.cd[Math.min(def.cd.length - 1, rank - 1)]);
  h.cdUntil[slot] = w.tick + cd;
  h.cdTotal[slot] = cd;
  h.castSeq++;
  cancelRecall(w, u);
  if (u.windupUntil > 0) {
    u.windupUntil = 0;
    u.attackReadyAt = w.tick;
  }
  u.path = null;
  h.repathAt = 0;
  if (def.target !== 'self') u.facing = ctx.ang;
  h.undo.length = 0;
  w.emitPos({ e: 'cast', id: u.id, slot, hero: h.heroId, x: u.x, y: u.y, name: def.name }, u.x, u.y);
  w.tut(u, 'cast');
  const castTicks = secs(def.castTime);
  w.setAnim(u, ANIM.cast0 + slot, Math.max(10, castTicks + 6));
  impl.begin?.(ctx);
  if (castTicks > 0) h.casting = { slot, until: w.tick + castTicks, start: w.tick, fire: () => impl.fire(ctx) };
  else impl.fire(ctx);
  return null;
}

function castTalent(w: World, u: Unit, slot: number, x: number, y: number, id?: number): string | null {
  const h = u.hero!;
  const tid = h.talents[slot - 4];
  const def = TALENTS[tid];
  if (!def) return 'none';
  if (w.tick < h.cdUntil[slot]) return reject(w, u, 'On cooldown');
  if (stunned(u)) return reject(w, u, 'Stunned');
  if (h.casting || u.dash) return 'Busy';
  switch (tid) {
    case 'skyhop': {
      if (rooted(u)) return reject(w, u, 'Rooted');
      let tx = x;
      let ty = y;
      const d = dist(u.x, u.y, x, y);
      if (d > def.range) {
        tx = u.x + ((x - u.x) / d) * def.range;
        ty = u.y + ((y - u.y) / d) * def.range;
      }
      const end = w.throughEnd(u.x, u.y, tx, ty);
      w.fxAt('blink', u.x, u.y, { x2: end.x, y2: end.y, c: def.color });
      u.x = end.x;
      u.y = end.y;
      u.path = null;
      cancelRecall(w, u);
      break;
    }
    case 'mend': {
      const amount = 90 + 15 * h.level;
      heal(w, u, u, amount);
      let best: Unit | null = null;
      let bd = def.range;
      for (const a of w.heroes) {
        if (a === u || !a.alive || a.team !== u.team) continue;
        const d = dist(a.x, a.y, u.x, u.y);
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      if (best) heal(w, u, best, amount);
      w.fxAt('ring', u.x, u.y, { r: 2.5, c: def.color });
      break;
    }
    case 'bulwark':
      addShield(w, u, u, 110 + 20 * h.level, 3);
      break;
    case 'surge':
      addEffect(w, u, 'speed', secs(3), 0.35, -6);
      w.fxAt('ring', u.x, u.y, { r: 1.5, c: def.color });
      break;
    case 'smolder':
    case 'sunder': {
      const t = pickUnit(w, u, tid === 'smolder' ? 'enemyHero' : 'enemy', x, y, id, def.range);
      if (!t || (tid === 'sunder' && (t.hero || t.kind === 'decoy'))) return reject(w, u, tid === 'smolder' ? 'Needs an enemy hero' : 'Needs a minion or monster');
      if (dist(u.x, u.y, t.x, t.y) > def.range + t.radius) return reject(w, u, 'Out of range');
      if (tid === 'smolder') {
        addEffect(w, t, 'dotp', secs(4), (80 + 20 * h.level) / 4, u.id);
        addEffect(w, t, 'reveal', secs(4), 0, u.id);
        w.heroAggro(u, t);
      } else {
        dealDamage(w, u, t, 300 + 40 * h.level, PURE, { label: 'Sunder' });
      }
      w.fxAt('line', u.x, u.y, { x2: t.x, y2: t.y, c: def.color });
      w.fxAt('burst', t.x, t.y, { r: 1.2, c: def.color });
      break;
    }
  }
  const cd = secs(def.cd / (w.pace.clock > 1 ? 1.3 : 1));
  h.cdUntil[slot] = w.tick + cd;
  h.cdTotal[slot] = cd;
  w.emitPos({ e: 'cast', id: u.id, slot, hero: h.heroId, x: u.x, y: u.y, name: def.name }, u.x, u.y);
  return null;
}

function useItem(w: World, u: Unit, slot: number): string | null {
  const h = u.hero!;
  const s = h.inv[slot];
  if (!s) return 'empty';
  const def = ITEMS[s.id];
  if (!def.active) return 'passive';
  if ((h.itemCd[s.id] ?? 0) > w.tick) return reject(w, u, 'Item on cooldown');
  switch (s.id) {
    case 'amber_draught':
      if (hasEffect(u, 'hot')) return reject(w, u, 'Already drinking');
      addEffect(w, u, 'hot', secs(8), 140 / 8, -8);
      break;
    case 'spark_phial':
      if (hasEffect(u, 'mot')) return reject(w, u, 'Already drinking');
      addEffect(w, u, 'mot', secs(8), 110 / 8, -8);
      break;
    case 'null_bell': {
      const cleanse = (t: Unit): void => {
        t.effects = t.effects.filter((e) => !['stun', 'root', 'slow', 'silence'].includes(e.type));
        w.fxAt('ring', t.x, t.y, { r: 1.6, c: 0xfff2b0 });
      };
      cleanse(u);
      let best: Unit | null = null;
      let bd = 6;
      for (const a of w.heroes) {
        if (a === u || !a.alive || a.team !== u.team) continue;
        const d = dist(a.x, a.y, u.x, u.y);
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      if (best) cleanse(best);
      break;
    }
    default:
      return 'none';
  }
  h.itemCd[s.id] = w.tick + secs(def.active.cd);
  h.undo.length = 0;
  if (def.tier === 'consumable') {
    s.n--;
    if (s.n <= 0) h.inv[slot] = null;
  }
  return null;
}

function placeWard(w: World, u: Unit, x: number, y: number): string | null {
  const h = u.hero!;
  if (h.wardCharges <= 0) return reject(w, u, 'No ward charges');
  if (stunned(u)) return reject(w, u, 'Stunned');
  let tx = x;
  let ty = y;
  const d = dist(u.x, u.y, x, y);
  if (d > RULES.wardRange) {
    tx = u.x + ((x - u.x) / d) * RULES.wardRange;
    ty = u.y + ((y - u.y) / d) * RULES.wardRange;
  }
  const p = w.map.sdf(tx, ty) < -0.3 ? { x: tx, y: ty } : w.map.nearestWalkable(tx, ty);
  if (dist(p.x, p.y, u.x, u.y) > RULES.wardRange + 2.5) return reject(w, u, 'Cannot place a ward there');
  if (h.wardCharges === RULES.wardCharges) h.wardNextAt = w.tick + secs(RULES.wardRecharge);
  h.wardCharges--;
  h.wardsPlaced++;
  const ward = w.makeUnit('ward', 'ward', u.team, p.x, p.y, 0.4);
  ward.stats.maxHp = 3;
  ward.hp = 3;
  ward.vision = RULES.wardVision;
  ward.expireAt = w.tick + secs(RULES.wardDuration);
  ward.owner = u.id;
  const tw = w.teams[u.team as 0 | 1].wards;
  tw.push(ward.id);
  if (tw.length > RULES.wardCapPerTeam) {
    const old = w.byId.get(tw.shift() as number);
    if (old) old.expireAt = w.tick; // team ward cap: oldest ward fades
  }
  w.fxAt('ring', p.x, p.y, { r: 1.2, c: 0xffe9a0 });
  w.tut(u, 'ward');
  return null;
}

export function rankUp(w: World, u: Unit, slot: number): string | null {
  const h = u.hero!;
  if (h.skillPts <= 0 || slot < 0 || slot > 3) return 'none';
  if (slot === 3) {
    const allowed = ULT_LEVELS.filter((l) => h.level >= l).length;
    if (h.ranks[3] >= allowed) return reject(w, u, `Ultimate unlocks at levels ${ULT_LEVELS.join(' and ')}`);
  } else {
    if (h.ranks[slot] >= MAX_BASIC_RANK) return reject(w, u, 'Already at max rank');
    if (h.ranks[slot] >= Math.ceil(h.level / 2)) return reject(w, u, 'Requires a higher hero level');
  }
  h.ranks[slot]++;
  h.skillPts--;
  w.tut(u, 'rank');
  return null;
}

// ---- shop -----------------------------------------------------------------------------------

export function buyItem(w: World, u: Unit, id: string): string | null {
  const h = u.hero!;
  const def = ITEMS[id];
  if (!def) return 'unknown';
  if (!canShop(u)) return reject(w, u, 'Return to the fountain to shop');
  const { cost, consume } = buyPlan(h.inv, id);
  if (h.gold < cost) return reject(w, u, `Need ${Math.ceil(cost - h.gold)} more gold`);
  if (def.tier === 'starter' && h.inv.some((s) => s && ITEMS[s.id].tier === 'starter')) return reject(w, u, 'Only one starter item');
  if (def.tier === 'boots' && h.inv.some((s) => s && ITEMS[s.id].tier === 'boots')) return reject(w, u, 'Only one pair of upgraded boots');
  const snapshot = h.inv.map((s) => (s ? { ...s } : null));
  const goldBefore = h.gold;
  const inv = h.inv;
  if (def.tier === 'consumable') {
    const stack = inv.find((s) => s && s.id === id && s.n < CONSUMABLE_STACK);
    if (stack) stack.n++;
    else {
      const free = inv.indexOf(null);
      if (free < 0) return reject(w, u, 'Inventory full');
      inv[free] = { id, n: 1 };
    }
  } else {
    const freeAfter = inv.filter((s, i) => !s || consume.includes(i)).length;
    if (freeAfter <= 0) return reject(w, u, 'Inventory full');
    for (const i of consume) inv[i] = null;
    // place where the first component was, else first free slot
    const at = consume.length ? Math.min(...consume) : inv.indexOf(null);
    inv[at] = { id, n: 1 };
  }
  h.gold -= cost;
  h.undo.push({ kind: 'buy', inv: snapshot, gold: goldBefore });
  h.leftFountainSinceBuy = false;
  recalcStats(w, u);
  w.emitHero({ e: 'bought', item: id }, u.id);
  w.tut(u, 'buy');
  return null;
}

export function sellItem(w: World, u: Unit, slot: number): string | null {
  const h = u.hero!;
  const s = h.inv[slot];
  if (!s) return 'empty';
  if (!canShop(u)) return reject(w, u, 'Return to the fountain to sell');
  const snapshot = h.inv.map((x) => (x ? { ...x } : null));
  const goldBefore = h.gold;
  h.gold += Math.round(ITEMS[s.id].cost * s.n * SELL_RATIO);
  h.inv[slot] = null;
  h.undo.push({ kind: 'sell', inv: snapshot, gold: goldBefore });
  recalcStats(w, u);
  return null;
}

export function undoShop(w: World, u: Unit): string | null {
  const h = u.hero!;
  const e = h.undo.pop();
  if (!e) return reject(w, u, 'Nothing to undo');
  // passive income earned since the purchase is kept
  const delta = e.gold - h.gold;
  h.inv = e.inv;
  h.gold += delta;
  recalcStats(w, u);
  return null;
}

// ---- command entry point --------------------------------------------------------------------

export function issue(w: World, u: Unit, cmd: Command): string | null {
  const h = u.hero;
  if (!h || w.over) return 'over';
  switch (cmd.t) {
    case 'buy':
      return buyItem(w, u, cmd.item);
    case 'sell':
      return sellItem(w, u, cmd.slot);
    case 'undo':
      return undoShop(w, u);
    case 'rank':
      return rankUp(w, u, cmd.slot);
    case 'ping':
      if (w.tick < (h.p.pingAt ?? 0)) return 'rate';
      h.p.pingAt = w.tick + 20;
      w.emitTeam({ e: 'ping', kind: cmd.kind, x: cmd.x, y: cmd.y, by: h.name }, u.team);
      return null;
    case 'cheat': {
      if (w.config.mode !== 'practice') return 'not allowed';
      if (cmd.kind === 'gold') h.gold += 1000;
      else if (cmd.kind === 'level' && h.level < MAX_LEVEL) grantXp(w, u, XP_TABLE[h.level] - h.xp);
      else if (cmd.kind === 'refresh') h.cdUntil = h.cdUntil.map(() => 0);
      else if (cmd.kind === 'heal' && u.alive) {
        u.hp = u.stats.maxHp;
        u.mana = u.stats.maxMana;
      }
      return null;
    }
  }
  if (!u.alive) return 'dead';
  // finite, in-bounds coordinates only — never trust client transforms
  if ('x' in cmd && !(Number.isFinite(cmd.x) && Number.isFinite(cmd.y))) return 'bad';
  switch (cmd.t) {
    case 'move':
      setOrder(w, u, { t: 'move', x: cmd.x, y: cmd.y });
      w.tut(u, 'move');
      return null;
    case 'amove':
      setOrder(w, u, { t: 'amove', x: cmd.x, y: cmd.y, tgt: 0 });
      return null;
    case 'attack': {
      const t = w.byId.get(cmd.id);
      const isStruct = !!t?.struct;
      if (!targetable(w, t, u.team)) return reject(w, u, isStruct ? 'That structure is protected' : 'Invalid target');
      setOrder(w, u, { t: 'attack', id: cmd.id });
      return null;
    }
    case 'stop':
      setOrder(w, u, { t: 'idle' });
      return null;
    case 'hold':
      setOrder(w, u, { t: 'hold' });
      return null;
    case 'cast':
      return tryCast(w, u, cmd.slot, cmd.x, cmd.y, cmd.id);
    case 'item':
      return useItem(w, u, cmd.slot);
    case 'ward':
      return placeWard(w, u, cmd.x, cmd.y);
    case 'recall': {
      if (h.recallUntil > 0 || h.casting || stunned(u)) return 'busy';
      setOrder(w, u, { t: 'idle' });
      const dur = secs(w.teamBuff(u.team, 'colossus') ? RULES.recallTimeBuffed : RULES.recallTime);
      h.recallUntil = w.tick + dur;
      h.recallStart = w.tick;
      w.setAnim(u, ANIM.recall, dur);
      return null;
    }
  }
  return null;
}
