// Rapier world for South Quay: heightfield terrain, simplified static colliders (never render meshes),
// collision groups and the ray queries used by vehicles, characters, weapons and perception.
import RAPIER from '@dimforge/rapier3d-compat';
import { terrainH, decks, CURB } from '../world/district';
import { buildings, parts, blockers, generateLots, DynKind } from '../world/lots';
import { quatFromYaw } from '../core/math';

export { RAPIER };
export const DT = 1 / 60;
export const G_WORLD = 0x0001, G_VEH = 0x0002, G_CHAR = 0x0004, G_PROP = 0x0008, G_QUERY = 0x0010;
export const groups = (member: number, filter: number) => (((member & 0xffff) << 16) | (filter & 0xffff)) >>> 0;
export const GRP_WORLD = groups(G_WORLD, 0xffff);
export const GRP_VEH = groups(G_VEH, 0xffff & ~G_CHAR);
export const GRP_CHAR = groups(G_CHAR, G_WORLD | G_PROP);
export const GRP_PROP = groups(G_PROP, 0xffff);
export const Q_WORLD = groups(G_QUERY, G_WORLD);
export const Q_SOLID = groups(G_QUERY, G_WORLD | G_VEH | G_PROP);
export const HF_HALF = 480, HF_CELLS = 480; // 2 m heightfield cells over a 960 m square

export interface RayHit { dist: number; nx: number; ny: number; nz: number; body: RAPIER.RigidBody | null }
export const DYN_SPECS: Record<DynKind, { hx: number; hy: number; hz: number; mass: number; color: number }> = {
  bin: { hx: 0.3, hy: 0.5, hz: 0.3, mass: 14, color: 0x3f6f5a },
  cone: { hx: 0.18, hy: 0.3, hz: 0.18, mass: 3, color: 0xff7a2a },
  crate: { hx: 0.45, hy: 0.4, hz: 0.45, mass: 22, color: 0xb08a5a },
  barrier: { hx: 0.9, hy: 0.5, hz: 0.2, mass: 30, color: 0xf2f2f2 },
};

let ready: Promise<void> | null = null;
export function initRapier(): Promise<void> {
  if (!ready) ready = RAPIER.init();
  return ready;
}

export class Physics {
  world: RAPIER.World;
  private ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  staticCount = 0;

  constructor() {
    generateLots();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = DT;
    this.buildTerrain();
    this.buildStatics();
    this.world.step(); // builds the query BVH so rays see the static world immediately
  }
  static async create(): Promise<Physics> { await initRapier(); return new Physics(); }

  private buildTerrain() {
    const n = HF_CELLS, heights = new Float32Array((n + 1) * (n + 1));
    const cell = (HF_HALF * 2) / n;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const x = -HF_HALF + j * cell, z = -HF_HALF + i * cell;
      heights[j * (n + 1) + i] = terrainH(x, z); // column-major: rows follow z, columns follow x
    }
    const desc = RAPIER.ColliderDesc.heightfield(n, n, heights, { x: HF_HALF * 2, y: 1, z: HF_HALF * 2 })
      .setCollisionGroups(GRP_WORLD).setFriction(0.9);
    this.world.createCollider(desc);
  }
  addStaticBox(x: number, y: number, z: number, hx: number, hy: number, hz: number, yaw = 0, friction = 0.6) {
    const d = RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setCollisionGroups(GRP_WORLD).setFriction(friction);
    if (yaw) d.setRotation(quatFromYaw(yaw));
    this.staticCount++;
    return this.world.createCollider(d);
  }
  private buildStatics() {
    for (const b of buildings) {
      if (b.stacked) continue;
      this.addStaticBox((b.x0 + b.x1) / 2, (b.base + b.top) / 2, (b.z0 + b.z1) / 2, (b.x1 - b.x0) / 2, (b.top - b.base) / 2, (b.z1 - b.z0) / 2, 0, 0.3);
    }
    for (const p of parts) {
      if (!p.collide) continue;
      if (p.shape === 'cyl' || p.shape === 'cone') {
        const d = RAPIER.ColliderDesc.cylinder(p.hy, Math.max(p.hx, p.hz)).setTranslation(p.x, p.y, p.z).setCollisionGroups(GRP_WORLD).setFriction(0.4);
        this.world.createCollider(d); this.staticCount++;
      } else this.addStaticBox(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.yaw, 0.4);
    }
    for (const b of blockers) this.addStaticBox(b.x, b.y, b.z, b.hx, b.hy, b.hz);
    for (const d of decks) {
      const cx = (d.rect.x0 + d.rect.x1) / 2, hx = (d.rect.x1 - d.rect.x0) / 2, s = d.seg.rect;
      this.addStaticBox(cx, d.y - 0.45, (s.z0 + s.z1) / 2, hx, 0.45, (s.z1 - s.z0) / 2, 0, 0.9);
      this.addStaticBox(cx, d.y + CURB - 0.45, (d.rect.z0 + s.z0) / 2, hx, 0.45, (s.z0 - d.rect.z0) / 2, 0, 0.9);
      this.addStaticBox(cx, d.y + CURB - 0.45, (d.rect.z1 + s.z1) / 2, hx, 0.45, (d.rect.z1 - s.z1) / 2, 0, 0.9);
    }
  }
  step() { this.world.step(); }

  private cast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, grp: number, out: RayHit, exclude?: RAPIER.RigidBody): boolean {
    const r = this.ray;
    r.origin.x = ox; r.origin.y = oy; r.origin.z = oz; r.dir.x = dx; r.dir.y = dy; r.dir.z = dz;
    const hit = this.world.castRayAndGetNormal(r, max, true, undefined, grp, undefined, exclude);
    if (!hit) return false;
    out.dist = hit.timeOfImpact; out.nx = hit.normal.x; out.ny = hit.normal.y; out.nz = hit.normal.z;
    out.body = hit.collider.parent();
    return true;
  }
  /** Ray against static world only (terrain, buildings, walls, decks). Direction must be normalised. */
  castWorld(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, out: RayHit): boolean {
    return this.cast(ox, oy, oz, dx, dy, dz, max, Q_WORLD, out);
  }
  /** Ray against world, vehicles and props. */
  castSolid(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, out: RayHit, exclude?: RAPIER.RigidBody): boolean {
    return this.cast(ox, oy, oz, dx, dy, dz, max, Q_SOLID, out, exclude);
  }
  private _los: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };
  /** True when no static geometry blocks the segment a->b. */
  los(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
    if (d < 0.05) return true;
    return !this.cast(ax, ay, az, dx / d, dy / d, dz / d, d - 0.05, Q_WORLD, this._los);
  }
  /** Height of the physical ground under a point (ray from above); falls back to the terrain function. */
  groundBelow(x: number, y: number, z: number): number {
    if (this.cast(x, y + 1.5, z, 0, -1, 0, 60, Q_WORLD, this._los)) return y + 1.5 - this._los.dist;
    return terrainH(x, z);
  }
  addDynProp(kind: DynKind, x: number, y: number, z: number, yaw: number): RAPIER.RigidBody {
    const s = DYN_SPECS[kind];
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y + s.hy + 0.02, z).setRotation(quatFromYaw(yaw)).setLinearDamping(0.4).setAngularDamping(0.8).setCanSleep(true));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(s.hx, s.hy, s.hz).setMass(s.mass).setFriction(0.7).setRestitution(0.15).setCollisionGroups(GRP_PROP), body);
    return body;
  }
}
