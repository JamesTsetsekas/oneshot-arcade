declare const process: { env: Record<string, string | undefined> };
import { Sim } from '../src/sim/sim';
const sets = [['brannoch', 'suri', 'oru'], ['kesh', 'ilyra', 'vey'], ['suri', 'ilyra', 'brannoch']];
const tot = { d0: 0, d1: 0, g0: 0, g1: 0, lh0: 0, lh1: 0, dmg0: 0, dmg1: 0 };
for (const ids of sets) for (let seed = 1; seed <= 4; seed++) {
  const mkp = (t: 0 | 1) => ids.map((h) => ({ heroId: h, team: t, controller: 'bot' as const, talents: ['mend', 'aegis'] as [string, string] }));
  const picks = process.env.REV ? [...mkp(1), ...mkp(0)] : [...mkp(0), ...mkp(1)];
  const sim = new Sim({ seed, picks, difficulty: 'normal', mode: 'match' });
  for (let i = 0; i < 8 * 60 * 30; i++) sim.step();
  const sum = (t: number, f: (h: any) => number) => sim.heroes.filter((h) => h.team === t).reduce((s, h) => s + f(h.hero), 0);
  tot.d0 += sum(0, (h) => h.deaths); tot.d1 += sum(1, (h) => h.deaths);
  tot.g0 += sum(0, (h) => h.totalGold); tot.g1 += sum(1, (h) => h.totalGold);
  tot.lh0 += sum(0, (h) => h.lastHits); tot.lh1 += sum(1, (h) => h.lastHits);
  tot.dmg0 += sum(0, (h) => h.damageDealt); tot.dmg1 += sum(1, (h) => h.damageDealt);
}
console.log(tot);
