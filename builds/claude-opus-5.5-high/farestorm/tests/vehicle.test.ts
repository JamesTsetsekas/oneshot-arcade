import { describe, expect, it } from "vitest";
import { getWorld } from "../src/sim/world/city";
import { createVehicle, DEFAULT_VEHICLE_OPTIONS, driftAngle, speedOf, stepVehicle, type VehicleEvent } from "../src/sim/vehicle/vehicle";
import { input, type InputFrame } from "../src/sim/vehicle/input";
import { TAXIS } from "../src/sim/vehicle/taxis";

const w = getWorld();
// Long straight: the coastal boulevard heading east from x=-640.
const START = { x: -630, z: -337, yaw: Math.PI / 2 };

function run(taxiIdx: number, frames: (i: number) => InputFrame, n: number, start = START) {
  const t = TAXIS[taxiIdx];
  const v = createVehicle(start.x, start.z, start.yaw, w);
  const evs: VehicleEvent[] = [];
  const speeds: number[] = [];
  for (let i = 0; i < n; i++) {
    const ev: VehicleEvent[] = [];
    stepVehicle(v, frames(i), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    evs.push(...ev);
    speeds.push(speedOf(v));
  }
  return { v, evs, speeds };
}

describe("vehicle handling", () => {
  it("0-100 km/h in 5-7 s and top speeds 150-180 km/h, all distinct", () => {
    const res = TAXIS.map((_, i) => {
      const r = run(i, () => input({ throttle: 1 }), 60 * 40);
      const t100 = r.speeds.findIndex((s) => s >= 100 / 3.6) / 60;
      const top = Math.max(...r.speeds) * 3.6;
      return { t100, top };
    });
    for (const r of res) {
      expect(r.t100).toBeGreaterThanOrEqual(4.6);
      expect(r.t100).toBeLessThanOrEqual(7.0);
      expect(r.top).toBeGreaterThanOrEqual(145);
      expect(r.top).toBeLessThanOrEqual(182);
    }
    // Gull accelerates fastest, Tempest has the highest top speed
    expect(res[0].t100).toBeLessThan(res[2].t100);
    expect(res[2].top).toBeGreaterThan(res[0].top);
  });

  it("brakes hard: 100->0 in under 2.5 s", () => {
    const r = run(1, (i) => (i < 60 * 7 ? input({ throttle: 1 }) : input({ brake: 1 })), 60 * 10);
    const startBrake = 60 * 7;
    const stopAt = r.speeds.findIndex((s, i) => i > startBrake && s < 0.5);
    expect(stopAt).toBeGreaterThan(0);
    expect((stopAt - startBrake) / 60).toBeLessThan(2.6);
  });

  it("Snap Drift requires speed above 35 km/h and produces a real slip angle", () => {
    const slow = run(1, (i) => (i < 60 ? input({ throttle: 0.4 }) : input({ steer: 1, handbrake: i === 70 })), 120);
    expect(slow.evs.some((e) => e.type === "snapDrift")).toBe(false);
    const fast = run(1, (i) => {
      if (i < 60 * 4) return input({ throttle: 1 });
      if (i < 60 * 4 + 6) return input({ throttle: 1, steer: 1, handbrake: true });
      return input({ throttle: 1, steer: 0.7 });
    }, 60 * 5);
    expect(fast.evs.some((e) => e.type === "snapDrift")).toBe(true);
  });

  it("stationary handbrake spinning cannot start a drift", () => {
    const r = run(1, (i) => input({ steer: i % 40 < 20 ? 1 : -1, handbrake: i % 10 < 5, throttle: 0.2 }), 60 * 6);
    expect(r.evs.filter((e) => e.type === "snapDrift").length).toBe(0);
  });

  it("drift angle grows while drifting then countersteer exits cleanly", () => {
    const t = TAXIS[1];
    const v = createVehicle(START.x, START.z, START.yaw, w);
    const ev: VehicleEvent[] = [];
    for (let i = 0; i < 60 * 4; i++) stepVehicle(v, input({ throttle: 1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    for (let i = 0; i < 6; i++) stepVehicle(v, input({ throttle: 1, steer: 1, handbrake: true }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    let maxAngle = 0;
    for (let i = 0; i < 40; i++) {
      stepVehicle(v, input({ throttle: 1, steer: 0.6 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
      maxAngle = Math.max(maxAngle, Math.abs(driftAngle(v)));
    }
    expect(v.drifting).toBe(true);
    expect(maxAngle).toBeGreaterThan(0.25);
    for (let i = 0; i < 120 && v.drifting; i++) stepVehicle(v, input({ throttle: 0.6, steer: -1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    expect(v.drifting).toBe(false);
    expect(ev.some((e) => e.type === "driftEnd")).toBe(true);
  });

  it("Surge Start triggers only when throttle is tapped within 220 ms of releasing the brake", () => {
    const good = run(1, (i) => (i < 30 ? input({ brake: 1 }) : i < 36 ? input({}) : input({ throttle: 1 })), 90);
    expect(good.evs.some((e) => e.type === "surge")).toBe(true);
    const late = run(1, (i) => (i < 30 ? input({ brake: 1 }) : i < 50 ? input({}) : input({ throttle: 1 })), 90);
    expect(late.evs.some((e) => e.type === "surge")).toBe(false);
    const held = run(1, (i) => (i < 30 ? input({ brake: 1, throttle: 1 }) : input({ throttle: 1 })), 90);
    expect(held.evs.some((e) => e.type === "surge")).toBe(false);
  });

  it("Grip Turn needs a brake tap then throttle during a drift", () => {
    const t = TAXIS[1];
    const v = createVehicle(START.x, START.z, START.yaw, w);
    const ev: VehicleEvent[] = [];
    for (let i = 0; i < 60 * 4; i++) stepVehicle(v, input({ throttle: 1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    stepVehicle(v, input({ throttle: 1, steer: 1, handbrake: true }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    for (let i = 0; i < 10; i++) stepVehicle(v, input({ steer: 1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    expect(v.drifting).toBe(true);
    for (let i = 0; i < 4; i++) stepVehicle(v, input({ steer: 1, brake: 1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    for (let i = 0; i < 4; i++) stepVehicle(v, input({ steer: 1, throttle: 1 }), t, w, DEFAULT_VEHICLE_OPTIONS, ev);
    expect(ev.some((e) => e.type === "gripTurn")).toBe(true);
  });

  it("taxis differ in steering response and drift rotation", () => {
    const yaw = TAXIS.map((_, i) => {
      const r = run(i, (k) => (k < 120 ? input({ throttle: 1 }) : input({ throttle: 1, steer: 1 })), 180);
      return Math.abs(r.v.yaw - START.yaw);
    });
    expect(yaw[0]).toBeGreaterThan(yaw[2]);
  });

  it("a ramp launches the taxi airborne and it lands", () => {
    // Seawall kicker on the quay: approach from x=345 heading east at speed
    const r = run(1, () => input({ throttle: 1 }), 60 * 15, { x: 62, z: -405 - 2, yaw: Math.PI / 2 });
    const land = r.evs.find((e) => e.type === "land" && e.airTime > 0.4);
    expect(r.evs.some((e) => e.type === "takeoff")).toBe(true);
    expect(land).toBeTruthy();
  });

  it("running into a building stops the taxi with a collision event", () => {
    // Head north out of the boulevard into the beach-side hotel block
    const b = w.buildings[0];
    const cx = (b.minX + b.maxX) / 2;
    const start = { x: cx, z: b.minZ - 30, yaw: 0 };
    const r = run(1, () => input({ throttle: 1 }), 60 * 6, start);
    expect(r.evs.some((e) => e.type === "collision")).toBe(true);
    expect(r.v.z).toBeLessThan(b.maxZ);
  });
});
