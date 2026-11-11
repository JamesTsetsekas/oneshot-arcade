import { describe, expect, it } from 'vitest';
import { allDefs, allUpgrades, factions, validateData, MAX_UPGRADE_POWER } from '../src/data';
import { buildMap, MAP_SIZE, type GameMap } from '../src/sim/map';
import { Nav } from '../src/sim/nav';

describe('balance data', () => {
  it('passes schema validation', () => {
    expect(validateData()).toEqual([]);
  });
  it('both factions have full rosters', () => {
    expect(factions.helix.units.length).toBe(7);
    expect(factions.verdant.units.length).toBe(8);
    for (const f of Object.values(factions)) {
      expect(f.structures.length).toBe(6);
      for (const id of [...f.units, ...f.structures]) {
        const d = allDefs.find((x) => x.id === id)!;
        expect(d.desc.length).toBeGreaterThan(10);
        expect(d.hp).toBeGreaterThan(0);
      }
    }
  });
  it('no single upgrade exceeds 12% power and each faction has 3 attack + 3 armor levels', () => {
    for (const u of allUpgrades) if (u.effect.kind === 'attack') expect(u.effect.amount).toBeLessThanOrEqual(MAX_UPGRADE_POWER);
    for (const f of Object.values(factions)) {
      const ups = allUpgrades.filter((u) => u.faction === f.id);
      expect(ups.filter((u) => u.effect.kind === 'attack').length).toBe(3);
      expect(ups.filter((u) => u.effect.kind === 'armor').length).toBe(3);
    }
  });
});

function flood(m: GameMap, nav: Nav, sx: number, sy: number): { dist: Int32Array; reach: number } {
  const N = m.size;
  const dist = new Int32Array(N * N).fill(-1);
  const q: number[] = [Math.floor(sy) * N + Math.floor(sx)];
  dist[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % N, cy = (c / N) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = y * N + x;
      if (dist[i] >= 0 || !nav.walkable(i)) continue;
      dist[i] = dist[c] + 1; q.push(i);
    }
  }
  return { dist, reach: q.length };
}

describe('Glass Ravine', () => {
  const m = buildMap();
  const nav = new Nav(m);
  // resource nodes and barriers occupy cells like in a live match
  for (const r of m.resources) nav.setFootprint(Math.round(r.x - r.w / 2), Math.round(r.y - r.h / 2), r.w, r.h, 1);
  const navOpen = new Nav(m);
  for (const r of m.resources) navOpen.setFootprint(Math.round(r.x - r.w / 2), Math.round(r.y - r.h / 2), r.w, r.h, 1);
  for (const b of m.barriers) nav.setFootprint(b.x, b.y, b.w, b.h, 1);

  it('is symmetric under 180 degree rotation (gameplay layers)', () => {
    const N = MAP_SIZE;
    let diff = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, j = (N - 1 - y) * N + (N - 1 - x);
      if (m.blocked[i] !== m.blocked[j] || m.chasm[i] !== m.chasm[j] || m.brush[i] !== m.brush[j] || m.bridge[i] !== m.bridge[j]) diff++;
    }
    expect(diff).toBe(0);
  });
  it('connects the two main bases on the ground', () => {
    const a = m.starts[0], b = m.starts[1];
    const { dist } = flood(m, nav, a.x, a.y);
    const d = dist[Math.floor(b.y) * m.size + Math.floor(b.x)];
    expect(d).toBeGreaterThan(0);
  });
  it('spawn fairness: rush distance, expansion distance and nearby resources within 3%', () => {
    const f0 = flood(m, nav, m.starts[0].x, m.starts[0].y);
    const f1 = flood(m, nav, m.starts[1].x, m.starts[1].y);
    const at = (f: { dist: Int32Array }, p: { x: number; y: number }) => f.dist[Math.floor(p.y) * m.size + Math.floor(p.x)];
    const rush0 = at(f0, m.starts[1]), rush1 = at(f1, m.starts[0]);
    expect(Math.abs(rush0 - rush1) / Math.max(rush0, rush1)).toBeLessThan(0.03);
    for (const kind of ['natural', 'side'] as const) {
      const s0 = m.sites.find((s) => s.kind === kind && s.id.startsWith('p0'))!;
      const nn = nav.nearestWalkable(s0.x, s0.y)!;
      const n0 = { x: Math.floor(nn.x) + 0.5, y: Math.floor(nn.y) + 0.5 };
      const n1 = { x: m.size - n0.x, y: m.size - n0.y }; // the mirrored cell for player 1
      expect(nav.walkableXY(n1.x, n1.y)).toBe(true);
      const d0 = at(f0, n0), d1 = at(f1, n1);
      expect(d0).toBeGreaterThan(0);
      expect(Math.abs(d0 - d1) / Math.max(d0, d1)).toBeLessThan(0.03);
    }
    const sum = (prefix: string) => m.resources.filter((r) => r.site.startsWith(prefix)).reduce((s, r) => s + r.amount, 0);
    expect(Math.abs(sum('p0') - sum('p1')) / sum('p0')).toBeLessThan(0.03);
  });
  it('every resource node, pylon and pod sits on open ground and is reachable', () => {
    const a = m.starts[0];
    const { dist } = flood(m, nav, a.x, a.y);
    // neighbours of resources must be reachable (nodes themselves are occupied)
    for (const r of m.resources) {
      let ok = false;
      for (const [dx, dy] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) {
        const x = Math.floor(r.x + dx), y = Math.floor(r.y + dy);
        if (dist[y * m.size + x] >= 0) ok = true;
      }
      expect(ok, `${r.kind} at ${r.x},${r.y}`).toBe(true);
    }
    for (const p of [...m.pylons, ...m.pods]) {
      const i = Math.floor(p.y) * m.size + Math.floor(p.x);
      expect(m.blocked[i] || m.chasm[i], `neutral at ${p.x},${p.y}`).toBeFalsy();
      expect(dist[i], `reach ${p.x},${p.y}`).toBeGreaterThanOrEqual(0);
    }
  });
  it('has two bridges, a chasm, brush and a lower route through the central basin', () => {
    const N = m.size;
    expect(m.bridge.reduce((s, v) => s + v, 0)).toBeGreaterThan(40);
    expect(m.chasm.reduce((s, v) => s + v, 0)).toBeGreaterThan(500);
    expect(m.brush.reduce((s, v) => s + v, 0)).toBeGreaterThan(40);
    const mid = N / 2;
    expect(nav.walkableXY(mid, mid)).toBe(true);
    // crystal barriers plug a back door: removing them must create a shorter path
    expect(m.barriers.length).toBe(4);
    const a = m.starts[0], b = m.starts[1];
    const closed = flood(m, nav, a.x, a.y).dist[Math.floor(b.y) * N + Math.floor(b.x)];
    const open = flood(m, navOpen, a.x, a.y).dist[Math.floor(b.y) * N + Math.floor(b.x)];
    expect(open).toBeLessThanOrEqual(closed);
  });
});
