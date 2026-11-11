// Enemy AI: perception, navigation, attack slots, heavy-attack tokens, and per-family behaviours.
import { ENEMIES } from '../data/enemies';
import { addEffect, DT_COLORS, getEffect, hasEffect, slowFactor, spawnHazard, spawnProjectile, tickEffects } from './combat';
import type { Enemy } from './entities';
import type { Game } from './game';
import { findPath, lineClear, moveCircle } from './nav';

const AGGRO_RADIUS = 13;
const MELEE_SLOTS = 4;
const HEAVY_TOKENS = 2;

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(e: Enemy, tx: number, tz: number, dt: number) {
  const want = Math.atan2(tz - e.z, tx - e.x);
  const d = angleDiff(e.facing, want);
  const max = (e.def.turn || 6) * dt;
  e.facing += Math.max(-max, Math.min(max, d));
}

function speedOf(e: Enemy): number {
  let s = e.def.speed * e.speedMul * slowFactor(e);
  const rally = getEffect(e, 'rally');
  if (rally) s *= 1.2;
  return s;
}

function moveTo(g: Game, e: Enemy, tx: number, tz: number, spd: number, dt: number, stop = 0.1): number {
  const dx = tx - e.x;
  const dz = tz - e.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= stop || spd <= 0) return dist;
  let gx = tx;
  let gz = tz;
  const direct = lineClear(g.zone.grid, e.x, e.z, tx, tz, e.r * 0.9);
  if (!direct) {
    e.pathT -= dt;
    if ((!e.path || e.pathT <= 0) && g.pathBudget > 0) {
      g.pathBudget--;
      e.path = findPath(g.zone.grid, e.x, e.z, tx, tz, Math.min(0.45, e.r));
      e.pathT = 0.5 + (e.id % 5) * 0.06;
    }
    if (e.path && e.path.length) {
      while (e.path.length > 1 && Math.hypot(e.path[0].x - e.x, e.path[0].z - e.z) < 0.5) e.path.shift();
      gx = e.path[0].x;
      gz = e.path[0].z;
    }
  } else e.path = null;
  const ang = Math.atan2(gz - e.z, gx - e.x);
  const step = Math.min(spd * dt, Math.hypot(gx - e.x, gz - e.z));
  const m = moveCircle(g.zone.grid, e.x, e.z, Math.cos(ang) * step, Math.sin(ang) * step, e.r * 0.9);
  e.vx = (m.x - e.x) / dt;
  e.vz = (m.z - e.z) / dt;
  e.x = m.x;
  e.z = m.z;
  turnToward(e, gx, gz, dt);
  return dist;
}

function moveDir(g: Game, e: Enemy, ang: number, spd: number, dt: number) {
  const m = moveCircle(g.zone.grid, e.x, e.z, Math.cos(ang) * spd * dt, Math.sin(ang) * spd * dt, e.r * 0.9);
  e.vx = (m.x - e.x) / dt;
  e.vz = (m.z - e.z) / dt;
  e.x = m.x;
  e.z = m.z;
}

export function assignSlots(g: Game) {
  const melee = g.enemies.filter((e) => e.alive && e.aggro && !e.neutral && !e.def.ranged && e.def.attack !== 'none' && !e.boss && e.def.reach <= 4);
  melee.sort((a, b) => Math.hypot(a.x - g.player.x, a.z - g.player.z) - Math.hypot(b.x - g.player.x, b.z - g.player.z));
  let n = 0;
  for (const e of melee) {
    const had = e.hasSlot;
    e.hasSlot = n < MELEE_SLOTS || e.state === 'telegraph' || e.state === 'execute';
    if (e.hasSlot && !had) e.slotAngle = Math.atan2(e.z - g.player.z, e.x - g.player.x);
    if (e.state !== 'telegraph' && e.state !== 'execute') n++;
    else n++;
  }
}

function heavyTokensUsed(g: Game): number {
  let n = 0;
  for (const e of g.enemies) if (e.alive && e.heavyToken) n++;
  return n;
}

export function updateEnemies(g: Game, dt: number) {
  g.pathBudget = 6;
  assignSlots(g);
  for (const e of g.enemies) updateEnemy(g, e, dt);
  separate(g, dt);
  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i];
    if (!e.alive) {
      e.fadeT -= dt;
      if (e.fadeT <= 0) g.enemies.splice(i, 1);
    }
  }
}

function separate(g: Game, dt: number) {
  const list = g.enemies.filter((e) => e.alive && e.def.speed > 0 && !e.neutral);
  const p = g.player;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const min = (a.r + b.r) * 0.95;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) * 0.5 * Math.min(1, dt * 12);
      const nx = dx / d;
      const nz = dz / d;
      const ma = moveCircle(g.zone.grid, a.x, a.z, -nx * push, -nz * push, a.r * 0.9);
      const mb = moveCircle(g.zone.grid, b.x, b.z, nx * push, nz * push, b.r * 0.9);
      a.x = ma.x;
      a.z = ma.z;
      b.x = mb.x;
      b.z = mb.z;
    }
    if (!p.dead && p.evadeT <= 0) {
      const dx = a.x - p.x;
      const dz = a.z - p.z;
      const min = (a.r + p.r) * 0.9;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        const push = (min - d) * Math.min(1, dt * 10);
        const m = moveCircle(g.zone.grid, a.x, a.z, (dx / d) * push, (dz / d) * push, a.r * 0.9);
        a.x = m.x;
        a.z = m.z;
      }
    }
  }
  for (const e of g.enemies) if (e.boss && e.alive) {
    const dx = p.x - e.x;
    const dz = p.z - e.z;
    const min = e.r + p.r;
    const d = Math.hypot(dx, dz);
    if (d < min && d > 1e-6 && p.evadeT <= 0) {
      const m = moveCircle(g.zone.grid, p.x, p.z, (dx / d) * (min - d), (dz / d) * (min - d), p.r);
      p.x = m.x;
      p.z = m.z;
    }
  }
}

export function packAggro(g: Game, e: Enemy) {
  for (const o of g.enemies) {
    if (!o.alive || o.neutral || o.aggro) continue;
    if (o.pack === e.pack || Math.hypot(o.x - e.x, o.z - e.z) < 5) g.wakeEnemy(o);
  }
}

function targetPoint(g: Game, e: Enemy): { x: number; z: number; taunt: boolean } {
  if (e.tauntT > 0 && g.standards.length) {
    const s = g.standards[0];
    return { x: s.x, z: s.z, taunt: true };
  }
  return { x: g.player.x, z: g.player.z, taunt: false };
}

function updateEnemy(g: Game, e: Enemy, dt: number) {
  if (!e.alive) return;
  e.px = e.x;
  e.pz = e.z;
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.spawnT += dt;
  if (e.freeze > 0) {
    e.freeze -= dt;
    return;
  }
  tickEffects(g, e, dt, false);
  if (!e.alive) return;
  if (e.neutral) return;
  e.tauntT = Math.max(0, e.tauntT - dt);
  e.atkCd = Math.max(0, e.atkCd - dt);
  e.stateT += dt;
  if (e.boss) {
    g.updateBoss(e, dt);
    return;
  }
  if (e.type === 'ward') {
    e.modT -= dt;
    if (e.modT <= 0) {
      e.modT = 0.5;
      for (const o of g.enemies) if (o.alive && o !== e && !o.neutral && o.type !== 'ward' && Math.hypot(o.x - e.x, o.z - e.z) < 6.5) addEffect(o, 'ward', 0.9, 0.5);
    }
    return;
  }
  if (e.def.attack === 'none') return;
  const p = g.player;
  const stunned = hasEffect(e, 'stun');
  if (stunned) return;
  const tp = targetPoint(g, e);
  const dist = Math.hypot(tp.x - e.x, tp.z - e.z);
  const pdist = Math.hypot(p.x - e.x, p.z - e.z);
  const cloaked = hasEffect(p, 'cloak');
  const los = !p.dead && !cloaked && pdist < 40 && lineClear(g.zone.grid, e.x, e.z, p.x, p.z, 0, true);
  if (e.state === 'dormant') {
    const r = e.def.id === 'hound' ? AGGRO_RADIUS + 2 : AGGRO_RADIUS;
    if (los && pdist < r) {
      g.wakeEnemy(e);
      packAggro(g, e);
    }
    return;
  }
  if (p.dead) {
    // return home
    e.atk = null;
    moveTo(g, e, e.home.x, e.home.z, speedOf(e) * 0.8, dt, 0.5);
    return;
  }
  if (los) {
    e.lastSeen = { x: p.x, z: p.z };
    e.searchT = 0;
  } else e.searchT += dt;

  updateEliteMods(g, e, dt, pdist);

  // attack execution / recovery states
  if (e.atk) {
    runAttack(g, e, dt, tp);
    return;
  }
  if (e.state === 'recover') {
    if (e.stateT >= e.def.recover) {
      e.state = 'approach';
      e.stateT = 0;
    }
    return;
  }
  if (e.state === 'flee') {
    const away = Math.atan2(e.z - p.z, e.x - p.x) + Math.sin(g.time * 3 + e.id) * 0.5;
    moveDir(g, e, away, speedOf(e) * 0.9, dt);
    turnToward(e, p.x, p.z, dt);
    if (e.stateT > e.retreatT || pdist > 12) {
      e.state = 'approach';
      e.stateT = 0;
    }
    return;
  }
  // lost sight -> investigate -> go home
  if (!los && e.searchT > 1.4) {
    if (e.state !== 'investigate') {
      e.state = 'investigate';
      e.stateT = 0;
    }
    const ls = e.lastSeen ?? e.home;
    const d = moveTo(g, e, ls.x, ls.z, speedOf(e) * 0.8, dt, 0.8);
    if (d < 1 || e.stateT > 5) {
      if (e.searchT > 5) {
        e.aggro = false;
        e.state = 'dormant';
        e.lastSeen = null;
      }
    }
    return;
  }
  if (e.state === 'investigate') {
    e.state = 'approach';
    e.stateT = 0;
  }
  switch (e.def.attack) {
    case 'shoot':
    case 'ward':
    case 'zone':
    case 'hook':
      rangedAI(g, e, dt, tp, dist, los);
      break;
    case 'explode':
      meleeAI(g, e, dt, tp, dist, true);
      break;
    case 'lunge':
      houndAI(g, e, dt, tp, dist);
      break;
    default:
      meleeAI(g, e, dt, tp, dist, false);
  }
}

function startAttack(g: Game, e: Enemy, kind: string, tx: number, tz: number, windup: number, data: Record<string, number> = {}) {
  e.atk = { kind, t: 0, windup, tx, tz, dir: Math.atan2(tz - e.z, tx - e.x), fired: false, recover: e.def.recover, data };
  e.state = 'telegraph';
  e.stateT = 0;
  if (e.def.heavy) e.heavyToken = true;
  g.events.push({ t: 'telegraph', kind, x: e.x, z: e.z, enemy: e.id });
  g.events.push({ t: 'sfx', id: `tele_${e.def.attack}`, x: e.x, z: e.z });
}

function dmgOf(e: Enemy, mult = 1) {
  return e.def.dmg * e.dmgMul * mult;
}

function windupOf(e: Enemy) {
  return e.def.windup * (e.elite ? 0.95 : 1);
}

function meleeAI(g: Game, e: Enemy, dt: number, tp: { x: number; z: number; taunt: boolean }, dist: number, suicide: boolean) {
  const def = e.def;
  const p = g.player;
  const slot = e.hasSlot || def.attack === 'explode';
  const canAttack = slot && e.atkCd <= 0 && (!def.heavy || heavyTokensUsed(g) < HEAVY_TOKENS);
  const reach = def.reach;
  if (slot) {
    e.state = 'approach';
    const goalDist = def.attack === 'slam' ? reach * 0.85 : reach * 0.8;
    // approach to attack range, wrapping around a little for swarms
    let tx = tp.x;
    let tz = tp.z;
    if (e.type === 'swarm' || e.type === 'swarmlet') {
      const a = g.time * 3 + e.id;
      tx += Math.cos(a) * 1.4;
      tz += Math.sin(a) * 1.4;
    }
    if (dist > goalDist) moveTo(g, e, tx, tz, speedOf(e), dt, goalDist);
    else turnToward(e, tp.x, tp.z, dt);
    if (dist <= reach * 0.95 && canAttack && Math.abs(angleDiff(e.facing, Math.atan2(tp.z - e.z, tp.x - e.x))) < (def.shieldArc ? 0.5 : 0.8)) {
      if (def.attack === 'slam') {
        const ahead = Math.min(dist, 1.9);
        const a = Math.atan2(tp.z - e.z, tp.x - e.x);
        startAttack(g, e, 'slam', e.x + Math.cos(a) * ahead, e.z + Math.sin(a) * ahead, windupOf(e));
        const h = spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'slam', x: e.x + Math.cos(a) * ahead, z: e.z + Math.sin(a) * ahead, radius: 2.5, delay: windupOf(e), dmg: { phys: dmgOf(e) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: def.name, knock: 0 });
        e.atk!.data!.hid = h.id;
      } else if (def.attack === 'explode') {
        startAttack(g, e, 'explode', e.x, e.z, windupOf(e));
        const h = spawnHazard(g, { owner: 'env', shape: 'circle', kind: 'blast', x: e.x, z: e.z, radius: 2.5, delay: windupOf(e), dmg: { ember: dmgOf(e) }, dtype: 'ember', src: e.id, color: 0xffa030, ownerLabel: def.name, affectsEnemies: true, follow: e.id });
        e.atk!.data!.hid = h.id;
      } else if (def.attack === 'sweep') {
        startAttack(g, e, 'sweep', tp.x, tp.z, windupOf(e));
        const h = spawnHazard(g, { owner: 'enemy', shape: 'cone', kind: 'sweep', x: e.x, z: e.z, dir: e.facing, radius: reach + 0.3, arc: 2.5, delay: windupOf(e), dmg: { phys: dmgOf(e) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: def.name });
        e.atk!.data!.hid = h.id;
      } else {
        startAttack(g, e, 'swipe', tp.x, tp.z, windupOf(e));
        const h = spawnHazard(g, { owner: 'enemy', shape: 'cone', kind: 'swipe', x: e.x, z: e.z, dir: e.facing, radius: reach + 0.35, arc: 1.7, delay: windupOf(e), dmg: { phys: dmgOf(e) }, dtype: def.dtype, src: e.id, color: 0xff5a30, ownerLabel: def.name });
        e.atk!.data!.hid = h.id;
      }
    }
  } else {
    // wait on the ring
    e.state = 'reposition';
    const ringR = 4.6 + (e.id % 3) * 0.5;
    const a = Math.atan2(e.z - p.z, e.x - p.x) + dt * (0.5 + (e.id % 4) * 0.12) * (e.id % 2 ? 1 : -1);
    const gx = p.x + Math.cos(a) * ringR;
    const gz = p.z + Math.sin(a) * ringR;
    moveTo(g, e, gx, gz, speedOf(e) * 0.85, dt, 0.4);
    turnToward(e, p.x, p.z, dt);
  }
  void suicide;
}

function houndAI(g: Game, e: Enemy, dt: number, tp: { x: number; z: number; taunt: boolean }, dist: number) {
  const p = g.player;
  e.state = 'reposition';
  // flank: circle at 5.5-7m, then lunge
  const side = e.id % 2 ? 1 : -1;
  const a = Math.atan2(e.z - p.z, e.x - p.x) + dt * 1.6 * side;
  const rr = 6.2;
  if (e.atkCd > 0 || dist > 8) moveTo(g, e, p.x + Math.cos(a) * rr, p.z + Math.sin(a) * rr, speedOf(e), dt, 0.3);
  turnToward(e, tp.x, tp.z, dt);
  if (e.atkCd <= 0 && dist < 7.2 && dist > 2.2 && heavyTokensUsed(g) < 3 && lineClear(g.zone.grid, e.x, e.z, tp.x, tp.z, 0.5)) {
    const len = Math.min(dist + 1.5, 6.5);
    startAttack(g, e, 'lunge', tp.x, tp.z, windupOf(e), { len });
    const h = spawnHazard(g, { owner: 'enemy', shape: 'line', kind: 'lunge', x: e.x, z: e.z, dir: e.atk!.dir, length: len, width: 1.4, delay: windupOf(e), dmg: { phys: dmgOf(e) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: e.def.name });
    e.atk!.data!.hid = h.id;
  }
}

function rangedAI(g: Game, e: Enemy, dt: number, tp: { x: number; z: number; taunt: boolean }, dist: number, los: boolean) {
  const def = e.def;
  const p = g.player;
  const min = def.rangeMin ?? 6;
  const max = def.rangeMax ?? 10;
  e.state = 'reposition';
  e.modT2 -= dt;
  if (e.modT2 <= 0) {
    e.strafe = -e.strafe || 1;
    e.modT2 = 1.8 + (e.id % 5) * 0.4;
  }
  if (dist < min) {
    // back away, preferring open space
    const away = Math.atan2(e.z - p.z, e.x - p.x) + e.strafe * 0.5;
    moveDir(g, e, away, speedOf(e), dt);
  } else if (dist > max || !los) {
    moveTo(g, e, tp.x, tp.z, speedOf(e), dt, max * 0.9);
  } else {
    const a = Math.atan2(e.z - p.z, e.x - p.x) + e.strafe * 0.35;
    moveDir(g, e, a + Math.PI / 2 * e.strafe * 0.5, speedOf(e) * 0.35, dt);
  }
  turnToward(e, tp.x, tp.z, dt);
  if (e.atkCd > 0 || !los || dist > def.reach) return;
  if (def.attack === 'shoot') {
    const lead = 0.25;
    const lx = tp.x + p.vx * lead;
    const lz = tp.z + p.vz * lead;
    startAttack(g, e, 'shoot', lx, lz, windupOf(e));
  } else if (def.attack === 'ward') {
    const alive = g.enemies.find((o) => o.id === e.wardId && o.alive);
    if (!alive && g.enemies.some((o) => o.alive && o !== e && o.pack === e.pack && !o.neutral)) {
      const allies = g.enemies.filter((o) => o.alive && o !== e && o.pack === e.pack && !o.neutral);
      const c = allies[Math.floor(allies.length / 2)];
      startAttack(g, e, 'ward', c.x, c.z, windupOf(e));
      spawnHazard(g, { owner: 'env', shape: 'circle', kind: 'summon', x: c.x, z: c.z, radius: 1.2, delay: windupOf(e), dmg: {}, dtype: 'blight', src: e.id, color: 0xb36bff, affectsPlayer: false });
    } else startAttack(g, e, 'shoot', tp.x, tp.z, 0.6);
  } else if (def.attack === 'zone') {
    const lx = tp.x + p.vx * 0.5;
    const lz = tp.z + p.vz * 0.5;
    startAttack(g, e, 'zone', lx, lz, windupOf(e));
    const h = spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'pool', x: lx, z: lz, radius: 3.0, delay: windupOf(e), dur: 5.5, interval: 0.5, dmg: { blight: dmgOf(e, 1.1) }, dtype: 'blight', src: e.id, color: 0xa6ff6a, ownerLabel: def.name, slowMag: 0.2 });
    e.atk!.data!.hid = h.id;
  } else if (def.attack === 'hook') {
    startAttack(g, e, 'hook', tp.x, tp.z, windupOf(e));
    const h = spawnHazard(g, { owner: 'enemy', shape: 'line', kind: 'preview', x: e.x, z: e.z, dir: e.atk!.dir, length: 10, width: 0.9, delay: windupOf(e), dmg: {}, dtype: 'phys', src: e.id, color: 0xc9a468, affectsPlayer: false });
    e.atk!.data!.hid = h.id;
  }
}

function runAttack(g: Game, e: Enemy, dt: number, tp: { x: number; z: number; taunt: boolean }) {
  const a = e.atk!;
  a.t += dt;
  const hz = a.data?.hid ? g.hazards.find((h) => h.id === a.data!.hid) : undefined;
  // limited tracking early in the wind-up (readable, avoidable)
  if (a.t < a.windup * 0.5 && a.kind !== 'explode') {
    const dir = Math.atan2(tp.z - e.z, tp.x - e.x);
    a.dir = dir;
    if (e.def.turn > 3 || a.kind === 'shoot') e.facing = dir;
    else turnToward(e, tp.x, tp.z, dt);
    if (hz) {
      if (hz.shape === 'cone' || hz.shape === 'line') hz.dir = e.def.turn > 3 ? dir : e.facing;
      if (hz.kind === 'slam') {
        const d = Math.min(Math.hypot(tp.x - e.x, tp.z - e.z), 2.2);
        hz.x = e.x + Math.cos(dir) * d;
        hz.z = e.z + Math.sin(dir) * d;
      }
    }
    if (a.kind === 'zone' && hz) {
      hz.x += (tp.x - hz.x) * Math.min(1, dt * 3);
      hz.z += (tp.z - hz.z) * Math.min(1, dt * 3);
    }
  }
  if (hz && (hz.shape === 'cone' || hz.shape === 'line') && hz.kind !== 'lunge') {
    hz.x = e.x;
    hz.z = e.z;
  }
  if (!a.fired && a.t >= a.windup) {
    a.fired = true;
    e.state = 'execute';
    e.stateT = 0;
    switch (a.kind) {
      case 'shoot': {
        const ang = Math.atan2(a.tz - e.z, a.tx - e.x);
        const sp = 15;
        spawnProjectile(g, { owner: 'enemy', kind: 'bolt', x: e.x + Math.cos(ang) * 0.6, z: e.z + Math.sin(ang) * 0.6, vx: Math.cos(ang) * sp, vz: Math.sin(ang) * sp, r: 0.28, range: 20, dtype: e.def.dtype, dmg: { [e.def.dtype]: dmgOf(e) }, color: DT_COLORS[e.def.dtype] ?? 0xff5a30, src: e.id, label: e.def.name, life: 3 });
        g.events.push({ t: 'sfx', id: 'shoot', x: e.x, z: e.z });
        break;
      }
      case 'ward': {
        const w = g.spawnEnemy('ward', a.tx, a.tz, e.level, { pack: e.pack, aggro: true });
        if (w) e.wardId = w.id;
        e.atkCd = e.def.cooldown;
        g.events.push({ t: 'sfx', id: 'ward', x: a.tx, z: a.tz });
        break;
      }
      case 'hook': {
        const ang = a.dir;
        spawnProjectile(g, { owner: 'enemy', kind: 'hook', special: 'hook', x: e.x, z: e.z, vx: Math.cos(ang) * 24, vz: Math.sin(ang) * 24, r: 0.35, range: 10.5, dtype: 'phys', dmg: { phys: dmgOf(e) }, color: 0xc9a468, src: e.id, label: e.def.name, life: 2 });
        g.events.push({ t: 'sfx', id: 'hook', x: e.x, z: e.z });
        break;
      }
      case 'lunge': {
        e.lungeDir = a.dir;
        e.lungeT = 0.24;
        g.events.push({ t: 'sfx', id: 'lunge', x: e.x, z: e.z });
        break;
      }
      case 'explode':
        // hazard handles damage; the mite is consumed
        e.noLoot = true;
        break;
      case 'slam':
        g.events.push({ t: 'sfx', id: 'slam', x: e.x, z: e.z });
        g.events.push({ t: 'shake', amount: 0.25 });
        break;
      default:
        g.events.push({ t: 'sfx', id: 'enemySwing', x: e.x, z: e.z });
    }
  }
  if (a.fired) {
    if (a.kind === 'lunge' && e.lungeT > 0) {
      e.lungeT -= dt;
      moveDir(g, e, e.lungeDir, 24, dt);
    }
    const execTime = a.kind === 'lunge' ? 0.25 : 0.1;
    if (a.kind === 'explode' && a.t >= a.windup + 0.04) {
      e.alive = false;
      e.hp = 0;
      e.state = 'dead';
      e.fadeT = 0.01;
      g.events.push({ t: 'die', x: e.x, z: e.z, enemy: e.id, type: e.type, elite: false, boss: false });
      return;
    }
    if (a.t >= a.windup + execTime) {
      e.atk = null;
      e.heavyToken = false;
      e.atkCd = Math.max(e.atkCd, e.def.cooldown * (e.elite ? 0.8 : 1));
      if (a.kind === 'lunge') {
        e.state = 'flee';
        e.retreatT = 1.8;
        e.stateT = 0;
      } else {
        e.state = 'recover';
        e.stateT = 0;
      }
    }
  }
}

function updateEliteMods(g: Game, e: Enemy, dt: number, pdist: number) {
  if (!e.elite) return;
  if (e.mods.includes('ember_wake')) {
    e.wake -= dt;
    if (e.wake <= 0 && Math.hypot(e.vx, e.vz) > 0.8) {
      e.wake = 0.55;
      spawnHazard(g, { owner: 'env', shape: 'circle', kind: 'pool', x: e.x, z: e.z, radius: 1.0, delay: 0.25, dur: 3.2, interval: 0.5, dmg: { ember: e.def.dmg * e.dmgMul * 0.25 }, dtype: 'ember', src: e.id, color: 0xff6a30, ownerLabel: 'Ember Wake' });
    }
  }
  if (e.mods.includes('frost_pulse')) {
    e.modT -= dt;
    if (e.modT <= 0 && pdist < 12) {
      e.modT = 6.5;
      spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'nova', x: e.x, z: e.z, radius: 5, delay: 1.1, dmg: { frost: e.def.dmg * e.dmgMul * 0.8 }, dtype: 'frost', src: e.id, color: 0x8cc8ff, ownerLabel: 'Frost Pulse', slowMag: 0.4, follow: e.id });
      g.events.push({ t: 'sfx', id: 'tele_pulse', x: e.x, z: e.z });
    }
  }
  if (e.mods.includes('rallying')) {
    e.modT2 -= dt;
    if (e.modT2 <= 0 && pdist < 14) {
      e.modT2 = 11;
      for (let i = 0; i < 2; i++) g.spawnEnemy('crawler', e.x + (i ? 1.5 : -1.5), e.z + 1, Math.max(1, e.level - 1), { pack: e.pack, aggro: true, noLoot: true });
      for (const o of g.enemies) if (o.alive && !o.neutral && o !== e && Math.hypot(o.x - e.x, o.z - e.z) < 9) addEffect(o, 'rally', 6, 1);
      g.text(e.x, e.z, 'Rallying!', '#ffd060');
    }
  }
}

export function enemyDef(type: string) {
  return ENEMIES[type];
}
