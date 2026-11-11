import { makeSim } from './headless';
declare const process: { env: Record<string, string | undefined> };
const n = Number(process.env.N ?? 6);
const diff = (process.env.DIFF ?? 'normal') as 'easy' | 'normal' | 'hard';
const rows: string[] = [];
for (let seed = 1; seed <= n; seed++) {
  const sim = makeSim(seed, diff);
  for (let i = 0; i < 40 * 1800 && sim.winner < 0; i++) sim.step();
  const k = sim.teams.map((t) => t.kills).join('-');
  rows.push(`seed ${seed}: winner ${sim.winner} at ${(sim.time / 60).toFixed(1)} min kills ${k} heroes0=${sim.heroes.slice(0, 3).map((h) => h.hero!.heroId)} heroes1=${sim.heroes.slice(3).map((h) => h.hero!.heroId)}`);
}
console.log(rows.join('\n'));
