import { describe, expect, test } from 'vitest';
import { createGlassRavine, F_BRUSH, F_CHASM, F_HOVER, F_WALK, MAP_SIZE } from '../src/world/map';
import { NavGrid } from '../src/navigation/nav';
import { newSim, run } from './helpers';
import { Kind } from '../src/simulation-core/types';

const within = (a: number, b: number, tol = 0.03) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-9);

describe('Glass Ravine map', () => {
  const m = createGlassRavine();
  const N = MAP_SIZE;
  const nav = new NavGrid(N, m.flags);
  const cell = (x: number, y: number) => Math.floor(y) * N + Math.floor(x);
  const dist = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const f = nav.field('t' + from.x + ',' + from.y, () => [nav.nearestPassable(Math.floor(from.x), Math.floor(from.y))])!;
    return f[nav.nearestPassable(Math.floor(to.x), Math.floor(to.y))];
  };

  test('gameplay flags are point-symmetric (cosmetic decor is not)', () => {
    let diff = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((m.flags[cell(x, y)] & (F_WALK | F_HOVER | F_BRUSH)) !== (m.flags[cell(N - 1 - x, N - 1 - y)] & (F_WALK | F_HOVER | F_BRUSH))) diff++;
    expect(diff / (N * N)).toBeLessThan(0.01);
    const mirrored = m.decor.filter((d) => m.decor.some((e) => Math.abs(e.x - (N - d.x)) < 0.01 && Math.abs(e.y - (N - d.y)) < 0.01));
    expect(mirrored.length).toBeLessThan(m.decor.length);
  });
  test('has protected mains, naturals, side expansions, a depleted center and two pylons', () => {
    expect(m.bases.filter((b) => b.kind === 'main')).toHaveLength(2);
    expect(m.bases.filter((b) => b.kind === 'natural')).toHaveLength(2);
    expect(m.bases.filter((b) => b.kind === 'side')).toHaveLength(2);
    expect(m.resources.filter((r) => r.base === m.bases.find((b) => b.kind === 'center')!.id).every((r) => r.amount <= 300)).toBe(true);
    expect(m.pylons).toHaveLength(2);
    expect(m.bridges).toHaveLength(2);
    expect(m.barriers.length).toBeGreaterThan(0);
    expect(m.flags.some((f) => (f & F_CHASM) && (f & F_HOVER) && !(f & F_WALK))).toBe(true); // hover-only void
  });
  test('spawn fairness within 3%: rush, expansion, resources, sight lines, choke width', () => {
    const [a, b] = m.starts;
    const rushAB = dist(a, b), rushBA = dist(b, a);
    expect(Number.isFinite(rushAB)).toBe(true);
    expect(within(rushAB, rushBA)).toBe(true);
    const nat = m.bases.filter((x) => x.kind === 'natural');
    const natFor = (s: { x: number; y: number }) => nat.slice().sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0];
    expect(within(dist(a, natFor(a)), dist(b, natFor(b)))).toBe(true);
    const res = (s: { x: number; y: number }) => m.resources.filter((r) => Math.hypot(r.x - s.x, r.y - s.y) < 40).reduce((t, r) => t + r.amount, 0);
    expect(within(res(a), res(b))).toBe(true);
    const sight = (s: { x: number; y: number }) => { let k = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((m.flags[cell(x, y)] & F_BRUSH) && Math.hypot(x - s.x, y - s.y) < 45) k++; return k; };
    expect(within(sight(a), sight(b))).toBe(true);
    // choke width proxy: walkable cells in a disc at the natural's front choke (mirrored)
    const choke = (p: { x: number; y: number }) => { let k = 0; for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (nav.passable(Math.floor(p.x + x), Math.floor(p.y + y))) k++; return k; };
    expect(within(choke({ x: 71, y: 99 }), choke({ x: N - 71, y: N - 99 }))).toBe(true);
  });
  test('destructible barriers seal the lower route; destroying them opens a shorter path', () => {
    const sim = newSim();
    const from = { x: 60, y: 84 }, to = { x: 84, y: 60 };
    const f1 = sim.nav.field('a', () => [sim.nav.nearestPassable(from.x, from.y)])!;
    const before = f1[sim.nav.nearestPassable(to.x, to.y)];
    for (const b of sim.barrierIds) sim.kill(b);
    const f2 = sim.nav.field('a', () => [sim.nav.nearestPassable(from.x, from.y)])!;
    const after = f2[sim.nav.nearestPassable(to.x, to.y)];
    expect(after).toBeLessThan(before * 0.6);
    expect(sim.events.some((e) => e.type === 'barrier')).toBe(true);
  });
  test('hover scouts cross the chasm; ground units cannot', () => {
    const sim = newSim(3, 'verdant', 'helix');
    const wing = sim.unitsOf(0, 'glimmerwing')[0];
    sim.issue({ player: 0, kind: 'move', ids: [wing], x: 80, y: 52 });
    run(sim, 20 * 30);
    expect(Math.hypot(sim.x[wing] - 80, sim.y[wing] - 52)).toBeLessThan(1.5);
    let walkChasm = 0;
    for (let i = 0; i < N * N; i++) if ((m.flags[i] & F_CHASM) && nav.staticWalk[i]) walkChasm++;
    expect(walkChasm).toBe(0);
    void Kind;
  });
});
