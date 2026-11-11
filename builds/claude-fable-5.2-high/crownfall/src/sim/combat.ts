// server-simulation: stats, status effects, damage, healing, shields, kills and rewards.

import { MAX_LEVEL, PASSIVE, XP_TABLE } from '../shared/heroes';
import { ITEMS } from '../shared/items';
import { dist, secs } from '../shared/math';
import { MINIONS, MONSTERS, RULES, STRUCTS, TEAM_NAMES } from '../shared/units';
import { ARCANE, DamageOpts, DamageType, Effect, PHYS, PURE, Unit } from './types';
import type { World } from './world';

// ---- effects --------------------------------------------------------------------------------

export function hasEffect(u: Unit, type: string): boolean {
  for (let i = 0; i < u.effects.length; i++) if (u.effects[i].type === type) return true;
  return false;
}
export function getEffect(u: Unit, type: string): Effect | undefined {
  let best: Effect | undefined;
  for (const e of u.effects) if (e.type === type && (!best || e.value > best.value)) best = e;
  return best;
}
export function removeEffect(u: Unit, type: string, src = 0): void {
  u.effects = u.effects.filter((e) => !(e.type === type && (src === 0 || e.src === src)));
}
export function addEffect(w: World, u: Unit, type: string, durTicks: number, value = 0, src = 0): Effect {
  const until = w.tick + durTicks;
  for (const e of u.effects) {
    if (e.type === type && e.src === src) {
      e.until = Math.max(e.until, until);
      e.value = Math.max(e.value, value);
      e.total = Math.max(e.total, durTicks);
      return e;
    }
  }
  const e: Effect = { type, until, value, src, total: durTicks };
  u.effects.push(e);
  return e;
}

const HARD_CC = new Set(['stun', 'root', 'airborne', 'silence']);

/** Crowd control with immunity rules. Returns true if applied. */
export function applyCC(w: World, src: Unit | null, tgt: Unit, type: 'stun' | 'root' | 'slow' | 'silence' | 'airborne', seconds: number, value = 0): boolean {
  if (!tgt.alive || tgt.struct || tgt.kind === 'ward' || tgt.kind === 'decoy') return false;
  const big = tgt.kind === 'monster' && (MONSTERS[tgt.sub]?.big ?? false);
  if (big && HARD_CC.has(type)) return false;
  if (type === 'slow') {
    if (big) value *= 0.5;
    if (tgt.hero && hasItem(tgt, 'ironroot_greaves')) value *= 0.75;
  }
  addEffect(w, tgt, type, secs(seconds), value, src ? src.id : 0);
  if (type === 'stun' || type === 'airborne') {
    tgt.windupUntil = 0;
    tgt.path = null;
    if (tgt.hero) {
      tgt.hero.casting = null;
      cancelRecall(w, tgt);
    }
  }
  if (type === 'root' && tgt.hero) cancelRecall(w, tgt);
  return true;
}

export function cancelRecall(w: World, u: Unit): void {
  if (u.hero && u.hero.recallUntil > 0) {
    u.hero.recallUntil = 0;
    w.fxAt('recallCancel', u.x, u.y, { id: u.id });
  }
}

export const stunned = (u: Unit): boolean => hasEffect(u, 'stun') || hasEffect(u, 'airborne');
export const rooted = (u: Unit): boolean => hasEffect(u, 'root');
export const silenced = (u: Unit): boolean => hasEffect(u, 'silence');

export function hasItem(u: Unit, id: string): boolean {
  const inv = u.hero?.inv;
  if (!inv) return false;
  for (let i = 0; i < inv.length; i++) if (inv[i]?.id === id) return true;
  return false;
}

export function totalShield(u: Unit): number {
  let s = 0;
  for (const sh of u.shields) s += sh.amount;
  return s;
}

// ---- stats ----------------------------------------------------------------------------------

export function recalcStats(w: World, u: Unit): void {
  const s = u.stats;
  let slow = 0;
  let speedUp = 0;
  let asUp = 0;
  let armorUp = 0;
  let wardUp = 0;
  let adUp = 0;
  for (let i = 0; i < u.effects.length; i++) {
    const e = u.effects[i];
    switch (e.type) {
      case 'slow':
        if (e.value > slow) slow = e.value;
        break;
      case 'speed':
        speedUp += e.value;
        break;
      case 'as':
        asUp += e.value;
        break;
      case 'resist':
        armorUp += e.value;
        wardUp += e.value;
        break;
      case 'armor':
        armorUp += e.value;
        break;
      case 'ad':
        adUp += e.value;
        break;
    }
  }
  const prevMax = s.maxHp;
  const prevMana = s.maxMana;
  if (u.hero) {
    const h = u.hero;
    const b = h.def.base;
    const L = h.level - 1;
    let hp = b.hp + b.hpPer * L;
    let mana = b.mana + b.manaPer * L;
    let hpRegen = b.hpRegen + 0.12 * L;
    let manaRegen = b.manaRegen + (h.def.resource === 'Energy' ? 0 : 0.1 * L);
    let ad = b.ad + b.adPer * L + adUp;
    let ap = 0;
    let asPct = b.asPer * L + asUp;
    let armor = b.armor + b.armorPer * L + armorUp;
    let ward = b.ward + b.wardPer * L + wardUp;
    let speed = b.speed;
    let haste = 0;
    let crit = 0;
    let armorPen = 0;
    let wardPen = 0;
    let lifesteal = 0;
    let healPower = 0;
    for (let i = 0; i < h.inv.length; i++) {
      const slot = h.inv[i];
      if (!slot) continue;
      const st = ITEMS[slot.id].stats;
      hp += st.hp ?? 0;
      mana += h.def.resource === 'Energy' ? 0 : (st.mana ?? 0);
      hpRegen += st.hpRegen ?? 0;
      manaRegen += h.def.resource === 'Energy' ? 0 : (st.manaRegen ?? 0);
      ad += st.ad ?? 0;
      ap += st.ap ?? 0;
      asPct += st.as ?? 0;
      armor += st.armor ?? 0;
      ward += st.ward ?? 0;
      speed += st.speed ?? 0;
      haste += st.haste ?? 0;
      crit += st.crit ?? 0;
      armorPen = Math.max(armorPen, st.armorPen ?? 0);
      wardPen = Math.max(wardPen, st.wardPen ?? 0);
      lifesteal += st.lifesteal ?? 0;
      healPower += st.healPower ?? 0;
    }
    const ooc = w.tick - u.lastCombat > secs(5);
    if (ooc) {
      if (w.teamBuff(u.team, 'gale')) speedUp += 0.12;
      if (hasItem(u, 'riverglass_boots')) speedUp += w.map.inRiver(u.x, u.y) ? 0.2 : 0.06;
      if (hasItem(u, 'stonewake_girdle')) hpRegen += hp * 0.015;
    }
    if (hasEffect(u, 'buff_mist')) {
      haste += 10;
      manaRegen += 4;
    }
    s.maxHp = hp;
    s.maxMana = mana;
    s.hpRegen = hpRegen;
    s.manaRegen = manaRegen;
    s.ad = ad;
    s.ap = ap;
    s.as = Math.min(2.5, b.as * (1 + asPct / 100));
    s.armor = armor;
    s.ward = ward;
    s.speed = Math.max(1.2, speed * (1 + Math.min(0.9, speedUp)) * (1 - Math.min(0.85, slow)));
    s.haste = haste;
    s.crit = Math.min(100, crit);
    s.armorPen = armorPen;
    s.wardPen = wardPen;
    s.lifesteal = lifesteal;
    s.healPower = healPower;
    s.range = b.range;
  } else if (u.npc) {
    const d = u.npc.def;
    s.speed = Math.max(0.8, d.speed * (1 + Math.min(0.9, speedUp)) * (1 - Math.min(0.85, slow)));
    s.as = d.as * (1 + asUp / 100);
    s.armor = d.armor + armorUp;
    s.ward = d.ward + wardUp;
  }
  if (s.maxHp > prevMax && prevMax > 0 && u.alive) u.hp += s.maxHp - prevMax;
  if (s.maxMana > prevMana && prevMana > 0 && u.alive) u.mana += s.maxMana - prevMana;
  if (u.hp > s.maxHp) u.hp = s.maxHp;
  if (u.mana > s.maxMana) u.mana = s.maxMana;
}

// ---- structures -----------------------------------------------------------------------------

export function anySealDown(w: World, team: number): boolean {
  for (const s of w.structs) if (s.team === team && s.kind === 'seal' && !s.alive) return true;
  return false;
}

export function structVulnerable(w: World, s: Unit): boolean {
  const st = s.struct;
  if (!st) return true;
  const key = st.def.key;
  const pre = key.slice(0, key.lastIndexOf('-'));
  const dead = (k: string): boolean => {
    const u = w.structByKey.get(k);
    return !u || !u.alive;
  };
  switch (st.def.tier) {
    case 'outer':
      return true;
    case 'inner':
      return dead(`${pre}-outer`);
    case 'guard':
      return dead(`${pre}-inner`);
    case 'seal':
      return dead(`${pre}-guard`);
    case 'core':
      return anySealDown(w, s.team);
    case 'engine':
      return anySealDown(w, s.team) && dead(`t${s.team}-core-a`) && dead(`t${s.team}-core-b`);
  }
  return true;
}

/** Can `byTeam` legally target `u` right now (alive, visible, not gated)? */
export function targetable(w: World, u: Unit | undefined, byTeam: number): u is Unit {
  if (!u || !u.alive) return false;
  if (u.team === byTeam) return false;
  if (u.struct) return structVulnerable(w, u);
  if (byTeam < 2 && u.visUntil[byTeam as 0 | 1] < w.tick) return false;
  return true;
}

// ---- healing and shields --------------------------------------------------------------------

export function heal(w: World, src: Unit | null, tgt: Unit, amount: number, quiet = false): number {
  if (!tgt.alive || amount <= 0) return 0;
  if (src) amount *= 1 + src.stats.healPower / 100;
  const before = tgt.hp;
  tgt.hp = Math.min(tgt.stats.maxHp, tgt.hp + amount);
  const done = tgt.hp - before;
  if (src?.hero) src.hero.healing += done;
  if (!quiet && done >= 8 && tgt.hero) w.emitPos({ e: 'heal', id: tgt.id, x: tgt.x, y: tgt.y, a: Math.round(done) }, tgt.x, tgt.y);
  return done;
}

export function addShield(w: World, src: Unit | null, tgt: Unit, amount: number, seconds: number): void {
  if (!tgt.alive) return;
  if (src) amount *= 1 + src.stats.healPower / 100;
  tgt.shields.push({ amount, until: w.tick + secs(seconds), src: src ? src.id : 0, oru: src?.hero?.heroId === 'oru' });
  if (src?.hero) src.hero.healing += amount * 0.5;
  if (src && src !== tgt && hasItem(src, 'beacon_loom')) addEffect(w, tgt, 'beacon', secs(3), 6, src.id);
  w.fxAt('shield', tgt.x, tgt.y, { id: tgt.id });
}

// ---- damage ---------------------------------------------------------------------------------

export function mitigate(defense: number, penPct: number): number {
  let def = defense;
  if (def > 0) def *= 1 - Math.min(80, penPct) / 100;
  // reduction = d / (100 + |d|): positive defence reduces, negative amplifies (mirrored, bounded)
  return 1 - def / (100 + Math.abs(def));
}

export function dealDamage(w: World, src: Unit | null, tgt: Unit, amount: number, type: DamageType, o: DamageOpts = {}): number {
  if (!tgt.alive || amount <= 0 || w.over) return 0;
  if (tgt.kind === 'ward') {
    if (!o.basic) return 0;
    tgt.hp -= 1;
    w.fxAt('hit', tgt.x, tgt.y, {});
    if (tgt.hp <= 0) kill(w, tgt, src);
    return 1;
  }
  let dmg = amount;
  if (tgt.struct) {
    if (!o.basic || !structVulnerable(w, tgt)) return 0;
    // backdoor mitigation: structures shrug off damage unless an attacking minion is nearby
    if (src && src.kind !== 'minion' && !w.minionNear(src.team, tgt.x, tgt.y, RULES.backdoorRange)) dmg *= RULES.backdoorMult;
    if (src?.hero && w.teamBuff(src.team, 'forge')) dmg *= 1.2;
  }
  if (type !== PURE) {
    const def = type === PHYS ? tgt.stats.armor : tgt.stats.ward;
    const pen = (src ? (type === PHYS ? src.stats.armorPen : src.stats.wardPen) : 0) + (o.pen ?? 0);
    dmg *= mitigate(def, pen);
  }
  const dr = getEffect(tgt, 'dr');
  if (dr) {
    const cut = dmg * dr.value;
    dmg -= cut;
    if (tgt.hero) tgt.hero.p.bogAbsorb = (tgt.hero.p.bogAbsorb ?? 0) + cut;
  }
  if (tgt.kind === 'minion' && hasEffect(tgt, 'empower') && src?.kind !== 'hero') dmg *= 0.6;
  if (dmg <= 0) return 0;

  // shields soak first
  let rem = dmg;
  if (tgt.shields.length) {
    for (const sh of tgt.shields) {
      if (rem <= 0) break;
      const take = Math.min(sh.amount, rem);
      sh.amount -= take;
      rem -= take;
    }
    tgt.shields = tgt.shields.filter((sh) => sh.amount > 0.5);
  }
  tgt.hp -= rem;
  tgt.lastCombat = w.tick;
  if (src) src.lastCombat = w.tick;

  const srcHero = src?.hero ? src : src && src.owner ? w.byId.get(src.owner) : undefined;
  if (srcHero?.hero) {
    const sh = srcHero.hero;
    if (tgt.hero) sh.dmgHeroes += dmg;
    else if (tgt.struct) sh.dmgStructs += dmg;
  }
  if (tgt.hero) {
    const th = tgt.hero;
    th.dmgTaken += dmg;
    th.leftFountainSinceBuy = true;
    th.undo.length = 0;
    th.dmgLog.push({ tick: w.tick, src: src ? src.id : 0, srcName: src ? w.unitName(src) : 'World', label: o.label ?? (o.basic ? 'Basic attack' : 'Ability'), amount: dmg, type, hero: !!srcHero?.hero });
    if (th.dmgLog.length > 60) th.dmgLog.splice(0, 20);
    if (srcHero?.hero && srcHero.team !== tgt.team) {
      th.lastHurtByHero = srcHero.id;
      th.lastHurtByHeroTick = w.tick;
    }
    if (th.recallUntil > 0 && src && (srcHero?.hero || src.struct)) cancelRecall(w, tgt);
    if (type === PHYS && hasItem(tgt, 'kilnheart_plate')) {
      const cur = tgt.effects.find((e) => e.type === 'armor' && e.src === -7);
      if (cur) {
        cur.value = Math.min(24, cur.value + 4);
        cur.until = w.tick + secs(4);
      } else addEffect(w, tgt, 'armor', secs(4), 4, -7);
    }
  }
  if (srcHero?.hero) {
    srcHero.hero.undo.length = 0;
    srcHero.hero.leftFountainSinceBuy = true;
  }

  if ((tgt.hero || srcHero?.hero) && dmg >= 1) {
    w.emitPos({ e: 'dmg', id: tgt.id, x: tgt.x, y: tgt.y, a: Math.round(dmg), ty: type, crit: o.crit }, tgt.x, tgt.y);
  }

  // --- on-damage hooks (hero passives and items) ---
  if (src && srcHero?.hero && !o.noProc && tgt.alive) {
    const h = srcHero.hero;
    const isAbility = o.ability !== undefined;
    if (tgt.hero && !o.dot && srcHero.team !== tgt.team) w.heroAggro(srcHero, tgt);
    if (h.heroId === 'kesh' && (tgt.hero || tgt.kind === 'monster')) addEffect(w, tgt, 'keshmark', secs(6), 0, srcHero.id);
    if (isAbility && !o.dot) {
      if (h.heroId === 'ilyra' && !tgt.struct) {
        addEffect(w, tgt, `note${o.ability}`, secs(6), 0, srcHero.id);
        let notes = 0;
        for (const e of tgt.effects) if (e.type.startsWith('note') && e.src === srcHero.id) notes++;
        if (notes >= 3) {
          tgt.effects = tgt.effects.filter((e) => !(e.type.startsWith('note') && e.src === srcHero.id));
          w.fxAt('marginBurst', tgt.x, tgt.y, { id: tgt.id });
          dealDamage(w, srcHero, tgt, PASSIVE.ilyraBurst(h.level) + 0.3 * srcHero.stats.ap, ARCANE, { noProc: true, label: 'Margin Notes' });
        }
      }
      if (tgt.hero && hasEffect(srcHero, 'draft')) {
        removeEffect(srcHero, 'draft');
        addEffect(w, tgt, 'reveal', secs(4), 0, srcHero.id);
        w.fxAt('mark', tgt.x, tgt.y, { id: tgt.id });
      }
      if (tgt.hero && hasItem(srcHero, 'wickfire_censer')) addEffect(w, tgt, 'dot', secs(3), tgt.stats.maxHp * 0.015, srcHero.id);
      if (tgt.hero && o.castId !== undefined && h.refunded !== o.castId && hasItem(srcHero, 'quiet_index') && dist(srcHero.x, srcHero.y, tgt.x, tgt.y) >= 8) {
        h.refunded = o.castId;
        const slot = o.ability as number;
        const left = h.cdUntil[slot] - w.tick;
        if (left > 0) h.cdUntil[slot] -= Math.round(h.cdTotal[slot] * 0.12);
      }
    }
  }
  if (tgt.kind === 'monster' && tgt.npc?.camp && src && src.team !== 2) {
    const camp = tgt.npc.camp;
    const aggroOn = srcHero?.hero ? srcHero.id : src.id;
    camp.aggro = aggroOn;
    for (const id of camp.units) {
      const m = w.byId.get(id);
      if (m?.npc) {
        m.npc.aggroId = aggroOn;
        m.npc.resetting = false;
        m.npc.lostAt = 0;
      }
    }
  }

  if (tgt.hp <= 0) kill(w, tgt, src);
  return dmg;
}

/** Resolve a landed basic attack (melee swing or attack missile). */
export function basicHit(w: World, u: Unit, t: Unit): void {
  if (!t.alive) return;
  let dmg = u.stats.ad;
  let crit = false;
  let pen = 0;
  let bonusArcane = 0;
  const h = u.hero;
  if (h) {
    if (!t.struct && u.stats.crit > 0 && w.rng.chance(u.stats.crit / 100)) {
      dmg *= 1.75;
      crit = true;
    }
    if (h.heroId === 'suri' && (h.p.charge ?? 0) > 0.05 && !t.struct && t.kind !== 'ward') {
      bonusArcane = (PASSIVE.suriBonus(h.level) + 0.25 * u.stats.ad) * Math.min(1, h.p.charge);
      h.p.charge = 0;
      w.fxAt('emberHit', t.x, t.y, {});
    }
    if (h.heroId === 'vey' && (h.p.refractUntil ?? 0) >= w.tick && !t.struct && t.kind !== 'ward') {
      pen += 40;
      dmg += PASSIVE.veyBonus(h.level);
      h.p.refractUntil = 0;
      w.fxAt('refractHit', t.x, t.y, {});
    }
    if (t.kind === 'monster' && hasItem(u, 'reedcutters_fang')) {
      dmg += 25;
      heal(w, u, u, 8, true);
    }
    if (h.heroId === 'suri') {
      const e = getEffect(t, 'parcel');
      if (e && e.src === u.id) e.until -= secs(1);
    }
    if (h.heroId === 'kesh' && hasEffect(t, 'keshmark') && w.tick >= (h.p.healReady ?? 0)) {
      heal(w, u, u, PASSIVE.keshHeal(h.level) + 0.03 * (u.stats.maxHp - u.hp));
      h.p.healReady = w.tick + secs(4);
    }
    if (hasItem(u, 'sunspoke_bow') && !t.struct) {
      h.attackCount++;
      if (h.attackCount % 3 === 0) {
        const other = w.nearestEnemy(u.team, t.x, t.y, 5, (o) => o !== t && !o.struct && o.kind !== 'ward');
        if (other) {
          const amount = u.stats.ad * 0.4;
          w.spawnProj({ kind: 'spoke', team: u.team as 0 | 1, src: u.id, x: t.x, y: t.y, homing: other.id, speed: 20, radius: 0.3, onHit: (_p, tg) => void dealDamage(w, u, tg, amount, PHYS, { label: 'Sunspoke Bow', noProc: true }) });
        }
      }
    }
    // sieging scales with ability power too, so mages and supports can take structures
    if (t.struct) dmg = (dmg + u.stats.ap * RULES.apVsStruct) * RULES.heroVsStruct;
  } else if (u.kind === 'minion' && u.npc) {
    dmg *= u.npc.dmgMult * (hasEffect(u, 'empower') ? 1.5 : 1);
    if (t.hero) dmg *= RULES.minionVsHero;
    else if (t.struct) dmg *= u.sub === 'siege' ? RULES.siegeVsStruct : RULES.minionVsStruct;
  } else if (u.kind === 'monster' && u.npc) {
    dmg *= u.npc.dmgMult;
  } else if (u.struct) {
    if (t.hero) {
      dmg *= 1 + RULES.towerRampStep * u.struct.ramp;
      u.struct.ramp = Math.min(RULES.towerRampMax, u.struct.ramp + 1);
    } else if (t.kind === 'minion') {
      const frac = t.sub === 'siege' || t.sub === 'vanguard' ? 0.14 : t.sub === 'guard' ? 0.45 : 0.7;
      dealDamage(w, u, t, t.stats.maxHp * frac, PURE, { basic: true, label: 'Tower' });
      return;
    }
  }
  const dealt = dealDamage(w, u, t, dmg, PHYS, { basic: true, crit, pen, label: u.struct ? 'Tower shot' : 'Basic attack' });
  if (bonusArcane > 0) dealDamage(w, u, t, bonusArcane, ARCANE, { label: 'Hot Route', noProc: true });
  if (h && u.stats.lifesteal > 0 && !t.struct && t.kind !== 'ward') heal(w, u, u, (dealt * u.stats.lifesteal) / 100, true);
}

// ---- rewards --------------------------------------------------------------------------------

export function grantGold(w: World, hero: Unit, amount: number, show = true, x = hero.x, y = hero.y): void {
  const h = hero.hero;
  if (!h) return;
  amount = Math.round(amount);
  h.gold += amount;
  h.goldEarned += amount;
  if (show && amount > 0) w.emitHero({ e: 'gold', x, y, a: amount }, hero.id);
}

export function grantXp(w: World, hero: Unit, amount: number): void {
  const h = hero.hero;
  if (!h || h.level >= MAX_LEVEL) return;
  h.xp += amount;
  while (h.level < MAX_LEVEL && h.xp >= XP_TABLE[h.level]) {
    h.level++;
    hero.level = h.level;
    h.skillPts++;
    recalcStats(w, hero);
    w.emitPos({ e: 'level', id: hero.id, lvl: h.level, x: hero.x, y: hero.y }, hero.x, hero.y);
  }
}

function shareXp(w: World, team: number, x: number, y: number, xp: number, mustInclude: Unit | null): void {
  const near: Unit[] = [];
  for (const h of w.heroes) if (h.alive && h.team === team && (h === mustInclude || dist(h.x, h.y, x, y) <= RULES.xpRange)) near.push(h);
  if (!near.length) return;
  const mult = RULES.xpShare[Math.min(near.length, RULES.xpShare.length) - 1];
  for (const h of near) grantXp(w, h, xp * mult * w.pace.xp);
}

export function bountyOf(w: World, victim: Unit): number {
  const h = victim.hero;
  if (!h) return 0;
  let b = RULES.killGold + 60 * Math.min(4, h.streak) - 35 * Math.min(3, Math.max(0, h.deathStreak - 1));
  // comeback: a team with a large gold lead is worth more, capped and shown on the scoreboard
  const lead = w.teamGold(victim.team) - w.teamGold(1 - victim.team);
  if (lead > 1500) b *= 1 + Math.min(0.4, ((lead - 1500) / 1000) * 0.1);
  return Math.round(Math.max(100, b));
}

export function respawnSeconds(w: World, level: number): number {
  const minutes = w.tick / 30 / 60;
  return Math.min(34, 7 + (level - 1) * 1.5 + minutes * 0.7 * w.pace.clock);
}

export function kill(w: World, u: Unit, killer: Unit | null): void {
  if (!u.alive) return;
  u.alive = false;
  u.hp = 0;
  u.path = null;
  u.dash = null;
  u.effects = [];
  u.shields = [];
  u.windupUntil = 0;
  u.attackTarget = 0;
  const kHero = killer?.hero ? killer : killer && killer.owner ? (w.byId.get(killer.owner) ?? null) : null;
  w.emitPos({ e: 'death', id: u.id, k: u.kind, s: u.sub, t: u.team, x: u.x, y: u.y }, u.x, u.y, u.struct ? 'all' : 'pos');

  if (u.kind === 'minion') {
    const def = MINIONS[u.sub];
    if (kHero?.hero) {
      grantGold(w, kHero, def.gold * w.pace.gold, true, u.x, u.y);
      kHero.hero.cs++;
      w.tut(kHero, 'lasthit');
    }
    if (u.team < 2) shareXp(w, 1 - u.team, u.x, u.y, def.xp, null);
  } else if (u.kind === 'monster') {
    const def = MONSTERS[u.sub];
    const camp = u.npc?.camp;
    if (kHero?.hero) {
      grantGold(w, kHero, def.gold * w.pace.gold, true, u.x, u.y);
      kHero.hero.cs++;
      shareXp(w, kHero.team, u.x, u.y, def.xp, kHero);
    }
    if (camp) {
      camp.lastKiller = kHero ? kHero.id : 0;
      camp.units = camp.units.filter((id) => id !== u.id);
      if (camp.units.length === 0) w.campCleared(camp, kHero, killer);
    }
  } else if (u.hero) {
    heroDeath(w, u, killer, kHero);
  } else if (u.struct) {
    structDeath(w, u, kHero);
  } else if (u.kind === 'ward') {
    if (kHero) grantGold(w, kHero, 20);
    if (u.team < 2) w.teams[u.team as 0 | 1].wards = w.teams[u.team as 0 | 1].wards.filter((id) => id !== u.id);
  }
}

function heroDeath(w: World, u: Unit, killer: Unit | null, kHero: Unit | null): void {
  const h = u.hero!;
  h.d++;
  h.casting = null;
  h.recallUntil = 0;
  h.pendingCast = null;
  h.order = { t: 'idle' };
  h.queuedOrder = null;
  h.undo.length = 0;
  const window = w.tick - secs(RULES.assistWindow);
  let credit: Unit | null = kHero && kHero.team !== u.team ? kHero : null;
  if (!credit && h.lastHurtByHeroTick >= window) credit = w.byId.get(h.lastHurtByHero) ?? null;
  const assists: Unit[] = [];
  for (const log of h.dmgLog) {
    if (log.tick < window || !log.hero) continue;
    let s = w.byId.get(log.src);
    if (s && !s.hero && s.owner) s = w.byId.get(s.owner);
    if (s?.hero && s.team !== u.team && s !== credit && !assists.includes(s)) assists.push(s);
  }
  const bounty = bountyOf(w, u);
  const first = !w.firstBlood && !!credit;
  if (credit?.hero) {
    w.firstBlood = true;
    credit.hero.k++;
    credit.hero.streak++;
    credit.hero.deathStreak = 0;
    grantGold(w, credit, (bounty + (first ? 80 : 0)) * w.pace.gold);
    const xp = (90 + 36 * h.level) / (1 + assists.length * 0.6);
    grantXp(w, credit, xp * w.pace.xp);
    for (const a of assists) {
      a.hero!.a++;
      grantGold(w, a, (RULES.assistGold / assists.length) * w.pace.gold);
      grantXp(w, a, xp * 0.6 * w.pace.xp);
    }
    w.teams[credit.team as 0 | 1].kills++;
  } else {
    w.teams[(1 - u.team) as 0 | 1].kills++;
  }
  h.streak = 0;
  h.deathStreak++;
  h.respawnAt = w.tick + secs(respawnSeconds(w, h.level));
  const recapFrom = w.tick - secs(8);
  h.recap = h.dmgLog.filter((l) => l.tick >= recapFrom);
  h.dmgLog = [];
  w.emit({ e: 'kill', victim: u.id, killer: credit ? credit.id : killer ? -killer.id : 0, assists: assists.map((a) => a.id), gold: credit ? bounty : 0, first });
  const kn = credit ? w.unitName(credit) : killer ? w.unitName(killer) : 'the Diadem';
  w.timelineAdd(`${kn} felled ${h.name}`, credit ? credit.team : 2);
}

function structDeath(w: World, u: Unit, kHero: Unit | null): void {
  const st = u.struct!;
  const enemy = (1 - u.team) as 0 | 1;
  const def = STRUCTS[st.def.tier];
  st.deadAt = w.tick;
  for (const h of w.heroes) if (h.team === enemy) grantGold(w, h, def.gold * w.pace.gold, h.alive);
  if (kHero?.hero) {
    kHero.hero.objectives++;
    grantGold(w, kHero, 50 * w.pace.gold, false);
  }
  for (const h of w.heroes) if (h.team === enemy && h.alive && h !== kHero && dist(h.x, h.y, u.x, u.y) < 16) h.hero!.objectives++;
  const lane = st.def.lane === 0 ? 'upper' : st.def.lane === 1 ? 'lower' : 'base';
  if (u.kind === 'tower' || u.kind === 'core') {
    w.teams[enemy].towers++;
    w.announce(`${TEAM_NAMES[u.team]}'s ${def.name}${st.def.lane >= 0 ? ` (${lane})` : ''} has fallen`, 'tower', enemy);
  } else if (u.kind === 'seal') {
    w.announce(`${TEAM_NAMES[u.team]}'s ${lane} Seal is broken — Vanguards march`, 'seal', enemy);
  } else if (u.kind === 'engine') {
    w.announce(`${TEAM_NAMES[u.team]}'s Crown Engine is destroyed`, 'engine', enemy);
    w.finish(enemy);
  }
  w.timelineAdd(`${def.name}${st.def.lane >= 0 ? ` (${lane})` : ''} destroyed`, enemy);
  w.tut(null, u.kind === 'tower' && u.team === 1 ? 'tower' : '');
}
