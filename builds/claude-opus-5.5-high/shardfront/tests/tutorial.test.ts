import { describe, expect, test } from 'vitest';
import { MatchRunner } from '../src/game/runner';
import { TUTORIAL_STEPS, type TutorialContext } from '../src/game/tutorial';
import { Kind } from '../src/simulation-core/types';
import type { MatchSetup } from '../src/network-protocol/protocol';
import type { Sim } from '../src/simulation-core/sim';

const setup: MatchSetup = { seed: 4242, map: 'glass_ravine', mode: 'tutorial', players: [{ faction: 'helix', ai: null, name: 'Trainee' }, { faction: 'verdant', ai: 'tutorial', name: 'Training Grove' }] };

function spot(sim: Sim, def: string) {
  const p = sim.players[0];
  for (let r = 6; r < 14; r++) for (let a = 0; a < 24; a++) {
    const f = sim.snapFootprint(def, p.startX + Math.cos((a / 24) * 6.283) * r, p.startY + Math.sin((a / 24) * 6.283) * r);
    if (sim.checkPlacement(0, def, f.tx, f.ty).ok) return f;
  }
  throw new Error('no spot for ' + def);
}

describe('tutorial', () => {
  test('every step validates the action it teaches and the scenario can be won', () => {
    const r = new MatchRunner(setup);
    const sim = r.sim;
    const ctx: TutorialContext = { sim, selection: new Set(), controlGroups: Array.from({ length: 10 }, () => []), lastCommands: [], cameraMoved: false };
    let step = 0;
    const done: string[] = [];
    const cmd = (c: Parameters<Sim['issue']>[0]) => { sim.issue(c); ctx.lastCommands.push(c.kind); };
    const advance = (ticks: number) => {
      for (let i = 0; i < ticks; i++) {
        r.step();
        while (step < TUTORIAL_STEPS.length && TUTORIAL_STEPS[step].done(ctx)) { done.push(TUTORIAL_STEPS[step].id); step++; ctx.lastCommands = []; }
      }
    };
    expect(sim.unitsOf(1).length).toBe(3); // passive outpost defenders only
    const workers = sim.unitsOf(0, 'fabricator');
    // camera / select / move
    ctx.cameraMoved = true; advance(2);
    ctx.selection = new Set([workers[0]]); advance(2);
    cmd({ player: 0, kind: 'move', ids: [workers[0]], x: sim.x[workers[0]] + 2, y: sim.y[workers[0]] }); advance(10);
    // gather
    const ores: number[] = [];
    for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Ore && Math.hypot(sim.x[id] - sim.players[0].startX, sim.y[id] - sim.players[0].startY) < 13) ores.push(id);
    workers.slice(1).forEach((w, i) => cmd({ player: 0, kind: 'gather', ids: [w], target: ores[i] }));
    advance(20 * 25);
    // train
    const hq = sim.structuresOf(0)[0];
    cmd({ player: 0, kind: 'train', ids: [hq], def: 'fabricator' }); advance(5);
    // supply + production
    let f = spot(sim, 'grid_pylon');
    cmd({ player: 0, kind: 'build', ids: [workers[0]], def: 'grid_pylon', x: f.tx, y: f.ty });
    advance(20 * 35);
    f = spot(sim, 'assembly_bay');
    cmd({ player: 0, kind: 'build', ids: [workers[0]], def: 'assembly_bay', x: f.tx, y: f.ty });
    advance(20 * 10);
    // flux
    let vent = -1;
    for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Vent && Math.hypot(sim.x[id] - sim.players[0].startX, sim.y[id] - sim.players[0].startY) < 12) vent = id;
    const vf = sim.snapFootprint('flux_tap', sim.x[vent], sim.y[vent]);
    cmd({ player: 0, kind: 'build', ids: [workers[1]], def: 'flux_tap', x: vf.tx, y: vf.ty });
    advance(20 * 50);
    const tap = sim.structuresOf(0, 'flux_tap')[0];
    cmd({ player: 0, kind: 'gather', ids: workers.slice(1, 4), target: tap });
    advance(20 * 30);
    // army
    const bay = sim.structuresOf(0, 'assembly_bay')[0];
    expect(sim.built[bay]).toBe(1);
    sim.players[0].ore += 600; // tutorial grants a stipend so the slice stays short
    for (let i = 0; i < 4; i++) cmd({ player: 0, kind: 'train', ids: [bay], def: 'bulwark' });
    f = spot(sim, 'grid_pylon');
    cmd({ player: 0, kind: 'build', ids: [workers[0]], def: 'grid_pylon', x: f.tx, y: f.ty });
    advance(20 * 75);
    const army = sim.unitsOf(0, 'bulwark');
    ctx.selection = new Set(army);
    ctx.controlGroups[1] = army.slice(); advance(2);
    cmd({ player: 0, kind: 'ability', ids: army, def: 'brace' }); advance(30);
    cmd({ player: 0, kind: 'ability', ids: army, def: 'brace' }); advance(30);
    const ehq = sim.structuresOf(1)[0];
    cmd({ player: 0, kind: 'attackMove', ids: army, x: sim.x[ehq], y: sim.y[ehq] + 4 });
    advance(20 * 60);
    // finish: keep attacking the visible Heartgrove until the objective is destroyed
    for (let k = 0; k < 20 && !sim.over; k++) {
      const alive = sim.unitsOf(0).filter((u) => !sim.udef(u).worker);
      if (sim.alive[ehq] && sim.isVisibleTo(0, ehq)) cmd({ player: 0, kind: 'attack', ids: alive, target: ehq });
      else cmd({ player: 0, kind: 'attackMove', ids: alive, x: sim.x[ehq], y: sim.y[ehq] });
      if (alive.length < 4) { sim.players[0].ore += 300; for (let i = 0; i < 4; i++) cmd({ player: 0, kind: 'train', ids: [bay], def: 'bulwark' }); }
      advance(20 * 20);
    }
    expect(sim.over).toBe(true);
    expect(sim.winner).toBe(0);
    expect(done).toEqual(TUTORIAL_STEPS.map((s) => s.id));
    expect(sim.tick / 20 / 60).toBeLessThan(12);
  });
});
