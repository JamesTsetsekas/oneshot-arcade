import { describe, expect, it, beforeAll } from 'vitest';
import { K17 } from '../src/content/k17';
import { NavGrid } from '../src/sim/nav';
import { loadRapier } from '../src/sim/physics';
import { World } from '../src/sim/world';
import { MOVE } from '../src/content/tuning';

let nav: NavGrid;
let world: World;
beforeAll(async () => {
  nav = NavGrid.bake(K17);
  world = new World(await loadRapier(), K17);
});

describe('Relay Station K-17 map data', () => {
  it('is roughly 115 x 95 m with five districts', () => {
    const b = K17.bounds;
    expect(b.maxX - b.minX).toBeGreaterThan(105);
    expect(b.maxX - b.minX).toBeLessThan(125);
    expect(b.maxZ - b.minZ).toBeGreaterThan(88);
    expect(b.maxZ - b.minZ).toBeLessThan(102);
    expect(K17.districts.length).toBe(5);
    expect(K17.glassCount).toBeGreaterThan(0);
    expect(K17.glassCount).toBeLessThanOrEqual(32);
  });

  it('bakes a connected nav grid that covers every spawn and interest node', () => {
    expect(nav.count).toBeGreaterThan(15000);
    for (const s of K17.spawns) {
      const n = nav.nodeExact(s.x, s.y, s.z, 0.3);
      expect(n, `spawn ${s.x},${s.z}`).toBeGreaterThanOrEqual(0);
      expect(world.fits(s.x, s.y + 0.03, s.z, false), `spawn clear ${s.x},${s.z}`).toBe(true);
    }
    for (const i of K17.interest) {
      const n = nav.nodeExact(i.x, i.y, i.z, 0.4);
      expect(n, `interest ${i.name}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('every interest node is reachable from both team staging yards', () => {
    const w = nav.nearest(-55.8, 0, 0), e = nav.nearest(55.8, 0, 5);
    for (const i of K17.interest) {
      const n = nav.nearest(i.x, i.y, i.z);
      expect(nav.findPath(w, n), `west -> ${i.name}`).not.toBeNull();
      expect(nav.findPath(e, n), `east -> ${i.name}`).not.toBeNull();
    }
  });

  it('meets traversal metrics: centre contact 8-14 s, flank routes longer, first contact above 5 s', () => {
    const w = nav.nearest(-55.8, 0, 0), e = nav.nearest(55.8, 0, 5);
    const centre = nav.nearest(0, 0, 6);
    const blend = (MOVE.walk + MOVE.sprint) / 2;
    const tW = nav.pathLength(nav.findPath(w, centre)!) / blend;
    const tE = nav.pathLength(nav.findPath(e, centre)!) / blend;
    expect(tW).toBeGreaterThan(8); expect(tW).toBeLessThan(14);
    expect(tE).toBeGreaterThan(8); expect(tE).toBeLessThan(14);
    // spawn-to-spawn at full sprint is the fastest possible first contact (each side covers half)
    const cross = nav.pathLength(nav.findPath(w, e)!) / MOVE.sprint;
    expect(cross / 2).toBeGreaterThan(5);
    // flanks via ridge and utility route are longer than the centre lane
    const ridge = nav.nearest(0, 2, 33), util = nav.nearest(0, 0, -31);
    const viaRidge = (nav.pathLength(nav.findPath(w, ridge)!) + nav.pathLength(nav.findPath(ridge, e)!)) / blend;
    const viaUtil = (nav.pathLength(nav.findPath(w, util)!) + nav.pathLength(nav.findPath(util, e)!)) / blend;
    const direct = nav.pathLength(nav.findPath(w, e)!) / blend;
    expect(viaRidge).toBeGreaterThan(direct);
    expect(viaUtil).toBeGreaterThan(direct);
    console.log(`[map metrics] centre W ${tW.toFixed(1)}s E ${tE.toFixed(1)}s | cross ${direct.toFixed(1)}s | via ridge ${viaRidge.toFixed(1)}s | via utility ${viaUtil.toFixed(1)}s | nav nodes ${nav.count}`);
  });

  it('has no cross-map sightline from one team staging yard into the other', () => {
    let clear = 0;
    for (const a of K17.spawns.filter((s) => s.home === 0)) {
      for (const b of K17.spawns.filter((s) => s.home === 1)) {
        if (world.visible(a.x, 1.68, a.z, b.x, 1.3, b.z)) clear++;
      }
    }
    expect(clear).toBe(0);
  });

  it('has at least three lanes with four or more connectors between them', () => {
    // connector openings between courtyard and the north strip / utility route, plus building doors
    const gapsNorth = [[-10, 22], [10, 22]], gapsSouth = [[-8.5, -22], [9.5, -22]];
    for (const [x, z] of [...gapsNorth, ...gapsSouth]) expect(nav.nodeExact(x, 0, z, 0.3)).toBeGreaterThanOrEqual(0);
    // tunnel is walkable end to end below the deck
    expect(nav.nodeExact(0, -3, 0.2, 0.3)).toBeGreaterThanOrEqual(0);
    expect(nav.findPath(nav.nearest(-19, 0, 0), nav.nearest(19, 0, 0))).not.toBeNull();
  });
});
