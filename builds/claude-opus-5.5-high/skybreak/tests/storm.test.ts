import { describe, expect, it } from 'vitest';
import { planStorm, stormAt } from '../src/server/storm';
import { getIsland } from '../src/shared/world/island';
import { STORM_PHASES } from '../src/shared/content/rules';

describe('Calmfield / Riftstorm', () => {
  const island = getIsland();
  it('uses the brief timings and radii', () => {
    expect(STORM_PHASES.slice(0, 6).map((p) => [p.wait, p.shrink, p.radius, p.damage])).toEqual([
      [90, 0, 430, 1], [0, 120, 320, 1], [70, 90, 210, 2], [55, 75, 125, 4], [40, 60, 70, 7], [30, 45, 35, 10],
    ]);
    const plan = planStorm(1, island);
    // whole island for the first 90s
    expect(stormAt(plan, 10).cur.r).toBeGreaterThan(800);
    expect(stormAt(plan, 89).stage).toBe('wait');
    expect(stormAt(plan, 91).cur.r).toBeLessThanOrEqual(430);
    expect(stormAt(plan, 90 + 120).cur.r).toBeCloseTo(320, 0);
    // a 14-18 minute match including ~75s staging + insertion
    expect(plan.total + 75).toBeGreaterThan(14 * 60);
    expect(plan.total + 75).toBeLessThan(18 * 60);
  });
  it('only picks valid authored centres and keeps each circle inside the previous one', () => {
    const valid = new Set(island.stormCenters.map((c) => `${c.x},${c.z}`));
    for (let seed = 1; seed <= 40; seed++) {
      const plan = planStorm(seed, island);
      let prev = plan.start;
      plan.circles.forEach((c, k) => {
        const p = plan.phases[k];
        if (p.radius > 0) expect(valid.has(`${c.x},${c.z}`) || p.moving).toBe(true);
        if (!p.moving && k > 0) expect(Math.hypot(c.x - prev.x, c.z - prev.z) + c.r).toBeLessThanOrEqual(prev.r + 1e-6);
        if (p.moving) expect(Math.hypot(c.x - prev.x, c.z - prev.z)).toBeLessThan(55);
        prev = c;
      });
      // final field centres are on land
      const last = plan.circles[plan.circles.length - 2];
      const h = island.heights[Math.round((last.z + 600) / 2) * 601 + Math.round((last.x + 600) / 2)];
      expect(h).toBeGreaterThan(1);
    }
  });
  it('damage escalates and the field ends at zero', () => {
    const plan = planStorm(9, island);
    let last = 0;
    for (let t = 0; t < plan.total; t += 5) {
      const s = stormAt(plan, t);
      expect(s.damage).toBeGreaterThanOrEqual(last);
      last = s.damage;
    }
    expect(stormAt(plan, plan.total + 1).cur.r).toBe(0);
  });
  it('is deterministic per seed and differs between seeds', () => {
    const a = planStorm(77, island), b = planStorm(77, island), c = planStorm(78, island);
    expect(a.circles).toEqual(b.circles);
    expect(a.circles).not.toEqual(c.circles);
  });
});
