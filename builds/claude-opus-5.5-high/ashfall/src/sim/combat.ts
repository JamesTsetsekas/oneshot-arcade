import { angleDiff, angleTo, clamp } from "../core/math";
import type { Ailment, DamageType } from "../data/types";
import { SKILL_BY_ID } from "../data/skills";
import { armorReduction, resistReduction } from "../progression/stats";
import type { Game } from "./game";
import type { ActorBase, Enemy, Status } from "./types";

export type Parts = Partial<Record<DamageType, number>>;

export function hasStatus(a: ActorBase, id: string) {
  return !!a.statuses[id];
}

export function applyStatus(a: ActorBase, id: string, dur: number, mag = 0, src = 0, stackMax = 1): Status {
  const s = a.statuses[id];
  if (s) {
    s.t = 0;
    s.dur = Math.max(s.dur - s.t, dur);
    s.mag = Math.max(s.mag, mag);
    s.stacks = Math.min(stackMax, s.stacks + 1);
    return s;
  }
  const n: Status = { id, t: 0, dur, mag, stacks: 1, src, tick: 0 };
  a.statuses[id] = n;
  return n;
}

export function removeStatus(a: ActorBase, id: string) {
  delete a.statuses[id];
}

export const LESSER = (e: Enemy) => !e.isBoss && !e.isElite && !e.guardian;

/** Player → enemy damage pipeline. Returns final damage dealt. */
export function playerHit(
  g: Game,
  e: Enemy,
  coeff: number,
  skillId: string,
  opts: { ailment?: { type: Ailment; chance: number }; mult?: number; noCrit?: boolean; forceCrit?: boolean; flatScale?: number; fromX?: number; fromY?: number; projectile?: boolean; heavy?: boolean; dmgType?: DamageType; stagger?: number } = {},
): number {
  if (!e.alive) return 0;
  const st = g.stats;
  const raw = st.raw;
  const skill = SKILL_BY_ID[skillId];
  const type: DamageType = opts.dmgType ?? skill?.damageType ?? "physical";
  const tags = skill?.tags ?? [];
  const rng = g.combatRng;
  const w = st.weapon;
  const flatScale = opts.flatScale ?? 1;
  let base = rng.range(w[0], w[1]) + (raw.flatPhys ?? 0) * flatScale;
  base *= coeff;
  const parts: Parts = {};
  parts[type] = base;
  // elemental flats keep their own type
  for (const [k, t] of [["flatEmber", "ember"], ["flatFrost", "frost"], ["flatBlight", "blight"]] as const) {
    const v = (raw[k] ?? 0) * coeff * flatScale;
    if (v > 0) parts[t] = (parts[t] ?? 0) + v;
  }
  // Furnace Heart conversion
  if (g.player.furnace && parts.physical) {
    const c = parts.physical * 0.5;
    parts.physical -= c;
    parts.ember = (parts.ember ?? 0) + c;
  }
  // multipliers
  let pct = (raw.pctAll ?? 0) + st.primaryBonus;
  if (tags.includes("melee")) pct += raw.pctMelee ?? 0;
  if (tags.includes("projectile")) pct += raw.pctProjectile ?? 0;
  if (tags.includes("area")) pct += raw.pctArea ?? 0;
  if (tags.includes("trap")) pct += (raw.pctTrap ?? 0) + (raw.trapDamage ?? 0);
  if (hasStatus(e, "burn")) pct += raw.dmgVsBurning ?? 0;
  if (hasStatus(e, "mark")) pct += raw.dmgVsMarked ?? 0;
  if (e.isElite || e.isBoss || e.guardian) pct += raw.dmgVsElites ?? 0;
  if (hasStatus(g.player, "guard")) pct += raw.dmgWhileGuarded ?? 0;
  if (Math.hypot(e.x - g.player.x, e.y - g.player.y) > 6) pct += raw.dmgAtRange ?? 0;
  if (hasStatus(g.player, "shrine")) pct += 20;
  const typePct: Record<DamageType, number> = {
    physical: raw.pctPhys ?? 0,
    ember: (raw.pctEmber ?? 0) + st.elementalBonus,
    frost: (raw.pctFrost ?? 0) + st.elementalBonus,
    blight: (raw.pctBlight ?? 0) + st.elementalBonus,
  };
  let crit = !!opts.forceCrit || (!opts.noCrit && rng.chance(st.critChance));
  const mult = (opts.mult ?? 1) * (crit ? st.critMult : 1) * (hasStatus(e, "blight") ? 1.1 : 1);
  for (const k of Object.keys(parts) as DamageType[]) parts[k] = parts[k]! * (1 + (pct + typePct[k]) / 100) * mult;
  // conditional ailment chances from gear
  let ail = opts.ailment;
  const total = dealToEnemy(g, e, parts, { crit, source: skillId, fromX: opts.fromX ?? g.player.x, fromY: opts.fromY ?? g.player.y, projectile: opts.projectile, heavy: opts.heavy || crit, stagger: opts.stagger });
  if (total <= 0) return 0;
  const tryAil = (a: Ailment, chance: number) => { if (chance > 0 && rng.chance(Math.min(1, chance))) applyAilment(g, e, a, total); };
  if (ail) tryAil(ail.type, ail.chance + (ail.type === "burn" ? (raw.burnChance ?? 0) / 100 : 0));
  if (type === "ember" || parts.ember) tryAil("burn", (raw.burnChance ?? 0) / 100 * (ail?.type === "burn" ? 0 : 1));
  if (tags.includes("projectile")) tryAil("blight", (raw.blightChance ?? 0) / 100);
  else if (raw.blightChance) tryAil("blight", raw.blightChance / 200);
  if (raw.chillChance) tryAil("chill", raw.chillChance / 100);
  // sustain
  if (raw.lifeOnHit) healPlayer(g, raw.lifeOnHit, false);
  if (skill && (skill.kind === "basic")) {
    g.player.focus = Math.min(g.player.maxFocus, g.player.focus + 5 + (raw.focusOnHit ?? 0));
  } else if (raw.focusOnHit && tags.includes("attack")) {
    g.player.focus = Math.min(g.player.maxFocus, g.player.focus + raw.focusOnHit);
  }
  if (g.zone.id === "training" || e.training) g.recordTraining(skillId, total);
  return total;
}

/** Applies already-scaled damage parts to an enemy, after its mitigation. */
export function dealToEnemy(g: Game, e: Enemy, parts: Parts, opts: { crit?: boolean; source: string; fromX: number; fromY: number; projectile?: boolean; heavy?: boolean; stagger?: number; silent?: boolean; friendly?: boolean }): number {
  if (!e.alive) return 0;
  let total = 0;
  let mainType: DamageType = "physical";
  let mainAmt = 0;
  for (const [k, v] of Object.entries(parts) as [DamageType, number][]) {
    if (!v || v <= 0) continue;
    let d = v;
    if (k === "physical") d *= 1 - armorReduction(e.armor, v);
    else d *= 1 - resistReduction(e.res[k] ?? 0);
    total += d;
    if (d > mainAmt) { mainAmt = d; mainType = k; }
  }
  // enemy-specific mitigation
  if (hasStatus(e, "ward")) total *= 0.5;
  if (e.def.behavior === "shield" && !hasStatus(e, "stun")) {
    const a = angleTo(e.x, e.y, opts.fromX, opts.fromY);
    if (Math.abs(angleDiff(e.facing, a)) < Math.PI / 3) { total *= 0.25; if (!opts.silent) g.emit({ t: "sfx", id: "sfx_block", x: e.x, y: e.y }); }
  }
  if (e.boss) {
    const b = e.boss;
    if (b.invulnerable) {
      g.emit({ t: "hit", x: e.x, y: e.y, amount: 0, crit: false, type: mainType, toPlayer: false, target: e.id, blocked: true });
      return 0;
    }
    if (b.kind === "tollkeeper" && b.armor > 0) {
      b.armor = Math.max(0, b.armor - total * 0.9 - (opts.stagger ?? 0));
      total *= 0.5;
      if (b.armor <= 0) {
        b.staggeredT = 4; b.armorRegenT = 14;
        applyStatus(e, "stun", 4);
        e.ai = "recover"; e.aiT = 4; g.clearTelegraphs(e.id);
        g.emit({ t: "toast", text: "The Toll-Keeper's armor shatters!", kind: "warn" });
        g.emit({ t: "sfx", id: "sfx_shatter", x: e.x, y: e.y });
        g.emit({ t: "shake", amp: 0.35, dur: 0.4, src: "boss" });
      }
    }
    if (b.staggeredT > 0) total *= b.kind === "engine" ? 2 : 1.5;
    if (b.kind === "engine" && b.phase === 3 && b.staggeredT <= 0) {
      b.stagger = Math.min(b.staggerMax, b.stagger + total + (opts.stagger ?? 0));
    }
  }
  total = Math.max(1, Math.round(total));
  e.hp -= total;
  e.dmgTaken += total;
  e.flash = 0.12;
  if (opts.heavy || opts.crit) e.hitstop = Math.max(e.hitstop, opts.crit ? 0.055 : 0.035);
  if (!e.aware && !e.training) alertEnemy(g, e);
  if (!opts.silent) g.emit({ t: "hit", x: e.x, y: e.y, amount: total, crit: !!opts.crit, type: mainType, toPlayer: false, target: e.id, heavy: opts.heavy });
  if (e.def.behavior === "flock" && !e.split && e.hp > 0 && e.hp < e.maxHp * 0.5 && !e.isBoss) g.splitSwarm(e);
  if (e.hp <= 0) {
    if (e.def.behavior === "dummy") { e.hp = 1; return total; }
    g.killEnemy(e);
  }
  return total;
}

export function applyAilment(g: Game, e: Enemy, a: Ailment, hitDmg: number) {
  if (!e.alive) return;
  const lesser = LESSER(e);
  switch (a) {
    case "burn": {
      const s = applyStatus(e, "burn", 3, Math.max(1, (hitDmg * 0.4) / 3));
      s.mag = Math.max(s.mag, (hitDmg * 0.4) / 3);
      break;
    }
    case "blight": applyStatus(e, "blight", 4, Math.max(1, (hitDmg * 0.3) / 4)); break;
    case "chill": applyStatus(e, "chill", 2, 0.3); break;
    case "slow": applyStatus(e, "slow", 2, 0.3); break;
    case "root":
      if (lesser) applyStatus(e, "root", 2);
      else { applyStatus(e, "slow", 2.5, 0.4); bossStagger(g, e, 15); }
      break;
    case "stun":
      if (lesser) applyStatus(e, "stun", 1);
      else bossStagger(g, e, 25);
      break;
    case "stagger":
      if (e.def.light && lesser && (e.ai === "telegraph")) interruptEnemy(g, e);
      else if (!lesser) bossStagger(g, e, 8);
      break;
    case "knockback":
      if (lesser && e.def.light) {
        const a2 = angleTo(g.player.x, g.player.y, e.x, e.y);
        g.pushActor(e, Math.cos(a2) * 1.5, Math.sin(a2) * 1.5);
      } else if (!lesser) bossStagger(g, e, 10);
      break;
  }
}

function bossStagger(g: Game, e: Enemy, amt: number) {
  if (!e.boss) return;
  const b = e.boss;
  if (b.kind === "tollkeeper" && b.armor > 0) b.armor = Math.max(0, b.armor - amt * 2);
  if (b.kind === "engine" && b.phase === 3) b.stagger = Math.min(b.staggerMax, b.stagger + amt * 3);
}

export function interruptEnemy(g: Game, e: Enemy) {
  if (e.ai !== "telegraph") return;
  g.clearTelegraphs(e.id);
  if (e.heavy) { e.heavy = false; }
  e.ai = "recover";
  e.aiT = 0.5;
  e.attack = null;
  g.emit({ t: "vfx", kind: "interrupt", x: e.x, y: e.y });
  g.emit({ t: "sfx", id: "sfx_interrupt", x: e.x, y: e.y });
}

export function alertEnemy(g: Game, e: Enemy) {
  if (e.training) return;
  for (const o of g.enemies) {
    if (o.alive && (o.packId === e.packId || Math.hypot(o.x - e.x, o.y - e.y) < 6) && !o.aware && !o.isBoss) {
      o.aware = true;
      if (o.ai === "dormant") o.ai = "approach";
    }
  }
  e.aware = true;
  if (e.ai === "dormant") e.ai = "approach";
}

/** Enemy (or hazard) → player damage pipeline. */
export function damagePlayer(g: Game, rawDmg: number, type: DamageType, src: Enemy | null, opts: { melee?: boolean; label: string; ailment?: { type: Ailment; chance: number; duration?: number }; unblockable?: boolean; heavy?: boolean }): number {
  const p = g.player;
  if (!p.alive || g.zone.safe) return 0;
  const st = g.stats;
  if (hasStatus(p, "evadeNext")) {
    removeStatus(p, "evadeNext");
    g.emit({ t: "hit", x: p.x, y: p.y, amount: 0, crit: false, type, toPlayer: true, evaded: true, target: p.id });
    g.emit({ t: "sfx", id: "sfx_evade", x: p.x, y: p.y });
    return 0;
  }
  let d = rawDmg;
  // Heat (Cinder Vow): convert endured damage to Heat
  if (g.ch.classId === "cinder") {
    const gain = (rawDmg / Math.max(1, p.maxHp)) * 110 * (1 + (st.raw.heatGain ?? 0) / 100);
    p.heat = Math.min(100, p.heat + gain);
  }
  let blocked = false;
  if (!opts.unblockable && st.blockChance > 0 && g.combatRng.chance(st.blockChance)) {
    blocked = true;
    d *= 0.35;
    if (g.ch.classId === "cinder") p.heat = Math.min(100, p.heat + 8 * (1 + (st.raw.heatGain ?? 0) / 100));
    if (g.ch.ranks.unbroken_oath) p.focus = Math.min(p.maxFocus, p.focus + 4);
    if (st.relics.has("kiln_heart") && p.relicCd <= 0) { p.relicCd = 1; g.emberBurst(p.x, p.y, 3, 0.7, "kiln_heart"); }
  }
  if (hasStatus(p, "guard")) d *= 0.6;
  if (type === "physical") d *= 1 - armorReduction(st.armor, d);
  else {
    let res = st.res[type];
    if (hasStatus(p, "tonic")) res = Math.min(75, res + 25);
    d *= 1 - resistReduction(res);
  }
  d = Math.max(1, Math.round(d));
  p.hp -= d;
  p.flash = 0.12;
  p.lastHitT = g.time;
  p.lastDamage = { source: opts.label, type, amount: d };
  g.emit({ t: "hit", x: p.x, y: p.y, amount: d, crit: false, type, toPlayer: true, blocked, target: p.id, heavy: opts.heavy });
  if (d > p.maxHp * 0.12) g.emit({ t: "shake", amp: Math.min(0.3, (d / p.maxHp) * 0.8), dur: 0.25, src: "hit" });
  // channel interruption
  if (p.action?.kind === "channel") { p.action = null; g.emit({ t: "toast", text: "Town-gate interrupted", kind: "warn" }); g.emit({ t: "sfx", id: "sfx_invalid" }); }
  // retaliation
  if (opts.melee && src && src.alive && (st.raw.retaliation ?? 0) > 0) {
    const mult = hasStatus(p, "guard") && g.ch.ranks.unbroken_oath ? 3 : 1;
    const amt = (st.raw.retaliation ?? 0) * (1 + g.ch.level * 0.12) * mult;
    dealToEnemy(g, src, { physical: amt }, { source: "retaliation", fromX: p.x, fromY: p.y, silent: false });
  }
  // vampiric elite
  if (src && src.elite.includes("vampiric_bond") && src.alive) src.hp = Math.min(src.maxHp, src.hp + d * 0.6);
  // ailments with diminishing stun
  if (opts.ailment && !hasStatus(p, "cleanseImm") && g.combatRng.chance(opts.ailment.chance * (1 - Math.min(0.6, (st.raw.ailmentRes ?? 0) / 100)))) {
    const a = opts.ailment.type;
    if (a === "stun") {
      const dr = p.statuses.stunDR ? 0.5 : 1;
      applyStatus(p, "stun", (opts.ailment.duration ?? 0.6) * dr);
      applyStatus(p, "stunDR", 5);
      if (p.action && p.action.kind !== "evade") p.action = null;
    } else if (a === "knockback") {
      if (src) { const an = angleTo(src.x, src.y, p.x, p.y); g.pushActor(p, Math.cos(an) * 1.6, Math.sin(an) * 1.6); }
    } else if (a === "burn" || a === "blight") applyStatus(p, a, 3, (rawDmg * 0.25) / 3);
    else if (a === "chill" || a === "slow") applyStatus(p, a, 2, 0.3);
    else if (a === "root") applyStatus(p, "root", 1);
  }
  if (p.hp <= 0) g.playerDied();
  return d;
}

export function healPlayer(g: Game, amt: number, show = true) {
  const p = g.player;
  if (!p.alive) return;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + amt);
  if (show && p.hp - before >= 1) g.emit({ t: "vfx", kind: "heal", x: p.x, y: p.y, type: "heal" });
}

/** Ticks DoTs and expires statuses. */
export function updateStatuses(g: Game, a: ActorBase, dt: number) {
  for (const id in a.statuses) {
    const s = a.statuses[id];
    s.t += dt;
    if (id === "burn" || id === "blight") {
      s.tick += dt;
      if (s.tick >= 0.5) {
        s.tick -= 0.5;
        const amt = s.mag * 0.5;
        if (a.team === 1) dealToEnemy(g, a as Enemy, { [id === "burn" ? "ember" : "blight"]: amt }, { source: id, fromX: a.x, fromY: a.y, silent: true });
        else if (a.alive) {
          const p = g.player;
          const d = Math.max(1, Math.round(amt));
          p.hp -= d;
          p.lastDamage = { source: id === "burn" ? "Burning" : "Blight", type: id === "burn" ? "ember" : "blight", amount: d };
          if (p.hp <= 0) g.playerDied();
        }
      }
    }
    if (s.t >= s.dur) delete a.statuses[id];
  }
}

export function slowFactor(a: ActorBase): number {
  let f = 1;
  if (a.statuses.chill) f *= 1 - a.statuses.chill.mag;
  if (a.statuses.slow) f *= 1 - a.statuses.slow.mag;
  if (a.statuses.rallied) f *= 1.25;
  return clamp(f, 0.3, 2);
}
