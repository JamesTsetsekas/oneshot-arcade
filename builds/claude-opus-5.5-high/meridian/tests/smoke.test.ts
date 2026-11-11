import { describe, it, expect } from "vitest";
import { Game } from "../src/sim/game";

describe("simulation smoke", () => {
  it("runs a new game for 60 simulated seconds without NaN or crashes", () => {
    const g = new Game();
    g.cam.pos = { x: -55, y: 10, z: 70 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
    g.newGame();
    const t0 = performance.now();
    for (let i = 0; i < 60 * 60; i++) g.step(1 / 60);
    const ms = performance.now() - t0;
    for (const v of g.vehicles) { expect(Number.isFinite(v.x + v.z + v.y + v.yaw)).toBe(true); }
    for (const c of g.chars) { expect(Number.isFinite(c.x + c.z + c.y)).toBe(true); }
    console.log("vehicles", g.vehicles.length, "chars", g.chars.length, "traffic", g.traffic.brains.size, "ms/step", (ms / 3600).toFixed(3), "red", g.traffic.redViolations, "pathFail", g.peds.pathFailures);
    expect(g.vehicles.length).toBeGreaterThan(10);
    expect(g.chars.length).toBeGreaterThan(15);
  });
});
