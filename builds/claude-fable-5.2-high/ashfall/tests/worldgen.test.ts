import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { findPath, flood } from '../src/navigation-ai/grid';
import { generateZone, validateZone } from '../src/world-generation/generate';
import { TILES, TOWN_MAP } from '../src/world-generation/tiles';

describe('rng', () => {
  it('is deterministic per seed and forks independently', () => {
    const a = new Rng(42), b = new Rng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
    expect(new Rng(42).fork('loot').next()).not.toEqual(new Rng(42).fork('layout').next());
    expect(new Rng(1).next()).not.toEqual(new Rng(2).next());
  });
});
describe('tile templates', () => {
  it('are all 12x12 and the town map is rectangular', () => {
    for (const t of TILES) { expect(t.rows.length, t.name).toBe(12); for (const r of t.rows) expect(r.length, t.name).toBe(12); }
    for (const r of TOWN_MAP) expect(r.length).toBe(TOWN_MAP[0].length);
  });
});
describe('world generation', () => {
  it('produces a valid Soot March for 60 seeds: landmarks, 10-12 tiles, a loop, everything reachable', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const z = generateZone('march', seed * 7919, 0);
      expect(validateZone(z), `seed ${seed}`).toEqual([]);
      expect(z.tiles.length).toBeGreaterThanOrEqual(10);
      expect(z.tiles.length).toBeLessThanOrEqual(12);
      for (const k of ['gate', 'tollhouse', 'ashway', 'cryptdoor', 'huntercamp', 'stonering', 'vista']) expect(z.tiles.filter((t) => t.name === k).length, `${k} seed ${seed}`).toBe(1);
      expect(z.edges.length).toBeGreaterThanOrEqual(z.tiles.length); // tree + at least one loop edge
    }
  });
  it('gates the crypt door behind the tollhouse (only one connection into the crypt tile)', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const z = generateZone('march', seed * 31, 0);
      const crypt = z.tiles.find((t) => t.name === 'cryptdoor')!, toll = z.tiles.find((t) => t.name === 'tollhouse')!;
      const ci = crypt.gy * 4 + crypt.gx, ti = toll.gy * 4 + toll.gx;
      const touching = z.edges.filter((e) => e.split('-').map(Number).includes(ci));
      expect(touching).toEqual([`${Math.min(ci, ti)}-${Math.max(ci, ti)}`]);
    }
  });
  it('is deterministic for a seed and varies across seeds', () => {
    const a = generateZone('march', 555, 0), b = generateZone('march', 555, 0), c = generateZone('march', 556, 0);
    expect(Array.from(a.cells)).toEqual(Array.from(b.cells));
    expect(a.spawns).toEqual(b.spawns);
    expect(Array.from(a.cells)).not.toEqual(Array.from(c.cells));
  });
  it('builds valid archive floors, vault, hunts and town', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const id of ['archive1', 'archive2', 'archive3', 'hunt_toll', 'hunt_engine', 'refuge']) {
        const z = generateZone(id, seed * 104729, seed % 2);
        expect(validateZone(z), `${id} seed ${seed}`).toEqual([]);
        if (id === 'archive1' || id === 'archive2') {
          const names = z.tiles.map((t) => t.name);
          for (const n of new Set(names)) expect(names.filter((x) => x === n).length).toBeLessThanOrEqual(2); // capped repeats
        }
      }
    }
  });
  it('archive floor 2 has a lever, a sealed shortcut and an elite guardian', () => {
    const z = generateZone('archive2', 2024, 0);
    expect(z.inter.some((i) => i.type === 'lever')).toBe(true);
    expect(z.inter.some((i) => i.type === 'door' && i.key === 'shortcut')).toBe(true);
    expect(z.inter.some((i) => i.type === 'exit' && i.key === 'shortcut')).toBe(true);
    expect(z.spawns.some((s) => s.kind.startsWith('E'))).toBe(true);
  });
  it('pathfinding connects start to every exit and never crosses walls', () => {
    const z = generateZone('march', 9001, 0);
    const s = z.entries.start;
    const seen = flood(z, s.x, s.y);
    for (const ex of z.inter.filter((i) => i.type === 'exit' || i.type === 'waypoint')) {
      const path = findPath(z, s.x, s.y, ex.x, ex.y, 0.45, 5000);
      expect(path, ex.label).not.toBeNull();
      for (const pt of path!) expect(seen[Math.floor(pt.y / 2) * z.w + Math.floor(pt.x / 2)]).toBe(1);
    }
  });
});
