// Ballistics: inaccuracy model, learnable recoil, hit zones, armor, falloff,
// penetration. Pure functions over explicit inputs so tests can fixture them.

import { WEAPONS, type WeaponDef } from '../content/weapons';
import { MATERIALS } from '../map/annex';
import type { GameMap } from '../map/runtime';
import { DEG, clamp, type Vec3 } from './math';
import { unitFromKey } from './rng';

export type Zone = 'head' | 'chest' | 'abdomen' | 'arm' | 'leg';

export const ZONE_MULT: Record<Zone, number> = { head: 0, chest: 1, abdomen: 1.25, arm: 1, leg: 0.75 };

export interface SpreadInput {
  speedH: number;
  onGround: boolean;
  crouchAmt: number;
  landPenalty: number;
  recoilIndex: number;
  scoped: boolean;
}

export function computeSpread(def: WeaponDef, s: SpreadInput): number {
  let base = def.spreadStand;
  if (def.scope) base = s.scoped ? def.scope.scopedSpread : def.spreadStand * def.scope.unscopedSpreadMult;
  if (s.onGround && s.crouchAmt > 0.9) base *= def.spreadCrouchMult;
  const range = Math.max(0.01, def.moveSpeed - def.accurateSpeed);
  const moveFrac = clamp((s.speedH - def.accurateSpeed) / range, 0, 1);
  let inacc = base + def.spreadMove * moveFrac;
  if (!s.onGround) inacc += def.spreadAir;
  inacc += s.landPenalty * def.spreadAir * 0.6;
  inacc += Math.min(def.spreadPerShotMax, def.spreadPerShot * s.recoilIndex);
  return inacc;
}

/** Cumulative recoil offset (radians) at a fractional pattern index. */
export function recoilOffset(def: WeaponDef, index: number): { yaw: number; pitch: number } {
  const n = def.recoil.length;
  let yaw = 0;
  let pitch = 0;
  const whole = Math.floor(index);
  for (let i = 0; i < Math.min(whole, n); i++) {
    yaw += def.recoil[i][0];
    pitch += def.recoil[i][1];
  }
  if (whole < n) {
    const f = index - whole;
    yaw += def.recoil[whole][0] * f;
    pitch += def.recoil[whole][1] * f;
  }
  // past the authored path: hold the last direction, slight wander
  if (index > n) {
    const extra = index - n;
    const last = def.recoil[n - 1];
    yaw += last[0] * extra * 0.5;
  }
  return { yaw: yaw * DEG, pitch: -pitch * DEG };
}

/** Seeded per-shot deviation in yaw/pitch radians. */
export function shotDeviation(seed: number, shooter: number, shot: number, pellet: number, inacc: number, jitterDeg: number): { dyaw: number; dpitch: number } {
  const a = unitFromKey(seed, shooter, shot, pellet, 1) * Math.PI * 2;
  const r = unitFromKey(seed, shooter, shot, pellet, 2) * inacc;
  const j1 = (unitFromKey(seed, shooter, shot, pellet, 3) - 0.5) * jitterDeg * DEG;
  const j2 = (unitFromKey(seed, shooter, shot, pellet, 4) - 0.5) * jitterDeg * DEG;
  return { dyaw: Math.cos(a) * r + j1, dpitch: Math.sin(a) * r + j2 };
}

export interface HitboxPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  crouch: number;
}

interface LocalBox {
  zone: Zone;
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
}

/** Hit zones in player-local space (x right, z forward), heights for standing. */
const STAND_BOXES: LocalBox[] = [
  { zone: 'head', cx: 0, cy: 1.63, cz: 0.02, hx: 0.12, hy: 0.13, hz: 0.13 },
  { zone: 'chest', cx: 0, cy: 1.33, cz: 0, hx: 0.22, hy: 0.16, hz: 0.14 },
  { zone: 'abdomen', cx: 0, cy: 1.04, cz: 0, hx: 0.2, hy: 0.13, hz: 0.13 },
  { zone: 'arm', cx: 0.3, cy: 1.22, cz: 0.1, hx: 0.07, hy: 0.24, hz: 0.1 },
  { zone: 'arm', cx: -0.3, cy: 1.22, cz: 0.1, hx: 0.07, hy: 0.24, hz: 0.1 },
  { zone: 'leg', cx: 0, cy: 0.455, cz: 0, hx: 0.2, hy: 0.455, hz: 0.13 },
];

export const HITBOX_RADIUS = 0.45;

export function crouchScale(crouch: number): number {
  return 1 + (1.25 / 1.8 - 1) * crouch;
}

export interface BodyHit {
  t: number;
  zone: Zone;
}

/** Ray vs a player's zone boxes. dir normalized. */
export function rayHitboxes(o: Vec3, d: Vec3, pose: HitboxPose, maxT: number): BodyHit | null {
  const s = crouchScale(pose.crouch);
  const top = 1.8 * s;
  // coarse cylinder-ish AABB reject
  const bx = { minX: pose.x - HITBOX_RADIUS, maxX: pose.x + HITBOX_RADIUS, minY: pose.y, maxY: pose.y + top + 0.05, minZ: pose.z - HITBOX_RADIUS, maxZ: pose.z + HITBOX_RADIUS };
  if (!slab(o.x - bx.minX, o.y - bx.minY, o.z - bx.minZ, d.x, d.y, d.z, bx.maxX - bx.minX, bx.maxY - bx.minY, bx.maxZ - bx.minZ, maxT)) return null;
  // transform to local frame
  const sy = Math.sin(pose.yaw);
  const cy = Math.cos(pose.yaw);
  const rx = o.x - pose.x;
  const rz = o.z - pose.z;
  const lox = rx * cy - rz * sy;
  const loz = rx * sy + rz * cy;
  const loy = o.y - pose.y;
  const ldx = d.x * cy - d.z * sy;
  const ldz = d.x * sy + d.z * cy;
  const ldy = d.y;
  let best: BodyHit | null = null;
  let bestT = maxT;
  for (const b of STAND_BOXES) {
    const cyS = b.cy * s;
    const hyS = b.zone === 'head' ? b.hy : b.hy * s;
    const minx = b.cx - b.hx;
    const miny = cyS - hyS;
    const minz = b.cz - b.hz;
    const t = slab(lox - minx, loy - miny, loz - minz, ldx, ldy, ldz, b.hx * 2, hyS * 2, b.hz * 2, bestT);
    if (t !== null && t < bestT) {
      bestT = t;
      best = { t, zone: b.zone };
    }
  }
  return best;
}

/** slab test of ray (origin relative to box min) against box [0,size]. */
function slab(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, sx: number, sy: number, sz: number, maxT: number): number | null {
  let tmin = 0;
  let tmax = maxT;
  const o = [ox, oy, oz];
  const d = [dx, dy, dz];
  const s = [sx, sy, sz];
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-12) {
      if (o[a] < 0 || o[a] > s[a]) return null;
      continue;
    }
    let t1 = -o[a] / d[a];
    let t2 = (s[a] - o[a]) / d[a];
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return tmin;
}

export interface DamageResult {
  health: number;
  armorLoss: number;
  armored: boolean;
}

/** Health/armor damage for a hit. distance in metres, powerMul from penetration. */
export function computeDamage(
  def: WeaponDef,
  zone: Zone,
  distance: number,
  powerMul: number,
  armor: number,
  helmet: boolean,
): DamageResult {
  const zoneMult = zone === 'head' ? def.headMult : ZONE_MULT[zone];
  const falloff = Math.pow(def.rangeMod, distance / 10);
  const raw = def.damage * zoneMult * falloff * powerMul;
  const armored = armor > 0 && (zone === 'head' ? helmet : zone !== 'leg');
  if (!armored) return { health: Math.max(1, Math.round(raw)), armorLoss: 0, armored: false };
  let hp = raw * def.armorPen;
  let armorLoss = (raw - hp) * 0.5;
  if (armorLoss > armor) {
    hp += (armorLoss - armor) * 2;
    armorLoss = armor;
  }
  return { health: Math.max(1, Math.round(hp)), armorLoss: Math.round(armorLoss), armored: true };
}

export interface PenSegment {
  /** start distance of the segment along the ray */
  from: number;
  to: number;
  powerMul: number;
  /** world hit that ended the segment, if any */
  hitBox: number;
  hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number; tExit: number } | null;
}

/**
 * Walk a bullet through the static world, returning open-air segments with the
 * power multiplier that applies inside each. Stops at impenetrable surfaces.
 */
export function traceWorld(map: GameMap, o: Vec3, d: Vec3, range: number, penetration: number): PenSegment[] {
  const segs: PenSegment[] = [];
  let power = penetration;
  let mul = 1;
  let start = 0;
  let origin = { ...o };
  let ignore = -1;
  for (let i = 0; i < 5; i++) {
    const hit = map.raycast(origin, d, range - start, false, ignore);
    if (!hit) {
      segs.push({ from: start, to: range, powerMul: mul, hitBox: -1, hit: null });
      break;
    }
    segs.push({ from: start, to: start + hit.t, powerMul: mul, hitBox: hit.box, hit: { x: hit.x, y: hit.y, z: hit.z, nx: hit.nx, ny: hit.ny, nz: hit.nz, tExit: hit.tExit } });
    const mat = MATERIALS[map.boxes[hit.box].mat];
    if (!mat.penetrable || penetration <= 0) break;
    const thickness = Math.max(0.02, hit.tExit - hit.t);
    const cost = thickness * mat.penCost;
    if (cost >= power) break;
    power -= cost;
    mul *= clamp(1 - (cost / penetration) * 0.75, 0.15, 1) * 0.92;
    start += hit.tExit + 0.002;
    origin = { x: o.x + d.x * start, y: o.y + d.y * start, z: o.z + d.z * start };
    ignore = hit.box;
  }
  return segs;
}

export const weaponDef = (id: keyof typeof WEAPONS): WeaponDef => WEAPONS[id];
