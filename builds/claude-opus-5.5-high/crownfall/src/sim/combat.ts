// Stats, damage, healing, shields, crowd control. Server-only mutation.
import type { Match } from './match';
import type { Unit, Effect, EffectKind } from './types';
import { damageMultiplier, abilityHasteCdr, VISION } from '../shared/rules';
import { ITEMS } from '../shared/items';
import { heroStatsAt } from '../shared/heroes';
import type { DamageType, Stats } from '../shared/types';
import { flagsAt, FLAG_RIVER } from '../shared/map';
import { ST } from '../protocol/messages';

export function hasEffect(u: Unit, k: EffectKind): boolean {
  for (const e of u.effects) if (e.kind === k) return true;
  return false;
}
export function effectValue(u: Unit, k: EffectKind): number {
  let v = 0;
  for (const e of u.effects) if (e.kind === k && e.value > v) v = e.value;
  return v;
}
export function hasItem(u: Unit, id: string): boolean {
  if (!u.hero) return false;
  for (const s of u.hero.items) if (s && s.id === id) return true;
  return false;
}

export const isHardCC = (u: Unit) => hasEffect(u, 'stun') || hasEffect(u, 'airborne');
export const canMove = (u: Unit) => !isHardCC(u) && !hasEffect(u, 'root') && !u.cast?.channel && !(u.cast && !u.cast.channel);
export const canAct = (u: Unit) => !isHardCC(u);
export const canCast = (u: Unit) => !isHardCC(u) && !hasEffect(u, 'silence');

export function recomputeStats(m: Match, u: Unit) {
  if (u.hero) {
    const h = u.hero;
    const s: Stats = heroStatsAt(h.def, h.level);
    let bonusAs = 0;
    for (const it of h.items) {
      if (!it) continue;
      const d = ITEMS[it.id];
      for (const k of Object.keys(d.stats) as (keyof Stats)[]) {
        if (k === 'as') bonusAs += d.stats.as ?? 0;
        else s[k] += d.stats[k] ?? 0;
      }
    }
    // effect modifiers
    let haste = 0, slow = 0;
    for (const e of u.effects) {
      switch (e.kind) {
        case 'armorBuff': s.armor += e.value; break;
        case 'wardBuff': s.ward += e.value; break;
        case 'asBuff': bonusAs += e.value; break;
        case 'haste': haste += e.value; break;
        case 'slow': slow = Math.max(slow, e.value); break;
        case 'buffSpring': s.haste += 20; s.manaRegen *= 1.6; break;
        default: break;
      }
    }
    const kStacks = h.passive.kilnStacks ?? 0;
    if (kStacks > 0) s.armor += 4 * kStacks;
    const stone = h.passive.stoneStacks ?? 0;
    if (stone > 0) { const v = 6 + 0.8 * h.level; s.armor += v * stone; s.ward += v * stone; }
    if (hasItem(u, 'ironstep')) slow *= 0.8;
    const outOfCombat = m.time > u.heroCombatUntil;
    if (outOfCombat && m.teamBuff(u.team, 'gale')) haste += 0.2;
    if (outOfCombat && hasItem(u, 'riverglass') && (flagsAt(u.x, u.y) & FLAG_RIVER)) haste += 0.2;
    if ((h.passive.fenUntil ?? 0) > m.time) haste += 0.3;
    s.ms = Math.max(1.2, s.ms * (1 + haste) * (1 - slow));
    s.as = Math.min(2.5, s.as * (1 + bonusAs));
    u.bonusAs = bonusAs;
    const prevMax = u.stats.maxHp;
    u.stats = s;
    if (prevMax > 0 && s.maxHp !== prevMax && u.alive) u.hp = Math.max(1, u.hp * (s.maxHp / prevMax));
    if (u.hp > s.maxHp) u.hp = s.maxHp;
    if (u.mana > s.maxMana) u.mana = s.maxMana;
    return;
  }
  // non-hero: base + slow/haste only
  const s = { ...u.base };
  let slow = 0, haste = 0;
  for (const e of u.effects) {
    if (e.kind === 'slow') slow = Math.max(slow, e.value);
    else if (e.kind === 'haste') haste += e.value;
    else if (e.kind === 'armorBuff') s.armor += e.value;
  }
  if (u.minion && u.minion.empoweredUntil > m.time) { s.ad *= 1.5; s.armor += 30; s.ward += 30; }
  s.ms = Math.max(0.8, s.ms * (1 + haste) * (1 - slow));
  u.stats = s;
}

export function addEffect(m: Match, u: Unit, e: Omit<Effect, 'start'>, srcName = '') {
  if (!u.alive) return;
  if ((e.kind === 'stun' || e.kind === 'root' || e.kind === 'slow' || e.kind === 'silence' || e.kind === 'airborne') && (hasEffect(u, 'unstoppable') || u.structure)) return;
  // refresh same-tag effect instead of stacking
  if (e.tag) {
    const ex = u.effects.find((x) => x.tag === e.tag && x.kind === e.kind);
    if (ex) { ex.until = Math.max(ex.until, e.until); ex.value = Math.max(ex.value, e.value); return; }
  }
  u.effects.push({ ...e, start: m.time });
  if (e.kind === 'stun' || e.kind === 'root' || e.kind === 'airborne' || e.kind === 'silence' || (e.kind === 'slow' && e.value >= 0.3)) {
    u.ccLog.push({ t: m.time, kind: e.kind, dur: e.until - m.time, src: srcName });
    if (u.ccLog.length > 12) u.ccLog.shift();
    if (e.kind === 'stun' || e.kind === 'airborne') {
      // interrupts casts, channels and recall
      if (u.cast) u.cast = null;
      if (u.hero?.recall) m.cancelRecall(u);
      u.atkPhase = 0;
    }
    if (e.kind === 'silence' && u.cast) u.cast = null;
  }
}

export function addShield(m: Match, src: Unit, tgt: Unit, amt: number, dur: number, fromOru = false) {
  if (!tgt.alive) return;
  const power = 1 + (src.stats.healPower || 0);
  const a = amt * power;
  tgt.shields.push({ amt: a, initial: a, until: m.time + dur, src: src.id, fromOru });
  m.emit({ e: 'shield', tgt: tgt.id, amt: Math.round(a), x: tgt.x, y: tgt.y }, { x: tgt.x, y: tgt.y });
  if (src.hero && src.team === tgt.team && tgt.id !== src.id && hasItem(src, 'beaconloom')) {
    m.addReveal(src.team as 0 | 1, tgt.x, tgt.y, 6, 3);
  }
}

export function heal(m: Match, src: Unit | null, tgt: Unit, amt: number) {
  if (!tgt.alive || amt <= 0) return 0;
  let a = amt * (1 + (src?.stats.healPower || 0));
  if (hasEffect(tgt, 'grievous')) a *= 0.6;
  const before = tgt.hp;
  tgt.hp = Math.min(tgt.stats.maxHp, tgt.hp + a);
  const done = tgt.hp - before;
  if (done > 1 && src?.hero) src.hero.healing += done;
  if (done > 4) m.emit({ e: 'heal', tgt: tgt.id, amt: Math.round(done), x: tgt.x, y: tgt.y }, { x: tgt.x, y: tgt.y });
  return done;
}

export function shieldTotal(u: Unit): number {
  let s = 0;
  for (const sh of u.shields) s += sh.amt;
  return s;
}

export interface DmgOpts {
  kind: 'attack' | 'ability' | 'item' | 'dot' | 'tower' | 'reflect' | 'talent';
  source: string;
  slot?: number;
  castId?: number;
  ult?: boolean;
  noEvent?: boolean;
  crit?: boolean;
  penPct?: number;
}

export function dealDamage(m: Match, src: Unit | null, tgt: Unit, raw: number, type: DamageType, o: DmgOpts): number {
  if (!tgt.alive || raw <= 0 || tgt.invulnerable || hasEffect(tgt, 'invuln')) return 0;
  if (tgt.kind === 'decoy') { m.popDecoy(tgt); return 0; }
  if (tgt.monster?.resetting) return 0;
  let amt = raw;
  // structure rules
  if (tgt.structure) {
    if (m.structureInvulnerable(tgt)) return 0;
    if (src && (src.kind === 'hero') && m.isBackdoor(tgt)) amt *= 1 - 0.6;
    if (src && src.team !== 2 && m.teamBuff(src.team as 0 | 1, 'forge')) amt *= 1.25;
    if (src?.kind === 'minion' && src.minion?.kind === 'siege') amt *= 1.5;
  }
  if (src?.hero && tgt.kind === 'monster' && hasItem(src, 's_lantern')) amt *= 1.5;
  if (src?.hero && o.kind === 'attack' && (tgt.kind === 'minion' || tgt.kind === 'monster') && hasItem(src, 's_knife')) amt += 5;
  if (src?.kind === 'minion' && tgt.hero && hasItem(tgt, 's_buckler')) amt = Math.max(1, amt - 8);
  if (src?.kind === 'minion' && tgt.kind === 'minion') amt *= 1.0;
  if (src?.kind === 'tower' && tgt.kind === 'minion') amt *= 1.35;
  // mitigation
  if (type === 'physical') {
    let armor = tgt.stats.armor;
    if (src) {
      if (o.penPct) armor *= 1 - o.penPct;
      armor = armor > 0 ? Math.max(0, armor - (src.stats.armorPen || 0)) : armor;
    }
    amt *= damageMultiplier(armor);
  } else if (type === 'arcane') {
    let ward = tgt.stats.ward;
    if (src) ward = ward > 0 ? Math.max(0, ward - (src.stats.wardPen || 0)) : ward;
    amt *= damageMultiplier(ward);
    if (src?.hero && tgt.hero && hasItem(tgt, 'wardweave') && (tgt.hero.passive.wardweaveAt ?? -99) + 15 <= m.time) {
      tgt.hero.passive.wardweaveAt = m.time;
      amt *= 0.6;
    }
  }
  const dr = effectValue(tgt, 'dr');
  if (dr > 0) {
    const absorbed = amt * dr;
    amt -= absorbed;
    if (tgt.hero) tgt.hero.passive.bogAbsorbed = (tgt.hero.passive.bogAbsorbed ?? 0) + absorbed;
  }
  // shields
  let rem = amt;
  for (const sh of tgt.shields) {
    if (rem <= 0) break;
    const take = Math.min(sh.amt, rem);
    sh.amt -= take; rem -= take;
  }
  tgt.shields = tgt.shields.filter((s) => s.amt > 0.5);
  tgt.hp -= rem;
  const total = amt;
  // bookkeeping
  tgt.lastDamagedAt = m.time;
  if (src) {
    const srcName = src.hero ? src.hero.def.name : src.name;
    tgt.dmgLog.push({ src: src.id, t: m.time, amt: total, type, source: o.source, srcName, hero: !!src.hero });
    if (tgt.dmgLog.length > 40) tgt.dmgLog.splice(0, tgt.dmgLog.length - 40);
    if (src.hero || src.structure) {
      if (tgt.hero) tgt.heroCombatUntil = m.time + 4;
      if (tgt.hero?.recall) m.cancelRecall(tgt);
    }
    if (src.hero) {
      if (tgt.hero) {
        src.heroCombatUntil = m.time + 4;
        src.hero.dmgHeroes += total;
        src.hero.aggroVictim = tgt.id;
        src.hero.aggroAt = m.time;
        src.hero.lastHeroDamageAt = m.time;
      }
      if (tgt.structure) src.hero.dmgStructures += total;
      if (tgt.monster) {
        const c = tgt.monster.contributors;
        c.set(src.id, (c.get(src.id) ?? 0) + total);
      }
      // reveal attackers that strike from brush at heroes
      if (tgt.hero && src.brush >= 0) src.revealUntil = Math.max(src.revealUntil, m.time + 1.0);
      m.onHeroDealtDamage(src, tgt, total, type, o);
    }
    if (tgt.monster && !tgt.monster.aggro) tgt.monster.aggro = src.id;
    if (tgt.monster) tgt.monster.aggro = tgt.monster.aggro || src.id;
  }
  if (tgt.hero) tgt.hero.dmgTaken += total;
  if (tgt.hero && src) m.onHeroTookDamage(tgt, src, total, type, o);
  if (!o.noEvent) {
    m.emit({ e: 'dmg', src: src?.id ?? 0, tgt: tgt.id, amt: Math.round(total), dt: type, crit: o.crit, x: tgt.x, y: tgt.y }, { x: tgt.x, y: tgt.y, srcTeam: src?.team });
  }
  if (tgt.hp <= 0) m.killUnit(tgt, src);
  return total;
}

export function cooldownAfterHaste(base: number, haste: number) {
  return base * abilityHasteCdr(haste);
}

export function statusFlags(m: Match, u: Unit): number {
  let st = 0;
  for (const e of u.effects) {
    switch (e.kind) {
      case 'stun': st |= ST.stun; break;
      case 'root': st |= ST.root; break;
      case 'slow': st |= ST.slow; break;
      case 'silence': st |= ST.silence; break;
      case 'airborne': st |= ST.airborne; break;
      case 'haste': st |= ST.hasted; break;
      case 'reveal': st |= ST.revealed; break;
      default: break;
    }
  }
  if (u.shields.length) st |= ST.shielded;
  if (u.hero?.recall) st |= ST.recall;
  if (!u.alive) st |= ST.dead;
  if (u.invulnerable || hasEffect(u, 'invuln') || (u.structure && m.structureInvulnerable(u)) || u.monster?.resetting) st |= ST.invuln;
  if (u.revealUntil > m.time) st |= ST.revealed;
  if (u.brush >= 0) st |= ST.inBrush;
  if (u.cast?.channel) st |= ST.channel;
  if (u.hero && (u.hero.passive.primed ?? 0) > 0) st |= ST.glint;
  if (u.minion && u.minion.empoweredUntil > m.time) st |= ST.empowered;
  if (u.structure && m.isBackdoor(u)) st |= ST.backdoor;
  return st;
}

export function visionRadius(m: Match, u: Unit): number {
  let r = 0;
  switch (u.kind) {
    case 'hero': r = VISION.hero; break;
    case 'minion': r = VISION.minion; break;
    case 'tower': case 'core': r = VISION.tower; break;
    case 'seal': case 'engine': r = VISION.structure; break;
    case 'fountain': r = 13; break;
    case 'ward': r = u.ward && u.ward.disabledUntil > m.time ? 0 : VISION.ward; break;
    case 'wall': r = 0; break;
    default: r = 0;
  }
  if (r > 0 && u.team !== 2 && m.inEnemyHush(u)) r *= 0.35;
  return r;
}
