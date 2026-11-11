import { describe, it, expect } from 'vitest';
import { getMapGrid, STRUCTURES, CAMPS, FOUNTAIN, LANES, isWalkable, Cell, BRUSHES, brushAt, MAP_W, MAP_H, LANE_LENGTH } from '../src/shared/map';
import { findPath, pathLength, nearestWalkable } from '../src/sim/nav';
import { dist } from '../src/shared/math';

const SPEED = 3.6; // mid hero speed for route timing

describe('The Broken Diadem', () => {
  const g = getMapGrid();
  it('is ~150x115 m with walkable fountains, lanes, structures and camps', () => {
    expect(MAP_W).toBe(150); expect(MAP_H).toBe(115);
    for (const f of FOUNTAIN) expect(isWalkable(f.x, f.y)).toBe(true);
    for (const lane of LANES) for (let i = 0; i < lane.length; i += 5) expect(isWalkable(lane[i].x, lane[i].y)).toBe(true);
    for (const c of CAMPS) expect(isWalkable(c.x, c.y), c.key).toBe(true);
    for (const s of STRUCTURES) expect(nearestWalkable(s.x, s.y, 0.5, 2), s.key).not.toBeNull();
  });
  it('has mistwood (vision blockers) and brush regions', () => {
    let forest = 0; for (const c of g.cells) if (c === Cell.Forest) forest++;
    expect(forest).toBeGreaterThan(5000);
    expect(g.brushCount).toBeGreaterThanOrEqual(BRUSHES.length / 2);
    for (const b of BRUSHES) expect(brushAt(b.x, b.y)).toBeGreaterThanOrEqual(0);
  });
  it('mirrors value fairly: route times are equal for both teams (180° symmetry)', () => {
    const t = (a: { x: number; y: number }, b: { x: number; y: number }) => { const p = findPath(a.x, a.y, b.x, b.y, 0.5)!; expect(p).not.toBeNull(); return pathLength(a.x, a.y, p) / SPEED; };
    const outer = (team: 0 | 1, lane: number) => STRUCTURES.find((s) => s.team === team && s.lane === lane && s.tier === 'outer')!;
    for (const lane of [0, 1]) {
      const a = t(FOUNTAIN[0], outer(0, lane)), b = t(FOUNTAIN[1], outer(1, 1 - lane));
      expect(Math.abs(a - b)).toBeLessThan(1.0);
      // fountain to outer tower target 18–22 s (allow some slack for lane shape)
      expect(a).toBeGreaterThan(14); expect(a).toBeLessThan(26);
    }
    const n = CAMPS.find((c) => c.key === 'catalyst-north')!, s = CAMPS.find((c) => c.key === 'catalyst-south')!;
    expect(Math.abs(t(FOUNTAIN[0], n) - t(FOUNTAIN[1], s))).toBeLessThan(1.0);
  });
  it('colossus pit is reachable from both river entrances', () => {
    expect(findPath(0, -15, 0, 0, 0.5)).not.toBeNull();
    expect(findPath(0, 15, 0, 0, 0.5)).not.toBeNull();
  });
  it('lane is long enough for wave play and towers are ordered outward from base', () => {
    expect(LANE_LENGTH).toBeGreaterThan(140);
    for (const team of [0, 1] as const) for (const lane of [0, 1]) {
      const order = ['seal', 'guard', 'inner', 'outer'].map((tier) => STRUCTURES.find((s) => s.team === team && s.lane === lane && s.tier === tier)!);
      const base = FOUNTAIN[team];
      for (let i = 1; i < order.length; i++) expect(dist(order[i].x, order[i].y, base.x, base.y)).toBeGreaterThan(dist(order[i - 1].x, order[i - 1].y, base.x, base.y) - 1);
    }
  });
});
