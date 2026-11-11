// Shared collision primitives used by the (local) authoritative simulation, bots and client queries.
// Body = vertical box (the "capsule" approximation), world = axis-aligned boxes + implicit ground plane at y = 0.
import type { Vec3 } from "../math";
import type { MapBox, MapData } from "../map/k17";

export const BODY_HALF = 0.3;
export const STEP_HEIGHT = 0.45;
export const EPS = 1e-4;

export interface RayHit {
  t: number;
  box: MapBox | null; // null = ground
  normal: Vec3;
  point: Vec3;
}

export interface SmokeVolume { x: number; y: number; z: number; r: number; until: number; rMax?: number }

export class CollisionWorld {
  readonly boxes: MapBox[];
  readonly map: MapData;
  smokes: SmokeVolume[] = [];
  /** Bumped when breakable geometry changes (glass) so caches can invalidate. */
  version = 0;
  private active: MapBox[];

  constructor(map: MapData) {
    this.map = map;
    this.boxes = map.boxes;
    this.active = this.boxes.filter((b) => b.alive);
  }

  breakBox(b: MapBox): void {
    if (!b.alive) return;
    b.alive = false;
    this.active = this.boxes.filter((x) => x.alive);
    this.version++;
  }
  reset(): void {
    for (const b of this.boxes) b.alive = true;
    this.active = this.boxes.filter((x) => x.alive);
    this.smokes = [];
    this.version++;
  }

  overlaps(px: number, py: number, pz: number, hw: number, h: number): MapBox | null {
    const x0 = px - hw + EPS, x1 = px + hw - EPS, y0 = py + EPS, y1 = py + h - EPS, z0 = pz - hw + EPS, z1 = pz + hw - EPS;
    for (const b of this.active) {
      if (x1 > b.min.x && x0 < b.max.x && y1 > b.min.y && y0 < b.max.y && z1 > b.min.z && z0 < b.max.z) return b;
    }
    return null;
  }
  blocked(px: number, py: number, pz: number, hw: number, h: number): boolean {
    return py < -EPS || this.overlaps(px, py, pz, hw, h) !== null;
  }

  /** Moves a body, resolving collisions axis-by-axis with step-up. Mutates pos/vel. Returns ground/collision flags. */
  moveBody(pos: Vec3, vel: Vec3, dt: number, hw: number, h: number, wasGround: boolean): { onGround: boolean; hitWall: boolean; landedSpeed: number } {
    let hitWall = false;
    let landedSpeed = 0;
    // horizontal axes
    for (const axis of ["x", "z"] as const) {
      const d = vel[axis] * dt;
      if (d === 0) continue;
      pos[axis] += d;
      let guard = 0;
      let b: MapBox | null;
      while ((b = this.overlaps(pos.x, pos.y, pos.z, hw, h)) && guard++ < 4) {
        const rise = b.max.y - pos.y;
        if (rise > EPS && rise <= STEP_HEIGHT + EPS && (wasGround || pos.y <= EPS) && !this.overlaps(pos.x, b.max.y, pos.z, hw, h)) {
          pos.y = b.max.y;
          continue;
        }
        if (axis === "x") pos.x = d > 0 ? b.min.x - hw - EPS : b.max.x + hw + EPS;
        else pos.z = d > 0 ? b.min.z - hw - EPS : b.max.z + hw + EPS;
        vel[axis] = 0;
        hitWall = true;
      }
    }
    // vertical
    let onGround = false;
    const dy = vel.y * dt;
    pos.y += dy;
    const b = this.overlaps(pos.x, pos.y, pos.z, hw, h);
    if (b) {
      if (dy <= 0) {
        pos.y = b.max.y;
        if (vel.y < 0) landedSpeed = -vel.y;
        vel.y = 0;
        onGround = true;
      } else {
        pos.y = b.min.y - h - EPS;
        vel.y = 0;
      }
    }
    if (pos.y <= 0) {
      if (vel.y < 0) landedSpeed = Math.max(landedSpeed, -vel.y);
      pos.y = 0;
      vel.y = Math.max(0, vel.y);
      onGround = true;
    }
    if (!onGround && vel.y <= 0 && this.blocked(pos.x, pos.y - 0.02, pos.z, hw, h) && pos.y - 0.02 >= 0) {
      // standing flush on top of a box
      onGround = true;
    }
    if (onGround && wasGround === false && dy < 0 && vel.y === 0) { /* landed */ }
    return { onGround, hitWall, landedSpeed };
  }

  /** Ray vs a single AABB; returns [tNear, tFar, normalAxis, sign] or null. */
  static rayBox(o: Vec3, d: Vec3, min: Vec3, max: Vec3): { t0: number; t1: number; nx: number; ny: number; nz: number } | null {
    let t0 = 0, t1 = Infinity;
    let nx = 0, ny = 0, nz = 0;
    // x
    if (Math.abs(d.x) < 1e-12) { if (o.x < min.x || o.x > max.x) return null; }
    else {
      let a = (min.x - o.x) / d.x, b = (max.x - o.x) / d.x, s = -1;
      if (a > b) { const t = a; a = b; b = t; s = 1; }
      if (a > t0) { t0 = a; nx = s; ny = 0; nz = 0; }
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    if (Math.abs(d.y) < 1e-12) { if (o.y < min.y || o.y > max.y) return null; }
    else {
      let a = (min.y - o.y) / d.y, b = (max.y - o.y) / d.y, s = -1;
      if (a > b) { const t = a; a = b; b = t; s = 1; }
      if (a > t0) { t0 = a; nx = 0; ny = s; nz = 0; }
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    if (Math.abs(d.z) < 1e-12) { if (o.z < min.z || o.z > max.z) return null; }
    else {
      let a = (min.z - o.z) / d.z, b = (max.z - o.z) / d.z, s = -1;
      if (a > b) { const t = a; a = b; b = t; s = 1; }
      if (a > t0) { t0 = a; nx = 0; ny = 0; nz = s; }
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    return { t0, t1, nx, ny, nz };
  }

  /** Nearest world hit along a ray. `bulletOnly` skips noRay boundary boxes. Ground plane y=0 included. */
  raycast(o: Vec3, d: Vec3, maxDist: number, bulletOnly = true, from = 0): RayHit | null {
    let best: RayHit | null = null;
    let bt = maxDist;
    for (const b of this.active) {
      if (bulletOnly && b.noRay) continue;
      const r = CollisionWorld.rayBox(o, d, b.min, b.max);
      if (!r) continue;
      const t = r.t0 > from ? r.t0 : (r.t1 > from ? from : -1);
      if (t < 0 || t > bt) continue;
      if (r.t0 <= from && r.t1 <= from) continue;
      bt = t;
      best = { t, box: b, normal: { x: -r.nx * 0 + r.nx, y: r.ny, z: r.nz }, point: { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t } };
    }
    if (d.y < -1e-9 && o.y > 0) {
      const t = -o.y / d.y;
      if (t > from && t < bt) {
        bt = t;
        best = { t, box: null, normal: { x: 0, y: 1, z: 0 }, point: { x: o.x + d.x * t, y: 0, z: o.z + d.z * t } };
      }
    }
    return best;
  }

  /** Whether the straight segment between two points is unobstructed by solid geometry (and optionally smoke). */
  lineClear(a: Vec3, b: Vec3, now = 0, thinPass = false): boolean {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return true;
    const d = { x: dx / len, y: dy / len, z: dz / len };
    for (const bx of this.active) {
      if (bx.noRay) continue;
      if (thinPass && bx.cost < 0.5 && bx.kind !== "cover") continue;
      const r = CollisionWorld.rayBox(a, d, bx.min, bx.max);
      if (r && r.t0 < len - 0.05 && r.t1 > 0) {
        if (bx.mat === "glass" && !thinPass) return false;
        return false;
      }
    }
    if (a.y > 0 && b.y < 0) return false;
    return !this.smokeBlocks(a, d, len, now);
  }

  smokeBlocks(o: Vec3, d: Vec3, len: number, now: number): boolean {
    for (const s of this.smokes) {
      if (s.until < now) continue;
      // closest approach of segment to centre
      const tx = s.x - o.x, ty = s.y - o.y, tz = s.z - o.z;
      const t = Math.max(0, Math.min(len, tx * d.x + ty * d.y + tz * d.z));
      const cx = o.x + d.x * t - s.x, cy = o.y + d.y * t - s.y, cz = o.z + d.z * t - s.z;
      // segment passes through the dense core: a sight line is blocked if it crosses > 55% of the radius
      if (cx * cx + cy * cy + cz * cz < (s.r * 0.78) * (s.r * 0.78)) {
        // ignore if both endpoints are outside and the path just grazes: handled by radius factor
        return true;
      }
    }
    return false;
  }

  inSmoke(p: Vec3, now: number): boolean {
    for (const s of this.smokes) {
      if (s.until < now) continue;
      const dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
      if (dx * dx + dy * dy + dz * dz < s.r * s.r) return true;
    }
    return false;
  }

  /** Mantle probe: returns end position if a legal ledge (0.6-1.35 m) is in front, else null. */
  findMantle(pos: Vec3, dirX: number, dirZ: number, hw: number, h: number): { end: Vec3; top: number } | null {
    const len = Math.hypot(dirX, dirZ);
    if (len < 1e-6) return null;
    const dx = dirX / len, dz = dirZ / len;
    const probe = { x: pos.x + dx * (hw + 0.35), z: pos.z + dz * (hw + 0.35) };
    let best: MapBox | null = null;
    for (const b of this.active) {
      if (probe.x > b.min.x && probe.x < b.max.x && probe.z > b.min.z && probe.z < b.max.z) {
        const rise = b.max.y - pos.y;
        if (rise >= 0.6 && rise <= 1.35 && b.min.y <= pos.y + 0.5) { best = b; break; }
      }
    }
    if (!best) return null;
    // destination: further into the ledge top
    const end = { x: pos.x + dx * (hw + 0.7), y: best.max.y, z: pos.z + dz * (hw + 0.7) };
    if (!(end.x > best.min.x && end.x < best.max.x && end.z > best.min.z && end.z < best.max.z)) {
      // try a shorter hop onto thin ledge
      end.x = probe.x; end.z = probe.z;
    }
    if (this.blocked(end.x, best.max.y + EPS, end.z, hw, h * 0.85)) return null;
    // clearance along the climb (head must not hit a low ceiling)
    if (this.blocked(pos.x, best.max.y + EPS, pos.z, hw, h * 0.85) && this.blocked(probe.x, best.max.y + EPS, probe.z, hw, h * 0.85)) return null;
    return { end, top: best.max.y };
  }
}
