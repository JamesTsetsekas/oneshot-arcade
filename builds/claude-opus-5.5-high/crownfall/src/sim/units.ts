// Minion, tower and monster behaviour (server-side unit AI).
import type { Match } from './match';
import type { Unit } from './types';
import { LANES, CampDef, CampKind } from '../shared/map';
import * as R from '../shared/rules';
import { dist } from '../shared/math';
import { dealDamage, addEffect, hasEffect, isHardCC } from './combat';
import { resolveStatic, walkableAt } from './nav';
import { ZERO_STATS } from '../shared/types';

export function campSpec(kind: CampKind) {
  if (kind === 'catalystGale' || kind === 'catalystForge') return { firstSpawn: R.CATALYST_SPAWN, respawn: R.CATALYST_RESPAWN };
  if (kind === 'colossus') return { firstSpawn: R.COLOSSUS_SPAWN, respawn: R.COLOSSUS_RESPAWN };
  if (kind === 'buffForge' || kind === 'buffSpring') return { firstSpawn: R.CAMP_FIRST_SPAWN, respawn: R.BUFF_RESPAWN };
  return { firstSpawn: R.CAMP_FIRST_SPAWN, respawn: R.CAMP_RESPAWN };
}

export function spawnCamp(m: Match, def: CampDef): Unit[] {
  const spec = R.MONSTERS[def.kind];
  const out: Unit[] = [];
  const grow = 1 + R.MONSTER_GROWTH_PER_MIN * (m.time / 60);
  for (let i = 0; i < spec.count; i++) {
    const a = (i / spec.count) * Math.PI * 2 + 0.7;
    const off = spec.count > 1 ? 1.4 : 0;
    const x = def.x + Math.cos(a) * off, y = def.y + Math.sin(a) * off;
    const stats = { ...ZERO_STATS(), maxHp: spec.hp * grow, ad: spec.ad, armor: spec.armor, ward: spec.armor, as: spec.as, ms: 3.3, range: spec.ranged ? 5 : spec.radius + 0.9 };
    out.push(m.spawnMonster(def.key, def.kind, x, y, def.leash, stats, spec.radius, spec.ranged, spec.name));
  }
  return out;
}

function moveToward(m: Match, u: Unit, tx: number, ty: number, dt: number, stopAt = 0) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
  if (d <= stopAt + 0.01) return true;
  const step = Math.min(d - stopAt, u.stats.ms * dt);
  u.x += (dx / d) * step; u.y += (dy / d) * step;
  u.facing = Math.atan2(dy, dx);
  const p = resolveStatic(u.x, u.y, u.radius);
  u.x = p.x; u.y = p.y;
  u.anim = 1;
  return false;
}

function canMove(u: Unit) { return !isHardCC(u) && !hasEffect(u, 'root'); }

// ------------------------------------------------------------------ minions
export function updateMinion(m: Match, u: Unit, dt: number) {
  const mi = u.minion!;
  u.atkCd -= dt;
  if (isHardCC(u)) return;
  if (m.teamBuff(u.team, 'colossus') && (m.tick + u.id) % 10 === 0) {
    if (m.heroes.some((h) => h.alive && h.team === u.team && dist(h.x, h.y, u.x, u.y) < 12)) mi.empoweredUntil = m.time + 0.5;
  }
  const pts = LANES[mi.lane];
  let target = m.byId.get(u.atkTarget);
  const acq = 7.5;
  if ((m.tick + u.id) % 6 === 0 || !target || !target.alive) {
    let next: Unit | null = null;
    // 1) call for help: enemy hero attacking an allied hero nearby
    for (const h of m.unitsInRadius(u.x, u.y, acq, (t) => t.kind === 'hero' && t.team !== u.team && t.alive)) {
      const hs = h.hero!;
      if (m.time - hs.aggroAt > 2) continue;
      const victim = m.byId.get(hs.aggroVictim);
      if (victim && victim.team === u.team && victim.kind === 'hero' && dist(victim.x, victim.y, u.x, u.y) < 11 && m.visibleTo(u.team as 0 | 1, h)) { next = h; mi.aggroUntil = m.time + 2.5; break; }
    }
    if (!next && target && target.alive && m.canAttackTarget(u, target) && dist(u.x, u.y, target.x, target.y) < acq + 1.5 && (target.kind !== 'hero' || mi.aggroUntil > m.time)) next = target;
    if (!next) {
      let bd = Infinity;
      for (const t of m.unitsInRadius(u.x, u.y, acq, (t) => m.canAttackTarget(u, t) && t.kind !== 'decoy' && t.kind !== 'ward')) {
        if (t.structure && m.structureInvulnerable(t)) continue;
        let d = dist(u.x, u.y, t.x, t.y);
        if (t.kind === 'hero') d += 5; else if (t.structure) d += 8; else if (t.kind === 'wall') d += 2; else if (t.kind === 'monster') d += 20;
        if (d < bd) { bd = d; next = t; }
      }
    }
    if (next !== target) { u.atkTarget = next ? next.id : 0; if (u.atkPhase === 1) u.atkPhase = 0; }
    target = next ?? undefined;
  }
  if (target && target.alive) {
    if (m.inAttackRange(u, target)) {
      if (u.atkPhase === 2 && u.atkCd <= 0) u.atkPhase = 0;
      m.attackStep(u, target, dt);
      return;
    }
    if (u.atkPhase === 1) u.atkPhase = 0;
    if (!canMove(u)) return;
    moveToward(m, u, target.x, target.y, dt, u.radius + target.radius + u.stats.range * 0.8);
    // leash to lane
    const li = nearestLaneIndex(pts, u.x, u.y, mi.wp);
    if (dist(u.x, u.y, pts[li].x, pts[li].y) > 9) u.atkTarget = 0;
    return;
  }
  if (!canMove(u)) return;
  // follow lane
  const dir = u.team === 0 ? 1 : -1;
  const li = nearestLaneIndex(pts, u.x, u.y, mi.wp);
  if ((dir > 0 && li > mi.wp) || (dir < 0 && li < mi.wp)) mi.wp = li;
  let wp = mi.wp + dir * 3;
  wp = Math.max(0, Math.min(pts.length - 1, wp));
  const p = pts[wp];
  // lateral offset by id keeps waves from single-filing
  const off = ((u.id % 5) - 2) * 0.55;
  const nx = pts[Math.min(pts.length - 1, wp + 1)].y - pts[Math.max(0, wp - 1)].y;
  const ny = -(pts[Math.min(pts.length - 1, wp + 1)].x - pts[Math.max(0, wp - 1)].x);
  const nl = Math.hypot(nx, ny) || 1;
  moveToward(m, u, p.x + (nx / nl) * off, p.y + (ny / nl) * off, dt);
}

function nearestLaneIndex(pts: { x: number; y: number }[], x: number, y: number, hint: number): number {
  let bi = hint, bd = Infinity;
  const lo = Math.max(0, hint - 25), hi = Math.min(pts.length - 1, hint + 25);
  for (let i = lo; i <= hi; i++) {
    const d = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2;
    if (d < bd) { bd = d; bi = i; }
  }
  return bi;
}

// ------------------------------------------------------------------ towers
export function updateTower(m: Match, u: Unit, dt: number) {
  const s = u.structure!;
  s.atkCd -= dt;
  const range = u.stats.range;
  if (u.kind === 'fountain') {
    if (s.atkCd > 0) return;
    const t = m.unitsInRadius(u.x, u.y, range, (t) => t.alive && t.team !== u.team && (t.kind === 'hero' || t.kind === 'minion'))[0];
    if (t) {
      s.atkCd = 0.6; s.target = t.id;
      m.spawnProjectile({ owner: u, dx: 1, dy: 0, speed: 40, maxDist: 40, radius: 0.3, visual: 'fountain-shot', homing: t.id, passWalls: true, onHit: (tt) => { dealDamage(m, u, tt, 800, 'pure', { kind: 'tower', source: 'Fountain' }); return true; } });
    }
    return;
  }
  const inRange = (t: Unit) => dist(u.x, u.y, t.x, t.y) <= range + t.radius;
  // aggressor rule: enemy hero who damaged an allied hero inside tower range in the last 2 s
  let aggressor: Unit | null = null;
  for (const h of m.unitsInRadius(u.x, u.y, range, (t) => t.kind === 'hero' && t.alive && t.team !== u.team)) {
    const hs = h.hero!;
    if (m.time - hs.aggroAt > 2) continue;
    const v = m.byId.get(hs.aggroVictim);
    if (v && v.kind === 'hero' && v.team === u.team && dist(u.x, u.y, v.x, v.y) <= range + 1) { aggressor = h; break; }
  }
  let cur = m.byId.get(s.target);
  const valid = cur && cur.alive && cur.team !== u.team && inRange(cur) && !cur.untargetable && cur.kind !== 'ward';
  let next: Unit | null = valid ? cur! : null;
  if (aggressor && cur !== aggressor) next = aggressor;
  if (!next) {
    let best: Unit | null = null, bd = Infinity;
    for (const t of m.unitsInRadius(u.x, u.y, range, (t) => t.alive && t.team !== u.team && t.team !== 2 && !t.untargetable && t.kind !== 'ward' && t.kind !== 'decoy' && !t.structure)) {
      let d = dist(u.x, u.y, t.x, t.y);
      if (t.kind === 'hero') d += 100;
      else if (t.kind === 'wall') d += 50;
      if (d < bd) { bd = d; best = t; }
    }
    next = best;
  }
  if ((next?.id ?? 0) !== s.target) {
    s.target = next?.id ?? 0;
    if (next && next.kind === 'hero') m.emit({ e: 'fx', kind: 'tower-target', x: u.x, y: u.y, id: next.id, team: u.team }, { x: u.x, y: u.y });
  }
  if (!next || s.atkCd > 0) return;
  s.atkCd = R.TOWER_ATTACK_PERIOD;
  u.facing = Math.atan2(next.y - u.y, next.x - u.x);
  const tgt = next;
  m.emit({ e: 'attack', id: u.id, tgt: tgt.id, x: u.x, y: u.y, ranged: true, sub: 'tower' }, { x: u.x, y: u.y });
  m.spawnProjectile({ owner: u, dx: 1, dy: 0, speed: 24, maxDist: 30, radius: 0.3, visual: 'tower-shot', homing: tgt.id, passWalls: true, onHit: (tt) => { m.applyAttack(u, tt); return true; } });
}

// ------------------------------------------------------------------ monsters
export function updateMonster(m: Match, u: Unit, dt: number) {
  const mo = u.monster!;
  u.atkCd -= dt;
  mo.specialCd -= dt;
  const homeD = dist(u.x, u.y, mo.homeX, mo.homeY);
  if (mo.resetting) {
    u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * 0.25 * dt);
    if (moveToward(m, u, mo.homeX, mo.homeY, dt * 1.6, 0.3)) {
      mo.resetting = false; u.hp = u.stats.maxHp; mo.aggro = 0; mo.contributors.clear(); u.anim = 0; u.atkTarget = 0;
    }
    return;
  }
  if (!mo.aggro) {
    for (const o of m.units) if (o !== u && o.alive && o.monster && o.monster.camp === mo.camp && o.monster.aggro) { mo.aggro = o.monster.aggro; break; }
  }
  if (!mo.aggro) {
    if (u.hp < u.stats.maxHp) u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * 0.05 * dt);
    if (homeD > 0.5) moveToward(m, u, mo.homeX, mo.homeY, dt); else u.anim = 0;
    return;
  }
  let t = m.byId.get(mo.aggro);
  if (!t || !t.alive || t.kind === 'ward') {
    // pick another contributor within leash
    let nt: Unit | null = null;
    for (const id of mo.contributors.keys()) {
      const c = m.byId.get(id);
      if (c && c.alive && dist(c.x, c.y, mo.homeX, mo.homeY) < mo.leash) { nt = c; break; }
    }
    if (!nt) { startReset(m, u); return; }
    mo.aggro = nt.id; t = nt;
  }
  if (dist(t.x, t.y, mo.homeX, mo.homeY) > mo.leash + 2 || homeD > mo.leash + 1 || m.time - u.lastDamagedAt > 8) { startReset(m, u); return; }
  if (isHardCC(u)) return;
  // signature telegraphed attacks
  const big = mo.kind === 'colossus' || mo.kind.startsWith('catalyst') || mo.kind.startsWith('buff');
  if (big && mo.specialCd <= 0) {
    mo.specialCd = mo.kind === 'colossus' ? 7 : 8;
    const r = mo.kind === 'colossus' ? 5.5 : 3;
    const cx = mo.kind === 'colossus' ? u.x : t.x, cy = mo.kind === 'colossus' ? u.y : t.y;
    const dmg = mo.kind === 'colossus' ? 220 : mo.kind.startsWith('catalyst') ? 110 : 55;
    const z = m.spawnZone({ team: 2, owner: u.id, x: cx, y: cy, shape: { type: 'circle', r }, dur: 1.1, visual: mo.kind === 'colossus' ? 'colossus-slam' : 'monster-slam', hostile: true, publicTelegraph: true });
    z.onEnd = () => {
      if (!u.alive) return;
      m.emit({ e: 'fx', kind: 'slam', x: cx, y: cy, r, team: 2 }, { x: cx, y: cy });
      for (const v of m.unitsInRadius(cx, cy, r, (x) => x.alive && (x.kind === 'hero' || x.kind === 'minion'))) {
        dealDamage(m, u, v, dmg * (1 + R.MONSTER_GROWTH_PER_MIN * (m.time / 60)), 'physical', { kind: 'ability', source: `${u.name} slam` });
        if (mo.kind === 'colossus') addEffect(m, v, { kind: 'slow', until: m.time + 1.5, value: 0.4, src: u.id }, u.name);
      }
      m.shake(cx, cy, mo.kind === 'colossus' ? 0.5 : 0.2);
    };
  }
  if (m.inAttackRange(u, t)) {
    if (u.atkPhase === 2 && u.atkCd <= 0) u.atkPhase = 0;
    m.attackStep(u, t, dt);
  } else {
    if (u.atkPhase === 1) u.atkPhase = 0;
    moveToward(m, u, t.x, t.y, dt, u.radius + t.radius + u.stats.range * 0.8);
  }
}

function startReset(m: Match, u: Unit) {
  const mo = u.monster!;
  mo.resetting = true; mo.aggro = 0; u.atkTarget = 0; u.atkPhase = 0;
  for (const o of m.units) if (o !== u && o.alive && o.monster && o.monster.camp === mo.camp && !o.monster.resetting) { o.monster.resetting = true; o.monster.aggro = 0; }
  m.emit({ e: 'fx', kind: 'monster-reset', x: u.x, y: u.y, id: u.id }, { x: u.x, y: u.y });
  void walkableAt;
}
