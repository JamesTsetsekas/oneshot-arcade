import { describe, it, expect } from "vitest";
import { Vehicle, VEHICLES, type VehicleEnv, type VehicleModel } from "../src/sim/vehicle";
import { satORectAabb } from "../src/world/collision";
import { Game } from "../src/sim/game";

const flat: VehicleEnv = { height: () => 0, surfaceHeight: () => 0, surface: () => "asphalt", wet: 0, water: () => null };
const run = (v: Vehicle, secs: number, c: { throttle?: number; brake?: number; steer?: number; handbrake?: boolean }, env = flat) => {
  for (let i = 0; i < Math.round(secs * 60); i++) v.step(1 / 60, { throttle: c.throttle ?? 0, brake: c.brake ?? 0, steer: c.steer ?? 0, handbrake: c.handbrake ?? false }, env);
};

describe("vehicle dynamics", () => {
  it("defines eight original vehicles: 3 compact/sedan, muscle, van, police, 2 motorcycles", () => {
    const specs = Object.values(VEHICLES);
    expect(specs.length).toBe(8);
    expect(specs.filter((s) => s.cls === "compact" || s.cls === "sedan").length).toBe(3);
    expect(specs.filter((s) => s.cls === "muscle").length).toBe(1);
    expect(specs.filter((s) => s.cls === "van").length).toBe(1);
    expect(specs.filter((s) => s.cls === "police").length).toBe(1);
    expect(specs.filter((s) => s.moto).length).toBe(2);
  });

  for (const m of Object.keys(VEHICLES) as VehicleModel[]) {
    it(`${m}: accelerates, brakes to a stop and reverses`, () => {
      const v = new Vehicle(m, 0, 0, 0);
      run(v, 6, { throttle: 1 });
      const sp = v.fwdSpeed;
      expect(sp).toBeGreaterThan(12);
      expect(sp).toBeLessThan(VEHICLES[m].topSpeed + 1);
      const z0 = v.z;
      let t = 0;
      while (v.fwdSpeed > 0.5 && t < 10) { run(v, 1 / 60, { brake: 1 }); t += 1 / 60; }
      expect(t).toBeLessThan(5);
      expect(v.z - z0).toBeLessThan((sp * sp) / 8 + 10);
      run(v, 3, { brake: 1 });
      expect(v.fwdSpeed).toBeLessThan(-1);
    });
  }

  it("steers right with positive steer input and turns without blowing up", () => {
    const v = new Vehicle("varro", 0, 0, 0);
    run(v, 2, { throttle: 0.7 });
    const y0 = v.yaw;
    run(v, 3, { throttle: 0.5, steer: 1 });
    expect(v.yaw - y0).toBeGreaterThan(0.8);
    expect(Number.isFinite(v.x + v.z + v.yaw)).toBe(true);
  });

  it("handbrake induces oversteer and the car recovers when released", () => {
    const a = new Vehicle("brava", 0, 0, 0), b = new Vehicle("brava", 0, 0, 0);
    run(a, 4, { throttle: 1 }); run(b, 4, { throttle: 1 });
    run(a, 0.8, { steer: 0.6, handbrake: true });
    run(b, 0.8, { steer: 0.6 });
    expect(Math.abs(a.w)).toBeGreaterThan(Math.abs(b.w));
    run(a, 3, { throttle: 0.3 });
    expect(Math.abs(a.w)).toBeLessThan(0.3);
  });

  it("survives a 60 s random-input fuzz without NaN or runaway speeds", () => {
    for (const m of ["pella", "hauler", "kestrel", "vanta"] as VehicleModel[]) {
      const v = new Vehicle(m, 0, 0, 0);
      let s = 1;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 3600; i++) v.step(1 / 60, { throttle: rnd() > 0.3 ? 1 : 0, brake: rnd() > 0.8 ? 1 : 0, steer: rnd() * 2 - 1, handbrake: rnd() > 0.9 }, flat);
      expect(Number.isFinite(v.x + v.z + v.vx + v.vz + v.w)).toBe(true);
      expect(v.speed).toBeLessThan(VEHICLES[m].topSpeed + 5);
      expect(Math.abs(v.lean)).toBeLessThanOrEqual(0.81);
    }
  });

  it("gravel reduces cornering grip compared to asphalt", () => {
    const dry = new Vehicle("varro", 0, 0, 0), grav = new Vehicle("varro", 0, 0, 0);
    const gravel: VehicleEnv = { ...flat, surface: () => "gravel" };
    run(dry, 4, { throttle: 1 }); run(grav, 4, { throttle: 1 }, gravel);
    // equalise speed, then corner hard
    grav.vx = dry.vx; grav.vz = dry.vz;
    run(dry, 1.2, { throttle: 0.4, steer: 1 }); run(grav, 1.2, { throttle: 0.4, steer: 1 }, gravel);
    expect(dry.yaw).toBeGreaterThan(grav.yaw);
  });

  it("damage reduces condition, stalls at zero and repair restores it", () => {
    const v = new Vehicle("pella", 0, 0, 0);
    v.damage(10);
    expect(v.health).toBeLessThan(100);
    for (let i = 0; i < 10; i++) v.damage(15);
    expect(v.health).toBe(0);
    expect(v.stalled).toBe(true);
    run(v, 2, { throttle: 1 });
    expect(v.speed).toBeLessThan(0.5);
    v.repair();
    expect(v.health).toBe(100);
    expect(v.stalled).toBe(false);
  });

  it("goes airborne off the quay and sinks in the harbor", () => {
    const harbor: VehicleEnv = { ...flat, height: (_x, z) => (z > 10 ? -6 : 0), water: (_x, z) => (z > 10 ? -0.8 : null) };
    const v = new Vehicle("varro", 0, 0, 0);
    run(v, 4, { throttle: 1 }, harbor);
    expect(v.sinking).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(-1);
  });

  it("motorcycle leans into turns and stays bounded", () => {
    const v = new Vehicle("vanta", 0, 0, 0);
    run(v, 3, { throttle: 1 });
    run(v, 1, { throttle: 0.5, steer: 1 });
    expect(v.lean).toBeGreaterThan(0.1);
    expect(v.lean).toBeLessThan(0.81);
  });

  it("walls stop the car without penetration and cause damage", () => {
    const g = new Game();
    const v = new Vehicle("varro", -55, 64, Math.PI, 0); // heading south toward the canal railing
    v.y = g.heightAt(v.x, v.z);
    g.addVehicle(v);
    for (let i = 0; i < 240; i++) g.stepVehicle(v, 1 / 60, { throttle: 1, brake: 0, steer: 0, handbrake: false });
    for (const c of g.world.query(v.x - 4, v.z - 4, v.x + 4, v.z + 4)) {
      if (c.y1 < v.y + 0.45 || c.y0 > v.y + v.spec.height) continue;
      const r = satORectAabb(v.rect, c);
      expect(!r || r.depth < 0.2).toBe(true);
    }
    expect(v.z).toBeGreaterThan(56);
    expect(v.health).toBeLessThan(100);
  });
});
