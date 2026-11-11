import { Sim } from '../src/simulation-core/sim';
import type { MatchSetup } from '../src/network-protocol/protocol';

export function makeSetup(seed = 1, f0: 'helix' | 'verdant' = 'helix', f1: 'helix' | 'verdant' = 'verdant', ai: [MatchSetup['players'][0]['ai'], MatchSetup['players'][0]['ai']] = [null, null]): MatchSetup {
  return { seed, map: 'glass_ravine', mode: 'skirmish', players: [{ faction: f0, ai: ai[0], name: 'P0' }, { faction: f1, ai: ai[1], name: 'P1' }] };
}
export function newSim(seed = 1, f0: 'helix' | 'verdant' = 'helix', f1: 'helix' | 'verdant' = 'verdant') {
  return new Sim(makeSetup(seed, f0, f1));
}
export function run(sim: Sim, ticks: number) { for (let i = 0; i < ticks; i++) sim.step(); }

/** remove every unit (keeps structures/resources) so a test can stage a clean scene */
export function clearUnits(sim: Sim) {
  for (let id = 1; id < sim.nextId; id++) if (sim.alive[id] && sim.kind[id] === 1) sim.alive[id] = 0;
  sim.events = [];
}
export const ARENA = { x: 18, y: 46 }; // open, level-1, brush-free ground (asserted in combat.test)
