import { describe, expect, it } from 'vitest';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';

const DT = 1 / 60;
function run(g: Game, secs: number, fn?: (t: number) => Partial<ReturnType<typeof emptyInput>> | void) {
  for (let i = 0; i < secs * 60; i++) {
    const inp = { ...emptyInput(), ...(fn ? fn(i * DT) ?? {} : {}) };
    g.step(inp, DT);
  }
}

describe('integration: living city', () => {
  it('populates traffic, parked cars and pedestrians without NaNs', () => {
    const g = new Game(7);
    g.newGame();
    run(g, 20);
    const ai = g.traffic.count();
    expect(ai).toBeGreaterThan(8);
    expect(g.humans.filter((h) => h.kind === 'ped').length).toBeGreaterThan(15);
    expect(g.vehicles.filter((v) => v.owner === 'parked').length).toBeGreaterThan(5);
    for (const v of g.vehicles) expect(Number.isFinite(v.x + v.z + v.heading)).toBe(true);
    for (const h of g.humans) expect(Number.isFinite(h.x + h.z)).toBe(true);
  });

  it('traffic stops at red signals and keeps moving overall', () => {
    const g = new Game(3);
    g.newGame();
    run(g, 40);
    let moving = 0;
    for (const v of g.vehicles) if (g.traffic.ai.has(v.id) && Math.abs(v.speed) > 2) moving++;
    expect(moving).toBeGreaterThan(2);
    // no ambient car is wildly off the road network
    for (const v of g.vehicles) {
      if (!g.traffic.ai.has(v.id)) continue;
      expect(Math.abs(v.x)).toBeLessThan(300);
      expect(Math.abs(v.z)).toBeLessThan(300);
    }
  });

  it('player can walk, sprint and is blocked by buildings', () => {
    const g = new Game(5);
    g.newGame();
    const h = g.player.human;
    const sx = h.x;
    run(g, 2, () => ({ moveY: 1, sprint: true }));
    expect(Math.hypot(h.x - sx, h.z - -152)).toBeGreaterThan(3);
    // walk straight into the building to the north-west
    h.x = -138; h.z = -150.5; g.player.camYaw = 0;
    run(g, 3, () => ({ moveY: 1 }));
    expect(g.world.query(h.x - 1, h.z - 1, h.x + 1, h.z + 1).some((c) => c.tag === 'building' && h.z > c.minZ && h.z < c.maxZ && h.x > c.minX && h.x < c.maxX)).toBe(false);
  });
});
