// combat: target acquisition, attacks, damage, projectiles, ground effects, structure behaviour.
import { allDefs, type Tag } from '../data';
import { TD } from './ext';
import { angDiff, goalCellFor, moveTo, turnTo, unitSpeed } from './move';
import { FOG_VISIBLE } from './vision';
import type { Sim } from './sim';

export const MODE_BRACE = 18;
export const MODE_CURL = 10;

export const isBraced = (sim: Sim, id: number) => sim.ext[id].mode >= MODE_BRACE && TD[sim.type[id]].def.id === 'bulwark';
export const isCurled = (sim: Sim, id: number) => sim.ext[id].mode >= MODE_CURL && TD[sim.type[id]].def.id === 'carapace_guard';

export function targetRadius(sim: Sim, tid: number): number {
  const td = TD[sim.type[tid]];
  return td.isStruct || td.isNeutral ? Math.max(sim.ext[tid].fw, sim.ext[tid].fh) / 2 : td.def.radius;
}

export function canTarget(sim: Sim, id: number, tid: number, explicit: boolean): boolean {
  if (!sim.alive[tid] || tid === id) return false;
  const o = sim.owner[id], to = sim.owner[tid];
  if (to === o) return false;
  const ttd = TD[sim.type[tid]];
  if (to < 0 && !(explicit && ttd.def.id === 'crystal_barrier')) return false;
  const w = TD[sim.type[id]].def.weapon;
  if (!w) return false;
  if (ttd.isHover && w.targets === 'ground') return false;
  if (!ttd.isHover && w.targets === 'air') return false;
  if (o >= 0) {
    const pl = sim.players[o];
    const ci = sim.cellIdx(sim.x[tid], sim.y[tid]);
    if (pl.vis[ci] !== FOG_VISIBLE && !sim.pulseActive()) {
      if (!(explicit && (ttd.isStruct || ttd.isNeutral) && pl.seen[ci])) return false;
    }
  }
  return true;
}

export function acquire(sim: Sim, id: number, range: number, cone = 0): number {
  const td = TD[sim.type[id]];
  const w = td.def.weapon!;
  const e = sim.ext[id];
  const sx = sim.x[id], sy = sim.y[id];
  let best = -1, bs = -1e9;
  const hoverFirst = !!w.hoverFirst;
  sim.near(sx, sy, range + 3.5, (tid) => {
    const to = sim.owner[tid];
    if (to < 0 || to === sim.owner[id]) return;
    if (!canTarget(sim, id, tid, false)) return;
    const ttd = TD[sim.type[tid]];
    const d = Math.hypot(sim.x[tid] - sx, sim.y[tid] - sy) - targetRadius(sim, tid);
    if (d > range) return;
    if (w.minRange && d < w.minRange * 0.5 && !ttd.isStruct) { /* too close for artillery but still targetable */ }
    if (cone > 0) {
      const a = Math.atan2(sim.y[tid] - sy, sim.x[tid] - sx);
      if (Math.abs(angDiff(sim.face[id], a)) > cone) return;
    }
    let s = 0;
    if (ttd.isUnit) s += ttd.canAttack ? 30 : ttd.isWorker ? 20 : 12;
    else s += ttd.canAttack ? 24 : ttd.isHall ? 2 : 4;
    if (tid === e.lastAttacker && sim.tick - e.lastHit < 60) s += 25;
    if (hoverFirst && ttd.isHover) s += 60;
    if (tid === e.target) s += 10;
    s += (1 - sim.hp[tid] / ttd.maxHp) * 8;
    s -= d * 2;
    if (s > bs) { bs = s; best = tid; }
  });
  return best;
}

export function applyDamage(sim: Sim, tid: number, raw: number, srcId: number, srcOwner: number, sx: number, sy: number, ranged: boolean): number {
  if (!sim.alive[tid]) return 0;
  const ttd = TD[sim.type[tid]];
  const e = sim.ext[tid];
  const owner = sim.owner[tid];
  let armor = ttd.def.armor;
  if (owner >= 0 && ttd.isUnit) armor += sim.players[owner].armorBonus;
  let dmg = (raw * 100) / (100 + armor * 10);
  if (e.shield > 0 && ranged) {
    const ang = Math.atan2(sy - sim.y[tid], sx - sim.x[tid]);
    if (Math.abs(angDiff(sim.face[tid], ang)) < 1.1) {
      const ab = Math.min(e.shield, dmg);
      e.shield -= ab;
      dmg -= ab;
    }
  }
  if (isCurled(sim, tid)) dmg *= ranged ? 0.5 : 0.8;
  e.lastHit = sim.tick;
  if (srcId >= 0) e.lastAttacker = srcId;
  if (dmg > 0) sim.hp[tid] -= dmg;
  sim.events.push({ k: 'hit', tick: sim.tick, owner: owner, x: sim.x[tid], y: sim.y[tid], a: dmg, b: ttd.isStruct ? 1 : 0, id: tid });
  if (owner >= 0 && srcOwner !== owner) {
    const pl = sim.players[owner];
    if (sim.tick - pl.alertT > 200) {
      pl.alertT = sim.tick;
      sim.alert(owner, 'attack', sim.x[tid], sim.y[tid], 'Under attack');
    }
  }
  if (sim.hp[tid] <= 0) sim.kill(tid, srcOwner);
  return dmg;
}

function bonusFor(sim: Sim, attackerDef: number, victim: number, mult: number): number {
  const w = allDefs[attackerDef].weapon;
  if (!w?.bonus) return 0;
  let b = 0;
  for (const tag of TD[sim.type[victim]].def.tags) b += (w.bonus[tag as Tag] ?? 0) * mult;
  return b;
}

export function fire(sim: Sim, id: number, tid: number) {
  const td = TD[sim.type[id]];
  const w = td.def.weapon!;
  const e = sim.ext[id];
  const o = sim.owner[id];
  const atk = 1 + (o >= 0 ? sim.players[o].atkBonus : 0);
  const sx = sim.x[id], sy = sim.y[id];
  const tx = sim.x[tid], ty = sim.y[tid];
  e.cd = td.periodT;
  e.atkTick = sim.tick;
  e.lastAtk = sim.tick;
  const base = w.damage * atk;
  sim.events.push({ k: 'shot', tick: sim.tick, owner: o, x: sx, y: sy, tx, ty, id, a: sim.type[id], b: w.projectileSpeed && !w.pierce ? 1 : 0, vis: w.visual });
  if (w.delayed) {
    sim.effects.push({ kind: 'erupt', owner: o, x: tx, y: ty, r: w.splash ?? 2, start: sim.tick + td.delayT, end: sim.tick + td.delayT + 1, dmg: base, born: sim.tick, src: id, bonus: atk, target: sim.type[id] });
    return;
  }
  if (w.projectileSpeed && !w.pierce) {
    const speed = w.projectileSpeed / 20;
    const dist = Math.hypot(tx - sx, ty - sy);
    sim.projectiles.push({
      id: ++sim.projId, x: sx, y: sy, x0: sx, y0: sy, tx, ty, target: w.splash ? -1 : tid, speed, owner: o, src: id, damage: base,
      bonus: atk, splash: w.splash ?? 0, slowF: w.slow?.factor ?? 1, slowT: w.slow ? Math.round(w.slow.duration * 20) : 0, visual: w.visual,
      arc: w.splash ? 1 : 0, born: sim.tick, total: Math.max(1, Math.ceil(dist / speed)), def: sim.type[id],
    });
    return;
  }
  // instant
  const dmg = base + bonusFor(sim, sim.type[id], tid, atk);
  applyDamage(sim, tid, dmg, id, o, sx, sy, true);
  if (w.slow && sim.alive[tid]) applySlow(sim, tid, w.slow.factor, Math.round(w.slow.duration * 20));
  if (w.pierce) {
    const dx = tx - sx, dy = ty - sy;
    const dl = Math.hypot(dx, dy) || 1;
    const ux = dx / dl, uy = dy / dl;
    let second = -1, bd = 1e9;
    sim.near(tx, ty, 5, (v) => {
      if (v === tid || !sim.isEnemy(id, v)) return;
      const vt = TD[sim.type[v]];
      if (!vt.isUnit || !vt.def.tags.includes('Light') || vt.isHover) return;
      const rx = sim.x[v] - tx, ry = sim.y[v] - ty;
      const along = rx * ux + ry * uy;
      const perp = Math.abs(rx * uy - ry * ux);
      if (along > 0 && along < 4.5 && perp < 1.1 && along < bd) { bd = along; second = v; }
    });
    if (second >= 0) applyDamage(sim, second, (base + bonusFor(sim, sim.type[id], second, atk)) * 0.6, id, o, sx, sy, true);
  }
}

export function applySlow(sim: Sim, tid: number, factor: number, ticks: number) {
  const e = sim.ext[tid];
  if (sim.tick >= e.slowUntil || factor < e.slowF) { e.slowF = factor; }
  e.slowUntil = Math.max(e.slowUntil, sim.tick + ticks);
}

/** Perform one tick of attack/chase against `tid`. 0 = engaged, 1 = chasing/repositioning, 2 = cannot attack target. */
export function combatStep(sim: Sim, id: number, tid: number, allowChase: boolean): number {
  const td = TD[sim.type[id]];
  const w = td.def.weapon!;
  const e = sim.ext[id];
  if (isCurled(sim, id) || (e.mode > 0 && td.def.id === 'carapace_guard')) return 0;
  const sx = sim.x[id], sy = sim.y[id];
  const tx = sim.x[tid], ty = sim.y[tid];
  const tr = targetRadius(sim, tid);
  const cd = Math.hypot(tx - sx, ty - sy);
  const edge = cd - tr;
  const range = w.range + (isBraced(sim, id) ? 2 : 0);
  if (edge > range + 0.05) {
    if (!allowChase || unitSpeed(sim, id) <= 0 && e.mode === 0) return 2;
    if (e.mode > 0) return 2;
    const tt = TD[sim.type[tid]];
    const key = tt.isStruct || tt.isNeutral ? 1_000_000 + tid : goalCellFor(sim, tx, ty);
    const r = moveTo(sim, id, tx, ty, Math.max(0.4, range - 0.5 + tr), key, () => {
      if (tt.isStruct || tt.isNeutral) return sim.nav.ringCells(sim.ext[tid].ox, sim.ext[tid].oy, sim.ext[tid].fw, sim.ext[tid].fh);
      return [goalCellFor(sim, tx, ty)];
    });
    return r === 2 ? 2 : 1;
  }
  if (w.minRange && edge < w.minRange && allowChase) {
    // back off from the target (artillery)
    const away = Math.atan2(sy - ty, sx - tx);
    turnTo(sim, id, away + Math.PI, 0.4);
    const s = unitSpeed(sim, id);
    if (s > 0) {
      const nx = sx + Math.cos(away) * s, ny = sy + Math.sin(away) * s;
      if (sim.nav.fits(nx, ny, 0.4)) { sim.x[id] = nx; sim.y[id] = ny; e.moving = true; }
    }
    return 1;
  }
  e.moving = false;
  const ang = Math.atan2(ty - sy, tx - sx);
  if (w.cone) {
    if (Math.abs(angDiff(sim.face[id], ang)) > w.cone) return 2;
  } else {
    turnTo(sim, id, ang, 0.4);
    if (Math.abs(angDiff(sim.face[id], ang)) > 0.3) return 0;
  }
  if (td.setupT && e.deploy < td.setupT) { e.deploy++; return 0; }
  if (e.cd <= 0 && e.wind === 0) {
    if (td.windT > 0) { e.wind = td.windT; e.target = tid; e.atkTick = sim.tick; }
    else fire(sim, id, tid);
  }
  return 0;
}

export function advanceBuild(sim: Sim, sid: number): boolean {
  const e = sim.ext[sid];
  const td = TD[sim.type[sid]];
  e.prog++;
  sim.hp[sid] = Math.min(td.maxHp, sim.hp[sid] + (td.maxHp * 0.9) / Math.max(1, e.total));
  if (e.prog >= e.total) { sim.completeStructure(sid); return true; }
  return false;
}

export function updateStructure(sim: Sim, id: number) {
  const e = sim.ext[id];
  const td = TD[sim.type[id]];
  const o = sim.owner[id];
  if (o < 0) return;
  if (!e.done) {
    if (sim.players[o].faction.buildMode === 'seed') advanceBuild(sim, id);
    return;
  }
  if (td.def.regen && sim.tick - e.lastHit > 60) sim.hp[id] = Math.min(td.maxHp, sim.hp[id] + td.def.regen / 20);
  if (e.weldLeft > 0) { sim.hp[id] = Math.min(td.maxHp, sim.hp[id] + e.weldRate); e.weldLeft--; }
  if (td.canAttack) {
    const w = td.def.weapon!;
    if (e.cd > 0) e.cd--;
    if (e.wind > 0) {
      e.wind--;
      if (e.wind === 0) {
        const tid = e.target;
        if (tid >= 0 && sim.alive[tid]) fire(sim, id, tid);
      }
      return;
    }
    if (e.target >= 0 && !(sim.alive[e.target] && canTarget(sim, id, e.target, false))) e.target = -1;
    if (e.target < 0 && (sim.tick + id) % 4 === 0) e.target = acquire(sim, id, w.range, w.cone ?? 0);
    if (e.target >= 0) {
      const r = combatStep(sim, id, e.target, false);
      if (r === 2) e.target = -1;
    }
  }
}

export function stepProjectiles(sim: Sim) {
  const ps = sim.projectiles;
  let w = 0;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    let alive = true;
    if (p.target >= 0) {
      if (sim.alive[p.target]) { p.tx = sim.x[p.target]; p.ty = sim.y[p.target]; }
      else { alive = false; }
    }
    if (alive) {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= p.speed + 0.15) {
        projectileHit(sim, p);
        alive = false;
      } else {
        p.x += (dx / d) * p.speed;
        p.y += (dy / d) * p.speed;
      }
    }
    if (alive) ps[w++] = p;
  }
  ps.length = w;
}

function projectileHit(sim: Sim, p: import('./types').Projectile) {
  const w = allDefs[p.def].weapon!;
  if (p.splash > 0) {
    groundBurst(sim, p.tx, p.ty, p.splash, p.damage, p.bonus, p.def, p.src, p.owner, true);
    sim.events.push({ k: 'erupt', tick: sim.tick, owner: p.owner, x: p.tx, y: p.ty, a: p.splash, vis: 'shell' });
    return;
  }
  if (p.target >= 0 && sim.alive[p.target]) {
    const dmg = p.damage + bonusFor(sim, p.def, p.target, p.bonus);
    applyDamage(sim, p.target, dmg, p.src, p.owner, p.x0, p.y0, true);
    if (p.slowT && sim.alive[p.target]) applySlow(sim, p.target, p.slowF, p.slowT);
  }
  void w;
}

export function groundBurst(sim: Sim, x: number, y: number, r: number, base: number, mult: number, defIdx: number, src: number, owner: number, ranged: boolean) {
  const hits: number[] = [];
  sim.near(x, y, r + 2.5, (v) => {
    const vo = sim.owner[v];
    if (vo < 0 || vo === owner) return;
    const vt = TD[sim.type[v]];
    if (vt.isHover) return;
    const d = Math.hypot(sim.x[v] - x, sim.y[v] - y) - targetRadius(sim, v);
    if (d <= r) hits.push(v);
  });
  for (const v of hits) {
    const dmg = base + bonusFor(sim, defIdx, v, mult);
    applyDamage(sim, v, dmg, src, owner, x, y, true);
  }
}

export function stepEffects(sim: Sim) {
  const t = sim.tick;
  let w = 0;
  for (let i = 0; i < sim.effects.length; i++) {
    const ef = sim.effects[i];
    if (ef.kind === 'erupt') {
      if (t >= ef.start) {
        groundBurst(sim, ef.x, ef.y, ef.r, ef.dmg ?? 0, ef.bonus ?? 1, ef.target ?? 0, ef.src ?? -1, ef.owner, true);
        sim.events.push({ k: 'erupt', tick: t, owner: ef.owner, x: ef.x, y: ef.y, a: ef.r, vis: 'eruption' });
        continue;
      }
    } else if (ef.kind === 'silence') {
      if (t >= ef.start && t < ef.end) {
        sim.near(ef.x, ef.y, ef.r + 1.5, (v) => {
          const vo = sim.owner[v];
          if (vo < 0 || vo === ef.owner || !TD[sim.type[v]].isUnit) return;
          if (Math.hypot(sim.x[v] - ef.x, sim.y[v] - ef.y) <= ef.r + TD[sim.type[v]].def.radius) sim.ext[v].silUntil = t + 4;
        });
      }
      if (t >= ef.end) continue;
    } else if (t >= ef.end) continue;
    sim.effects[w++] = ef;
  }
  sim.effects.length = w;
}

/** healer behaviour: returns true if currently healing something */
export function healStep(sim: Sim, id: number): boolean {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  if (!td.heal || sim.tick < e.silUntil) return false;
  e.energy = Math.min(td.maxEnergy, e.energy + 0.06);
  if (e.energy < 0.4) return false;
  let best = -1, br = 2;
  const o = sim.owner[id];
  sim.near(sim.x[id], sim.y[id], 6.5, (v) => {
    if (v === id || sim.owner[v] !== o) return;
    const vt = TD[sim.type[v]];
    if (!vt.def.tags.includes(td.healTag as Tag)) return;
    if (sim.hp[v] >= vt.maxHp - 0.01) return;
    if (!vt.isUnit && !vt.isStruct) return;
    if (!sim.ext[v].done) return;
    const d = Math.hypot(sim.x[v] - sim.x[id], sim.y[v] - sim.y[id]) - targetRadius(sim, v);
    if (d > 5) return;
    const r = sim.hp[v] / vt.maxHp;
    if (r < br) { br = r; best = v; }
  });
  if (best < 0) return false;
  const vt = TD[sim.type[best]];
  sim.hp[best] = Math.min(vt.maxHp, sim.hp[best] + td.heal);
  e.energy -= 0.3;
  e.atkTick = sim.tick;
  if (sim.tick % 4 === 0) sim.events.push({ k: 'weld', tick: sim.tick, owner: o, x: sim.x[id], y: sim.y[id], tx: sim.x[best], ty: sim.y[best], id, vis: 'heal' });
  const turn = Math.atan2(sim.y[best] - sim.y[id], sim.x[best] - sim.x[id]);
  if (!e.moving) turnTo(sim, id, turn, 0.3);
  return true;
}
