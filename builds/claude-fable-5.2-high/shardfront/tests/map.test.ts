import { describe, expect, it } from 'vitest';
import { Pathfinder } from '../src/nav/pathfinder';
import { F_BUILD, F_WALK, MAP_SIZE, getMap, heightAt } from '../src/world/map';

const map = getMap();
const blocked = new Uint8Array(MAP_SIZE * MAP_SIZE);
for (let i = 0; i < blocked.length; i++) blocked[i] = map.flags[i] & F_WALK ? 0 : 1;
// barriers start closed
for (const b of map.barriers) for (const c of b.cells) blocked[c] = 1;
const pf = new Pathfinder(MAP_SIZE, blocked);
const within = (a: number, b: number, tol = 0.03) => Math.abs(a - b) / Math.max(a, b) <= tol;

describe('Glass Ravine', () => {
  it('is 180-degree rotationally symmetric in gameplay data', () => {
    const S = MAP_SIZE;
    let diff = 0;
    for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
      const a = z * S + x, b = (S - 1 - z) * S + (S - 1 - x);
      if (map.flags[a] !== map.flags[b] || map.elev[a] !== map.elev[b]) diff++;
    }
    expect(diff).toBe(0);
  });

  it('has the required features', () => {
    expect(map.starts).toHaveLength(2);
    expect(map.sites.filter((s) => s.kind === 'natural')).toHaveLength(2);
    expect(map.sites.filter((s) => s.kind === 'side')).toHaveLength(2);
    expect(map.sites.filter((s) => s.kind === 'center')).toHaveLength(1);
    expect(map.pylons).toHaveLength(2);
    expect(map.barriers.length).toBeGreaterThanOrEqual(2);
    expect(map.pods.length).toBeGreaterThan(0);
    // main bases sit on high ground, the centre basin is low
    expect(map.elev[134 * MAP_SIZE + 24]).toBe(2);
    expect(map.elev[80 * MAP_SIZE + 80]).toBe(0);
    expect(heightAt(map, 24, 134)).toBeGreaterThan(heightAt(map, 80, 80));
  });

  it('resources do not overlap and sit on buildable ground', () => {
    const seen = new Set<string>();
    for (const r of map.resources) {
      const key = `${r.x},${r.z}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      expect(map.flags[r.z * MAP_SIZE + r.x] & F_BUILD, key).toBe(F_BUILD);
      for (const o of map.resources) if (o !== r && o.kind === 'ore' && r.kind === 'ore') expect(Math.max(Math.abs(o.x - r.x), Math.abs(o.z - r.z))).toBeGreaterThanOrEqual(2);
    }
  });

  it('spawn fairness: rush, expansion and resource metrics match within 3%', () => {
    const [a, b] = map.starts;
    const site = (kind: string, owner: number) => map.sites.find((s) => s.kind === kind && s.owner === owner)!;
    // rush distance both ways (path to the edge of the enemy headquarters)
    const rushAB = pf.pathLength(a.x + 5, a.z, b.x, b.z, 3, 1.5);
    const rushBA = pf.pathLength(b.x - 5, b.z, a.x, a.z, 3, 1.5);
    expect(rushAB).toBeGreaterThan(150);
    expect(within(rushAB, rushBA)).toBe(true);
    for (const kind of ['natural', 'side']) {
      const da = pf.pathLength(a.x + 5, a.z, site(kind, 0).x, site(kind, 0).z, 0, 2);
      const db = pf.pathLength(b.x - 5, b.z, site(kind, 1).x, site(kind, 1).z, 0, 2);
      expect(da).toBeGreaterThan(20);
      expect(within(da, db), `${kind} distance ${da} vs ${db}`).toBe(true);
    }
    // total nearby resources
    const near = (p: { x: number; z: number }, r: number) => map.resources.filter((q) => Math.hypot(q.x - p.x, q.z - p.z) < r).reduce((s, q) => s + q.amount, 0);
    expect(near(a, 40)).toBeGreaterThan(10000);
    expect(within(near(a, 40), near(b, 40))).toBe(true);
    expect(within(near(a, 80), near(b, 80))).toBe(true);
    // choke width of the natural exits (walkable cells along the ridge gap rows)
    const width = (z: number, x0: number, x1: number) => { let n = 0; for (let x = x0; x < x1; x++) if (map.flags[z * MAP_SIZE + x] & F_WALK) n++; return n; };
    const wa = width(116, 56, 104), wb = width(MAP_SIZE - 1 - 116, MAP_SIZE - 104, MAP_SIZE - 56);
    expect(wa).toBe(10);
    expect(within(wa, wb)).toBe(true);
    // sight lines: identical high-ground cell counts around each main
    const hi = (p: { x: number; z: number }) => { let n = 0; for (let z = p.z - 30; z < p.z + 30; z++) for (let x = p.x - 30; x < p.x + 30; x++) if (x >= 0 && z >= 0 && x < MAP_SIZE && z < MAP_SIZE && map.elev[z * MAP_SIZE + x] === 2) n++; return n; };
    expect(within(hi(a), hi(b))).toBe(true);
  });

  it('every base site and objective is reachable from both spawns', () => {
    for (const st of map.starts) {
      for (const target of [...map.sites, ...map.pylons, ...map.pods]) {
        const p = pf.findPath(st.x + 5, st.z, target.x, target.z, 0, 4, 80000);
        expect(p.length, `path to ${target.x},${target.z}`).toBeGreaterThan(0);
        const ex = p[p.length - 2], ez = p[p.length - 1];
        expect(Math.hypot(ex - target.x, ez - target.z)).toBeLessThan(5.5);
      }
    }
  });
});
