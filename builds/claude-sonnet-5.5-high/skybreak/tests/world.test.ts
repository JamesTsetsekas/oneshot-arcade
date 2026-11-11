import { describe, expect, it } from 'vitest';
import { World, type Box, type Cyl } from '../src/sim/world';

describe('world generation (The Highwake)', () => {
  const w = new World(1234);

  it('is deterministic per seed and differs between seeds', () => {
    expect(new World(1234).hash).toBe(w.hash);
    expect(new World(99).hash).not.toBe(w.hash);
  });

  it('contains the six named locations and eight smaller landmarks', () => {
    const named = w.locations.filter((l) => l.named).map((l) => l.name).sort();
    expect(named).toEqual(['Aerie Market', 'Breaker Docks', 'Kilnworks', 'Orchard Steps', 'Sunken Array', 'Wind Abbey']);
    expect(w.locations.filter((l) => !l.named)).toHaveLength(8);
  });

  it('has loot sockets in every location and a weapon-biased socket in most buildings', () => {
    for (const l of w.locations) {
      const inLoc = w.sockets.filter((s) => s.loc === l.id);
      expect(inLoc.length, l.name).toBeGreaterThan(0);
    }
    const withWeapon = w.buildings.filter((b) => w.sockets.some((s) => s.loc === b.loc && s.weaponBias && Math.abs(s.x - b.x) < b.w / 2 && Math.abs(s.z - b.z) < b.d / 2));
    expect(withWeapon.length).toBeGreaterThan(w.buildings.length * 0.75);
  });

  it('has traversal: ziplines, air vents, a hazard channel and deep water for swimming', () => {
    expect(w.ziplines.length).toBeGreaterThanOrEqual(2);
    expect(w.vents.length).toBeGreaterThanOrEqual(1);
    expect(w.hazards.length).toBeGreaterThanOrEqual(1);
    let deep = 0;
    for (let x = -500; x <= 500; x += 20) for (let z = -500; z <= 500; z += 20) if (w.heightAt(x, z) < -1.2) deep++;
    expect(deep).toBeGreaterThan(50);
  });

  it('only offers valid storm centers: land, gentle slope, cover, not on roofs', () => {
    expect(w.zoneCenters.length).toBeGreaterThan(100);
    const tB: Box[] = [], tC: Cyl[] = [];
    for (const c of w.zoneCenters) {
      const y = w.heightAt(c.x, c.z);
      expect(y).toBeGreaterThan(1.8);
      expect(w.slopeAt(c.x, c.z)).toBeLessThanOrEqual(0.45);
      expect(w.inHazard(c.x, c.z)).toBe(0);
      expect(c.cover).toBeGreaterThanOrEqual(6);
      expect(w.groundHeight(c.x, c.z, y + 0.1, 0.1, 0.4, tB, tC)).toBeLessThanOrEqual(y + 2);
    }
  });

  it('raycasts against terrain and building walls', () => {
    const b = w.buildings[0];
    const y = b.floorY + 1.2;
    const t = w.raycast(b.x - b.w / 2 - 6, y, b.z + 3.3, 1, 0, 0, 30);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(10);
    const g = w.raycast(0, 100, 0, 0, -1, 0, 200);
    expect(g).toBeCloseTo(100 - w.heightAt(0, 0), 0);
    expect(w.hasLineOfSight({ x: 0, y: 300, z: 0 }, { x: 40, y: 300, z: 10 })).toBe(true);
  });

  it('gives every building a door with an outside approach point', () => {
    for (const b of w.buildings) {
      expect(['n', 's', 'e', 'w']).toContain(b.door);
      expect(Math.hypot(b.doorOut.x - b.doorIn.x, b.doorOut.z - b.doorIn.z)).toBeGreaterThan(3);
    }
  });
});
