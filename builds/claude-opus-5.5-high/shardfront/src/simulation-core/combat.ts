// Combat resolution: target acquisition, weapon windup/cooldown, deterministic projectiles,
// splash, overpenetration, slows, shields, statuses, auras, zones, and neutral map objects.
import { STRUCTURES, UNITS, type WeaponDef } from '../faction-data';
import type { Sim } from './sim';
import { Kind } from './types';

export function effectiveRange(sim: Sim, id: number, w: WeaponDef): number {
  let r = w.range;
  if (sim.kind[id] === Kind.Unit && sim.ext[id].braced) r += 2;
  return r;
}

function canHit(sim: Sim, w: WeaponDef, t: number): boolean {
  const k = sim.kind[t];
  if (k === Kind.Unit) return !sim.isHover(t) || w.canTargetHover;
  return k === Kind.Structure || k === Kind.Spike;
}

/**
 * Choose a target within `range` of `id`: threats that can fight back first, then recent
 * attackers, then closest; structures last. Needle Pods prefer hovering scouts.
 */
export function acquireTarget(sim: Sim, id: number, range: number): number {
  const w = sim.weaponOf(id);
  if (!w) return -1;
  const owner = sim.owner[id];
  const e = sim.ext[id];
  const x = sim.x[id], y = sim.y[id];
  const preferHover = sim.kind[id] === Kind.Structure && sim.sdef(id).id === 'needle_pod';
  const cone = sim.kind[id] === Kind.Structure && w.coneHalfAngle ? Math.cos((w.coneHalfAngle * Math.PI) / 180) : -2;
  let best = -1, bestScore = 1e9;
  sim.spatial.query(x, y, range + 3, (j) => {
    if (!sim.alive[j] || sim.owner[j] === owner || sim.owner[j] < 0) return;
    if (!canHit(sim, w, j)) return;
    const d = sim.edgeDist(id, j);
    if (d > range) return;
    if (!sim.isVisibleTo(owner, j)) return;
    if (cone > -2) {
      const dx = sim.x[j] - x, dy = sim.y[j] - y, l = Math.hypot(dx, dy) || 1;
      if ((dx * e.cone.x + dy * e.cone.y) / l < cone) return;
    }
    let score = d;
    const k = sim.kind[j];
    if (k === Kind.Structure) score += sim.weaponOf(j) ? 2 : 12;
    else if (k === Kind.Unit) {
      const ud = sim.udef(j);
      if (!ud.weapon && !ud.abilities.length) score += ud.worker ? 1.5 : 3;
      if (preferHover && ud.hover) score -= 50;
    }
    if (j === e.lastAttacker && sim.tick - e.lastDamageTick < 60) score -= 2.5;
    if (score < bestScore || (score === bestScore && j < best)) { bestScore = score; best = j; }
  });
  return best;
}

/** Apply weapon damage from attacker to target. Returns damage dealt. */
export function dealDamage(sim: Sim, srcOwner: number, w: WeaponDef, t: number, mult: number, fromX: number, fromY: number, src: number): number {
  if (!sim.alive[t]) return 0;
  const tags = sim.tagsOf(t);
  let raw = w.damage;
  if (w.bonus) for (const tag of tags) raw += (w.bonus as Record<string, number>)[tag] ?? 0;
  if (sim.isHover(t) && w.bonus?.Hover) raw += 0; // Hover tag already included in tags
  const atk = srcOwner >= 0 ? sim.players[srcOwner].attackLevel : 0;
  raw *= 1 + 0.06 * atk;
  raw *= mult;
  let dmg = Math.max(0.5, raw - sim.armorOf(t));
  const k = sim.kind[t];
  const to = sim.owner[t];
  const e = sim.ext[t];
  if (k === Kind.Unit) {
    if (to >= 0) dmg *= 1 - 0.05 * sim.players[to].armorLevel;
    if (e.curled) dmg *= 0.5;
    // Aegis Frame directional shield: blocks frontal projectile/ranged damage
    if (e.shield > 0 && w.kind !== 'melee') {
      const dx = fromX - sim.x[t], dy = fromY - sim.y[t];
      const l = Math.hypot(dx, dy) || 1;
      if ((dx * sim.fx[t] + dy * sim.fy[t]) / l > 0.35) {
        const ab = Math.min(e.shield, dmg);
        e.shield -= ab; dmg -= ab;
        sim.events.push({ type: 'impact', target: t, x: sim.x[t] + (dx / l) * 0.9, y: sim.y[t] + (dy / l) * 0.9, kind: 'shield' });
      }
    }
  }
  sim.hp[t] -= dmg;
  e.lastDamageTick = sim.tick;
  e.lastAttacker = src;
  if (to >= 0 && to !== srcOwner) {
    const p = sim.players[to];
    if (sim.tick - p.lastAttackAlert > 200 || Math.hypot(p.lastAttackX - sim.x[t], p.lastAttackY - sim.y[t]) > 30) {
      p.lastAttackAlert = sim.tick; p.lastAttackX = sim.x[t]; p.lastAttackY = sim.y[t];
      const isBase = k === Kind.Structure || (k === Kind.Unit && sim.udef(t).worker);
      sim.alert(to, 'attack', isBase ? 'Your base is under attack' : 'Your forces are under attack', sim.x[t], sim.y[t]);
    }
  }
  if (sim.hp[t] <= 0) sim.kill(t, srcOwner);
  return dmg;
}

function splash(sim: Sim, srcOwner: number, w: WeaponDef, x: number, y: number, r: number, primary: number, src: number) {
  const hits: number[] = [];
  sim.spatial.query(x, y, r + 3, (j) => {
    if (j === primary || !sim.alive[j] || sim.owner[j] === srcOwner || sim.owner[j] < 0) return;
    if (!canHit(sim, w, j)) return;
    const d = sim.kind[j] === Kind.Structure ? sim.pointToFootprint(j, x, y) : Math.max(0, Math.hypot(sim.x[j] - x, sim.y[j] - y) - sim.radius[j]);
    if (d <= r) hits.push(j);
  });
  hits.sort((a, b) => a - b);
  for (const j of hits) {
    const d = Math.hypot(sim.x[j] - x, sim.y[j] - y);
    dealDamage(sim, srcOwner, w, j, d < r * 0.5 ? 1 : 0.5, x, y, src);
  }
}

function fire(sim: Sim, id: number, t: number, w: WeaponDef) {
  const owner = sim.owner[id];
  const e = sim.ext[id];
  sim.cooldown[id] = w.period - w.windup;
  e.lastAttackTick = sim.tick;
  const x0 = sim.x[id] + sim.fx[id] * sim.radius[id] * 0.8, y0 = sim.y[id] + sim.fy[id] * sim.radius[id] * 0.8;
  if (w.kind === 'eruption') {
    sim.zones.push({ id: sim.tick * 16 + (id & 15), owner, kind: 'eruption', x: sim.x[t], y: sim.y[t], r: w.splash ?? 1.6, start: sim.tick + (w.eruptionDelay ?? 20), end: sim.tick + (w.eruptionDelay ?? 20) + 1, src: id, srcDef: sim.defName(id) });
    sim.events.push({ type: 'shot', id, target: t, owner, kind: w.kind, x: x0, y: y0, x2: sim.x[t], y2: sim.y[t], delay: w.eruptionDelay, radius: w.splash });
    return;
  }
  if (w.projectileSpeed) {
    const speed = w.projectileSpeed / 20;
    const tx = sim.x[t], ty = sim.y[t];
    const total = Math.hypot(tx - x0, ty - y0);
    sim.projectiles.push({
      id: sim.tick * 64 + (id % 64), owner, src: id, target: t, kind: w.kind, x0, y0, x: x0, y: y0, tx, ty, speed,
      homing: w.kind !== 'shell', traveled: 0, total, damage: w.damage, bonusSrcDef: sim.defName(id), splash: w.splash ?? 0,
      slow: w.slow ?? 0, slowTicks: w.slowTicks ?? 0, overpen: !!w.overpenetrate, arc: w.kind === 'shell',
    });
    sim.events.push({ type: 'shot', id, target: t, owner, kind: w.kind, x: x0, y: y0, x2: tx, y2: ty });
    return;
  }
  // instant hit (decorative tracer only)
  sim.events.push({ type: 'shot', id, target: t, owner, kind: w.kind, x: x0, y: y0, x2: sim.x[t], y2: sim.y[t] });
  const tx = sim.x[t], ty = sim.y[t];
  dealDamage(sim, owner, w, t, 1, sim.x[id], sim.y[id], id);
  if (w.splash) splash(sim, owner, w, tx, ty, w.splash, t, id);
  sim.events.push({ type: 'impact', target: t, x: tx, y: ty, kind: w.kind });
}

function weaponFor(_sim: Sim, def: string): WeaponDef | undefined {
  return UNITS[def]?.weapon ?? STRUCTURES[def]?.weapon ?? undefined;
}

export function updateCombat(sim: Sim) {
  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id]) continue;
    const k = sim.kind[id];
    if (k !== Kind.Unit && k !== Kind.Structure) continue;
    if (sim.cooldown[id] > 0) sim.cooldown[id]--;
    const w = sim.weaponOf(id);
    if (!w) continue;
    const e = sim.ext[id];
    if (sim.tick < e.silencedUntil) { e.windup = 0; continue; }
    let t = -1;
    if (k === Kind.Unit) {
      t = e.engage;
      if (e.curled || e.toggleTicks > 0) { e.windup = 0; continue; }
    } else {
      if (sim.owner[id] < 0) continue;
      // static defense: keep focus target or acquire
      const r = w.range;
      if (e.focusTarget > 0 && (!sim.alive[e.focusTarget] || sim.edgeDist(id, e.focusTarget) > r || !sim.isVisibleTo(sim.owner[id], e.focusTarget))) e.focusTarget = -1;
      if (e.focusTarget < 0 && (sim.tick + id) % 3 === 0) e.focusTarget = acquireTarget(sim, id, r);
      t = e.focusTarget;
    }
    if (t < 0 || !sim.alive[t]) { e.windup = 0; continue; }
    // face target (structures with cones keep their mount but rotate their head)
    const dx = sim.x[t] - sim.x[id], dy = sim.y[t] - sim.y[id];
    const l = Math.hypot(dx, dy) || 1;
    if (k === Kind.Unit) {
      sim.fx[id] += (dx / l - sim.fx[id]) * 0.5; sim.fy[id] += (dy / l - sim.fy[id]) * 0.5;
      const fl = Math.hypot(sim.fx[id], sim.fy[id]) || 1; sim.fx[id] /= fl; sim.fy[id] /= fl;
    } else { sim.fx[id] = dx / l; sim.fy[id] = dy / l; }
    const range = effectiveRange(sim, id, w) + 0.25;
    if (sim.edgeDist(id, t) > range) { e.windup = 0; continue; }
    if (w.minRange && sim.dist(id, t) < w.minRange) { e.windup = 0; continue; }
    if (w.setupTicks && k === Kind.Unit) {
      if (sim.moving[id]) { e.setup = 0; continue; }
      if (e.setup < w.setupTicks) {
        if (e.setup === 0) sim.events.push({ type: 'ability', id, owner: sim.owner[id], kind: 'setup', x: sim.x[id], y: sim.y[id] });
        e.setup++;
        continue;
      }
    }
    if (e.windup > 0) {
      if (--e.windup === 0) fire(sim, id, e.windupTarget > 0 && sim.alive[e.windupTarget] ? e.windupTarget : t, w);
      continue;
    }
    if (sim.cooldown[id] <= 0) {
      if (w.windup > 0) {
        e.windup = w.windup; e.windupTarget = t;
        sim.events.push({ type: 'windup', id, target: t, owner: sim.owner[id], kind: w.kind, x: sim.x[id], y: sim.y[id], duration: w.windup });
      } else fire(sim, id, t, w);
    }
  }
}

export function updateProjectiles(sim: Sim) {
  const keep = [];
  for (const pr of sim.projectiles) {
    if (pr.homing && pr.target > 0 && sim.alive[pr.target]) { pr.tx = sim.x[pr.target]; pr.ty = sim.y[pr.target]; }
    const dx = pr.tx - pr.x, dy = pr.ty - pr.y;
    const d = Math.hypot(dx, dy);
    if (d <= pr.speed) {
      pr.x = pr.tx; pr.y = pr.ty;
      const w = weaponFor(sim, pr.bonusSrcDef) ?? (sim.alive[pr.src] ? sim.weaponOf(pr.src) : undefined);
      if (w) {
        if (pr.homing) {
          if (pr.target > 0 && sim.alive[pr.target]) {
            const t = pr.target;
            dealDamage(sim, pr.owner, w, t, 1, pr.x0, pr.y0, pr.src);
            if (pr.slow && sim.alive[t] && sim.kind[t] === Kind.Unit) {
              const te = sim.ext[t];
              te.slowUntil = Math.max(te.slowUntil, sim.tick + pr.slowTicks); te.slowAmount = Math.max(pr.slow, te.slowUntil > sim.tick ? te.slowAmount : 0);
            }
            if (pr.overpen) {
              // overpenetrate one Light unit behind the target
              const ux = (pr.tx - pr.x0) / (pr.total || 1), uy = (pr.ty - pr.y0) / (pr.total || 1);
              let best = -1, bd = 1e9;
              sim.spatial.query(pr.tx, pr.ty, 3.5, (j) => {
                if (j === t || !sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] === pr.owner || sim.owner[j] < 0) return;
                if (!sim.udef(j).tags.includes('Light') || sim.isHover(j)) return;
                const ox = sim.x[j] - pr.tx, oy = sim.y[j] - pr.ty;
                const along = ox * ux + oy * uy, perp = Math.abs(ox * -uy + oy * ux);
                if (along > 0 && along < 3 && perp < 0.9 && along < bd) { bd = along; best = j; }
              });
              if (best > 0) {
                sim.events.push({ type: 'shot', id: pr.src, target: best, owner: pr.owner, kind: 'lance_pen', x: pr.tx, y: pr.ty, x2: sim.x[best], y2: sim.y[best] });
                dealDamage(sim, pr.owner, w, best, 0.5, pr.tx, pr.ty, pr.src);
              }
            }
          }
          if (pr.splash) splash(sim, pr.owner, w, pr.tx, pr.ty, pr.splash, pr.target, pr.src);
        } else {
          // ground-targeted shell: hits whatever stands at the impact point
          splash(sim, pr.owner, w, pr.tx, pr.ty, pr.splash || 0.8, -1, pr.src);
        }
      }
      sim.events.push({ type: 'impact', x: pr.tx, y: pr.ty, kind: pr.kind, radius: pr.splash, owner: pr.owner });
      continue;
    }
    pr.x += (dx / d) * pr.speed; pr.y += (dy / d) * pr.speed;
    pr.traveled += pr.speed;
    keep.push(pr);
  }
  sim.projectiles = keep;
}

export function updateEffects(sim: Sim) {
  const t = sim.tick;
  // zones
  const keep = [];
  for (const z of sim.zones) {
    if (t >= z.start && t < z.end) {
      if (z.kind === 'eruption' && t === z.start) {
        const w = weaponFor(sim, z.srcDef ?? '');
        if (w) splash(sim, z.owner, w, z.x, z.y, z.r, -1, z.src ?? -1);
        sim.events.push({ type: 'impact', x: z.x, y: z.y, kind: 'eruption', radius: z.r, owner: z.owner });
      } else if (z.kind === 'mend' || z.kind === 'silence') {
        sim.spatial.query(z.x, z.y, z.r + 1.5, (j) => {
          if (!sim.alive[j] || sim.kind[j] !== Kind.Unit) return;
          if (Math.hypot(sim.x[j] - z.x, sim.y[j] - z.y) > z.r + sim.radius[j] * 0.5) return;
          if (z.kind === 'mend' && sim.owner[j] === z.owner) sim.hp[j] = Math.min(sim.maxHp[j], sim.hp[j] + 0.5);
          if (z.kind === 'silence' && sim.owner[j] !== z.owner) { sim.ext[j].silencedUntil = t + 2; sim.ext[j].windup = 0; }
        });
      }
    }
    if (t < z.end) keep.push(z);
  }
  sim.zones = keep;

  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id]) continue;
    const k = sim.kind[id];
    const e = sim.ext[id];
    if (k === Kind.Spike) {
      if (t >= e.expires) sim.kill(id);
      continue;
    }
    if (e.regenTicks > 0) { e.regenTicks--; sim.hp[id] = Math.min(sim.maxHp[id], sim.hp[id] + e.regenPerTick); }
    const owner = sim.owner[id];
    if (owner < 0) continue;
    const fd = sim.players[owner].faction;
    if (k === Kind.Structure) {
      if (fd === 'verdant' && sim.built[id] && t - e.lastDamageTick > 100 && t % 20 === 0) sim.hp[id] = Math.min(sim.maxHp[id], sim.hp[id] + 1);
      continue;
    }
    if (k !== Kind.Unit) continue;
    const d = sim.udef(id);
    if (d.energyMax) e.energy = Math.min(d.energyMax, e.energy + (d.energyRegen ?? 0) / 20);
    if (e.slowUntil <= t) e.slowAmount = 0;
    const outOfCombat = t - e.lastDamageTick > 100;
    if (d.tags.includes('Biological') && fd === 'verdant' && t % 10 === 0 && sim.hp[id] < sim.maxHp[id]) {
      let r = outOfCombat ? 0.3 : 0;
      if (sim.inBuildZone(owner, sim.x[id], sim.y[id])) r += 1.0;
      sim.hp[id] = Math.min(sim.maxHp[id], sim.hp[id] + r);
    }
    if (d.id === 'aegis_frame' && outOfCombat) e.shield = Math.min(160, e.shield + 0.2);
    if (d.id === 'mender_rig' && t % 10 === (id % 10)) menderPulse(sim, id);
    if (d.id === 'crownbeast' && t % 20 === (id % 20)) crownAura(sim, id);
    if (d.id === 'thornling' && t % 10 === (id % 10)) thornlingFrenzy(sim, id);
  }
}

function menderPulse(sim: Sim, id: number) {
  const e = sim.ext[id];
  if (e.energy < 1 || sim.tick < e.silencedUntil) return;
  let best = -1, bestRatio = 0.999;
  sim.spatial.query(sim.x[id], sim.y[id], 6, (j) => {
    if (j === id || !sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] !== sim.owner[id]) return;
    if (!sim.udef(j).tags.includes('Mechanical')) return;
    if (Math.hypot(sim.x[j] - sim.x[id], sim.y[j] - sim.y[id]) > 5) return;
    const r = sim.hp[j] / sim.maxHp[j];
    if (r < bestRatio || (r === bestRatio && j < best)) { bestRatio = r; best = j; }
  });
  if (best < 0) return;
  sim.hp[best] = Math.min(sim.maxHp[best], sim.hp[best] + 3);
  e.energy -= 1;
  sim.events.push({ type: 'heal', id: best, target: id, owner: sim.owner[id], x: sim.x[best], y: sim.y[best], x2: sim.x[id], y2: sim.y[id], kind: 'mender' });
}

function crownAura(sim: Sim, id: number) {
  sim.spatial.query(sim.x[id], sim.y[id], 7, (j) => {
    if (!sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] !== sim.owner[id]) return;
    if (Math.hypot(sim.x[j] - sim.x[id], sim.y[j] - sim.y[id]) > 6) return;
    if (sim.tick - sim.ext[j].lastDamageTick < 80 || sim.tick - sim.ext[j].lastAttackTick < 80) return;
    if (sim.hp[j] < sim.maxHp[j]) {
      sim.hp[j] = Math.min(sim.maxHp[j], sim.hp[j] + 3);
      if (j !== id) sim.events.push({ type: 'heal', id: j, owner: sim.owner[id], x: sim.x[j], y: sim.y[j], kind: 'aura' });
    }
  });
}

function thornlingFrenzy(sim: Sim, id: number) {
  let found = false;
  sim.spatial.query(sim.x[id], sim.y[id], 6, (j) => {
    if (found || !sim.alive[j] || sim.owner[j] === sim.owner[id] || sim.owner[j] < 0) return;
    if (sim.kind[j] !== Kind.Unit && sim.kind[j] !== Kind.Structure) return;
    if (sim.hp[j] < sim.maxHp[j] * 0.7 && Math.hypot(sim.x[j] - sim.x[id], sim.y[j] - sim.y[id]) < 6 && sim.isVisibleTo(sim.owner[id], j)) found = true;
  });
  if (found) sim.ext[id].speedBoostUntil = sim.tick + 12;
}

export function updateNeutrals(sim: Sim) {
  // Watch Pylons: 3 s uncontested channel to capture; enemy presence contests (suppresses vision)
  for (const pid of sim.pylonIds) {
    const pe = sim.ext[pid];
    const present = [0, 0];
    const channel = [0, 0];
    sim.spatial.query(sim.x[pid], sim.y[pid], 5, (j) => {
      if (!sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] < 0) return;
      const d = Math.hypot(sim.x[j] - sim.x[pid], sim.y[j] - sim.y[pid]);
      if (d > 3.2) return;
      present[sim.owner[j]]++;
      const o = sim.ext[j].orders[0];
      if (o && o.t === 'capture' && o.target === pid) channel[sim.owner[j]]++;
    });
    pe.contested = pe.captureOwner >= 0 && present[1 - pe.captureOwner] > 0;
    let who = -1;
    if (channel[0] > 0 && present[1] === 0) who = 0;
    else if (channel[1] > 0 && present[0] === 0) who = 1;
    if (who >= 0 && who !== pe.captureOwner) {
      if (pe.captureBy !== who) { pe.captureBy = who; pe.captureProgress = 0; }
      pe.captureProgress++;
      if (pe.captureProgress >= 60) {
        const prev = pe.captureOwner;
        pe.captureOwner = who; pe.captureProgress = 0; pe.captureBy = -1; pe.contested = false;
        sim.events.push({ type: 'capture', id: pid, owner: who, x: sim.x[pid], y: sim.y[pid] });
        sim.alert(who, 'pylon', 'Watch Pylon captured', sim.x[pid], sim.y[pid]);
        if (prev >= 0) sim.alert(prev, 'pylon', 'Watch Pylon lost', sim.x[pid], sim.y[pid]);
        sim.addTimeline(who, 'Captured a Watch Pylon', 'map');
      }
    } else if (who < 0 && pe.captureProgress > 0) pe.captureProgress = Math.max(0, pe.captureProgress - 2);
  }
  // Salvage pods: one-time fixed bundle to the first unit that touches it
  for (const pid of sim.podIds) {
    if (!sim.alive[pid]) continue;
    let taker = -1;
    sim.spatial.query(sim.x[pid], sim.y[pid], 2, (j) => {
      if (taker >= 0 || !sim.alive[j] || sim.kind[j] !== Kind.Unit || sim.owner[j] < 0) return;
      if (Math.hypot(sim.x[j] - sim.x[pid], sim.y[j] - sim.y[pid]) < 1.4) taker = j;
    });
    if (taker >= 0) {
      const p = sim.players[sim.owner[taker]];
      p.ore += 100; p.flux += 40;
      p.stats.oreCollected += 100; p.stats.fluxCollected += 40;
      sim.events.push({ type: 'pod', id: pid, owner: p.id, x: sim.x[pid], y: sim.y[pid] });
      sim.alert(p.id, 'info', 'Salvage pod recovered: +100 Ore, +40 Flux', sim.x[pid], sim.y[pid]);
      sim.kill(pid);
    }
  }
}
