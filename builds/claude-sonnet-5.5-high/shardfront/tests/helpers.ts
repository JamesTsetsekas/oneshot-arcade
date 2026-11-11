import { defIndex } from '../src/data';
import { Sim } from '../src/sim/sim';
import type { Command, SimConfig } from '../src/sim/types';

export function makeSim(over: Partial<SimConfig> = {}): Sim {
  return new Sim({ seed: 5, factions: ['helix', 'verdant'], ai: [null, null], mode: 'skirmish', ...over });
}
export function run(sim: Sim, ticks: number) {
  for (let i = 0; i < ticks && !sim.over; i++) { sim.step(); sim.events.length = 0; }
}
export const secs = (s: number) => Math.round(s * 20);
export const di = (id: string) => defIndex[id];
export function ofType(sim: Sim, owner: number, defId: string): number[] {
  return sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === owner && sim.type[id] === defIndex[defId]);
}
export function hall(sim: Sim, owner: number): number {
  return sim.ids.find((id) => sim.alive[id] && sim.owner[id] === owner && sim.td(id).isHall)!;
}
export function cmd(sim: Sim, c: Omit<Command, 'player'> & { player?: number }) {
  sim.issue({ player: 0, ...c } as Command);
}
/** drive the sim like the game loop does, with a given display frame rate */
export function advanceLikeLoop(sim: Sim, seconds: number, fps: number) {
  const dt = 1 / fps;
  let acc = 0;
  let t = 0;
  while (t < seconds) {
    acc += dt; t += dt;
    while (acc >= 0.05 - 1e-9) { acc -= 0.05; sim.step(); sim.events.length = 0; }
  }
}
