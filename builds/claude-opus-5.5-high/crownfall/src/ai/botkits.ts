// Kit-authored bot ability usage via utility scoring: hit probability, target value,
// ally synergy, escape reserve, resource, cooldown and danger.
import type { Match } from '../sim/match';
import type { Unit } from '../sim/types';
import type { Bot } from './bot';
import { dist } from '../shared/math';
import { FOUNTAIN } from '../shared/map';
import { abilityDef } from '../sim/abilities';
import { canCast } from '../sim/combat';

export interface BotCtx {
  bot: Bot; m: Match; u: Unit;
  enemies: Unit[]; enemyHeroes: Unit[]; allies: Unit[];
  target?: Unit;
  mode: 'fight' | 'farm' | 'escape';
}

interface Option { slot: number; score: number; x?: number; y?: number; target?: number; recast?: boolean }

function ready(u: Unit, slot: number): boolean {
  const h = u.hero!;
  if (h.ranks[slot] <= 0 || h.cds[slot] > 0) return false;
  const def = abilityDef(u, slot);
  const cost = def.cost[Math.min(def.cost.length, h.ranks[slot]) - 1] ?? 0;
  return u.mana >= cost;
}

/** Probability a skillshot of given speed lands, from distance and target mobility. */
function hitChance(d: number, speed: number, range: number): number {
  if (d > range) return 0;
  const travel = d / speed;
  return Math.max(0.1, 1 - travel * 0.9);
}

function awayFrom(u: Unit, threats: Unit[], len: number) {
  const f = FOUNTAIN[u.team as 0 | 1];
  let dx = f.x - u.x, dy = f.y - u.y;
  for (const t of threats) { const l = Math.hypot(u.x - t.x, u.y - t.y) || 1; dx += ((u.x - t.x) / l) * 10; dy += ((u.y - t.y) / l) * 10; }
  const l = Math.hypot(dx, dy) || 1;
  return { x: u.x + (dx / l) * len, y: u.y + (dy / l) * len };
}

export function botCast(ctx: BotCtx): boolean {
  const { u, m, bot } = ctx;
  if (!canCast(u) || u.cast) return false;
  const h = u.hero!;
  const opts: Option[] = [];
  const t = ctx.target;
  const td = t ? dist(u.x, u.y, t.x, t.y) : 99;
  const isHero = t?.kind === 'hero';
  const value = isHero ? 1 : 0.35;
  const manaPct = u.mana / Math.max(1, u.stats.maxMana);
  const reserve = manaPct < 0.25 && ctx.mode !== 'escape' && !isHero ? 0.5 : 1;
  const tlow = t ? t.hp / t.stats.maxHp : 1;
  const enemiesNear = (x: number, y: number, r: number) => ctx.enemies.filter((e) => dist(e.x, e.y, x, y) <= r).length;
  const pred = (s: number) => (t ? bot.predict(t, td / s) : { x: u.x, y: u.y });
  const esc = ctx.mode === 'escape';
  switch (h.id) {
    case 'brannoch': {
      if (t && !esc && ready(u, 0) && td < 4) opts.push({ slot: 0, score: 0.8 * value + 0.2, x: t.x, y: t.y });
      if (ready(u, 1) && ctx.enemyHeroes.length && (esc || (t && isHero && td < 6))) {
        const e = ctx.enemyHeroes[0];
        const p = esc ? { x: (u.x + e.x) / 2, y: (u.y + e.y) / 2 } : { x: e.x, y: e.y };
        opts.push({ slot: 1, score: esc ? 0.9 : 0.4, x: p.x, y: p.y });
      }
      if (ready(u, 2) || h.recast[2]) {
        if (h.recast[2] && h.recast[2].until > m.time && m.time > bot.recastAt) opts.push({ slot: 2, score: 1, recast: true });
        else if (ready(u, 2)) {
          const ally = ctx.allies.find((a) => dist(a.x, a.y, u.x, u.y) > 4 && dist(a.x, a.y, u.x, u.y) < 9 && (esc || (t && dist(a.x, a.y, t.x, t.y) < 5)));
          if (ally) { opts.push({ slot: 2, score: 0.6, target: ally.id }); bot.recastAt = m.time + 0.6; }
        }
      }
      if (t && isHero && !esc && ready(u, 3) && td < 11) {
        const p = pred(8);
        const cluster = enemiesNear(p.x, p.y, 4);
        if (cluster >= 2 || tlow < 0.55) opts.push({ slot: 3, score: 0.6 + cluster * 0.2, x: p.x, y: p.y });
      }
      break;
    }
    case 'suri': {
      if (t && !esc && ready(u, 0) && td < 11) { const p = pred(26); opts.push({ slot: 0, score: hitChance(td, 26, 11) * value * reserve + 0.1, x: p.x, y: p.y }); }
      if (ready(u, 1)) {
        if (esc && ctx.enemyHeroes.length) { const p = awayFrom(u, ctx.enemyHeroes, 4.5); opts.push({ slot: 1, score: 1, x: p.x, y: p.y }); }
        else if (t && isHero && tlow < 0.3 && td > u.stats.range && td < u.stats.range + 4) opts.push({ slot: 1, score: 0.7, x: t.x, y: t.y });
      }
      if (t && !esc && ready(u, 2) && td < 6.5 && (isHero || enemiesNear(t.x, t.y, 3) >= 3)) opts.push({ slot: 2, score: 0.6 * value + 0.2, target: t.id });
      if (ready(u, 3)) {
        for (const e of ctx.bot.visibleEnemies(30, (x) => x.kind === 'hero')) {
          const d = dist(u.x, u.y, e.x, e.y);
          if (d > 6 && e.hp / e.stats.maxHp < 0.4 && !esc) { const p = bot.predict(e, d / 42); opts.push({ slot: 3, score: 0.95, x: p.x, y: p.y }); break; }
        }
      }
      break;
    }
    case 'oru': {
      const hurtAlly = ctx.allies.find((a) => a.hp / a.stats.maxHp < 0.6 && dist(a.x, a.y, u.x, u.y) < 9);
      if (ready(u, 0)) {
        if (hurtAlly && ctx.enemyHeroes.length) opts.push({ slot: 0, score: 0.75, x: hurtAlly.x, y: hurtAlly.y });
        else if (t && !esc && td < 9.5) { const p = pred(9); opts.push({ slot: 0, score: hitChance(td, 9, 10) * value * reserve, x: p.x, y: p.y }); }
      }
      if (ready(u, 1) && t && isHero && td < 8) opts.push({ slot: 1, score: esc ? 0.8 : 0.45, x: t.x, y: t.y });
      if (ready(u, 2)) {
        if (esc) opts.push({ slot: 2, score: 0.9, target: u.id });
        else if (t && isHero) { const ally = ctx.allies.find((a) => dist(a.x, a.y, t.x, t.y) < 10) ?? u; opts.push({ slot: 2, score: 0.5, target: ally.id }); }
      }
      if (ready(u, 3) && ctx.enemyHeroes.length && (ctx.enemyHeroes.some((e) => dist(e.x, e.y, u.x, u.y) < 9))) {
        const e = ctx.enemyHeroes.find((x) => dist(x.x, x.y, u.x, u.y) < 9)!;
        if (ctx.allies.length || esc || e.hp / e.stats.maxHp < 0.5) opts.push({ slot: 3, score: 0.85, x: e.x, y: e.y });
      }
      break;
    }
    case 'kesh': {
      if (t && !esc && ready(u, 0) && td < 3.6) opts.push({ slot: 0, score: 0.8 * reserve + 0.1, x: t.x, y: t.y });
      if (ready(u, 1) && !esc && (ctx.enemyHeroes.some((e) => dist(e.x, e.y, u.x, u.y) < 5) || (ctx.mode === 'farm' && t?.kind === 'monster' && td < 3))) opts.push({ slot: 1, score: 0.55 });
      if (ready(u, 2)) {
        if (esc) { const p = awayFrom(u, ctx.enemyHeroes, 5.5); opts.push({ slot: 2, score: 0.95, x: p.x, y: p.y }); }
        else if (t && isHero && td > 3 && td < 6.5) opts.push({ slot: 2, score: 0.7, x: t.x, y: t.y });
      }
      if (ready(u, 3) && t && isHero && !esc && td < 5) opts.push({ slot: 3, score: 0.75 });
      break;
    }
    case 'ilyra': {
      if (t && !esc && ready(u, 0) && td < 12) { const p = pred(30); opts.push({ slot: 0, score: hitChance(td, 30, 12) * value * reserve + (h.passive.footnoteAt && m.time - h.passive.footnoteAt < 2 ? 0.3 : 0), x: p.x, y: p.y }); }
      if (t && isHero && !esc && ready(u, 1) && ready(u, 0) && td < 9 && td > 3) {
        opts.push({ slot: 1, score: 0.55, x: (u.x + t.x) / 2, y: (u.y + t.y) / 2 });
      }
      if (t && ready(u, 2) && td < 7.5 && (isHero || enemiesNear(t.x, t.y, 3) >= 3)) opts.push({ slot: 2, score: esc ? 0.9 : 0.65 * value + 0.1, x: t.x, y: t.y });
      if (t && isHero && !esc && ready(u, 3) && td < 11) {
        const p = pred(3);
        const cluster = enemiesNear(p.x, p.y, 5);
        if (cluster >= 2 || tlow < 0.6) opts.push({ slot: 3, score: 0.7 + 0.1 * cluster, x: p.x, y: p.y });
      }
      break;
    }
    case 'vey': {
      if (t && ready(u, 0) && td < 6 && !esc && (h.passive[`ss${t.id}`] ?? 0) <= m.time) opts.push({ slot: 0, score: 0.75 * value + 0.15, target: t.id });
      if (esc && ready(u, 0)) {
        const away = ctx.enemies.find((e) => e.kind !== 'hero' && dist(e.x, e.y, u.x, u.y) < 6 && dist(e.x, e.y, FOUNTAIN[u.team as 0 | 1].x, FOUNTAIN[u.team as 0 | 1].y) < dist(u.x, u.y, FOUNTAIN[u.team as 0 | 1].x, FOUNTAIN[u.team as 0 | 1].y));
        if (away) opts.push({ slot: 0, score: 0.8, target: away.id });
      }
      if (ready(u, 1) && esc) { const p = awayFrom(u, ctx.enemyHeroes, 8); opts.push({ slot: 1, score: 0.7, x: p.x, y: p.y }); }
      if (t && !esc && ready(u, 2) && td < 4.2) opts.push({ slot: 2, score: 0.7 * value + 0.15, x: t.x, y: t.y });
      if (t && isHero && !esc && ready(u, 3) && td < 7.5 && tlow < 0.6) opts.push({ slot: 3, score: 0.9, target: t.id });
      break;
    }
  }
  if (!opts.length) return false;
  opts.sort((a, b) => b.score - a.score);
  const best = opts[0];
  if (best.score < 0.3) return false;
  if (h.id === 'ilyra' && best.slot === 1) h.passive.footnoteAt = m.time;
  bot.cmd({ t: 'cast', slot: best.slot, x: best.x, y: best.y, target: best.target });
  return true;
}
