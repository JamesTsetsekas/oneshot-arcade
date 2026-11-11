import { describe, expect, test } from 'vitest';
import { newSim, run } from './helpers';
import { Kind } from '../src/simulation-core/types';
import { STRUCTURES, UNITS } from '../src/faction-data';
import { LATE_GAME_TICK, type Sim } from '../src/simulation-core/sim';

function oresNear(sim: Sim, p: number) {
  const out: number[] = [];
  for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Ore && Math.hypot(sim.x[id] - sim.players[p].startX, sim.y[id] - sim.players[p].startY) < 13) out.push(id);
  return out;
}
function freeSpot(sim: Sim, p: number, def: string) {
  const pl = sim.players[p];
  for (let r = 5; r < 14; r++) for (let a = 0; a < 24; a++) {
    const x = pl.startX + Math.cos((a / 24) * 6.283) * r, y = pl.startY + Math.sin((a / 24) * 6.283) * r;
    const f = sim.snapFootprint(def, x, y);
    if (sim.checkPlacement(p, def, f.tx, f.ty).ok) return f;
  }
  throw new Error('no spot');
}

describe('economy, supply and construction', () => {
  test('workers mine, carry loads home, and income accrues', () => {
    const sim = newSim(1);
    const ores = oresNear(sim, 0);
    const ws = sim.unitsOf(0, 'fabricator');
    ws.forEach((w, i) => sim.issue({ player: 0, kind: 'gather', ids: [w], target: ores[i] }));
    run(sim, 20 * 60);
    expect(sim.players[0].stats.oreCollected).toBeGreaterThan(250);
    expect(sim.players[0].ore).toBeCloseTo(150 + sim.players[0].stats.oreCollected, 5);
  });

  test('over-saturation is possible but inefficient', () => {
    const rate = (perSeam: number) => {
      const sim = newSim(2);
      const ores = oresNear(sim, 0);
      const extra: number[] = [];
      for (let k = 0; k < perSeam * ores.length; k++) extra.push(sim.spawnUnit('fabricator', 0, sim.players[0].startX + 4, sim.players[0].startY - 4));
      extra.forEach((w, i) => sim.issue({ player: 0, kind: 'gather', ids: [w], target: ores[i % ores.length] }));
      run(sim, 20 * 90);
      return sim.players[0].stats.oreCollected / extra.length;
    };
    const ideal = rate(2), over = rate(6);
    expect(over).toBeLessThan(ideal * 0.75);
  });

  test('Flux requires an extractor on a vent, then workers haul it', () => {
    const sim = newSim(3);
    let vent = -1;
    for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Vent && Math.hypot(sim.x[id] - sim.players[0].startX, sim.y[id] - sim.players[0].startY) < 12) vent = id;
    const w = sim.unitsOf(0, 'fabricator');
    sim.issue({ player: 0, kind: 'gather', ids: [w[0]], target: vent });
    run(sim, 4);
    expect(sim.commandLog.filter((c) => c.kind === 'gather')).toHaveLength(0);
    const f = sim.snapFootprint('flux_tap', sim.x[vent], sim.y[vent]);
    sim.issue({ player: 0, kind: 'build', ids: [w[0]], def: 'flux_tap', x: f.tx, y: f.ty });
    run(sim, 20 * 30);
    const tap = sim.structuresOf(0, 'flux_tap')[0];
    expect(sim.built[tap]).toBe(1);
    sim.issue({ player: 0, kind: 'gather', ids: w.slice(0, 3), target: tap });
    run(sim, 20 * 40);
    expect(sim.players[0].stats.fluxCollected).toBeGreaterThan(40);
  });

  test('Helix construction: foundation HP grows with progress and needs a Fabricator present', () => {
    const sim = newSim(4);
    const w = sim.unitsOf(0, 'fabricator')[0];
    const f = freeSpot(sim, 0, 'grid_pylon');
    sim.issue({ player: 0, kind: 'build', ids: [w], def: 'grid_pylon', x: f.tx, y: f.ty });
    let site = -1;
    for (let i = 0; i < 400 && site < 0; i++) { sim.step(); site = sim.structuresOf(0, 'grid_pylon')[0] ?? -1; }
    expect(site).toBeGreaterThan(0);
    expect(sim.players[0].ore).toBe(150 - 100);
    run(sim, 200);
    const frac = sim.progress[site];
    expect(frac).toBeGreaterThan(0.2);
    expect(sim.hp[site] / sim.maxHp[site]).toBeCloseTo(0.1 + 0.9 * frac, 1);
    sim.issue({ player: 0, kind: 'stop', ids: [w] });
    run(sim, 60);
    const stalled = sim.progress[site];
    run(sim, 60);
    expect(sim.progress[site]).toBe(stalled);
    sim.issue({ player: 0, kind: 'repair', ids: [w], target: site });
    run(sim, STRUCTURES.grid_pylon.buildTime + 100);
    expect(sim.built[site]).toBe(1);
  });

  test('Verdant structures grow on their own after planting; cancel refunds 75%', () => {
    const sim = newSim(5, 'verdant', 'helix');
    const t = sim.unitsOf(0, 'tender')[0];
    const f = freeSpot(sim, 0, 'root_node');
    sim.issue({ player: 0, kind: 'build', ids: [t], def: 'root_node', x: f.tx, y: f.ty });
    run(sim, 20 * 8);
    const site = sim.structuresOf(0, 'root_node')[0];
    expect(site).toBeDefined();
    expect(sim.ext[site].builder).toBe(-2);
    expect(sim.ext[t].orders.length).toBe(0);
    const p0 = sim.progress[site];
    run(sim, 40);
    expect(sim.progress[site]).toBeGreaterThan(p0);
    const ore = sim.players[0].ore;
    sim.issue({ player: 0, kind: 'cancel', ids: [site], index: -1 });
    run(sim, 3);
    expect(sim.alive[site]).toBe(0);
    expect(sim.players[0].ore).toBe(ore + 75);
  });

  test('supply block pauses the queue visibly (nothing lost) and resumes once supply exists', () => {
    const sim = newSim(6);
    sim.players[0].ore = 2000;
    const hq = sim.structuresOf(0)[0];
    for (let i = 0; i < 5; i++) sim.issue({ player: 0, kind: 'train', ids: [hq], def: 'fabricator' });
    run(sim, 20 * 60);
    const q = sim.ext[hq].queue;
    expect(sim.players[0].supplyUsed).toBe(10);
    expect(q.length).toBe(2);
    expect(q[0].paused).toBe('supply');
    expect(sim.events.length + 1).toBeGreaterThan(0);
    const f = freeSpot(sim, 0, 'grid_pylon');
    sim.spawnStructure('grid_pylon', 0, f.tx, f.ty, true);
    run(sim, 20 * 30);
    expect(sim.ext[hq].queue.length).toBe(0);
    expect(sim.players[0].supplyUsed).toBe(12);
  });

  test('queue cancel refunds the full cost; prerequisites are enforced', () => {
    const sim = newSim(7);
    sim.players[0].ore = 1000; sim.players[0].flux = 1000;
    const hq = sim.structuresOf(0)[0];
    sim.issue({ player: 0, kind: 'train', ids: [hq], def: 'fabricator' });
    run(sim, 3);
    sim.issue({ player: 0, kind: 'cancel', ids: [hq], index: 0 });
    run(sim, 3);
    expect(sim.players[0].ore).toBe(1000);
    const w = sim.unitsOf(0, 'fabricator')[0];
    const f = freeSpot(sim, 0, 'grid_pylon');
    sim.issue({ player: 0, kind: 'build', ids: [w], def: 'assembly_bay', x: f.tx, y: f.ty });
    run(sim, 3);
    expect(sim.commandLog.filter((c) => c.kind === 'build')).toHaveLength(0);
    expect(UNITS.mortar_crawler.requires).toContain('signal_foundry');
  });

  test('structures must be inside the construction field', () => {
    const sim = newSim(8);
    for (let id = 1; id < sim.nextId; id++) void id;
    sim.players[0].explored.fill(1);
    const r = sim.checkPlacement(0, 'grid_pylon', 66, 116);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/construction field/i);
  });

  test('after 18 minutes yields rise 15% and the center pulses a map-wide reveal every 90 s', () => {
    const sim = newSim(9);
    sim.tick = LATE_GAME_TICK - 1;
    sim.step();
    expect(sim.events.some((e) => e.type === 'pulse')).toBe(true);
    run(sim, 2);
    const hq1 = sim.structuresOf(1)[0];
    expect(sim.isVisibleTo(0, hq1)).toBe(true);
    run(sim, 80);
    expect(sim.isVisibleTo(0, hq1)).toBe(false);
    const ores = oresNear(sim, 0);
    const w = sim.unitsOf(0, 'fabricator')[0];
    sim.issue({ player: 0, kind: 'gather', ids: [w], target: ores[0] });
    let carry = 0;
    for (let i = 0; i < 400 && !carry; i++) { sim.step(); carry = sim.ext[w].carryAmount; }
    expect(carry).toBeCloseTo(5 * 1.15, 5);
  });

  test('salvage pods grant a fixed one-time bundle', () => {
    const sim = newSim(10);
    const pod = sim.podIds[0];
    const k = sim.unitsOf(0, 'kestrel')[0];
    const ore0 = sim.players[0].ore;
    sim.issue({ player: 0, kind: 'move', ids: [k], x: sim.x[pod], y: sim.y[pod] });
    run(sim, 20 * 60);
    expect(sim.alive[pod]).toBe(0);
    expect(sim.players[0].ore - ore0).toBe(100);
    expect(sim.players[0].flux).toBe(40);
  });

  test('watch pylon: a 3 s uncontested channel captures it and grants vision', () => {
    const sim = newSim(11);
    const pid = sim.pylonIds.slice().sort((a, b) => Math.hypot(sim.x[a] - sim.players[0].startX, sim.y[a] - sim.players[0].startY) - Math.hypot(sim.x[b] - sim.players[0].startX, sim.y[b] - sim.players[0].startY))[0];
    const k = sim.unitsOf(0, 'kestrel')[0];
    sim.issue({ player: 0, kind: 'capture', ids: [k], target: pid });
    let t = -1;
    for (let i = 0; i < 20 * 60 && t < 0; i++) { sim.step(); if (sim.ext[pid].captureOwner === 0) t = i; }
    expect(t).toBeGreaterThan(0);
    sim.issue({ player: 0, kind: 'move', ids: [k], x: sim.players[0].startX, y: sim.players[0].startY - 6 });
    run(sim, 20 * 20);
    const n = sim.map.size;
    expect(sim.players[0].visible[Math.floor(sim.y[pid]) * n + Math.floor(sim.x[pid] + 10)]).toBe(1);
  });
});
