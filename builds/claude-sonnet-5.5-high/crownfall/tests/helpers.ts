import { Sim } from '../src/sim/sim';
import type { PickConfig, Unit } from '../src/sim/types';

/** A sim whose heroes are all "player"-controlled (i.e. idle), so tests are not disturbed by bots. */
export function quietSim(blue: string[] = ['suri', 'brannoch', 'oru'], red: string[] = ['vey', 'ilyra', 'kesh'], seed = 1): Sim {
  const mk = (id: string, team: 0 | 1): PickConfig => ({ heroId: id, team, controller: 'player', talents: ['mend', 'aegis'] });
  const sim = new Sim({ seed, picks: [...blue.map((b) => mk(b, 0)), ...red.map((r) => mk(r, 1))], difficulty: 'normal', mode: 'match' });
  return sim;
}
export function botSim(seed = 1, difficulty: 'easy' | 'normal' | 'hard' = 'normal'): Sim {
  const ids = ['brannoch', 'suri', 'oru', 'kesh', 'ilyra', 'vey'];
  const picks: PickConfig[] = [0, 1, 2].map((i) => ({ heroId: ids[(i + seed) % 6], team: 0 as const, controller: 'bot' as const, talents: ['mend', 'aegis'] as [string, string] }));
  for (let i = 3; i < 6; i++) picks.push({ heroId: ids[(i + seed) % 6], team: 1, controller: 'bot', talents: ['mend', 'sprint'] });
  return new Sim({ seed, picks, difficulty, mode: 'match' });
}
export function run(sim: Sim, seconds: number) {
  const n = Math.round(seconds * 30);
  for (let i = 0; i < n; i++) sim.step();
}
export function place(u: Unit, x: number, z: number) { u.x = x; u.z = z; u.px = x; u.pz = z; }
export function maxOut(u: Unit) {
  const h = u.hero!;
  h.level = 12; h.ranks = [1, 1, 1, 1]; h.skillPts = 0;
  u.mana = u.maxMana = 999;
}
export function ready(sim: Sim, u: Unit) {
  maxOut(u);
  sim.recomputeStats(u, true);
  u.hp = u.maxHp; u.mana = u.maxMana;
  u.hero!.cds = [0, 0, 0, 0];
}
