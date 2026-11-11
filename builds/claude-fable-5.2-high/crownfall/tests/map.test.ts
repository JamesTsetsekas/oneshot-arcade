import { describe, expect, it } from 'vitest';
import { HERO_IDS, HEROES } from '../src/shared/heroes';
import { ITEMS, ITEM_LIST, TALENT_IDS } from '../src/shared/items';
import { FOUNTAIN, MAP_H, MAP_W, getMap } from '../src/shared/map';

const map = getMap();
const mirror = (x: number): number => MAP_W - x;

describe('The Broken Diadem — map and fairness', () => {
  it('has the full structure set per team: 3 towers + seal per lane, 2 core towers, 1 engine', () => {
    for (const team of [0, 1]) {
      const s = map.structs.filter((x) => x.team === team);
      expect(s.filter((x) => x.kind === 'tower')).toHaveLength(6);
      expect(s.filter((x) => x.kind === 'seal')).toHaveLength(2);
      expect(s.filter((x) => x.kind === 'core')).toHaveLength(2);
      expect(s.filter((x) => x.kind === 'engine')).toHaveLength(1);
    }
  });

  it('gives each side four small camps and two buff camps, plus two Catalysts and the Colossus', () => {
    for (const side of [0, 1]) {
      const c = map.camps.filter((x) => x.side === side);
      expect(c.filter((x) => x.type === 'thorn' || x.type === 'moss')).toHaveLength(4);
      expect(c.filter((x) => x.type === 'brass' || x.type === 'mist')).toHaveLength(2);
    }
    expect(map.camps.filter((c) => c.side === 2).map((c) => c.type).sort()).toEqual(['catalystN', 'catalystS', 'colossus']);
  });

  it('is mirror-fair: terrain, brush and structures are symmetric across the centre line', () => {
    let maxDiff = 0;
    for (let y = 4; y < MAP_H - 4; y += 3.5) {
      for (let x = 4; x < MAP_W / 2; x += 3.5) {
        maxDiff = Math.max(maxDiff, Math.abs(map.sdfT(x, y) - map.sdfT(mirror(x), y)));
        expect(map.brushAt(x, y) >= 0).toBe(map.brushAt(mirror(x), y) >= 0);
      }
    }
    expect(maxDiff).toBeLessThan(0.05);
    for (const s of map.structs.filter((x) => x.team === 0)) {
      const twin = map.structs.find((o) => o.team === 1 && o.tier === s.tier && o.lane === s.lane && Math.abs(o.y - s.y) < 0.01 && Math.abs(o.x - mirror(s.x)) < 0.01);
      expect(twin, s.key).toBeTruthy();
    }
  });

  it('has equivalent travel metrics for both teams (route fairness report)', () => {
    const out = (k: string) => map.structs.find((s) => s.key === k)!;
    const routes: [string, number, number][] = [];
    for (const lane of ['up', 'low']) {
      const a = out(`t0-${lane}-outer`);
      const b = out(`t1-${lane}-outer`);
      const off = lane === 'up' ? 3 : -3;
      routes.push([`fountain->${lane} outer`, map.pathLength(FOUNTAIN[0].x, FOUNTAIN[0].y, a.x, a.y + off), map.pathLength(FOUNTAIN[1].x, FOUNTAIN[1].y, b.x, b.y + off)]);
    }
    routes.push(['fountain->colossus', map.pathLength(FOUNTAIN[0].x, FOUNTAIN[0].y, 75, 66), map.pathLength(FOUNTAIN[1].x, FOUNTAIN[1].y, 75, 66)]);
    routes.push(['fountain->north catalyst', map.pathLength(FOUNTAIN[0].x, FOUNTAIN[0].y, 73, 85), map.pathLength(FOUNTAIN[1].x, FOUNTAIN[1].y, 77, 85)]);
    for (const [name, d0, d1] of routes) {
      expect(Number.isFinite(d0), name).toBe(true);
      expect(Math.abs(d0 - d1), name).toBeLessThan(1.5);
    }
    // fountain -> outer tower should take roughly 15-22 s on foot at ~3.6 m/s
    expect(routes[0][1] / 3.6).toBeGreaterThan(14);
    expect(routes[0][1] / 3.6).toBeLessThan(23);
  });

  it('connects everything: both fountains, every camp and every structure approach are reachable', () => {
    expect(Number.isFinite(map.pathLength(FOUNTAIN[0].x, FOUNTAIN[0].y, FOUNTAIN[1].x, FOUNTAIN[1].y))).toBe(true);
    for (const c of map.camps) expect(Number.isFinite(map.pathLength(FOUNTAIN[0].x, FOUNTAIN[0].y, c.x, c.y)), `camp ${c.type}`).toBe(true);
    for (const lane of map.lanePaths) for (const path of lane) for (const p of path) expect(map.sdf(p.x, p.y), `lane waypoint ${p.x},${p.y}`).toBeLessThan(-0.4);
  });

  it('pathfinding snaps blocked endpoints to walkable ground and never routes through walls', () => {
    const p = map.findPath(FOUNTAIN[0].x, FOUNTAIN[0].y, 60, 60); // inside the mistwood
    expect(p.length).toBeGreaterThan(0);
    const end = p[p.length - 1];
    expect(map.walkable(end.x, end.y, 0.4)).toBe(true);
    let px = FOUNTAIN[0].x;
    let py = FOUNTAIN[0].y;
    for (const q of p) {
      expect(map.segmentClear(px, py, q.x, q.y)).toBe(true);
      px = q.x;
      py = q.y;
    }
  });

  it('walls block line of sight; open lanes do not', () => {
    expect(map.losClear(60, 98, 90, 98)).toBe(true);
    expect(map.losClear(75, 98, 75, 23)).toBe(true); // straight down the river
    expect(map.losClear(57, 67, 58, 49)).toBe(false); // camp to camp through the mistwood
  });
});

describe('content schemas', () => {
  it('ships 32 items in the required tiers', () => {
    const count = (t: string) => ITEM_LIST.filter((i) => i.tier === t).length;
    expect(ITEM_LIST).toHaveLength(32);
    expect([count('starter'), count('component'), count('completed'), count('boots'), count('consumable')]).toEqual([6, 10, 12, 2, 2]);
    for (const i of ITEM_LIST) {
      for (const c of i.from ?? []) expect(ITEMS[c], `${i.id} recipe`).toBeTruthy();
      if (i.from) expect(i.cost).toBeGreaterThan(i.from.reduce((a, c) => a + ITEMS[c].cost, 0));
    }
  });

  it('every completed item appears in at least two hero build graphs', () => {
    for (const item of ITEM_LIST.filter((i) => i.tier === 'completed')) {
      const users = HERO_IDS.filter((h) => {
        const b = HEROES[h].builds;
        return b.paths.some((p) => p.items.includes(item.id)) || b.vsPhysical === item.id || b.vsArcane === item.id;
      });
      expect(users.length, item.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('defines six heroes with a passive, four abilities, two build paths, and six talents', () => {
    expect(HERO_IDS).toHaveLength(6);
    expect(TALENT_IDS).toHaveLength(6);
    for (const id of HERO_IDS) {
      const h = HEROES[id];
      expect(h.abilities).toHaveLength(4);
      expect(h.abilities[3].ult).toBe(true);
      expect(h.passive.name.length).toBeGreaterThan(2);
      expect(h.builds.paths).toHaveLength(2);
      expect(h.base.speed).toBeGreaterThanOrEqual(3.4);
      expect(h.base.speed).toBeLessThanOrEqual(3.9);
      expect(h.base.radius).toBeGreaterThanOrEqual(0.45);
      expect(h.base.radius).toBeLessThanOrEqual(0.65);
      for (const p of h.builds.paths) for (const it of p.items) expect(ITEMS[it], `${id} build item ${it}`).toBeTruthy();
      expect(ITEMS[h.builds.starter].tier).toBe('starter');
    }
  });
});
