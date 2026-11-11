import type { World, Collider } from './world';
import type { Vehicle } from './vehicle';
import { applyDamage } from './vehicle';
import { clamp, fwd } from '../core/math';

export interface Circle { x: number; z: number; r: number }

const mk = (): Circle[] => [{ x: 0, z: 0, r: 0 }, { x: 0, z: 0, r: 0 }, { x: 0, z: 0, r: 0 }];

export function vehicleCircles(v: Vehicle, out: Circle[] = mk()): Circle[] {
  const f = fwd(v.heading);
  const r = v.def.width * 0.5 + (v.def.kind === 'bike' ? 0.1 : 0);
  const half = v.def.length * 0.5 - r;
  for (let i = 0; i < 3; i++) {
    const o = (i - 1) * half;
    out[i].x = v.x + f.x * o;
    out[i].z = v.z + f.z * o;
    out[i].r = r;
  }
  return out;
}

/** Closest-point test of a circle against a collider. Returns penetration + normal (pointing out of the collider). */
export function circleVsCollider(x: number, z: number, r: number, c: Collider): { pen: number; nx: number; nz: number; px: number; pz: number } | null {
  if (c.shape === 'circle') {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const d = Math.hypot(dx, dz);
    const pen = r + c.r - d;
    if (pen <= 0) return null;
    const nx = d > 1e-6 ? dx / d : 1;
    const nz = d > 1e-6 ? dz / d : 0;
    return { pen, nx, nz, px: c.cx + nx * c.r, pz: c.cz + nz * c.r };
  }
  const qx = clamp(x, c.minX, c.maxX);
  const qz = clamp(z, c.minZ, c.maxZ);
  const dx = x - qx;
  const dz = z - qz;
  const d2 = dx * dx + dz * dz;
  if (d2 > r * r) return null;
  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return { pen: r - d, nx: dx / d, nz: dz / d, px: qx, pz: qz };
  }
  // centre inside the box: push out through the nearest face
  const l = x - c.minX;
  const rr = c.maxX - x;
  const b = z - c.minZ;
  const t = c.maxZ - z;
  const m = Math.min(l, rr, b, t);
  if (m === l) return { pen: r + l, nx: -1, nz: 0, px: c.minX, pz: z };
  if (m === rr) return { pen: r + rr, nx: 1, nz: 0, px: c.maxX, pz: z };
  if (m === b) return { pen: r + b, nx: 0, nz: -1, px: x, pz: c.minZ };
  return { pen: r + t, nx: 0, nz: 1, px: x, pz: c.maxZ };
}

/** Slide a character circle out of obstacles taller than the feet height. Mutates pos; returns last blocking collider. */
export function resolveHuman(world: World, pos: { x: number; z: number }, r: number, feetY: number, ignoreLow = false): Collider | null {
  let last: Collider | null = null;
  for (let iter = 0; iter < 3; iter++) {
    const list = world.query(pos.x - r - 0.1, pos.z - r - 0.1, pos.x + r + 0.1, pos.z + r + 0.1);
    let moved = false;
    for (const c of list) {
      if (c.h <= feetY + 0.05) continue;
      if (ignoreLow && c.tag === 'low') continue;
      if (c.breakable) continue; // bins/cones are shoved aside, not blocking
      const hit = circleVsCollider(pos.x, pos.z, r, c);
      if (!hit) continue;
      pos.x += hit.nx * hit.pen;
      pos.z += hit.nz * hit.pen;
      last = c;
      moved = true;
    }
    if (!moved) break;
  }
  return last;
}

export interface WorldImpact { speed: number; breakable: Collider[]; solid: boolean }

const cs = mk();

/** Resolve a vehicle against static colliders. Applies damage and returns the strongest impact. */
export function collideVehicleWorld(world: World, v: Vehicle): WorldImpact {
  const impact: WorldImpact = { speed: 0, breakable: [], solid: false };
  vehicleCircles(v, cs);
  const k2 = (v.def.length ** 2 + v.def.width ** 2) / 12;
  for (let iter = 0; iter < 2; iter++) {
    for (const c of cs) {
      const list = world.query(c.x - c.r - 0.2, c.z - c.r - 0.2, c.x + c.r + 0.2, c.z + c.r + 0.2);
      for (const col of list) {
        if (col.gone || col.h < 0.15) continue;
        const hit = circleVsCollider(c.x, c.z, c.r, col);
        if (!hit) continue;
        const spd = Math.hypot(v.vx, v.vz);
        if (col.breakable) {
          if (spd > 2.5) { col.gone = true; impact.breakable.push(col); v.vx *= 0.97; v.vz *= 0.97; applyDamage(v, 0.6); }
          continue;
        }
        v.x += hit.nx * hit.pen;
        v.z += hit.nz * hit.pen;
        c.x += hit.nx * hit.pen;
        c.z += hit.nz * hit.pen;
        const vn = v.vx * hit.nx + v.vz * hit.nz;
        if (vn < 0) {
          const e = 0.22;
          const dvx = -(1 + e) * vn * hit.nx;
          const dvz = -(1 + e) * vn * hit.nz;
          v.vx += dvx;
          v.vz += dvz;
          const tdot = v.vx * hit.nx + v.vz * hit.nz;
          v.vx -= (v.vx - tdot * hit.nx) * 0.12;
          v.vz -= (v.vz - tdot * hit.nz) * 0.12;
          const rx = hit.px - v.x;
          const rz = hit.pz - v.z;
          const dyaw = -((rx * dvz - rz * dvx) / k2);
          v.yawRate = clamp(v.yawRate + clamp(dyaw, -1.4, 1.4) * 0.6, -3, 3);
          const sp = -vn;
          if (sp > impact.speed) impact.speed = sp;
          impact.solid = true;
        }
      }
    }
  }
  if (impact.solid && impact.speed > 2.5) {
    applyDamage(v, Math.pow(impact.speed - 2, 1.7) * 0.55 * Math.pow(1380 / Math.max(300, v.def.mass), 0.15));
    if (v.cargo !== undefined) v.cargo = Math.max(0, v.cargo - (impact.speed - 2) * 2.2);
  }
  return impact;
}

const ca = mk();
const cb = mk();

/** Vehicle versus vehicle (3-circle capsules). Returns relative impact speed or 0. */
export function collideVehicles(a: Vehicle, b: Vehicle): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const reach = (a.def.length + b.def.length) * 0.5 + 0.4;
  if (dx * dx + dz * dz > reach * reach) return 0;
  vehicleCircles(a, ca);
  vehicleCircles(b, cb);
  let best = 0;
  let nx = 0;
  let nz = 0;
  let px = 0;
  let pz = 0;
  for (const p of ca) for (const q of cb) {
    const ddx = p.x - q.x;
    const ddz = p.z - q.z;
    const d = Math.hypot(ddx, ddz);
    const pen = p.r + q.r - d;
    if (pen > best) { best = pen; nx = d > 1e-6 ? ddx / d : 1; nz = d > 1e-6 ? ddz / d : 0; px = (p.x + q.x) / 2; pz = (p.z + q.z) / 2; }
  }
  if (best <= 0) return 0;
  // nx,nz points from b toward a
  const ima = a.owner === 'parked' && Math.hypot(a.vx, a.vz) < 0.1 ? 1 / (a.def.mass * 1.4) : 1 / a.def.mass;
  const imb = b.owner === 'parked' && Math.hypot(b.vx, b.vz) < 0.1 ? 1 / (b.def.mass * 1.4) : 1 / b.def.mass;
  const wa = ima / (ima + imb);
  const wb = imb / (ima + imb);
  a.x += nx * best * wa;
  a.z += nz * best * wa;
  b.x -= nx * best * wb;
  b.z -= nz * best * wb;
  const rvx = a.vx - b.vx;
  const rvz = a.vz - b.vz;
  const vn = rvx * nx + rvz * nz;
  if (vn >= 0) return 0;
  const e = 0.25;
  const j = (-(1 + e) * vn) / (ima + imb);
  a.vx += j * ima * nx;
  a.vz += j * ima * nz;
  b.vx -= j * imb * nx;
  b.vz -= j * imb * nz;
  const ka = (a.def.length ** 2 + a.def.width ** 2) / 12;
  const kb = (b.def.length ** 2 + b.def.width ** 2) / 12;
  a.yawRate = clamp(a.yawRate - (((px - a.x) * nz - (pz - a.z) * nx) * j * ima) / ka * 0.5, -3, 3);
  b.yawRate = clamp(b.yawRate + (((px - b.x) * nz - (pz - b.z) * nx) * j * imb) / kb * 0.5, -3, 3);
  const sp = -vn;
  if (sp > 2) {
    applyDamage(a, Math.pow(sp - 1.5, 1.6) * 0.5 * Math.sqrt(b.def.mass / a.def.mass));
    applyDamage(b, Math.pow(sp - 1.5, 1.6) * 0.5 * Math.sqrt(a.def.mass / b.def.mass));
    if (a.cargo !== undefined) a.cargo = Math.max(0, a.cargo - (sp - 1.5) * 2.5);
    if (b.cargo !== undefined) b.cargo = Math.max(0, b.cargo - (sp - 1.5) * 2.5);
  }
  return sp;
}
