import { describe, it, expect } from "vitest";
import { Game } from "../src/sim/game";
import { Character, stepFoot, JUMP_V } from "../src/sim/character";
import { newInventory, buy, canBuy, addTrust, equip, applyArmor, damageAt, WEAPONS, MEDKIT_MAX } from "../src/sim/weapons";
import { StaticWorld } from "../src/world/collision";
import { bindingConflicts, DEFAULT_BINDS } from "../src/input/input";

describe("economy & progression", () => {
  it("shop purchases respect cash, carry limits and Trust gates", () => {
    const inv = newInventory();
    inv.cash = 1000;
    expect(buy(inv, { kind: "medkit" })).toBe(true);
    expect(inv.medkits).toBe(MEDKIT_MAX);
    expect(canBuy(inv, { kind: "medkit" })).toMatch(/max/);
    expect(canBuy(inv, { kind: "weapon", weapon: "marksman" })).toMatch(/Trust/);
    inv.cash = 10;
    expect(canBuy(inv, { kind: "armor" })).toMatch(/cash/);
  });
  it("Trust levels come from milestones and never change damage", () => {
    const inv = newInventory();
    const d0 = WEAPONS.pistol.damage;
    expect(addTrust(inv, 110)).toBe(1);
    addTrust(inv, 1000);
    expect(inv.trust).toBe(5);
    expect(WEAPONS.pistol.damage).toBe(d0);
  });
  it("carry rules: one sidearm, one long gun", () => {
    const inv = newInventory();
    inv.unlocked.push("pistol", "mpistol", "carbine", "shotgun");
    equip(inv, "pistol"); equip(inv, "mpistol"); equip(inv, "carbine"); equip(inv, "shotgun");
    expect(inv.sidearm).toBe("mpistol");
    expect(inv.long).toBe("shotgun");
  });
  it("armor absorbs 70% and damage falls off with range", () => {
    expect(applyArmor(100, 50, 20)).toEqual({ armor: 36, health: 94 });
    expect(damageAt(WEAPONS.pistol, 100)).toBe(0);
    expect(damageAt(WEAPONS.pistol, 50)).toBeLessThan(WEAPONS.pistol.damage);
  });
  it("controls have no conflicting bindings within a context", () => {
    expect(bindingConflicts(DEFAULT_BINDS)).toEqual([]);
  });
});

describe("on-foot movement", () => {
  const env = (cols: any[] = [], water?: (x: number, z: number) => number | null) => ({ world: new StaticWorld(cols), ground: () => 0, water: water ?? (() => null) });
  it("sprint drains stamina in ~8 s and recovers", () => {
    const g = new Game();
    g.attract = false;
    g.placePlayer(0, -55, 0);
    g.input.moveZ = 1; g.input.sprint = true;
    for (let i = 0; i < 60 * 9; i++) { g.input.moveZ = 1; g.input.sprint = true; g.step(1 / 60); }
    expect(g.stamina).toBeLessThan(0.1);
    g.input.moveZ = 0; g.input.sprint = false;
    for (let i = 0; i < 60 * 5; i++) g.step(1 / 60);
    expect(g.stamina).toBeGreaterThan(7);
  });
  it("jump apex is ~0.85 m", () => {
    const c = new Character("player", "player", {} as any, 0, 0, 0);
    const e = env();
    stepFoot(c, 1 / 60, 0, 0, 0, true, e);
    let apex = 0;
    for (let i = 0; i < 90; i++) { stepFoot(c, 1 / 60, 0, 0, 0, false, e); apex = Math.max(apex, c.y); }
    expect(apex).toBeGreaterThan(0.75);
    expect(apex).toBeLessThan(0.95);
    expect(JUMP_V).toBeCloseTo(4.08, 1);
  });
  it("vaults a 0.9 m wall and mantles onto a 1.5 m crate", () => {
    const wall = { x0: -2, x1: 2, z0: 1, z1: 1.4, y0: 0, y1: 0.9, kind: "wall" };
    const c = new Character("player", "player", {} as any, 0, 0.55, 0);
    const e = env([wall]);
    stepFoot(c, 1 / 60, 0, 1, 4, true, e);
    expect(c.mantle?.kind).toBe("vault");
    for (let i = 0; i < 60; i++) stepFoot(c, 1 / 60, 0, 0, 0, false, e);
    expect(c.z).toBeGreaterThan(1.4);
    const crate = { x0: -2, x1: 2, z0: 1, z1: 4, y0: 0, y1: 1.5, kind: "prop" };
    const d = new Character("player", "player", {} as any, 0, 0.6, 0);
    const e2 = env([crate]);
    stepFoot(d, 1 / 60, 0, 1, 4, true, e2);
    expect(d.mantle?.kind).toBe("mantle");
    for (let i = 0; i < 60; i++) stepFoot(d, 1 / 60, 0, 0, 0, false, e2);
    expect(d.y).toBeCloseTo(1.5, 1);
  });
  it("swims in deep water and climbs out at a low edge", () => {
    const c = new Character("player", "player", {} as any, 0, 0, -1.5);
    const e = { world: new StaticWorld([]), ground: (_x: number, z: number) => (z < 5 ? -6 : 0), water: (_x: number, z: number) => (z < 5 ? -0.8 : null) };
    for (let i = 0; i < 30; i++) stepFoot(c, 1 / 60, 0, 0, 0, false, e);
    expect(c.swimming).toBe(true);
    for (let i = 0; i < 400 && c.z < 5.5; i++) stepFoot(c, 1 / 60, 0, 1, 4, false, e);
    expect(c.z).toBeGreaterThan(5);
    expect(c.y).toBeCloseTo(0, 1);
  });
  it("health regenerates only to 30 after 8 s; death respawns at the clinic with a fee and gear kept", () => {
    const g = new Game();
    g.attract = false;
    g.placePlayer(0, -55, 0);
    g.playerHurt(85, 0, 0);
    for (let i = 0; i < 60 * 7; i++) g.step(1 / 60);
    expect(g.player.health).toBeLessThan(16);
    for (let i = 0; i < 60 * 8; i++) g.step(1 / 60);
    expect(g.player.health).toBeCloseTo(30, 0);
    g.inv.cash = 500;
    const unlocked = [...g.inv.unlocked];
    g.playerHurt(500, 0, 0);
    expect(g.player.alive).toBe(false);
    expect(g.ui.panel).toBe("dead");
    g.respawnAfterDeath();
    expect(g.player.alive).toBe(true);
    expect(g.inv.cash).toBe(400);
    expect(g.inv.unlocked).toEqual(unlocked);
  });
  it("enter and exit every vehicle type; locked cars refuse", async () => {
    const { VEHICLES, Vehicle } = await import("../src/sim/vehicle");
    const g = new Game();
    g.attract = false;
    for (const m of Object.keys(VEHICLES) as any[]) {
      const v = new Vehicle(m, 10, -55, 0, 0);
      v.role = "parked"; v.y = 0;
      g.addVehicle(v);
      g.placePlayer(8.5, -55, 0);
      g.enterVehicle(v);
      expect(g.player.vehicle, m).toBe(v);
      g.exitVehicle(false);
      expect(g.player.vehicle).toBeNull();
      g.removeVehicle(v);
    }
    const locked = new Vehicle("osprey", 10, -55, 0, 0);
    locked.locked = true; g.addVehicle(locked);
    g.enterVehicle(locked);
    expect(g.player.vehicle).toBeNull();
  });
  it("taking an occupied car ejects the driver, who flees", () => {
    const g = new Game();
    g.attract = false;
    g.cam.pos = { x: 0, y: 5, z: -90 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
    const lane = g.roads.lanes.find((l) => l.length > 50)!;
    const v = g.traffic.spawnOnLane(lane, 20);
    const driver = v.crew[0];
    g.placePlayer(v.x + 2, v.z, 0);
    g.enterVehicle(v);
    expect(g.player.vehicle).toBe(v);
    expect(g.chars).toContain(driver);
    expect(g.peds.brainOf(driver)?.state).toBe("Flee");
    expect(g.police.crimes.at(-1)?.type).toBe("theft");
  });
});

describe("living city", () => {
  it("traffic and pedestrians run 2 minutes without red-light running, NaN, or mass path failure", () => {
    const g = new Game();
    g.attract = false;
    g.placePlayer(0, -60, 0);
    g.cam.pos = { x: 0, y: 4, z: -65 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
    g.populate();
    const spawnD: number[] = [];
    const orig = g.addVehicle.bind(g);
    g.addVehicle = (v) => { if (v.role === "civilian") spawnD.push(Math.hypot(v.x - g.focus.x, v.z - g.focus.z)); orig(v); };
    let crossings = 0, waits = 0;
    for (let i = 0; i < 60 * 120; i++) {
      g.step(1 / 60);
      if (i % 30 === 0) for (const c of g.peds.list) { const s = g.peds.brainOf(c)!.state; if (s === "CrossStreet") crossings++; if (s === "WaitSignal") waits++; }
    }
    expect(g.traffic.redViolations).toBe(0);
    for (const v of g.vehicles) expect(Number.isFinite(v.x + v.z + v.yaw)).toBe(true);
    expect(g.peds.list.length).toBeGreaterThan(20);
    expect(g.peds.pathFailures).toBeLessThan(40);
    expect(crossings).toBeGreaterThan(0);
    expect(waits).toBeGreaterThan(0);
    for (const d of spawnD) expect(d).toBeGreaterThanOrEqual(89);
  });
  it("gunfire produces varied pedestrian reactions and traffic panic", () => {
    const g = new Game();
    g.attract = false;
    g.placePlayer(-50, -200, 0);
    g.cam.pos = { x: -50, y: 4, z: -205 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
    g.populate();
    for (let i = 0; i < 60; i++) g.step(1 / 60);
    g.peds.stimulus("gunfire", -50, -200, 60);
    for (let i = 0; i < 90; i++) g.step(1 / 60);
    const states = new Set(g.peds.list.map((c) => g.peds.brainOf(c)!.state));
    const reacting = ["Flee", "Hide", "Panic", "ReactCurious", "CallEmergency"].filter((s) => states.has(s as any));
    expect(reacting.length).toBeGreaterThanOrEqual(2);
  });
  it("hitting a pedestrian with a car knocks them down non-graphically and is a crime", async () => {
    const g = new Game();
    g.attract = false;
    const { Vehicle } = await import("../src/sim/vehicle");
    const v = new Vehicle("varro", 0, -70, 0, 0);
    v.y = 0; v.vz = 14;
    g.addVehicle(v);
    g.placePlayer(0, -70, 0);
    g.enterVehicle(v);
    const ped = g.peds.spawnAt(g.roads.nearestPed(0, -66));
    ped.x = 0; ped.z = -66.5; ped.y = 0;
    const b = g.peds.brainOf(ped)!; b.state = "Browse"; b.timer = 99; b.path = [];
    v.vx = 0; v.vz = 14;
    for (let i = 0; i < 20; i++) { g.input.throttle = 1; g.step(1 / 60); }
    expect(ped.status).not.toBe("normal");
    expect(g.stats.civHarm).toBeGreaterThan(0);
    expect(g.police.crimes.some((c) => c.type === "collision" || c.type === "murder")).toBe(true);
  });
});
