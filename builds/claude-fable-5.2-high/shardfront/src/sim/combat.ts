// simulation-core: target acquisition, attack resolution, deterministic projectiles, damage rules,
// area effects and passive unit behaviours. Rendering never decides any of this.
import { ARMOR_UPGRADE_STEP, ATTACK_UPGRADE_STEP, type EntityDef, type WeaponDef } from '../data/types';
import { TICK_RATE, FL_ANCHOR, FL_BRACED, FL_CONSTRUCTING, FL_CURLED, FL_HOLD, NEUTRAL, type Projectile, type Sim } from './sim';
import { castPoint, face, markEngaged, navTo } from './units';

export function isValidTarget(s: Sim, e: number, d: EntityDef, t: number): boolean {
  if (t < 0 || !s.alive[t] || s.owner[t] === s.owner[e]) return false;
  const td = s.defs[s.def[t]];
  if (td.cls === 'resource') return false;
  if (td.cls === 'neutral' && td.id !== 'barrier') return false;
  if (td.hover && d.weapon && !d.weapon.hitsHover) return false;
  return true;
}

/** Pick the best visible enemy in acquisition range: fighters first, then workers, then structures; closest wins. */
export function acquireTarget(s: Sim, e: number, d: EntityDef): number {
  const w = d.weapon;
  if (!w) return -1;
  const owner = s.owner[e];
  const vis = s.players[owner].visible;
  const range = w.range + (s.flags[e] & FL_BRACED ? 2 : 0);
  const stationary = d.speed === 0 || (s.flags[e] & FL_HOLD) !== 0;
  const acq = stationary ? range + d.radius : Math.max(range + 2.5, Math.min(d.sight, range + 5));
  const x = s.x[e], z = s.z[e];
  const out = s.scratch;
  const n = s.query(x, z, acq + 4.5, out);
  let best = -1, bestScore = 1e9;
  for (let k = 0; k < n; k++) {
    const o = out[k];
    if (!s.alive[o]) continue;
    const oo = s.owner[o];
    if (oo === owner || oo === NEUTRAL) continue;
    const od = s.defs[s.def[o]];
    if (od.hover && !w.hitsHover) continue;
    if (!vis[s.visIndex(s.x[o], s.z[o])]) continue;
    const edge = s.edgeDist(o, x, z);
    if (edge > acq) continue;
    if (w.minRange > 0) {
      const dx = s.x[o] - x, dz = s.z[o] - z;
      if (dx * dx + dz * dz < w.minRange * w.minRange) continue;
    }
    let score = edge;
    if (od.cls === 'structure') score += od.weapon ? 0.5 : 7;
    else if (od.worker) score += 3;
    else if (!od.weapon) score += 2;
    if (od.hover && w.bonus.Hover) score -= 30;
    if (o === s.lastAttacker[e]) score -= 2;
    if (score < bestScore || (score === bestScore && o < best)) { bestScore = score; best = o; }
  }
  return best;
}

/** Fight a specific target: close the distance if allowed, then anticipation -> release -> cooldown. */
export function engage(s: Sim, e: number, d: EntityDef, t: number, chase: boolean): void {
  const w = d.weapon;
  if (!w) return;
  markEngaged();
  const dx = s.x[t] - s.x[e], dz = s.z[t] - s.z[e];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const range = w.range + (s.flags[e] & FL_BRACED ? 2 : 0) + (w.melee ? d.radius : 0);
  const edge = s.edgeDist(t, s.x[e], s.z[e]);
  if (s.windup[e] > 0) {
    // committed to the shot
    s.flags[e] |= FL_ANCHOR;
    s.navOn[e] = 0;
    face(s, e, dx, dz, 0.5);
    if (--s.windup[e] === 0) { s.windup[e] = -1; fire(s, e, d, w, t, dist); }
    return;
  }
  const tooClose = w.minRange > 0 && dist < w.minRange;
  if (edge <= range && !tooClose) {
    s.flags[e] |= FL_ANCHOR;
    s.navOn[e] = 0; s.path[e] = null; s.navFail[e] = 0;
    face(s, e, dx, dz, 0.5);
    if (s.cooldown[e] <= 0) {
      const wt = Math.round(w.windup * TICK_RATE);
      if (wt <= 0) fire(s, e, d, w, t, dist);
      else s.windup[e] = wt;
    }
    return;
  }
  if (tooClose || !chase || d.speed === 0 || (s.flags[e] & FL_HOLD)) { s.navOn[e] = 0; return; }
  const td = s.defs[s.def[t]];
  navTo(s, e, s.x[t], s.z[t], td.footprint / 2, td.footprint > 0 ? range * 0.9 : (range + td.radius) * 0.9);
}

function fire(s: Sim, e: number, d: EntityDef, w: WeaponDef, t: number, dist: number): void {
  const owner = s.owner[e];
  const dmg = w.damage * (1 + ATTACK_UPGRADE_STEP * s.players[owner].atkLevel);
  s.cooldown[e] = Math.round(w.period * TICK_RATE);
  s.lastFire[e] = s.tick;
  let travel = 0;
  if (w.delay > 0) travel = Math.round(w.delay * TICK_RATE);
  else if (w.speed > 0) travel = Math.max(1, Math.ceil((dist / w.speed) * TICK_RATE));
  const proj: Projectile = { hitTick: s.tick + travel, target: w.ground ? -1 : t, gx: s.x[t], gz: s.z[t], dmg, def: s.def[e], owner, from: e, sx: s.x[e], sz: s.z[e] };
  s.events.push({ t: 'fire', id: e, target: t, fx: w.fx, sx: s.x[e], sz: s.z[e], tx: s.x[t], tz: s.z[t], travel, ground: w.ground, owner });
  if (w.delay > 0) s.events.push({ t: 'telegraph', x: s.x[t], z: s.z[t], r: w.splash, ticks: travel, owner });
  if (travel === 0) resolveHit(s, proj);
  else s.projectiles.push(proj);
}

function bonusFor(w: WeaponDef, td: EntityDef, atkMul: number): number {
  let b = 0;
  for (const tag of td.tags) {
    const v = w.bonus[tag];
    if (v) b += v;
  }
  return b * atkMul;
}

/** Apply damage with armor, upgrades, shields and stance modifiers. */
export function dealDamage(s: Sim, t: number, raw: number, w: WeaponDef, attacker: number, attackerOwner: number, ax: number, az: number): void {
  if (!s.alive[t]) return;
  const td = s.defs[s.def[t]];
  const to = s.owner[t];
  let dmg = Math.max(1, raw - td.armor);
  if (to < 2) dmg *= 1 - ARMOR_UPGRADE_STEP * s.players[to].armLevel;
  const dx = ax - s.x[t], dz = az - s.z[t];
  const dl = Math.sqrt(dx * dx + dz * dz) || 1;
  const frontal = (dx / dl) * s.fx[t] + (dz / dl) * s.fz[t] > 0.25;
  if (td.id === 'carapace') {
    if (!w.melee) dmg *= 0.65;
    if (s.flags[t] & FL_CURLED) dmg *= frontal ? 0.4 : 0.7;
  }
  let shieldHit = false;
  if (td.shield > 0 && s.shield[t] > 0 && frontal && !w.melee) {
    const absorbed = Math.min(s.shield[t], dmg);
    s.shield[t] -= absorbed; dmg -= absorbed;
    shieldHit = true;
  }
  s.lastHit[t] = s.tick;
  if (attacker >= 0 && s.alive[attacker]) s.lastAttacker[t] = attacker;
  s.events.push({ t: 'hit', id: t, shield: shieldHit && dmg <= 0 });
  if (to < 2) {
    const ps = s.players[to];
    if (s.tick - ps.lastAttackAlert > 100) {
      ps.lastAttackAlert = s.tick;
      s.alert(to, 'attack', s.x[t], s.z[t]);
    }
  }
  if (dmg <= 0) return;
  s.hp[t] -= dmg;
  if (s.hp[t] <= 0) s.kill(t, attacker >= 0 && s.alive[attacker] ? attacker : -1);
  void attackerOwner;
}

function resolveHit(s: Sim, p: Projectile): void {
  const d = s.defs[p.def];
  const w = d.weapon as WeaponDef;
  const atkMul = p.dmg / w.damage;
  const out = s.scratch;
  if (w.splash > 0) {
    const n = s.query(p.gx, p.gz, w.splash + 4.5, out);
    // copy candidates: dealDamage may kill and emit but never re-enters query
    const cands = out.slice(0, n);
    for (const o of cands) {
      if (!s.alive[o] || s.owner[o] === p.owner) continue;
      const od = s.defs[s.def[o]];
      if (od.cls === 'neutral' && od.id !== 'barrier') continue;
      if (od.hover && !w.hitsHover) continue;
      const edge = s.edgeDist(o, p.gx, p.gz);
      if (edge > w.splash) continue;
      const fall = edge <= w.splash * 0.4 ? 1 : 1 - 0.6 * ((edge - w.splash * 0.4) / (w.splash * 0.6));
      dealDamage(s, o, (p.dmg + bonusFor(w, od, atkMul)) * fall, w, p.from, p.owner, p.sx, p.sz);
    }
    s.events.push({ t: 'impact', x: p.gx, z: p.gz, fx: w.fx, splash: w.splash, owner: p.owner });
    return;
  }
  const t = p.target;
  if (t < 0 || !s.alive[t]) return;
  const td = s.defs[s.def[t]];
  const tx = s.x[t], tz = s.z[t];
  dealDamage(s, t, p.dmg + bonusFor(w, td, atkMul), w, p.from, p.owner, p.sx, p.sz);
  if (w.slow && s.alive[t] && td.cls === 'unit') s.slowUntil[t] = s.tick + Math.round(w.slow.seconds * TICK_RATE);
  s.events.push({ t: 'impact', x: tx, z: tz, fx: w.fx, splash: 0, owner: p.owner });
  if (w.pierce) {
    // overpenetration: one Light enemy unit just behind the target along the firing line
    const dx = tx - p.sx, dz = tz - p.sz;
    const dl = Math.sqrt(dx * dx + dz * dz) || 1;
    const bx = tx + (dx / dl) * 1.8, bz = tz + (dz / dl) * 1.8;
    const n = s.query(bx, bz, 3, out);
    let best = -1, bestD = 2.2 * 2.2;
    for (let k = 0; k < n; k++) {
      const o = out[k];
      if (o === t || !s.alive[o] || s.owner[o] === p.owner || s.owner[o] === NEUTRAL) continue;
      const od = s.defs[s.def[o]];
      if (od.cls !== 'unit' || !od.tags.includes('Light')) continue;
      const ddx = s.x[o] - bx, ddz = s.z[o] - bz;
      const dd = ddx * ddx + ddz * ddz;
      if (dd < bestD) { bestD = dd; best = o; }
    }
    if (best >= 0) {
      const ox = s.x[best], oz = s.z[best];
      dealDamage(s, best, p.dmg * 0.6, w, p.from, p.owner, p.sx, p.sz);
      s.events.push({ t: 'impact', x: ox, z: oz, fx: w.fx, splash: 0, owner: p.owner });
    }
  }
}

/** Structures with weapons, projectiles, area effects and passives. Runs once per tick after unit orders. */
export function updateCombatSystems(s: Sim): void {
  const ids = s.ids;
  const tick = s.tick;
  // defensive structures
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'structure' || !d.weapon || (s.flags[e] & FL_CONSTRUCTING)) continue;
    if (s.cooldown[e] > 0) s.cooldown[e]--;
    let t = s.target[e];
    if (t >= 0 && (!isValidTarget(s, e, d, t) || !s.isVisibleTo(s.owner[e], t) || s.edgeDist(t, s.x[e], s.z[e]) > d.weapon.range + d.radius)) t = -1;
    if (t < 0 && (tick + e) % 5 === 0) t = acquireTarget(s, e, d);
    s.target[e] = t;
    if (t >= 0 && s.cooldown[e] <= 0) {
      const dx = s.x[t] - s.x[e], dz = s.z[t] - s.z[e];
      face(s, e, dx, dz, 1);
      fire(s, e, d, d.weapon, t, Math.sqrt(dx * dx + dz * dz));
    }
  }
  // projectiles (delayed hits)
  if (s.projectiles.length > 0) {
    const ps = s.projectiles;
    let k = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (p.hitTick <= tick) resolveHit(s, p);
      else ps[k++] = p;
    }
    ps.length = k;
  }
  // area effects
  if (s.effects.length > 0) {
    const out = s.scratch;
    let k = 0;
    for (let i = 0; i < s.effects.length; i++) {
      const fx = s.effects[i];
      if (fx.until <= tick) continue;
      s.effects[k++] = fx;
      if (fx.k === 'mend' && tick % 4 === 0) {
        const n = s.query(fx.x, fx.z, fx.r + 1.5, out);
        for (let j = 0; j < n; j++) {
          const o = out[j];
          if (!s.alive[o] || s.owner[o] !== fx.owner) continue;
          const od = s.defs[s.def[o]];
          if (od.cls !== 'unit' || !od.tags.includes('Biological')) continue;
          const dx = s.x[o] - fx.x, dz = s.z[o] - fx.z;
          if (dx * dx + dz * dz > fx.r * fx.r) continue;
          s.hp[o] = Math.min(od.hp, s.hp[o] + 2.25);
        }
      }
    }
    s.effects.length = k;
  }
  // passives
  const out = s.scratch;
  for (let i = 0; i < ids.length; i++) {
    const e = ids[i];
    if (!s.alive[e]) continue;
    const d = s.defs[s.def[e]];
    if (d.cls !== 'unit' && d.cls !== 'structure') continue;
    const constructing = (s.flags[e] & FL_CONSTRUCTING) !== 0;
    if (d.energy > 0 && s.energy[e] < d.energy) s.energy[e] = Math.min(d.energy, s.energy[e] + (d.id === 'mender' ? 0.05 : 0.075));
    if (d.shield > 0 && s.shield[e] < d.shield && tick - s.lastHit[e] > 120) s.shield[e] = Math.min(d.shield, s.shield[e] + 0.15);
    if (s.weldUntil[e] > tick && !constructing) s.hp[e] = Math.min(d.hp, s.hp[e] + 0.75);
    if (d.faction === 'chorus' && !constructing && s.hp[e] < d.hp && tick - s.lastHit[e] > 80) {
      s.hp[e] = Math.min(d.hp, s.hp[e] + (d.cls === 'structure' ? 0.15 : 0.1));
    }
    if (d.id === 'mender' && (tick + e) % 4 === 0 && s.energy[e] >= 1) {
      const n = s.query(s.x[e], s.z[e], 7.5, out);
      let best = -1, bestFrac = 0.995;
      for (let j = 0; j < n; j++) {
        const o = out[j];
        if (o === e || !s.alive[o] || s.owner[o] !== s.owner[e]) continue;
        const od = s.defs[s.def[o]];
        if (od.cls !== 'unit' || !od.tags.includes('Mechanical')) continue;
        const dx = s.x[o] - s.x[e], dz = s.z[o] - s.z[e];
        if (dx * dx + dz * dz > 5.5 * 5.5) continue;
        const frac = s.hp[o] / od.hp;
        if (frac < bestFrac) { bestFrac = frac; best = o; }
      }
      if (best >= 0) {
        s.hp[best] = Math.min(s.defs[s.def[best]].hp, s.hp[best] + 1.8);
        s.energy[e] -= 0.55;
        s.events.push({ t: 'beam', from: e, to: best });
      }
    } else if (d.id === 'crownbeast' && (tick + e) % 10 === 0) {
      const n = s.query(s.x[e], s.z[e], 8, out);
      for (let j = 0; j < n; j++) {
        const o = out[j];
        if (!s.alive[o] || s.owner[o] !== s.owner[e]) continue;
        const od = s.defs[s.def[o]];
        if (od.cls !== 'unit' || tick - s.lastHit[o] < 100 || s.hp[o] >= od.hp) continue;
        const dx = s.x[o] - s.x[e], dz = s.z[o] - s.z[e];
        if (dx * dx + dz * dz > 36) continue;
        s.hp[o] = Math.min(od.hp, s.hp[o] + 1.5);
      }
    } else if (d.id === 'sage' && (tick + e) % 10 === 0 && s.energy[e] >= 50 && s.abilityReady[e] <= tick && s.orders[e].every((o) => o.t !== 9)) {
      // autocast Mend Spores on the most wounded nearby biological ally
      const n = s.query(s.x[e], s.z[e], 10, out);
      let best = -1, bestFrac = 0.7, hurt = 0;
      for (let j = 0; j < n; j++) {
        const o = out[j];
        if (!s.alive[o] || s.owner[o] !== s.owner[e]) continue;
        const od = s.defs[s.def[o]];
        if (od.cls !== 'unit' || !od.tags.includes('Biological')) continue;
        const dx = s.x[o] - s.x[e], dz = s.z[o] - s.z[e];
        if (dx * dx + dz * dz > 64) continue;
        const frac = s.hp[o] / od.hp;
        if (frac < 0.9) hurt++;
        if (frac < bestFrac) { bestFrac = frac; best = o; }
      }
      if (best >= 0 && (hurt >= 2 || bestFrac < 0.5)) castPoint(s, e, 'mend', s.x[best], s.z[best]);
    }
  }
}
