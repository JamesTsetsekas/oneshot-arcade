import { clamp, rayCircle } from '../core/math';
import type { Game } from './game';
import type { Human } from './types';
import type { Vehicle } from './vehicle';
import { applyDamage } from './vehicle';
import { vehicleCircles } from './collision';
import { WEAPONS, falloff } from './weapons';
import type { WeaponDef } from './weapons';

export interface ShotHit {
  kind: 'none' | 'world' | 'human' | 'vehicle';
  t: number;                 // xz distance
  x: number; y: number; z: number;
  human?: Human;
  vehicle?: Vehicle;
  head?: boolean;
  limb?: boolean;
  thin?: boolean;
}

const HUMAN_R = 0.38;
export const HUMAN_H = 1.8;

/** Hitscan trace against static world, humans and vehicles. Direction is (dx,dy,dz) unit. */
export function traceShot(g: Game, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, range: number, ignore?: Human, ignoreVeh?: number): ShotHit {
  const lxz = Math.hypot(dx, dz) || 1e-6;
  const ux = dx / lxz;
  const uz = dz / lxz;
  const slope = dy / lxz;
  const maxT = range * lxz;
  let best: ShotHit = { kind: 'none', t: maxT, x: ox + ux * maxT, y: oy + slope * maxT, z: oz + uz * maxT };
  const w = g.world.raycast(ox, oz, ux, uz, maxT, oy, slope, 0);
  if (w) best = { kind: 'world', t: w.t, x: ox + ux * w.t, y: oy + slope * w.t, z: oz + uz * w.t, thin: w.c.tag === 'stall' || w.c.tag === 'prop' };
  if (best.kind === 'none' && oy + slope * maxT < 0) {
    const tg = oy / -slope;
    if (slope < 0 && tg > 0 && tg < maxT) best = { kind: 'world', t: tg, x: ox + ux * tg, y: 0, z: oz + uz * tg };
  }
  for (const h of g.humans) {
    if (h === ignore || !h.alive || h.vehicleId !== null || h.state === 'Spawn') continue;
    if (Math.abs(h.x - ox) > maxT + 1 || Math.abs(h.z - oz) > maxT + 1) continue;
    const t = rayCircle(ox, oz, ux, uz, h.x, h.z, HUMAN_R, best.t);
    if (t < 0 || t >= best.t) continue;
    const y = oy + slope * t;
    const top = h.y + (h.crouch ? 1.3 : HUMAN_H);
    if (y < h.y - 0.05 || y > top) continue;
    best = { kind: 'human', t, x: ox + ux * t, y, z: oz + uz * t, human: h, head: y > top - 0.3, limb: y < h.y + 0.8 };
  }
  const p = g.player.human;
  if (p !== ignore && p.alive && p.vehicleId === null) {
    const t = rayCircle(ox, oz, ux, uz, p.x, p.z, HUMAN_R, best.t);
    if (t >= 0 && t < best.t) {
      const y = oy + slope * t;
      if (y >= p.y - 0.05 && y <= p.y + HUMAN_H) best = { kind: 'human', t, x: ox + ux * t, y, z: oz + uz * t, human: p, head: y > p.y + HUMAN_H - 0.3, limb: y < p.y + 0.8 };
    }
  }
  for (const v of g.vehicles) {
    if (!v.alive || v.id === ignoreVeh) continue;
    if (Math.abs(v.x - ox) > maxT + 6 || Math.abs(v.z - oz) > maxT + 6) continue;
    for (const c of vehicleCircles(v)) {
      const t = rayCircle(ox, oz, ux, uz, c.x, c.z, c.r, best.t);
      if (t < 0 || t >= best.t) continue;
      const y = oy + slope * t;
      if (y < 0.1 || y > v.def.height) continue;
      best = { kind: 'vehicle', t, x: ox + ux * t, y, z: oz + uz * t, vehicle: v };
    }
  }
  return best;
}

export interface DamageOpts { lethal: boolean; source: 'player' | 'police' | 'guard' | 'rival' | 'vehicle' | 'env'; head?: boolean; stunSeconds?: number }

/** Apply damage to a human. Returns true when the target went down. */
export function damageHuman(g: Game, h: Human, amount: number, o: DamageOpts): boolean {
  if (!h.alive || h.state === 'Dead') return false;
  if (h.kind === 'player') return damagePlayer(g, amount, o);
  let dmg = amount * (o.head ? 2.2 : 1);
  if (h.armor > 0) { const a = Math.min(h.armor, dmg * 0.5); h.armor -= a; dmg -= a * 0.6; }
  h.hp -= dmg;
  h.harmed = true;
  g.peds.onHarmed(g, h, o.source);
  if (o.stunSeconds) {
    h.koUntil = g.t + o.stunSeconds;
    h.state = 'Down';
    h.stateT = 0;
    return true;
  }
  if (h.hp <= 0) {
    if (o.lethal) {
      h.alive = false;
      h.state = 'Dead';
      h.stateT = 0;
      g.player.stats.kills += o.source === 'player' ? 1 : 0;
    } else {
      h.hp = 18;
      h.koUntil = g.t + 14;
      h.state = 'Down';
      h.stateT = 0;
    }
    return true;
  }
  return false;
}

function damagePlayer(g: Game, amount: number, o: DamageOpts): boolean {
  const P = g.player;
  const h = P.human;
  if (!h.alive || g.invulnerable) return false;
  let dmg = amount;
  if (h.armor > 0) { const a = Math.min(h.armor, dmg * 0.6); h.armor -= a; dmg -= a * 0.7; }
  h.hp -= dmg;
  P.lastDamageT = g.t;
  g.cam.shake = Math.max(g.cam.shake, 0.4);
  g.damageFlash = Math.min(1, g.damageFlash + dmg / 40);
  if (h.hp <= 0) {
    h.hp = 0;
    g.onPlayerDown(o.source === 'police' ? 'Taken down by officers' : o.source === 'vehicle' ? 'Hit by a vehicle' : 'Badly wounded');
    return true;
  }
  return false;
}

/** The player's currently equipped weapon def, or null when holstered. */
export function equipped(g: Game): WeaponDef | null {
  const P = g.player;
  if (P.holstered) return null;
  const id = P.slot === 0 ? P.inv.melee : P.slot === 1 ? P.inv.sidearm : P.inv.longGun;
  return id ? WEAPONS[id] : null;
}

/** Fire the player's equipped ranged weapon at the aim point. */
export function playerFire(g: Game, w: WeaponDef): void {
  const P = g.player;
  const h = P.human;
  const mag = P.inv.mags[w.id] ?? 0;
  P.inv.mags[w.id] = mag - 1;
  P.fireCd = 60 / w.rpm;
  // muzzle: chest height, offset toward the shoulder side
  const cr = Math.cos(P.camYaw);
  const sr = -Math.sin(P.camYaw);
  const mx = h.x + Math.sin(h.heading) * 0.5 + cr * 0.25 * P.shoulder * 0.0;
  const mz = h.z + Math.cos(h.heading) * 0.5;
  void sr;
  const my = h.y + (h.crouch ? 1.0 : 1.38);
  const ap = P.aimPoint;
  let dx = ap.x - mx;
  let dy = ap.y - my;
  let dz = ap.z - mz;
  const dl = Math.hypot(dx, dy, dz) || 1;
  dx /= dl; dy /= dl; dz /= dl;
  const moving = Math.hypot(h.vx, h.vz) / 6;
  const spread = w.spread * (P.aiming ? 0.55 : 1) * (1 + P.spread) + w.moveSpread * moving * (P.aiming ? 0.6 : 1) * (h.crouch ? 0.6 : 1);
  P.spread = clamp(P.spread + 0.35, 0, 2.2);
  g.playerRecoil = w.recoil;
  g.emit({ type: 'gunshot', x: h.x, z: h.z, weapon: w.id, byPlayer: true });
  g.noise(h.x, h.z, w.noise, 'gunfire', true);
  g.police.crime('gunfire', h.x, h.z, w.lethal ? 1.4 : 0.8, { byPlayer: true, noise: true });
  const pellets = Math.max(1, w.pellets);
  for (let i = 0; i < pellets; i++) {
    const sx = (Math.random() - 0.5) * 2 * spread;
    const sy = (Math.random() - 0.5) * 2 * spread;
    const rx = dx + (Math.cos(h.heading) * sx);
    const rz = dz + (-Math.sin(h.heading) * sx);
    const ry = dy + sy;
    const l = Math.hypot(rx, ry, rz);
    resolveShot(g, h, w, mx, my, mz, rx / l, ry / l, rz / l);
  }
}

/** Shared bullet resolution for the player and AI shooters. */
export function resolveShot(g: Game, shooter: Human, w: WeaponDef, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): void {
  const src: DamageOpts['source'] = shooter.kind === 'player' ? 'player' : shooter.kind === 'police' ? 'police' : shooter.kind === 'guard' ? 'guard' : 'rival';
  const hit = traceShot(g, ox, oy, oz, dx, dy, dz, w.range * 1.4, shooter);
  const dist3 = hit.t / (Math.hypot(dx, dz) || 1);
  g.emit({ type: 'tracer', x0: ox, y0: oy, z0: oz, x1: hit.x, y1: hit.y, z1: hit.z });
  if (hit.kind === 'human' && hit.human) {
    const target = hit.human;
    const dmg = w.damage * falloff(w, dist3) * (hit.limb ? 0.8 : 1);
    g.emit({ type: 'impact', x: hit.x, y: hit.y, z: hit.z, material: 'flesh' });
    const wasAlive = target.alive && target.state !== 'Down';
    if (w.id === 'stun') damageHuman(g, target, 0, { lethal: false, source: src, stunSeconds: 6 });
    else damageHuman(g, target, dmg, { lethal: w.lethal, source: src, head: hit.head && w.lethal });
    if (shooter.kind === 'player' && target.kind === 'ped') {
      g.police.crime('assault', target.x, target.z, 1.2, { byPlayer: true, victim: target.id });
      if (!target.alive && wasAlive) g.player.stats.civilianHarm += 2; else g.player.stats.civilianHarm += 1;
    } else if (shooter.kind === 'player' && (target.kind === 'police' || target.kind === 'guard')) {
      if (target.kind === 'police') g.police.crime('attack-police', target.x, target.z, 2.5, { byPlayer: true, victim: target.id });
    }
  } else if (hit.kind === 'vehicle' && hit.vehicle) {
    const v = hit.vehicle;
    g.emit({ type: 'impact', x: hit.x, y: hit.y, z: hit.z, material: 'metal' });
    applyDamage(v, w.damage * 0.22 * falloff(w, dist3) * (w.pellets > 1 ? 1 : 1));
    if (hit.y < 0.7) v.tireDamage = clamp(v.tireDamage + w.damage * 0.003, 0, 0.8);
    g.onVehicleShot(v, shooter);
    if (shooter.kind === 'player' && v.owner !== 'police' && v.driverId !== null && v.driverId > 0) g.police.crime('assault', v.x, v.z, 0.8, { byPlayer: true });
  } else if (hit.kind === 'world') {
    g.emit({ type: 'impact', x: hit.x, y: hit.y, z: hit.z, material: hit.y < 0.05 ? 'concrete' : 'concrete' });
  }
}

/** Melee strike: nearest target in a forward cone. */
export function playerMelee(g: Game): boolean {
  const P = g.player;
  const h = P.human;
  const baton = WEAPONS[P.inv.melee];
  P.fireCd = 0.5;
  g.meleeSwingT = 0.25;
  let best: Human | null = null;
  let bd = baton.range + 0.4;
  for (const t of g.humans) {
    if (!t.alive || t.state === 'Down' || t.vehicleId !== null) continue;
    const dx = t.x - h.x;
    const dz = t.z - h.z;
    const d = Math.hypot(dx, dz);
    if (d > bd) continue;
    const ang = Math.abs(((Math.atan2(dx, dz) - h.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (ang > 1.0) continue;
    best = t;
    bd = d;
  }
  g.noise(h.x, h.z, baton.noise, 'melee', true);
  if (!best) return false;
  g.emit({ type: 'impact', x: best.x, y: 1.2, z: best.z, material: 'flesh' });
  damageHuman(g, best, baton.damage * 1.2, { lethal: false, source: 'player' });
  if (best.kind === 'ped') {
    g.police.crime('assault', best.x, best.z, 1.0, { byPlayer: true, victim: best.id });
    g.player.stats.civilianHarm += 1;
  } else if (best.kind === 'police') {
    g.police.crime('attack-police', best.x, best.z, 2.5, { byPlayer: true, victim: best.id });
  }
  return true;
}
