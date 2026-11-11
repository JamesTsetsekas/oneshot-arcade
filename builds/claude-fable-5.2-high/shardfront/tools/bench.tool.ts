// tools: reproducible headless simulation benchmark. 220-unit and 400-unit battles, reporting ms per tick.
//   npm run bench
import { it } from 'vitest';
import { DEF_INDEX } from '../src/data/defs';
import { Sim } from '../src/sim/sim';

function battle(units: number): { mean: number; p99: number; max: number; alive: number } {
  const s = new Sim({ seed: 1, mode: 'skirmish', players: [{ faction: 'helix', controller: 'passive', difficulty: 'normal', name: 'A' }, { faction: 'chorus', controller: 'passive', difficulty: 'normal', name: 'B' }] });
  const h = ['bulwark', 'bulwark', 'lancer', 'mortar', 'mender', 'aegis'], c = ['thornling', 'thornling', 'sporecaster', 'carapace', 'stag', 'sage', 'crownbeast'];
  const a: number[] = [], b: number[] = [];
  for (let i = 0; i < units / 2; i++) {
    a.push(s.spawnUnitNear(DEF_INDEX[h[i % h.length]], 0, 30 + (i % 14) * 1.7, 78 + Math.floor(i / 14) * 1.7));
    b.push(s.spawnUnitNear(DEF_INDEX[c[i % c.length]], 1, 30 + (i % 14) * 1.7, 30 - Math.floor(i / 14) * 1.7 + 14));
  }
  s.step();
  s.applyCommand(0, { k: 'amove', ids: a, x: 40, z: 40 });
  s.applyCommand(1, { k: 'amove', ids: b, x: 40, z: 80 });
  const times: number[] = [];
  for (let i = 0; i < 20 * 40; i++) { const t0 = performance.now(); s.step(); times.push(performance.now() - t0); }
  times.sort((x, y) => x - y);
  return { mean: times.reduce((x, y) => x + y, 0) / times.length, p99: times[Math.floor(times.length * 0.99)], max: times[times.length - 1], alive: s.ids.filter((e) => s.alive[e] && s.owner[e] < 2 && s.d(e).cls === 'unit').length };
}

it('simulation benchmark', () => {
  for (const n of [220, 400]) {
    const r = battle(n);
    console.log(`${n} units, 40 s battle: mean ${r.mean.toFixed(3)} ms/tick, p99 ${r.p99.toFixed(3)} ms, max ${r.max.toFixed(2)} ms (budget 8 ms/frame), survivors ${r.alive}`);
  }
});
