import { Sim } from '../src/sim/sim';
import { TD } from '../src/sim/ext';
const [f0, f1, d0, d1, minsArg] = process.argv.slice(2);
const sim = new Sim({ seed: Number(process.env.SEED||7), factions: [(f0 || 'helix') as any, (f1 || 'verdant') as any], ai: [d0 || 'normal', d1 || 'normal'], mode: 'skirmish' });
const mins = Number(minsArg || 15);
const t0 = performance.now();
let maxStep = 0;
for (let i = 0; i < mins * 60 * 20 && !sim.over; i++) {
  const s = performance.now();
  sim.step();
  sim.events.length = 0;
  maxStep = Math.max(maxStep, performance.now() - s);
  if (i % 1200 === 0) {
    const row = sim.players.map((p) => {
      let w = 0, a = 0, s2 = 0;
      for (const id of sim.ids) if (sim.alive[id] && sim.owner[id] === p.id) { const t = TD[sim.type[id]]; if (t.isWorker) w++; else if (t.isUnit) a++; else if (t.isStruct) s2++; }
      return `P${p.id}[${p.faction.id} ore${p.ore | 0} fx${p.flux | 0} sup${p.supplyUsed}/${p.supplyCap} w${w} a${a} b${s2} ${p.ai?.state}]`;
    });
    console.log((i / 1200).toFixed(0) + 'm', row.join(' '));
  }
}
console.log('over', sim.over, 'winner', sim.winner, 'tick', sim.tick, (sim.tick / 1200).toFixed(1) + 'm', 'wall', ((performance.now() - t0) / 1000).toFixed(1) + 's', 'maxStep', maxStep.toFixed(1) + 'ms');
for (const p of sim.players) console.log(p.id, p.faction.id, JSON.stringify({ ...p.stats, armySamples: undefined, econSamples: undefined, timeline: p.stats.timeline.slice(-12) }));
