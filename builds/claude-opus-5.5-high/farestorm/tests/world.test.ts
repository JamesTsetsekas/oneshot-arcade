import { describe, expect, it } from "vitest";
import { getWorld } from "../src/sim/world/city";
import { segmentsCross } from "../src/sim/math";

const w = getWorld();

describe("Galeport world", () => {
  it("has the MVP content counts", () => {
    expect(w.destinations.length).toBe(32);
    expect(w.shortcuts.length).toBe(18);
    expect(w.hubs.length).toBe(3);
    expect(w.pickups.length).toBeGreaterThan(120);
    expect(w.buildings.length).toBeGreaterThan(300);
  });

  it("road graph is fully connected", () => {
    const seen = new Set<number>([0]);
    const stack = [0];
    while (stack.length) {
      const n = stack.pop()!;
      for (const e of w.nodes[n].edges) {
        const ed = w.edges[e];
        const o = ed.a === n ? ed.b : ed.a;
        if (!seen.has(o)) { seen.add(o); stack.push(o); }
      }
    }
    expect(seen.size).toBe(w.nodes.length);
  });

  it("every destination is on a road and reachable from every hub by legal route", () => {
    for (const d of w.destinations) {
      const ne = w.nearestEdge(d.x, d.z)!;
      expect(ne.dist, d.name).toBeLessThan(ne.edge.halfWidth);
      expect(w.collidersHitCircle(d.x, d.z, 1.2, w.heightAt(d.x, d.z) + 0.6), `${d.name} ring blocked`).toBe(false);
      for (const h of w.hubs) {
        const r = w.route(h.x, h.z, d.x, d.z);
        expect(Number.isFinite(r.length), `${h.name} -> ${d.name}`).toBe(true);
        expect(r.length).toBeGreaterThan(0);
      }
    }
  });

  it("landmarks do not overlap roads", () => {
    for (const d of w.destinations) {
      const ne = w.nearestEdgeGlobal(d.lx, d.lz);
      expect(ne.dist - d.lr * 0.9, d.name).toBeGreaterThan(ne.edge.halfWidth);
    }
  });

  it("shortcut gates are not blocked and corridors are free of buildings", () => {
    for (const sc of w.shortcuts) {
      for (const g of [sc.gateA, sc.gateB]) {
        const mx = (g[0] + g[2]) / 2, mz = (g[1] + g[3]) / 2;
        expect(w.collidersHitCircle(mx, mz, 1.0, w.heightAt(mx, mz) + 0.6), `${sc.name} gate blocked`).toBe(false);
      }
      for (let f = 0.02; f < 0.98; f += 0.02) {
        const [x, z] = w.pointAlong(sc.points, f);
        const y = w.heightAt(x, z) + 0.7;
        const hits = w.colliders.filter((c) => c.kind === "building" || c.kind === "landmark" || c.kind === "container").some((c) => {
          if (y < c.minY || y > c.maxY) return false;
          const dx = x - c.cx, dz = z - c.cz;
          const lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c;
          return Math.abs(lx) < c.hx + 1 && Math.abs(lz) < c.hz + 1;
        });
        expect(hits, `${sc.name} corridor blocked at ${f.toFixed(2)}`).toBe(false);
      }
    }
  });

  it("shortcut gates are crossed by driving the corridor", () => {
    for (const sc of w.shortcuts) {
      const [ax, az] = w.pointAlong(sc.points, 0);
      let len = 0;
      for (let k = 0; k + 1 < sc.points.length; k++) len += Math.hypot(sc.points[k + 1][0] - sc.points[k][0], sc.points[k + 1][1] - sc.points[k][1]);
      const [bx, bz] = w.pointAlong(sc.points, 22 / len);
      const g = sc.gateA;
      expect(segmentsCross(ax, az, bx, bz, g[0], g[1], g[2], g[3]), sc.name).toBe(true);
    }
  });

  it("most shortcuts beat the legal route between their ends", () => {
    let faster = 0;
    for (const sc of w.shortcuts) {
      const [ax, az] = sc.points[0];
      const [bx, bz] = sc.points[sc.points.length - 1];
      let len = 0;
      for (let k = 0; k + 1 < sc.points.length; k++) len += Math.hypot(sc.points[k + 1][0] - sc.points[k][0], sc.points[k + 1][1] - sc.points[k][1]);
      const r = w.route(ax, az, bx, bz);
      if (len < r.length - 5) faster++;
    }
    expect(faster).toBeGreaterThanOrEqual(10);
  });

  it("hubs and pickups are on drivable, unobstructed ground", () => {
    for (const h of w.hubs) expect(w.collidersHitCircle(h.x, h.z, 2.0, w.heightAt(h.x, h.z) + 0.6)).toBe(false);
    for (const p of w.pickups) {
      expect(w.waterAt(p.x, p.z)).toBeNull();
      expect(w.collidersHitCircle(p.x, p.z, 1.5, w.heightAt(p.x, p.z) + 0.6)).toBe(false);
    }
  });

  it("ramps and decks raise the ground; canal and sea are water", () => {
    expect(w.heightAt(-430, 69)).toBeGreaterThan(w.terrainAt(-430, 69) + 1.2);
    expect(w.waterAt(-430, 80)).not.toBeNull();
    expect(w.heightAt(130, -40)).toBeGreaterThan(w.terrainAt(130, -40) + 5);
    expect(w.waterAt(410, -420)).toBe(0);
    expect(w.heightAt(410, -460)).toBeGreaterThan(2.5); // ferry deck over the inlet
    expect(w.surfaceAt(-300, -400)).toBe("sand");
  });
});
