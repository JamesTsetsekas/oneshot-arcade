import { describe, it, expect } from "vitest";
import { generateDistrict, getDistrict, terrainHeight, waterSurfaceAt, surfaceAt, roadAt, districtAt, CELLS } from "../src/world/district";
import { StaticWorld, rayBox } from "../src/world/collision";
import { RoadGraph } from "../src/world/roadgraph";
import { STORY } from "../src/sim/missions/story";
import { CIRCUIT_POINTS } from "../src/sim/missions/activities";

describe("district & collision", () => {
  const d = getDistrict();
  const w = new StaticWorld(d.colliders);
  it("generation is deterministic", () => {
    const a = generateDistrict(1337), b = generateDistrict(1337);
    expect(a.buildings.length).toBe(b.buildings.length);
    expect(a.buildings[10]).toEqual(b.buildings[10]);
    expect(a.buildings.length).toBeGreaterThan(300);
  });
  it("covers all six districts and the enterable interiors", () => {
    const ds = new Set(d.blocks.map((b) => b.district));
    for (const k of ["tide", "foundry", "glassline", "lantern", "breakwater", "canal"]) expect(ds.has(k as any)).toBe(true);
    expect(d.interiors.map((i) => i.id).sort()).toEqual(["garage", "kiosk", "police", "portoffice", "safehouse", "store", "warehouse"]);
  });
  it("interact points and authored spawns are on open, dry ground", () => {
    const pts = [...d.interacts.map((i) => ({ id: i.id, x: i.x, z: i.z })), ...Object.entries(d.spawns).map(([id, s]) => ({ id, x: s.x, z: s.z }))];
    for (const p of pts) {
      const y = terrainHeight(p.x, p.z);
      const r = w.resolveCircle(p.x, p.z, 0.3, y + 0.3, y + 1.7);
      expect(r.hit, `${p.id} blocked`).toBe(false);
      expect(waterSurfaceAt(p.x, p.z), `${p.id} in water`).toBeNull();
    }
  });
  it("mission objective points are reachable (not inside colliders)", () => {
    for (const m of STORY) for (const n of Object.values(m.nodes)) {
      if (n.type !== "objective") continue;
      const o: any = n.obj;
      const pts = o.points ?? (o.x !== undefined ? [{ x: o.x, z: o.z }] : []);
      for (const p of pts) {
        const y = terrainHeight(p.x, p.z);
        const r = w.resolveCircle(p.x, p.z, 0.3, y + 0.3, y + 1.7);
        expect(r.hit, `${m.id}/${n.id} blocked at ${p.x},${p.z}`).toBe(false);
      }
    }
  });
  it("roads, sidewalks, water and districts resolve sensibly", () => {
    expect(roadAt(0, -50).onRoad).toBe(true);
    expect(surfaceAt(d, 0, -50)).toBe("asphalt");
    expect(surfaceAt(d, 0, -420)).toBe("water");
    expect(districtAt(-300, -150)).toBe("foundry");
    expect(terrainHeight(-350, 380)).toBeGreaterThan(20);
    expect(waterSurfaceAt(50, 50)).not.toBeNull();
    expect(waterSurfaceAt(0, 50)).toBeNull();
  });
  it("ray casts hit boxes and buildings block line of sight", () => {
    const h = rayBox(0, 1, -5, 0, 0, 1, -1, 0, -1, 1, 2, 1, 100);
    expect(h?.t).toBeCloseTo(4);
    const b = d.buildings.find((q) => q.topY - q.baseY > 20 && q.x1 - q.x0 > 8)!;
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    expect(w.lineOfSight(b.x0 - 0.5, b.baseY + 3, cz, b.x1 + 0.5, b.baseY + 3, cz)).toBe(false);
    expect(w.lineOfSight(cx, b.topY + 5, cz, cx + 10, b.topY + 5, cz)).toBe(true);
  });
  it("smoke clouds block line of sight", () => {
    const ww = new StaticWorld([]);
    expect(ww.lineOfSight(0, 1, 0, 20, 1, 0)).toBe(true);
    ww.smoke = [{ x: 10, y: 1, z: 0, r: 3 }];
    expect(ww.lineOfSight(0, 1, 0, 20, 1, 0)).toBe(false);
  });
  it("district is chunked into 9x9 streaming cells of 100 m", () => {
    expect(CELLS).toBe(9);
    expect(new Set(d.buildings.map((b) => b.cell)).size).toBeGreaterThan(60);
  });
  it("circuit checkpoints sit on roads", () => {
    for (const p of CIRCUIT_POINTS) expect(roadAt(p.x, p.z).onRoad).toBe(true);
  });
});

describe("road graph, routing & signals", () => {
  const g = new RoadGraph();
  it("is connected and routes between far corners", () => {
    const a = g.nearestNode(-400, -370), b = g.nearestNode(400, 390);
    const p = g.route(a.id, b.id);
    expect(p.length).toBeGreaterThan(5);
    for (let i = 1; i < p.length; i++) expect(g.nodes[p[i - 1]].nbrs.some((n) => n.node === p[i])).toBe(true);
  });
  it("GPS route starts at the player and ends at the target", () => {
    const r = g.gpsRoute(-55, 95, -103, 245);
    expect(r[0]).toBe(-55); expect(r[r.length - 1]).toBe(245);
  });
  it("conflicting axes are never green together; pedestrians cross only on the parallel phase", () => {
    for (const n of g.nodes.filter((q) => q.signal)) for (let t = 0; t < 68; t += 0.5) {
      const ns = g.signal(n.id, "ns", t), ew = g.signal(n.id, "ew", t);
      expect(ns === "green" && ew === "green").toBe(false);
      if (g.pedWalk(n.id, "ns", t)) expect(ns).toBe("red");
      if (g.pedWalk(n.id, "ew", t)) expect(ew).toBe("red");
    }
  });
  it("mission phase requests use the narrow API and are clamped", () => {
    const n = g.nodes.find((q) => q.signal)!;
    g.requestPhase(n.id, "ew", 100, 10);
    expect(g.signal(n.id, "ew", 105)).toBe("green");
    expect(g.signal(n.id, "ns", 105)).toBe("red");
    g.requestPhase(n.id, "ns", 200, 999);
    expect(g.signal(n.id, "ns", 219)).toBe("green");
    expect(g.overrides.get(n.id)!.until).toBe(220);
  });
  it("pedestrian graph routes across the district", () => {
    const a = g.nearestPed(-380, -360), b = g.nearestPed(380, 380);
    expect(g.pedRoute(a, b).length).toBeGreaterThan(10);
  });
  it("lane turns obey lane discipline", () => {
    for (const l of g.lanes) for (const m of g.nextLanes(l)) {
      const t = g.turnOf(l, m);
      if (t === "left") expect(l.idx).toBe(0);
      if (t === "right") expect(l.idx).toBe(l.count - 1);
    }
  });
});
