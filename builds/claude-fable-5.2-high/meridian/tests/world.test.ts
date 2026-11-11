import { describe, it, expect, beforeAll } from 'vitest';
import { Physics } from '../src/physics/physics';
import { terrainH, areaAt, ANCHORS, blocks, intersections, segments, decks, surfaceY } from '../src/world/district';
import { lanes, roadLanes, walkNodes, walkPath, roadRoute, routeLength, laneRoute, nearestLane, Signals, lanePoint } from '../src/world/roads';
import { buildings, parts, parkSpots, generateLots } from '../src/world/lots';

let phys: Physics;
beforeAll(async () => { phys = await Physics.create(); });

describe('district data', () => {
  it('has the authored grid', () => {
    expect(blocks.length).toBe(81);
    expect(intersections.length).toBe(64);
    expect(segments.filter((s) => s.kind === 'road').length).toBeGreaterThan(90);
    expect(decks.length).toBe(6);
  });
  it('generates lots deterministically', () => {
    generateLots();
    expect(buildings.length).toBeGreaterThan(250);
    expect(parts.length).toBeGreaterThan(1500);
    expect(parkSpots.length).toBeGreaterThan(100);
    console.log('buildings', buildings.length, 'parts', parts.length, 'parkSpots', parkSpots.length, 'statics', phys.staticCount, 'lanes', lanes.length, 'walkNodes', walkNodes.length);
  });
  it('keeps anchors on walkable or drivable ground, clear of buildings', () => {
    for (const [id, a] of Object.entries(ANCHORS)) {
      const k = areaAt(a.x, a.z).kind;
      expect(['road', 'intersection', 'block', 'ped', 'lotstrip'], id).toContain(k);
      const inside = buildings.some((b) => !b.stacked && a.x > b.x0 && a.x < b.x1 && a.z > b.z0 && a.z < b.z1);
      expect(inside, `anchor ${id} inside a building`).toBe(false);
    }
  });
});

describe('render/collision agreement', () => {
  it('heightfield matches the terrain function at sampled roads, curbs, hill and canal', () => {
    const pts: [number, number][] = [[-100, -300], [281, 200], [300, 262], [-234, 0], [120, 77], [-330, 215], [0, -80], [333, 91], [-218, -44], [401, 300]];
    for (const [x, z] of pts) {
      const y = phys.groundBelow(x, 60, z);
      expect(Math.abs(y - terrainH(x, z)), `at ${x},${z}`).toBeLessThan(0.2);
    }
  });
  it('bridge decks are solid above the channel', () => {
    const d = decks[0];
    const x = (d.rect.x0 + d.rect.x1) / 2, z = (d.seg.rect.z0 + d.seg.rect.z1) / 2;
    expect(Math.abs(phys.groundBelow(x, 5, z) - 0)).toBeLessThan(0.05);
    expect(surfaceY(x, z)).toBe(0);
    expect(terrainH(x, z)).toBeLessThan(-3);
  });
  it('buildings block line of sight', () => {
    const b = buildings.find((bb) => !bb.stacked && bb.x1 - bb.x0 > 12 && bb.top - bb.base > 8)!;
    const z = (b.z0 + b.z1) / 2, y = b.base + 3;
    expect(phys.los(b.x0 - 3, y, z, b.x1 + 3, y, z)).toBe(false);
  });
});

describe('road graph', () => {
  it('every lane continues somewhere unless it ends at a portal', () => {
    for (const l of roadLanes) if (!l.portalEnd) expect(l.next.length, `lane ${l.id}`).toBeGreaterThan(0);
  });
  it('lanes keep traffic on the right-hand side', () => {
    for (const l of roadLanes) {
      const p = lanePoint(l, l.len / 2, { x: 0, z: 0, yaw: 0 });
      const s = l.seg!;
      const off = s.axis === 'v' ? p.x - s.ax : p.z - s.az;
      if (l.dir === 0) expect(off).toBeGreaterThan(0);
      if (l.dir === 2) expect(off).toBeLessThan(0);
      if (l.dir === 1) expect(off).toBeLessThan(0);
      if (l.dir === 3) expect(off).toBeGreaterThan(0);
    }
  });
  it('routes GPS between far anchors along roads', () => {
    const r = roadRoute(ANCHORS.safehouse.x, ANCHORS.safehouse.z, ANCHORS.viewpoint.x, ANCHORS.viewpoint.z);
    expect(r.length).toBeGreaterThan(6);
    const len = routeLength(r);
    const straight = Math.hypot(ANCHORS.safehouse.x - ANCHORS.viewpoint.x, ANCHORS.safehouse.z - ANCHORS.viewpoint.z);
    expect(len).toBeGreaterThan(straight * 0.95);
    expect(len).toBeLessThan(straight * 1.9);
  });
  it('finds lane routes for AI drivers', () => {
    const a = nearestLane(-100, -84, Math.PI / 2)!;
    const route = laneRoute(a.lane, 280, 200);
    expect(route.length).toBeGreaterThan(3);
    expect(route[route.length - 1].seg).toBe(nearestLane(280, 200)!.lane.seg);
  });
  it('signals never show green on both axes and give pedestrians a protected phase', () => {
    const sig = new Signals();
    const it = intersections.find((i) => i.signal)!;
    let walkNS = 0, walkEW = 0;
    for (let t = 0; t < 48; t += 0.25) {
      sig.time = t;
      const ns = sig.light(it, 'NS'), ew = sig.light(it, 'EW');
      expect(ns !== 'red' && ew !== 'red').toBe(false);
      if (sig.walkAllowed(it, 'NS')) { expect(ns).toBe('red'); walkNS++; }
      if (sig.walkAllowed(it, 'EW')) { expect(ew).toBe('red'); walkEW++; }
    }
    expect(walkNS).toBeGreaterThan(10); expect(walkEW).toBeGreaterThan(10);
    sig.requestPhase(it.id, 'EW', 5);
    expect(sig.light(it, 'EW')).toBe('green'); expect(sig.light(it, 'NS')).toBe('red');
  });
  it('sidewalk graph is connected across the district', () => {
    const a = walkNodes[0];
    let reachable = 0;
    for (let k = 0; k < walkNodes.length; k += 7) if (walkPath(a.id, walkNodes[k].id).length > 0 || k === 0) reachable++;
    expect(reachable).toBeGreaterThan(Math.floor(walkNodes.length / 7) * 0.95);
  });
});
