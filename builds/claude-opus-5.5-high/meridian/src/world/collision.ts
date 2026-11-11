// Static collision world: spatial hash of axis-aligned boxes with height ranges,
// plus 2D SAT helpers for vehicle oriented boxes and 3D ray casts for weapons/vision/camera.
// Lightweight colliders only — render meshes are never used for collision.

import type { Collider } from "./district";

const HCELL = 8;

export interface RayHit { t: number; c: Collider; nx: number; ny: number; nz: number }

export class StaticWorld {
  readonly colliders: Collider[];
  private grid = new Map<number, number[]>();
  private stamp: Uint32Array;
  private stampId = 1;
  /** Dynamic blockers for line-of-sight only (smoke clouds): x,y,z,r */
  smoke: { x: number; y: number; z: number; r: number }[] = [];
  /** Dynamic blockers (locked mission doors). */
  blockers: Collider[] = [];

  private bounds: Collider[];
  constructor(colliders: Collider[]) {
    this.colliders = colliders;
    this.bounds = colliders.filter((c) => c.kind === "bound");
    this.stamp = new Uint32Array(colliders.length);
    colliders.forEach((c, idx) => {
      const gx0 = Math.floor(c.x0 / HCELL), gx1 = Math.floor(c.x1 / HCELL);
      const gz0 = Math.floor(c.z0 / HCELL), gz1 = Math.floor(c.z1 / HCELL);
      if (c.kind === "bound") return; // bounds handled separately
      for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
        const k = key(gx, gz);
        let arr = this.grid.get(k);
        if (!arr) this.grid.set(k, (arr = []));
        arr.push(idx);
      }
    });
  }

  query(x0: number, z0: number, x1: number, z1: number, out: Collider[] = []): Collider[] {
    out.length = 0;
    const id = ++this.stampId;
    const gx0 = Math.floor(x0 / HCELL), gx1 = Math.floor(x1 / HCELL);
    const gz0 = Math.floor(z0 / HCELL), gz1 = Math.floor(z1 / HCELL);
    for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
      const arr = this.grid.get(key(gx, gz));
      if (!arr) continue;
      for (const i of arr) {
        if (this.stamp[i] === id) continue;
        this.stamp[i] = id;
        const c = this.colliders[i];
        if (c.x1 < x0 || c.x0 > x1 || c.z1 < z0 || c.z0 > z1) continue;
        out.push(c);
      }
    }
    // world bounds (not hashed when huge) and dynamic blockers
    for (const c of this.bounds) if (!(c.x1 < x0 || c.x0 > x1 || c.z1 < z0 || c.z0 > z1)) out.push(c);
    for (const c of this.blockers) if (!(c.x1 < x0 || c.x0 > x1 || c.z1 < z0 || c.z0 > z1)) out.push(c);
    return out;
  }

  private tmp: Collider[] = [];

  /** Push a vertical capsule (as circle over [y0,y1]) out of boxes. */
  resolveCircle(x: number, z: number, r: number, y0: number, y1: number, ignoreBelowTop = 0): { x: number; z: number; hit: boolean; nx: number; nz: number } {
    let hit = false, nx = 0, nz = 0;
    for (let iter = 0; iter < 3; iter++) {
      const list = this.query(x - r, z - r, x + r, z + r, this.tmp);
      let moved = false;
      for (const c of list) {
        if (c.y1 <= y0 + ignoreBelowTop || c.y0 >= y1) continue;
        const px = Math.max(c.x0, Math.min(x, c.x1));
        const pz = Math.max(c.z0, Math.min(z, c.z1));
        let dx = x - px, dz = z - pz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          dx /= d; dz /= d;
          x = px + dx * r; z = pz + dz * r;
          nx = dx; nz = dz;
        } else {
          // center inside: push along smallest axis
          const l = x - c.x0, rr = c.x1 - x, b = z - c.z0, t = c.z1 - z;
          const m = Math.min(l, rr, b, t);
          if (m === l) { x = c.x0 - r; nx = -1; nz = 0; }
          else if (m === rr) { x = c.x1 + r; nx = 1; nz = 0; }
          else if (m === b) { z = c.z0 - r; nx = 0; nz = -1; }
          else { z = c.z1 + r; nx = 0; nz = 1; }
        }
        hit = true; moved = true;
      }
      if (!moved) break;
    }
    return { x, z, hit, nx, nz };
  }

  /** Highest collider top under a circle that is at or below maxY (for standing on crates/containers). */
  supportTop(x: number, z: number, r: number, maxY: number): number {
    let best = -Infinity;
    const list = this.query(x - r, z - r, x + r, z + r, this.tmp);
    for (const c of list) {
      if (c.kind === "bound") continue;
      if (c.y1 > maxY) continue;
      if (x + r * 0.5 < c.x0 || x - r * 0.5 > c.x1 || z + r * 0.5 < c.z0 || z - r * 0.5 > c.z1) continue;
      if (c.y1 > best) best = c.y1;
    }
    return best;
  }

  /** Find an obstacle in front of a character for vault/mantle. */
  ledgeAhead(x: number, z: number, dx: number, dz: number, footY: number, reach = 0.9): { c: Collider; top: number; depth: number } | null {
    for (const f of [0.45, 0.7, 1.0]) {
      const r = this.ledgeAt(x + dx * reach * f / 0.75, z + dz * reach * f / 0.75, dx, dz, footY);
      if (r) return r;
    }
    return null;
  }

  private ledgeAt(px: number, pz: number, dx: number, dz: number, footY: number): { c: Collider; top: number; depth: number } | null {
    const list = this.query(px - 0.2, pz - 0.2, px + 0.2, pz + 0.2, this.tmp);
    let best: { c: Collider; top: number; depth: number } | null = null;
    for (const c of list) {
      if (c.kind === "bound") continue;
      if (px < c.x0 || px > c.x1 || pz < c.z0 || pz > c.z1) continue;
      const rel = c.y1 - footY;
      if (rel < 0.3 || rel > 1.7) continue;
      // depth along movement direction
      const depth = Math.abs(dx) > Math.abs(dz) ? c.x1 - c.x0 : c.z1 - c.z0;
      if (!best || c.y1 > best.top) best = { c, top: c.y1, depth };
    }
    if (!best) return null;
    // ensure nothing tall is stacked on top within the column
    for (const c of list) {
      if (c === best.c || c.kind === "bound") continue;
      if (px < c.x0 || px > c.x1 || pz < c.z0 || pz > c.z1) continue;
      if (c.y0 < best.top + 1.6 && c.y1 > best.top + 0.05) return null;
    }
    return best;
  }

  /** 3D ray cast against boxes. Direction need not be normalized; t in units of direction length. */
  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, skipThin = false): RayHit | null {
    const ex = ox + dx * maxT, ez = oz + dz * maxT;
    const list = this.query(Math.min(ox, ex) - 0.1, Math.min(oz, ez) - 0.1, Math.max(ox, ex) + 0.1, Math.max(oz, ez) + 0.1, this.tmp);
    let best: RayHit | null = null;
    let bestT = maxT;
    for (const c of list) {
      if (skipThin && c.thin) continue;
      const h = rayBox(ox, oy, oz, dx, dy, dz, c.x0, c.y0, c.z0, c.x1, c.y1, c.z1, bestT);
      if (h && h.t < bestT) { bestT = h.t; best = { t: h.t, c, nx: h.nx, ny: h.ny, nz: h.nz }; }
    }
    return best;
  }

  /** Line of sight between two points; smoke clouds also block. */
  lineOfSight(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    if (this.raycast(ax, ay, az, dx, dy, dz, 0.999)) return false;
    for (const s of this.smoke) {
      // segment-sphere test
      const fx = ax - s.x, fy = ay - s.y, fz = az - s.z;
      const a = dx * dx + dy * dy + dz * dz;
      const b = 2 * (fx * dx + fy * dy + fz * dz);
      const c = fx * fx + fy * fy + fz * fz - s.r * s.r;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
      if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1)) return false;
    }
    return true;
  }
}

const key = (gx: number, gz: number) => (gx + 1000) * 4096 + (gz + 1000);

export function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number,
  x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, maxT: number) {
  let tmin = 0, tmax = maxT;
  let nx = 0, ny = 0, nz = 0;
  // x
  if (Math.abs(dx) < 1e-12) { if (ox < x0 || ox > x1) return null; }
  else {
    let t1 = (x0 - ox) / dx, t2 = (x1 - ox) / dx, n = -1;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
    if (t1 > tmin) { tmin = t1; nx = n; ny = 0; nz = 0; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-12) { if (oy < y0 || oy > y1) return null; }
  else {
    let t1 = (y0 - oy) / dy, t2 = (y1 - oy) / dy, n = -1;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
    if (t1 > tmin) { tmin = t1; nx = 0; ny = n; nz = 0; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (Math.abs(dz) < 1e-12) { if (oz < z0 || oz > z1) return null; }
  else {
    let t1 = (z0 - oz) / dz, t2 = (z1 - oz) / dz, n = -1;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
    if (t1 > tmin) { tmin = t1; nx = 0; ny = 0; nz = n; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (tmin <= 0 && nx === 0 && ny === 0 && nz === 0) return { t: 0, nx: 0, ny: 1, nz: 0 }; // origin inside
  return { t: tmin, nx, ny, nz };
}

/** Oriented rectangle for SAT: center, half extents along local axes; yaw like vehicles. */
export interface ORect { cx: number; cz: number; hw: number; hl: number; yaw: number }

export interface SatResult { nx: number; nz: number; depth: number; px: number; pz: number }

function corners(r: ORect, out: number[]) {
  const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
  const rx = fz, rz = -fx;
  let k = 0;
  for (const sl of [1, -1]) for (const sw of [1, -1]) {
    out[k++] = r.cx + fx * r.hl * sl + rx * r.hw * sw;
    out[k++] = r.cz + fz * r.hl * sl + rz * r.hw * sw;
  }
  return out;
}
const ca = new Array(8).fill(0), cb = new Array(8).fill(0);

function project(c: number[], ax: number, az: number) {
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < 8; i += 2) {
    const p = c[i] * ax + c[i + 1] * az;
    if (p < mn) mn = p; if (p > mx) mx = p;
  }
  return [mn, mx];
}

/** SAT between two oriented rectangles. Normal points from B to A (push A along +n). */
export function satORect(a: ORect, b: ORect): SatResult | null {
  corners(a, ca); corners(b, cb);
  const axes = [Math.sin(a.yaw), Math.cos(a.yaw), Math.cos(a.yaw), -Math.sin(a.yaw), Math.sin(b.yaw), Math.cos(b.yaw), Math.cos(b.yaw), -Math.sin(b.yaw)];
  let best = Infinity, bnx = 0, bnz = 0, bestIdx = 0;
  for (let i = 0; i < 8; i += 2) {
    const ax = axes[i], az = axes[i + 1];
    const [amin, amax] = project(ca, ax, az);
    const [bmin, bmax] = project(cb, ax, az);
    const o = Math.min(amax, bmax) - Math.max(amin, bmin);
    if (o <= 0) return null;
    if (o < best) {
      best = o; bestIdx = i;
      const dirSign = (a.cx - b.cx) * ax + (a.cz - b.cz) * az >= 0 ? 1 : -1;
      bnx = ax * dirSign; bnz = az * dirSign;
    }
  }
  // contact point: if axis from B, deepest corner of A along -n; else deepest corner of B along +n
  let px = 0, pz = 0;
  if (bestIdx >= 4) {
    let mn = Infinity;
    for (let i = 0; i < 8; i += 2) { const p = ca[i] * bnx + ca[i + 1] * bnz; if (p < mn) { mn = p; px = ca[i]; pz = ca[i + 1]; } }
  } else {
    let mx = -Infinity;
    for (let i = 0; i < 8; i += 2) { const p = cb[i] * bnx + cb[i + 1] * bnz; if (p > mx) { mx = p; px = cb[i]; pz = cb[i + 1]; } }
  }
  return { nx: bnx, nz: bnz, depth: best, px, pz };
}

export function satORectAabb(a: ORect, c: { x0: number; x1: number; z0: number; z1: number }): SatResult | null {
  return satORect(a, { cx: (c.x0 + c.x1) / 2, cz: (c.z0 + c.z1) / 2, hw: (c.x1 - c.x0) / 2, hl: (c.z1 - c.z0) / 2, yaw: 0 });
}

/** Circle vs oriented rect: returns normal from rect to circle. */
export function circleORect(x: number, z: number, r: number, o: ORect): SatResult | null {
  const fx = Math.sin(o.yaw), fz = Math.cos(o.yaw);
  const rx = fz, rz = -fx;
  const dx = x - o.cx, dz = z - o.cz;
  const lf = dx * fx + dz * fz, lr = dx * rx + dz * rz;
  const cf = Math.max(-o.hl, Math.min(o.hl, lf)), cr = Math.max(-o.hw, Math.min(o.hw, lr));
  const px = o.cx + fx * cf + rx * cr, pz = o.cz + fz * cf + rz * cr;
  let nx = x - px, nz = z - pz;
  const d = Math.hypot(nx, nz);
  if (d >= r) return null;
  if (d < 1e-6) {
    // inside: push out along nearest side
    const pf = o.hl - Math.abs(lf), pr = o.hw - Math.abs(lr);
    if (pf < pr) { nx = fx * Math.sign(lf || 1); nz = fz * Math.sign(lf || 1); return { nx, nz, depth: pf + r, px, pz }; }
    nx = rx * Math.sign(lr || 1); nz = rz * Math.sign(lr || 1);
    return { nx, nz, depth: pr + r, px, pz };
  }
  return { nx: nx / d, nz: nz / d, depth: r - d, px, pz };
}

/** Ray vs oriented box (vehicle) in 3D: box from y0..y1. */
export function rayORect(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, o: ORect, y0: number, y1: number, maxT: number) {
  // transform ray into local frame
  const fx = Math.sin(o.yaw), fz = Math.cos(o.yaw);
  const rx = fz, rz = -fx;
  const lx = (ox - o.cx) * rx + (oz - o.cz) * rz;
  const lz = (ox - o.cx) * fx + (oz - o.cz) * fz;
  const ldx = dx * rx + dz * rz, ldz = dx * fx + dz * fz;
  const h = rayBox(lx, oy, lz, ldx, dy, ldz, -o.hw, y0, -o.hl, o.hw, y1, o.hl, maxT);
  return h ? h.t : null;
}
