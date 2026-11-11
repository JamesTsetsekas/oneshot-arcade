import { describe, it, expect } from "vitest";
import { MissionRunner, validateMission, MISSION_SCHEMA_VERSION, type MissionDef, type MissionHost, type Marker } from "../src/sim/missions/runtime";
import { STORY, FIRST_SHIFT, LOST_MANIFEST, HOT_CARGO, SIGNAL_BREAKWATER, nextStory } from "../src/sim/missions/story";
import { generateCourier, circuitDef, generateRecovery, courierPayout, CIRCUIT_POINTS } from "../src/sim/missions/activities";
import { Game } from "../src/sim/game";

class MockHost implements MissionHost {
  t = 0; pos = { x: 0, z: 0 }; vtag: string | null = null; speed = 0; foot = true; dead = false; tier = 0;
  vehicles = new Map<string, any>(); pressed = new Set<string>(); flags = new Set<string>(); choice: number | null = null;
  markers: Marker[] = []; objective = ""; spawned: any[] = []; rewards: any[] = []; paid = new Set<string>(); cleaned = 0; restored: any = null; lock: any = "idle";
  now() { return this.t; } playerPos() { return this.pos; } playerVehicleTag() { return this.vtag; } playerVehicleSpeed() { return this.speed; }
  playerOnFoot() { return this.foot; } playerDead() { return this.dead; } alertTier() { return this.tier; }
  vehicleByTag(t: string) { return this.vehicles.get(t) ?? null; }
  consumeInteract(id: string) { return this.pressed.delete(id); }
  lockpick() { return this.lock; }
  choose() { const c = this.choice; this.choice = null; return c; }
  flag(n: string) { return this.flags.has(n); } setFlag(n: string, v: boolean) { v ? this.flags.add(n) : this.flags.delete(n); }
  setMarkers(m: Marker[]) { this.markers = m; } setObjective(t: string) { this.objective = t; }
  say(lines: any[]) { return lines.length * 0.5; }
  spawn(r: any) { this.spawned.push(r); } setWorld() {} cleanup() { this.cleaned++; }
  restoreCheckpoint(s: any) { this.restored = s; }
  reward(cash: number, trust: number, unlocks: string[], key: string, replay: boolean) { if (replay || this.paid.has(key)) return false; this.paid.add(key); this.rewards.push({ cash, trust, unlocks }); return true; }
  civHarm() { return 0; } damageTaken() { return 0; } packageIntegrity() { return 100; } circuitEvent() {}
}
const tick = (r: MissionRunner, h: MockHost, secs = 0.1) => { for (let i = 0; i < Math.max(1, secs * 60); i++) { h.t += 1 / 60; r.update(1 / 60, h); } };

describe("mission graphs", () => {
  it("all story missions and generated activities validate", () => {
    for (const m of STORY) expect(validateMission(m), m.id).toEqual([]);
    const anchors = Array.from({ length: 50 }, (_, i) => ({ x: (i % 10) * 90 - 400, z: Math.floor(i / 10) * 150 - 350 }));
    expect(validateMission(generateCourier(1, anchors, { x: 0, z: 0 }, 2))).toEqual([]);
    expect(validateMission(circuitDef())).toEqual([]);
    expect(validateMission(generateRecovery(3, anchors.map((a) => ({ ...a, yaw: 0 })), { x: 0, z: 0 }).def)).toEqual([]);
  });
  it("story graphs use the required node types", () => {
    const types = new Set(STORY.flatMap((m) => Object.values(m.nodes).map((n) => n.type)));
    for (const t of ["start", "objective", "dialogue", "spawn", "world", "branch", "trigger", "checkpoint", "reward", "cleanup", "end"]) expect(types.has(t as any), t).toBe(true);
  });
  it("rejects unknown schema versions", () => {
    expect(() => new MissionRunner({ ...FIRST_SHIFT, schema: MISSION_SCHEMA_VERSION + 1 })).toThrow();
  });
  it("runs First Shift to completion and pays once", () => {
    const h = new MockHost();
    const r = new MissionRunner(FIRST_SHIFT);
    r.begin(h);
    tick(r, h, 2); // dialogue
    expect(h.objective).toMatch(/Kestrel/);
    h.vtag = "kestrel"; h.foot = false; tick(r, h);
    h.pos = { x: -80, z: -110 }; tick(r, h);
    h.foot = true; h.vtag = null; h.pressed.add("mara_pkg"); tick(r, h);
    tick(r, h, 3);
    h.vtag = "kestrel"; h.foot = false; tick(r, h);
    h.pos = { x: -103, z: 245 }; h.speed = 0.5; tick(r, h);
    h.foot = true; h.vtag = null; h.pressed.add("calder_door"); tick(r, h);
    tick(r, h, 4);
    expect(r.status).toBe("complete");
    expect(h.rewards.length).toBe(1);
    expect(r.grade?.letter).toMatch(/[SABCD]/);
    // replay never pays again
    const r2 = new MissionRunner(FIRST_SHIFT, true);
    r2.begin(h);
    expect(h.rewards.length).toBe(1);
  });
  it("fails for defined reasons and retries from the last checkpoint", () => {
    const h = new MockHost();
    const r = new MissionRunner(HOT_CARGO);
    r.begin(h);
    tick(r, h, 4);
    h.pressed.add("hc_w1"); tick(r, h); tick(r, h, 3);
    h.pressed.add("hc_w2"); tick(r, h); tick(r, h, 3);
    expect(r.checkpointNode).toBe("cp");
    h.vehicles.set("hot_van", { x: 100, z: 160, speed: 10, health: 0, cargo: 100, stalled: false, driverPresent: true });
    tick(r, h);
    expect(r.status).toBe("failed");
    expect(r.failReason).toMatch(/wrecked/);
    h.vehicles.set("hot_van", { x: 100, z: 160, speed: 10, health: 100, cargo: 100, stalled: false, driverPresent: true });
    const spawnedBefore = h.spawned.length;
    r.retry(h);
    expect(r.status).toBe("running");
    expect(h.restored).toEqual({ x: 193.8, z: -146, yaw: 0 });
    expect(h.spawned.length).toBeGreaterThan(spawnedBefore); // van respawned after checkpoint
    expect(r.current.id).toBe("chase");
  });
  it("branches on player choice (Lost Manifest front-gate bluff)", () => {
    const h = new MockHost();
    const r = new MissionRunner(LOST_MANIFEST);
    r.begin(h); tick(r, h, 3);
    h.pos = { x: -300, z: -180 }; tick(r, h);
    expect(r.current.id).toBe("choice");
    h.choice = 1; tick(r, h);
    expect(r.current.id).toBe("front_go");
    h.pressed.add("foreman"); tick(r, h);
    h.choice = 0; tick(r, h); tick(r, h, 2);
    expect(r.current.id).toBe("photos");
    for (const id of ["man1", "man2", "man3"]) h.pressed.add(id);
    tick(r, h);
    h.pos = { x: -100, z: -100 }; tick(r, h); tick(r, h, 2);
    tick(r, h, 4);
    expect(r.status).toBe("complete");
    expect(h.rewards[0].unlocks).toContain("pistol");
  });
  it("abandon cleans up reserved actors", () => {
    const h = new MockHost();
    const r = new MissionRunner(SIGNAL_BREAKWATER);
    r.begin(h); tick(r, h, 4);
    h.pos = { x: 250, z: -296 }; tick(r, h);
    expect(h.spawned.length).toBe(3);
    r.abandon(h);
    expect(r.status).toBe("abandoned");
    expect(h.cleaned).toBe(1);
  });
  it("story order unlocks one mission at a time", () => {
    expect(nextStory([])?.id).toBe("first_shift");
    expect(nextStory(["first_shift"])?.id).toBe("lost_manifest");
    expect(nextStory(STORY.map((s) => s.id))).toBeNull();
  });
});

describe("activities", () => {
  const anchors = Array.from({ length: 80 }, (_, i) => ({ x: (i % 10) * 85 - 380, z: Math.floor(i / 10) * 95 - 360 }));
  it("courier runs pair distinct anchors 220–650 m apart and pay by distance & modifiers", () => {
    for (let s = 1; s < 30; s++) {
      const def = generateCourier(s, anchors, { x: 0, z: 0 }, 3);
      const p: any = (def.nodes.p as any).obj, d: any = (def.nodes.d as any).obj;
      const dist = Math.hypot(p.x - d.x, p.z - d.z);
      expect(dist).toBeGreaterThanOrEqual(220);
      expect(dist).toBeLessThanOrEqual(650);
      expect(def.reward.cash).toBeGreaterThan(0);
    }
    expect(courierPayout(400, ["fragile", "urgent"])).toBeGreaterThan(courierPayout(400, []));
  });
  it("street circuit counts laps, finishes and pays the first finish once", () => {
    const h = new MockHost();
    const r = new MissionRunner(circuitDef());
    r.begin(h);
    h.vtag = "x"; h.foot = false; h.pos = { x: 205, z: -94 }; tick(r, h);
    tick(r, h, 3);
    for (let lap = 0; lap < 3; lap++) for (const p of CIRCUIT_POINTS) { h.pos = { ...p }; tick(r, h, 0.5); }
    tick(r, h);
    expect(r.status).toBe("complete");
    expect(r.lap).toBe(3);
    expect(h.rewards.length).toBe(1);
    const again = new MissionRunner(circuitDef());
    again.begin(h); h.pos = { x: 205, z: -94 }; tick(r, h);
    expect(h.rewards.length).toBe(1);
  });
  it("recovery spawns its target and completes on delivery", () => {
    const g = generateRecovery(9, anchors.map((a) => ({ ...a, yaw: 0 })), { x: 0, z: 0 });
    const h = new MockHost();
    const r = new MissionRunner(g.def);
    r.begin(h);
    expect(h.spawned[0].tag).toBe("recovery");
    h.vehicles.set("recovery", { x: g.spot.x, z: g.spot.z, speed: 0, health: 90, cargo: 100, stalled: false, driverPresent: false });
    h.pos = { x: g.spot.x, z: g.spot.z }; tick(r, h, 0.5);
    h.vtag = "recovery"; h.pos = { x: -150, z: -353 }; h.speed = 0; tick(r, h);
    tick(r, h);
    expect(r.status).toBe("complete");
    expect(h.rewards.length).toBe(1);
  });
});

describe("missions inside the live game", () => {
  it("New Game → First Shift via real interactions → reward → save/reload → next story", () => {
    const g = new Game();
    g.cam.pos = { x: -55, y: 10, z: 70 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
    g.newGame();
    const st = (s: number) => { for (let i = 0; i < s * 60; i++) g.advance(1 / 60); };
    st(9);
    expect(g.ui.objective).toMatch(/Kestrel/);
    const k = g.vehicles.find((v) => v.tag === "kestrel")!;
    g.placePlayer(k.x - 1.2, k.z, 0);
    g.input.interactPressed = true; st(0.2);
    expect(g.player.vehicle).toBe(k);
    k.x = -80; k.z = -106; k.vx = k.vz = 0; st(0.5);
    g.exitVehicle(false);
    g.placePlayer(-80, -124, 0); st(0.2);
    expect(g.ui.prompt).toMatch(/package/i);
    g.input.interactPressed = true; st(0.2);
    st(12);
    expect(g.mission?.current.id).toBe("bike2");
    g.placePlayer(k.x - 1.2, k.z, 0); g.input.interactPressed = true; st(0.2);
    expect(g.player.vehicle).toBe(k);
    k.x = -103; k.z = 245; k.vx = k.vz = 0; k.y = g.heightAt(k.x, k.z); st(0.5);
    g.exitVehicle(false); g.placePlayer(-106.5, 250, 0); st(0.2);
    g.input.interactPressed = true; st(0.2);
    st(14);
    expect(g.progress.storyDone).toContain("first_shift");
    expect(g.inv.cash).toBeGreaterThanOrEqual(400);
    expect(g.inv.trust).toBe(1);
    const snap = g.snapshot("test");
    const g2 = new Game();
    g2.applySnapshot(JSON.parse(JSON.stringify(snap)));
    expect(g2.progress.storyDone).toContain("first_shift");
    expect(g2.inv.cash).toBe(g.inv.cash);
    expect(nextStory(g2.progress.storyDone)?.id).toBe("lost_manifest");
    // replay from the board doesn't duplicate rewards and restores the real inventory
    const cash = g.inv.cash;
    g.closePanel();
    g.startMission(FIRST_SHIFT, true);
    expect(g.mission?.replay).toBe(true);
    g.abandonMission(false);
    expect(g.inv.cash).toBe(cash);
  });
  it("abandoning Signal at the Breakwater removes its spawned guards", () => {
    const g = new Game();
    g.attract = false;
    g.progress.storyDone = ["first_shift", "lost_manifest", "hot_cargo"];
    g.startMission(SIGNAL_BREAKWATER, false);
    for (let i = 0; i < 60 * 14; i++) g.step(1 / 60);
    g.placePlayer(250, -296, 0);
    for (let i = 0; i < 10; i++) g.step(1 / 60);
    expect(g.chars.filter((c) => c.tag === "signal_breakwater").length).toBe(3);
    g.abandonMission(false);
    g.step(1 / 60);
    expect(g.chars.filter((c) => c.tag === "signal_breakwater").length).toBe(0);
    expect(g.mission).toBeNull();
  });
});
