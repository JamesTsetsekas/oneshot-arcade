import { Sim } from '../src/sim/sim';
const rows: string[] = [];
const wins = { helix: 0, verdant: 0 };
const configs: Array<[string, string, string, string]> = [];
for (const seed of [1, 2, 3, 4]) { configs.push([String(seed), 'helix', 'verdant', 'normal']); }
for (const [seed, a, b, d] of configs) {
  for (const swap of [false, true]) {
    const fs = swap ? [b, a] : [a, b];
    const sim = new Sim({ seed: Number(seed), factions: fs as ['helix', 'verdant'], ai: [d, d], mode: 'skirmish' });
    for (let i = 0; i < 20 * 60 * 20 && !sim.over; i++) { sim.step(); sim.events.length = 0; }
    const w = sim.winner >= 0 ? sim.players[sim.winner].faction.id : 'none';
    if (w === 'helix' || w === 'verdant') wins[w]++;
    rows.push(`seed ${seed} P0=${fs[0]} P1=${fs[1]} -> ${w} at ${(sim.tick / 1200).toFixed(1)}m`);
  }
}
console.log(rows.join('\n'));
console.log(JSON.stringify(wins));
