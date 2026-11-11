import { describe, it, expect } from 'vitest';
import { getRapier, getModel } from './helpers';
import { PhysicsWorld } from '../src/physics/physicsWorld';
import { SITE_DEFS, SHORTCUT_DEFS, WORLD_W, WORLD_D } from '../src/world/galeport';
import { ARCHETYPES } from '../src/fares/passengers';
import { Traffic } from '../src/traffic/traffic';

describe('Galeport world model', () => {
  const model = getModel();

  it('has the authored content counts', () => {
    expect(model.sites.length).toBe(32);
    expect(SITE_DEFS.length).toBe(32);
    expect(new Set(model.sites.map((s) => s.name)).size).toBe(32);
    expect(model.shortcuts.length).toBe(18);
    expect(SHORTCUT_DEFS.length).toBe(18);
    expect(ARCHETYPES.length).toBe(24);
    expect(new Set(ARCHETYPES.map((a) => a.name)).size).toBe(24);
    expect(model.hubs.length).toBe(3);
    expect(model.buildings.length).toBeGreaterThan(500);
    expect(model.ramps.length).toBeGreaterThanOrEqual(6);
  });

  it('physics heightfield matches the analytic terrain used by gameplay', async () => {
    const R = await getRapier();
    const phys = new PhysicsWorld(R, model);
    let maxErr = 0;
    for (let i = 0; i < 300; i++) {
      const x = 40.37 + ((i * 7919) % 1320), z = 20.61 + ((i * 104729) % 950); // off the grid lines
      const hit = phys.world.castRay(new R.Ray({ x, y: 300, z }, { x: 0, y: -1, z: 0 }), 500, true, undefined, undefined, undefined, undefined, (c) => c.handle === phys.terrainHandle);
      expect(hit).not.toBeNull();
      maxErr = Math.max(maxErr, Math.abs(300 - hit!.timeOfImpact - model.heightAt(x, z)));
    }
    expect(maxErr).toBeLessThan(0.03);
    phys.dispose();
  });

  it('every destination is reachable from every other by legal road', () => {
    let longest = 0;
    for (const a of model.sites) for (const b of model.sites) {
      if (a.id === b.id) continue;
      const r = model.route({ edge: a.edge, t: a.t }, { edge: b.edge, t: b.t });
      expect(Number.isFinite(r.dist)).toBe(true);
      expect(r.dist).toBeGreaterThan(10);
      longest = Math.max(longest, r.dist);
    }
    expect(longest).toBeLessThan(3200);
    for (let i = 0; i < model.nodes.length; i++) expect(Number.isFinite(model.nodeDist(0, i))).toBe(true);
  });

  it('destinations sit on drivable road, outside buildings, with a kerb stand', () => {
    for (const s of model.sites) {
      expect(['asphalt', 'cobble']).toContain(model.surfaceAt(s.x, s.z));
      expect(model.pointInBuilding(s.x, s.z, 1)).toBe(false);
      expect(model.pointInBuilding(s.sx, s.sz, 0.3)).toBe(false);
      expect(model.pointInBuilding(s.lx, s.lz, 0)).toBe(false);
      expect(s.y).toBeGreaterThan(2);
      const e = model.edges[s.edge];
      expect(e.structure).toBe(false);
      expect(s.t * e.len).toBeGreaterThan(20);
      expect((1 - s.t) * e.len).toBeGreaterThan(20);
    }
  });

  it('shortcuts have valid ends, clear corridors and a time advantage or tactical purpose', () => {
    const tactical = new Set(['jump', 'quay', 'boardwalk', 'plaza', 'drop', 'garage']);
    for (const s of model.shortcuts) {
      for (const [x, z] of [[s.ax, s.az], [s.bx, s.bz]]) {
        expect(x).toBeGreaterThan(30); expect(x).toBeLessThan(WORLD_W - 30);
        expect(z).toBeGreaterThan(30); expect(z).toBeLessThan(WORLD_D - 30);
        expect(model.heightAt(x, z)).toBeGreaterThan(0.5); // dry land, so resets are safe
        expect(model.pointInBuilding(x, z, 1)).toBe(false);
      }
      expect(s.len).toBeGreaterThan(40);
      if (s.corridor) for (let t = 0.05; t < 1; t += 0.05) {
        const x = s.ax + (s.bx - s.ax) * t, z = s.az + (s.bz - s.az) * t;
        expect(model.pointInBuilding(x, z, s.width / 2 - 1), `${s.id} blocked at t=${t.toFixed(2)}`).toBe(false);
      }
      const la = model.nearestEdge(s.ax, s.az, undefined, true), lb = model.nearestEdge(s.bx, s.bz, undefined, true);
      const legal = model.route(la, lb).dist + la.dist + lb.dist;
      if (!tactical.has(s.kind)) expect(legal / s.len, `${s.id} legal ${legal.toFixed(0)} vs ${s.len.toFixed(0)}`).toBeGreaterThan(1.15);
    }
  });

  it('roads are sensibly graded and never pass through buildings', () => {
    for (const e of model.edges) {
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const p = model.edgePoint(e, Math.min(1, t));
        if (!e.structure) expect(model.pointInBuilding(p.x, p.z, e.hw)).toBe(false);
      }
      expect(Math.abs(e.yb - e.ya) / e.len, `edge ${e.id} ${e.cls}`).toBeLessThan(0.3);
    }
  });

  it('lane graph is closed: every lane has a successor', async () => {
    const R = await getRapier();
    const phys = new PhysicsWorld(R, model);
    const traffic = new Traffic(phys, model, 1, 'off');
    expect(traffic.lanes.length).toBeGreaterThan(300);
    for (const l of traffic.lanes) expect(l.next.length, `lane ${l.id} on edge ${l.edge}`).toBeGreaterThan(0);
    phys.dispose();
  });

  it('spawn hubs and reset poses are on the road', () => {
    for (const h of model.hubs) expect(['asphalt', 'cobble']).toContain(model.surfaceAt(h.pose.x, h.pose.z));
    for (const [x, z] of [[500, 50], [1100, 60], [700, 480], [20, 20], [1380, 990]]) {
      const p = model.roadPose(x, z);
      expect(model.pointInBuilding(p.x, p.z, 0.5)).toBe(false);
      expect(p.y).toBeGreaterThan(2);
    }
  });
});
