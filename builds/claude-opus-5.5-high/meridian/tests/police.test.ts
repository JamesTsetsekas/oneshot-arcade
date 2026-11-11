import { describe, it, expect } from "vitest";
import { Game } from "../src/sim/game";
import { Character } from "../src/sim/character";
import { SEARCH_TIME } from "../src/sim/police";

function setup(px = 10, pz = -55) {
  const g = new Game();
  g.attract = false;
  g.placePlayer(px, pz, 0);
  g.cam.pos = { x: px, y: 3, z: pz - 4 }; g.cam.fwd = { x: 0, y: 0, z: 1 };
  g.police.patrolTarget = 0;
  return g;
}
const steps = (g: Game, secs: number) => { for (let i = 0; i < secs * 60; i++) g.step(1 / 60); };
function addPed(g: Game, x: number, z: number, yaw = 0) {
  const id = g.roads.nearestPed(x, z);
  const c = g.peds.spawnAt(id);
  c.x = x; c.z = z; c.y = g.groundAt(x, z); c.yaw = yaw; c.savePrev();
  const b = g.peds.brainOf(c)!; b.state = "Browse"; b.timer = 999; b.path = [];
  return c;
}
function addCop(g: Game, x: number, z: number, yaw: number) {
  const c = new Character("police", "police", g.makeLook("police", g.rng), x, z, g.groundAt(x, z));
  c.yaw = yaw;
  g.combat.add(c, "police", { weapon: "pistol" });
  return c;
}

describe("crime evidence & witnesses", () => {
  it("an unwitnessed crime creates no Alert", () => {
    const g = setup();
    g.police.reportCrime("theft", 10, -55);
    steps(g, 8);
    expect(g.police.tier).toBe(0);
    expect(g.police.crimes[0].reported).toBe(false);
  });

  it("a civilian with line of sight phones it in after a 2–5 s call", () => {
    const g = setup();
    const w = addPed(g, 12, -50, Math.PI);
    const cr = g.police.reportCrime("theft", 10, -55);
    expect(cr.witnesses).toContain(w.id);
    expect(g.police.state).toBe("Witness Reporting");
    steps(g, 1.8);
    expect(g.police.tier).toBe(0); // still dialling
    steps(g, 6);
    expect(cr.reported).toBe(true);
    expect(g.police.tier).toBe(1);
    expect(g.police.identified).toBe(true);
    expect(cr.suspect.outfit).toBe(g.inv.outfit);
  });

  it("a civilian behind a building does not witness", () => {
    const g = setup();
    const b = g.d.buildings.find((q) => q.x1 - q.x0 > 12 && q.z1 - q.z0 > 12 && q.topY - q.baseY > 8 && q.style !== "glass")!;
    const midX = (b.x0 + b.x1) / 2;
    // crime on one side, ped on the far side
    const cz = b.z0 - 3, pzz = b.z1 + 3;
    g.placePlayer(midX, cz, 0);
    addPed(g, midX, pzz, Math.PI);
    const cr = g.police.reportCrime("theft", midX, cz);
    expect(cr.witnesses.length).toBe(0);
  });

  it("a distraction chirper interrupts the witness call (nonviolent)", () => {
    const g = setup();
    const w = addPed(g, 12, -50, Math.PI);
    const cr = g.police.reportCrime("theft", 10, -55);
    steps(g, 1.6);
    expect(w.phoneUp).toBe(true);
    g.peds.stimulus("chirper", 13, -49, 20);
    steps(g, 6);
    expect(cr.reported).toBe(false);
    expect(g.police.tier).toBe(0);
  });

  it("police observation identifies immediately and starts pursuit", () => {
    const g = setup();
    addCop(g, 10, -40, Math.PI); // 15 m north, facing south toward the player
    g.police.reportCrime("assault", 10, -55);
    expect(g.police.tier).toBe(2);
    expect(g.police.state).toBe("Pursuit");
  });

  it("escalates with severity and caps free-roam response at Tier 4", () => {
    const g = setup();
    addCop(g, 10, -40, Math.PI);
    g.police.reportCrime("gunfire", 10, -55);
    expect(g.police.tier).toBe(2);
    g.police.escalate("attackPolice", 10, -55);
    expect(g.police.tier).toBe(3);
    for (let i = 0; i < 6; i++) g.police.escalate("killPolice", 10, -55);
    expect(g.police.tier).toBe(4);
  });
});

describe("pursuit, search, disguise & cooldown", () => {
  it("pursuit becomes search when sight is broken, then cools down to Tier 0", () => {
    const g = setup();
    const cop = addCop(g, 10, -40, Math.PI);
    g.police.reportCrime("theft", 10, -55);
    expect(g.police.state).toBe("Pursuit");
    cop.removeMe = true; g.combat.remove(cop);
    g.police.budget = 0; // no reinforcements for this unit test
    steps(g, 4);
    expect(["Search", "Cooling"]).toContain(g.police.state);
    steps(g, SEARCH_TIME[1] + 2);
    expect(g.police.tier).toBe(0);
    expect(g.police.state).toBe("Unnoticed");
  });

  it("changing outfit out of sight breaks recognition at range", () => {
    const g = setup();
    g.inv.outfits.push(2);
    const cop = addCop(g, 10, -40, Math.PI);
    g.police.reportCrime("theft", 10, -55);
    cop.removeMe = true; g.combat.remove(cop); g.police.budget = 0;
    steps(g, 4);
    expect(g.police.state).not.toBe("Pursuit");
    g.setOutfit(2);
    // a new officer looks at the player from 25 m: no match
    addCop(g, 10, -30, Math.PI);
    steps(g, 2);
    expect(g.police.state).not.toBe("Pursuit");
    // but a close look eventually re-identifies
    const near = addCop(g, 10, -47, Math.PI);
    steps(g, 4);
    expect(g.police.state).toBe("Pursuit");
    void near;
  });

  it("units are capped and spawn from valid portals out of view", () => {
    const g = setup(0, -60);
    g.police.forceTier(4);
    g.police.budget = 100;
    let maxUnits = 0;
    const spawned: number[] = [];
    const orig = g.addVehicle.bind(g);
    g.addVehicle = (v) => { if (v.role === "police") spawned.push(Math.hypot(v.x - g.focus.x, v.z - g.focus.z)); orig(v); };
    for (let i = 0; i < 60 * 45; i++) { g.step(1 / 60); maxUnits = Math.max(maxUnits, g.police.units.length); }
    expect(maxUnits).toBeLessThanOrEqual(6);
    expect(spawned.length).toBeGreaterThan(0);
    // roadblocks are placed ahead (>=100 m); patrol/response spawns >= 80 m away
    for (const d of spawned) expect(d).toBeGreaterThan(79);
  });

  it("arrest at low threat: complying pays a fine and resumes at the precinct", () => {
    const g = setup();
    const cop = addCop(g, 10, -53.5, Math.PI);
    g.police.reportCrime("theft", 10, -55);
    expect(g.police.tier).toBe(1);
    g.inv.cash = 1000;
    g.police.arrestAttempt(cop);
    expect(g.police.arrest).not.toBeNull();
    g.input.interactHeld = true;
    for (let i = 0; i < 100 && g.stats.arrests === 0; i++) { g.input.interactHeld = true; g.step(1 / 60); }
    expect(g.stats.arrests).toBe(1);
    expect(g.police.tier).toBe(0);
    expect(g.inv.cash).toBeLessThan(1000);
    expect(Math.hypot(g.player.x - g.d.spawns.precinct.x, g.player.z - g.d.spawns.precinct.z)).toBeLessThan(2);
  });

  it("resisting arrest (running away) escalates to pursuit", () => {
    const g = setup();
    const cop = addCop(g, 10, -53.5, Math.PI);
    g.police.reportCrime("theft", 10, -55);
    g.police.arrestAttempt(cop);
    cop.knock(5, "stunned"); // keep the officer from following for this check
    g.placePlayer(10, -70, 0);
    g.police.arrest!.officer = cop; cop.status = "normal";
    g.step(1 / 60);
    expect(g.police.arrest).toBeNull();
    expect(g.police.tier).toBe(2);
  });
});
