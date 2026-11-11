// Automated map analysis for Aperture Annex: connectivity, stuck points, spawn
// sightlines, route timings, zone bounds, callouts, collision hash stability.
import { describe, expect, it } from 'vitest';
import { ANNEX } from '../src/map/annex';
import { GameMap } from '../src/map/runtime';
import { NavGrid } from '../src/map/nav';
import { PLAYER } from '../src/content/rules';

const map = new GameMap(ANNEX);
const nav = new NavGrid(map);

function route(a: [number, number], b: [number, number]): number {
  const s = nav.nearestWalkable(a[0], a[1]);
  const g = nav.nearestWalkable(b[0], b[1]);
  const p = nav.findPath(s, g);
  if (!p) return Infinity;
  const pts = nav.smooth(p);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return len;
}

const vaultCenter = (id: string): [number, number] => {
  const v = ANNEX.vaults.find((z) => z.id === id)!;
  return [(v.rect[0] + v.rect[2]) / 2, (v.rect[1] + v.rect[3]) / 2];
};

export const ROUTES = {
  tToA: () => route([0, -35], [-35.5, 1.5]),
  tToB: () => route([0, -35], [33, 1.5]),
  ctToA: () => route([0, 29], [-35.5, 11]),
  ctToB: () => route([0, 29], [36, 9]),
  rotateLong: () => route([-35, 8], [-34, 21]) + route([-34, 21], [36, 21]) + route([36, 21], [35, 8]),
  rotateMid: () => route([-35, 8], [-22, 5.5]) + route([-22, 5.5], [33, -2]) + route([33, -2], [35, 5]),
};

describe('Aperture Annex map analysis', () => {
  it('builds a stable collision set with a versioned hash', () => {
    const again = new GameMap(ANNEX);
    expect(again.hash).toBe(map.hash);
    expect(map.boxes.length).toBeGreaterThan(50);
    expect(map.boxes.length).toBeLessThan(2000);
  });

  it('every spawn and plant spot is walkable and in the main component', () => {
    const pts = [...ANNEX.spawns.intrusion, ...ANNEX.spawns.custodian, ...Object.values(ANNEX.plantSpots).flat()];
    for (const [x, z] of pts) {
      const c = map.cellIndex(x, z);
      expect(nav.walkable(c), `walkable ${x},${z}`).toBe(true);
      expect(nav.comp[c], `component ${x},${z}`).toBe(nav.mainComp);
    }
  });

  it('plant spots lie inside their vault zones', () => {
    for (const v of ANNEX.vaults) {
      for (const [x, z] of ANNEX.plantSpots[v.id]) {
        expect(map.inZone(v, { x, y: 0, z })).toBe(true);
      }
    }
  });

  it('has no stuck pockets: almost every walkable cell is reachable from the main component', () => {
    let walk = 0;
    let main = 0;
    for (let i = 0; i < nav.floor.length; i++) {
      if (!nav.walkable(i)) continue;
      const reg = map.cellRegion[i];
      if (reg >= 0 && ANNEX.regions[reg].id === 'garden') continue; // sealed decorative courtyard behind glass
      walk++;
      if (nav.comp[i] === nav.mainComp) main++;
    }
    expect(main / walk).toBeGreaterThan(0.995);
  });

  it('spawns have no sightline to each other', () => {
    for (const [ax, az] of ANNEX.spawns.intrusion)
      for (const [bx, bz] of ANNEX.spawns.custodian) {
        const a = { x: ax, y: PLAYER.eye, z: az };
        const b = { x: bx, y: PLAYER.eye, z: bz };
        expect(map.lineClear(a, b)).toBe(false);
      }
  });

  it('every walkable cell has a callout', () => {
    for (let i = 0; i < nav.floor.length; i++) {
      if (!nav.walkable(i)) continue;
      const { x, z } = map.cellCenter(i);
      expect(map.callout(x, z).length).toBeGreaterThan(0);
    }
  });

  it('route timings fall in the designed bands', () => {
    const r = Object.fromEntries(Object.entries(ROUTES).map(([k, f]) => [k, Math.round(f() * 10) / 10]));
    // eslint-disable-next-line no-console
    console.log('route lengths (m):', r, 'rifle seconds:', Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round((v / 4.7) * 10) / 10])));
    const sec = (m: number, speed = 4.7) => m / speed;
    // attackers reach sites in ~10-14 s with a rifle
    expect(sec(r.tToA)).toBeGreaterThan(9);
    expect(sec(r.tToA)).toBeLessThan(15);
    expect(sec(r.tToB)).toBeGreaterThan(9);
    expect(sec(r.tToB)).toBeLessThan(15);
    // defenders arrive before attackers at both sites
    expect(r.ctToA).toBeLessThan(r.tToA);
    expect(r.ctToB).toBeLessThan(r.tToB);
    // mid rotation is faster than the long rotation
    expect(r.rotateMid).toBeLessThan(r.rotateLong);
    expect(vaultCenter('A')[0]).toBeLessThan(0);
  });

  it('raycasts hit walls and pass glass for sight but not for collision', () => {
    // inside glass corridor looking north through the window into the garden
    const o = { x: 17, y: 1.6, z: -2 };
    const d = { x: 0, y: 0, z: 1 };
    const solidHit = map.raycast(o, d, 30, false);
    const sightHit = map.raycast(o, d, 30, true);
    expect(solidHit).not.toBeNull();
    expect(map.boxes[solidHit!.box].mat).toBe('glass');
    expect(sightHit).not.toBeNull();
    expect(sightHit!.t).toBeGreaterThan(solidHit!.t + 5);
  });
});
