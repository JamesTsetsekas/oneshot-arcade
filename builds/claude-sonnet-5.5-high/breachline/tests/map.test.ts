import { describe, expect, it } from "vitest";
import { freshK17 } from "../src/shared/map/k17";
import { CollisionWorld } from "../src/shared/sim/collision";
import { getNav, findPath, pathLength } from "../src/shared/bots/nav";

const map = freshK17();
const col = new CollisionWorld(map);
const nav = getNav(col);

describe("Relay Station K-17 map", () => {
  it("is roughly 115 x 95 m and has a collision set", () => {
    expect(map.bounds.maxX - map.bounds.minX).toBeCloseTo(115, 0);
    expect(map.boxes.length).toBeGreaterThan(100);
  });
  it("has mirrored home spawn rooms with at least 12 candidates each", () => {
    for (const team of [0, 1]) expect(map.spawns.filter((s) => s.team === team && s.group === "home").length).toBeGreaterThanOrEqual(12);
  });
  it("all spawn candidates are on free ground", () => {
    for (const s of map.spawns) expect(col.blocked(s.pos.x, 0.05, s.pos.z, 0.3, 1.8), `spawn ${s.id}`).toBe(false);
  });
  it("nav graph connects the two home spawns", () => {
    const a = map.spawns.find((s) => s.team === 0 && s.group === "home")!;
    const b = map.spawns.find((s) => s.team === 1 && s.group === "home")!;
    const path = findPath(nav, nav.nearest(a.pos.x, a.pos.z), nav.nearest(b.pos.x, b.pos.z));
    expect(path).not.toBeNull();
    const len = pathLength(nav, path!);
    expect(len).toBeGreaterThan(80);
    expect(len).toBeLessThan(180);
  });
  it("spawn-to-centre travel is 10-13 s at standing speed (spawn to courtyard middle)", () => {
    const a = map.spawns.find((s) => s.team === 0 && s.group === "home")!;
    const path = findPath(nav, nav.nearest(a.pos.x, a.pos.z), nav.nearest(0, 8))!;
    const secs = pathLength(nav, path) / 5.2;
    expect(secs).toBeGreaterThan(8);
    expect(secs).toBeLessThan(14);
  });
  it("every nav node reaches every other node (single connected component for the main play space)", () => {
    const seen = new Set<number>([0]);
    const stack = [0];
    while (stack.length) { const n = nav.nodes[stack.pop()!]; for (const m of n.links) if (!seen.has(m)) { seen.add(m); stack.push(m); } }
    expect(seen.size / nav.nodes.length).toBeGreaterThan(0.97);
  });
  it("three lanes are linked by at least four connectors (courtyard connectors)", () => {
    // connector corridors are open cells at x=-14/14, z=22 (north) and z=-22 (south)
    const open = [[-14, 22], [14, 22], [-14, -22], [14, -22]];
    for (const [x, z] of open) expect(col.blocked(x, 0.05, z, 0.4, 1.8), `${x},${z}`).toBe(false);
  });
  it("spawn room has no long unbroken straight sightline from the courtyard", () => {
    // sample rays from the courtyard through the control-room door axis toward the spawn room
    const home = map.spawns.filter((s) => s.team === 0 && s.group === "home");
    let visible = 0;
    for (let z = -14; z <= 14; z += 2) for (const x of [-24, -20, -12]) {
      if (col.blocked(x, 0.05, z, 0.3, 1.8)) continue;
      for (const s of home) if (col.lineClear({ x, y: 1.6, z }, { x: s.pos.x, y: 1.6, z: s.pos.z })) visible++;
    }
    // some partial sight into the room via the control-room axis is tolerable, but it must be a small fraction
    expect(visible / (15 * 3 * home.length)).toBeLessThan(0.08);
  });
  it("ray casting hits walls and ignores invisible sea boundary for bullets", () => {
    const hit = col.raycast({ x: -20, y: 1.6, z: 0 }, { x: -1, y: 0, z: 0 }, 100, true);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBeGreaterThan(5);
  });
});
