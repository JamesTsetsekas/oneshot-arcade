// Player actions: movement, evade, skill casting and execution, potions. Operates on a Game.
import { CLASS_SKILLS, SKILL_BY_ID, type SkillDef } from '../data/skills';
import { POTIONS } from '../data/items';
import { addEffect, DT_COLORS, getEffect, hasEffect, removeEffect, slowFactor, spawnHazard, spawnProjectile, applyControl, dmgToEnemy, rollPlayerDamage } from './combat';
import { effectiveRank } from './character';
import type { CastRun, Enemy, Player } from './entities';
import type { Game } from './game';
import { findPath, lineClear, moveCircle, nearestWalkable } from './nav';
import type { PotionKind } from './types';

export function makePlayer(id: number): Player {
  return {
    id, x: 0, z: 0, px: 0, pz: 0, vx: 0, vz: 0, facing: 0, r: 0.45, hp: 100, maxHp: 100, alive: true, effects: [], hitFlash: 0, freeze: 0,
    focus: 0, maxFocus: 100, heat: 0, heatIdle: 0, evadeCharges: 3, evadeRecharge: 0, evadeT: 0, evadeDir: { x: 0, z: 1 }, cast: null, queued: null, path: null, moveTarget: null,
    attackTarget: 0, interactTarget: null, moving: false, speed: 4.6, cds: {}, charges: {}, chargeT: {}, potionCd: {}, comboIdx: 0, comboT: -10, moveAcc: 0, dash: null, channel: null,
    lastHitBy: 'Unknown', lastHitType: 'phys', standStill: false, inCombat: 0, regenAcc: 0, lastStandCd: 0, walkAnim: 0, castSkill: null, fireAnimT: 0, dead: false, reviveT: 0, invalidT: 0,
  };
}

// ------------------------------------------------------------------ helpers
export function skillSpeed(g: Game, sk: SkillDef): number {
  let sp = g.d.speedMul;
  if (hasEffect(g.player, 'furnace')) sp *= 1.3;
  const haste = getEffect(g.player, 'haste');
  if (haste) sp *= 1 + haste.mag;
  if (g.ch.cls === 'ranger' && g.d.flags.patient && sk.kind === 'basic') sp *= 0.75;
  if (sk.id === 'iron_litany' && g.d.twoHanded) sp *= 0.8;
  return sp;
}

export function cooldownOf(g: Game, sk: SkillDef): number {
  return sk.cooldown * (1 - g.d.cdr / 100);
}

export function skillReady(g: Game, id: string): { ok: boolean; reason?: string } {
  const sk = SKILL_BY_ID[id];
  if (!sk) return { ok: false };
  const p = g.player;
  if (sk.kind !== 'basic' && (g.ch.ranks[id] ?? 0) <= 0) return { ok: false, reason: 'Not learned' };
  if (sk.charges) {
    if ((p.charges[id] ?? sk.charges) <= 0) return { ok: false, reason: 'No charges' };
  } else if ((p.cds[id] ?? 0) > 0) return { ok: false, reason: 'On cooldown' };
  if (p.focus < sk.cost) return { ok: false, reason: 'Not enough Focus' };
  if (id === 'furnace_heart' && p.heat < 15) return { ok: false, reason: 'Needs Heat' };
  return { ok: true };
}

export function slotSkill(g: Game, slot: string): string | null {
  if (slot === 'basic') return CLASS_SKILLS[g.ch.cls][0].id;
  return g.ch.hotbar[slot as 'rmb'] ?? null;
}

export function beginCast(g: Game, skillId: string, aimX: number, aimZ: number, targetId: number, silent = false): boolean {
  const p = g.player;
  const sk = SKILL_BY_ID[skillId];
  if (!sk || p.dead) return false;
  if (hasEffect(p, 'stun') || p.channel && false) return false;
  const rdy = skillReady(g, skillId);
  if (!rdy.ok) {
    if (!silent && rdy.reason) {
      g.toast(rdy.reason, 'warn');
      g.events.push({ t: 'sfx', id: 'invalid' });
    }
    return false;
  }
  if (p.channel) {
    p.channel = null;
    g.toast('Town gate interrupted', 'warn');
  }
  const speed = skillSpeed(g, sk);
  const dir = Math.atan2(aimZ - p.z, aimX - p.x);
  p.focus -= sk.cost;
  p.cast = { skill: skillId, t: 0, wind: sk.time.wind / speed, total: sk.time.total / speed, move: sk.time.move / speed, fired: false, aim: { x: aimX, z: aimZ }, dir, targetId, speed, combo: 0 };
  p.facing = dir;
  p.castSkill = skillId;
  p.path = null;
  p.moveTarget = null;
  p.interactTarget = null;
  if (sk.charges) {
    p.charges[skillId] = (p.charges[skillId] ?? sk.charges) - 1;
    if (!(p.chargeT[skillId] > 0)) p.chargeT[skillId] = cooldownOf(g, sk);
  } else if (sk.cooldown > 0) p.cds[skillId] = cooldownOf(g, sk);
  g.events.push({ t: 'cast', skill: skillId, x: p.x, z: p.z, tx: aimX, tz: aimZ });
  if (sk.kind === 'basic' || sk.cost > 0) g.player.inCombat = 6;
  g.tutorial('skill', sk.kind !== 'basic');
  g.tutorial('attack', sk.kind === 'basic');
  return true;
}

export function updateCast(g: Game, dt: number) {
  const p = g.player;
  const c = p.cast;
  if (!c) return;
  c.t += dt;
  if (!c.fired && c.t >= c.wind) {
    c.fired = true;
    fireSkill(g, c);
  }
  if (c.t >= c.total) {
    p.cast = null;
    p.castSkill = null;
    const q = p.queued;
    p.queued = null;
    if (q) {
      const id = slotSkill(g, q.slot);
      if (id) beginCast(g, id, q.x, q.z, q.targetId, true);
    }
  }
}

export function canMoveDuringCast(p: Player): boolean {
  return !p.cast || p.cast.t >= p.cast.move;
}

function dirVec(a: number) {
  return { x: Math.cos(a), z: Math.sin(a) };
}

function enemiesInArc(g: Game, x: number, z: number, dir: number, reach: number, arc: number): Enemy[] {
  const out: Enemy[] = [];
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dz = e.z - z;
    const d = Math.hypot(dx, dz);
    if (d - e.r * 0.8 > reach) continue;
    if (d > 0.4) {
      let diff = Math.abs(Math.atan2(dz, dx) - dir);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff > arc / 2 + Math.atan2(e.r, Math.max(d, 0.5))) continue;
    }
    out.push(e);
  }
  return out;
}

function gainFocus(g: Game, amt: number) {
  const p = g.player;
  p.focus = Math.min(p.maxFocus, p.focus + amt);
}
export function gainHeat(g: Game, amt: number) {
  if (g.ch.cls !== 'cinder') return;
  const p = g.player;
  p.heat = Math.min(100, p.heat + amt * (1 + (g.d.raw.heatGain ?? 0) / 100));
  p.heatIdle = 0;
}

function breakCloak(g: Game) {
  if (hasEffect(g.player, 'cloak')) removeEffect(g.player, 'cloak');
}

function fireSkill(g: Game, c: CastRun) {
  const p = g.player;
  const sk = SKILL_BY_ID[c.skill];
  const dir = c.dir;
  const prm = sk.params;
  if (sk.exec !== 'cloak' && sk.exec !== 'stance' && sk.exec !== 'standard') breakCloak(g);
  g.events.push({ t: 'swing', skill: sk.id, x: p.x, z: p.z, dir, actor: p.id, combo: p.comboIdx });
  g.events.push({ t: 'sfx', id: sk.sfx, x: p.x, z: p.z });
  const tags = sk.tags as string[];
  switch (sk.exec) {
    case 'litany': {
      p.comboIdx = g.time - p.comboT < 1.2 ? (p.comboIdx + 1) % 3 : 0;
      p.comboT = g.time;
      c.combo = p.comboIdx;
      const two = g.d.twoHanded;
      const coefs = { phys: (sk.dmg.phys ?? 1) * (two ? 1.65 : 1) * (p.comboIdx === 2 ? 1.25 : 1) };
      const hits = enemiesInArc(g, p.x, p.z, dir, prm.reach + (two ? 0.3 : 0), prm.arc);
      let any = false;
      for (const e of hits) {
        g.playerHitEnemy(e, sk.id, coefs, { tags, fromX: p.x, fromZ: p.z, knock: p.comboIdx === 2 ? 0.6 : 0.2 });
        any = true;
      }
      if (any) {
        gainFocus(g, prm.focusGain + (g.d.raw.focusOnHit ?? 0));
        gainHeat(g, prm.heat * Math.min(3, hits.length));
        g.events.push({ t: 'sfx', id: 'impact', x: p.x + Math.cos(dir) * 1.5, z: p.z + Math.sin(dir) * 1.5 });
      }
      if (p.comboIdx === 2) {
        const v = dirVec(dir);
        spawnProjectile(g, { owner: 'player', kind: 'wave', x: p.x + v.x, z: p.z + v.z, vx: v.x * 14, vz: v.z * 14, r: 0.9, range: 5.5, dtype: 'ember', coefs: { ember: prm.waveDmg * (two ? 1.4 : 1) }, skill: sk.id, tags: ['area', 'ember'], pierce: 8, color: 0xffa050, src: p.id, life: 1 });
      }
      break;
    }
    case 'arc': {
      const hits = enemiesInArc(g, p.x, p.z, dir, prm.reach, prm.arc);
      const burnBonus = prm.burnBonus;
      for (const e of hits) {
        const burning = hasEffect(e, 'burn');
        g.playerHitEnemy(e, sk.id, sk.dmg, { tags, fromX: p.x, fromZ: p.z, ailment: sk.ailment, knock: 0.5, mul: burning ? 1 + burnBonus : 1 });
      }
      if (hits.length) {
        gainHeat(g, 4);
        g.events.push({ t: 'shake', amount: 0.12 });
      }
      g.events.push({ t: 'fx', id: 'flameArc', x: p.x, z: p.z, dir, r: prm.reach, color: 0xff7a30 });
      break;
    }
    case 'rush': {
      const v = dirVec(dir);
      beginDash(g, v.x, v.z, prm.dist, 0.2, sk.id);
      addEffect(p, 'guard', prm.guard * (g.d.flags.oath ? 1.8 : 1), prm.guardMag);
      g.events.push({ t: 'fx', id: 'rush', x: p.x, z: p.z, dir, color: 0xffd56a });
      break;
    }
    case 'ring': {
      spawnHazard(g, { owner: 'player', shape: 'circle', kind: 'blast', x: p.x, z: p.z, radius: prm.radius, delay: 0.001, dmg: {}, skill: sk.id, coefs: sk.dmg, tags, ailment: sk.ailment, knock: prm.knock, color: 0xffd56a, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, once: true });
      g.events.push({ t: 'fx', id: 'ringBurst', x: p.x, z: p.z, r: prm.radius, color: 0xff7a30 });
      g.events.push({ t: 'shake', amount: 0.4 });
      gainHeat(g, 6);
      break;
    }
    case 'chain': {
      const v = dirVec(dir);
      spawnProjectile(g, { owner: 'player', kind: 'chain', special: 'chain', x: p.x + v.x * 0.6, z: p.z + v.z * 0.6, vx: v.x * prm.speed, vz: v.z * prm.speed, r: 0.45, range: prm.range, dtype: 'phys', coefs: sk.dmg, skill: sk.id, tags, pierce: 0, color: 0xd8c090, src: p.id, life: 1.2 });
      break;
    }
    case 'stance': {
      addEffect(p, 'furnace', prm.dur, 1);
      g.events.push({ t: 'fx', id: 'stance', x: p.x, z: p.z, color: 0xff7a30 });
      g.toast('Furnace Heart: burning Heat for speed', 'info');
      break;
    }
    case 'standard': {
      const a = nearestWalkable(g.zone.grid, c.aim.x, c.aim.z, 3) ?? { x: p.x, z: p.z };
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      const maxD = prm.dur > 0 ? sk.range : 8;
      let tx = a.x;
      let tz = a.z;
      if (d > maxD) {
        tx = p.x + ((a.x - p.x) / d) * maxD;
        tz = p.z + ((a.z - p.z) / d) * maxD;
      }
      g.standards = [{ x: tx, z: tz, t: 0, dur: prm.dur, r: prm.radius, taunt: prm.taunt, tauntT: 0.5 }];
      g.events.push({ t: 'fx', id: 'standard', x: tx, z: tz, r: prm.radius, color: 0xffd56a });
      break;
    }
    case 'shot': {
      const v = dirVec(dir);
      const moved = p.moveAcc >= prm.moveThreshold;
      p.moveAcc = 0;
      const rng = g.d.weaponPool;
      void rng;
      spawnProjectile(g, { owner: 'player', kind: 'arrow', x: p.x + v.x * 0.6, z: p.z + v.z * 0.6, vx: v.x * prm.speed, vz: v.z * prm.speed, r: 0.22, range: prm.range, dtype: 'phys', coefs: sk.dmg, skill: sk.id, tags, pierce: 0, color: 0xe8e0c8, src: p.id, mark: moved || !!g.d.flags.trails && g.crng.next() < 0.5, life: 1, special: 'arrow' });
      break;
    }
    case 'cone': {
      const hits = enemiesInArc(g, p.x, p.z, dir, prm.reach, prm.arc);
      for (const e of hits) g.playerHitEnemy(e, sk.id, sk.dmg, { tags, fromX: p.x, fromZ: p.z, ailment: sk.ailment, crowd: hits.length, crowdBonus: prm.crowd });
      for (let i = 0; i < 7; i++) {
        const a = dir + (i / 6 - 0.5) * prm.arc;
        spawnProjectile(g, { owner: 'player', kind: 'arrow', special: 'visual', x: p.x + Math.cos(a) * 0.6, z: p.z + Math.sin(a) * 0.6, vx: Math.cos(a) * 36, vz: Math.sin(a) * 36, r: 0.01, range: prm.reach, dtype: 'phys', coefs: {}, pierce: 99, color: 0xe8e0c8, src: p.id, life: 0.5 });
      }
      break;
    }
    case 'pierce': {
      const v = dirVec(dir);
      spawnProjectile(g, { owner: 'player', kind: 'ghost', x: p.x + v.x * 0.6, z: p.z + v.z * 0.6, vx: v.x * prm.speed, vz: v.z * prm.speed, r: 0.35, range: prm.range, dtype: 'frost', coefs: sk.dmg, skill: sk.id, tags, pierce: 99, color: 0x9fd4ff, src: p.id, life: 1, detonate: prm.detonate });
      break;
    }
    case 'trap': {
      const a = nearestWalkable(g.zone.grid, c.aim.x, c.aim.z, 3) ?? { x: p.x, z: p.z };
      let tx = a.x;
      let tz = a.z;
      const d = Math.hypot(tx - p.x, tz - p.z);
      if (d > sk.range) {
        tx = p.x + ((tx - p.x) / d) * sk.range;
        tz = p.z + ((tz - p.z) / d) * sk.range;
      }
      const arm = prm.arm * (g.d.flags.patient ? 0.8 : 1);
      spawnHazard(g, { owner: 'player', shape: 'circle', kind: 'trap', x: tx, z: tz, radius: prm.radius, delay: arm, dur: prm.life, dmg: {}, skill: sk.id, coefs: sk.dmg, tags, color: 0xa855f7, affectsEnemies: true, affectsPlayer: false, src: p.id, trap: { arm, root: prm.rootDur, slow: prm.slowDur } });
      g.events.push({ t: 'fx', id: 'trapPlace', x: tx, z: tz, r: prm.radius, color: 0xa855f7 });
      break;
    }
    case 'cloak': {
      addEffect(p, 'cloak', prm.dur, 1);
      addEffect(p, 'dodge', 4, 1);
      addEffect(p, 'haste', prm.dur, prm.speed);
      g.events.push({ t: 'fx', id: 'cloak', x: p.x, z: p.z, color: 0x5ee0d0 });
      break;
    }
    case 'backstep': {
      const v = dirVec(dir + Math.PI);
      const ox = p.x;
      const oz = p.z;
      beginDash(g, v.x, v.z, prm.dist, 0.2, sk.id);
      spawnHazard(g, { owner: 'player', shape: 'circle', kind: 'pool', x: ox, z: oz, radius: prm.radius, delay: 0.05, dur: prm.life, interval: prm.tick, dmg: {}, skill: sk.id, coefs: sk.dmg, tags: [...tags, 'trap'], ailment: sk.ailment, color: 0xa855f7, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, slowMag: 0.35 });
      g.events.push({ t: 'fx', id: 'flask', x: ox, z: oz, r: prm.radius, color: 0xa855f7 });
      break;
    }
    case 'barrage': {
      const v = dirVec(dir);
      const aimDist = Math.min(sk.range + 4, Math.max(2, Math.hypot(c.aim.x - p.x, c.aim.z - p.z)));
      void aimDist;
      spawnHazard(g, { owner: 'player', shape: 'line', kind: 'preview', x: p.x, z: p.z, dir, length: prm.length, width: prm.radius * 2, delay: 0.4, dmg: {}, color: 0xffd56a, affectsPlayer: false, src: p.id });
      for (let i = 0; i < prm.bursts; i++) {
        const d = 1.6 + (i * (prm.length - 2)) / (prm.bursts - 1);
        spawnHazard(g, { owner: 'player', shape: 'circle', kind: 'blast', x: p.x + v.x * d, z: p.z + v.z * d, radius: prm.radius, delay: 0.3 + (i * prm.span) / prm.bursts, dmg: {}, skill: sk.id, coefs: sk.dmg, tags, color: 0xffd56a, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, once: true });
      }
      g.events.push({ t: 'fx', id: 'barrage', x: p.x, z: p.z, dir, r: prm.length, color: 0xffd56a });
      break;
    }
  }
}

export function beginDash(g: Game, dx: number, dz: number, dist: number, dur: number, skill: string) {
  const p = g.player;
  const len = Math.hypot(dx, dz) || 1;
  p.dash = { dx: (dx / len) * dist, dz: (dz / len) * dist, t: 0, dur, skill, hit: new Set() };
}

export function updateDash(g: Game, dt: number) {
  const p = g.player;
  const d = p.dash;
  if (!d) return;
  const step = Math.min(dt, d.dur - d.t);
  const k = step / d.dur;
  const m = moveCircle(g.zone.grid, p.x, p.z, d.dx * k, d.dz * k, p.r);
  p.vx = (m.x - p.x) / dt;
  p.vz = (m.z - p.z) / dt;
  p.x = m.x;
  p.z = m.z;
  d.t += dt;
  if (d.skill === 'bastion_step') {
    for (const e of g.enemies) {
      if (!e.alive || d.hit.has(e.id)) continue;
      if (Math.hypot(e.x - p.x, e.z - p.z) < e.r + 1.15) {
        d.hit.add(e.id);
        const sk = SKILL_BY_ID.bastion_step;
        g.playerHitEnemy(e, sk.id, sk.dmg, { tags: sk.tags as string[], fromX: p.x - d.dx, fromZ: p.z - d.dz, ailment: undefined, knock: 1.2 });
        if (!e.boss && !e.elite && e.def.role !== 'bruiser') applyControl(g, e, 'stun', 0.9);
        else applyControl(g, e, 'slow', 1.5, 0.4);
      }
    }
  }
  if (d.skill === 'vow_pull' && d.pullTarget !== undefined) {
    // stop when close to target
    const t = g.enemies.find((e) => e.id === d.pullTarget);
    if (t && Math.hypot(t.x - p.x, t.z - p.z) < t.r + p.r + 0.9) d.t = d.dur;
  }
  if (d.t >= d.dur) p.dash = null;
}

export function beginEvade(g: Game, aimX: number, aimZ: number): boolean {
  const p = g.player;
  if (p.dead || p.evadeCharges <= 0 || p.dash || hasEffect(p, 'stun')) return false;
  if (p.cast) {
    const sk = SKILL_BY_ID[p.cast.skill];
    if (p.cast.t / p.cast.total < sk.cancel) return false;
    p.cast = null;
    p.castSkill = null;
  }
  p.channel = null;
  let dx = aimX - p.x;
  let dz = aimZ - p.z;
  const l = Math.hypot(dx, dz);
  if (l < 0.3) {
    dx = Math.cos(p.facing);
    dz = Math.sin(p.facing);
  }
  p.evadeCharges--;
  if (p.evadeRecharge <= 0) p.evadeRecharge = 2.8 / (1 + g.d.evadeRec / 100);
  p.evadeT = 0.32;
  p.dash = { dx: (dx / (l || 1)) * 4.5, dz: (dz / (l || 1)) * 4.5, t: 0, dur: 0.32, skill: 'evade', hit: new Set() };
  p.facing = Math.atan2(dz, dx);
  p.path = null;
  p.moveTarget = null;
  g.events.push({ t: 'sfx', id: 'evade', x: p.x, z: p.z });
  g.events.push({ t: 'fx', id: 'evade', x: p.x, z: p.z, dir: p.facing, color: 0x5ee0d0 });
  g.tutorial('evade', true);
  if (g.d.relics.has('hushquiver')) {
    const ox = p.x;
    const oz = p.z;
    spawnHazard(g, { owner: 'player', shape: 'line', kind: 'pool', x: ox, z: oz, dir: p.facing, length: 4.5, width: 1.6, delay: 0.05, dur: 3, interval: 0.5, dmg: {}, skill: 'backstep_flask', coefs: { blight: 0.35 }, tags: ['trap'], color: 0xa855f7, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, slowMag: 0.3 });
  }
  return true;
}

// ------------------------------------------------------------------ movement
export function commandMove(g: Game, x: number, z: number): boolean {
  const p = g.player;
  if (p.dead) return false;
  const grid = g.zone.grid;
  let tx = x;
  let tz = z;
  const near = nearestWalkable(grid, x, z, 6);
  if (!near) {
    p.invalidT = 0.6;
    return false;
  }
  if (near.dist > 1.5) {
    p.invalidT = 0.6;
    g.events.push({ t: 'sfx', id: 'invalid' });
  }
  tx = near.x;
  tz = near.z;
  p.moveTarget = { x: tx, z: tz };
  p.attackTarget = 0;
  p.interactTarget = null;
  p.path = findPath(grid, p.x, p.z, tx, tz, 0.4);
  if (!p.path) {
    p.moveTarget = null;
    p.invalidT = 0.6;
    return false;
  }
  g.tutorial('move', true);
  return true;
}

export function updatePlayerMovement(g: Game, dt: number) {
  const p = g.player;
  p.moving = false;
  if (p.dash) {
    updateDash(g, dt);
    return;
  }
  if (p.cast && !canMoveDuringCast(p)) return;
  if (hasEffect(p, 'stun')) return;
  let spd = p.speed;
  const haste = getEffect(p, 'haste');
  if (haste) spd *= 1 + haste.mag;
  spd *= slowFactor(p);
  if (spd <= 0) return;
  if (p.standStill) {
    p.path = null;
    return;
  }
  if (p.path && p.path.length) {
    // moving cancels a recoverable cast
    if (p.cast && p.cast.t >= p.cast.move) {
      p.cast = null;
      p.castSkill = null;
    }
    // re-shorten the path when line of sight allows
    while (p.path.length > 1 && lineClear(g.zone.grid, p.x, p.z, p.path[1].x, p.path[1].z, 0.4)) p.path.shift();
    const w = p.path[0];
    const dx = w.x - p.x;
    const dz = w.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.12) {
      p.path.shift();
      if (!p.path.length) {
        p.moveTarget = null;
        p.vx = p.vz = 0;
      }
      return;
    }
    const step = Math.min(spd * dt, d);
    const m = moveCircle(g.zone.grid, p.x, p.z, (dx / d) * step, (dz / d) * step, p.r);
    p.vx = (m.x - p.x) / dt;
    p.vz = (m.z - p.z) / dt;
    p.moveAcc += Math.hypot(m.x - p.x, m.z - p.z);
    p.x = m.x;
    p.z = m.z;
    p.facing = Math.atan2(dz, dx);
    p.moving = true;
    p.walkAnim += dt * spd * 1.6;
    if (m.hit && Math.hypot(m.x - p.px, m.z - p.pz) < 0.001) {
      p.path = null;
      p.moveTarget = null;
    }
  } else {
    p.vx *= 0.5;
    p.vz *= 0.5;
  }
}

// ------------------------------------------------------------------ potions
export function usePotion(g: Game, kind: PotionKind): boolean {
  const p = g.player;
  const ch = g.ch;
  if (p.dead) return false;
  if (ch.belt[kind] <= 0) {
    g.toast(`No ${POTIONS[kind].name} left`, 'warn');
    g.events.push({ t: 'sfx', id: 'invalid' });
    return false;
  }
  if ((p.potionCd[kind] ?? 0) > 0) return false;
  if (kind === 'health' && p.hp >= p.maxHp && ch.tutorial.potion) {
    g.toast('Health is already full', 'info');
    return false;
  }
  if (kind === 'focus' && p.focus >= p.maxFocus && g.ch.cls !== 'cinder') {
    g.toast('Focus is already full', 'info');
    return false;
  }
  ch.belt[kind]--;
  p.potionCd[kind] = kind === 'health' ? 6 : 8;
  const pot = 1 + g.d.potionPotency / 100;
  switch (kind) {
    case 'health': {
      const heal = Math.max(60, p.maxHp * 0.38) * pot;
      g.healPlayer(heal);
      break;
    }
    case 'focus':
      p.focus = Math.min(p.maxFocus, p.focus + p.maxFocus * 0.55 * pot);
      g.text(p.x, p.z, '+Focus', '#6aa8ff');
      break;
    case 'cleanse':
      for (const k of ['burn', 'blight', 'slow', 'root', 'stun']) removeEffect(p, k);
      addEffect(p, 'resolve', 4, 1);
      g.text(p.x, p.z, 'Cleansed', '#e8eef2');
      break;
    case 'tonic':
      addEffect(p, 'tonic', 20, 25);
      g.text(p.x, p.z, 'Resistances up', '#e8b84a');
      break;
  }
  if (g.d.flags.potionFocus) gainHeat(g, g.d.flags.potionFocus * 2);
  if (g.d.relics.has('tollbelt')) {
    spawnHazard(g, { owner: 'player', shape: 'circle', kind: 'nova', x: p.x, z: p.z, radius: 5, delay: 0.05, dmg: {}, skill: 'cinder_ring', coefs: { frost: 0.6 }, tags: ['area'], color: 0x9fd4ff, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, once: true, ailment: { kind: 'slow', chance: 1, dur: 3, mag: 0.4 } });
    g.events.push({ t: 'fx', id: 'frostPulse', x: p.x, z: p.z, r: 5, color: 0x9fd4ff });
  }
  g.events.push({ t: 'sfx', id: 'potion' });
  g.tutorial('potion', true);
  return true;
}

export function rollForPlayerAilments(g: Game, e: Enemy, dealt: number, sk: SkillDef | undefined, ailment: { kind: string; chance: number; dur: number; mag: number } | undefined, hadEmber: boolean) {
  const d = g.d;
  const extra = d.ailmentChance / 100;
  if (ailment) {
    const chance = Math.min(1, ailment.chance + (ailment.kind === 'burn' ? extra : extra * 0.5));
    if (g.crng.next() < chance) {
      if (ailment.kind === 'burn') addEffect(e, 'burn', ailment.dur + (g.ch.ranks.kindling ? 0.5 : 0), Math.max(1, dealt * ailment.mag * (1 + (d.raw.burnDmgPct ?? 0) / 100)));
      else if (ailment.kind === 'blight') addEffect(e, 'blight', ailment.dur, Math.max(1, dealt * ailment.mag));
      else applyControl(g, e, ailment.kind as 'slow' | 'stun' | 'root', ailment.dur, ailment.mag);
    }
  } else if (extra > 0 && g.crng.next() < extra * 0.6) {
    if (hadEmber || g.ch.cls === 'cinder') addEffect(e, 'burn', 3, Math.max(1, dealt * 0.3 * (1 + (d.raw.burnDmgPct ?? 0) / 100)));
    else addEffect(e, 'blight', 4, Math.max(1, dealt * 0.28));
  }
  void sk;
}

export { dmgToEnemy, rollPlayerDamage, effectiveRank, DT_COLORS };
