// Combat resolution: damage, status effects, hazards (telegraphed areas), projectiles.
import { ELITE_MODS, NEUTRAL_TYPES } from '../data/enemies';
import { SKILL_BY_ID } from '../data/skills';
import { damageMultiplier, effectiveRank } from './character';
import type { Actor, Effect, Enemy, Hazard, Projectile } from './entities';
import type { Game } from './game';
import { WALL, cellAt, moveCircle } from './nav';
import type { DamageType, DmgAmounts } from './types';
import { DAMAGE_TYPES } from './types';

export const DT_COLORS: Record<DamageType, number> = { phys: 0xdfe3e8, ember: 0xff6a30, frost: 0x9fd4ff, blight: 0xa855f7 };
export const DT_CSS: Record<DamageType, string> = { phys: '#e8ecf0', ember: '#ff8a50', frost: '#a8d8ff', blight: '#c58aff' };

// ------------------------------------------------------------------ effects
export function getEffect(a: Actor, k: string): Effect | undefined {
  return a.effects.find((e) => e.k === k);
}
export function hasEffect(a: Actor, k: string): boolean {
  return a.effects.some((e) => e.k === k);
}
export function addEffect(a: Actor, k: string, t: number, mag = 1, src?: number): Effect {
  const ex = a.effects.find((e) => e.k === k);
  if (ex) {
    ex.t = Math.max(ex.t, t);
    ex.mag = Math.max(ex.mag, mag);
    if (k === 'mark') ex.mag = Math.min(3, mag);
    return ex;
  }
  const e: Effect = { k, t, mag, src, tick: 0.5 };
  a.effects.push(e);
  return e;
}
export function removeEffect(a: Actor, k: string) {
  const i = a.effects.findIndex((e) => e.k === k);
  if (i >= 0) a.effects.splice(i, 1);
}
export function slowFactor(a: Actor): number {
  let f = 1;
  for (const e of a.effects) if (e.k === 'slow') f = Math.min(f, 1 - Math.min(0.8, e.mag));
  if (hasEffect(a, 'root') || hasEffect(a, 'stun')) return 0;
  return f;
}

export function tickEffects(g: Game, a: Actor, dt: number, isPlayer: boolean) {
  for (let i = a.effects.length - 1; i >= 0; i--) {
    const e = a.effects[i];
    e.t -= dt;
    if ((e.k === 'burn' || e.k === 'blight') && e.t > -1) {
      e.tick = (e.tick ?? 0.5) - dt;
      if (e.tick <= 0) {
        e.tick += 0.5;
        const amt = e.mag * 0.5;
        if (isPlayer) g.hurtPlayer({ [e.k === 'burn' ? 'ember' : 'blight']: amt }, { name: e.k === 'burn' ? 'Burning' : 'Blight', melee: false, dot: true });
        else dmgToEnemy(g, a as Enemy, { [e.k === 'burn' ? 'ember' : 'blight']: amt }, { dot: true });
      }
    }
    if (e.t <= 0) a.effects.splice(i, 1);
  }
}

// ------------------------------------------------------------------ player damage output
export interface RollOpts {
  mul?: number;
  forceCrit?: boolean;
  target?: Enemy;
  noCrit?: boolean;
  tags?: string[];
}
export function rollPlayerDamage(g: Game, skillId: string, coefs: DmgAmounts, tags: string[], o: RollOpts = {}): { amounts: DmgAmounts; crit: boolean } {
  const d = g.d;
  const sk = SKILL_BY_ID[skillId];
  const rank = sk ? Math.max(1, effectiveRank(g.ch, d, skillId)) : 1;
  const rankMul = 1 + 0.12 * (rank - 1);
  let c: DmgAmounts = { ...coefs };
  const furnace = getEffect(g.player, 'furnace');
  if (furnace && (c.phys ?? 0) > 0) {
    const conv = 0.5;
    c = { ...c, phys: (c.phys ?? 0) * (1 - conv), ember: (c.ember ?? 0) + (coefs.phys ?? 0) * conv };
  }
  const allTags = [...(sk?.tags ?? []), ...tags, ...(o.tags ?? [])];
  const heatBonus = g.ch.cls === 'cinder' ? 1 + g.player.heat * 0.004 : 1;
  const amounts: DmgAmounts = {};
  for (const t of DAMAGE_TYPES) {
    const coef = c[t];
    if (!coef) continue;
    let m = damageMultiplier(d, [t], allTags) * rankMul * (o.mul ?? 1);
    if (t === 'ember') m *= heatBonus;
    if (g.ch.cls === 'ranger' && sk?.id === 'ghostline' && d.flags.patient) m *= 1.6;
    if (g.ch.cls === 'ranger' && allTags.includes('trap') && d.flags.patient) m *= 1.5;
    amounts[t] = d.weaponPool * coef * m * (0.92 + g.crng.next() * 0.16);
  }
  let chance = d.critChance;
  if (o.target && d.flags.farCrit) {
    const dist = Math.hypot(o.target.x - g.player.x, o.target.z - g.player.z);
    if (dist > 7) chance += d.flags.farCrit;
  }
  const crit = !o.noCrit && (o.forceCrit || g.crng.next() * 100 < chance);
  if (crit) for (const t of DAMAGE_TYPES) if (amounts[t]) amounts[t]! *= d.critMult;
  return { amounts, crit };
}

export interface HitOpts {
  crit?: boolean;
  skill?: string;
  fromX?: number;
  fromZ?: number;
  knock?: number;
  dot?: boolean;
  quiet?: boolean;
  env?: boolean;
  noShield?: boolean;
}

export function enemyResist(g: Game, e: Enemy, t: DamageType): number {
  let r = e.def.res[t] ?? 0;
  if (g.ch.difficulty === 'veteran') r += t === 'phys' ? 10 : 18;
  return Math.min(80, r);
}

export function dmgToEnemy(g: Game, e: Enemy, amounts: DmgAmounts, o: HitOpts = {}): number {
  if (!e.alive) return 0;
  if (e.boss_state?.invuln) {
    g.text(e.x, e.z, 'Immune', '#9fb0c0');
    return 0;
  }
  let total = 0;
  let mainType: DamageType = 'phys';
  let mainAmt = -1;
  let shielded = false;
  if (e.def.shieldArc && !o.dot && !o.noShield && o.fromX !== undefined && o.fromZ !== undefined) {
    const ang = Math.atan2(o.fromZ - e.z, o.fromX - e.x);
    let diff = Math.abs(ang - e.facing);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
    if (diff < e.def.shieldArc / 2) shielded = true;
  }
  const ward = getEffect(e, 'ward');
  for (const t of DAMAGE_TYPES) {
    let a = amounts[t];
    if (!a) continue;
    a *= 1 - enemyResist(g, e, t) / 100;
    if (shielded) a *= 0.15;
    if (ward) a *= 1 - ward.mag;
    if (e.mods.includes('mirror_shell') && e.lastDmgType === t) a *= 0.5;
    total += a;
    if (a > mainAmt) {
      mainAmt = a;
      mainType = t;
    }
  }
  if (total <= 0) return 0;
  e.lastDmgType = mainType;
  total = g.bossDamageFilter(e, total, o);
  if (total <= 0) return 0;
  const hpBefore = e.hp;
  e.hp -= total;
  e.hitFlash = 0.12;
  const crit = !!o.crit;
  if (!o.dot || total >= 1) {
    g.events.push({ t: 'hit', x: e.x, z: e.z, amount: total, crit, dtype: mainType, onPlayer: false, target: e.id, blocked: shielded });
  }
  if (!NEUTRAL_TYPES.includes(e.type) && !e.aggro && e.state === 'dormant') g.wakeEnemy(e);
  else if (e.state === 'dormant' && e.type !== 'dummy' && e.type !== 'urn') g.wakeEnemy(e);
  if (crit && !e.boss) e.freeze = Math.max(e.freeze, 0.04);
  else if (!e.boss && total > e.maxHp * 0.12 && !o.dot) e.freeze = Math.max(e.freeze, 0.03);
  if (crit) g.events.push({ t: 'hitstop', ms: e.elite || e.boss ? 40 : 30 });
  if (o.knock && !e.boss && e.def.role !== 'bruiser' && !e.elite && !o.dot && e.type !== 'dummy') {
    const ang = Math.atan2(e.z - (o.fromZ ?? g.player.z), e.x - (o.fromX ?? g.player.x));
    const m = moveCircle(g.zone.grid, e.x, e.z, Math.cos(ang) * o.knock, Math.sin(ang) * o.knock, e.r);
    e.x = m.x;
    e.z = m.z;
  }
  // split swarm at half health
  if (e.type === 'swarm' && !e.split && e.hp > 0 && e.hp <= e.maxHp * 0.5 && hpBefore > e.maxHp * 0.5) {
    e.split = true;
    g.splitSwarm(e);
  }
  if (e.hp <= 0 && e.type !== 'dummy') g.killEnemy(e, o.skill ?? 'hit');
  else if (e.type === 'dummy') {
    g.dummyDamage += total;
    e.hp = e.maxHp;
  }
  return total;
}

/** Apply a hard crowd-control effect. Bosses convert it into stagger damage; heavies resist it. */
export function applyControl(g: Game, e: Enemy, kind: 'stun' | 'root' | 'slow', dur: number, mag = 0.4) {
  if (!e.alive || e.neutral) return;
  if (e.boss) {
    g.bossControl(e, kind, dur);
    if (kind === 'slow') addEffect(e, 'slow', dur, Math.min(0.4, mag));
    return;
  }
  if (e.elite && kind !== 'slow') {
    // elites: control converted to slow (traps slow elites, per Snare Bloom design)
    addEffect(e, 'slow', dur, 0.4);
    return;
  }
  // diminishing returns for repeated hard control
  const dr = getEffect(e, 'cc_dr');
  let d = dur;
  if (kind !== 'slow') {
    if (dr) d = dur * Math.max(0.25, 1 - dr.mag * 0.4);
    addEffect(e, 'cc_dr', 5, (dr?.mag ?? 0) + 1);
  }
  if (e.def.role === 'bruiser' && kind === 'stun') {
    addEffect(e, 'slow', Math.min(d, 1.5), 0.5);
    return;
  }
  addEffect(e, kind, d, mag);
  if (kind === 'stun' && e.atk) {
    e.atk = null;
    g.cancelEnemyHazards(e);
    e.state = 'recover';
    e.stateT = d;
  }
}

// ------------------------------------------------------------------ hazards
let hazId = 1;
export function newHazard(p: Partial<Hazard> & Pick<Hazard, 'owner' | 'shape' | 'x' | 'z'>): Hazard {
  return {
    id: hazId++, kind: 'blast', dir: 0, radius: 1, arc: Math.PI * 2, length: 0, width: 0, inner: 0, delay: 0.5, totalDelay: p.delay ?? 0.5, dur: 0, interval: 0.5, tickT: 0, active: false, src: 0,
    dtype: 'phys', dmg: {}, knock: 0, color: 0xff6a30, affectsEnemies: false, affectsPlayer: true, hit: new Set(), once: false, follow: 0, telegraph: true, dead: false, slowMag: 0, ownerLabel: '',
    noFriendly: false, ...p,
  } as Hazard;
}

export function spawnHazard(g: Game, p: Partial<Hazard> & Pick<Hazard, 'owner' | 'shape' | 'x' | 'z'>): Hazard {
  const h = newHazard(p);
  h.totalDelay = h.delay;
  g.hazards.push(h);
  if (g.hazards.length > 160) g.hazards.shift();
  return h;
}

export function inShape(h: Hazard, ax: number, az: number, ar: number): boolean {
  const dx = ax - h.x;
  const dz = az - h.z;
  const dist = Math.hypot(dx, dz);
  switch (h.shape) {
    case 'circle':
      return dist - ar * 0.6 <= h.radius;
    case 'ring':
      return dist + ar * 0.3 >= h.inner && dist - ar * 0.6 <= h.radius;
    case 'cone': {
      if (dist - ar * 0.6 > h.radius) return false;
      if (dist < ar + 0.3) return true;
      let diff = Math.abs(Math.atan2(dz, dx) - h.dir);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      const slack = Math.atan2(ar, dist);
      return diff <= h.arc / 2 + slack;
    }
    case 'line': {
      const c = Math.cos(h.dir);
      const s = Math.sin(h.dir);
      const along = dx * c + dz * s;
      const perp = Math.abs(-dx * s + dz * c);
      return along >= -ar && along <= h.length + ar && perp <= h.width / 2 + ar * 0.7;
    }
  }
}

function applyHazardHit(g: Game, h: Hazard) {
  const hitList: Enemy[] = [];
  if (h.affectsPlayer && !g.player.dead) {
    const p = g.player;
    if ((!h.once || !h.hit.has(-1)) && inShape(h, p.x, p.z, p.r)) {
      h.hit.add(-1);
      let amounts = h.dmg;
      if (h.kind === 'pool' && h.owner === 'env') amounts = h.dmg;
      g.hurtPlayer(amounts, { name: h.ownerLabel || 'Hazard', melee: h.kind === 'swipe' || h.kind === 'sweep', srcId: h.src, fromX: h.x, fromZ: h.z, dtype: h.dtype, heavy: h.kind === 'slam' });
      if (h.ailment && g.crng.next() < h.ailment.chance) {
        const resist = g.d.ailmentResist / 100;
        if (!hasEffect(p, 'resolve') && g.crng.next() > resist) addEffect(p, h.ailment.kind, h.ailment.dur, h.ailment.mag, h.src);
      }
      if (h.slowMag > 0 && !hasEffect(p, 'resolve')) addEffect(p, 'slow', 1.6, h.slowMag);
      if (h.knock) g.pushPlayer(h.x, h.z, h.knock);
    }
  }
  if (h.affectsEnemies) {
    for (const e of g.enemies) {
      if (!e.alive || e.id === h.src && h.owner !== 'player' && false) continue;
      if (h.noFriendly && h.owner === 'enemy' && e.id !== h.src) continue;
      if (e.type === 'ward' && h.owner === 'player' && false) continue;
      if (h.once && h.hit.has(e.id)) continue;
      if (!inShape(h, e.x, e.z, e.r)) continue;
      h.hit.add(e.id);
      hitList.push(e);
    }
    if (h.owner === 'player' && h.skill && h.coefs) {
      const n = hitList.length;
      for (const e of hitList) g.playerHitEnemy(e, h.skill, h.coefs, { tags: h.tags, fromX: h.x, fromZ: h.z, knock: h.knock, ailment: h.ailment, hazard: h, crowd: n });
    } else {
      for (const e of hitList) {
        if (e.id === h.src && h.kind !== 'blast') continue;
        dmgToEnemy(g, e, h.dmg, { fromX: h.x, fromZ: h.z, env: true, dot: h.kind === 'pool' });
        if (h.ailment && g.crng.next() < h.ailment.chance) addEffect(e, h.ailment.kind, h.ailment.dur, h.ailment.mag);
        if (h.slowMag > 0) addEffect(e, 'slow', 1.4, h.slowMag);
      }
    }
  }
}

export function updateHazards(g: Game, dt: number) {
  for (const h of g.hazards) {
    if (h.dead) continue;
    if (h.follow) {
      const f = h.follow === g.player.id ? g.player : g.enemies.find((e) => e.id === h.follow);
      if (f && f.alive !== false) {
        h.x = f.x;
        h.z = f.z;
      }
    }
    if (h.trap) {
      // traps: arm then trigger on enemy contact
      h.delay -= dt;
      h.dur -= dt;
      if (h.dur <= 0) h.dead = true;
      if (h.delay <= 0) {
        h.active = true;
        const trig = g.enemies.find((e) => e.alive && !e.neutral && Math.hypot(e.x - h.x, e.z - h.z) <= h.radius + e.r * 0.5);
        if (trig) {
          h.dead = true;
          g.events.push({ t: 'fx', id: 'trapSnap', x: h.x, z: h.z, r: h.radius, color: 0xa855f7 });
          g.events.push({ t: 'sfx', id: 'trapSnap', x: h.x, z: h.z });
          for (const e of g.enemies) {
            if (!e.alive || e.neutral || Math.hypot(e.x - h.x, e.z - h.z) > h.radius + e.r) continue;
            if (h.skill && h.coefs) g.playerHitEnemy(e, h.skill, h.coefs, { tags: h.tags, fromX: h.x, fromZ: h.z, noCrit: false });
            applyControl(g, e, 'root', h.trap.root, 1);
            addEffect(e, 'slow', h.trap.slow, 0.4);
          }
        }
      }
      continue;
    }
    if (!h.active) {
      h.delay -= dt;
      if (h.delay <= 0) {
        h.active = true;
        h.tickT = 0;
        if (h.kind !== 'preview') g.events.push({ t: 'fx', id: h.kind === 'pool' ? 'poolBurst' : 'hazardPop', x: h.x, z: h.z, dir: h.dir, r: h.radius, color: h.color });
      }
      continue;
    }
    if (h.kind === 'preview') {
      h.dead = true;
      continue;
    }
    if (h.dur <= 0) {
      applyHazardHit(g, h);
      if (h.kind === 'blast' && h.owner !== 'player') g.events.push({ t: 'shake', amount: 0.35 });
      h.dead = true;
      continue;
    }
    h.tickT -= dt;
    if (h.tickT <= 0) {
      h.tickT += h.interval;
      if (h.kind === 'pool') h.hit.clear();
      applyHazardHit(g, h);
    }
    h.dur -= dt;
    if (h.dur <= 0) h.dead = true;
  }
  for (let i = g.hazards.length - 1; i >= 0; i--) if (g.hazards[i].dead) g.hazards.splice(i, 1);
}

// ------------------------------------------------------------------ projectiles
let projId = 1;
export function spawnProjectile(g: Game, p: Partial<Projectile> & Pick<Projectile, 'owner' | 'x' | 'z' | 'vx' | 'vz'>): Projectile {
  const pr: Projectile = {
    id: projId++, kind: 'arrow', r: 0.3, life: 3, dist: 0, range: 14, dtype: 'phys', dmg: {}, pierce: 0, hit: new Set(), color: 0xffffff, src: 0, label: '', dead: false, ...p,
  } as Projectile;
  g.projectiles.push(pr);
  return pr;
}

export function updateProjectiles(g: Game, dt: number) {
  for (const p of g.projectiles) {
    if (p.dead) continue;
    const sp = Math.hypot(p.vx, p.vz);
    const steps = Math.max(1, Math.ceil((sp * dt) / 0.35));
    for (let s = 0; s < steps && !p.dead; s++) {
      const sx = (p.vx * dt) / steps;
      const sz = (p.vz * dt) / steps;
      p.x += sx;
      p.z += sz;
      p.dist += Math.hypot(sx, sz);
      if (cellAt(g.zone.grid, Math.floor(p.x), Math.floor(p.z)) === WALL) {
        p.dead = true;
        g.events.push({ t: 'fx', id: 'arrowHit', x: p.x, z: p.z, color: p.color });
        break;
      }
      if (p.owner === 'player') {
        for (const e of g.enemies) {
          if (!e.alive || p.hit.has(e.id)) continue;
          if (e.type === 'ward' && false) continue;
          const rr = e.r + p.r;
          if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 > rr * rr) continue;
          p.hit.add(e.id);
          g.projectileHitEnemy(p, e);
          if (p.pierce <= 0) {
            p.dead = true;
            break;
          }
          p.pierce--;
        }
      } else if (!g.player.dead) {
        const pl = g.player;
        const rr = pl.r + p.r;
        if (!p.hit.has(pl.id) && (pl.x - p.x) ** 2 + (pl.z - p.z) ** 2 <= rr * rr) {
          p.hit.add(pl.id);
          g.projectileHitPlayer(p);
          if (p.pierce <= 0) p.dead = true;
          else p.pierce--;
        }
      }
    }
    p.life -= dt;
    if (p.life <= 0 || p.dist >= p.range) {
      if (!p.dead && p.special === 'chain') g.chainMiss(p);
      p.dead = true;
    }
  }
  for (let i = g.projectiles.length - 1; i >= 0; i--) if (g.projectiles[i].dead) g.projectiles.splice(i, 1);
}

export function eliteModDef(id: string) {
  return ELITE_MODS.find((m) => m.id === id)!;
}
