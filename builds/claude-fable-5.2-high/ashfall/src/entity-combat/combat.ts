import { SKILL, type SkillDef } from '../abilities/skills';
import { angDiff, angTo, clamp, dist, inCircle, inCone, inRect } from '../core/math';
import type { Session } from '../game-session/session';
import { ENEMY, scaleDmg, scaleHp } from '../navigation-ai/enemies';
import { cellAt, cellOf, moveCircle, DOOR, WALL } from '../navigation-ai/grid';
import { armorReduction } from './stats';
import { DT, type Actor, type Area, type DamageType, type Projectile, type Src, type Status, type StatusId } from './types';

export const getStatus = (a: Actor, id: StatusId): Status | undefined => a.statuses.find((s) => s.id === id);
export const hasStatus = (a: Actor, id: StatusId) => a.statuses.some((s) => s.id === id);
export const removeStatus = (a: Actor, id: StatusId) => { a.statuses = a.statuses.filter((s) => s.id !== id); };
const HARD_CC: StatusId[] = ['stun', 'root'];
const AILMENTS: StatusId[] = ['burn', 'blight', 'chill', 'root', 'stun'];

/** Applies a status. Bosses convert hard control into stagger-meter damage; elites downgrade roots to slows. */
export function addStatus(s: Session, a: Actor, id: StatusId, t: number, power = 0, src = 0, maxStacks = 1): void {
  if (a.dead) return;
  if (a.kind === 'player') {
    if (AILMENTS.includes(id)) {
      if (hasStatus(a, 'cleansed')) return;
      t *= 1 - Math.min(80, s.stats.ailmentRes ?? 0) / 100;
      if (id === 'stun') { if (s.pc.ccT > 0) t *= 0.5; s.pc.ccT = 5; }
    }
  } else if (HARD_CC.includes(id)) {
    if (a.kind !== 'enemy') return;
    if (a.boss && a.bs) {
      a.bs.stagger += t * 22;
      if (a.bs.stagger >= 100 && a.bs.staggered <= 0) { a.bs.stagger = 0; a.bs.staggered = 3; s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Staggered!', id: a.id }); }
      return;
    }
    if (a.elite) { if (id === 'root') { id = 'chill'; power = 0.4; } else t *= 0.5; }
  }
  const cur = getStatus(a, id);
  if (cur) {
    cur.t = Math.max(cur.t, t); cur.power = Math.max(cur.power, power); cur.stacks = Math.min(maxStacks, cur.stacks + 1); cur.src = src;
  } else a.statuses.push({ id, t, power, stacks: 1, src });
}
export function spawnArea(s: Session, a: Partial<Area> & Pick<Area, 'shape' | 'x' | 'y' | 'src' | 'dtype'>): Area {
  const area: Area = { id: s.id(), dir: 0, r: 0, angle: 0, len: 0, width: 0, delay: 0, t: 0, dur: 0, tick: 0.5, nextTick: 0, ...a };
  area.nextTick = area.delay;
  s.zone.areas.push(area);
  return area;
}
export function spawnProjectile(s: Session, p: Partial<Projectile> & Pick<Projectile, 'x' | 'y' | 'vx' | 'vy' | 'src' | 'dtype' | 'kind'>): Projectile {
  const pr: Projectile = { id: s.id(), px: p.x, py: p.y, r: 0.3, ttl: 1, pierce: 0, hit: [], ...p };
  s.zone.projectiles.push(pr);
  return pr;
}
export function spawnEnemy(s: Session, defId: string, x: number, y: number, lvl: number, o: Partial<Actor> = {}): Actor {
  const d = ENEMY[defId];
  const isObj = d.role === 'object';
  const a: Actor = {
    id: s.id(), kind: defId === 'dummy' ? 'dummy' : defId === 'ward' ? 'ward' : defId === 'conduit' ? 'conduit' : isObj ? 'prop' : 'enemy', def: defId, name: d.name,
    x, y, px: x, py: y, facing: s.rng.range(0, 6.28), r: d.r, hp: 0, maxHp: 0, team: defId === 'urn' || defId === 'brazier' ? 2 : 1, dead: false, deadT: 0, lvl,
    statuses: [], kx: 0, ky: 0, anim: 'idle', animT: 0, animDur: 1, dmg: scaleDmg(d.dmg, lvl), speed: d.speed, armor: (d.armor ?? 0) * (1 + lvl * 0.25),
    res: { ...d.res }, mods: [], elite: false, boss: d.role === 'boss', heavy: !!d.heavy, pack: 0, ...o,
  };
  const diff = s.hero.difficulty;
  if (diff > 0 && !isObj) for (const k of ['ember', 'frost', 'blight'] as DamageType[]) a.res[k] = Math.min(60, (a.res[k] ?? 0) + 15);
  a.maxHp = isObj && defId !== 'conduit' ? d.hp : Math.round(scaleHp(d.hp, lvl) * (a.elite ? (diff > 0 ? 3.2 : 2.5) : 1) * (diff > 0 && !isObj ? 1.15 : 1));
  a.hp = a.maxHp;
  if (a.elite) { a.r *= 1.2; a.dmg *= 1.25; }
  if (a.kind === 'enemy') {
    a.ai = { state: 'dormant', t: 0, atk: -1, cds: d.attacks.map((k) => s.rng.range(0, k.cd * 0.5)), homeX: x, homeY: y, lastX: x, lastY: y, path: [], repath: 0, slot: -1,
      strafe: s.rng.chance(0.5) ? 1 : -1, aimX: x, aimY: y, areaId: 0, modT: a.mods.map(() => s.rng.range(2, 5)), think: s.rng.range(0, 0.3), lungeT: 0, wardId: 0 };
  }
  s.zone.actors.push(a);
  return a;
}
export function alertPack(s: Session, a: Actor): void {
  for (const o of s.zone.actors) {
    if (o.kind !== 'enemy' || o.dead || !o.ai || o.ai.state !== 'dormant') continue;
    if (o === a || (a.pack && o.pack === a.pack) || dist(a.x, a.y, o.x, o.y) < 7) { o.ai.state = 'approach'; o.ai.t = 0; }
  }
}
export function healPlayer(s: Session, amount: number, silent = false): void {
  const p = s.player;
  if (p.dead || amount <= 0) return;
  const before = p.hp;
  p.hp = Math.min(s.stats.hpMax, p.hp + amount);
  if (!silent && p.hp - before >= 1) s.emit({ type: 'heal', x: p.x, y: p.y, a: p.hp - before });
}
export interface HitOpts { dot?: boolean; melee?: boolean; fromX?: number; fromY?: number; heavy?: boolean; silent?: boolean }

/** Damage against the player: evade, block, Guard, armor/resistance, Heat, thorns, death. Returns damage dealt. */
export function damagePlayer(s: Session, raw: number, dtype: DamageType, src: Src, o: HitOpts = {}): number {
  const p = s.player, st = s.stats, pc = s.pc;
  if (p.dead || s.zone.safe || raw <= 0) return 0;
  const cloak = getStatus(p, 'cloak');
  if (!o.dot && cloak && cloak.power > 0) { cloak.power = 0; s.emit({ type: 'evade', x: p.x, y: p.y }); return 0; }
  const std = getStatus(p, 'standard');
  if (std) raw *= 1 - std.power / 100;
  if (!o.dot && st.blockT > 0 && s.rng.chance(st.blockT / 100)) {
    raw *= 0.3;
    if (s.hero.cls === 'cinder') pc.heat = Math.min(100, pc.heat + 12 * (1 + (st.heatGain ?? 0) / 100));
    s.emit({ type: 'block', x: p.x, y: p.y });
    if (st.relic_covenant) spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: 4, src: { id: p.id, name: s.hero.name, team: 0, coef: 0.5, skill: 'iron_litany' }, dtype: 'frost', status: { id: 'chill', t: 3, power: 0.35 }, fx: 'frost' });
  }
  const res = dtype === 'ember' ? st.resEmberT : dtype === 'frost' ? st.resFrostT : dtype === 'blight' ? st.resBlightT : 0;
  const tonic = getStatus(p, 'tonic');
  let dmg = dtype === 'physical' ? raw * (1 - armorReduction(st.armorTotal, raw)) : raw * (1 - Math.min(75, res + (tonic ? tonic.power : 0)) / 100);
  const guard = getStatus(p, 'guard');
  if (guard && guard.power > 0) { const ab = Math.min(guard.power, dmg); guard.power -= ab; dmg -= ab; if (guard.power <= 0) guard.t = Math.min(guard.t, 0.01); }
  dmg = Math.max(0, dmg);
  if (s.hero.cls === 'cinder') pc.heat = Math.min(100, pc.heat + (dmg / st.hpMax) * 140 * (1 + (st.heatGain ?? 0) / 100) + (o.dot ? 0 : 2));
  if (o.melee && st.thornsT > 0) { const atk = s.actor(src.id); if (atk && !atk.dead) damageEnemy(s, atk, st.thornsT, 'ember', { id: p.id, name: s.hero.name, team: 0 }, { silent: true }); }
  if (dmg <= 0) return 0;
  p.hp -= dmg; pc.lastHit = 0; pc.lastSrc = src.name; pc.lastType = dtype;
  if (!o.dot) { if (pc.gate >= 0) { pc.gate = -1; s.emit({ type: 'toast', x: p.x, y: p.y, text: 'Town gate interrupted' }); } p.anim = p.anim === 'idle' || p.anim === 'walk' ? 'hit' : p.anim; }
  s.emit({ type: 'hit', x: p.x, y: p.y, a: dmg, id: p.id, dtype, dot: o.dot, b: o.heavy ? 1 : 0 });
  if (p.hp <= 0) { p.hp = 0; s.playerDeath(src, dtype); }
  return dmg;
}
/** Damage against a non-player actor: shield facing, wards, boss armor, exposure, mitigation, reflection, death. */
export function damageEnemy(s: Session, a: Actor, raw: number, dtype: DamageType, src: Src, o: HitOpts = {}): number {
  if (a.dead || a.untargetable || raw <= 0) return 0;
  if (a.invuln) { if (!o.dot && !o.silent) s.emit({ type: 'block', x: a.x, y: a.y, text: 'Immune', id: a.id }); return 0; }
  const def = ENEMY[a.def];
  const fx = o.fromX ?? s.actor(src.id)?.x ?? a.x, fy = o.fromY ?? s.actor(src.id)?.y ?? a.y;
  if (def.shield && !o.dot && !hasStatus(a, 'stun') && Math.abs(angDiff(angTo(a.x, a.y, fx, fy), a.facing)) < 1.05) {
    raw *= 0.4; s.emit({ type: 'block', x: a.x, y: a.y, text: 'Deflected', id: a.id });
  }
  const ward = getStatus(a, 'ward');
  if (ward) raw *= 0.6;
  const bs = a.bs;
  if (bs) {
    if (bs.armor > 0) {
      bs.armor -= raw; raw *= 0.45;
      if (bs.armor <= 0) { bs.armor = 0; bs.armorBroken = 5; s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Armor broken!', id: a.id }); s.emit({ type: 'fx', x: a.x, y: a.y, s: 'break', a: 3 }); }
    }
    if (bs.armorBroken > 0 || bs.staggered > 0) raw *= 1.35;
  }
  const ex = getStatus(a, 'expose');
  if (ex) raw *= 1 + ex.power;
  let dmg = dtype === 'physical' ? raw * (1 - armorReduction(a.armor, raw)) : raw * (1 - Math.min(75, a.res[dtype] ?? 0) / 100);
  dmg = Math.max(1, dmg);
  const shell = getStatus(a, 'shell');
  if (shell && src.team === 0 && !o.dot) damagePlayer(s, dmg * 0.25, dtype, { id: a.id, name: `${a.name} (Mirror Shell)`, team: 1 }, { silent: true });
  a.hp -= dmg; a.dmgTaken = (a.dmgTaken ?? 0) + dmg;
  if (src.team === 0) { s.hero.stats.damageDealt += dmg; if (bs && bs.cast > 0) bs.castDmg += dmg; if (a.ai?.state === 'dormant') alertPack(s, a); s.dps.push([s.time, dmg]); }
  if (!o.silent || dmg >= 1) s.emit({ type: 'hit', x: a.x, y: a.y, a: dmg, id: a.id, dtype, crit: src.crit, dot: o.dot });
  if (def.split && a.hp > 0 && a.hp <= a.maxHp / 2) {
    a.hp = 0; a.noXp = true;
    for (const k of [-1, 1]) { const c = spawnEnemy(s, def.split, a.x + k * 0.6, a.y + k * 0.4, a.lvl, { pack: a.pack }); c.ai!.state = 'approach'; c.kx = k * 5; c.ky = -k * 4; }
    s.emit({ type: 'fx', x: a.x, y: a.y, s: 'split', a: 1.5 });
  }
  if (a.hp <= 0) killActor(s, a, src);
  return dmg;
}
export function killActor(s: Session, a: Actor, src: Src): void {
  if (a.dead) return;
  a.dead = true; a.hp = 0; a.deadT = 0; a.statuses = [];
  if (a.ai) a.ai.state = 'dead';
  for (const ar of s.zone.areas) if (ar.cancelOnOwner && ar.src.id === a.id && ar.t < ar.delay) ar.done = true;
  s.emit({ type: 'death', x: a.x, y: a.y, id: a.id, s: a.def, a: a.r });
  if (a.def === 'brazier') {
    spawnArea(s, { shape: 'circle', x: a.x, y: a.y, r: 3.3, delay: 0.7, src: { id: a.id, name: 'Volatile Brazier', team: 2, dmg: scaleDmg(ENEMY.brazier.dmg, s.zone.level + 1) * 1.6 }, dtype: 'ember', hitAll: true, heavy: true, fx: 'explosion', knock: 5,
      status: { id: 'burn', t: 3, power: scaleDmg(3, s.zone.level) } });
  }
  s.onKill(a, src);
}
export interface PHit { forceCrit?: boolean; fromX?: number; fromY?: number; noProc?: boolean; mult?: number }
/** Resolves one player hit from skill data. The same coefficient and modifier list feed the tooltip preview. */
export function playerHit(s: Session, t: Actor, def: SkillDef, coef: number, dtype: DamageType, o: PHit = {}): number {
  if (t.dead || t.untargetable) return 0;
  const st = s.stats, p = s.player;
  let pct = 0;
  for (const m of def.mods) pct += st[m] ?? 0;
  if (hasStatus(t, 'burn')) pct += (st.dmgVsBurning ?? 0) + (def.p.vsBurn ?? 0) * 100;
  if (hasStatus(t, 'chill') || hasStatus(t, 'root')) pct += st.dmgVsSlowed ?? 0;
  const d = dist(p.x, p.y, t.x, t.y);
  const crit = t.kind !== 'prop' && (o.forceCrit || s.rng.chance((st.crit + (d > 8 ? st.farCrit ?? 0 : 0)) / 100));
  const raw = s.rng.range(st.dmgMin, st.dmgMax) * coef * (1 + pct / 100) * (crit ? st.critMult : 1) * (o.mult ?? 1);
  const src: Src = { id: p.id, name: s.hero.name, team: 0, crit, skill: def.id };
  const ho = { fromX: o.fromX ?? p.x, fromY: o.fromY ?? p.y };
  const dealt = damageEnemy(s, t, raw, dtype, src, ho);
  if (o.noProc || t.kind === 'prop') return dealt;
  const k = clamp(coef, 0.3, 1.5);
  const plain: Src = { id: p.id, name: s.hero.name, team: 0 };
  if (st.addEmber) damageEnemy(s, t, st.addEmber * k, 'ember', plain, ho);
  if (st.addFrost) { damageEnemy(s, t, st.addFrost * k, 'frost', plain, ho); if (s.rng.chance(0.25)) addStatus(s, t, 'chill', 2.5, 0.3, p.id); }
  if (st.addBlight) damageEnemy(s, t, st.addBlight * k, 'blight', plain, ho);
  const fur = getStatus(p, 'furnace');
  if (fur && def.tags.includes('melee')) damageEnemy(s, t, raw * fur.power, 'ember', plain, ho);
  if (st.focusOnHit) s.pc.focus = Math.min(st.focusMax, s.pc.focus + st.focusOnHit);
  if (crit && st.relic_signet) s.pc.focus = Math.min(st.focusMax, s.pc.focus + 5);
  if (def.ailment && !t.dead) {
    const ch = def.ailment.chance + (st.ailmentChance ?? 0) / 100;
    if (ch > 0 && s.rng.chance(ch)) {
      const bonus = def.ailment.id === 'burn' ? st.burnPct ?? 0 : st.blightPct ?? 0;
      addStatus(s, t, def.ailment.id, def.ailment.t, ((st.dmgMin + st.dmgMax) / 2) * def.ailment.power * (1 + bonus / 100) * (1 + (st.dmgPct ?? 0) / 100), p.id);
    }
  }
  return dealt;
}
/** Timed statuses and damage-over-time. DoTs tick twice per second. */
export function tickStatuses(s: Session, a: Actor, dotTick: boolean): void {
  if (!a.statuses.length) return;
  for (const st of a.statuses) {
    st.t -= DT;
    if (dotTick && (st.id === 'burn' || st.id === 'blight') && !a.dead) {
      const type: DamageType = st.id === 'burn' ? 'ember' : 'blight';
      if (a.kind === 'player') damagePlayer(s, st.power * 0.5, type, { id: st.src, name: st.id === 'burn' ? 'Burning' : 'Blight', team: 1 }, { dot: true });
      else damageEnemy(s, a, st.power * 0.5, type, { id: st.src, name: s.hero.name, team: 0 }, { dot: true });
    }
  }
  if (a.dead) return;
  const ended = a.statuses.filter((st) => st.t <= 0);
  if (ended.length) {
    a.statuses = a.statuses.filter((st) => st.t > 0);
    if (a.kind === 'player') for (const e of ended) s.onStatusEnd(e);
  }
}
const inArea = (ar: Area, t: Actor) => ar.shape === 'circle' ? inCircle(t.x, t.y, t.r, ar.x, ar.y, ar.r)
  : ar.shape === 'cone' ? inCone(t.x, t.y, t.r, ar.x, ar.y, ar.dir, ar.r, ar.angle) : inRect(t.x, t.y, t.r, ar.x, ar.y, ar.dir, ar.len, ar.width);

function applyArea(s: Session, ar: Area): void {
  const fromPlayer = ar.src.team === 0;
  let hits = 0;
  for (const t of [...s.zone.actors]) {
    if (t.dead || t.untargetable || t.kind === 'npc' || t.id === ar.src.id) continue;
    if (!ar.hitAll && (fromPlayer ? t.team === 0 : t.team !== 0)) continue;
    if (t.kind === 'standard') continue;
    if (!inArea(ar, t)) continue;
    if (ar.hitIds) { if (ar.hitIds.includes(t.id)) continue; ar.hitIds.push(t.id); }
    hits++;
    if (t.kind === 'player') {
      const d = damagePlayer(s, ar.src.dmg ?? 0, ar.dtype, ar.src, { heavy: ar.heavy, melee: ar.melee, dot: ar.dur > 0 && ar.tick < 0.3 });
      if (d > 0 || !ar.src.dmg) { if (ar.status) addStatus(s, t, ar.status.id, ar.status.t, ar.status.power, ar.src.id); }
    } else if (fromPlayer) {
      if (ar.src.coef) playerHit(s, t, SKILL[ar.src.skill ?? 'iron_litany'], ar.src.coef, ar.dtype, { fromX: ar.x, fromY: ar.y, noProc: ar.dur > 0 });
      if (ar.status && !t.dead) addStatus(s, t, ar.status.id, ar.status.t, ar.status.power, ar.src.id);
    } else {
      damageEnemy(s, t, (ar.src.dmg ?? 0) * 1.6, ar.dtype, ar.src, { fromX: ar.x, fromY: ar.y });
    }
    if (ar.knock && !t.dead && (t.kind === 'player' || !t.heavy)) {
      const ang = ar.shape === 'circle' ? angTo(ar.x, ar.y, t.x, t.y) : ar.dir;
      t.kx += Math.cos(ang) * ar.knock; t.ky += Math.sin(ang) * ar.knock;
    }
  }
  if (!ar.silent && !ar.fired) s.emit({ type: 'fx', x: ar.x, y: ar.y, s: ar.fx ?? (ar.shape === 'circle' ? 'burst' : 'slash'), a: ar.shape === 'circle' ? ar.r : ar.shape === 'cone' ? ar.r : ar.len, b: ar.dir, dtype: ar.dtype, id: hits });
  ar.fired = true;
}
export function updateAreas(s: Session): void {
  const z = s.zone;
  for (const ar of z.areas) {
    if (ar.done) continue;
    if (ar.follow) {
      const o = s.actor(ar.follow);
      if (!o || o.dead) { ar.done = true; continue; }
      ar.x = o.x; ar.y = o.y;
    }
    if (ar.cancelOnOwner && ar.t < ar.delay) {
      const o = s.actor(ar.src.id);
      if (!o || o.dead || hasStatus(o, 'stun') || (o.bs && o.bs.staggered > 0)) { ar.done = true; continue; }
    }
    ar.t += DT;
    if (ar.t < ar.delay) continue;
    if (ar.vx || ar.vy) { ar.x += (ar.vx ?? 0) * DT; ar.y += (ar.vy ?? 0) * DT; }
    if (ar.tag === 'trap') {
      const trig = z.actors.some((t) => t.team === 1 && !t.dead && !t.untargetable && inCircle(t.x, t.y, t.r, ar.x, ar.y, ar.trig ?? 1.5));
      if (trig) {
        const def = SKILL.snare_bloom, st = s.stats;
        spawnArea(s, { shape: 'circle', x: ar.x, y: ar.y, r: ar.r, src: ar.src, dtype: ar.dtype, fx: 'bloom', status: { id: 'root', t: def.p.root * (1 + (st.trapDur ?? 0) / 100), power: 0 } });
        ar.done = true;
      } else if (ar.t >= ar.delay + ar.dur) ar.done = true;
      continue;
    }
    if (ar.dur <= 0) { applyArea(s, ar); ar.done = true; continue; }
    if (ar.t >= ar.nextTick) { ar.nextTick += ar.tick; applyArea(s, ar); }
    if (ar.t >= ar.delay + ar.dur) ar.done = true;
  }
  if (z.areas.some((a) => a.done)) z.areas = z.areas.filter((a) => !a.done);
}
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
export function updateProjectiles(s: Session): void {
  const z = s.zone;
  for (const p of z.projectiles) {
    if (p.done) continue;
    p.px = p.x; p.py = p.y;
    p.x += p.vx * DT; p.y += p.vy * DT; p.ttl -= DT;
    const c = cellAt(z, cellOf(p.x), cellOf(p.y));
    if (c === WALL || c === DOOR || p.ttl <= 0) { p.done = true; if (p.ttl > 0) s.emit({ type: 'fx', x: p.x, y: p.y, s: 'spark', dtype: p.dtype }); continue; }
    for (const t of z.actors) {
      if (t.dead || t.untargetable || t.kind === 'npc' || t.kind === 'standard' || p.hit.includes(t.id)) continue;
      if (p.src.team === 0 ? t.team === 0 || t.invuln : t.team !== 0) continue; // shots pass through immune targets
      if (segDist(t.x, t.y, p.px, p.py, p.x, p.y) > p.r + t.r) continue;
      p.hit.push(t.id);
      s.onProjectileHit(p, t);
      if (p.pierce > 0 && t.kind !== 'player') p.pierce--; else { p.done = true; break; }
    }
  }
  if (z.projectiles.some((p) => p.done)) z.projectiles = z.projectiles.filter((p) => !p.done);
}
/** Knockback integration with wall sliding; decays quickly so control is never lost for long. */
export function integrateKnock(s: Session, a: Actor): void {
  if (!a.kx && !a.ky) return;
  moveCircle(s.zone, a, a.kx * DT, a.ky * DT, a.kind === 'player' ? a.r : Math.min(0.7, a.r * 0.8)); // same radius as locomotion, so knockback can never wedge an actor into a wall
  a.kx *= 0.78; a.ky *= 0.78;
  if (Math.abs(a.kx) + Math.abs(a.ky) < 0.2) { a.kx = 0; a.ky = 0; }
}
