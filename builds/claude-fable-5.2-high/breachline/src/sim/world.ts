// shared-simulation: static collision world built from map data. The same class (same primitives, same
// parameters) backs the authoritative room and the client's prediction, so both produce identical moves.
import type RAPIER from '@dimforge/rapier3d-compat';
import { MapDef, MatId, MATS, Solid } from '../content/mapTypes';
import { MOVE } from '../content/tuning';
import type { Rapier } from './physics';

const G_WORLD = ((0x0001 << 16) | 0xffff) >>> 0;
const G_BOUND = ((0x0004 << 16) | 0xffff) >>> 0;
const G_PROBE = ((0x0002 << 16) | 0x0005) >>> 0;
const Q_MOVE = ((0xffff << 16) | 0x0005) >>> 0;
const Q_RAY = ((0xffff << 16) | 0x0001) >>> 0;

export interface RayHit { t: number; nx: number; ny: number; nz: number; mat: MatId; solid: number }
export interface MoveResult { x: number; y: number; z: number; grounded: boolean }
export interface BulletWall { t: number; mat: MatId; nx: number; ny: number; nz: number; stopped: boolean; glass: number }
export interface BulletTrace { end: number; walls: BulletWall[] }

export type RayMode = 'bullet' | 'vision';

export class World {
  readonly map: MapDef;
  glassMask = 0;
  private R: Rapier;
  private w: RAPIER.World;
  private cc: RAPIER.KinematicCharacterController;
  private probeStand: RAPIER.Collider;
  private probeCrouch: RAPIER.Collider;
  private fitStand: RAPIER.Shape;
  private fitCrouch: RAPIER.Shape;
  private solidOf = new Map<number, number>();
  private glass: (RAPIER.Collider | null)[] = [];
  private ray: RAPIER.Ray;
  private tmpV = { x: 0, y: 0, z: 0 };
  private rot = { x: 0, y: 0, z: 0, w: 1 };
  private seePred: (c: RAPIER.Collider) => boolean;
  private excl = new Set<number>();
  private exclPred: (c: RAPIER.Collider) => boolean;
  readonly moveOut: MoveResult = { x: 0, y: 0, z: 0, grounded: false };
  readonly hit: RayHit = { t: 0, nx: 0, ny: 1, nz: 0, mat: 'ground', solid: -1 };

  constructor(R: Rapier, map: MapDef) {
    this.R = R;
    this.map = map;
    const w = (this.w = new R.World({ x: 0, y: 0, z: 0 }));
    map.solids.forEach((s, i) => {
      const c = this.addSolid(s);
      if (!c) return;
      this.solidOf.set(c.handle, i);
      if (s.glass !== undefined) this.glass[s.glass] = c;
    });
    const hs = MOVE.standH / 2 - MOVE.radius;
    const hc = MOVE.crouchH / 2 - MOVE.radius;
    this.probeStand = w.createCollider(R.ColliderDesc.capsule(hs, MOVE.radius).setCollisionGroups(G_PROBE).setTranslation(0, 500, 0));
    this.probeCrouch = w.createCollider(R.ColliderDesc.capsule(hc, MOVE.radius).setCollisionGroups(G_PROBE).setTranslation(0, 520, 0));
    this.fitStand = new R.Capsule(hs - 0.03, MOVE.radius - 0.02);
    this.fitCrouch = new R.Capsule(hc - 0.03, MOVE.radius - 0.02);
    const cc = (this.cc = w.createCharacterController(0.02));
    cc.enableAutostep(MOVE.stepH, 0.15, false);
    cc.enableSnapToGround(0.3);
    cc.setMaxSlopeClimbAngle((52 * Math.PI) / 180);
    cc.setMinSlopeSlideAngle((60 * Math.PI) / 180);
    cc.setApplyImpulsesToDynamicBodies(false);
    w.step();
    this.ray = new R.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    this.seePred = (c) => {
      const si = this.solidOf.get(c.handle);
      return si === undefined ? false : !MATS[this.map.solids[si].mat].see;
    };
    this.exclPred = (c) => !this.excl.has(c.handle);
  }

  private addSolid(s: Solid): RAPIER.Collider | null {
    const R = this.R;
    const cx = (s.min[0] + s.max[0]) / 2, cy = (s.min[1] + s.max[1]) / 2, cz = (s.min[2] + s.max[2]) / 2;
    const hx = (s.max[0] - s.min[0]) / 2, hy = (s.max[1] - s.min[1]) / 2, hz = (s.max[2] - s.min[2]) / 2;
    const groups = s.mat === 'boundary' ? G_BOUND : G_WORLD;
    let desc: RAPIER.ColliderDesc | null;
    if (s.kind === 'box') desc = R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(cx, cy, cz);
    else if (s.kind === 'cyl') desc = R.ColliderDesc.cylinder(hy, hx).setTranslation(cx, cy, cz);
    else {
      const [x0, y0, z0] = s.min, [x1, y1, z1] = s.max;
      const p: number[] = [x0, y0, z0, x1, y0, z0, x0, y0, z1, x1, y0, z1];
      switch (s.dir) {
        case 'x+': p.push(x1, y1, z0, x1, y1, z1); break;
        case 'x-': p.push(x0, y1, z0, x0, y1, z1); break;
        case 'z+': p.push(x0, y1, z1, x1, y1, z1); break;
        default: p.push(x0, y1, z0, x1, y1, z0); break;
      }
      desc = R.ColliderDesc.convexHull(new Float32Array(p));
    }
    if (!desc) return null;
    return this.w.createCollider(desc.setCollisionGroups(groups));
  }

  /** Kinematic capsule move. (px,py,pz) is the capsule bottom. Result is the actual translation. */
  move(px: number, py: number, pz: number, crouched: boolean, dx: number, dy: number, dz: number): MoveResult {
    const probe = crouched ? this.probeCrouch : this.probeStand;
    const half = (crouched ? MOVE.crouchH : MOVE.standH) / 2;
    const v = this.tmpV;
    v.x = px; v.y = py + half; v.z = pz;
    probe.setTranslation(v);
    v.x = dx; v.y = dy; v.z = dz;
    this.cc.computeColliderMovement(probe, v, undefined, Q_MOVE);
    const m = this.cc.computedMovement();
    const out = this.moveOut;
    out.x = m.x; out.y = m.y; out.z = m.z;
    out.grounded = this.cc.computedGrounded();
    return out;
  }

  /** True when a (slightly shrunk) capsule standing at the given feet position overlaps nothing. */
  fits(px: number, py: number, pz: number, crouched: boolean): boolean {
    const half = (crouched ? MOVE.crouchH : MOVE.standH) / 2;
    const v = this.tmpV;
    v.x = px; v.y = py + half + 0.05; v.z = pz;
    return this.w.intersectionWithShape(v, this.rot, crouched ? this.fitCrouch : this.fitStand, undefined, Q_MOVE) === null;
  }

  /** Closest hit along a ray, or null. 'vision' ignores see-through materials (glass, rails). Result object is reused. */
  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, mode: RayMode = 'bullet'): RayHit | null {
    const ray = this.ray;
    ray.origin.x = ox; ray.origin.y = oy; ray.origin.z = oz;
    ray.dir.x = dx; ray.dir.y = dy; ray.dir.z = dz;
    const h = this.w.castRayAndGetNormal(ray, max, true, undefined, Q_RAY, undefined, undefined, mode === 'vision' ? this.seePred : undefined);
    if (!h) return null;
    const si = this.solidOf.get(h.collider.handle) ?? -1;
    const out = this.hit;
    out.t = h.timeOfImpact;
    out.nx = h.normal.x; out.ny = h.normal.y; out.nz = h.normal.z;
    out.solid = si;
    out.mat = si >= 0 ? this.map.solids[si].mat : 'ground';
    return out;
  }

  /** True if nothing opaque lies between two points. */
  visible(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-4) return true;
    return this.raycast(ax, ay, az, dx / len, dy / len, dz / len, len - 0.02, 'vision') === null;
  }

  /** True if nothing at all (bullet-blocking) lies between two points. */
  clearLine(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-4) return true;
    return this.raycast(ax, ay, az, dx / len, dy / len, dz / len, len - 0.02, 'bullet') === null;
  }

  /**
   * Hitscan trace with material penetration. Thin tagged materials subtract penetration energy; structural
   * materials always stop the round. Returns every surface crossed so damage can be scaled per target distance.
   */
  traceBullet(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, energy: number): BulletTrace {
    const walls: BulletWall[] = [];
    this.excl.clear();
    const ray = this.ray;
    let end = max;
    for (let i = 0; i < 5; i++) {
      ray.origin.x = ox; ray.origin.y = oy; ray.origin.z = oz;
      ray.dir.x = dx; ray.dir.y = dy; ray.dir.z = dz;
      const h = this.w.castRayAndGetNormal(ray, max, true, undefined, Q_RAY, undefined, undefined, this.exclPred);
      if (!h) break;
      const si = this.solidOf.get(h.collider.handle) ?? -1;
      const solid = si >= 0 ? this.map.solids[si] : null;
      const mat: MatId = solid ? solid.mat : 'ground';
      const cost = MATS[mat].pen;
      const stopped = cost > energy;
      walls.push({ t: h.timeOfImpact, mat, nx: h.normal.x, ny: h.normal.y, nz: h.normal.z, stopped, glass: solid && solid.glass !== undefined ? solid.glass : -1 });
      if (stopped) { end = h.timeOfImpact; break; }
      energy -= cost;
      this.excl.add(h.collider.handle);
    }
    return { end, walls };
  }

  /** Open sky above a point (support-action validation and indoor counterplay). */
  skyOpen(x: number, y: number, z: number): boolean {
    return this.raycast(x, y + 0.3, z, 0, 1, 0, 60, 'bullet') === null;
  }

  breakGlass(id: number): boolean {
    const c = this.glass[id];
    if (!c) return false;
    this.solidOf.delete(c.handle);
    this.w.removeCollider(c, false);
    this.glass[id] = null;
    this.glassMask = (this.glassMask | (1 << id)) >>> 0;
    this.w.step();
    return true;
  }

  syncGlass(mask: number): number[] {
    const broken: number[] = [];
    for (let i = 0; i < this.map.glassCount; i++) {
      if (mask & (1 << i) && this.glass[i]) { this.breakGlass(i); broken.push(i); }
    }
    return broken;
  }

  dispose(): void {
    this.w.free();
  }
}
