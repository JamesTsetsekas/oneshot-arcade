import { angTo, clamp, dist, inCone } from '../core/math';
import { addStatus, damagePlayer, getStatus, hasStatus, playerHit, removeStatus, spawnArea, spawnProjectile } from '../entity-combat/combat';
import type { Actor, Projectile, Src } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { nearestFree, walkLine } from '../navigation-ai/grid';
import { SKILL, rankMul, type SkillDef } from './skills';

const psrc = (s: Session, def: SkillDef, coef: number): Src => ({ id: s.player.id, name: s.hero.name, team: 0, coef, skill: def.id });
const targets = (s: Session) => s.zone.actors.filter((t) => !t.dead && !t.untargetable && t.team !== 0 && t.kind !== 'npc' && t.kind !== 'standard');

/** Start-of-cast effects (telegraphs the player sees during wind-up). */
export function beginSkill(s: Session, def: SkillDef, rank: number): void {
  const p = s.player, pc = s.pc, mul = rankMul(def, rank);
  if (def.effect === 'ring') {
    const heat = pc.heat;
    const coef = def.coef * mul * (1 + (heat / 100) * def.p.heatBonus);
    pc.heat = s.stats.cap_living_crucible ? heat * 0.35 : 0;
    spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: def.p.r, delay: def.windup / 1000, follow: p.id, src: psrc(s, def, coef), dtype: 'ember', fx: 'explosion', knock: 3 });
    if (s.stats.relic_tollbell) spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: def.p.r, delay: def.windup / 1000 + 0.55, follow: p.id, src: psrc(s, def, coef * 0.5), dtype: 'ember', fx: 'explosion' });
  }
}
/** Resolves a skill at the end of its wind-up. All numbers come from the SkillDef. */
export function executeSkill(s: Session, def: SkillDef, rank: number, ax: number, ay: number): void {
  const p = s.player, pc = s.pc, st = s.stats, mul = rankMul(def, rank);
  const dir = angTo(p.x, p.y, ax, ay);
  const cx = Math.cos(dir), cy = Math.sin(dir);
  const cloaked = hasStatus(p, 'cloak');
  if (cloaked && def.effect !== 'cloak') removeStatus(p, 'cloak');
  s.emit({ type: 'sfx', x: p.x, y: p.y, s: def.sfx });
  switch (def.effect) {
    case 'arc': {
      let hit = 0;
      for (const t of targets(s)) if (inCone(t.x, t.y, t.r, p.x, p.y, dir, def.p.r, def.p.angle)) { playerHit(s, t, def, def.coef * mul, def.dtype); hit++; }
      s.emit({ type: 'swing', x: p.x, y: p.y, a: def.p.r, b: dir, s: def.id, dtype: def.dtype, id: def.p.angle * 100 });
      if (def.kind === 'basic') {
        if (hit) { pc.focus = Math.min(st.focusMax, pc.focus + def.p.focus); pc.heat = Math.min(100, pc.heat + 1.5); pc.combo++; }
        if (hit && pc.combo >= 3) {
          pc.combo = 0;
          spawnArea(s, { shape: 'cone', x: p.x, y: p.y, dir, r: def.p.waveR, angle: def.p.waveAngle, delay: 0.06, src: psrc(s, def, def.p.waveCoef), dtype: 'physical', fx: 'wave', knock: 2.5 });
        }
      }
      break;
    }
    case 'dash': {
      const g = st.hpMax * def.p.guard * mul * (1 + (st.guardPct ?? 0) / 100) * (st.cap_unbroken_oath ? 1.5 : 1);
      addStatus(s, p, 'guard', def.p.guardT, g, p.id);
      const cur = getStatus(p, 'guard'); if (cur) { cur.power = g; cur.t = def.p.guardT; }
      pc.dash = { vx: cx * def.p.dist / def.p.time, vy: cy * def.p.dist / def.p.time, t: def.p.time, hit: [], skill: def.id, coef: def.coef * mul, phase: true };
      if (st.relic_emberwake) spawnArea(s, { shape: 'rect', x: p.x, y: p.y, dir, len: def.p.dist, width: 1.6, dur: 3, tick: 0.5, src: psrc(s, SKILL.brand_arc, 0.35), dtype: 'ember', fx: 'none', silent: true, tag: 'fire' });
      break;
    }
    case 'chain':
      spawnProjectile(s, { x: p.x + cx * 0.6, y: p.y + cy * 0.6, vx: cx * def.p.speed, vy: cy * def.p.speed, ttl: def.p.range / def.p.speed, r: 0.55, src: psrc(s, def, def.coef * mul), dtype: 'physical', kind: 'chain', special: 'chain' });
      break;
    case 'furnace':
      if (pc.heat < def.p.minHeat) { pc.cds[def.id] = 0.5; s.emit({ type: 'toast', x: p.x, y: p.y, text: `Needs ${def.p.minHeat} Heat` }); s.emit({ type: 'sfx', x: p.x, y: p.y, s: 'invalid' }); break; }
      addStatus(s, p, 'furnace', def.p.dur, def.p.conv * mul, p.id);
      s.emit({ type: 'fx', x: p.x, y: p.y, s: 'furnace', a: 2.5, dtype: 'ember' });
      break;
    case 'standard': {
      const pos = nearestFree(s.zone, p.x + cx * 1.3, p.y + cy * 1.3) ?? { x: p.x, y: p.y };
      for (const o of s.zone.actors) if (o.kind === 'standard') o.dead = true;
      s.zone.actors.push({ id: s.id(), kind: 'standard', def: 'standard', name: 'Ashen Standard', x: pos.x, y: pos.y, px: pos.x, py: pos.y, facing: 0, r: 0.3, hp: 1, maxHp: 1, team: 0, dead: false, deadT: 0, lvl: 1,
        statuses: [], kx: 0, ky: 0, anim: 'idle', animT: 0, animDur: 1, dmg: def.p.def * mul, speed: 0, armor: 0, res: {}, mods: [], elite: false, boss: false, heavy: true, pack: 0, life: def.p.dur, untargetable: true });
      s.emit({ type: 'fx', x: pos.x, y: pos.y, s: 'standard', a: def.p.r });
      break;
    }
    case 'shot': {
      const trace = pc.moved >= def.p.moveReq;
      if (trace) pc.moved = 0;
      const fire = (ang: number) => spawnProjectile(s, { x: p.x + Math.cos(ang) * 0.7, y: p.y + Math.sin(ang) * 0.7, vx: Math.cos(ang) * def.p.speed, vy: Math.sin(ang) * def.p.speed, ttl: (def.range + 3) / def.p.speed,
        src: { ...psrc(s, def, def.coef * mul), crit: cloaked }, dtype: 'physical', kind: trace ? 'arrow_trace' : 'arrow', special: trace ? 'trace' : 'quick' });
      fire(dir);
      if (st.relic_twinstring) {
        const first = targets(s).filter((t) => t.kind === 'enemy').sort((a, b) => dist(a.x, a.y, ax, ay) - dist(b.x, b.y, ax, ay))[0];
        const second = first && targets(s).filter((t) => t.kind === 'enemy' && t !== first && dist(t.x, t.y, first.x, first.y) < 7)[0];
        if (second) fire(angTo(p.x, p.y, second.x, second.y));
      }
      break;
    }
    case 'volley':
      for (let i = 0; i < def.p.count; i++) {
        const a = dir + (i / (def.p.count - 1) - 0.5) * def.p.spread;
        spawnProjectile(s, { x: p.x + Math.cos(a) * 0.7, y: p.y + Math.sin(a) * 0.7, vx: Math.cos(a) * def.p.speed, vy: Math.sin(a) * def.p.speed, ttl: def.p.range / def.p.speed,
          src: { ...psrc(s, def, def.coef * mul), crit: cloaked && i === 2 }, dtype: 'physical', kind: 'arrow', special: 'volley' });
      }
      break;
    case 'ghostline': {
      const patient = st.cap_patient_hunter && pc.still >= 0.6 ? 1.6 : 1;
      spawnProjectile(s, { x: p.x + cx * 0.7, y: p.y + cy * 0.7, vx: cx * def.p.speed, vy: cy * def.p.speed, ttl: def.p.range / def.p.speed, r: 0.45, pierce: 99,
        src: { ...psrc(s, def, def.coef * mul * patient), crit: cloaked }, dtype: 'physical', kind: 'ghostline', special: 'ghost' });
      break;
    }
    case 'trap': {
      const d = Math.min(def.range, dist(p.x, p.y, ax, ay));
      const pos = nearestFree(s.zone, p.x + cx * d, p.y + cy * d) ?? { x: p.x, y: p.y };
      spawnArea(s, { shape: 'circle', x: pos.x, y: pos.y, r: def.p.r, trig: def.p.trig, delay: def.p.arm, dur: def.p.life, src: psrc(s, def, def.coef * mul), dtype: 'blight', tag: 'trap' });
      break;
    }
    case 'cloak':
      addStatus(s, p, 'cloak', def.p.dur * mul, 1, p.id);
      addStatus(s, p, 'haste', def.p.dur * mul, def.p.move / 100, p.id);
      s.emit({ type: 'fx', x: p.x, y: p.y, s: 'cloak', a: 1.5 });
      break;
    case 'backstep':
      spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: def.p.poolR, dur: def.p.poolDur, tick: def.p.tick, src: psrc(s, def, def.coef * mul), dtype: 'blight', status: { id: 'chill', t: 1.2, power: 0.35 }, tag: 'pool', fx: 'none', silent: true });
      s.emit({ type: 'fx', x: p.x, y: p.y, s: 'burst', a: def.p.poolR, dtype: 'blight' });
      pc.dash = { vx: -cx * def.p.dist / def.p.time, vy: -cy * def.p.dist / def.p.time, t: def.p.time, hit: [], skill: '', coef: 0, phase: true };
      break;
    case 'barrage': {
      const sp = def.p.len / def.p.dur;
      spawnArea(s, { shape: 'circle', x: p.x + cx * 2, y: p.y + cy * 2, r: def.p.width / 2, dir, dur: def.p.dur, tick: def.p.tick, vx: cx * sp, vy: cy * sp, src: psrc(s, def, def.coef * mul), dtype: 'physical', tag: 'barrage', fx: 'none', silent: true });
      break;
    }
  }
}
/** Projectile impact resolution for both player and enemy projectiles. */
export function projectileHit(s: Session, pr: Projectile, t: Actor): void {
  const p = s.player, st = s.stats;
  if (pr.src.team !== 0) {
    const d = damagePlayer(s, pr.src.dmg ?? 0, pr.dtype, pr.src, { fromX: pr.px, fromY: pr.py });
    if (pr.special === 'hook' && d > 0) {
      const o = s.actor(pr.src.id);
      if (o && !o.dead) {
        const dd = Math.max(0.1, dist(p.x, p.y, o.x, o.y) - 2.2), a = angTo(p.x, p.y, o.x, o.y);
        s.pc.dash = { vx: Math.cos(a) * dd / 0.25, vy: Math.sin(a) * dd / 0.25, t: 0.25, hit: [], skill: '', coef: 0, phase: false };
        s.pc.action = null; s.pc.path = [];
        addStatus(s, p, 'chill', 1.5, 0.4, o.id);
        s.emit({ type: 'fx', x: p.x, y: p.y, s: 'chain', a: o.x, b: o.y });
      }
    }
    return;
  }
  const def = SKILL[pr.src.skill ?? 'quickshot'];
  const coef = pr.src.coef ?? 1;
  playerHit(s, t, def, coef, pr.dtype, { fromX: pr.px, fromY: pr.py, forceCrit: pr.src.crit });
  s.emit({ type: 'fx', x: t.x, y: t.y, s: 'spark', dtype: pr.dtype });
  if (t.kind === 'prop') return;
  if (pr.special === 'quick' || pr.special === 'trace') {
    s.pc.focus = Math.min(st.focusMax, s.pc.focus + def.p.focus);
    if (pr.special === 'trace' && !t.dead) addStatus(s, t, 'trace', 10, 0, p.id, def.p.maxTrace);
  } else if (pr.special === 'ghost') {
    const tr = getStatus(t, 'trace');
    if (tr) {
      const n = tr.stacks;
      removeStatus(t, 'trace');
      const mark = def.p.markCoef * (coef / def.coef) * n * (1 + (st.traceDmg ?? 0) / 100);
      s.emit({ type: 'fx', x: t.x, y: t.y, s: 'detonate', a: 1.6 + n * 0.4 });
      playerHit(s, t, def, mark, 'physical', { noProc: true });
      if (st.relic_threadcutter && !t.dead) addStatus(s, t, 'blight', 4, (st.dmgMin + st.dmgMax) / 2 * 0.3, p.id);
      if (st.cap_thousand_trails) {
        const o = s.zone.actors.find((e) => e.kind === 'enemy' && !e.dead && e !== t && !pr.hit.includes(e.id) && dist(e.x, e.y, t.x, t.y) < 7);
        if (o) { s.emit({ type: 'fx', x: t.x, y: t.y, s: 'chain', a: o.x, b: o.y }); playerHit(s, o, def, mark, 'physical', { noProc: true }); if (!o.dead) addStatus(s, o, 'trace', 10, 0, p.id, def.p.maxTrace); }
      }
    }
  } else if (pr.special === 'chain' && !t.dead) {
    s.emit({ type: 'fx', x: p.x, y: p.y, s: 'chain', a: t.x, b: t.y });
    const a = angTo(p.x, p.y, t.x, t.y);
    if (!t.heavy && t.kind === 'enemy') {
      const tx = p.x + Math.cos(a) * (p.r + t.r + 0.5), ty = p.y + Math.sin(a) * (p.r + t.r + 0.5);
      if (walkLine(s.zone, t.x, t.y, tx, ty, t.r * 0.8)) { t.x = tx; t.y = ty; }
      addStatus(s, t, 'stun', def.p.stun, 0, p.id);
      if (t.ai && (t.ai.state === 'telegraph' || t.ai.state === 'execute')) { t.ai.state = 'recover'; t.ai.t = 0.4; }
    } else {
      const dd = clamp(dist(p.x, p.y, t.x, t.y) - (p.r + t.r + 0.6), 0, 12);
      s.pc.dash = { vx: Math.cos(a) * dd / 0.22, vy: Math.sin(a) * dd / 0.22, t: 0.22, hit: [], skill: '', coef: 0, phase: true };
      addStatus(s, t, 'stun', def.p.stun, 0, p.id);
    }
  }
}
