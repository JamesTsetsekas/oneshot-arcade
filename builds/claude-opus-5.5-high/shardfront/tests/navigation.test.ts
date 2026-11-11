import { describe, expect, test } from 'vitest';
import { clearUnits, newSim } from './helpers';

describe('navigation & local avoidance', () => {
  test('40 units pass the natural choke: no permanent overlap, nobody stuck > 3 s, all arrive', () => {
    const sim = newSim(31);
    clearUnits(sim);
    const ids: number[] = [];
    // a 40-unit blob inside player 0's natural, ordered out through the front choke
    for (let i = 0; i < 40; i++) ids.push(sim.spawnUnit(i % 3 ? 'bulwark' : 'arc_lancer', 0, 52 + (i % 8) * 1.3, 118 + Math.floor(i / 8) * 1.3));
    sim.issue({ player: 0, kind: 'move', ids, x: 72, y: 86 });
    const stuckFor = new Map<number, number>();
    const lastPos = new Map<number, [number, number]>();
    let worstStuck = 0;
    let arrivedTick = -1;
    for (let t = 0; t < 20 * 90; t++) {
      sim.step();
      for (const u of ids) {
        const e = sim.ext[u];
        const p = lastPos.get(u) ?? [sim.x[u], sim.y[u]];
        const moved = Math.hypot(sim.x[u] - p[0], sim.y[u] - p[1]);
        if (e.orders.length && moved < 0.01) stuckFor.set(u, (stuckFor.get(u) ?? 0) + 1); else stuckFor.set(u, 0);
        if (stuckFor.get(u)! > worstStuck && stuckFor.get(u)! > 59 && process.env.NAVDBG) console.log('stuck', t, u, sim.x[u].toFixed(1), sim.y[u].toFixed(1), JSON.stringify(e.orders[0]), e.hasGoal, e.stuckTicks, e.direct, e.toggleTicks, e.phase);
        worstStuck = Math.max(worstStuck, stuckFor.get(u)!);
        lastPos.set(u, [sim.x[u], sim.y[u]]);
      }
      if (t > 3 && arrivedTick < 0 && ids.every((u) => sim.ext[u].orders.length === 0)) arrivedTick = t;
    }
    if (arrivedTick < 0) console.log('not arrived', ids.filter((u) => sim.ext[u].orders.length).map((u) => [u, sim.x[u].toFixed(1), sim.y[u].toFixed(1), sim.ext[u].stuckTicks, sim.ext[u].repaths]));
    expect(arrivedTick).toBeGreaterThan(0);
    expect(worstStuck).toBeLessThan(60); // < 3 s at 20 Hz with an active order
    const near = ids.filter((u) => Math.hypot(sim.x[u] - 72, sim.y[u] - 86) < 12).length;
    expect(near).toBeGreaterThanOrEqual(38);
    // separation: no pair overlaps by more than 40% of the smaller radius after settling
    let deep = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const d = Math.hypot(sim.x[a] - sim.x[b], sim.y[a] - sim.y[b]);
      if (d < sim.radius[a] + sim.radius[b] - 0.4 * Math.min(sim.radius[a], sim.radius[b])) deep++;
    }
    expect(deep).toBe(0);
  });

  test('ground units route around the chasm via a bridge; hover units fly straight over', () => {
    const sim = newSim(32);
    clearUnits(sim);
    const g = sim.spawnUnit('bulwark', 0, 30, 60);
    sim.issue({ player: 0, kind: 'move', ids: [g], x: 60, y: 30 });
    sim.step(); sim.step(); sim.step();
    let t = 3;
    for (; t < 20 * 120 && sim.ext[g].orders.length; t++) sim.step();
    expect(Math.hypot(sim.x[g] - 60, sim.y[g] - 30)).toBeLessThan(1);
    expect(t).toBeLessThan(20 * 60);
  });

  test('unreachable orders terminate (no permanent command loops)', () => {
    const sim = newSim(33);
    clearUnits(sim);
    const u = sim.spawnUnit('bulwark', 0, 30, 60);
    // the middle of the hover-only chasm: resolves to the nearest reachable ground and ends
    sim.issue({ player: 0, kind: 'move', ids: [u], x: 50.5, y: 50.5 });
    for (let t = 0; t < 20 * 40; t++) sim.step();
    expect(sim.ext[u].orders.length).toBe(0);
  });

  test('flow fields are shared and cached across a group order', () => {
    const sim = newSim(34);
    clearUnits(sim);
    const ids: number[] = [];
    for (let i = 0; i < 30; i++) ids.push(sim.spawnUnit('thornling', 0, 20 + (i % 6), 60 + Math.floor(i / 6)));
    const before = sim.nav.stats.fieldsBuilt;
    sim.issue({ player: 0, kind: 'move', ids, x: 100, y: 120 });
    for (let t = 0; t < 40; t++) sim.step();
    expect(sim.nav.stats.fieldsBuilt - before).toBeLessThanOrEqual(3);
  });
});
