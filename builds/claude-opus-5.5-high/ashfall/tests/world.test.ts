import { describe, expect, it } from "vitest";
import { generateZone } from "../src/world";
import { floodReach, findPath } from "../src/sim/nav";
import { nearReach, MARCH_TEMPLATES } from "../src/world/march";
import { ROOM_REPEAT_CAP } from "../src/world/archive";
import { ROLE_POINTS, ELITE_POINTS } from "../src/data/types";
import { ENEMY_BY_ID } from "../src/data/enemies";
import { eliteModsValid } from "../src/world/builder";
import type { ZoneData } from "../src/world/types";

const sameCells = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919);

function openGates(z: ZoneData): ZoneData {
  const cells = z.cells.slice();
  for (const it of z.interactables) if (it.kind === "gate") for (const [x, y] of it.data!.cells) cells[y * z.w + x] = 2;
  return { ...z, cells };
}

function checkReachable(z: ZoneData) {
  const reach = floodReach(z, z.entries.start.x, z.entries.start.y);
  for (const it of z.interactables) {
    if (it.kind === "gate") continue;
    expect(nearReach(reach, z.w, it.x, it.y), `${z.id} interactable ${it.name} reachable`).toBe(true);
  }
  for (const p of z.packs) expect(nearReach(reach, z.w, p.x, p.y), `${z.id} pack reachable`).toBe(true);
}

describe("Soot March generation", () => {
  it("is deterministic per seed", () => {
    const a = generateZone("march", 42, "normal");
    const b = generateZone("march", 42, "normal");
    expect(sameCells(a.cells, b.cells)).toBe(true);
    expect(a.packs.length).toBe(b.packs.length);
    const c = generateZone("march", 43, "normal");
    expect(sameCells(a.cells, c.cells)).toBe(false);
  });

  it("has 20 authored tile templates", () => {
    expect(new Set(MARCH_TEMPLATES).size).toBe(20);
  });

  for (const seed of SEEDS) {
    it(`seed ${seed}: anchors, loop, shortcut, reachability`, () => {
      const z = generateZone("march", seed, "normal");
      const tiles = z.meta.tiles as { template: string }[];
      expect(tiles.length).toBeGreaterThanOrEqual(10);
      expect(tiles.length).toBeLessThanOrEqual(12);
      const names = tiles.map((t) => t.template);
      for (const req of ["refuge_gate", "tollhouse", "waypoint_shrine", "hunter_camp", "elite_ring", "boss_gate"]) expect(names).toContain(req);
      // no template other than anchors repeats
      const counts = z.meta.templateCounts as Record<string, number>;
      for (const c of Object.values(counts)) expect(c).toBeLessThanOrEqual(1);
      expect(z.meta.loops).toBeGreaterThanOrEqual(1);
      expect(z.interactables.some((i) => i.kind === "gate" && i.data?.shortcut)).toBe(true);
      for (const lm of ["gate", "tollhouse", "waypoint", "crypt", "hunter_camp", "elite", "vista"]) expect(z.landmarks.map((l) => l.id)).toContain(lm);
      checkReachable(z);
      // dead-end tiles carry a reward
      for (const t of z.meta.tiles as any[]) if (t.reward) expect(t.template === "hunter_camp" || t.template === "elite_ring" || z.interactables.some((i) => i.kind === "chest" && Math.floor(i.x / 22) === t.gx && Math.floor(i.y / 22) === t.gy)).toBe(true);
      // path from start to crypt entrance exists
      const crypt = z.interactables.find((i) => i.kind === "exit" && i.data?.to === "archive1")!;
      expect(findPath(z, z.entries.start.x, z.entries.start.y, crypt.x - 1, crypt.y, 200000)).not.toBeNull();
      // opening the shortcut keeps everything connected
      const o = openGates(z);
      checkReachable(o);
    });
  }

  it("normal packs respect the 5–10 role point budget; elites carry valid modifiers", () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const z = generateZone("march", seed, "normal");
      for (const p of z.packs) {
        if (p.kind === "boss") continue;
        const pts = p.members.reduce((s, m) => s + ROLE_POINTS[ENEMY_BY_ID[m.enemy].role] + (m.elite ? ELITE_POINTS : 0), 0);
        expect(pts).toBe(p.points);
        if (p.kind === "normal" && !p.members.some((m) => m.elite) && p.points > 0 && p.level > 1) {
          expect(p.points).toBeGreaterThanOrEqual(5);
          expect(p.points).toBeLessThanOrEqual(10);
        }
        for (const m of p.members) if (m.elite) expect(eliteModsValid(m.elite)).toBe(true);
      }
    }
  });

  it("veteran elites get two modifiers", () => {
    const z = generateZone("march", 77, "veteran");
    const elites = z.packs.flatMap((p) => p.members.filter((m) => m.elite));
    expect(elites.length).toBeGreaterThan(0);
    for (const e of elites) expect(e.elite!.length).toBe(2);
  });
});

describe("Hollow Archive generation", () => {
  for (const seed of SEEDS.slice(0, 20)) {
    it(`seed ${seed}: floors 1-3 valid`, () => {
      const f1 = generateZone("archive1", seed, "normal");
      const f2 = generateZone("archive2", seed, "normal");
      const f3 = generateZone("archive3", seed, "normal");
      for (const z of [f1, f2, f3]) checkReachable(z);
      for (const z of [f1, f2]) {
        for (const c of Object.values(z.meta.counts as Record<string, number>)) expect(c).toBeLessThanOrEqual(ROOM_REPEAT_CAP);
        const rooms = z.meta.rooms as { template: string; gx: number; gy: number }[];
        const byKey = Object.fromEntries(rooms.map((r) => [`${r.gx},${r.gy}`, r.template]));
        const path = z.meta.path as string[];
        for (let i = 0; i + 1 < path.length; i++) expect(byKey[path[i]]).not.toBe(byKey[path[i + 1]]);
        expect(z.landmarks.length).toBeGreaterThan(0);
      }
      const t1 = (f1.meta.rooms as any[]).map((r) => r.template);
      expect(t1).toContain("cage_chamber");
      expect(t1).toContain("spike_gallery");
      expect(f1.hazards.length).toBeGreaterThan(0);
      const t2 = (f2.meta.rooms as any[]).map((r) => r.template);
      expect(t2).toContain("guardian_hall");
      expect(f2.interactables.some((i) => i.kind === "lever")).toBe(true);
      expect(f2.interactables.some((i) => i.kind === "gate")).toBe(true);
      expect(f2.packs.some((p) => p.kind === "guardian")).toBe(true);
      expect(f3.packs.some((p) => p.members.some((m) => m.enemy === "engine"))).toBe(true);
      expect(f3.interactables.some((i) => i.kind === "waypoint")).toBe(true);
      // lever reachable without opening the gate
      const reach = floodReach(f2, f2.entries.start.x, f2.entries.start.y);
      const lever = f2.interactables.find((i) => i.kind === "lever")!;
      expect(nearReach(reach, f2.w, lever.x, lever.y)).toBe(true);
    });
  }
});

describe("hub and side zones", () => {
  it("refuge has every service and no enemies", () => {
    const z = generateZone("refuge", 1, "normal");
    expect(z.packs.length).toBe(0);
    const npcs = z.interactables.filter((i) => i.kind === "npc").map((i) => i.data!.npc);
    expect(npcs).toEqual(expect.arrayContaining(["ivra", "odo", "wren", "calder"]));
    expect(z.interactables.some((i) => i.kind === "stash")).toBe(true);
    expect(z.interactables.some((i) => i.kind === "waypoint")).toBe(true);
    checkReachable(z);
  });
  it("hunts and training are valid", () => {
    for (const id of ["hunt_toll", "hunt_engine", "training"] as const) checkReachable(generateZone(id, 5, "normal"));
  });
});
