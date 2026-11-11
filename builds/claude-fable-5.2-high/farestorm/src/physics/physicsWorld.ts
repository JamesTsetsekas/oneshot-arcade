// Rapier world construction from the pure-data world model. Static collision only uses simple shapes:
// one heightfield, cuboids for buildings/decks/rails, convex hulls for ramps, cylinders for landmarks.
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { WorldModel } from '../world/model';
import { NX, NZ, WORLD_W, WORLD_D, Surface } from '../world/galeport';
import { V3 } from '../core/math';

export type Rapier = typeof RAPIER_NS;

export const G_STATIC = 0x0001;
export const G_TAXI = 0x0002;
export const G_TRAFFIC = 0x0004;
export const groups = (member: number, filter: number): number => ((member << 16) | filter) >>> 0;
export const GRAVITY = 9.81;
export const DT = 1 / 60;

export interface RayHit {
  toi: number;
  normal: V3;
  handle: number;
}

export class PhysicsWorld {
  world: RAPIER_NS.World;
  terrainHandle = -1;
  private surfaceByCollider = new Map<number, Surface>();
  private ray: RAPIER_NS.Ray;
  private staticFilter = groups(0xffff, G_STATIC);

  constructor(public R: Rapier, public model: WorldModel) {
    const world = new R.World({ x: 0, y: -GRAVITY, z: 0 });
    world.timestep = DT;
    this.world = world;
    this.ray = new R.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    const sg = groups(G_STATIC, 0xffff);

    // Terrain heightfield: rows run along z, columns along x, column-major storage.
    const hf = new Float32Array((NZ + 1) * (NX + 1));
    for (let j = 0; j <= NX; j++) for (let i = 0; i <= NZ; i++) hf[i + j * (NZ + 1)] = model.heights[j + i * (NX + 1)];
    const terrain = world.createCollider(
      R.ColliderDesc.heightfield(NZ, NX, hf, { x: WORLD_W, y: 1, z: WORLD_D })
        .setTranslation(WORLD_W / 2, 0, WORLD_D / 2).setFriction(0.5).setCollisionGroups(sg),
    );
    this.terrainHandle = terrain.handle;

    for (const b of model.buildings) {
      world.createCollider(
        R.ColliderDesc.cuboid(b.hx, (b.y1 - b.y0) / 2, b.hz)
          .setTranslation(b.x, (b.y0 + b.y1) / 2, b.z)
          .setRotation({ x: 0, y: Math.sin(b.yaw / 2), z: 0, w: Math.cos(b.yaw / 2) })
          .setFriction(0.3).setRestitution(0.1).setCollisionGroups(sg),
      );
    }
    for (const b of model.boxes) {
      if (!b.collide) continue;
      const c = world.createCollider(
        R.ColliderDesc.cuboid(b.hx, b.hy, b.hz).setTranslation(b.x, b.y, b.z).setRotation(b.q)
          .setFriction(b.kind === 'rail' ? 0.15 : 0.4).setRestitution(0.1).setCollisionGroups(sg),
      );
      this.surfaceByCollider.set(c.handle, b.surface);
    }
    for (const r of model.ramps) {
      const desc = R.ColliderDesc.convexHull(new Float32Array(r.pts));
      if (!desc) continue;
      const c = world.createCollider(desc.setFriction(0.4).setCollisionGroups(sg));
      this.surfaceByCollider.set(c.handle, 'deck');
    }
    for (const s of model.sites) {
      world.createCollider(
        R.ColliderDesc.cylinder(16, s.r * 0.7).setTranslation(s.lx, s.ly + 14, s.lz).setFriction(0.3).setCollisionGroups(sg),
      );
    }
    // Last-resort world bounds, hidden inside the rim rock and far out at sea.
    const wall = (x: number, z: number, hx: number, hz: number) =>
      world.createCollider(R.ColliderDesc.cuboid(hx, 60, hz).setTranslation(x, 40, z).setCollisionGroups(sg));
    wall(-2, WORLD_D / 2, 2, WORLD_D);
    wall(WORLD_W + 2, WORLD_D / 2, 2, WORLD_D);
    wall(WORLD_W / 2, WORLD_D + 2, WORLD_W, 2);
    wall(WORLD_W / 2, -2, WORLD_W, 2);
    world.step();
  }

  /** Cast a ray against static geometry only. */
  castStatic(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxToi: number): RayHit | null {
    const ray = this.ray;
    ray.origin.x = ox; ray.origin.y = oy; ray.origin.z = oz;
    ray.dir.x = dx; ray.dir.y = dy; ray.dir.z = dz;
    const hit = this.world.castRayAndGetNormal(ray, maxToi, false, undefined, this.staticFilter);
    if (!hit) return null;
    return { toi: hit.timeOfImpact, normal: hit.normal, handle: hit.collider.handle };
  }
  surfaceOf(handle: number, x: number, z: number): Surface {
    if (handle === this.terrainHandle) return this.model.surfaceAt(x, z);
    return this.surfaceByCollider.get(handle) ?? 'paving';
  }
  step(): void {
    this.world.step();
  }
  dispose(): void {
    this.world.free();
  }
}
