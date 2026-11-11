import { describe, it, expect } from "vitest";
import { chooseSpawn, isCandidateSafe } from "../src/server/spawn";
import { CollisionWorld } from "../src/shared/collision";
import { K17 } from "../src/content/map-k17";
import { Rng, vdist } from "../src/shared/math";
import { Room } from "../src/server/room";
import { BotBrain } from "../src/server/bots";
import { DEFAULT_LOADOUTS } from "../src/content/loadout";
import { findPath, nearestNode, mainNodes } from "../src/server/nav";
import { fits } from "../src/shared/movement";
import { MOVE } from "../src/content/tuning";

const world = new CollisionWorld(K17.boxes.map((b) => ({ ...b, min: { ...b.min }, max: { ...b.max } })));
const candidates = K17.spawnCandidates.filter((c) => fits(world, c.pos.x, c.pos.y, c.pos.z, MOVE.standHeight));

describe("spawn director", () => {
  it("never picks a candidate with enemy sight inside the unsafe distance when a safe one exists (10,000 respawns)", () => {
    const rng = new Rng(2024);
    const room = new Room({ seed: 1, local: null, botsPerTeam: [0, 0] });
    const nodes = mainNodes(room.nav);
    let safePicked = 0, unsafeWhenSafeExisted = 0, noSafe = 0;
    for (let i = 0; i < 10000; i++) {
      const team = (i % 2) as 0 | 1;
      const enemies = Array.from({ length: rng.int(1, 7) }, () => ({ ...room.nav.nodes[nodes[rng.int(0, nodes.length)]].pos }));
      const choice = chooseSpawn({ world, candidates, team, enemies, teammates: [], occupied: [], recentDeaths: [], dangers: [] }, rng);
      const anySafe = candidates.some((c) => isCandidateSafe(world, c.pos, enemies).safe);
      const pickedSafe = isCandidateSafe(world, choice.pos, enemies).safe;
      if (pickedSafe) safePicked++;
      if (anySafe && !pickedSafe) unsafeWhenSafeExisted++;
      if (!anySafe) noSafe++;
      expect(choice.reason.length).toBeGreaterThan(0);
    }
    expect(unsafeWhenSafeExisted).toBe(0);
    expect(safePicked + noSafe).toBe(10000);
  });

  it("prefers the home side when uncontested and keeps an audit reason", () => {
    const c = chooseSpawn({ world, candidates, team: 0, enemies: [{ x: 50, y: 0, z: 0 }], teammates: [], occupied: [], recentDeaths: [], dangers: [] }, new Rng(1));
    expect(c.pos.x).toBeLessThan(-40);
    expect(c.reason).toMatch(/home/);
  });
});

describe("navigation", () => {
  it("connects both staging areas through all three lanes", () => {
    const room = new Room({ seed: 1, local: null, botsPerTeam: [0, 0] });
    const a = nearestNode(room.nav, { x: -53, y: 0, z: 0 }), b = nearestNode(room.nav, { x: 53, y: 0, z: 0 });
    const path = findPath(room.nav, a, b);
    expect(path).not.toBeNull();
    for (const via of [{ x: 0, y: 2.4, z: 38 }, { x: 0, y: 0, z: 8 }, { x: 0, y: 0, z: -28 }, { x: 0, y: -3.2, z: -11.5 }]) {
      const n = nearestNode(room.nav, via);
      expect(findPath(room.nav, a, n), JSON.stringify(via)).not.toBeNull();
      expect(findPath(room.nav, n, b), JSON.stringify(via)).not.toBeNull();
    }
  });

  it("spawn-to-centre travel is about 10-13 s at walking speed", () => {
    const room = new Room({ seed: 1, local: null, botsPerTeam: [0, 0] });
    const a = nearestNode(room.nav, { x: -53, y: 0, z: 0 }), c = nearestNode(room.nav, { x: -5, y: 0, z: 6 });
    const path = findPath(room.nav, a, c)!;
    let len = 0;
    for (let i = 1; i < path.length; i++) len += vdist(room.nav.nodes[path[i - 1]].pos, room.nav.nodes[path[i]].pos);
    const secs = len / MOVE.standSpeed;
    expect(secs).toBeGreaterThan(8);
    expect(secs).toBeLessThan(14);
  });
});

describe("bots", () => {
  it("cannot see through walls and respect obscurant volumes", () => {
    const room = new Room({ seed: 5, local: { name: "T", loadout: DEFAULT_LOADOUTS[0] }, botsPerTeam: [1, 1], warmup: 0.02 });
    const bot = room.players.find((p) => p.team === 1)!;
    const human = room.get(room.localId)!;
    const brain = bot.brain!;
    // inside the ops control room vs outside west wall
    bot.move.pos = { x: -36, y: 0, z: 0 }; human.move.pos = { x: -50, y: 0, z: 0 };
    brain.yaw = -Math.PI / 2;
    expect(brain.canSee(room, bot, human)).toBe(false);
    // open courtyard line of sight
    bot.move.pos = { x: 10, y: 0, z: -8 }; human.move.pos = { x: -10, y: 0, z: -8 };
    expect(brain.canSee(room, bot, human)).toBe(true);
    room.smokes.push({ id: 1, pos: { x: 0, y: 0, z: -8 }, radius: 5.5, t: 4, life: 12 });
    expect(brain.canSee(room, bot, human)).toBe(false);
    room.smokes = [];
    // outside the vision cone (target behind)
    brain.yaw = Math.PI / 2;
    expect(brain.canSee(room, bot, human)).toBe(false);
  });

  it("does not fire before the target is perceptually acquired (reaction delay)", () => {
    const room = new Room({ seed: 9, local: { name: "T", loadout: DEFAULT_LOADOUTS[0] }, botsPerTeam: [1, 1], warmup: 0.02, difficulty: "easy" });
    const bot = room.players.find((p) => p.team === 1)!;
    const human = room.get(room.localId)!;
    for (let i = 0; i < 3; i++) room.tick();
    bot.move.pos = { x: 10, y: 0, z: -8 }; human.move.pos = { x: -10, y: 0, z: -8 };
    human.protectedActive = false;
    const brain = bot.brain as BotBrain;
    brain.yaw = -Math.PI / 2; brain.pitch = 0;
    brain.target = null; brain.memory.clear(); brain.nextPerceive = 0;
    let firstSeen = -1, firstShot = -1;
    for (let i = 0; i < 120; i++) {
      bot.move.pos = { x: 10, y: 0, z: -8 }; human.move.pos = { x: -10, y: 0, z: -8 };
      const cmd = brain.think(room, bot, 1 / 60);
      if (brain.target === human.id && firstSeen < 0) firstSeen = room.time;
      if ((cmd.buttons & 1) && firstShot < 0) firstShot = room.time;
      room.time += 1 / 60;
    }
    expect(firstSeen).toBeGreaterThanOrEqual(0);
    expect(firstShot).toBeGreaterThanOrEqual(0);
    expect(firstShot - firstSeen).toBeGreaterThanOrEqual(0.62 * 0.8 - 1e-6);
  });

  it("a full 6v6 bot match is deterministic and reaches a winner with one result", () => {
    const run = () => {
      const r = new Room({ seed: 42, local: null, warmup: 1, scoreLimit: 40, timeLimit: 240 });
      let results = 0, shots = 0, equipment = 0, supports = 0, reloads = 0;
      while (r.phase !== "ended" && r.tickN < 60 * 300) {
        r.tick();
        for (const e of r.drainEvents()) {
          if (e.type === "matchEnd") results++;
          if (e.type === "shot") shots++;
          if (e.type === "throw") equipment++;
          if (e.type === "supportDeployed") supports++;
          if (e.type === "reload" && e.stage === "start") reloads++;
        }
      }
      return { phase: r.phase, winner: r.winner, scores: r.scores, sig: r.result?.signature, results, shots, equipment, supports, reloads };
    };
    const a = run();
    const b = run();
    expect(a.phase).toBe("ended");
    expect(a.results).toBe(1);
    expect(a.winner === 0 || a.winner === 1 || a.winner === -1).toBe(true);
    expect(b).toEqual(a);
    expect(a.shots).toBeGreaterThan(100);
    expect(a.equipment).toBeGreaterThan(0);
    expect(a.supports).toBeGreaterThan(0);
    expect(a.reloads).toBeGreaterThan(0);
  }, 120000);
});
