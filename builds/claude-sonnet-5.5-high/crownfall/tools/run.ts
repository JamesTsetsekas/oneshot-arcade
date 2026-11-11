import { makeSim } from './headless';
{
  const seed = Number(process.env.SEED ?? 1);
  const minutes = Number(process.env.MIN ?? 30);
  const sim = makeSim(seed);
  const t0 = performance.now();
  let maxTick = 0;
  for (let i = 0; i < minutes * 60 * 30 && sim.winner < 0; i++) {
    const a = performance.now();
    sim.step();
    maxTick = Math.max(maxTick, performance.now() - a);
    if (i % (30 * 60) === 0) {
      const m = i / 1800;
      console.log(`min ${m} units=${sim.units.length} kills=${sim.teams.map((t) => t.kills)} towersDown=${sim.teams.map((t) => t.structuresLost)} gold=${sim.heroes.map((h) => Math.round(h.hero!.totalGold))} lvl=${sim.heroes.map((h) => h.hero!.level)}`);
    }
  }
  console.log('winner', sim.winner, 'time', (sim.time / 60).toFixed(1), 'min; wall', ((performance.now() - t0) / 1000).toFixed(1), 's; max tick ms', maxTick.toFixed(1));
  for (const h of sim.heroes) { const s = h.hero!; console.log(s.heroId, 'team', h.team, `K/D/A ${s.kills}/${s.deaths}/${s.assists} LH ${s.lastHits} lvl ${s.level} items ${s.items.map((i) => i?.id).join(',')}`); }
  console.log(sim.timeline.filter((e) => e.kind !== 'kill').map((e) => `${(e.t / 60).toFixed(1)} ${e.text}`).join('\n'));
}
