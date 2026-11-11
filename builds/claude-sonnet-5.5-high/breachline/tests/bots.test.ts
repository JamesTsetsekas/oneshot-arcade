import { describe, expect, it } from "vitest";
import { advance, makeWorld, place } from "./helpers";
import { defaultLoadouts } from "../src/shared/content/loadout";
import { World } from "../src/shared/sim/world";
import type { Difficulty } from "../src/shared/sim/types";

function botMatch(cfg: { seed: number; difficulty: Difficulty; timeLimit: number; scoreLimit?: number }): World {
  const w = makeWorld({ warmup: 0.2, ...cfg });
  const l = defaultLoadouts();
  for (let i = 0; i < 6; i++) {
    w.addPlayer({ name: `Bot A${i}`, team: 0, isBot: true, loadout: l[i % 5] });
    w.addPlayer({ name: `Bot B${i}`, team: 1, isBot: true, loadout: l[(i + 1) % 5] });
  }
  return w;
}

describe("bots", () => {
  it("have no wall vision: a silent enemy behind a wall is never acquired", () => {
    const w = makeWorld({ warmup: 0.05 });
    const l = defaultLoadouts();
    const bot = w.addPlayer({ name: "bot", team: 0, isBot: true, loadout: l[0] });
    const foe = w.addPlayer({ name: "foe", team: 1, isBot: false, loadout: l[0] });
    advance(w, 0.5);
    bot.spawnProtectedUntil = 0; foe.spawnProtectedUntil = 0;
    // bot inside the control room, foe in the hall behind the wall (no line of sight, silent, stationary)
    for (let i = 0; i < 180; i++) {
      place(bot, -33, 6, Math.PI / 2 + 1.0); // look at the wall
      place(foe, -41, 8, 0);
      w.tick();
      const brain = w.brains.get(bot.id)!;
      expect(brain.target).toBe(-1);
      expect(brain.state).not.toBe("engage");
      expect(w.col.lineClear({ x: -33, y: 1.6, z: 6 }, { x: -41, y: 1.6, z: 8 })).toBe(false);
    }
  });
  it("react with a delay: no fire before the target is perceptually acquired", () => {
    const w = makeWorld({ warmup: 0.05, difficulty: "normal" });
    const l = defaultLoadouts();
    const bot = w.addPlayer({ name: "bot", team: 0, isBot: true, loadout: l[0] });
    const foe = w.addPlayer({ name: "foe", team: 1, isBot: false, loadout: l[0] });
    advance(w, 0.5);
    bot.spawnProtectedUntil = 0; foe.spawnProtectedUntil = 0;
    place(bot, -20, 0, Math.PI / 2);
    place(foe, -5, 0, 0);
    const brain = w.brains.get(bot.id)!;
    brain.target = -1; brain.acquire.clear(); brain.lastKnown = null; brain.aimYaw = Math.PI / 2;
    const startShots = bot.weapons[0].shotsFired;
    let firstEngageT = -1, firstShotT = -1;
    for (let i = 0; i < 120; i++) {
      place(foe, -5, 0, 0); foe.spawnProtectedUntil = 0; foe.health = 100;
      place(bot, -20, 0, Math.PI / 2); brain.aimYaw = Math.PI / 2; // the bot is watching this lane
      w.tick();
      if (brain.state === "engage" && firstEngageT < 0) firstEngageT = w.time;
      if (bot.weapons[0].shotsFired > startShots && firstShotT < 0) firstShotT = w.time;
    }
    expect(firstEngageT).toBeGreaterThan(0);
    expect(firstShotT).toBeGreaterThanOrEqual(firstEngageT);
  });
  it("blind (flashed) bots do not see", () => {
    const w = makeWorld({ warmup: 0.05 });
    const l = defaultLoadouts();
    const bot = w.addPlayer({ name: "bot", team: 0, isBot: true, loadout: l[0] });
    const foe = w.addPlayer({ name: "foe", team: 1, isBot: false, loadout: l[0] });
    advance(w, 0.5);
    place(bot, -20, 0, Math.PI / 2); place(foe, -10, 0, 0);
    bot.flashedUntil = w.time + 5;
    const brain = w.brains.get(bot.id)!;
    for (let i = 0; i < 120; i++) { place(foe, -10, 0, 0); w.tick(); bot.flashedUntil = w.time + 5; }
    expect(brain.target).toBe(-1);
  });
  it("a full 6v6 bot match reaches a winner without stalling (normal difficulty)", () => {
    const w = botMatch({ seed: 21, difficulty: "normal", timeLimit: 150, scoreLimit: 75 });
    let guard = 0;
    while (w.match.phase !== "ended" && guard++ < 60 * 400) w.tick();
    expect(w.match.phase).toBe("ended");
    const kills = w.players.reduce((s, p) => s + p.stats.kills, 0);
    const deaths = w.players.reduce((s, p) => s + p.stats.deaths, 0);
    expect(kills).toBeGreaterThan(20);
    expect(Math.abs(kills - deaths)).toBeLessThanOrEqual(2);
    expect(w.match.teamScore[0] + w.match.teamScore[1]).toBe(kills);
    expect([0, 1, 2]).toContain(w.match.winner);
    // spread of contribution: nobody should be a statue
    const idle = w.players.filter((p) => p.stats.shots === 0).length;
    expect(idle).toBeLessThanOrEqual(2);
    // sim cost
    expect(w.tickMs).toBeLessThan(8);
  });
  it("bots use equipment and support actions during a match", () => {
    const w = botMatch({ seed: 5, difficulty: "hard", timeLimit: 200 });
    const used = new Set<string>();
    let throws = 0;
    let guard = 0;
    while (w.match.phase !== "ended" && guard++ < 60 * 260) {
      w.tick();
      for (const e of w.drainEvents()) { if (e.t === "supportUse") used.add(e.support); if (e.t === "throw") throws++; }
    }
    expect(throws).toBeGreaterThan(0);
    expect(used.size).toBeGreaterThan(0);
  });
  it("difficulty changes skill parameters, not health or damage", () => {
    const e = botMatch({ seed: 1, difficulty: "easy", timeLimit: 10 });
    const h = botMatch({ seed: 1, difficulty: "hard", timeLimit: 10 });
    e.tick(); h.tick();
    advance(e, 1); advance(h, 1);
    expect(e.players[0].health).toBe(h.players[0].health);
    expect(e.players[0].weapons[0].stats.damage).toBe(h.players[0].weapons[0].stats.damage);
    expect(e.brains.get(0)!.skill.react).toBeGreaterThan(h.brains.get(0)!.skill.react);
  });
});
