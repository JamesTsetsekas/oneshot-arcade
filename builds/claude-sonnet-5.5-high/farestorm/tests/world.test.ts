import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/sim/world';
import { dist } from '../src/sim/math';

const world = createWorld(1337);

describe('Galeport world', () => {
  it('has exactly 32 destinations spread over all five districts', () => {
    expect(world.destinations.length).toBe(32);
    const districts = new Set(world.destinations.map((d) => d.district));
    expect(districts.size).toBe(5);
    const names = new Set(world.destinations.map((d) => d.name));
    expect(names.size).toBe(32);
  });

  it('has at least 18 authored shortcuts with distinct names', () => {
    expect(world.shortcuts.length).toBeGreaterThanOrEqual(18);
    expect(new Set(world.shortcuts.map((s) => s.name)).size).toBe(world.shortcuts.length);
  });

  it('every destination is reachable by legal road from every pickup spot', () => {
    for (const d of world.destinations) {
      for (let k = 0; k < world.pickupSpots.length; k += 17) {
        const L = world.pathLength(world.pickupSpots[k], d.point);
        expect(L).toBeLessThan(5000);
      }
      // ring sits on a road, clear of buildings
      expect(world.roadInfo(d.x, d.z).onRoad).toBe(true);
      expect(world.hitTest(d.x, d.z, 1.5)).toBeNull();
    }
  });

  it('pickup spots are on roads and clear of colliders', () => {
    for (const p of world.pickupSpots) {
      expect(world.roadInfo(p.x, p.z).onRoad).toBe(true);
      expect(world.hitTest(p.x, p.z, 1.5)).toBeNull();
    }
  });

  it('every shortcut corridor is collision-free along its centreline (entry/exit valid, reset-safe)', () => {
    for (const s of world.shortcuts) {
      const L = dist(s.ax, s.az, s.bx, s.bz);
      const steps = Math.ceil(L / 1.5);
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const x = s.ax + (s.bx - s.ax) * t, z = s.az + (s.bz - s.az) * t;
        expect(world.hitTest(x, z, 1.1), `${s.name} blocked at t=${t.toFixed(2)}`).toBeNull();
      }
      // entry and exit touch a road (or its sidewalk) so the player can reach them
      const near = (x: number, z: number) => {
        for (const dx of [-16, 0, 16]) for (const dz of [-16, 0, 16]) if (world.roadInfo(x + dx, z + dz).onRoad) return true;
        return false;
      };
      expect(near(s.ax, s.az)).toBe(true);
      expect(near(s.bx, s.bz)).toBe(true);
      // tactical purpose: saves distance or bypasses signals
      expect(L).toBeGreaterThan(40);
    }
  });

  it('ramp launch and landing zones are clear', () => {
    expect(world.ramps.length).toBeGreaterThan(0);
    for (const r of world.ramps) {
      for (let a = 0; a < 40; a += 2) {
        const x = r.x + r.dx * (a - 2), z = r.z + r.dz * (a - 2);
        expect(world.hitTest(x, z, 1.1)).toBeNull();
      }
    }
  });

  it('can query surfaces: roads asphalt, beach sand, old steps cobble, water off the quay', () => {
    expect(world.surfaceAt(440, 310)).toBe('asphalt');
    expect(world.surfaceAt(700, 150)).toBe('sand');
    expect(world.surfaceAt(60, 420)).toBe('cobble');
    expect(world.surfaceAt(400, 700)).toBe('water');
    expect(world.isWater(400, 700)).toBe(true);
    expect(world.isWater(440, 310)).toBe(false);
  });

  it('is a closed world: boundary walls stop leaving the map', () => {
    expect(world.hitTest(world.bounds.minX - 1, 300, 1)).not.toBeNull();
    expect(world.hitTest(300, world.bounds.minZ - 1, 1)).not.toBeNull();
    expect(world.hitTest(world.bounds.maxX + 1, 300, 1)).not.toBeNull();
  });

  it('is deterministic for a given seed', () => {
    const a = createWorld(1337), b = createWorld(1337);
    expect(a.destinations.map((d) => d.name)).toEqual(b.destinations.map((d) => d.name));
    expect(a.blocks.map((x) => x.buildings.length)).toEqual(b.blocks.map((x) => x.buildings.length));
  });
});
