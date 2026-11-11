// Ballistics: hit zones, armour, falloff, wall penetration. Pure functions over poses so the server can
// evaluate them against rewound (lag-compensated) player poses and tests can reproduce them exactly.

import { HITBOX, MOVEMENT as M } from '../content/economy';
import type { WeaponDef } from '../content/weapons';
import { raycastAll } from './collision';
import { CEILING_Y, MATERIALS, MaterialId } from './map';
import { Vec3, clamp, lerp } from './math';
import type { HitZone } from './types';

export interface Pose {
  x: number; y: number; z: number;
  yaw: number;
  /** Quantised crouch 0, .25, .5, .75, 1. */
  crouchQ: number;
}

export interface BodyHit { t: number; zone: HitZone; point: Vec3 }

export function poseHeight(crouchQ: number): number { return lerp(M.standHeight, M.crouchHeight, crouchQ); }

const BODY_R = 0.3;

/** Ray vs the player's hitboxes: a head sphere on top of a body cylinder, zoned by height. */
export function rayVsPose(o: Vec3, d: Vec3, maxT: number, pose: Pose): BodyHit | null {
  const H = poseHeight(pose.crouchQ);
  const headR = HITBOX.headRadius;
  const headCy = pose.y + H - headR;

  let best: BodyHit | null = null;

  // head sphere
  {
    const ox = o.x - pose.x, oy = o.y - headCy, oz = o.z - pose.z;
    const b = ox * d.x + oy * d.y + oz * d.z;
    const c = ox * ox + oy * oy + oz * oz - headR * headR;
    const disc = b * b - c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      let t = -b - s;
      if (t < 0) t = -b + s;
      if (t >= 0 && t <= maxT) best = { t, zone: 'head', point: { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t } };
    }
  }

  // body cylinder (vertical), y in [pose.y, pose.y + H - 0.30]
  {
    const y0 = pose.y, y1 = pose.y + H - headR * 1.7;
    const ox = o.x - pose.x, oz = o.z - pose.z;
    const a = d.x * d.x + d.z * d.z;
    let tA = 0, tB = maxT;
    let ok = true;
    if (a < 1e-9) {
      if (ox * ox + oz * oz > BODY_R * BODY_R) ok = false;
    } else {
      const b = ox * d.x + oz * d.z;
      const c = ox * ox + oz * oz - BODY_R * BODY_R;
      const disc = b * b - a * c;
      if (disc < 0) ok = false; else {
        const s = Math.sqrt(disc);
        tA = (-b - s) / a;
        tB = (-b + s) / a;
      }
    }
    if (ok) {
      let ty0 = -Infinity, ty1 = Infinity;
      if (Math.abs(d.y) < 1e-9) { if (o.y < y0 || o.y > y1) ok = false; } else {
        let a0 = (y0 - o.y) / d.y, a1 = (y1 - o.y) / d.y;
        if (a0 > a1) { const s = a0; a0 = a1; a1 = s; }
        ty0 = a0; ty1 = a1;
      }
      if (ok) {
        const t = Math.max(tA, ty0, 0);
        const tEnd = Math.min(tB, ty1, maxT);
        if (t <= tEnd && (!best || t < best.t)) {
          const point = { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t };
          best = { t, zone: zoneFor(point, pose, H), point };
        }
      }
    }
  }
  return best;
}

function zoneFor(p: Vec3, pose: Pose, H: number): HitZone {
  const fy = (p.y - pose.y) / H;
  if (fy < 0.48) return 'leg';
  // lateral offset for arms
  const cosY = Math.cos(pose.yaw), sinY = Math.sin(pose.yaw);
  const lateral = (p.x - pose.x) * cosY + (p.z - pose.z) * -sinY;
  if (Math.abs(lateral) > 0.2 && fy < 0.86) return 'arm';
  if (fy < 0.66) return 'abdomen';
  return 'chest';
}

export function zoneMult(def: WeaponDef, zone: HitZone): number {
  switch (zone) {
    case 'head': return def.headMult;
    case 'chest': return def.chestMult;
    case 'abdomen': return def.abdomenMult;
    case 'arm': return def.armMult;
    case 'leg': return def.legMult;
  }
}

export interface ArmorState { armor: number; helmet: boolean }

export interface DamageResult {
  /** Health removed. */
  health: number;
  /** Armour points removed. */
  armorLoss: number;
  raw: number;
}

/** Armour absorbs the (1 - armorPen) fraction on covered zones; it degrades by half of what it absorbed. */
export function applyArmor(raw: number, def: WeaponDef, zone: HitZone, armor: ArmorState): DamageResult {
  const covered = zone === 'head' ? armor.helmet : zone === 'leg' ? false : armor.armor > 0;
  if (!covered) return { health: raw, armorLoss: 0, raw };
  const health = raw * def.armorPen;
  const absorbed = raw - health;
  const loss = zone === 'head' ? 0 : Math.min(armor.armor, absorbed * 0.5);
  return { health, armorLoss: loss, raw };
}

export function falloffMult(def: WeaponDef, dist: number): number {
  return Math.pow(def.falloff, dist / 10);
}

export interface TraceTarget { id: number; pose: Pose }

export interface TraceImpact { p: Vec3; n: Vec3; mat: MaterialId | 'ground' | 'player' | 'head' }

export interface TraceResult {
  end: Vec3;
  impacts: TraceImpact[];
  hit: null | { id: number; zone: HitZone; dist: number; penetrated: boolean; penMult: number; point: Vec3 };
}

/**
 * Trace one bullet. Walks the ray through map boxes spending the weapon's penetration budget, and returns the
 * first player hit before the bullet runs out of energy.
 */
export function traceBullet(o: Vec3, d: Vec3, range: number, def: WeaponDef, targets: TraceTarget[]): TraceResult {
  const boxHits = raycastAll(o, d, range);
  const budget = Math.max(0.0001, def.penetration);
  let used = 0;
  let tEnd = range;
  const segs: Array<{ t0: number; t1: number; used0: number; cost: number }> = [];
  const impacts: TraceImpact[] = [];
  let firstImpactLogged = false;

  for (const h of boxHits) {
    const mat = MATERIALS[h.box.mat];
    const thick = Math.max(0, h.t1 - h.t0);
    if (thick < 1e-4) continue;
    if (!firstImpactLogged) {
      firstImpactLogged = true;
      const p = { x: o.x + d.x * h.t0, y: o.y + d.y * h.t0, z: o.z + d.z * h.t0 };
      impacts.push({ p, n: faceNormal(p, h.box), mat: h.box.mat });
    }
    if (!isFinite(mat.cost)) { tEnd = h.t0; break; }
    const need = thick * mat.cost;
    if (def.penetration <= 0 || used + need >= budget) {
      // Bullet dies inside this obstacle.
      const frac = def.penetration <= 0 ? 0 : (budget - used) / need;
      tEnd = h.t0 + thick * clamp(frac, 0, 1);
      segs.push({ t0: h.t0, t1: tEnd, used0: used, cost: mat.cost });
      used = budget;
      break;
    }
    segs.push({ t0: h.t0, t1: h.t1, used0: used, cost: mat.cost });
    used += need;
  }

  // roof
  if (d.y > 1e-6) {
    const tc = (CEILING_Y - o.y) / d.y;
    if (tc > 0 && tc < tEnd) {
      tEnd = tc;
      impacts.push({ p: { x: o.x + d.x * tc, y: CEILING_Y, z: o.z + d.z * tc }, n: { x: 0, y: -1, z: 0 }, mat: 'concrete' });
    }
  }
  // ground plane
  if (d.y < -1e-6) {
    const tg = -o.y / d.y;
    if (tg > 0 && tg < tEnd) {
      tEnd = tg;
      const p = { x: o.x + d.x * tg, y: 0, z: o.z + d.z * tg };
      impacts.push({ p, n: { x: 0, y: 1, z: 0 }, mat: 'ground' });
    }
  }

  const usedAt = (t: number): number => {
    let u = 0;
    for (const s of segs) {
      if (t >= s.t1) u = s.used0 + (s.t1 - s.t0) * s.cost;
      else if (t > s.t0) { u = s.used0 + (t - s.t0) * s.cost; break; } else break;
    }
    return u;
  };

  let best: TraceResult['hit'] = null;
  for (const tg of targets) {
    const hit = rayVsPose(o, d, tEnd, tg.pose);
    if (!hit) continue;
    if (best && hit.t >= best.dist) continue;
    const u = usedAt(hit.t);
    const penMult = clamp(1 - u / budget, 0.05, 1);
    best = { id: tg.id, zone: hit.zone, dist: hit.t, penetrated: u > 0, penMult, point: hit.point };
  }
  let end = { x: o.x + d.x * tEnd, y: o.y + d.y * tEnd, z: o.z + d.z * tEnd };
  if (best) {
    end = best.point;
    impacts.push({ p: best.point, n: { x: -d.x, y: -d.y, z: -d.z }, mat: best.zone === 'head' ? 'head' : 'player' });
  }
  return { end, impacts, hit: best };
}

function faceNormal(p: Vec3, b: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }): Vec3 {
  const ds = [
    Math.abs(p.x - b.x0), Math.abs(p.x - b.x1),
    Math.abs(p.y - b.y0), Math.abs(p.y - b.y1),
    Math.abs(p.z - b.z0), Math.abs(p.z - b.z1),
  ];
  let mi = 0;
  for (let i = 1; i < 6; i++) if (ds[i] < ds[mi]) mi = i;
  return [
    { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 },
  ][mi];
}

/** Total damage a clean (no wall) hit deals before armour, including falloff. */
export function rawDamage(def: WeaponDef, zone: HitZone, dist: number, penMult = 1): number {
  return def.damage * zoneMult(def, zone) * falloffMult(def, dist) * penMult;
}
