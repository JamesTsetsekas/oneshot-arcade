import { describe, expect, it } from 'vitest';
import { flood } from '../src/sim/nav';
import { TILE_TEMPLATE_COUNT, buildArchive, buildEngineFloor, buildMarch, buildRefuge, buildTollHunt, layoutMarch, packPoints, shortcutShortens, validateArchive, validateMarch, type MarchLayout } from '../src/sim/world';

describe('Soot March generation', () => {
  it('has at least 20 authored tile recipes', () => {
    expect(TILE_TEMPLATE_COUNT).toBeGreaterThanOrEqual(20);
  });

  it('produces valid, fully connected marches for many seeds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const z = buildMarch(seed * 7919, 'normal');
      const v = validateMarch(z);
      expect(v.errors, `seed ${seed}`).toEqual([]);
      expect(v.tileCount).toBeGreaterThanOrEqual(10);
      expect(v.tileCount).toBeLessThanOrEqual(12);
      expect(v.hasLoop).toBe(true);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = buildMarch(4242, 'normal');
    const b = buildMarch(4242, 'normal');
    expect(Array.from(a.grid.cells)).toEqual(Array.from(b.grid.cells));
    expect(a.spawns.map((s) => s.id + s.x.toFixed(2))).toEqual(b.spawns.map((s) => s.id + s.x.toFixed(2)));
    const c = buildMarch(4243, 'normal');
    expect(Array.from(c.grid.cells)).not.toEqual(Array.from(a.grid.cells));
  });

  it('contains every required landmark anchor', () => {
    const z = buildMarch(99, 'normal');
    for (const k of ['gate', 'waypoint', 'tollhouse', 'hunterCamp', 'crypt']) expect(z.anchors[k], k).toBeTruthy();
    expect(z.bossArena?.boss).toBe('toll_keeper');
    expect(z.interactables.some((i) => i.kind === 'archive_gate')).toBe(true);
    expect(z.interactables.some((i) => i.kind === 'cache')).toBe(true);
    expect(z.spawns.some((s) => s.tag === 'elite')).toBe(true);
  });

  it('keeps pack budgets in range and spawns away from the player start', () => {
    for (const seed of [3, 11, 29]) {
      const z = buildMarch(seed, 'normal');
      for (const s of z.spawns.filter((s) => s.tag === 'pack')) {
        const pts = packPoints(s.members);
        expect(pts).toBeGreaterThanOrEqual(4);
        expect(pts).toBeLessThanOrEqual(12);
        expect(Math.hypot(s.x - z.playerStart.x, s.z - z.playerStart.z)).toBeGreaterThan(4);
      }
    }
  });

  it('has a shortcut gate that does not lengthen the route', () => {
    let tested = 0;
    for (const seed of [5, 17, 23, 31]) {
      const z = buildMarch(seed, 'normal');
      expect((z.meta.layout as MarchLayout).shortcutEdge).not.toBeNull();
      expect(shortcutShortens(z)).toBe(true);
      tested++;
    }
    expect(tested).toBe(4);
  });

  it('layout has a loop and unique templates', () => {
    const lay = layoutMarch(2024);
    expect(lay.edges.length).toBeGreaterThanOrEqual(lay.tiles.length);
    expect(new Set(lay.tiles.map((t) => t.template)).size).toBe(lay.tiles.length);
  });
});

describe('Hollow Archive generation', () => {
  it('builds reachable floors with landmarks and a capped room-template repeat', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const floor of [1, 2] as const) {
        const z = buildArchive(seed * 131, floor, 'normal');
        const v = validateArchive(z);
        expect(v.errors, `seed ${seed} floor ${floor}`).toEqual([]);
      }
    }
  });
  it('floor 1 has the Artificer cage, floor 2 has a lever + gate shortcut and an elite guardian', () => {
    const f1 = buildArchive(77, 1, 'normal');
    expect(f1.interactables.some((i) => i.kind === 'cage')).toBe(true);
    expect(f1.traps.length).toBeGreaterThan(0);
    const f2 = buildArchive(77, 2, 'normal');
    expect(f2.interactables.some((i) => i.kind === 'lever')).toBe(true);
    expect(f2.spawns.some((s) => s.elite)).toBe(true);
  });
  it('engine floor has an arena, a checkpoint waypoint and a connected approach', () => {
    const z = buildEngineFloor(5, 'normal');
    expect(z.bossArena?.boss).toBe('orison_engine');
    expect(z.interactables.some((i) => i.kind === 'waypoint')).toBe(true);
    const reach = flood(z.grid, z.playerStart.x, z.playerStart.z);
    expect(reach[Math.floor(z.bossArena!.z) * z.w + Math.floor(z.bossArena!.x)]).toBe(1);
  });
  it('toll hunt route reaches its arena', () => {
    const z = buildTollHunt(9, 'normal');
    const reach = flood(z.grid, z.playerStart.x, z.playerStart.z);
    expect(reach[Math.floor(z.bossArena!.z) * z.w + Math.floor(z.bossArena!.x)]).toBe(1);
  });
});

describe('Ember Refuge', () => {
  it('is safe, has all hub services and a reachable gate', () => {
    const z = buildRefuge();
    expect(z.safe).toBe(true);
    const kinds = z.interactables.map((i) => i.kind);
    for (const k of ['waypoint', 'captain', 'vendor', 'healer', 'artificer', 'stash', 'gate_march']) expect(kinds).toContain(k);
    expect(z.spawns.filter((s) => s.tag === 'dummy').length).toBe(3);
    const reach = flood(z.grid, z.playerStart.x, z.playerStart.z);
    for (const it of z.interactables.filter((i) => !i.hidden)) {
      let ok = false;
      for (let dz = -3; dz <= 3 && !ok; dz++) for (let dx = -3; dx <= 3 && !ok; dx++) if (reach[(Math.floor(it.z) + dz) * z.w + Math.floor(it.x) + dx]) ok = true;
      expect(ok, it.kind).toBe(true);
    }
  });
});
